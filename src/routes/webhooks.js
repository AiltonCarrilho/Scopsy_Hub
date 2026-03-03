// ========================================
// WEBHOOKS.JS - Kiwify Integration (Refatorado)
// ========================================
// Recebe notificações da Kiwify sobre pagamentos,
// cancelamentos, renovações e reembolsos
//
// ARQUITETURA:
// ├─ kiwifyAuth middleware → Valida HMAC-SHA256
// ├─ kiwifyService → Processa eventos (event handlers + retry)
// └─ Este arquivo → Thin endpoint (apenas roteamento)

const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const { kiwifyAuth } = require('../middleware/kiwify-auth');
const { processKiwifyEvent } = require('../services/kiwify-service');

// ========================================
// WEBHOOK ENDPOINT - POST /webhooks/kiwify
// ========================================
/**
 * POST /api/webhooks/kiwify
 *
 * Flow:
 * 1. kiwifyAuth middleware valida HMAC-SHA256
 * 2. Return 200 OK imediatamente (não quer retry da Kiwify)
 * 3. processKiwifyEvent executa async (fire-and-forget)
 *
 * Eventos suportados:
 * - order.approved → Ativar Premium
 * - subscription.canceled → Downgrade Free
 * - subscription.renewed → Manter ativo
 * - order.refunded → Downgrade Free
 * - subscription_overdue → Downgrade Free
 */
router.post('/kiwify', kiwifyAuth, express.json(), (req, res) => {
  // ========================================
  // RETORNAR 200 OK IMEDIATAMENTE
  // ========================================
  // Kiwify retries se não receber 200 OK em <30s
  // Processamos async para não bloquear
  res.status(200).json({
    received: true,
    timestamp: new Date().toISOString()
  });

  // ========================================
  // PROCESSAR WEBHOOK ASYNC (fire-and-forget)
  // ========================================
  // Não await - deixa rodar em background
  // Se falhar, kiwify-service.js loga e agenda retry
  const event = req.body;
  const signature = req.headers['x-kiwify-signature'];

  processKiwifyEvent(event, signature).catch(err => {
    logger.error('[WEBHOOK] Erro ao processar evento async', {
      error: err.message,
      event_type: event?.event || event?.webhook_event_type
    });
    // Erro já foi logado em webhook_logs pela processKiwifyEvent
  });
});

// ========================================
// HEALTH CHECK - GET /webhooks/kiwify/health
// ========================================
/**
 * Health check para verificar que webhook está ativo
 * Não requer autenticação (público)
 */
router.get('/kiwify/health', (req, res) => {
  res.json({
    status: 'OK',
    webhook: 'kiwify',
    timestamp: new Date().toISOString(),
    env: {
      hasWebhookSecret: !!process.env.KIWIFY_WEBHOOK_SECRET,
      architecture: 'kiwifyAuth middleware + kiwifyService layer'
    }
  });
});

module.exports = router;
