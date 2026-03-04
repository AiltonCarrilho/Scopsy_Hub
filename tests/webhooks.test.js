// ========================================
// WEBHOOKS.TEST.JS
// ========================================
// Testes para webhooks da Kiwify
// Valida: segurança, handlers, retry logic
//
// Rodar: npm test -- webhooks.test.js

const crypto = require('crypto');
const request = require('supertest');
const logger = require('../src/config/logger');

// Mock express app para testes
let app;

describe('Kiwify Webhooks (P0.3)', () => {
  // ========================================
  // SETUP
  // ========================================

  beforeAll(() => {
    // Configurar app express mínimo
    const express = require('express');
    app = express();

    // Middleware necessário
    app.use(express.json());

    // Importar router de webhooks
    const webhooksRouter = require('../src/routes/webhooks');
    app.use('/webhooks', webhooksRouter);

    // Mock de env vars
    process.env.KIWIFY_WEBHOOK_SECRET = 'test-secret-key-12345';
  });

  afterAll(() => {
    delete process.env.KIWIFY_WEBHOOK_SECRET;
  });

  // ========================================
  // 1. TESTES DE AUTENTICAÇÃO (HMAC-SHA256)
  // ========================================

  describe('HMAC-SHA256 Signature Validation', () => {
    /**
     * Helper: Gera assinatura HMAC válida
     */
    function generateValidSignature(payload) {
      const secret = process.env.KIWIFY_WEBHOOK_SECRET;
      const bodyString = JSON.stringify(payload);
      return crypto
        .createHmac('sha256', secret)
        .update(bodyString)
        .digest('hex');
    }

    test('✅ Aceita webhook com assinatura válida', async () => {
      const payload = {
        event: 'order.approved',
        order_id: 'order_123',
        customer: {
          email: 'user@example.com',
          name: 'Test User'
        }
      };

      const signature = generateValidSignature(payload);

      const response = await request(app)
        .post('/webhooks/kiwify')
        .set('x-kiwify-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    test('❌ Rejeita webhook com assinatura inválida', async () => {
      const payload = {
        event: 'order.approved',
        order_id: 'order_123',
        customer: { email: 'user@example.com' }
      };

      const response = await request(app)
        .post('/webhooks/kiwify')
        .set('x-kiwify-signature', 'invalid_signature_xyz')
        .send(payload);

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    test('❌ Rejeita webhook sem header de assinatura', async () => {
      const payload = {
        event: 'order.approved',
        order_id: 'order_123',
        customer: { email: 'user@example.com' }
      };

      const response = await request(app)
        .post('/webhooks/kiwify')
        .send(payload);

      expect(response.status).toBe(401);
    });

    test('❌ Rejeita se KIWIFY_WEBHOOK_SECRET não configurado', async () => {
      delete process.env.KIWIFY_WEBHOOK_SECRET;

      const payload = { event: 'order.approved' };
      const signature = 'any_signature';

      const response = await request(app)
        .post('/webhooks/kiwify')
        .set('x-kiwify-signature', signature)
        .send(payload);

      expect(response.status).toBe(503);
      expect(response.body.error).toContain('não configurado');

      // Restaurar secret
      process.env.KIWIFY_WEBHOOK_SECRET = 'test-secret-key-12345';
    });
  });

  // ========================================
  // 2. TESTES DE EVENTOS
  // ========================================

  describe('Event Handling', () => {
    function generateValidSignature(payload) {
      const secret = process.env.KIWIFY_WEBHOOK_SECRET;
      const bodyString = JSON.stringify(payload);
      return crypto
        .createHmac('sha256', secret)
        .update(bodyString)
        .digest('hex');
    }

    test('✅ Processa event: order.approved', async () => {
      const payload = {
        event: 'order.approved',
        order_id: 'order_456',
        subscription_id: 'sub_123',
        customer: {
          email: 'newuser@example.com',
          name: 'New User'
        }
      };

      const signature = generateValidSignature(payload);

      const response = await request(app)
        .post('/webhooks/kiwify')
        .set('x-kiwify-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    test('✅ Processa event: subscription.canceled', async () => {
      const payload = {
        event: 'subscription.canceled',
        subscription_id: 'sub_123'
      };

      const signature = generateValidSignature(payload);

      const response = await request(app)
        .post('/webhooks/kiwify')
        .set('x-kiwify-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
    });

    test('✅ Processa event: subscription.renewed', async () => {
      const payload = {
        event: 'subscription.renewed',
        subscription_id: 'sub_123',
        next_billing_date: '2026-04-03'
      };

      const signature = generateValidSignature(payload);

      const response = await request(app)
        .post('/webhooks/kiwify')
        .set('x-kiwify-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
    });

    test('✅ Processa event: order.refunded', async () => {
      const payload = {
        event: 'order.refunded',
        order_id: 'order_456'
      };

      const signature = generateValidSignature(payload);

      const response = await request(app)
        .post('/webhooks/kiwify')
        .set('x-kiwify-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
    });

    test('✅ Ignora eventos informativos silenciosamente', async () => {
      const payload = {
        event: 'pix_generated',
        order_id: 'order_789'
      };

      const signature = generateValidSignature(payload);

      const response = await request(app)
        .post('/webhooks/kiwify')
        .set('x-kiwify-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      // Não deve errar, apenas logar
    });

    test('✅ Retorna 200 OK para eventos desconhecidos', async () => {
      const payload = {
        event: 'unknown.event.type',
        data: 'some data'
      };

      const signature = generateValidSignature(payload);

      const response = await request(app)
        .post('/webhooks/kiwify')
        .set('x-kiwify-signature', signature)
        .send(payload);

      // Importante: sempre retornar 200 para Kiwify não ficar retentando
      expect(response.status).toBe(200);
    });
  });

  // ========================================
  // 3. TESTES DE COMPORTAMENTO
  // ========================================

  describe('Response Behavior', () => {
    function generateValidSignature(payload) {
      const secret = process.env.KIWIFY_WEBHOOK_SECRET;
      const bodyString = JSON.stringify(payload);
      return crypto
        .createHmac('sha256', secret)
        .update(bodyString)
        .digest('hex');
    }

    test('✅ Retorna 200 OK imediatamente (async processing)', async () => {
      const payload = {
        event: 'order.approved',
        order_id: 'order_999',
        customer: { email: 'user@test.com' }
      };

      const signature = generateValidSignature(payload);
      const startTime = Date.now();

      const response = await request(app)
        .post('/webhooks/kiwify')
        .set('x-kiwify-signature', signature)
        .send(payload);

      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
      expect(response.body.timestamp).toBeDefined();
      // Resposta deve ser muito rápida (< 100ms)
      expect(duration).toBeLessThan(100);
    });

    test('✅ Retorna JSON válido', async () => {
      const payload = { event: 'order.approved' };
      const signature = generateValidSignature(payload);

      const response = await request(app)
        .post('/webhooks/kiwify')
        .set('x-kiwify-signature', signature)
        .send(payload);

      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.body).toHaveProperty('received');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  // ========================================
  // 4. TESTES DE HEALTH CHECK
  // ========================================

  describe('Health Check Endpoint', () => {
    test('✅ GET /webhooks/kiwify/health retorna status', async () => {
      const response = await request(app)
        .get('/webhooks/kiwify/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body.webhook).toBe('kiwify');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.env).toBeDefined();
    });

    test('✅ Health check mostra se secret está configurado', async () => {
      const response = await request(app)
        .get('/webhooks/kiwify/health');

      expect(response.body.env.hasWebhookSecret).toBe(true);
    });
  });

  // ========================================
  // 5. TESTES DE EDGE CASES
  // ========================================

  describe('Edge Cases', () => {
    function generateValidSignature(payload) {
      const secret = process.env.KIWIFY_WEBHOOK_SECRET;
      const bodyString = JSON.stringify(payload);
      return crypto
        .createHmac('sha256', secret)
        .update(bodyString)
        .digest('hex');
    }

    test('✅ Aceita payload com campos extras', async () => {
      const payload = {
        event: 'order.approved',
        order_id: 'order_123',
        customer: { email: 'user@example.com' },
        extra_field: 'extra_value',
        nested: { data: 'here' }
      };

      const signature = generateValidSignature(payload);

      const response = await request(app)
        .post('/webhooks/kiwify')
        .set('x-kiwify-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
    });

    test('✅ Aceita variações de nomes de eventos', async () => {
      const variants = [
        'order.approved',
        'order_approved',
        'purchase_approved'
      ];

      for (const event of variants) {
        const payload = { event };
        const signature = generateValidSignature(payload);

        const response = await request(app)
          .post('/webhooks/kiwify')
          .set('x-kiwify-signature', signature)
          .send(payload);

        expect(response.status).toBe(200);
      }
    });

    test('✅ Aceita payload com campos ausentes', async () => {
      const payload = {
        event: 'order.approved',
        order_id: 'order_123'
        // customer ausente - deve ser tolerado
      };

      const signature = generateValidSignature(payload);

      const response = await request(app)
        .post('/webhooks/kiwify')
        .set('x-kiwify-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
    });

    test('✅ Rejeita payload JSON inválido', async () => {
      const response = await request(app)
        .post('/webhooks/kiwify')
        .set('x-kiwify-signature', 'any_signature')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      // Express.json() vai rejeitar antes do middleware
      expect(response.status).toBe(400);
    });
  });

  // ========================================
  // 6. TESTES DE TIMING SAFETY
  // ========================================

  describe('Timing-Safe Comparison', () => {
    test('✅ Leva mesmo tempo válido ou inválido (timing attack prevention)', async () => {
      const payload = { event: 'order.approved' };
      const validSignature = crypto
        .createHmac('sha256', process.env.KIWIFY_WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

      // Testar com assinatura inválida
      const invalidSignature = 'a'.repeat(validSignature.length);

      const startValid = Date.now();
      await request(app)
        .post('/webhooks/kiwify')
        .set('x-kiwify-signature', validSignature)
        .send(payload);
      const durationValid = Date.now() - startValid;

      const startInvalid = Date.now();
      await request(app)
        .post('/webhooks/kiwify')
        .set('x-kiwify-signature', invalidSignature)
        .send(payload);
      const durationInvalid = Date.now() - startInvalid;

      // Tempos devem ser similares (±50ms tolerance due to system variance)
      expect(Math.abs(durationValid - durationInvalid)).toBeLessThan(50);
    });
  });
});

// ========================================
// SUITE: KIWIFY SERVICE UNIT TESTS
// ========================================

describe('Kiwify Service (kiwify-service.js)', () => {
  const kiwifyService = require('../src/services/kiwify-service');

  describe('Event Processing', () => {
    test('✅ Exporta função processKiwifyEvent', () => {
      expect(typeof kiwifyService.processKiwifyEvent).toBe('function');
    });

    test('✅ Exporta funções de handler', () => {
      expect(typeof kiwifyService.handleOrderApproved).toBe('function');
      expect(typeof kiwifyService.handleSubscriptionCanceled).toBe('function');
      expect(typeof kiwifyService.handleSubscriptionRenewed).toBe('function');
      expect(typeof kiwifyService.handleOrderRefunded).toBe('function');
    });

    test('✅ Exporta funções de logging', () => {
      expect(typeof kiwifyService.logWebhook).toBe('function');
      expect(typeof kiwifyService.updateWebhookLog).toBe('function');
    });
  });
});

// ========================================
// SUITE: MIDDLEWARE TESTS
// ========================================

describe('Kiwify Auth Middleware (kiwify-auth.js)', () => {
  const { kiwifyAuth } = require('../src/middleware/kiwify-auth');

  test('✅ Middleware é função', () => {
    expect(typeof kiwifyAuth).toBe('function');
  });

  test('✅ Middleware tem 3 parâmetros (req, res, next)', () => {
    expect(kiwifyAuth.length).toBe(3);
  });
});
