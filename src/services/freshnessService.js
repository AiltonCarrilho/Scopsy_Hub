/**
 * FRESHNESS SERVICE
 * Gerencia o sistema de "Frescor Clínico"
 * Multiplicador baseado em frequência de prática
 */

const { supabase } = require('../services/supabase');
const logger = require('../config/logger');

/**
 * Calcula o multiplicador de frescor baseado na última atividade
 * @param {number} userId - ID do usuário
 * @returns {Promise<number>} - Multiplicador (0.40 a 1.00)
 */
async function calculateFreshness(userId) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('last_practice_date, freshness_multiplier')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    // Se nunca praticou, retorna 100%
    if (!user.last_practice_date) {
      return 1.00;
    }

    const today = new Date();
    const lastPractice = new Date(user.last_practice_date);
    const daysSinceLastPractice = Math.floor((today - lastPractice) / (1000 * 60 * 60 * 24));

    let newMultiplier;

    // Lógica de decaimento
    if (daysSinceLastPractice <= 3) {
      newMultiplier = 1.00; // 100% - Verde
    } else if (daysSinceLastPractice <= 7) {
      newMultiplier = 0.80; // 80% - Amarelo
    } else if (daysSinceLastPractice <= 14) {
      newMultiplier = 0.60; // 60% - Laranja
    } else {
      newMultiplier = 0.40; // 40% - Vermelho
    }

    // Atualizar no banco se mudou
    if (newMultiplier !== user.freshness_multiplier) {
      await supabase
        .from('users')
        .update({ freshness_multiplier: newMultiplier })
        .eq('id', userId);

      logger.info(`Frescor atualizado para user ${userId}: ${newMultiplier}`);
    }

    return newMultiplier;

  } catch (error) {
    logger.error('Erro ao calcular frescor:', error);
    return 1.00; // Fallback: não penalizar em caso de erro
  }
}

/**
 * Atualiza a data de última prática e recupera frescor gradualmente
 * @param {number} userId - ID do usuário
 * @returns {Promise<number>} - Novo multiplicador
 */
async function updateLastPractice(userId) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('last_practice_date, freshness_multiplier')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const currentMultiplier = user.freshness_multiplier || 1.00;

    // Se já praticou hoje, não muda nada
    if (user.last_practice_date === today) {
      return currentMultiplier;
    }

    // Recuperação gradual: +5% por dia até 100%
    const newMultiplier = Math.min(currentMultiplier + 0.05, 1.00);

    await supabase
      .from('users')
      .update({
        last_practice_date: today,
        freshness_multiplier: newMultiplier
      })
      .eq('id', userId);

    logger.info(`Prática registrada para user ${userId}. Frescor: ${newMultiplier}`);

    return newMultiplier;

  } catch (error) {
    logger.error('Erro ao atualizar última prática:', error);
    return 1.00;
  }
}

/**
 * Retorna o status visual do frescor
 * @param {number} multiplier - Multiplicador atual
 * @returns {object} - { status, color, message }
 */
function getFreshnessStatus(multiplier) {
  if (multiplier >= 1.00) {
    return {
      status: 'excellent',
      color: '#10B981', // Verde
      emoji: '🔥',
      message: 'Vigor Máximo!',
      description: 'Continue praticando para manter 100% dos cognits'
    };
  } else if (multiplier >= 0.80) {
    return {
      status: 'good',
      color: '#F59E0B', // Amarelo
      emoji: '⚠️',
      message: 'Vigor Caindo',
      description: `Você está ganhando ${(multiplier * 100).toFixed(0)}% dos cognits. Pratique hoje para recuperar!`
    };
  } else if (multiplier >= 0.60) {
    return {
      status: 'warning',
      color: '#F97316', // Laranja
      emoji: '🔶',
      message: 'Vigor Baixo',
      description: `Apenas ${(multiplier * 100).toFixed(0)}% dos cognits. Volte a praticar para recuperar!`
    };
  } else {
    return {
      status: 'critical',
      color: '#EF4444', // Vermelho
      emoji: '🔴',
      message: 'Vigor Crítico',
      description: `Você está ganhando apenas ${(multiplier * 100).toFixed(0)}% dos cognits. Hora de voltar!`
    };
  }
}

/**
 * Aplica o multiplicador de frescor aos cognits ganhos
 * @param {number} userId - ID do usuário
 * @param {number} baseCognits - Cognits base (antes do multiplicador)
 * @returns {Promise<number>} - Cognits finais (com multiplicador aplicado)
 */
async function applyFreshnessMultiplier(userId, baseCognits) {
  try {
    // Atualizar última prática (isso já recupera +5% se aplicável)
    const multiplier = await updateLastPractice(userId);

    // Aplicar multiplicador
    const finalCognits = Math.round(baseCognits * multiplier);

    logger.info(`Cognits com frescor - User ${userId}: ${baseCognits} × ${multiplier} = ${finalCognits}`);

    return finalCognits;

  } catch (error) {
    logger.error('Erro ao aplicar multiplicador de frescor:', error);
    return baseCognits; // Fallback: retornar valor original
  }
}

module.exports = {
  calculateFreshness,
  updateLastPractice,
  getFreshnessStatus,
  applyFreshnessMultiplier
};
