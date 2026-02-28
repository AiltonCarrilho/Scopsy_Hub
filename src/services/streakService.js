/**
 * Streak Service
 * Gerencia a lógica de sequência de dias consecutivos (Streaks)
 */
const { getFromBoostspace, updateInBoostspace } = require('./database');
const logger = require('../config/logger');

// Mapa de timezone para garantir consistência (Brasil)
const TIMEZONE = 'America/Sao_Paulo';

/**
 * Obtém a data atual no formato YYYY-MM-DD
 */
function getTodayDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE }); // YYYY-MM-DD
}

/**
 * Calcula a diferença em dias entre duas datas (strings YYYY-MM-DD)
 */
function getDaysDifference(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Verifica e atualiza o streak do usuário
 * @param {string} userId - ID do usuário
 * @param {string} activityType - Tipo de atividade (login, challenge, diagnostic, conceptualization)
 */
async function checkAndUpdateStreak(userId, _activityType = 'login') {
  try {
    // 1. Buscar usuário
    const users = await getFromBoostspace('users', { id: userId });
    if (!users || users.length === 0) {
      return null;
    }

    const user = users[0];
    const today = getTodayDate();

    // Se last_activity_at não existe, é o primeiro dia
    // Se for timestamp, converter para data YYYY-MM-DD
    let lastActivityDate = null;

    if (user.last_activity_at) {
      lastActivityDate = new Date(user.last_activity_at).toLocaleDateString('en-CA', { timeZone: TIMEZONE });
    }

    // Se já fez atividade hoje, não precisa atualizar streak (mas atualiza timestamp)
    if (lastActivityDate === today) {
      logger.info('🔥 Streak: Atividade já registrada hoje', { userId, today });
      return {
        current_streak: user.current_streak || 0,
        streak_updated: false
      };
    }

    let currentStreak = user.current_streak || 0;
    let maxStreak = user.max_streak || 0;
    let streakUpdated = false;
    let streakBroken = false;

    if (!lastActivityDate) {
      // Primeira vez que registra
      currentStreak = 1;
      streakUpdated = true;
    } else {
      const diffDays = getDaysDifference(lastActivityDate, today);

      if (diffDays === 1) {
        // Sequência mantida! (Ontem -> Hoje)
        currentStreak++;
        streakUpdated = true;
      } else if (diffDays > 1) {
        // Quebrou a sequência
        currentStreak = 1; // Reinicia contando hoje
        streakBroken = true;
        streakUpdated = true;
      }
      // Se diffDays === 0 já tratamos acima
    }

    // Atualizar recorde
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }

    // Salvar atualização apenas se mudou algo
    if (streakUpdated || !lastActivityDate) {
      const updateData = {
        current_streak: currentStreak,
        max_streak: maxStreak,
        last_activity_at: new Date().toISOString()
      };

      await updateInBoostspace('users', userId, updateData);

      logger.info('🔥 Streak Atualizado', {
        userId,
        oldStreak: user.current_streak,
        newStreak: currentStreak,
        broken: streakBroken
      });

      return {
        current_streak: currentStreak,
        max_streak: maxStreak,
        streak_updated: true,
        streak_broken: streakBroken,
        days_gained: streakUpdated ? 1 : 0
      };
    }

    return { current_streak: currentStreak, streak_updated: false };

  } catch (error) {
    logger.error('❌ Erro ao atualizar streak', { error: error.message, userId });
    // Não lança erro para não quebrar o fluxo principal
    return null;
  }
}

/**
 * Obtém dados de streak do usuário
 */
async function getUserStreak(userId) {
  try {
    const users = await getFromBoostspace('users', { id: userId });
    if (!users || users.length === 0) {
      return { current_streak: 0, max_streak: 0 };
    }

    const user = users[0];
    const today = getTodayDate();
    let lastActivityDate = null;

    if (user.last_activity_at) {
      lastActivityDate = new Date(user.last_activity_at).toLocaleDateString('en-CA', { timeZone: TIMEZONE });
    }

    // Verificar se streak está "em risco" (ontem foi último dia, hoje ainda não fez)
    // Se última atividade foi anteontem ou antes, streak já é visualmente 0 (ou será resetado na próxima ação)
    let displayStreak = user.current_streak || 0;

    if (lastActivityDate) {
      const diffDays = getDaysDifference(lastActivityDate, today);
      if (diffDays > 1) {
        // Visualmente já quebrou, embora no banco só atualize na próxima ação
        displayStreak = 0;
      }
    } else {
      displayStreak = 0;
    }

    return {
      current_streak: displayStreak,
      max_streak: user.max_streak || 0,
      last_activity_date: lastActivityDate,
      today
    };

  } catch (error) {
    logger.error('❌ Erro ao obter streak', { error: error.message, userId });
    return { current_streak: 0, max_streak: 0 };
  }
}

module.exports = {
  checkAndUpdateStreak,
  getUserStreak
};
