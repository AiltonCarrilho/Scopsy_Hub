const express = require('express');
const logger = require('../config/logger');
const router = express.Router();
const OpenAI = require('openai');
const { authenticateRequest } = require('../middleware/auth');
const { applyFreshnessMultiplier } = require('../services/freshnessService');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const { supabase } = require('../services/supabase'); // RLS-aware anon client

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

    logger.debug(`[Diagnostic] Buscando caso: level=${level}, category=${category}, user=${userId}`);

    // 1️⃣ BUSCAR CASOS QUE O USUÁRIO JÁ VIU
    const { data: interactions, error: interError } = await supabase
      .from('user_case_interactions')
      .select('case_id, created_at')
      .eq('user_id', userId)
      .not('case_id', 'is', null)
      .order('created_at', { ascending: false });

    if (interError) {
      console.error('[Diagnostic] ❌ Erro ao buscar interações:', interError.message);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 🚀 OTIMIZAÇÃO DE ESCALABILIDADE - Filtro SQL vs JavaScript
    // ═══════════════════════════════════════════════════════════════════════
    //
    // Mesma otimização aplicada em case.js (31/12/2024)
    // Ver case.js:88-114 para documentação completa da estratégia
    //
    // TL;DR:
    // - Filtra null/undefined primeiro (evita erro SQL com UUID inválido)
    // - Aplica NOT IN direto no PostgreSQL (escalável para 10k+ casos)
    // - Performance constante ~25ms independente do tamanho do banco
    //
    // ═══════════════════════════════════════════════════════════════════════

    const seenCaseIds = interactions
      ? interactions
        .map(i => i.case_id)
        .filter(id => id !== null)  // ← CRÍTICO: Remove null/undefined
      : [];

    logger.debug(`[Diagnostic] 👁️ Usuário já viu: ${seenCaseIds.length} casos diagnósticos`);
    if (seenCaseIds.length > 0) {
      logger.debug('[Diagnostic] 📋 Últimos 5 IDs vistos:');
      interactions.slice(0, 5).forEach((inter, idx) => {
        logger.debug(`  ${idx + 1}. ${inter.case_id} (${inter.created_at})`);
      });
    }

    // 2️⃣ BUSCAR CASOS DISPONÍVEIS (que usuário NÃO viu)
    let casesQuery = supabase
      .from('cases')
      .select('id, times_used, moment_type, category, disorder, difficulty_level')
      .eq('status', 'active')
      .eq('difficulty_level', level)
      .eq('category', category);

    // 🎯 Filtro SQL otimizado - NOT IN executado no PostgreSQL
    if (seenCaseIds.length > 0) {
      casesQuery = casesQuery.not('id', 'in', `(${seenCaseIds.join(',')})`);
      logger.debug(`[Diagnostic] 🚫 SQL Filter: Excluindo ${seenCaseIds.length} casos já vistos`);
    }

    // Buscar apenas 10 casos JÁ FILTRADOS pelo SQL (eficiente!)
    const { data: availableCases, error: queryError } = await casesQuery
      .order('times_used', { ascending: true })
      .limit(10);  // ← LIMIT executado no SQL

    if (queryError) {
      console.error('[Diagnostic] ❌ Erro na query:', queryError.message);
    }

    logger.debug(`[Diagnostic] 📦 Casos disponíveis no cache: ${availableCases ? availableCases.length : 0}`);
    if (availableCases && availableCases.length > 0) {
      logger.debug('[Diagnostic] 📋 IDs disponíveis (top 5):');
      availableCases.slice(0, 5).forEach((c, idx) => {
        logger.debug(`  ${idx + 1}. ${c.id} (usado ${c.times_used}x)`);
      });
    }

    // 3️⃣ ESCOLHER UM CASO ALEATÓRIO DOS MENOS USADOS
    let cachedCase = null;

    if (availableCases && availableCases.length > 0) {
      // Pegar um dos 3 menos usados aleatoriamente (mais variedade)
      const topCases = availableCases.slice(0, Math.min(3, availableCases.length));
      cachedCase = topCases[Math.floor(Math.random() * topCases.length)];

      logger.debug(`[Diagnostic] ✅ Caso selecionado (id: ${cachedCase.id}, usado ${cachedCase.times_used}x)`);

      // Incrementar times_used (assíncrono, não bloqueia resposta)
      supabase
        .from('cases')
        .update({
          times_used: cachedCase.times_used + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', cachedCase.id)
        .then(() => logger.debug('[Diagnostic] ✅ Contador atualizado'));

      // 🚀 OTIMIZAÇÃO: Buscar dados completos apenas do caso selecionado
      const { data: fullCaseData, error: fullCaseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', cachedCase.id)
        .single();

      if (fullCaseError || !fullCaseData) {
        logger.error('[Diagnostic] ❌ Erro ao buscar dados completos:', fullCaseError?.message);
        return res.status(500).json({ success: false, error: 'Erro ao carregar caso' });
      }

      cachedCase = fullCaseData;

      // 🆕 REGISTRAR VISUALIZAÇÃO (anti-repetição)
      // Fire-and-forget: não bloqueia resposta (economia de ~50-100ms)
      supabase
        .from('user_case_interactions')
        .insert({
          user_id: userId,
          case_id: cachedCase.id,
          is_correct: null,  // Ainda não respondeu
          user_answer: null,
          time_spent_seconds: 0,
          difficulty_level: level,
          disorder_category: category
        })
        .then(({ error }) => {
          if (error) {
            console.error('[Diagnostic] ⚠️ Erro ao registrar visualização:', error.message);
          } else {
            logger.debug('[Diagnostic] ✅ Visualização registrada (anti-repetição)');
          }
        });

      return res.json({
        success: true,
        case: cachedCase.case_content,
        case_id: cachedCase.id,
        from_cache: true
      });
    }

    // ⚠️ Cache MISS: Gerar novo caso (lento, mas salva para próximas)
    logger.debug('[Diagnostic] ⏳ Cache MISS - Gerando novo caso...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // RÁPIDO e barato
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: `Você é um gerador de casos clínicos para treino diagnóstico e clínico DSM-5-TR.

OBJETIVO PEDAGÓGICO: Treinar competências clínicas reais (diagnóstico diferencial, conhecimento DSM, raciocínio clínico).

========================================
FORMATOS DISPONÍVEIS (escolha 1 aleatoriamente):
========================================

FORMATO 1: DIAGNÓSTICO DIFERENCIAL (40% dos casos)
- Pergunta: "Qual é o diagnóstico DSM-5-TR mais provável?"
- 4 opções: todas da MESMA categoria (ex: apenas ansiedade)
- Diferenciais PLAUSÍVEIS (não óbvios)

FORMATO 2: CRITÉRIO AUSENTE (30% dos casos)
- Dê o diagnóstico na pergunta
- Pergunta: "Qual dos sintomas apresentados NÃO faz parte dos critérios DSM-5-TR de [diagnóstico]?"
- 3 critérios corretos + 1 que não pertence

FORMATO 3: INTERVENÇÃO INDICADA (30% dos casos)
- Adicione contexto de sessão (ex: "Sessão 2", "primeira sessão", "após psicoeducação")
- Pergunta: "Qual intervenção TCC seria MAIS indicada neste momento?"
- 4 intervenções plausíveis (psicoeducação, reestruturação cognitiva, exposição, ativação comportamental, etc)

========================================
REGRAS CRÍTICAS (TODOS OS FORMATOS):
========================================

1. DIFERENCIAIS/OPÇÕES PLAUSÍVEIS:
   - NUNCA misturar categorias distantes (ansiedade com psicose)
   - Todas as opções devem ser da MESMA categoria diagnóstica
   - Diferenciais devem diferir por 1-2 critérios DSM apenas

2. EVITAR "ONE-WORD DIAGNOSIS":
   - NÃO use palavras-chave óbvias na vinheta
   - Descreva SINTOMAS e CONTEXTO, não o nome do transtorno
   - Exemplo: NÃO escreva "pânico" se diagnóstico é Transtorno de Pânico

3. NÍVEL DE DIFICULDADE:
   - basic: 1 opção claramente errada, 2 plausíveis, 1 correta
   - intermediate: 3 opções plausíveis, 1 correta (diferença sutil)
   - advanced: 4 opções igualmente plausíveis, critérios DSM diferenciam

4. VINHETA REALISTA:
   - 150-200 palavras
   - Português brasileiro natural
   - Contexto clínico realista (não acadêmico demais)
   - Idade 20-60 anos, profissões variadas

========================================
EXEMPLOS DE DIFERENCIAIS PLAUSÍVEIS:
========================================

Anxiety: TAG vs. Pânico vs. Fobia Social vs. Ajustamento
Mood: Depressão Maior vs. Distimia vs. Ajustamento vs. Bipolar (fase depr.)
Trauma: TEPT vs. Estresse Agudo vs. Ajustamento vs. TAG

========================================
SAÍDA JSON:
========================================

{
  "metadata": {
    "difficulty_level": "${level}",
    "category": "${category}",
    "disorder": "Diagnóstico específico DSM-5-TR"
  },
  "clinical_content": {
    "vignette": "Vinheta 150-200 palavras. DESCREVA sintomas e contexto, NÃO nomeie transtorno.",
    "session_context": "Sessão X, fase terapêutica, rapport (APENAS para FORMATO 3)",
    "demographics": {"name": "Nome brasileiro", "age": 20-60, "occupation": "Profissão"}
  },
  "diagnostic_structure": {
    "correct_diagnosis": "Diagnóstico DSM-5-TR completo",
    "criteria_present": ["Critério DSM A presente", "Critério B", "Critério C"],
    "differential_reasoning": "Por que diferenciais são plausíveis mas incorretos (1-2 frases)"
  },
  "question_format": {
    "format_type": "differential | criteria_absent | intervention",
    "question": "Pergunta específica do formato escolhido",
    "options": [
      "Opção correta",
      "Opção plausível 1",
      "Opção plausível 2",
      "Opção plausível 3"
    ],
    "correct_answer": "A opção correta (texto exato)",
    "rationale": "Por que a resposta correta é a melhor (2-3 frases)"
  }
}

PORTUGUÊS BRASILEIRO. Casos realistas. DSM-5-TR. ESCOLHA 1 FORMATO ALEATORIAMENTE.`
        },
        {
          role: 'user',
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

    logger.debug(`[Diagnostic] ✅ Caso novo salvo (id: ${newCase?.id})`);

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

    logger.debug(`[Diagnostic] Resposta: user=${userId}, correct=${is_correct}`);

    // 🆕 TENTAR ATUALIZAR REGISTRO EXISTENTE (visualização prévia)
    supabase
      .from('user_case_interactions')
      .update({
        is_correct,
        user_diagnosis: user_answer,
        user_answer: user_answer,
        correct_diagnosis,
        time_spent_seconds,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('case_id', case_id)
      .is('is_correct', null)
      .then(({ data, error: _error }) => {
        // Se não encontrou registro para atualizar, criar novo (fallback)
        if (!data || data.length === 0) {
          logger.debug('[Diagnostic] ℹ️ Nenhuma visualização prévia, criando novo registro');
          return supabase
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
            });
        } else {
          logger.debug('[Diagnostic] ✅ Visualização atualizada com resposta');
        }
      })
      .then(() => logger.debug('[Diagnostic] ✅ Interação registrada'));

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
      logger.debug('[Diagnostic] 🔄 Atualizando progresso do usuário...');
      await updateUserProgress(userId, 'diagnostic', is_correct);
      logger.debug('[Diagnostic] ✅ Progresso atualizado');
    } catch (progressError) {
      console.error('[Diagnostic] ⚠️ AVISO: Erro ao atualizar progresso, mas continuando...', progressError.message);
      // NÃO quebra o fluxo - feedback é mais importante
    }

    // ✅ Usar valores REAIS que são salvos no banco
    const xpGained = is_correct ? 5 : 1; // Diagnóstico: +5 acerto, +1 erro

    // ⚡ Feedback RÁPIDO com gpt-4o-mini
    let feedback = null;

    try {
      const feedbackCompletion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // RÁPIDO
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 600, // Curto = rápido
        messages: [
          {
            role: 'system',
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
            role: 'user',
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
              ? 'Você identificou corretamente o diagnóstico!'
              : `O diagnóstico correto é ${correct_diagnosis}.`
          },
          conectar: {
            theory_connection: 'Revise os critérios DSM-5-TR.'
          },
          orientar: {
            what_to_focus_next: 'Continue praticando.'
          }
        }
      };
    }

    // 🔥 Atualizar Streak e Missões
    let missionsCompleted = [];
    try {
      const { checkAndUpdateStreak } = require('../services/streakService');
      const { updateMissionProgress } = require('../services/missionService');
      const { recalculateICC } = require('../services/iccService');

      await checkAndUpdateStreak(userId, 'diagnostic');
      missionsCompleted = await updateMissionProgress(userId, 'diagnostic', is_correct) || [];
      recalculateICC(userId).catch(e => console.error('ICC bg error:', e.message));
    } catch (e) {
      console.error('Erro gamification:', e);
    }

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
    logger.debug('\n[updateUserProgress] 🎯 INICIANDO:', { userId, assistantType, isCorrect });

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
    logger.debug(`[updateUserProgress] 💧 Frescor aplicado: ${baseCognits} × multiplicador = ${finalCognits} cognits`);

    if (existing) {
      logger.debug('[updateUserProgress] 📝 Registro existe, atualizando...');

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

      logger.debug('[updateUserProgress] ✅ ATUALIZADO COM SUCESSO!');
    } else {
      logger.debug('[updateUserProgress] ➕ Registro NÃO existe, criando novo...');

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

      logger.debug('[updateUserProgress] ✅ CRIADO COM SUCESSO!');
    }
  } catch (error) {
    console.error('[updateUserProgress] ❌ ERRO:', error.message);
    console.error('[updateUserProgress] Stack:', error.stack);
    // NÃO faz throw - apenas loga
  }
}

module.exports = router;