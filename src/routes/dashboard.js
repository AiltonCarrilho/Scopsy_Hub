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

    // Buscar user_stats para badges e streak
    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') { // PGRST116 = not found
      logger.error('Erro ao buscar user_stats', { error: statsError.message });
    }

    // --- CÁLCULO DAS MÉTRICAS ESPECÍFICAS ---

    // 1. Raciocínio Clínico = Desafios Clínicos ('case') + Conceituação ('case_conceptualization')
    // Soma de CASOS (total_cases)
    const raciocinioData = progressData?.filter(p => 
      p.assistant_type === 'case' || p.assistant_type === 'case_conceptualization'
    ) || [];
    const raciocinioTotal = raciocinioData.reduce((sum, p) => sum + (p.total_cases || 0), 0);

    // 2. Radar Diagnóstico = 'diagnostic'
    // Soma de CASOS (total_cases)
    const radarData = progressData?.find(p => p.assistant_type === 'diagnostic');
    const radarTotal = radarData?.total_cases || 0;

    // 3. Jornada Terapêutica = 'journey'
    // Soma de COGNITS (cognits) - +25 cognits por sessão completada
    const jornadaData = progressData?.find(p => p.assistant_type === 'journey');
    const jornadaPontos = jornadaData?.cognits || 0; // ✅ Mudança: xp_points → cognits

    // Outros dados (badges)
    const badges = statsData?.badges || [];
    
    // Retornar JSON estrutura para o frontend
    res.json({
      raciocinio_clinico: raciocinioTotal,
      radar_diagnostico: radarTotal,
      jornada_terapeutica: jornadaPontos,
      badges: badges.length, // Retornando contagem de badges
      badges_list: badges
    });

  } catch (error) {
    logger.error('Erro ao buscar stats', { error: error.message });
    res.json({
      raciocinio_clinico: 0,
      radar_diagnostico: 0,
      jornada_terapeutica: 0,
      badges: 0,
      badges_list: []
    });
  }
});

module.exports = router;