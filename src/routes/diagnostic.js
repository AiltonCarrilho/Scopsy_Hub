const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const { authenticateRequest } = require('../middleware/auth');
const { applyFreshnessMultiplier } = require('../services/freshnessService');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ========================================
// POST /api/diagnostic/generate-case
// Gera caso (CACHE FIRST = RÁPIDO!)
// ========================================
router.post('/generate-case', authenticateRequest, async (req, res) => {
  try {
    const { level = 'intermediate', category = 'anxiety' } = req.body;

    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    const userId = req.user.userId;

    console.log(`[Diagnostic] Buscando caso: level=${level}, category=${category}, user=${userId}`);

    // ⚡ PRIORIDADE 1: Buscar caso do CACHE (0.5s)
    const { data: cachedCase } = await supabase
      .from('cases')
      .select('*')
      .eq('status', 'active') // Apenas casos validados
      .eq('difficulty_level', level)
      .eq('category', category)
      .order('times_used', { ascending: true }) // Menos usado primeiro
      .limit(1)
      .maybeSingle();

    if (cachedCase) {
      console.log(`[Diagnostic] ⚡ Cache HIT (id: ${cachedCase.id}) - INSTANTÂNEO`);

      // Incrementar times_used (assíncrono, não bloqueia resposta)
      supabase
        .from('cases')
        .update({
          times_used: cachedCase.times_used + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', cachedCase.id)
        .then(() => console.log(`[Diagnostic] ✅ Contador atualizado`));

      return res.json({
        success: true,
        case: cachedCase.case_content,
        case_id: cachedCase.id,
        from_cache: true
      });
    }

    // ⚠️ Cache MISS: Gerar novo caso (lento, mas salva para próximas)
    console.log('[Diagnostic] ⏳ Cache MISS - Gerando novo caso...');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // RÁPIDO e barato
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content: `Gerador de casos clínicos. Retorna APENAS JSON.

SAÍDA:
{
  "metadata": {"difficulty_level": "${level}", "category": "${category}", "disorder": "Transtorno específico"},
  "clinical_content": {
    "vignette": "Caso em português (150-200 palavras)",
    "demographics": {"name": "Nome", "age": 30, "occupation": "Profissão"}
  },
  "diagnostic_structure": {
    "correct_diagnosis": "Diagnóstico correto",
    "criteria_present": ["Critério 1", "Critério 2", "Critério 3"]
  },
  "question_format": {
    "question": "Qual é o diagnóstico mais provável?",
    "options": ["Correto", "Diferencial 1", "Diferencial 2", "Diferencial 3"]
  }
}

REGRAS: Português brasileiro, 20-55 anos, contextos variados, DSM-5-TR.`
        },
        {
          role: "user",
          content: `Gere caso: level=${level}, category=${category}. APENAS JSON.`
        }
      ]
    });

    const caseData = JSON.parse(completion.choices[0].message.content);

    // Salvar para próximas vezes
    const { data: newCase } = await supabase
      .from('cases')
      .insert({
        disorder: caseData.metadata?.disorder || 'Unknown',
        difficulty_level: level,
        category: category,
        case_content: caseData,
        vignette: caseData.clinical_content?.vignette || '',
        correct_diagnosis: caseData.diagnostic_structure?.correct_diagnosis || '',
        status: 'active', // JÁ ativo (economiza validação)
        times_used: 1,
        quality_score: 4.0,
        created_by: 'real_time_generation'
      })
      .select()
      .single();

    console.log(`[Diagnostic] ✅ Caso novo salvo (id: ${newCase?.id})`);

    res.json({
      success: true,
      case: caseData,
      case_id: newCase?.id,
      from_cache: false
    });

  } catch (error) {
    console.error('[Diagnostic] Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// POST /api/diagnostic/submit-answer
// Feedback RÁPIDO (gpt-4o-mini + prompts enxutos)
// ========================================
router.post('/submit-answer', authenticateRequest, async (req, res) => {
  try {
    const {
      case_id,
      user_answer,
      correct_diagnosis,
      time_spent_seconds,
      case_data
    } = req.body;
    const userId = req.user.userId;

    const is_correct = user_answer.toLowerCase().trim() === correct_diagnosis.toLowerCase().trim();

    console.log(`[Diagnostic] Resposta: user=${userId}, correct=${is_correct}`);

    // Registrar interação (assíncrono para não bloquear)
    supabase
      .from('user_case_interactions')
      .insert({
        user_id: userId,
        case_id,
        user_diagnosis: user_answer,
        user_answer: user_answer,
        correct_diagnosis,
        is_correct,
        time_spent_seconds,
        difficulty_level: case_data.metadata?.difficulty_level || 'intermediate',
        disorder_category: case_data.metadata?.category || 'unknown'
      })
      .then(() => console.log('[Diagnostic] ✅ Interação registrada'));

    // Atualizar métricas (assíncrono)
    if (case_id) {
      supabase
        .from('cases')
        .select('times_correct, times_incorrect')
        .eq('id', case_id)
        .single()
        .then(({ data: caseRecord }) => {
          if (caseRecord) {
            return supabase
              .from('cases')
              .update({
                times_correct: caseRecord.times_correct + (is_correct ? 1 : 0),
                times_incorrect: caseRecord.times_incorrect + (is_correct ? 0 : 1)
              })
              .eq('id', case_id);
          }
        });
    }

    // ✅ Atualizar progresso (NÃO quebra se falhar)
    try {
      console.log('[Diagnostic] 🔄 Atualizando progresso do usuário...');
      await updateUserProgress(userId, 'diagnostic', is_correct);
      console.log('[Diagnostic] ✅ Progresso atualizado');
    } catch (progressError) {
      console.error('[Diagnostic] ⚠️ AVISO: Erro ao atualizar progresso, mas continuando...', progressError.message);
      // NÃO quebra o fluxo - feedback é mais importante
    }

    const xpGained = is_correct ? 30 : 10;

    // ⚡ Feedback RÁPIDO com gpt-4o-mini
    let feedback = null;

    try {
      const feedbackCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // RÁPIDO
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 600, // Curto = rápido
        messages: [
          {
            role: "system",
            content: `Feedback educativo em JSON. Conciso e acionável.

SAÍDA:
{
  "feedback_eco": {
    "explicar": {
      "what_happened": "Contexto clínico (2-3 frases)"
    },
    "conectar": {
      "theory_connection": "DSM-5-TR relevante (2 frases)"
    },
    "orientar": {
      "what_to_focus_next": "Próximo passo (1-2 frases)"
    }
  }
}`
          },
          {
            role: "user",
            content: `Caso: ${case_data.clinical_content?.vignette?.substring(0, 250)}
Correto: ${correct_diagnosis}
Usuário: ${user_answer}
Resultado: ${is_correct ? 'ACERTOU' : 'ERROU'}

Feedback JSON.`
          }
        ]
      });

      feedback = JSON.parse(feedbackCompletion.choices[0].message.content);
    } catch (error) {
      console.error('[Diagnostic] Erro feedback:', error);
      // Fallback instantâneo
      feedback = {
        feedback_eco: {
          explicar: {
            what_happened: is_correct
              ? "Você identificou corretamente o diagnóstico!"
              : `O diagnóstico correto é ${correct_diagnosis}.`
          },
          conectar: {
            theory_connection: "Revise os critérios DSM-5-TR."
          },
          orientar: {
            what_to_focus_next: "Continue praticando."
          }
        }
      };
    }

    // 🔥 Atualizar Streak e Missões
    let missionsCompleted = [];
    try {
      const { checkAndUpdateStreak } = require('../services/streakService');
      const { updateMissionProgress } = require('../services/missionService');

      await checkAndUpdateStreak(userId, 'diagnostic');
      missionsCompleted = await updateMissionProgress(userId, 'diagnostic', is_correct) || [];
    } catch (e) { console.error('Erro gamification:', e); }

    res.json({
      success: true,
      is_correct,
      cognits_gained: xpGained,
      xp_gained: xpGained,
      missions_completed: missionsCompleted, // 🎯 Retornar missões
      feedback
    });

  } catch (error) {
    console.error('[Diagnostic] Erro submit:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// GET /api/diagnostic/stats
// ========================================
router.get('/stats', authenticateRequest, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('assistant_type', 'diagnostic')
      .single();

    const { data: categoryStats } = await supabase
      .from('diagnostic_stats_by_category')
      .select('*')
      .eq('user_id', userId);

    res.json({
      success: true,
      progress: progress || {
        total_diagnoses: 0,
        correct_diagnoses: 0,
        accuracy_rate: 0,
        cognits: 0, // ✅ Mudança: xp_points → cognits
        level: 1
      },
      category_stats: categoryStats || []
    });

  } catch (error) {
    console.error('[Diagnostic] Erro stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// HELPER
// ========================================
async function updateUserProgress(userId, assistantType, isCorrect) {
  try {
    console.log(`\n[updateUserProgress] 🎯 INICIANDO:`, { userId, assistantType, isCorrect });

    const { data: existing, error: selectError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('assistant_type', assistantType)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('[updateUserProgress] ❌ Erro ao buscar:', selectError);
      throw selectError;
    }

    // ✅ Radar Diagnóstico: +5 cognits por acerto, +1 por erro (BASE)
    const baseCognits = isCorrect ? 5 : 1;

    // 💧 APLICAR MULTIPLICADOR DE FRESCOR (atualiza last_practice_date e recupera frescor gradualmente)
    const finalCognits = await applyFreshnessMultiplier(userId, baseCognits);
    console.log(`[updateUserProgress] 💧 Frescor aplicado: ${baseCognits} × multiplicador = ${finalCognits} cognits`);

    if (existing) {
      console.log('[updateUserProgress] 📝 Registro existe, atualizando...');

      const { error: updateError } = await supabase
        .from('user_progress')
        .update({
          total_cases: (existing.total_cases || 0) + 1,
          correct_diagnoses: (existing.correct_diagnoses || 0) + (isCorrect ? 1 : 0),
          xp_points: (existing.xp_points || 0) + finalCognits, // ✅ Cognits com multiplicador de frescor aplicado
          last_activity_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('[updateUserProgress] ❌ Erro ao atualizar:', updateError);
        throw updateError;
      }

      console.log('[updateUserProgress] ✅ ATUALIZADO COM SUCESSO!');
    } else {
      console.log('[updateUserProgress] ➕ Registro NÃO existe, criando novo...');

      const { error: insertError } = await supabase
        .from('user_progress')
        .insert({
          user_id: userId,
          assistant_type: assistantType,
          total_cases: 1,
          correct_diagnoses: isCorrect ? 1 : 0,
          xp_points: finalCognits, // ✅ Cognits com multiplicador de frescor aplicado
          last_activity_date: new Date().toISOString().split('T')[0]
        });

      if (insertError) {
        console.error('[updateUserProgress] ❌ Erro ao inserir:', insertError);
        throw insertError;
      }

      console.log('[updateUserProgress] ✅ CRIADO COM SUCESSO!');
    }
  } catch (error) {
    console.error('[updateUserProgress] ❌ ERRO:', error.message);
    console.error('[updateUserProgress] Stack:', error.stack);
    // NÃO faz throw - apenas loga
  }
}

module.exports = router;