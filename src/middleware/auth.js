/**
 * Auth Middleware
 */

const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * Verificar token JWT
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Token inválido');
  }
}

/**
 * Gerar token JWT
 */
function generateToken(userId, plan = 'free', email = '') {
  return jwt.sign(
    { userId, plan, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

/**
 * Gerar refresh token
 */
function generateRefreshToken(userId) {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

/**
 * Middleware de autenticação para rotas HTTP
 */
function authenticateRequest(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    req.user = {
      userId: decoded.userId,
      plan: decoded.plan
    };
    
    next();
  } catch (error) {
    logger.error('Auth error', { error: error.message });
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

module.exports = {
  verifyToken,
  generateToken,
  generateRefreshToken,
  authenticateRequest
};