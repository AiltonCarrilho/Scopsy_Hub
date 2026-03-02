/**
 * Dashboard Routes
 */

const express = require('express');
const { authenticateRequest } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

const { supabase } = require('../services/supabase'); // RLS-aware anon client

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

    // Buscar user_stats para badges e streak
    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') { // PGRST116 = not found
      logger.error('Erro ao buscar user_stats', { error: statsError.message });
    }

    // --- CÁLCULO DAS MÉTRICAS DOS 4 MÓDULOS ---

    // 1. Desafios Clínicos = 'case'
    const desafiosData = progressData?.find(p => p.assistant_type === 'case');
    const desafiosCasos = desafiosData?.total_cases || 0;
    const desafiosXP = desafiosData?.xp_points || 0;

    // 2. Conceituação Cognitiva = 'case_conceptualization'
    const conceituacaoData = progressData?.find(p => p.assistant_type === 'case_conceptualization');
    const conceituacaoCasos = conceituacaoData?.total_cases || 0;
    const conceituacaoXP = conceituacaoData?.xp_points || 0;

    // 3. Radar Diagnóstico = 'diagnostic'
    const radarData = progressData?.find(p => p.assistant_type === 'diagnostic');
    const radarCasos = radarData?.total_cases || 0;
    const radarXP = radarData?.xp_points || 0;

    // 4. Jornada Terapêutica = 'journey'
    const jornadaData = progressData?.find(p => p.assistant_type === 'journey');
    const jornadaSessoes = jornadaData?.total_sessions || 0;
    const jornadaXP = jornadaData?.xp_points || 0;

    // Badges
    const badges = statsData?.badges || [];

    // Retornar JSON com 4 módulos separados
    res.json({
      desafios_clinicos: {
        total_cases: desafiosCasos,
        xp_points: desafiosXP
      },
      conceituacao_cognitiva: {
        total_cases: conceituacaoCasos,
        xp_points: conceituacaoXP
      },
      radar_diagnostico: {
        total_cases: radarCasos,
        xp_points: radarXP
      },
      jornada_terapeutica: {
        total_sessions: jornadaSessoes,
        xp_points: jornadaXP
      },
      badges: badges.length,
      badges_list: badges
    });

  } catch (error) {
    logger.error('Erro ao buscar stats', { error: error.message });
    res.json({
      desafios_clinicos: { total_cases: 0, xp_points: 0 },
      conceituacao_cognitiva: { total_cases: 0, xp_points: 0 },
      radar_diagnostico: { total_cases: 0, xp_points: 0 },
      jornada_terapeutica: { total_sessions: 0, xp_points: 0 },
      badges: 0,
      badges_list: []
    });
  }
});

module.exports = router;