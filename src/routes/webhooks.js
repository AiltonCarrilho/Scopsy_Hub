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
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const logger = require('../config/logger');

// ========================================
// SUPABASE CLIENT
// ========================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Usa service role para bypass RLS
);

// ========================================
// VALIDACAO DE ASSINATURA KIWIFY
// ========================================
/**
 * Valida se webhook veio realmente da Kiwify
 * @param {Object} payload - Corpo da requisicao
 * @param {string} signature - Header X-Kiwify-Signature
 * @param {string} secret - Webhook secret da Kiwify
 * @returns {boolean}
 */
function validateKiwifySignature(payload, signature, secret) {
  if (!signature || !secret) {
    logger.warn('[WEBHOOK] Assinatura ou secret ausente');
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const isValid = `sha256=${expectedSignature}` === signature;

    if (!isValid) {
      logger.warn('[WEBHOOK] Assinatura invalida', {
        received: signature,
        expected: `sha256=${expectedSignature}`
      });
    }

    return isValid;
  } catch (error) {
    logger.error('[WEBHOOK] Erro ao validar assinatura', { error: error.message });
    return false;
  }
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
router.post('/kiwify', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // 1. Parse do body (vem como Buffer no express.raw)
    const rawBody = req.body;
    const bodyString = rawBody.toString('utf8');
    const event = JSON.parse(bodyString);

    logger.info('[WEBHOOK] Kiwify recebido', {
      event: event.event || event.webhook_event_type,
      order_id: event.order_id,
      customer_email: event.customer?.email || event.Customer?.email
    });

    // 2. Validar assinatura (seguranca!)
    const signature = req.headers['x-kiwify-signature'];
    const isValid = validateKiwifySignature(event, signature, process.env.KIWIFY_WEBHOOK_SECRET);

    if (!isValid) {
      logger.error('[WEBHOOK] Rejeitado: assinatura invalida');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 3. Processar evento baseado no tipo
    const eventType = event.event || event.webhook_event_type;

    switch (eventType) {
      case 'order.approved':
      case 'order_approved':
        await handleOrderApproved(event);
        break;

      case 'subscription.canceled':
      case 'subscription_canceled':
        await handleSubscriptionCanceled(event);
        break;

      case 'subscription.renewed':
      case 'subscription_renewed':
        await handleSubscriptionRenewed(event);
        break;

      case 'order.refunded':
      case 'order_refunded':
        await handleOrderRefunded(event);
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

    // CRIAR USUARIO automaticamente se nao existe
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: customerEmail,
        name: customerName || customerEmail.split('@')[0],
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

  // TODO: Enviar email de boas-vindas Premium
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

  // TODO: Enviar email de cancelamento
}

/**
 * Assinatura renovada -> Manter Premium ativo
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

  logger.info('[WEBHOOK] Assinatura renovada', {
    subscription_id: subscriptionId
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

  // TODO: Enviar email de confirmacao de reembolso
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
