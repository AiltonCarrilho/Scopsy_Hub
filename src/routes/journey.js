const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================
// 1️⃣ LISTAR JORNADAS DISPONÍVEIS
// ============================================
router.get('/list', async (req, res) => {
  try {
    const { disorder_category, difficulty_level } = req.query;

    console.log('\n[Journey] 📋 Listando jornadas:', { disorder_category, difficulty_level });

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

    console.log(`[Journey] ✅ ${journeys.length} jornadas encontradas`);

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
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(req.query.user_id) || 8;

    console.log(`\n[Journey] 🔍 Buscando jornada: ${id}, user: ${userId}`);

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

    console.log(`[Journey] ✅ Jornada encontrada: ${journey.title}`);
    if (progress) {
      console.log(`[Journey] 📊 Progresso: Sessão ${progress.current_session}/12`);
    } else {
      console.log(`[Journey] 🆕 Usuário ainda não iniciou esta jornada`);
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
router.post('/start', async (req, res) => {
  try {
    const { journey_id, user_id = 8 } = req.body;

    console.log(`\n[Journey] 🚀 Iniciando jornada: ${journey_id}, user: ${user_id}`);

    // Verificar se já existe progresso
    const { data: existing } = await supabase
      .from('user_journey_progress')
      .select('*')
      .eq('user_id', user_id)
      .eq('journey_id', journey_id)
      .maybeSingle();

    if (existing) {
      console.log('[Journey] ⚠️  Jornada já iniciada - retornando progresso existente');
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

    console.log('[Journey] ✅ Jornada iniciada - Sessão 1/12');

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
router.get('/:journey_id/session/:session_number', async (req, res) => {
  try {
    const { journey_id, session_number } = req.params;
    const userId = parseInt(req.query.user_id) || 8;

    console.log(`\n[Journey] 📖 Sessão ${session_number}, jornada: ${journey_id}, user: ${userId}`);

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

      console.log(`[Journey] 🚫 Acesso negado - Usuário ainda na sessão ${progress.current_session}`);
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

    console.log(`[Journey] ✅ Sessão ${session_number}: ${session.session_title}`);
    if (previousDecision) {
      console.log(`[Journey] 📋 Decisão anterior: Opção ${previousDecision.option_chosen}`);
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
router.post('/:journey_id/session/:session_number/decide', async (req, res) => {
  try {
    const { journey_id, session_number } = req.params;
    const { option_chosen, time_taken_seconds, user_id = 8 } = req.body;

    console.log(`\n[Journey] ✍️  Decisão na sessão ${session_number}:`);
    console.log(`   Opção: ${option_chosen}, Tempo: ${time_taken_seconds}s`);

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

    console.log(`[Journey] 📊 Impacto:`);
    console.log(`   Rapport: +${impact.rapport}`);
    console.log(`   Insight: +${impact.insight}`);
    console.log(`   Mudança Comportamental: +${impact.behavioral_change}`);
    console.log(`   Redução de Sintomas: +${impact.symptom_reduction}`);

    // Verificar se já existe decisão para esta sessão
    const { data: existingDecision } = await supabase
      .from('user_session_decisions')
      .select('*')
      .eq('user_id', user_id)
      .eq('session_id', session.id)
      .maybeSingle();

    if (existingDecision) {
      console.log('[Journey] ⚠️  Decisão já registrada - atualizando...');
      
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

      console.log(`[Journey] 📈 Totais atualizados:`);
      console.log(`   Rapport total: ${newRapport}`);
      console.log(`   Insight total: ${newInsight}`);
      console.log(`   Mudança total: ${newBehavioral}`);
      console.log(`   Redução total: ${newSymptom}`);
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

      console.log(`[Journey] ➡️  Avançando para sessão ${progress.current_session + 1}`);
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

      console.log(`[Journey] 🎉 Jornada completa!`);
      console.log(`   Score final: ${totalScore}/100`);
      console.log(`   Efetividade: ${effectiveness}`);
    }

    console.log('[Journey] ✅ Decisão registrada com sucesso');

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
router.get('/:journey_id/progress', async (req, res) => {
  try {
    const { journey_id } = req.params;
    const userId = parseInt(req.query.user_id) || 8;

    console.log(`\n[Journey] 📊 Progresso: jornada ${journey_id}, user ${userId}`);

    const { data: progress, error } = await supabase
      .from('user_journey_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('journey_id', journey_id)
      .maybeSingle();

    if (error) throw error;

    if (!progress) {
      console.log('[Journey] 🆕 Usuário ainda não iniciou esta jornada');
      return res.json({
        success: true,
        progress: null,
        message: 'Jornada não iniciada'
      });
    }

    console.log(`[Journey] ✅ Sessão ${progress.current_session}/12`);
    console.log(`[Journey] 📈 Score: ${progress.final_score || 'em andamento'}`);

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
router.get('/:journey_id/sessions', async (req, res) => {
  try {
    const { journey_id } = req.params;
    const { skill_module } = req.query;
    const userId = parseInt(req.query.user_id) || 8;

    console.log(`\n[Journey] 📚 Listando sessões: jornada ${journey_id}`);
    if (skill_module) {
      console.log(`   Filtro: module = ${skill_module}`);
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

    console.log(`[Journey] ✅ ${sessionsWithStatus.length} sessões retornadas`);

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
router.post('/:journey_id/restart', async (req, res) => {
  try {
    const { journey_id } = req.params;
    const { user_id = 8 } = req.body;

    console.log(`\n[Journey] 🔄 Recomeçando jornada: ${journey_id}, user: ${user_id}`);

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

      console.log('[Journey] 🗑️ Progresso antigo deletado');
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

    console.log('[Journey] ✅ Nova jornada iniciada');

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