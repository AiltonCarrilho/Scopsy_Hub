// ========================================
// KIWIFY-SERVICE.JS
// ========================================
// Serviço para processar webhooks da Kiwify
// - Log de todos os webhooks
// - Retry automático com backoff exponencial
// - Processamento seguro de eventos
//
// Referência: P0.3-kiwify-webhooks.md

const logger = require('../config/logger');
const { supabaseAdmin: supabase } = require('./supabase');
const { sendWelcomeEmail, sendCancellationEmail, generateTemporaryPassword } = require('./emailService');

// ========================================
// CONFIGURAÇÃO
// ========================================
const RETRY_CONFIG = {
  maxAttempts: 5,
  baseDelayMinutes: 1,
  // Backoff exponencial: 1min, 2min, 4min, 8min, 16min
  getNextRetryTime: (attemptCount) => {
    const delayMinutes = Math.pow(2, attemptCount - 1);
    return new Date(Date.now() + delayMinutes * 60 * 1000);
  }
};

// ========================================
// LOG WEBHOOK
// ========================================
/**
 * Registra webhook em webhook_logs para auditoria e retry
 * @param {Object} event - Payload do webhook
 * @param {string} signature - Assinatura HMAC-SHA256
 * @param {string} status - 'pending', 'success', 'failed'
 * @param {string|null} errorMessage - Mensagem de erro se falhou
 * @returns {Promise<Object>} Registro criado
 */
async function logWebhook(event, signature, status, errorMessage = null) {
  try {
    const eventType = event.event || event.webhook_event_type || 'unknown';
    const customerEmail = event.customer?.email || event.Customer?.email;
    const orderId = event.order_id || event.order?.order_id;
    const subscriptionId = event.subscription_id || event.subscription?.subscription_id;

    const { data, error } = await supabase
      .from('webhook_logs')
      .insert({
        event_type: eventType,
        payload: event,
        signature,
        signature_valid: true, // Já foi validada pelo middleware
        status,
        error_message: errorMessage,
        attempt_count: 1,
        next_retry_at: status === 'failed' ? RETRY_CONFIG.getNextRetryTime(1) : null,
        customer_email: customerEmail,
        order_id: orderId,
        subscription_id: subscriptionId,
        processed_at: status === 'success' ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (error) {
      logger.error('[KIWIFY-LOG] Erro ao registrar webhook', {
        error: error.message,
        eventType
      });
      return null;
    }

    logger.debug('[KIWIFY-LOG] Webhook registrado', {
      logId: data.id,
      eventType,
      status
    });

    return data;

  } catch (err) {
    logger.error('[KIWIFY-LOG] Exceção ao registrar webhook', {
      error: err.message
    });
    return null;
  }
}

// ========================================
// ATUALIZAR STATUS DO LOG
// ========================================
/**
 * Atualiza status de um webhook log após processamento
 * @param {number} logId - ID do webhook_logs
 * @param {string} newStatus - 'success', 'failed', 'retrying'
 * @param {string|null} errorMessage - Mensagem se falhou
 * @param {number} attemptCount - Número de tentativa
 */
async function updateWebhookLog(logId, newStatus, errorMessage = null, attemptCount = null) {
  try {
    const update = {
      status: newStatus,
      error_message: errorMessage,
      updated_at: new Date().toISOString()
    };

    // Se processado com sucesso
    if (newStatus === 'success') {
      update.processed_at = new Date().toISOString();
    }

    // Se falhou, agendar próxima retry
    if (newStatus === 'failed' && attemptCount && attemptCount < RETRY_CONFIG.maxAttempts) {
      update.next_retry_at = RETRY_CONFIG.getNextRetryTime(attemptCount + 1);
      update.status = 'retrying'; // Será retentado depois
    }

    if (attemptCount !== null) {
      update.attempt_count = attemptCount;
    }

    const { error } = await supabase
      .from('webhook_logs')
      .update(update)
      .eq('id', logId);

    if (error) {
      logger.error('[KIWIFY-LOG-UPDATE] Erro ao atualizar log', {
        error: error.message,
        logId
      });
    }

  } catch (err) {
    logger.error('[KIWIFY-LOG-UPDATE] Exceção', {
      error: err.message
    });
  }
}

// ========================================
// EVENT HANDLERS
// ========================================

/**
 * Processa: order.approved → Ativar Premium
 */
async function handleOrderApproved(event) {
  const customerEmail = event.customer?.email || event.Customer?.email;
  const customerName = event.customer?.name || event.Customer?.name || event.Customer?.full_name;
  const orderId = event.order_id || event.order?.order_id;
  const subscriptionId = event.subscription_id || event.subscription?.subscription_id;

  logger.info('[KIWIFY-EVENT] Processando order.approved', {
    email: customerEmail,
    order_id: orderId
  });

  // Buscar usuário
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('id, email, plan')
    .eq('email', customerEmail)
    .single();

  if (fetchError || !user) {
    logger.info('[KIWIFY-EVENT] Usuário não encontrado - criando novo', {
      email: customerEmail
    });

    // Gerar senha temporária
    const temporaryPassword = generateTemporaryPassword();
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Criar novo usuário
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
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Erro ao criar usuário: ${insertError.message}`);
    }

    logger.info('[KIWIFY-EVENT] Novo usuário criado com sucesso', {
      userId: newUser.id,
      email: customerEmail
    });

    // Enviar email de boas-vindas
    try {
      await sendWelcomeEmail(newUser, temporaryPassword);
    } catch (emailErr) {
      logger.warn('[KIWIFY-EVENT] Erro ao enviar email', {
        error: emailErr.message,
        userId: newUser.id
      });
    }

    return;
  }

  // Atualizar usuário existente
  const { error: updateError } = await supabase
    .from('users')
    .update({
      plan: 'premium',
      subscription_status: 'active',
      kiwify_customer_id: orderId,
      kiwify_subscription_id: subscriptionId,
      subscription_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (updateError) {
    throw new Error(`Erro ao atualizar usuário: ${updateError.message}`);
  }

  logger.info('[KIWIFY-EVENT] Usuário atualizado para Premium', {
    userId: user.id,
    email: user.email
  });
}

/**
 * Processa: subscription.canceled → Downgrade para Free
 */
async function handleSubscriptionCanceled(event) {
  const subscriptionId = event.subscription_id || event.subscription?.subscription_id;

  logger.info('[KIWIFY-EVENT] Processando subscription.canceled', {
    subscription_id: subscriptionId
  });

  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('id, email')
    .eq('kiwify_subscription_id', subscriptionId)
    .single();

  if (fetchError || !user) {
    logger.warn('[KIWIFY-EVENT] Usuário não encontrado para cancelamento', {
      subscription_id: subscriptionId
    });
    return; // Não é erro, webhook pode chegar antes do registro
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
    throw new Error(`Erro ao fazer downgrade: ${updateError.message}`);
  }

  logger.info('[KIWIFY-EVENT] Assinatura cancelada - downgrade para Free', {
    userId: user.id,
    email: user.email
  });

  // Enviar email de cancelamento
  try {
    await sendCancellationEmail(user);
  } catch (emailErr) {
    logger.warn('[KIWIFY-EVENT] Erro ao enviar email de cancelamento', {
      error: emailErr.message
    });
  }
}

/**
 * Processa: subscription.renewed → Manter Premium ativo
 */
async function handleSubscriptionRenewed(event) {
  const subscriptionId = event.subscription_id || event.subscription?.subscription_id;
  const nextBillingDate = event.next_billing_date || event.subscription?.next_billing_date;

  logger.info('[KIWIFY-EVENT] Processando subscription.renewed', {
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
    throw new Error(`Erro ao renovar assinatura: ${error.message}`);
  }

  logger.info('[KIWIFY-EVENT] Assinatura renovada - Premium mantido ativo', {
    subscription_id: subscriptionId
  });
}

/**
 * Processa: order.refunded → Downgrade para Free
 */
async function handleOrderRefunded(event) {
  const orderId = event.order_id || event.order?.order_id;

  logger.info('[KIWIFY-EVENT] Processando order.refunded', {
    order_id: orderId
  });

  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('id, email')
    .eq('kiwify_customer_id', orderId)
    .single();

  if (fetchError || !user) {
    logger.warn('[KIWIFY-EVENT] Usuário não encontrado para reembolso', {
      order_id: orderId
    });
    return;
  }

  // Downgrade para Free
  const { error: updateError } = await supabase
    .from('users')
    .update({
      plan: 'free',
      subscription_status: 'refunded',
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (updateError) {
    throw new Error(`Erro ao processar reembolso: ${updateError.message}`);
  }

  logger.info('[KIWIFY-EVENT] Reembolso processado - downgrade para Free', {
    userId: user.id,
    email: user.email
  });
}

// ========================================
// ROTEADOR PRINCIPAL
// ========================================
/**
 * Processa webhook da Kiwify
 * - Valida assinatura (feito pelo middleware)
 * - Registra em webhook_logs
 * - Processa evento assincronamente
 * - Retorna 200 OK imediatamente
 */
async function processKiwifyEvent(event, signature) {
  const eventType = event.event || event.webhook_event_type || 'unknown';

  logger.info('[KIWIFY-PROCESS] Iniciando processamento', {
    eventType,
    customerEmail: event.customer?.email || event.Customer?.email
  });

  // Registrar webhook em database
  const logRecord = await logWebhook(event, signature, 'pending');

  try {
    // Processar baseado no tipo de evento
    switch (eventType) {
    case 'order.approved':
    case 'order_approved':
    case 'purchase_approved':
      await handleOrderApproved(event);
      break;

    case 'subscription.canceled':
    case 'subscription_canceled':
    case 'subscription_cancelled':
      await handleSubscriptionCanceled(event);
      break;

    case 'subscription.renewed':
    case 'subscription_renewed':
      await handleSubscriptionRenewed(event);
      break;

    case 'order.refunded':
    case 'order_refunded':
    case 'refund':
      await handleOrderRefunded(event);
      break;

    case 'subscription_overdue':
      await handleSubscriptionCanceled(event); // Mesmo tratamento
      break;

    // Eventos informativos (só log)
    case 'billet_created':
    case 'pix_generated':
    case 'cart_abandoned':
    case 'purchase_refused':
      logger.info('[KIWIFY-PROCESS] Evento informativo', { eventType });
      if (logRecord) {
        await updateWebhookLog(logRecord.id, 'success');
      }
      return;

    default:
      logger.warn('[KIWIFY-PROCESS] Tipo de evento desconhecido', { eventType });
      if (logRecord) {
        await updateWebhookLog(logRecord.id, 'success');
      }
      return;
    }

    // Sucesso!
    if (logRecord) {
      await updateWebhookLog(logRecord.id, 'success');
    }

    logger.info('[KIWIFY-PROCESS] ✅ Webhook processado com sucesso', {
      eventType,
      logId: logRecord?.id
    });

  } catch (error) {
    // Erro ao processar
    const errorMessage = error.message || 'Erro desconhecido';

    logger.error('[KIWIFY-PROCESS] ❌ Erro ao processar webhook', {
      eventType,
      error: errorMessage,
      logId: logRecord?.id
    });

    // Marcar para retry
    if (logRecord) {
      await updateWebhookLog(logRecord.id, 'failed', errorMessage, 1);
    }

    // Ainda retornamos sucesso no HTTP (para Kiwify não ficar retentando)
    // O retry será feito por nosso sistema
    throw error;
  }
}

// ========================================
// EXPORTS
// ========================================
module.exports = {
  processKiwifyEvent,
  logWebhook,
  updateWebhookLog,
  handleOrderApproved,
  handleSubscriptionCanceled,
  handleSubscriptionRenewed,
  handleOrderRefunded
};
