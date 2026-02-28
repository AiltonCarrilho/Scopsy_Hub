/**
 * ICC Service - Índice de Confiança Clínica
 * Métrica proprietária Scopsy: acurácia + consistência + variedade + complexidade
 */
const { supabase } = require('./database');
const logger = require('../config/logger');

/**
 * Recalcula o ICC chamando a função SQL recalculate_icc()
 * @param {number} userId
 * @returns {Object|null} { icc_score, icc_acuracia, icc_consistencia, icc_variedade, icc_complexidade }
 */
async function recalculateICC(userId) {
  try {
    const { error } = await supabase.rpc('recalculate_icc', {
      p_user_id: userId
    });

    if (error) {
      logger.error('Erro ao recalcular ICC', { error: error.message, userId });
      return null;
    }

    const { data: user } = await supabase
      .from('users')
      .select('icc_score, icc_acuracia, icc_consistencia, icc_variedade, icc_complexidade')
      .eq('id', userId)
      .single();

    logger.info('ICC recalculado', { userId, icc: user?.icc_score });
    return user;
  } catch (err) {
    logger.error('Erro ICC service', { error: err.message, userId });
    return null;
  }
}

/**
 * Retorna a faixa do ICC para exibição na UI
 */
function getICCTier(iccScore) {
  if (iccScore >= 86) {
    return { tier: 6, label: 'Mestre', color: '#DC2626' };
  }
  if (iccScore >= 71) {
    return { tier: 5, label: 'Especialista', color: '#D97706' };
  }
  if (iccScore >= 51) {
    return { tier: 4, label: 'Clínico Confiante', color: '#7C3AED' };
  }
  if (iccScore >= 31) {
    return { tier: 3, label: 'Praticante', color: '#2563EB' };
  }
  if (iccScore >= 16) {
    return { tier: 2, label: 'Aprendiz', color: '#059669' };
  }
  return { tier: 1, label: 'Iniciante', color: '#6B7280' };
}

module.exports = { recalculateICC, getICCTier };
