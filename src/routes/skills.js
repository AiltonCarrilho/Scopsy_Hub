const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const logger = require('../config/logger');
const { authenticateRequest } = require('../middleware/auth');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================
// 1️⃣ LISTAR TODAS AS HABILIDADES
// ============================================
router.get('/list', async (req, res) => {
  try {
    const { module } = req.query;

    logger.debug('\n[Skills] 📋 Listando habilidades:', { module });

    let query = supabase
      .from('skills')
      .select('*')
      .order('module, order_in_module');

    if (module) {
      query = query.eq('module', module);
    }

    const { data: skills, error } = await query;

    if (error) {
      throw error;
    }

    // Agrupar por módulo
    const grouped = skills.reduce((acc, skill) => {
      if (!acc[skill.module]) {
        acc[skill.module] = [];
      }
      acc[skill.module].push(skill);
      return acc;
    }, {});

    logger.debug(`[Skills] ✅ ${skills.length} habilidades encontradas`);

    res.json({
      success: true,
      skills: skills,
      skills_by_module: grouped,
      total: skills.length
    });

  } catch (error) {
    console.error('[Skills] ❌ Erro ao listar:', error);
    logger.error('Erro ao listar skills', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 2️⃣ OBTER HABILIDADE ESPECÍFICA
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    logger.debug(`\n[Skills] 🔍 Buscando skill: ${id}`);

    const { data: skill, error } = await supabase
      .from('skills')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    logger.debug(`[Skills] ✅ Skill encontrada: ${skill.name}`);

    res.json({
      success: true,
      skill: skill
    });

  } catch (error) {
    console.error('[Skills] ❌ Erro ao buscar skill:', error);
    logger.error('Erro ao buscar skill', { error: error.message, id: req.params.id });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 3️⃣ OBTER PROGRESSO DO USUÁRIO EM TODAS AS HABILIDADES
// ============================================
router.get('/user/:user_id/progress', authenticateRequest, async (req, res) => {
  try {
    const user_id = req.user.userId;

    logger.debug(`\n[Skills] 📊 Progresso do usuário: ${user_id}`);

    // Buscar progresso do usuário
    const { data: progress, error: progressError } = await supabase
      .from('user_skill_progress')
      .select(`
        *,
        skill:skills(*)
      `)
      .eq('user_id', user_id)
      .order('skill_id');

    if (progressError) {
      throw progressError;
    }

    // Buscar todas as skills para incluir as não iniciadas
    const { data: allSkills, error: skillsError } = await supabase
      .from('skills')
      .select('*')
      .order('module, order_in_module');

    if (skillsError) {
      throw skillsError;
    }

    // Combinar: skills praticadas + não praticadas
    const completeProgress = allSkills.map(skill => {
      const userProgress = progress.find(p => p.skill_id === skill.id);
      return userProgress || {
        skill_id: skill.id,
        skill: skill,
        times_practiced: 0,
        avg_performance: 0,
        mastery_level: 'novice',
        last_practiced_at: null
      };
    });

    // Agrupar por módulo
    const byModule = completeProgress.reduce((acc, item) => {
      const module = item.skill.module;
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(item);
      return acc;
    }, {});

    // Calcular estatísticas
    const practiced = progress.filter(p => p.times_practiced > 0);
    const mostPracticed = [...practiced]
      .sort((a, b) => b.times_practiced - a.times_practiced)
      .slice(0, 3);

    const needsWork = practiced
      .filter(p => p.avg_performance < 0.6)
      .sort((a, b) => a.avg_performance - b.avg_performance)
      .slice(0, 3);

    const masteryDistribution = {
      novice: completeProgress.filter(p => p.mastery_level === 'novice').length,
      developing: completeProgress.filter(p => p.mastery_level === 'developing').length,
      competent: completeProgress.filter(p => p.mastery_level === 'competent').length,
      proficient: completeProgress.filter(p => p.mastery_level === 'proficient').length,
      expert: completeProgress.filter(p => p.mastery_level === 'expert').length
    };

    logger.debug(`[Skills] ✅ Progresso calculado: ${practiced.length}/15 habilidades praticadas`);

    res.json({
      success: true,
      progress: completeProgress,
      progress_by_module: byModule,
      insights: {
        total_skills: allSkills.length,
        practiced_skills: practiced.length,
        most_practiced: mostPracticed,
        needs_improvement: needsWork,
        mastery_distribution: masteryDistribution
      }
    });

  } catch (error) {
    console.error('[Skills] ❌ Erro ao buscar progresso:', error);
    logger.error('Erro ao buscar progresso de skills', {
      error: error.message,
      user_id: req.params.user_id
    });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 4️⃣ ATUALIZAR PROGRESSO EM UMA HABILIDADE
// ============================================
router.post('/user/:user_id/progress/:skill_id', authenticateRequest, async (req, res) => {
  try {
    const user_id = req.user.userId;
    const { skill_id } = req.params;
    const { performance } = req.body; // 0.0 a 1.0

    logger.debug(`\n[Skills] 📝 Atualizando progresso: User ${user_id}, Skill ${skill_id}`);
    logger.debug(`   Performance: ${(performance * 100).toFixed(0)}%`);

    // Verificar se já existe registro
    const { data: existing } = await supabase
      .from('user_skill_progress')
      .select('*')
      .eq('user_id', user_id)
      .eq('skill_id', skill_id)
      .maybeSingle();

    let newAvgPerformance;
    let newTimesPracticed;
    let newMasteryLevel;

    if (existing) {
      // Atualizar existente
      newTimesPracticed = existing.times_practiced + 1;
      newAvgPerformance = (
        (existing.avg_performance * existing.times_practiced + performance) /
        newTimesPracticed
      );

      // Calcular novo nível de maestria
      newMasteryLevel = calculateMasteryLevel(newAvgPerformance, newTimesPracticed);

      const { data: updated, error } = await supabase
        .from('user_skill_progress')
        .update({
          times_practiced: newTimesPracticed,
          avg_performance: newAvgPerformance,
          mastery_level: newMasteryLevel,
          last_practiced_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.debug(`[Skills] ✅ Progresso atualizado: ${newTimesPracticed}x, média ${(newAvgPerformance * 100).toFixed(0)}%, ${newMasteryLevel}`);

      res.json({
        success: true,
        progress: updated,
        message: 'Progresso atualizado'
      });

    } else {
      // Criar novo registro
      newTimesPracticed = 1;
      newAvgPerformance = performance;
      newMasteryLevel = calculateMasteryLevel(newAvgPerformance, newTimesPracticed);

      const { data: created, error } = await supabase
        .from('user_skill_progress')
        .insert({
          user_id: parseInt(user_id),
          skill_id: parseInt(skill_id),
          times_practiced: newTimesPracticed,
          avg_performance: newAvgPerformance,
          mastery_level: newMasteryLevel,
          last_practiced_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.debug(`[Skills] ✅ Primeiro registro criado: ${(newAvgPerformance * 100).toFixed(0)}%, ${newMasteryLevel}`);

      res.json({
        success: true,
        progress: created,
        message: 'Progresso iniciado'
      });
    }

  } catch (error) {
    console.error('[Skills] ❌ Erro ao atualizar progresso:', error);
    logger.error('Erro ao atualizar progresso de skill', {
      error: error.message,
      user_id: req.params.user_id,
      skill_id: req.params.skill_id
    });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// HELPER: Calcular nível de maestria
// ============================================
function calculateMasteryLevel(avgPerformance, timesPracticed) {
  // Critérios:
  // Novice: < 3 práticas ou < 50% performance
  // Developing: 3-5 práticas e 50-69% performance
  // Competent: 6-9 práticas e 70-79% performance
  // Proficient: 10+ práticas e 80-89% performance
  // Expert: 10+ práticas e 90%+ performance

  if (timesPracticed < 3 || avgPerformance < 0.5) {
    return 'novice';
  }

  if (timesPracticed < 6 || avgPerformance < 0.7) {
    return 'developing';
  }

  if (timesPracticed < 10 || avgPerformance < 0.8) {
    return 'competent';
  }

  if (avgPerformance < 0.9) {
    return 'proficient';
  }

  return 'expert';
}

module.exports = router;
