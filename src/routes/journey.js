const express = require('express');
const logger = require('../config/logger');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authenticateRequest } = require('../middleware/auth');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================
// 1️⃣ LISTAR JORNADAS DISPONÍVEIS
// ============================================
router.get('/list', authenticateRequest, async (req, res) => {
  try {
    const { disorder_category, difficulty_level } = req.query;

    logger.debug('\n[Journey] 📋 Listando jornadas:', { disorder_category, difficulty_level });

    let query = supabase
      .from('clinical_journeys')
      .select('*')
      .eq('status', 'active');

    if (disorder_category) {
      query = query.eq('disorder_category', disorder_category);
    }

    if (difficulty_level) {
      query = query.eq('difficulty_level', difficulty_level);
    }

    const { data: journeys, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    logger.debug(`[Journey] ✅ ${journeys.length} jornadas encontradas`);

    res.json({
      success: true,
      journeys: journeys
    });

  } catch (error) {
    console.error('[Journey] ❌ Erro ao listar:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 2️⃣ OBTER JORNADA ESPECÍFICA
// ============================================
router.get('/:id', authenticateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    logger.debug(`\n[Journey] 🔍 Buscando jornada: ${id}, user: ${userId}`);

    // Buscar jornada
    const { data: journey, error: journeyError } = await supabase
      .from('clinical_journeys')
      .select('*')
      .eq('id', id)
      .single();

    if (journeyError) throw journeyError;

    // Buscar progresso do usuário
    const { data: progress, error: progressError } = await supabase
      .from('user_journey_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('journey_id', id)
      .maybeSingle();

    if (progressError) throw progressError;

    logger.debug(`[Journey] ✅ Jornada encontrada: ${journey.title}`);
    if (progress) {
      logger.debug(`[Journey] 📊 Progresso: Sessão ${progress.current_session}/12`);
    } else {
      logger.debug(`[Journey] 🆕 Usuário ainda não iniciou esta jornada`);
    }

    res.json({
      success: true,
      journey: journey,
      progress: progress
    });

  } catch (error) {
    console.error('[Journey] ❌ Erro ao buscar jornada:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 3️⃣ INICIAR JORNADA
// ============================================
router.post('/start', authenticateRequest, async (req, res) => {
  try {
    const { journey_id } = req.body;
    const user_id = req.user.userId;

    logger.debug(`\n[Journey] 🚀 Iniciando jornada: ${journey_id}, user: ${user_id}`);

    // Verificar se já existe progresso
    const { data: existing } = await supabase
      .from('user_journey_progress')
      .select('*')
      .eq('user_id', user_id)
      .eq('journey_id', journey_id)
      .maybeSingle();

    if (existing) {
      logger.debug('[Journey] ⚠️  Jornada já iniciada - retornando progresso existente');
      return res.json({
        success: true,
        progress: existing,
        message: 'Jornada já iniciada'
      });
    }

    // Criar novo progresso
    const { data: progress, error } = await supabase
      .from('user_journey_progress')
      .insert({
        user_id: user_id,
        journey_id: journey_id,
        current_session: 1,
        total_rapport: 0,
        total_insight: 0,
        total_behavioral_change: 0,
        total_symptom_reduction: 0
      })
      .select()
      .single();

    if (error) throw error;

    logger.debug('[Journey] ✅ Jornada iniciada - Sessão 1/12');

    res.json({
      success: true,
      progress: progress,
      message: 'Jornada iniciada com sucesso'
    });

  } catch (error) {
    console.error('[Journey] ❌ Erro ao iniciar jornada:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 4️⃣ OBTER SESSÃO ESPECÍFICA
// ============================================
router.get('/:journey_id/session/:session_number', authenticateRequest, async (req, res) => {
  try {
    const { journey_id, session_number } = req.params;
    const userId = req.user.userId;

    logger.debug(`\n[Journey] 📖 Sessão ${session_number}, jornada: ${journey_id}, user: ${userId}`);

    // Buscar sessão
    const { data: session, error: sessionError } = await supabase
      .from('journey_sessions')
      .select('*')
      .eq('journey_id', journey_id)
      .eq('session_number', parseInt(session_number))
      .single();

    if (sessionError) throw sessionError;

    // Buscar progresso do usuário
    const { data: progress, error: progressError } = await supabase
      .from('user_journey_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('journey_id', journey_id)
      .single();

    if (progressError) throw progressError;

    // Verificar se usuário está na sessão correta
    if (!req.query.free_mode && parseInt(session_number) > progress.current_session) {

      logger.debug(`[Journey] 🚫 Acesso negado - Usuário ainda na sessão ${progress.current_session}`);
      return res.status(403).json({
        success: false,
        error: 'Você precisa completar a sessão atual primeiro',
        current_session: progress.current_session
      });
    }

    // Buscar decisão anterior (se existir)
    const { data: previousDecision } = await supabase
      .from('user_session_decisions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', session.id)
      .maybeSingle();

    logger.debug(`[Journey] ✅ Sessão ${session_number}: ${session.session_title}`);
    if (previousDecision) {
      logger.debug(`[Journey] 📋 Decisão anterior: Opção ${previousDecision.option_chosen}`);
    }

    res.json({
      success: true,
      session: session,
      progress: progress,
      previous_decision: previousDecision
    });

  } catch (error) {
    console.error('[Journey] ❌ Erro ao buscar sessão:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 5️⃣ REGISTRAR DECISÃO
// ============================================
router.post('/:journey_id/session/:session_number/decide', authenticateRequest, async (req, res) => {
  try {
    const { journey_id, session_number } = req.params;
    const { option_chosen, time_taken_seconds } = req.body;
    const user_id = req.user.userId;

    logger.debug(`\n[Journey] ✍️  Decisão na sessão ${session_number}:`);
    logger.debug(`   Opção: ${option_chosen}, Tempo: ${time_taken_seconds}s`);

    // Buscar sessão
    const { data: session, error: sessionError } = await supabase
      .from('journey_sessions')
      .select('*')
      .eq('journey_id', journey_id)
      .eq('session_number', parseInt(session_number))
      .single();

    if (sessionError) throw sessionError;

    // Buscar progresso
    const { data: progress, error: progressError } = await supabase
      .from('user_journey_progress')
      .select('*')
      .eq('user_id', user_id)
      .eq('journey_id', journey_id)
      .single();

    if (progressError) throw progressError;

    // Encontrar feedback da opção escolhida
    const options = session.options;
    const chosenOption = options.find(opt => opt.label === option_chosen);

    if (!chosenOption) {
      throw new Error('Opção inválida');
    }

    const feedback = chosenOption.feedback;
    const impact = feedback.impact;

    logger.debug(`[Journey] 📊 Impacto:`);
    logger.debug(`   Rapport: +${impact.rapport}`);
    logger.debug(`   Insight: +${impact.insight}`);
    logger.debug(`   Mudança Comportamental: +${impact.behavioral_change}`);
    logger.debug(`   Redução de Sintomas: +${impact.symptom_reduction}`);

    // Verificar se já existe decisão para esta sessão
    const { data: existingDecision } = await supabase
      .from('user_session_decisions')
      .select('*')
      .eq('user_id', user_id)
      .eq('session_id', session.id)
      .maybeSingle();

    if (existingDecision) {
      logger.debug('[Journey] ⚠️  Decisão já registrada - atualizando...');
      
      // Atualizar decisão existente
      const { error: updateError } = await supabase
        .from('user_session_decisions')
        .update({
          option_chosen: option_chosen,
          is_optimal: chosenOption.is_best || false,
          rapport_gained: impact.rapport,
          insight_gained: impact.insight,
          behavioral_change_gained: impact.behavioral_change,
          symptom_reduction_gained: impact.symptom_reduction,
          time_taken_seconds: time_taken_seconds
        })
        .eq('id', existingDecision.id);

      if (updateError) throw updateError;

    } else {
      // Criar nova decisão
      const { error: decisionError } = await supabase
        .from('user_session_decisions')
        .insert({
          user_id: user_id,
          journey_id: journey_id,
          session_id: session.id,
          option_chosen: option_chosen,
          is_optimal: chosenOption.is_best || false,
          rapport_gained: impact.rapport,
          insight_gained: impact.insight,
          behavioral_change_gained: impact.behavioral_change,
          symptom_reduction_gained: impact.symptom_reduction,
          time_taken_seconds: time_taken_seconds
        });

      if (decisionError) throw decisionError;

      // Atualizar progresso acumulado
      const newRapport = progress.total_rapport + impact.rapport;
      const newInsight = progress.total_insight + impact.insight;
      const newBehavioral = progress.total_behavioral_change + impact.behavioral_change;
      const newSymptom = progress.total_symptom_reduction + impact.symptom_reduction;

      const { error: progressUpdateError } = await supabase
        .from('user_journey_progress')
        .update({
          total_rapport: newRapport,
          total_insight: newInsight,
          total_behavioral_change: newBehavioral,
          total_symptom_reduction: newSymptom,
          last_session_at: new Date().toISOString()
        })
        .eq('id', progress.id);

      if (progressUpdateError) throw progressUpdateError;

      logger.debug(`[Journey] 📈 Totais atualizados:`);
      logger.debug(`   Rapport total: ${newRapport}`);
      logger.debug(`   Insight total: ${newInsight}`);
      logger.debug(`   Mudança total: ${newBehavioral}`);
      logger.debug(`   Redução total: ${newSymptom}`);
    }

    // Se não for a última sessão, avançar para próxima
    const isLastSession = parseInt(session_number) === 12;
    
    if (!isLastSession && progress.current_session === parseInt(session_number)) {
      const { error: advanceError } = await supabase
        .from('user_journey_progress')
        .update({
          current_session: progress.current_session + 1
        })
        .eq('id', progress.id);

      if (advanceError) throw advanceError;

      logger.debug(`[Journey] ➡️  Avançando para sessão ${progress.current_session + 1}`);
    }

    // Se for última sessão, marcar como completa
    if (isLastSession && !progress.is_completed) {
      const totalScore = Math.round(
        (progress.total_rapport + progress.total_insight + 
         progress.total_behavioral_change + progress.total_symptom_reduction) / 4.8
      );

      let effectiveness = 'poor';
      if (totalScore >= 80) effectiveness = 'excellent';
      else if (totalScore >= 60) effectiveness = 'good';
      else if (totalScore >= 40) effectiveness = 'moderate';

      const { error: completeError } = await supabase
        .from('user_journey_progress')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          final_score: totalScore,
          treatment_effectiveness: effectiveness
        })
        .eq('id', progress.id);

      if (completeError) throw completeError;

      logger.debug(`[Journey] 🎉 Jornada completa!`);
      logger.debug(`   Score final: ${totalScore}/100`);
      logger.debug(`   Efetividade: ${effectiveness}`);
    }

    logger.debug('[Journey] ✅ Decisão registrada com sucesso');

    res.json({
      success: true,
      feedback: {
        immediate: feedback.immediate,
        explanation: feedback.explanation,
        impact: impact,
        is_optimal: chosenOption.is_best || false
      },
      next_session: isLastSession ? null : progress.current_session + 1,
      is_completed: isLastSession
    });

  } catch (error) {
    console.error('[Journey] ❌ Erro ao registrar decisão:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 6️⃣ OBTER PROGRESSO
// ============================================
router.get('/:journey_id/progress', authenticateRequest, async (req, res) => {
  try {
    const { journey_id } = req.params;
    const userId = req.user.userId;

    logger.debug(`\n[Journey] 📊 Progresso: jornada ${journey_id}, user ${userId}`);

    const { data: progress, error } = await supabase
      .from('user_journey_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('journey_id', journey_id)
      .maybeSingle();

    if (error) throw error;

    if (!progress) {
      logger.debug('[Journey] 🆕 Usuário ainda não iniciou esta jornada');
      return res.json({
        success: true,
        progress: null,
        message: 'Jornada não iniciada'
      });
    }

    logger.debug(`[Journey] ✅ Sessão ${progress.current_session}/12`);
    logger.debug(`[Journey] 📈 Score: ${progress.final_score || 'em andamento'}`);

    res.json({
      success: true,
      progress: progress
    });

  } catch (error) {
    console.error('[Journey] ❌ Erro ao buscar progresso:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 7️⃣ LISTAR TODAS AS SESSÕES DE UMA JORNADA (COM FILTRO POR SKILL)
// ============================================
router.get('/:journey_id/sessions', authenticateRequest, async (req, res) => {
  try {
    const { journey_id } = req.params;
    const { skill_module } = req.query;
    const userId = req.user.userId;

    logger.debug(`\n[Journey] 📚 Listando sessões: jornada ${journey_id}`);
    if (skill_module) {
      logger.debug(`   Filtro: module = ${skill_module}`);
    }

    // Buscar sessões SEM join (evita erro de relacionamento)
    let query = supabase
      .from('journey_sessions')
      .select('*')
      .eq('journey_id', journey_id)
      .order('session_number');

    const { data: sessions, error: sessionsError } = await query;

    if (sessionsError) throw sessionsError;

    // Buscar skills manualmente
    const { data: skills } = await supabase
      .from('skills')
      .select('*');

    // Fazer join manual
    const sessionsWithSkills = sessions.map(session => {
      const skill = skills ? skills.find(s => s.id === session.skill_id) : null;
      return {
        ...session,
        skill: skill
      };
    });

    // Filtrar por módulo se especificado
    let filteredSessions = sessionsWithSkills;
    if (skill_module) {
      filteredSessions = sessionsWithSkills.filter(s => s.skill && s.skill.module === skill_module);
    }

    // Buscar progresso do usuário para marcar sessões completadas
    const { data: decisions } = await supabase
      .from('user_session_decisions')
      .select('session_id')
      .eq('user_id', userId);

    const completedSessionIds = new Set(decisions?.map(d => d.session_id) || []);

    // Adicionar flag de completado
    const sessionsWithStatus = filteredSessions.map(session => ({
      ...session,
      is_completed: completedSessionIds.has(session.id)
    }));

    logger.debug(`[Journey] ✅ ${sessionsWithStatus.length} sessões retornadas`);

    res.json({
      success: true,
      sessions: sessionsWithStatus,
      total: sessionsWithStatus.length,
      filter_applied: skill_module || 'all'
    });

  } catch (error) {
    console.error('[Journey] ❌ Erro ao listar sessões:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 8️⃣ RECOMEÇAR JORNADA (RESET)
// ============================================
router.post('/:journey_id/restart', authenticateRequest, async (req, res) => {
  try {
    const { journey_id } = req.params;
    const user_id = req.user.userId;

    logger.debug(`\n[Journey] 🔄 Recomeçando jornada: ${journey_id}, user: ${user_id}`);

    // Buscar progresso atual
    const { data: currentProgress } = await supabase
      .from('user_journey_progress')
      .select('*')
      .eq('user_id', user_id)
      .eq('journey_id', journey_id)
      .maybeSingle();

    if (currentProgress) {
      // Deletar progresso antigo
      const { error: deleteError } = await supabase
        .from('user_journey_progress')
        .delete()
        .eq('id', currentProgress.id);

      if (deleteError) throw deleteError;

      logger.debug('[Journey] 🗑️ Progresso antigo deletado');
    }

    // Criar novo progresso (reset)
    const { data: newProgress, error: createError } = await supabase
      .from('user_journey_progress')
      .insert({
        user_id: user_id,
        journey_id: journey_id,
        current_session: 1,
        total_rapport: 0,
        total_insight: 0,
        total_behavioral_change: 0,
        total_symptom_reduction: 0,
        is_completed: false
      })
      .select()
      .single();

    if (createError) throw createError;

    logger.debug('[Journey] ✅ Nova jornada iniciada');

    res.json({
      success: true,
      progress: newProgress,
      message: 'Jornada recomeçada com sucesso'
    });

  } catch (error) {
    console.error('[Journey] ❌ Erro ao recomeçar:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;