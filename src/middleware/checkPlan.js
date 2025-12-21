/**
 * Plan Verification Middleware
 * Valida se o usuário tem o plano necessário para acessar features premium
 */

const logger = require('../config/logger');

/**
 * Middleware: Requer plano Premium
 * Bloqueia acesso se usuário não for Premium ou Pro
 */
function requirePremium(req, res, next) {
  try {
    const plan = req.user?.plan;

    // Log tentativa de acesso
    logger.info('Premium feature access attempt', {
      userId: req.user?.userId,
      plan,
      endpoint: req.originalUrl
    });

    // Validar plano
    if (plan !== 'premium' && plan !== 'pro') {
      logger.warn('Premium access denied', {
        userId: req.user?.userId,
        plan,
        endpoint: req.originalUrl
      });

      return res.status(403).json({
        success: false,
        error: 'Funcionalidade Premium',
        message: 'Assine Premium para acessar esta funcionalidade',
        upgrade_url: '/pricing'
      });
    }

    // Usuário tem permissão
    next();
  } catch (error) {
    logger.error('Plan check error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar plano'
    });
  }
}

/**
 * Middleware: Requer plano Pro ou superior
 */
function requirePro(req, res, next) {
  try {
    const plan = req.user?.plan;

    if (plan !== 'pro' && plan !== 'premium') {
      logger.warn('Pro access denied', {
        userId: req.user?.userId,
        plan,
        endpoint: req.originalUrl
      });

      return res.status(403).json({
        success: false,
        error: 'Funcionalidade Pro',
        message: 'Assine Pro ou Premium para acessar',
        upgrade_url: '/pricing'
      });
    }

    next();
  } catch (error) {
    logger.error('Plan check error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar plano'
    });
  }
}

/**
 * Middleware: Bloquear usuários Free (apenas Trial/Premium+)
 */
function blockFree(req, res, next) {
  try {
    const plan = req.user?.plan;

    if (plan === 'free') {
      logger.warn('Free access denied', {
        userId: req.user?.userId,
        endpoint: req.originalUrl
      });

      return res.status(403).json({
        success: false,
        error: 'Trial expirado',
        message: 'Seu período de teste expirou. Assine para continuar.',
        upgrade_url: '/pricing'
      });
    }

    next();
  } catch (error) {
    logger.error('Plan check error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar plano'
    });
  }
}

/**
 * Helper: Verificar se usuário é premium (não middleware)
 */
function isPremiumUser(user) {
  return user?.plan === 'premium' || user?.plan === 'pro';
}

/**
 * Helper: Verificar se usuário é free
 */
function isFreeUser(user) {
  return !user?.plan || user?.plan === 'free';
}

module.exports = {
  requirePremium,
  requirePro,
  blockFree,
  isPremiumUser,
  isFreeUser
};
