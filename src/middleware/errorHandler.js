/**
 * Error Handler Middleware
 */

const logger = require('../config/logger');

function errorHandler(err, req, res, next) {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      ...(process.env.NODE_ENV !== 'production' && { details: err.message })
    });
  }

  // Erro de autenticação
  if (err.name === 'UnauthorizedError' || err.message.includes('token')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token inválido ou expirado'
    });
  }

  // Erro genérico
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = { errorHandler };