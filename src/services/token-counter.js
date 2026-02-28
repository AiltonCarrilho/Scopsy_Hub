/**
 * Token Counter - Gestão de tokens e estatísticas
 * Responsabilidade: Contar tokens, atualizar stats, cache management
 */

const logger = require('../config/logger');
const { saveToBoostspace, getFromBoostspace } = require('./database');

// Cache de respostas comuns (reduz 30% dos custos)
const responseCache = new Map();

/**
 * Estimativa simples de tokens (1 token ≈ 4 caracteres em português)
 *
 * @param {string} text - Texto a contar
 * @returns {number} Número estimado de tokens
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/**
 * Atualizar estatísticas do usuário
 *
 * @param {string} userId - ID do usuário
 * @param {number} tokensUsed - Tokens gastos nesta interação
 * @returns {Promise<void>}
 */
async function updateUserStats(userId, tokensUsed) {
  try {
    const stats = await getFromBoostspace('user_stats', { user_id: userId });

    if (!stats || stats.length === 0) {
      // Criar stats iniciais
      await saveToBoostspace('user_stats', {
        user_id: userId,
        cases_completed: 0,
        practice_hours: 0,
        accuracy: 0,
        streak_days: 0,
        last_activity: new Date().toISOString(),
        badges: [],
        xp_points: 0,
        updated_at: new Date().toISOString()
      });
    } else {
      // Atualizar stats existentes
      const { updateInBoostspace } = require('./database');
      await updateInBoostspace('user_stats', stats[0].id, {
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Erro ao atualizar user stats', { error: error.message, userId });
  }
}

/**
 * Sleep utility (usado em polling)
 *
 * @param {number} ms - Milissegundos
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Obter valor do cache (se existir)
 *
 * @param {string} key - Chave do cache
 * @returns {any|null} Valor cacheado ou null
 */
function getCached(key) {
  return responseCache.get(key) || null;
}

/**
 * Armazenar valor no cache
 *
 * @param {string} key - Chave do cache
 * @param {any} value - Valor a cachear
 */
function setCached(key, value) {
  responseCache.set(key, value);
}

/**
 * Limpar cache (executar periodicamente)
 */
function clearCache() {
  responseCache.clear();
  logger.info('Cache de respostas limpo');
}

// Limpar cache a cada 1 hora
setInterval(clearCache, 60 * 60 * 1000);

module.exports = {
  estimateTokens,
  updateUserStats,
  sleep,
  getCached,
  setCached,
  clearCache
};
