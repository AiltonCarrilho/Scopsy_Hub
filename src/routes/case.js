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
// BIBLIOTECA DE MOMENTOS CRÍTICOS
// ========================================
const MOMENTOS_CRITICOS = {
  'ruptura_alianca': {
    title: 'Ruptura na Aliança',
    description: 'Cliente questiona terapeuta ou demonstra resistência'
  },
  'revelacao_dificil': {
    title: 'Revelação Sensível',
    description: 'Trauma, ideação, violência surge inesperadamente'
  },
  'intervencao_crucial': {
    title: 'Momento de Intervenção',
    description: 'Cliente pede conselho, chora, ou momento decisivo'
  },
  'resistencia_tecnica': {
    title: 'Resistência a Técnica',
    description: 'Cliente rejeita ou questiona intervenção proposta'
  },
  'dilema_etico': {
    title: 'Dilema Ético',
    description: 'Situação que exige navegação de limites'
  },
  'tecnica_oportuna': {
    title: 'Timing de Técnica',
    description: 'Momento certo para aplicar intervenção específica'
  }
};

// ========================================
// POST /api/case/generate
// Gera MICRO-MOMENTO ÚNICO por usuário
// ========================================
router.post('/generate', authenticateRequest, async (req, res) => {
  try {
    const {
      level = 'intermediate',
      moment_type = null,
      category = null, // 'clinical_moment' para conceituação
      disorder_category = null // 'anxiety', 'mood', 'psychotic', etc
    } = req.body;

    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    const userId = req.user.userId;

    // Determinar tipo de caso (micro-momento ou conceituação)
    const isMicroMoment = moment_type !== null;
    const isConceptualization = category === 'clinical_moment';

    console.log(`\n[Case] ${isMicroMoment ? '🎬 Micro-momento' : '📋 Conceituação'}: ${moment_type || category}, level=${level}, disorder=${disorder_category || 'qualquer'}, user=${userId}`);

    if (isConceptualization) {
      console.log('[Case] 📚 Filtrando apenas casos de conceituação completos (vinhetas 300-400 palavras)');
    }

    // 1️⃣ BUSCAR MICRO-MOMENTOS QUE O USUÁRIO JÁ VIU
    const { data: interactions, error: interError } = await supabase
      .from('user_case_interactions')
      .select('case_id, created_at')
      .eq('user_id', userId)
      .not('case_id', 'is', null)
      .order('created_at', { ascending: false });

    if (interError) {
      console.error('[Case] ❌ Erro ao buscar interações:', interError.message);
    }

    const seenCaseIds = interactions ? interactions.map(i => i.case_id) : [];

    console.log(`[Case] 👁️ Usuário já viu: ${seenCaseIds.length} micro-momentos`);
    if (seenCaseIds.length > 0) {
      console.log(`[Case] 📋 Últimos 5 IDs vistos:`);
      interactions.slice(0, 5).forEach((inter, idx) => {
        console.log(`  ${idx + 1}. ${inter.case_id} (${inter.created_at})`);
      });
    }

    // 2️⃣ BUSCAR CASOS DISPONÍVEIS (que usuário NÃO viu)
    let casesQuery = supabase
      .from('cases')
      .select('*')
      .eq('status', 'active')
      .eq('difficulty_level', level);

    // Filtrar por tipo (micro-momento OU conceituação)
    if (isMicroMoment) {
      casesQuery = casesQuery.eq('moment_type', moment_type);
    } else if (isConceptualization) {
      casesQuery = casesQuery
        .eq('category', 'clinical_moment')
        .eq('created_by', 'diverse_population_script'); // Só casos de conceituação completos

      // Filtrar por categoria de transtorno se especificado
      if (disorder_category) {
        // Mapeamento de categoria para padrões de nome
        const disorderPatterns = {
          'anxiety': ['Ansiedade', 'Pânico', 'Fobia', 'TAG'],
          'mood': ['Depressivo', 'Bipolar', 'Distimia', 'Ciclotímico'],  // "Depressivo" pega Depressão e Depressivo
          'trauma': ['Estresse', 'Trauma', 'TEPT', 'Adaptação', 'Dissociativo'],  // "Estresse" pega TEPT e Agudo
          'personality': ['Personalidade', 'Borderline', 'Narcisista'],
          'psychotic': ['Psicótico', 'Esquizofrenia', 'Delirante'],
          'eating': ['Alimentar', 'Anorexia', 'Bulimia'],
          'substance': ['Substância', 'Álcool', 'Dependência']
        };

        const patterns = disorderPatterns[disorder_category];
        if (patterns && patterns.length > 0) {
          // Usar primeiro padrão (mais genérico)
          casesQuery = casesQuery.ilike('disorder', `%${patterns[0]}%`);
          console.log(`[Case] 🎯 Filtrando por categoria: ${disorder_category} (padrão: ${patterns[0]})`);
        }
      }
    }

    // Buscar TODOS os casos que atendem critérios (SEM filtrar vistos ainda)
    const { data: allCases, error: queryError } = await casesQuery
      .order('times_used', { ascending: true });

    // Filtrar casos já vistos DEPOIS da query (mais confiável)
    let availableCases = allCases || [];
    if (seenCaseIds.length > 0 && availableCases.length > 0) {
      const beforeFilter = availableCases.length;
      availableCases = availableCases.filter(c => !seenCaseIds.includes(c.id));
      console.log(`[Case] 🚫 Filtrou ${beforeFilter - availableCases.length} casos já vistos (${availableCases.length} disponíveis)`);
    }

    // Limitar a 10 casos
    availableCases = availableCases.slice(0, 10);

    if (queryError) {
      console.error('[Case] ❌ Erro na query:', queryError.message);
      console.error('[Case] ❌ Detalhes:', queryError);
    }

    console.log(`[Case] 📦 Casos disponíveis no cache: ${availableCases ? availableCases.length : 0}`);
    if (availableCases && availableCases.length > 0) {
      console.log(`[Case] 📋 IDs disponíveis (top 5):`);
      availableCases.slice(0, 5).forEach((c, idx) => {
        console.log(`  ${idx + 1}. ${c.id} (usado ${c.times_used}x)`);
      });
    }

    // 3️⃣ ESCOLHER UM CASO ALEATÓRIO DOS MENOS USADOS
    let selectedCase = null;

    if (availableCases && availableCases.length > 0) {
      // Pegar um dos 3 menos usados aleatoriamente (mais variedade)
      const topCases = availableCases.slice(0, Math.min(3, availableCases.length));
      selectedCase = topCases[Math.floor(Math.random() * topCases.length)];

      console.log(`[Case] ✅ Caso do cache selecionado (id: ${selectedCase.id}, usado ${selectedCase.times_used}x)`);

      // Incrementar contador (assíncrono - não bloqueia resposta)
      supabase
        .from('cases')
        .update({
          times_used: selectedCase.times_used + 1
        })
        .eq('id', selectedCase.id)
        .then(({ error }) => {
          if (error) {
            console.error('[Case] ❌ Erro ao atualizar contador:', error.message);
          } else {
            console.log(`[Case] ✅ Contador atualizado`);
          }
        });

      // 🆕 REGISTRAR VISUALIZAÇÃO (anti-repetição)
      // Marca caso como "visto" antes de retornar para evitar repetição
      await supabase
        .from('user_case_interactions')
        .insert({
          user_id: userId,
          case_id: selectedCase.id,
          is_correct: null,  // Ainda não respondeu
          user_answer: null,
          time_spent_seconds: 0,
          difficulty_level: level,
          disorder_category: moment_type || disorder_category || null
        })
        .then(({ error }) => {
          if (error) {
            console.error('[Case] ⚠️ Erro ao registrar visualização:', error.message);
          } else {
            console.log('[Case] ✅ Visualização registrada (anti-repetição)');
          }
        });

      // RETORNO DIFERENTE para micro-momentos vs conceituação
      if (isMicroMoment) {
        // DESAFIOS: Retorna só case_content (compatibilidade)
        return res.json({
          success: true,
          case: selectedCase.case_content,
          case_id: selectedCase.id,
          from_cache: true
        });
      } else {
        // CONCEITUAÇÃO: Usar vignette existente ou montar se necessário
        let caseToReturn = { ...selectedCase };

        // Se NÃO tem vinheta completa, tentar montar de micro-momento
        if (!selectedCase.vignette || selectedCase.vignette.length <= 100) {
          if (selectedCase.case_content) {
            const cc = selectedCase.case_content;
            const ctx = cc.context || {};
            const cm = cc.critical_moment || {};

            // Só montar se tiver dados de micro-momento
            if (ctx.what_just_happened || cm.dialogue) {
              caseToReturn.vignette = `${ctx.session_number || 'Sessão'} com ${ctx.client_name || 'o cliente'}, ${ctx.client_age || '30'} anos.

DIAGNÓSTICO: ${ctx.diagnosis || selectedCase.disorder || 'A definir'}

CONTEXTO:
${ctx.what_just_happened || 'Início da sessão.'}

MOMENTO CLÍNICO:
${cm.dialogue || 'Diálogo não disponível'}

OBSERVAÇÕES NÃO-VERBAIS:
${cm.non_verbal || 'Não registrado'}

TOM EMOCIONAL: ${cm.emotional_tone || 'Neutro'}`;

              console.log('[Case] ✅ Vinheta montada a partir de micro-momento');
            } else {
              console.log('[Case] ⚠️ Caso sem vinheta e sem dados de micro-momento');
            }
          }
        } else {
          console.log('[Case] ✅ Usando vinheta completa do banco');
        }

        return res.json({
          success: true,
          case: caseToReturn,
          case_id: selectedCase.id,
          from_cache: true
        });
      }
    }

    // 4️⃣ SE NÃO TEM NO CACHE

    // Para CONCEITUAÇÃO: Não gerar on-demand, retornar mensagem
    if (isConceptualization) {
      console.log('[Case] ⚠️ Nenhum caso de conceituação disponível para estes critérios');
      return res.status(404).json({
        success: false,
        error: 'Nenhum caso disponível',
        message: `Não há casos de conceituação disponíveis para "${disorder_category}" no nível "${level}". Tente selecionar outra categoria ou nível.`,
        available_categories: ['anxiety', 'mood', 'trauma', 'personality', 'psychotic', 'eating', 'substance']
      });
    }

    // Para MICRO-MOMENTOS: Gerar on-demand
    console.log('[Case] ⏳ Cache vazio - Gerando novo micro-momento...');

    const momentInfo = MOMENTOS_CRITICOS[moment_type] || MOMENTOS_CRITICOS['resistencia_tecnica'];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // ⚡ RÁPIDO e barato para micro-momentos
      response_format: { type: "json_object" },
      temperature: 0.85,
      max_tokens: 1200, // Reduzido também
      messages: [
        {
          role: "system",
          content: `Você cria MICRO-MOMENTOS clínicos críticos para treino de psicólogos.

FORMATO: Momento específico de 30-60 segundos que exige DECISÃO IMEDIATA.

TIPO: ${momentInfo.title} - ${momentInfo.description}

SAÍDA JSON:
{
  "moment_type": "${moment_type}",
  "context": {
    "session_number": "Sessão 1-10",
    "client_name": "Nome brasileiro",
    "client_age": 20-60,
    "diagnosis": "Diagnóstico breve",
    "what_just_happened": "2-3 frases: O que aconteceu ANTES"
  },
  "critical_moment": {
    "dialogue": "Fala do cliente (40-80 palavras). REALISTA.",
    "non_verbal": "Linguagem corporal (1-2 frases)",
    "emotional_tone": "Tom emocional"
  },
  "decision_point": "O QUE VOCÊ DIZ/FAZ NOS PRÓXIMOS 30 SEGUNDOS?",
  "options": [
    {"letter": "A", "response": "Resposta A (15-30 palavras)", "approach": "Nome abordagem"},
    {"letter": "B", "response": "Resposta B (15-30 palavras)", "approach": "Nome abordagem"},
    {"letter": "C", "response": "Resposta C (15-30 palavras)", "approach": "Nome abordagem"},
    {"letter": "D", "response": "Resposta D (15-30 palavras)", "approach": "Nome abordagem"}
  ],
  "expert_choice": "A, B, C ou D",
  "expert_reasoning": {
    "why_this_works": "Por que funciona (3-4 frases)",
    "why_others_fail": {
      "option_X": "Por que falha (1-2 frases)",
      "option_Y": "Por que falha",
      "option_Z": "Por que falha"
    },
    "core_principle": "Princípio marcante (1 frase)",
    "what_happens_next": "O que acontece depois (2-3 frases)"
  },
  "learning_point": {
    "pattern_to_recognize": "Padrão futuro",
    "instant_response": "Resposta automática",
    "common_mistake": "Erro comum"
  }
}

REGRAS: Português BR, diálogo realista, 4 opções plausíveis.
NÍVEL ${level}: ${level === 'basic' ? 'Padrão claro' : level === 'intermediate' ? 'Nuances' : 'Complexo'}`
        },
        {
          role: "user",
          content: `Crie micro-momento "${moment_type}", nível ${level}. APENAS JSON.`
        }
      ]
    });

    const caseData = JSON.parse(completion.choices[0].message.content);

    // Salvar no cache
    const { data: newCase, error: insertError } = await supabase
      .from('cases')
      .insert({
        disorder: caseData.context?.diagnosis || 'Micro-Momento',
        difficulty_level: level,
        category: 'clinical_moment',
        moment_type: moment_type,
        case_content: caseData,
        vignette: caseData.critical_moment?.dialogue || '',
        status: 'active',
        times_used: 1,
        quality_score: 4.0,
        created_by: 'micro_moment_on_demand'
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Case] Erro ao salvar:', insertError);
    } else {
      console.log(`[Case] ✅ Novo micro-momento salvo (id: ${newCase.id})`);
    }

    // MONTAR VINHETA COMPLETA para retorno
    const ctx = caseData.context || {};
    const cm = caseData.critical_moment || {};

    const fullVignette = `${ctx.session_number || 'Sessão'} com ${ctx.client_name || 'o cliente'}, ${ctx.client_age || '30'} anos.

DIAGNÓSTICO: ${ctx.diagnosis || 'A definir'}

CONTEXTO:
${ctx.what_just_happened || 'Início da sessão.'}

MOMENTO CLÍNICO:
${cm.dialogue || 'Diálogo não disponível'}

OBSERVAÇÕES NÃO-VERBAIS:
${cm.non_verbal || 'Não registrado'}

TOM EMOCIONAL: ${cm.emotional_tone || 'Neutro'}`;

    res.json({
      success: true,
      case: {
        ...caseData,
        vignette: fullVignette
      },
      case_id: newCase?.id,
      from_cache: false
    });

  } catch (error) {
    console.error('[Case] ❌ Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// POST /api/case/analyze
// Feedback CIRÚRGICO sobre decisão
// ========================================
router.post('/analyze', authenticateRequest, async (req, res) => {
  try {
    const {
      case_data,
      user_choice,
      user_reasoning,
      time_spent_seconds
    } = req.body;
    const userId = req.user.userId;

    const is_correct = user_choice === case_data.expert_choice;

    console.log(`\n[Case] 📊 Análise: user=${userId}, escolha=${user_choice}, expert=${case_data.expert_choice}, correto=${is_correct}`);

    // CRÍTICO: Salvar interação
    const interactionData = {
      user_id: userId,
      case_id: case_data.case_id || case_data.id || null,
      user_answer: user_choice,
      correct_diagnosis: case_data.expert_choice,
      is_correct: is_correct,
      time_spent_seconds: time_spent_seconds || 0,
      difficulty_level: case_data.context?.difficulty_level || 'intermediate',
      disorder_category: case_data.moment_type || 'clinical_moment'
      // user_analysis removido temporariamente - verificar schema
    };

    console.log(`[Case] 💾 Salvando interação:`, {
      user_id: interactionData.user_id,
      case_id: interactionData.case_id,
      is_correct: interactionData.is_correct
    });

    // 🆕 TENTAR ATUALIZAR REGISTRO EXISTENTE (visualização prévia)
    const { data: updatedInteraction, error: updateError } = await supabase
      .from('user_case_interactions')
      .update({
        is_correct: interactionData.is_correct,
        user_answer: interactionData.user_answer,
        correct_diagnosis: interactionData.correct_diagnosis,
        time_spent_seconds: interactionData.time_spent_seconds,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('case_id', interactionData.case_id)
      .is('is_correct', null)  // Só atualizar se ainda não foi respondido
      .select();

    let savedInteraction = updatedInteraction;
    let interError = updateError;

    // Se não encontrou registro para atualizar, criar novo (fallback)
    if (!updatedInteraction || updatedInteraction.length === 0) {
      console.log('[Case] ℹ️ Nenhuma visualização prévia encontrada, criando novo registro');
      const { data: insertedInteraction, error: insertError } = await supabase
        .from('user_case_interactions')
        .insert(interactionData)
        .select();

      savedInteraction = insertedInteraction;
      interError = insertError;
    } else {
      console.log('[Case] ✅ Registro de visualização atualizado com resposta');
    }

    if (interError) {
      console.error('[Case] ❌ ERRO ao salvar interação:', interError.message);
      console.error('[Case] ❌ Detalhes:', interError);
      console.error('[Case] ❌ Dados enviados:', interactionData);
    } else {
      console.log('[Case] ✅ Interação salva com ID:', savedInteraction[0]?.id);
    }

    // ✅ Atualizar progresso (NÃO quebra se falhar)
    try {
      console.log('[Case] 🔄 Atualizando progresso do usuário...');
      await updateUserProgress(userId, 'case', is_correct);
      console.log('[Case] ✅ Progresso atualizado');
    } catch (progressError) {
      console.error('[Case] ⚠️ AVISO: Erro ao atualizar progresso, mas continuando...', progressError.message);
      // NÃO quebra o fluxo - feedback é mais importante
    }

    // XP (legacy - agora são cognits)
    // ✅ Usar valores REAIS que são salvos no banco
    const xpGained = is_correct ? 8 : 2; // Desafios: +8 acerto, +2 erro

    // Feedback estruturado
    const feedback = {
      is_correct: is_correct,
      user_choice: user_choice,
      expert_choice: case_data.expert_choice,

      immediate_feedback: is_correct
        ? `✅ Decisão de Expert! Você escolheu ${user_choice}.`
        : `💡 Um expert escolheria ${case_data.expert_choice}. Você escolheu ${user_choice}.`,

      expert_reasoning: case_data.expert_reasoning || {},
      learning_point: case_data.learning_point || {},

      user_reasoning_analysis: user_reasoning
        ? `Seu raciocínio: "${user_reasoning}"`
        : null
    };

    // 🔥 Atualizar Streak e Missões
    let missionsCompleted = [];
    try {
      const { checkAndUpdateStreak } = require('../services/streakService');
      const { updateMissionProgress } = require('../services/missionService');

      await checkAndUpdateStreak(userId, 'challenge');
      missionsCompleted = await updateMissionProgress(userId, 'challenge', true) || [];
    } catch (e) { console.error('Erro gamification:', e); }

    res.json({
      success: true,
      feedback,
      cognits_gained: xpGained,
      xp_gained: xpGained,
      missions_completed: missionsCompleted // 🎯 Retornar missões completadas
    });

  } catch (error) {
    console.error('[Case] ❌ Erro ao analisar:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// POST /api/case/conceptualize
// Feedback sobre conceituação profunda de caso
// ========================================
router.post('/conceptualize', authenticateRequest, async (req, res) => {
  try {
    const {
      case_data,
      conceptualization,
      time_spent_seconds
    } = req.body;
    const userId = req.user.userId;

    console.log(`\n[Case] 🧩 Analisando conceituação: user=${userId}`);

    // Montar vinheta se for caso de micro-momento
    let vignetteText = case_data.vignette || case_data.clinical_content?.vignette;

    if (!vignetteText && case_data.case_content) {
      const cc = case_data.case_content;
      const ctx = cc.context || {};
      const cm = cc.critical_moment || {};

      vignetteText = `${ctx.session_number || 'Sessão'} com ${ctx.client_name || 'o cliente'}, ${ctx.client_age || '30'} anos.

DIAGNÓSTICO: ${ctx.diagnosis || case_data.disorder || 'A definir'}

CONTEXTO:
${ctx.what_just_happened || 'Início da sessão.'}

MOMENTO CLÍNICO:
${cm.dialogue || 'Diálogo não disponível'}

OBSERVAÇÕES NÃO-VERBAIS:
${cm.non_verbal || 'Não registrado'}

TOM EMOCIONAL: ${cm.emotional_tone || 'Neutro'}`;

      console.log('[Case] ✅ Vinheta montada a partir de case_content');
    }

    // Registrar interação (sem user_analysis por enquanto)
    supabase
      .from('user_case_interactions')
      .insert({
        user_id: userId,
        case_id: case_data.case_id || case_data.id || null,
        time_spent_seconds: time_spent_seconds || 0,
        difficulty_level: case_data.metadata?.difficulty_level || 'intermediate',
        disorder_category: 'conceptualization'
        // user_analysis: JSON.stringify(conceptualization) - verificar schema
      })
      .then(() => console.log('[Case] ✅ Conceituação registrada'));

    // Feedback formativo com gpt-4o
    const feedbackCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: `Você é um supervisor clínico experiente que avalia conceituações de caso em TCC.

SAÍDA JSON:
{
  "triade_feedback": "Feedback sobre a tríade cognitiva identificada (3-4 frases). Valide o que foi bem captado e sugira o que pode aprofundar.",
  "crencas_feedback": "Feedback sobre as crenças identificadas (3-4 frases). Avalie a diferenciação entre centrais, intermediárias e automáticas.",
  "formulacao_feedback": "Feedback sobre a formulação conceitual (4-5 frases). Avalie compreensão de vulnerabilidades, gatilhos e mantenedores.",
  "intervencao_feedback": "Feedback sobre a estratégia proposta (3-4 frases). Avalie adequação das técnicas e timing.",
  "strengths": "2-3 pontos fortes específicos da análise do estudante.",
  "areas_to_develop": "2-3 áreas específicas para aprofundar estudo."
}

TOM: Validador e formativo. SEMPRE valide pontos fortes ANTES de sugerir melhorias.`
        },
        {
          role: "user",
          content: `CASO:
${vignetteText || 'Caso não disponível'}

CONCEITUAÇÃO DO ESTUDANTE:

TRÍADE COGNITIVA:
${conceptualization.triade_cognitiva}

CRENÇAS:
${conceptualization.crencas}

FORMULAÇÃO:
${conceptualization.formulacao_conceitual}

INTERVENÇÃO:
${conceptualization.estrategia_intervencao}

Forneça feedback formativo em JSON.`
        }
      ]
    });

    let feedback;
    try {
      const responseText = feedbackCompletion.choices[0].message.content;
      console.log('[Case] 📝 Resposta OpenAI recebida');
      feedback = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[Case] ❌ Erro ao fazer parse do feedback:', parseError.message);
      // Fallback: feedback estruturado padrão
      feedback = {
        triade_feedback: "Você identificou elementos importantes da tríade cognitiva. Continue praticando a conexão entre pensamentos, emoções e comportamentos.",
        crencas_feedback: "Sua análise das crenças mostra compreensão do modelo cognitivo. Continue desenvolvendo a diferenciação entre níveis de crenças.",
        formulacao_feedback: "Sua formulação capturou aspectos relevantes do caso. Continue integrando história, vulnerabilidades e fatores mantenedores.",
        intervencao_feedback: "As técnicas propostas são adequadas ao caso. Continue estudando o timing e sequenciamento de intervenções.",
        strengths: "Você demonstrou dedicação ao preencher todos os campos e aplicou conceitos teóricos ao caso prático.",
        areas_to_develop: "Continue estudando a integração entre teoria e prática clínica, e aprofunde seu conhecimento sobre formulação de caso."
      };
    }

    // ✅ Atualizar progresso (NÃO quebra se falhar)
    try {
      console.log('[Case] 🔄 Atualizando progresso (conceituação)...');
      await updateUserProgress(userId, 'case_conceptualization', null);
      console.log('[Case] ✅ Progresso de conceituação atualizado');
    } catch (progressError) {
      console.error('[Case] ⚠️ AVISO: Erro ao atualizar progresso, mas continuando...', progressError.message);
      // NÃO quebra o fluxo - feedback é mais importante
    }

    res.json({
      success: true,
      feedback,
      cognits_gained: 30 // ✅ Conceituação Cognitiva: +30 cognits por caso completo
    });

  } catch (error) {
    console.error('[Case] ❌ Erro ao processar conceituação:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      feedback: {
        triade_feedback: "Continue praticando a identificação da tríade cognitiva.",
        crencas_feedback: "O reconhecimento de crenças se desenvolve com prática.",
        formulacao_feedback: "Formulação de casos é uma habilidade que se refina com tempo.",
        intervencao_feedback: "Continue estudando técnicas de intervenção.",
        strengths: "Você demonstrou dedicação ao preencher todos os campos.",
        areas_to_develop: "Continue estudando e praticando conceituação de casos."
      }
    });
  }
});

// ========================================
// GET /api/case/moment-types
// Lista tipos de momentos disponíveis
// ========================================
router.get('/moment-types', authenticateRequest, async (req, res) => {
  res.json({
    success: true,
    moment_types: MOMENTOS_CRITICOS
  });
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

    // ✅ Cognits por módulo
    let baseCognits = 0;
    if (assistantType === 'case') {
      baseCognits = isCorrect ? 8 : 2; // Desafios: +8 acerto, +2 erro
    } else if (assistantType === 'diagnostic') {
      baseCognits = isCorrect ? 5 : 1; // Radar: +5 acerto, +1 erro
    } else if (assistantType === 'case_conceptualization') {
      baseCognits = 30; // Conceituação: +30 sempre
    } else if (assistantType === 'journey') {
      baseCognits = 25; // Jornada: +25 por sessão
    }

    // 💧 APLICAR MULTIPLICADOR DE FRESCOR (atualiza last_practice_date e recupera frescor gradualmente)
    const finalCognits = await applyFreshnessMultiplier(userId, baseCognits);
    console.log(`[updateUserProgress] 💧 Frescor aplicado: ${baseCognits} × multiplicador = ${finalCognits} cognits`);

    if (existing) {
      console.log('[updateUserProgress] 📝 Registro existe, atualizando...');
      console.log('[updateUserProgress] 📊 ANTES:', {
        total_cases: existing.total_cases,
        correct_diagnoses: existing.correct_diagnoses,
        cognits: existing.cognits
      });

      const newData = {
        total_cases: (existing.total_cases || 0) + 1,
        correct_diagnoses: (existing.correct_diagnoses || 0) + (isCorrect ? 1 : 0),
        xp_points: (existing.xp_points || 0) + finalCognits, // ✅ Cognits com multiplicador de frescor aplicado
        last_activity_date: new Date().toISOString().split('T')[0]
      };

      console.log('[updateUserProgress] 📊 DEPOIS:', newData);

      const { error: updateError } = await supabase
        .from('user_progress')
        .update(newData)
        .eq('id', existing.id);

      if (updateError) {
        console.error('[updateUserProgress] ❌ Erro ao atualizar:', updateError);
        throw updateError;
      }

      console.log('[updateUserProgress] ✅ ATUALIZADO COM SUCESSO!');
    } else {
      console.log('[updateUserProgress] ➕ Registro NÃO existe, criando novo...');

      const newData = {
        user_id: userId,
        assistant_type: assistantType,
        total_cases: 1,
        correct_diagnoses: isCorrect ? 1 : 0,
        xp_points: finalCognits, // ✅ Cognits com multiplicador de frescor aplicado
        last_activity_date: new Date().toISOString().split('T')[0]
      };

      console.log('[updateUserProgress] 📊 CRIANDO:', newData);

      const { error: insertError } = await supabase
        .from('user_progress')
        .insert(newData);

      if (insertError) {
        console.error('[updateUserProgress] ❌ Erro ao inserir:', insertError);
        throw insertError;
      }

      console.log('[updateUserProgress] ✅ CRIADO COM SUCESSO!');
    }
  } catch (error) {
    console.error('[updateUserProgress] ❌ ERRO:', error.message);
    console.error('[updateUserProgress] Stack:', error.stack);
    // NÃO faz throw - apenas loga para não quebrar o feedback
  }
}

// ========================================
// GET /api/case/series
// Lista séries de casos disponíveis
// ========================================
router.get('/series', authenticateRequest, async (req, res) => {
  try {
    const {
      difficulty_level,
      disorder_category
    } = req.query;

    console.log(`\n[Case Series] 📚 Listando séries disponíveis`);
    if (difficulty_level) console.log(`   Filtro: difficulty=${difficulty_level}`);
    if (disorder_category) console.log(`   Filtro: category=${disorder_category}`);

    let query = supabase
      .from('case_series')
      .select(`
        *,
        episodes:cases(count)
      `)
      .eq('status', 'active');

    if (difficulty_level) {
      query = query.eq('difficulty_level', difficulty_level);
    }

    if (disorder_category) {
      query = query.eq('disorder_category', disorder_category);
    }

    const { data: series, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Adicionar contagem de episódios disponíveis
    const enriched = await Promise.all(series.map(async (s) => {
      const { count } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('series_id', s.id)
        .eq('status', 'active');

      return {
        ...s,
        episodes_available: count || 0
      };
    }));

    console.log(`[Case Series] ✅ ${series.length} séries encontradas\n`);

    res.json({
      success: true,
      series: enriched,
      total: series.length
    });

  } catch (error) {
    console.error('[Case Series] ❌ Erro ao listar séries:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// GET /api/case/series/:series_id/next
// Retorna próximo episódio não visto da série
// ========================================
router.get('/series/:series_id/next', authenticateRequest, async (req, res) => {
  try {
    const { series_id } = req.params;
    const userId = req.user.userId;

    console.log(`\n[Case Series] 🎬 Próximo episódio da série ${series_id}, user=${userId}`);

    // 1. Buscar série
    const { data: series, error: seriesError } = await supabase
      .from('case_series')
      .select('*')
      .eq('id', series_id)
      .eq('status', 'active')
      .single();

    if (seriesError || !series) {
      return res.status(404).json({
        success: false,
        error: 'Série não encontrada'
      });
    }

    console.log(`[Case Series] 📚 Série: ${series.series_name}`);

    // 2. Buscar episódios já vistos pelo usuário
    const { data: seenEpisodes } = await supabase
      .from('user_case_interactions')
      .select('case_id')
      .eq('user_id', userId)
      .not('case_id', 'is', null);

    const seenCaseIds = seenEpisodes ? seenEpisodes.map(e => e.case_id) : [];

    console.log(`[Case Series] 👁️ Usuário já viu ${seenCaseIds.length} episódios desta série`);

    // 3. Buscar próximo episódio não visto
    let query = supabase
      .from('cases')
      .select('*')
      .eq('series_id', series_id)
      .eq('status', 'active')
      .order('episode_number', { ascending: true });

    if (seenCaseIds.length > 0) {
      query = query.not('id', 'in', `(${seenCaseIds.join(',')})`);
    }

    const { data: episodes, error: episodesError } = await query.limit(1);

    if (episodesError) throw episodesError;

    if (!episodes || episodes.length === 0) {
      console.log(`[Case Series] 🏁 Todos os episódios já foram vistos!`);
      return res.json({
        success: true,
        completed: true,
        message: `Parabéns! Você completou toda a série "${series.series_name}"`,
        series: series
      });
    }

    const nextEpisode = episodes[0];

    console.log(`[Case Series] ✅ Próximo episódio: #${nextEpisode.episode_number} - ${nextEpisode.episode_title}`);

    // Incrementar contador (assíncrono)
    supabase
      .from('cases')
      .update({ times_used: (nextEpisode.times_used || 0) + 1 })
      .eq('id', nextEpisode.id)
      .then(({ error }) => {
        if (error) console.error('[Case Series] Erro ao atualizar contador:', error.message);
      });

    res.json({
      success: true,
      series: series,
      episode: {
        ...nextEpisode,
        progress: {
          current: nextEpisode.episode_number,
          total: series.total_episodes,
          percentage: Math.round((nextEpisode.episode_number / series.total_episodes) * 100)
        }
      },
      case: nextEpisode.case_content,
      case_id: nextEpisode.id
    });

  } catch (error) {
    console.error('[Case Series] ❌ Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// GET /api/case/series/:series_id/progress
// Retorna progresso do usuário na série
// ========================================
router.get('/series/:series_id/progress', authenticateRequest, async (req, res) => {
  try {
    const { series_id } = req.params;
    const userId = req.user.userId;

    console.log(`\n[Case Series] 📊 Progresso na série ${series_id}, user=${userId}`);

    // Buscar série
    const { data: series } = await supabase
      .from('case_series')
      .select('*')
      .eq('id', series_id)
      .single();

    if (!series) {
      return res.status(404).json({ success: false, error: 'Série não encontrada' });
    }

    // Buscar todos os episódios da série
    const { data: allEpisodes } = await supabase
      .from('cases')
      .select('id, episode_number, episode_title')
      .eq('series_id', series_id)
      .eq('status', 'active')
      .order('episode_number');

    // Buscar episódios que o usuário viu
    const { data: userInteractions } = await supabase
      .from('user_case_interactions')
      .select('case_id, is_correct, created_at')
      .eq('user_id', userId)
      .in('case_id', allEpisodes.map(e => e.id));

    const seenIds = new Set(userInteractions?.map(i => i.case_id) || []);

    const progress = allEpisodes.map(ep => ({
      episode_number: ep.episode_number,
      episode_title: ep.episode_title,
      completed: seenIds.has(ep.id),
      interaction: userInteractions?.find(i => i.case_id === ep.id)
    }));

    const completed = progress.filter(p => p.completed).length;
    const total = allEpisodes.length;

    console.log(`[Case Series] ✅ Progresso: ${completed}/${total} episódios`);

    res.json({
      success: true,
      series: series,
      progress: {
        completed: completed,
        total: total,
        percentage: Math.round((completed / total) * 100),
        episodes: progress,
        is_complete: completed === total
      }
    });

  } catch (error) {
    console.error('[Case Series] ❌ Erro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;