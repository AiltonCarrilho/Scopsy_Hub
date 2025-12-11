/**
 * Dashboard Routes
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateRequest } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/dashboard/stats
 * Retorna estatísticas reais do usuário
 */
router.get('/stats', authenticateRequest, async (req, res) => {
  try {
    const userId = req.user.userId;

    logger.info('Buscando stats do dashboard', { userId });

    // Buscar progresso agregado de todos os assistentes
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId);

    if (progressError) {
      logger.error('Erro ao buscar user_progress', { error: progressError.message });
    }

    // Buscar user_stats
    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') { // PGRST116 = not found
      logger.error('Erro ao buscar user_stats', { error: statsError.message });
    }

    // Calcular totais agregados
    const totalCases = progressData?.reduce((sum, p) => sum + (p.total_cases || 0), 0) || 0;
    const totalCorrect = progressData?.reduce((sum, p) => sum + (p.correct_diagnoses || 0), 0) || 0;
    const totalXP = progressData?.reduce((sum, p) => sum + (p.xp_points || 0), 0) || 0;

    // Calcular accuracy global
    const accuracy = totalCases > 0 ? Math.round((totalCorrect / totalCases) * 100) : 0;

    // Calcular practice hours (aproximado: 10 min por caso)
    const practiceHours = Math.round((totalCases * 10) / 60 * 10) / 10; // arredondar 1 casa

    // Calcular streak (dias consecutivos)
    let streakDays = 0;
    if (progressData && progressData.length > 0) {
      // Pegar última atividade
      const lastActivity = progressData[0]?.last_activity_date;
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (lastActivity === today || lastActivity === yesterday) {
        streakDays = statsData?.streak_days || 1;
      }
    }

    res.json({
      cases_completed: totalCases,
      practice_hours: practiceHours,
      accuracy: accuracy,
      streak_days: streakDays,
      xp_points: totalXP,
      badges: statsData?.badges || [],
      last_activity: statsData?.last_activity || null
    });

  } catch (error) {
    logger.error('Erro ao buscar stats', { error: error.message });

    // Fallback: retornar zeros se erro
    res.json({
      cases_completed: 0,
      practice_hours: 0,
      accuracy: 0,
      streak_days: 0,
      xp_points: 0,
      badges: [],
      last_activity: null
    });
  }
});

module.exports = router;