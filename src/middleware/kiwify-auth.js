// ========================================
// KIWIFY-AUTH.JS
// ========================================
// Middleware para validar webhooks da Kiwify
// Verifica assinatura HMAC-SHA256
//
// Uso:
// router.post('/webhooks/kiwify', kiwifyAuth, handleKiwifyWebhook);

const crypto = require('crypto');
const logger = require('../config/logger');

/**
 * Valida assinatura HMAC-SHA256 de webhook Kiwify
 *
 * A Kiwify envia:
 * - Header: x-kiwify-signature (assinatura hex)
 * - Body: JSON payload
 *
 * Verificamos com: HMAC-SHA256(payload, KIWIFY_WEBHOOK_SECRET)
 *
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @param {Express.NextFunction} next
 */
function kiwifyAuth(req, res, next) {
  try {
    // ========================================
    // 1. VALIDAR VARIÁVEIS DE AMBIENTE
    // ========================================
    const webhookSecret = process.env.KIWIFY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error('[KIWIFY-AUTH] KIWIFY_WEBHOOK_SECRET não configurado — endpoint bloqueado');
      return res.status(503).json({
        error: 'Webhook não configurado no servidor',
        hint: 'Contate o administrador'
      });
    }

    // ========================================
    // 2. EXTRAIR ASSINATURA DO HEADER
    // ========================================
    // Kiwify envia em header 'x-kiwify-signature'
    const receivedSignature = req.headers['x-kiwify-signature'];

    if (!receivedSignature) {
      logger.warn('[KIWIFY-AUTH] Assinatura ausente', {
        method: req.method,
        path: req.path,
        headers: Object.keys(req.headers)
      });
      return res.status(401).json({
        error: 'Assinatura ausente',
        hint: 'Header x-kiwify-signature é obrigatório'
      });
    }

    // ========================================
    // 3. CALCULAR ASSINATURA ESPERADA
    // ========================================
    // Pegamos o body como string (antes de express.json() parse)
    // Se express.json() já fez parse, reconstruímos de req.body
    let bodyString;

    if (req.rawBody) {
      // Melhor opção: raw body preservado
      bodyString = req.rawBody.toString();
    } else if (typeof req.body === 'string') {
      bodyString = req.body;
    } else {
      // Fallback: serializar JSON (menos confiável)
      bodyString = JSON.stringify(req.body);
    }

    // Calcular HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyString)
      .digest('hex');

    // ========================================
    // 4. COMPARAR ASSINATURAS (timing-safe)
    // ========================================
    // Usar timingSafeEqual para prevenir timing attacks
    // Duas strings diferentes sempre levam mesmo tempo
    let isValid = false;

    try {
      const receivedBuffer = Buffer.from(receivedSignature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      // timingSafeEqual lança erro se tamanhos diferentes
      isValid = crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
    } catch (err) {
      // Tamanhos diferentes ou erro no decode = invalid
      isValid = false;
    }

    // ========================================
    // 5. LOGAR RESULTADO (seguro)
    // ========================================
    if (isValid) {
      logger.info('[KIWIFY-AUTH] ✅ Assinatura válida', {
        event_type: req.body?.event || req.body?.webhook_event_type,
        customer_email: req.body?.customer?.email || req.body?.Customer?.email
      });

      // Passar para próximo middleware
      // Adicionar flag ao request para uso posterior
      req.kiwifyVerified = true;
      return next();
    } else {
      logger.warn('[KIWIFY-AUTH] ❌ Assinatura inválida', {
        received: receivedSignature.substring(0, 16) + '...',
        expected: expectedSignature.substring(0, 16) + '...',
        bodyLength: bodyString.length,
        event: req.body?.event || req.body?.webhook_event_type
      });

      return res.status(401).json({
        error: 'Assinatura inválida',
        hint: 'Webhook pode estar sendo falsificado'
      });
    }

  } catch (error) {
    logger.error('[KIWIFY-AUTH] Erro ao validar assinatura', {
      error: error.message,
      stack: error.stack
    });

    // SEGURANÇA: Mesmo com erro interno, retornar 401 (não expor detalhes)
    return res.status(401).json({
      error: 'Erro ao validar assinatura'
    });
  }
}

/**
 * Middleware auxiliar para capturar raw body
 * Deve ser usado ANTES de express.json()
 *
 * Exemplo de uso em server.js:
 * app.use(express.raw({ type: 'application/json' }));
 * app.use(captureRawBody);
 * app.use(express.json());
 *
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @param {Express.NextFunction} next
 */
function captureRawBody(req, res, next) {
  if (req.is('application/json')) {
    let data = '';
    req.setEncoding('utf8');

    req.on('data', chunk => {
      data += chunk;
    });

    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  } else {
    next();
  }
}

// ========================================
// EXPORTS
// ========================================
module.exports = {
  kiwifyAuth,
  captureRawBody
};
