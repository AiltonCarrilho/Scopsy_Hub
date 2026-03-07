const express = require('express');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');
const router = express.Router();
const { authenticateRequest } = require('../middleware/auth');

const { supabaseAdmin: supabase } = require('../services/supabase'); // Service role - backend handles auth via JWT

// ============================================
// HELPER: In-memory cache for JSON sessions (loaded once at boot)
// ============================================
const ORCHESTRATOR_PATH = path.resolve(__dirname, '../../data/journeys');
const SESSION_RANGES = [
  { min: 1, max: 3, suffix: '1-3' },
  { min: 4, max: 6, suffix: '4-6' },
  { min: 7, max: 9, suffix: '7-9' },
  { min: 10, max: 12, suffix: '10-12' },
];

// Boot-time cache: { orchestratorId -> { sessionNumber -> transformedSession } }
const sessionsCache = {};
// Cache for orchestrator_id lookups: { journeyUUID -> orchestratorId }
const orchestratorCache = {};
// Cache for session DB row IDs: { "journeyId_sessionNumber" -> dbId }
const sessionRowCache = {};

function loadAllSessionsToCache() {
  const files = fs.readdirSync(ORCHESTRATOR_PATH).filter(f => f.endsWith('.json'));
  let total = 0;

  for (const file of files) {
    const match = file.match(/^journey-(\d+)-sessions-/);
    if (!match) continue;

    const orchestratorId = match[1];
    if (!sessionsCache[orchestratorId]) sessionsCache[orchestratorId] = {};

    const filePath = path.join(ORCHESTRATOR_PATH, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const sessionsArray = Array.isArray(data) ? data : data.sessions;

    if (sessionsArray) {
      for (const session of sessionsArray) {
        sessionsCache[orchestratorId][session.session_number] = {
          session_number: session.session_number,
          session_title: session.session_title,
          session_phase: session.session_phase,
          context: session.session_content?.narrative || '',
          decision_prompt: session.session_content?.critical_decision_point || '',
          homework_review: session.session_content?.homework_review || null,
          decision_options: session.decision_options,
          expert_commentary: session.expert_commentary,
          learning_focus: session.learning_focus,
        };
        total++;
      }
    }
  }

  logger.info(`[Journey] Cached ${total} sessions from ${files.length} JSON files`);
}

// Load cache at module init
loadAllSessionsToCache();

function getSessionFromJSON(orchestratorId, sessionNumber) {
  const num = parseInt(sessionNumber);
  return sessionsCache[orchestratorId]?.[num] || null;
}

function getAllSessionsFromCache(orchestratorId) {
  const sessions = sessionsCache[orchestratorId];
  if (!sessions) return [];
  return Object.values(sessions).sort((a, b) => a.session_number - b.session_number);
}

// Helper: Ensure a journey_sessions row exists (needed for FK in user_session_decisions)
async function ensureSessionRow(journeyId, sessionNumber, sessionData) {
  const num = parseInt(sessionNumber);
  const cacheKey = journeyId + '_' + num;

  // Check memory cache first
  if (sessionRowCache[cacheKey]) return sessionRowCache[cacheKey];

  const { data: existing } = await supabase
    .from('journey_sessions')
    .select('id')
    .eq('journey_id', journeyId)
    .eq('session_number', num)
    .maybeSingle();

  if (existing) {
    sessionRowCache[cacheKey] = existing.id;
    return existing.id;
  }

  // Create the row so decisions can reference it
  const { data: created, error } = await supabase
    .from('journey_sessions')
    .insert({
      journey_id: journeyId,
      session_number: num,
      session_title: sessionData.session_title,
      session_phase: sessionData.session_phase,
      context: sessionData.context,
    })
    .select('id')
    .single();

  if (error) {
    logger.error('[Journey] Failed to ensure session row:', error);
    throw error;
  }

  sessionRowCache[cacheKey] = created.id;
  return created.id;
}

// Helper: Get orchestrator_id for a journey (cached)
async function getOrchestratorId(journeyId) {
  if (orchestratorCache[journeyId]) return orchestratorCache[journeyId];

  const { data: journey, error } = await supabase
    .from('clinical_journeys')
    .select('orchestrator_id')
    .eq('id', journeyId)
    .single();

  if (error || !journey?.orchestrator_id) return null;
  orchestratorCache[journeyId] = journey.orchestrator_id;
  return journey.orchestrator_id;
}

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

    if (error) {
      throw error;
    }

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
    const userId = parseInt(req.user.userId, 10);

    logger.debug(`\n[Journey] 🔍 Buscando jornada: ${id}, user: ${userId}`);

    // Buscar jornada
    const { data: journey, error: journeyError } = await supabase
      .from('clinical_journeys')
      .select('*')
      .eq('id', id)
      .single();

    if (journeyError) {
      throw journeyError;
    }

    // Buscar progresso do usuário
    const { data: progress, error: progressError } = await supabase
      .from('user_journey_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('journey_id', id)
      .maybeSingle();

    if (progressError) {
      throw progressError;
    }

    logger.debug(`[Journey] ✅ Jornada encontrada: ${journey.title}`);
    if (progress) {
      logger.debug(`[Journey] 📊 Progresso: Sessão ${progress.current_session}/12`);
    } else {
      logger.debug('[Journey] 🆕 Usuário ainda não iniciou esta jornada');
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
    const user_id = parseInt(req.user.userId, 10);  // Convert string to int

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

    if (error) {
      throw error;
    }

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
    const userId = parseInt(req.user.userId, 10);  // Convert string to int

    logger.debug(`\n[Journey] 📖 Sessão ${session_number}, jornada: ${journey_id}, user: ${userId}`);

    // Get orchestrator_id to load from JSON files
    const orchestratorId = await getOrchestratorId(journey_id);
    if (!orchestratorId) {
      return res.status(404).json({
        success: false,
        error: 'Jornada não encontrada',
        code: 'JOURNEY_NOT_FOUND'
      });
    }

    // Load session from JSON files (source of truth)
    const session = getSessionFromJSON(orchestratorId, session_number);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: `Sessão ${session_number} não encontrada para esta jornada`,
        code: 'SESSION_NOT_FOUND'
      });
    }

    // Ensure DB row exists for FK references
    const sessionDbId = await ensureSessionRow(journey_id, session_number, session);
    session.id = sessionDbId;
    session.journey_id = journey_id;

    // Buscar progresso do usuário
    const { data: progress, error: progressError } = await supabase
      .from('user_journey_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('journey_id', journey_id)
      .maybeSingle();

    if (progressError) {
      throw progressError;
    }

    // Verificar se usuário iniciou a jornada
    if (!progress) {
      return res.status(403).json({
        success: false,
        error: 'Você precisa iniciar a jornada primeiro',
        code: 'JOURNEY_NOT_STARTED'
      });
    }

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
    const user_id = parseInt(req.user.userId, 10);  // Convert string to int

    logger.debug(`\n[Journey] ✍️  Decisão na sessão ${session_number}:`);
    logger.debug(`   Opção: ${option_chosen}, Tempo: ${time_taken_seconds}s`);

    // Get orchestrator_id to load from JSON files
    const orchestratorId = await getOrchestratorId(journey_id);
    if (!orchestratorId) {
      return res.status(404).json({
        success: false,
        error: 'Jornada não encontrada',
        code: 'JOURNEY_NOT_FOUND'
      });
    }

    // Load session from JSON files (source of truth)
    const session = getSessionFromJSON(orchestratorId, session_number);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: `Sessão ${session_number} não encontrada para esta jornada`,
        code: 'SESSION_NOT_FOUND'
      });
    }

    // Ensure DB row exists for FK references
    const sessionDbId = await ensureSessionRow(journey_id, session_number, session);
    session.id = sessionDbId;

    // Buscar progresso
    const { data: progress, error: progressError } = await supabase
      .from('user_journey_progress')
      .select('*')
      .eq('user_id', user_id)
      .eq('journey_id', journey_id)
      .maybeSingle();

    if (progressError) {
      throw progressError;
    }

    if (!progress) {
      return res.status(403).json({
        success: false,
        error: 'Você precisa iniciar a jornada antes de tomar decisões',
        code: 'JOURNEY_NOT_STARTED'
      });
    }

    // Encontrar feedback da opção escolhida
    const options = session.decision_options;
    const chosenOption = options.find(opt => opt.option_letter === option_chosen);

    if (!chosenOption) {
      throw new Error('Opção inválida');
    }

    // Construir feedback a partir dos campos da opção
    const feedback = {
      immediate: chosenOption.immediate_outcome,
      explanation: `${chosenOption.approach}: ${chosenOption.intervention}`,
      impact: chosenOption.impact,
      is_optimal: chosenOption.is_optimal
    };
    const impact = feedback.impact;

    logger.debug('[Journey] 📊 Impacto:');
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
          is_optimal: chosenOption.is_optimal || false,
          rapport_gained: impact.rapport,
          insight_gained: impact.insight,
          behavioral_change_gained: impact.behavioral_change,
          symptom_reduction_gained: impact.symptom_reduction,
          time_taken_seconds: time_taken_seconds
        })
        .eq('id', existingDecision.id);

      if (updateError) {
        throw updateError;
      }

    } else {
      // Criar nova decisão
      const { error: decisionError } = await supabase
        .from('user_session_decisions')
        .insert({
          user_id: user_id,
          journey_id: journey_id,
          session_id: session.id,
          option_chosen: option_chosen,
          is_optimal: chosenOption.is_optimal || false,
          rapport_gained: impact.rapport,
          insight_gained: impact.insight,
          behavioral_change_gained: impact.behavioral_change,
          symptom_reduction_gained: impact.symptom_reduction,
          time_taken_seconds: time_taken_seconds
        });

      if (decisionError) {
        throw decisionError;
      }

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

      if (progressUpdateError) {
        throw progressUpdateError;
      }

      logger.debug('[Journey] 📈 Totais atualizados:');
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

      if (advanceError) {
        throw advanceError;
      }

      logger.debug(`[Journey] ➡️  Avançando para sessão ${progress.current_session + 1}`);
    }

    // Se for última sessão, marcar como completa
    if (isLastSession && !progress.is_completed) {
      const totalScore = Math.round(
        (progress.total_rapport + progress.total_insight +
         progress.total_behavioral_change + progress.total_symptom_reduction) / 4.8
      );

      let effectiveness = 'poor';
      if (totalScore >= 80) {
        effectiveness = 'excellent';
      } else if (totalScore >= 60) {
        effectiveness = 'good';
      } else if (totalScore >= 40) {
        effectiveness = 'moderate';
      }

      const { error: completeError } = await supabase
        .from('user_journey_progress')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          final_score: totalScore,
          treatment_effectiveness: effectiveness
        })
        .eq('id', progress.id);

      if (completeError) {
        throw completeError;
      }

      logger.debug('[Journey] 🎉 Jornada completa!');
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
        is_optimal: chosenOption.is_optimal || false
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
    const userId = parseInt(req.user.userId, 10);

    logger.debug(`\n[Journey] 📊 Progresso: jornada ${journey_id}, user ${userId}`);

    const { data: progress, error } = await supabase
      .from('user_journey_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('journey_id', journey_id)
      .maybeSingle();

    if (error) {
      throw error;
    }

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
    const userId = parseInt(req.user.userId, 10);

    logger.debug(`\n[Journey] 📚 Listando sessões: jornada ${journey_id}`);

    // Get orchestrator_id (cached after first call)
    const orchestratorId = await getOrchestratorId(journey_id);
    if (!orchestratorId) {
      return res.status(404).json({ success: false, error: 'Journey not found or orchestrator_id not mapped' });
    }

    // RLS ownership check + get sessions from cache in parallel
    const [progressResult] = await Promise.all([
      supabase
        .from('user_journey_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('journey_id', journey_id)
        .maybeSingle()
    ]);

    if (progressResult.error) {
      throw progressResult.error;
    }

    if (!progressResult.data) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem acesso a esta jornada',
        code: 'JOURNEY_ACCESS_DENIED'
      });
    }

    // Load from in-memory cache (no disk I/O)
    const sessions = getAllSessionsFromCache(orchestratorId);

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, error: 'No sessions found' });
    }

    logger.debug(`[Journey] ${sessions.length} sessions served from cache`);

    res.json({
      success: true,
      sessions: sessions,
      total: sessions.length
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
    const user_id = parseInt(req.user.userId, 10);

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

      if (deleteError) {
        throw deleteError;
      }

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

    if (createError) {
      throw createError;
    }

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