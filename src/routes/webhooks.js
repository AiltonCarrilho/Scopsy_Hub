// ========================================
// WEBHOOKS.JS - Kiwify Integration
// ========================================
// Recebe notificacoes da Kiwify sobre pagamentos,
// cancelamentos, renovacoes e reembolsos

// 🔒 Usar .env.local apenas em desenvolvimento
// Em produção, usar variáveis de ambiente do sistema (Render)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.local' });
}
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const logger = require('../config/logger');
const { sendWelcomeEmail, sendCancellationEmail, generateTemporaryPassword } = require('../services/emailService');

// ========================================
// SUPABASE CLIENT
// ========================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Usa service role para bypass RLS
);

// ========================================
// VALIDACAO DE TOKEN KIWIFY
// ========================================
/**
 * Valida se webhook veio realmente da Kiwify
 * Kiwify envia campo "token" no body do evento
 * @param {string} receivedToken - Token recebido no body
 * @param {string} expectedToken - Token configurado em KIWIFY_WEBHOOK_SECRET
 * @returns {boolean}
 */
function validateKiwifyToken(receivedToken, expectedToken) {
  if (!receivedToken || !expectedToken) {
    return false;
  }
  return receivedToken === expectedToken;
}

// ========================================
// WEBHOOK ENDPOINT
// ========================================
/**
 * POST /api/webhooks/kiwify
 *
 * Eventos suportados:
 * - order.approved -> Ativar Premium
 * - subscription.canceled -> Downgrade Free
 * - subscription.renewed -> Manter ativo
 * - order.refunded -> Downgrade Free
 */
router.post('/kiwify', express.json(), async (req, res) => {
  try {
    // 1. Parse do body (já vem como objeto com express.json)
    const event = req.body;

    logger.info('[WEBHOOK] Kiwify recebido', {
      event: event.event || event.webhook_event_type,
      order_id: event.order_id,
      customer_email: event.customer?.email || event.Customer?.email
    });

    // 2. Validar token Kiwify (enviado no body do evento)
    // Validação obrigatória — sem secret configurado, endpoint fica bloqueado
    if (!process.env.KIWIFY_WEBHOOK_SECRET) {
      logger.error('[WEBHOOK] KIWIFY_WEBHOOK_SECRET não configurado — endpoint bloqueado');
      return res.status(503).json({ error: 'Webhook não configurado' });
    }
    if (!validateKiwifyToken(event.token, process.env.KIWIFY_WEBHOOK_SECRET)) {
      logger.error('[WEBHOOK] Rejeitado: token invalido');
      return res.status(401).json({ error: 'Invalid token' });
    }
    logger.info('[WEBHOOK] Token validado com sucesso');

    // 3. Processar evento baseado no tipo
    const eventType = event.event || event.webhook_event_type;

    switch (eventType) {
    // Compra aprovada - Ativar premium
    case 'order.approved':
    case 'order_approved':
    case 'purchase_approved': // Kiwify pode usar este nome
      await handleOrderApproved(event);
      break;

      // Assinatura cancelada - Downgrade para free
    case 'subscription.canceled':
    case 'subscription_canceled':
    case 'subscription_cancelled': // Variação PT-BR
      await handleSubscriptionCanceled(event);
      break;

      // Assinatura renovada - Manter premium
    case 'subscription.renewed':
    case 'subscription_renewed':
      await handleSubscriptionRenewed(event);
      break;

      // Reembolso - Downgrade para free
    case 'order.refunded':
    case 'order_refunded':
    case 'refund':
      await handleOrderRefunded(event);
      break;

      // Chargeback - Downgrade para free
    case 'chargeback':
      await handleOrderRefunded(event); // Mesmo tratamento que reembolso
      logger.info('[WEBHOOK] Chargeback processado como reembolso');
      break;

      // Assinatura atrasada - downgrade para free
    case 'subscription_overdue':
      await handleSubscriptionOverdue(event);
      break;

      // Eventos que apenas logamos (não precisam ação)
    case 'billet_created': // Boleto gerado
    case 'pix_generated': // Pix gerado
    case 'cart_abandoned': // Carrinho abandonado
    case 'purchase_refused': // Compra recusada
      logger.info('[WEBHOOK] Evento informativo recebido', { event: eventType });
      break;

    default:
      logger.warn('[WEBHOOK] Evento desconhecido', { event: eventType });
    }

    // 4. Sempre retornar 200 OK para Kiwify
    res.status(200).json({ success: true, received: true });

  } catch (error) {
    logger.error('[WEBHOOK] Erro ao processar', {
      error: error.message,
      stack: error.stack
    });

    // Mesmo com erro, retorna 200 para evitar retry infinito
    res.status(200).json({ success: false, error: error.message });
  }
});

// ========================================
// HANDLERS DE EVENTOS
// ========================================

/**
 * Pagamento aprovado -> Ativar Premium
 */
async function handleOrderApproved(event) {
  const customerEmail = event.customer?.email || event.Customer?.email;
  const customerName = event.customer?.name || event.Customer?.name || event.Customer?.full_name;
  const orderId = event.order_id || event.order?.order_id;
  const subscriptionId = event.subscription_id || event.subscription?.subscription_id;

  logger.info('[WEBHOOK] Processando order.approved', {
    email: customerEmail,
    order_id: orderId
  });

  // Buscar usuario por email
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('email', customerEmail)
    .single();

  if (fetchError || !user) {
    logger.warn('[WEBHOOK] Usuario nao encontrado - criando novo', {
      email: customerEmail
    });

    // Gerar senha temporária
    const temporaryPassword = generateTemporaryPassword();
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // CRIAR USUARIO automaticamente se nao existe
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: customerEmail,
        name: customerName || customerEmail.split('@')[0],
        password_hash: hashedPassword,
        plan: 'premium',
        subscription_status: 'active',
        kiwify_customer_id: orderId,
        kiwify_subscription_id: subscriptionId,
        subscription_started_at: new Date().toISOString(),
        trial_ends_at: null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      logger.error('[WEBHOOK] Erro ao criar usuario', {
        error: insertError.message,
        email: customerEmail
      });
      return;
    }

    logger.info('[WEBHOOK] Novo usuario criado', {
      userId: newUser.id,
      email: customerEmail
    });

    // Enviar email de boas-vindas com credenciais
    await sendWelcomeEmail(newUser, temporaryPassword);

    return;
  }

  // ATUALIZAR usuario existente para Premium
  const { error: updateError } = await supabase
    .from('users')
    .update({
      plan: 'premium',
      subscription_status: 'active',
      kiwify_customer_id: orderId,
      kiwify_subscription_id: subscriptionId,
      subscription_started_at: new Date().toISOString(),
      trial_ends_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (updateError) {
    logger.error('[WEBHOOK] Erro ao atualizar usuario', {
      error: updateError.message,
      userId: user.id
    });
    return;
  }

  logger.info('[WEBHOOK] Usuario atualizado para Premium', {
    userId: user.id,
    email: user.email,
    plan: 'premium'
  });

  // Email notification would be sent here (future enhancement)
  // Consider adding welcome email flow when email service is fully integrated
}

/**
 * Assinatura cancelada -> Downgrade para Free
 */
async function handleSubscriptionCanceled(event) {
  const subscriptionId = event.subscription_id || event.subscription?.subscription_id;

  logger.info('[WEBHOOK] Processando subscription.canceled', {
    subscription_id: subscriptionId
  });

  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('kiwify_subscription_id', subscriptionId)
    .single();

  if (fetchError || !user) {
    logger.warn('[WEBHOOK] Usuario nao encontrado para cancelamento', {
      subscription_id: subscriptionId
    });
    return;
  }

  // Downgrade para Free
  const { error: updateError } = await supabase
    .from('users')
    .update({
      plan: 'free',
      subscription_status: 'canceled',
      subscription_ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (updateError) {
    logger.error('[WEBHOOK] Erro ao fazer downgrade', {
      error: updateError.message,
      userId: user.id
    });
    return;
  }

  logger.info('[WEBHOOK] Assinatura cancelada, downgrade para Free', {
    userId: user.id,
    email: user.email
  });

  // Enviar email de cancelamento
  await sendCancellationEmail(user);
}

/**
 * Assinatura renovada -> Restaurar Premium ativo
 */
async function handleSubscriptionRenewed(event) {
  const subscriptionId = event.subscription_id || event.subscription?.subscription_id;
  const nextBillingDate = event.next_billing_date || event.subscription?.next_billing_date;

  logger.info('[WEBHOOK] Processando subscription.renewed', {
    subscription_id: subscriptionId
  });

  const { error } = await supabase
    .from('users')
    .update({
      plan: 'premium',
      subscription_status: 'active',
      subscription_next_billing: nextBillingDate ? new Date(nextBillingDate).toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('kiwify_subscription_id', subscriptionId);

  if (error) {
    logger.error('[WEBHOOK] Erro ao renovar assinatura', {
      error: error.message,
      subscription_id: subscriptionId
    });
    return;
  }

  logger.info('[WEBHOOK] Assinatura renovada e plano restaurado para premium', {
    subscription_id: subscriptionId
  });
}

/**
 * Assinatura atrasada -> Downgrade para Free
 */
async function handleSubscriptionOverdue(event) {
  const subscriptionId = event.subscription_id || event.subscription?.subscription_id;

  logger.info('[WEBHOOK] Processando subscription_overdue', {
    subscription_id: subscriptionId
  });

  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('kiwify_subscription_id', subscriptionId)
    .single();

  if (fetchError || !user) {
    logger.warn('[WEBHOOK] Usuario nao encontrado para overdue', {
      subscription_id: subscriptionId
    });
    return;
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({
      plan: 'free',
      subscription_status: 'overdue',
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (updateError) {
    logger.error('[WEBHOOK] Erro ao fazer downgrade por atraso', {
      error: updateError.message,
      userId: user.id
    });
    return;
  }

  logger.info('[WEBHOOK] Assinatura atrasada, downgrade para Free', {
    userId: user.id,
    email: user.email
  });
}

/**
 * Reembolso -> Downgrade para Free
 */
async function handleOrderRefunded(event) {
  const orderId = event.order_id || event.order?.order_id;

  logger.info('[WEBHOOK] Processando order.refunded', {
    order_id: orderId
  });

  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('kiwify_customer_id', orderId)
    .single();

  if (fetchError || !user) {
    logger.warn('[WEBHOOK] Usuario nao encontrado para reembolso', {
      order_id: orderId
    });
    return;
  }

  // Mesma logica de cancelamento
  const { error: updateError } = await supabase
    .from('users')
    .update({
      plan: 'free',
      subscription_status: 'refunded',
      subscription_ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (updateError) {
    logger.error('[WEBHOOK] Erro ao processar reembolso', {
      error: updateError.message,
      userId: user.id
    });
    return;
  }

  logger.info('[WEBHOOK] Reembolso processado, downgrade para Free', {
    userId: user.id,
    email: user.email,
    order_id: orderId
  });

  // Email notification would be sent here (future enhancement)
  // Consider adding refund confirmation email when email service is fully integrated
}

// ========================================
// HEALTH CHECK DO WEBHOOK
// ========================================
router.get('/kiwify/health', (req, res) => {
  res.json({
    status: 'OK',
    webhook: 'kiwify',
    timestamp: new Date().toISOString(),
    env: {
      hasWebhookSecret: !!process.env.KIWIFY_WEBHOOK_SECRET,
      hasProductId: !!process.env.KIWIFY_PRODUCT_ID
    }
  });
});

module.exports = router;
