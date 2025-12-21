/**
 * Rate Limiting Middleware
 * Protege contra abuso de API e ataques DDoS
 */

const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

/**
 * Rate limiter geral para API
 * DESENVOLVIMENTO: 500 requisições por 15 minutos
 * PRODUÇÃO: 100 requisições por 15 minutos
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'development' ? 500 : 100, // Mais permissivo em dev
  message: {
    success: false,
    error: 'Muitas requisições',
    message: 'Você excedeu o limite de requisições. Tente novamente em 15 minutos.',
    retry_after: 15 * 60 // segundos
  },
  standardHeaders: true, // Retorna info no `RateLimit-*` headers
  legacyHeaders: false, // Desabilita `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      endpoint: req.originalUrl,
      user: req.user?.userId,
      environment: process.env.NODE_ENV
    });

    res.status(429).json({
      success: false,
      error: 'Muitas requisições',
      message: 'Você excedeu o limite de requisições. Tente novamente em 15 minutos.',
      retry_after: 15 * 60
    });
  }
});

/**
 * Rate limiter para rotas de OpenAI (CARAS!)
 * DESENVOLVIMENTO: 50 requisições por minuto (testes)
 * PRODUÇÃO: 5 requisições por minuto
 */
const openaiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: process.env.NODE_ENV === 'development' ? 50 : 5, // Mais permissivo em dev
  message: {
    success: false,
    error: 'Muitas requisições',
    message: 'Aguarde antes de gerar novo caso. Limite: 5 por minuto.',
    retry_after: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Conta mesmo se sucesso
  handler: (req, res) => {
    logger.warn('OpenAI rate limit exceeded', {
      ip: req.ip,
      endpoint: req.originalUrl,
      user: req.user?.userId,
      environment: process.env.NODE_ENV
    });

    res.status(429).json({
      success: false,
      error: 'Aguarde para gerar novo caso',
      message: 'Você está gerando casos muito rápido. Aguarde 1 minuto.',
      retry_after: 60
    });
  }
});

/**
 * Rate limiter para autenticação (login/signup)
 * 10 tentativas por 15 minutos por IP
 * Previne brute force
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 tentativas de login
  skipSuccessfulRequests: true, // Não conta logins bem-sucedidos
  message: {
    success: false,
    error: 'Muitas tentativas de login',
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    retry_after: 15 * 60
  },
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      endpoint: req.originalUrl,
      email: req.body?.email
    });

    res.status(429).json({
      success: false,
      error: 'Muitas tentativas de login',
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      retry_after: 15 * 60
    });
  }
});

/**
 * Rate limiter para webhooks (Kiwify, Flexifunnels)
 * 20 requisições por hora por IP
 */
const webhookLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20,
  message: {
    success: false,
    error: 'Muitas requisições de webhook',
    message: 'Aguarde antes de tentar novamente.',
    retry_after: 60 * 60
  },
  handler: (req, res) => {
    logger.warn('Webhook rate limit exceeded', {
      ip: req.ip,
      user: req.user?.userId
    });

    res.status(429).json({
      success: false,
      error: 'Muitas requisições de webhook',
      message: 'Aguarde antes de tentar novamente.',
      retry_after: 60 * 60
    });
  }
});

/**
 * Rate limiter customizado por plano do usuário
 * Free: 3 req/min | Basic: 10 req/min | Premium: 30 req/min
 */
function createPlanBasedLimiter(limits = { free: 3, basic: 10, premium: 30 }) {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: (req) => {
      const plan = req.user?.plan || 'free';
      return limits[plan] || limits.free;
    },
    keyGenerator: (req) => {
      // Usar userId ao invés de IP para usuários autenticados
      return req.user?.userId || req.ip;
    },
    handler: (req, res) => {
      const plan = req.user?.plan || 'free';
      logger.warn('Plan-based rate limit exceeded', {
        userId: req.user?.userId,
        plan,
        endpoint: req.originalUrl
      });

      res.status(429).json({
        success: false,
        error: 'Limite de plano atingido',
        message: `Limite de ${limits[plan] || limits.free} requisições/minuto atingido. Faça upgrade para aumentar.`,
        current_plan: plan,
        upgrade_url: '/pricing'
      });
    }
  });
}

module.exports = {
  apiLimiter,
  openaiLimiter,
  authLimiter,
  webhookLimiter,
  createPlanBasedLimiter
};
