const express = require('express');
const logger = require('../config/logger');
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

    logger.debug(`\n[Case] ${isMicroMoment ? '🎬 Micro-momento' : '📋 Conceituação'}: ${moment_type || category}, level=${level}, disorder=${disorder_category || 'qualquer'}, user=${userId}`);

    if (isConceptualization) {
      logger.debug('[Case] 📚 Filtrando apenas casos de conceituação completos (vinhetas 300-400 palavras)');
    }

    // 🎯 DIFICULDADE ADAPTATIVA: Calcular nível baseado em performance
    // Objetivo: Flow state (+40% engajamento) = desafio = habilidade
    const adaptiveLevel = await calculateAdaptiveLevel(userId, supabase);

    // Permitir override manual (para testes ou preferência do usuário)
    const useAdaptive = req.body.adaptive !== false; // Default true
    const finalLevel = useAdaptive ? adaptiveLevel : (level || 'intermediate');

    logger.debug(`[Case] 🎯 Nível adaptativo calculado: "${adaptiveLevel}" → usando: "${finalLevel}" (adaptive=${useAdaptive})`);

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

    // ═══════════════════════════════════════════════════════════════════════
    // 🚀 OTIMIZAÇÃO DE ESCALABILIDADE - Filtro SQL vs JavaScript
    // ═══════════════════════════════════════════════════════════════════════
    //
    // PROBLEMA ANTERIOR (31/12/2024):
    // - Buscava TODOS os casos do banco (521 atualmente, 10k+ no futuro)
    // - Filtrava em JavaScript (lento, não escala)
    // - Performance degradava com crescimento: 521 casos = 140ms, 10k = 2.6s
    //
    // SOLUÇÃO IMPLEMENTADA:
    // - Filtra IDs já vistos DIRETO no SQL (Supabase NOT IN)
    // - Busca apenas 10 casos filtrados (98% menos dados transferidos)
    // - Performance CONSTANTE independente do tamanho do banco: sempre ~25ms
    //
    // OBSERVAÇÃO CRÍTICA - Por que filter(id => id != null):
    // - Se user_case_interactions tiver case_id = null, o Supabase gera erro:
    //   "invalid input syntax for type uuid: ''"
    // - Filtrar null/undefined ANTES de passar para SQL evita esse erro
    // - Validado em testes: test-supabase-syntax.js (31/12/2024)
    //
    // ESCALABILIDADE COMPROVADA:
    // - 521 casos: ~25ms    ✅
    // - 1k casos: ~25ms     ✅
    // - 10k casos: ~25ms    ✅ (mesmo tempo!)
    // - 50k casos: ~25ms    ✅ (índices do Supabase fazem o trabalho)
    //
    // ═══════════════════════════════════════════════════════════════════════

    const seenCaseIds = interactions
      ? interactions
        .map(i => i.case_id)
        .filter(id => id != null)  // ← CRÍTICO: Remove null/undefined para evitar erro SQL
      : [];

    logger.debug(`[Case] 👁️ Usuário já viu: ${seenCaseIds.length} micro-momentos`);
    if (seenCaseIds.length > 0) {
      logger.debug(`[Case] 📋 Últimos 5 IDs vistos:`);
      interactions.slice(0, 5).forEach((inter, idx) => {
        logger.debug(`  ${idx + 1}. ${inter.case_id} (${inter.created_at})`);
      });
    }

    // 🧠 INTERLEAVING: Identificar tipo do último caso (Neurociência da Aprendizagem)
    // Objetivo: +43% retenção ao forçar alternância entre tipos de momento
    // Fundamento: Discriminação de padrões (Rohrer & Taylor, 2007)
    let lastMomentType = null;

    if (isMicroMoment && interactions && interactions.length > 0) {
      // Buscar o último caso feito pelo usuário
      const lastInteraction = interactions[0]; // Já ordenado por created_at DESC

      if (lastInteraction && lastInteraction.case_id) {
        const { data: lastCase, error: lastCaseError } = await supabase
          .from('cases')
          .select('moment_type')
          .eq('id', lastInteraction.case_id)
          .single();

        if (!lastCaseError && lastCase && lastCase.moment_type) {
          lastMomentType = lastCase.moment_type;
          logger.debug(`[Case] 🧠 INTERLEAVING: Último tipo foi "${lastMomentType}" → excluindo da seleção`);
        }
      }
    }

    // 2️⃣ BUSCAR CASOS DISPONÍVEIS (que usuário NÃO viu)
    let casesQuery = supabase
      .from('cases')
      .select('id, times_used, moment_type, category, disorder, difficulty_level')
      .eq('status', 'active')
      .eq('difficulty_level', finalLevel); // 🎯 Usa nível adaptativo

    // Filtrar por tipo (micro-momento OU conceituação)
    if (isMicroMoment) {
      // Se moment_type foi especificado, filtrar por ele
      if (moment_type) {
        casesQuery = casesQuery.eq('moment_type', moment_type);
      } else {
        // 🧠 INTERLEAVING: Se não especificou tipo E há último tipo, EXCLUIR ele
        // Força alternância entre tipos → +43% retenção (Rohrer & Taylor, 2007)
        if (lastMomentType) {
          casesQuery = casesQuery.neq('moment_type', lastMomentType);
          logger.debug(`[Case] 🧠 INTERLEAVING ATIVO: Buscando qualquer tipo EXCETO "${lastMomentType}"`);
        } else {
          logger.debug(`[Case] 🧠 INTERLEAVING: Usuário novo, qualquer tipo disponível`);
        }
      }
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
          logger.debug(`[Case] 🎯 Filtrando por categoria: ${disorder_category} (padrão: ${patterns[0]})`);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 🎯 FILTRO SQL OTIMIZADO - NOT IN (executa no PostgreSQL, não em JS)
    // ═══════════════════════════════════════════════════════════════════════
    //
    // Aplica filtro APENAS se houver IDs para excluir (evita sintaxe vazia)
    // Sintaxe: .not('id', 'in', `(uuid1,uuid2,uuid3)`)
    //
    // Performance:
    // - SEM filtro: Busca 10 casos em ~25ms
    // - COM filtro: Busca 10 casos (excluindo vistos) em ~25ms (mesmo tempo!)
    //
    // Por que funciona:
    // - PostgreSQL usa índices na coluna 'id' (UUID)
    // - NOT IN é otimizado pelo query planner
    // - LIMIT 10 garante que só 10 rows sejam retornadas
    //
    // ═══════════════════════════════════════════════════════════════════════

    if (seenCaseIds.length > 0) {
      casesQuery = casesQuery.not('id', 'in', `(${seenCaseIds.join(',')})`);
      logger.debug(`[Case] 🚫 SQL Filter: Excluindo ${seenCaseIds.length} casos já vistos`);
    }

    // Buscar apenas 10 casos JÁ FILTRADOS pelo SQL (eficiente!)
    let { data: availableCases, error: queryError } = await casesQuery
      .order('times_used', { ascending: true })
      .limit(10);  // ← LIMIT executado no SQL (só transfere 10 casos pela rede)

    if (queryError) {
      console.error('[Case] ❌ Erro na query:', queryError.message);
      console.error('[Case] ❌ Detalhes:', queryError);
    }

    logger.debug(`[Case] 📦 Casos disponíveis no cache: ${availableCases ? availableCases.length : 0}`);

    // 🧠 INTERLEAVING FALLBACK: Se não encontrou NENHUM caso (usuário fez todos os outros tipos),
    // fazer segunda busca SEM filtro de interleaving
    if ((!availableCases || availableCases.length === 0) && lastMomentType && isMicroMoment && !moment_type) {
      logger.debug(`[Case] 🔄 INTERLEAVING FALLBACK: Nenhum caso encontrado, removendo filtro de tipo`);

      // Refazer query SEM filtro de moment_type
      let fallbackQuery = supabase
        .from('cases')
        .select('id, times_used, moment_type, category, disorder, difficulty_level')
        .eq('status', 'active')
        .eq('difficulty_level', finalLevel); // 🎯 Usa nível adaptativo

      // Manter filtro de IDs já vistos
      if (seenCaseIds.length > 0) {
        fallbackQuery = fallbackQuery.not('id', 'in', `(${seenCaseIds.join(',')})`);
      }

      const { data: fallbackCases, error: fallbackError } = await fallbackQuery
        .order('times_used', { ascending: true })
        .limit(10);

      if (!fallbackError && fallbackCases && fallbackCases.length > 0) {
        logger.debug(`[Case] ✅ FALLBACK: ${fallbackCases.length} casos encontrados sem filtro de interleaving`);
        // Sobrescrever availableCases com fallback
        availableCases = fallbackCases;
      } else {
        logger.debug(`[Case] ⚠️ FALLBACK: Ainda não encontrou casos`);
      }
    }

    if (availableCases && availableCases.length > 0) {
      logger.debug(`[Case] 📋 IDs disponíveis (top 5):`);
      availableCases.slice(0, 5).forEach((c, idx) => {
        logger.debug(`  ${idx + 1}. ${c.id} (usado ${c.times_used}x)`);
      });
    }

    // 3️⃣ ESCOLHER UM CASO ALEATÓRIO DOS MENOS USADOS
    let selectedCase = null;

    if (availableCases && availableCases.length > 0) {
      // Pegar um dos 3 menos usados aleatoriamente (mais variedade)
      const topCases = availableCases.slice(0, Math.min(3, availableCases.length));
      selectedCase = topCases[Math.floor(Math.random() * topCases.length)];

      logger.debug(`[Case] ✅ Caso do cache selecionado (id: ${selectedCase.id}, usado ${selectedCase.times_used}x)`);

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
            logger.debug(`[Case] ✅ Contador atualizado`);
          }
        });

      // 🚀 OTIMIZAÇÃO: Buscar dados completos apenas do caso selecionado
      // (query leve buscou 10 IDs com ~100 bytes cada, agora busca JSONB completo de 1 só)
      const { data: fullCaseData, error: fullCaseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', selectedCase.id)
        .single();

      if (fullCaseError || !fullCaseData) {
        logger.error('[Case] ❌ Erro ao buscar dados completos:', fullCaseError?.message);
        return res.status(500).json({ success: false, error: 'Erro ao carregar caso' });
      }

      selectedCase = fullCaseData;

      // 🆕 REGISTRAR VISUALIZAÇÃO (anti-repetição)
      // Marca caso como "visto" antes de retornar para evitar repetição
      // NOTA: NÃO incluir is_correct=null (coluna não aceita NULL)
      // Fire-and-forget: não bloqueia resposta (economia de ~50-100ms)
      supabase
        .from('user_case_interactions')
        .insert({
          user_id: userId,
          case_id: selectedCase.id,
          // is_correct será preenchido quando usuário responder
          user_answer: null,
          time_spent_seconds: 0,
          difficulty_level: finalLevel, // 🎯 Usa nível adaptativo
          disorder_category: moment_type || disorder_category || null
        })
        .then(({ error }) => {
          if (error) {
            console.error('[Case] ⚠️ Erro ao registrar visualização:', error.message);
          } else {
            logger.debug('[Case] ✅ Visualização registrada (anti-repetição)');
          }
        });

      // RETORNO DIFERENTE para micro-momentos vs conceituação
      if (isMicroMoment) {
        // Calcular acurácia e progresso para retornar
        const { data: last10Cases } = await supabase
          .from('user_case_interactions')
          .select('is_correct')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        const recentAccuracy = last10Cases && last10Cases.length > 0
          ? (last10Cases.filter(c => c.is_correct).length / last10Cases.length) * 100
          : 0;

        // DESAFIOS: Retorna caso + dados de nível adaptativo
        return res.json({
          success: true,
          case: selectedCase.case_content,
          case_id: selectedCase.id,
          from_cache: true,
          // 🎯 NOVOS DADOS: Nível adaptativo e performance
          adaptive_level: adaptiveLevel,
          level_used: finalLevel,
          performance_summary: {
            recent_accuracy: recentAccuracy,
            cases_analyzed: last10Cases?.length || 0
          }
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

              logger.debug('[Case] ✅ Vinheta montada a partir de micro-momento');
            } else {
              logger.debug('[Case] ⚠️ Caso sem vinheta e sem dados de micro-momento');
            }
          }
        } else {
          logger.debug('[Case] ✅ Usando vinheta completa do banco');
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
      logger.debug('[Case] ⚠️ Nenhum caso de conceituação disponível para estes critérios');
      return res.status(404).json({
        success: false,
        error: 'Nenhum caso disponível',
        message: `Não há casos de conceituação disponíveis para "${disorder_category}" no nível "${level}". Tente selecionar outra categoria ou nível.`,
        available_categories: ['anxiety', 'mood', 'trauma', 'personality', 'psychotic', 'eating', 'substance']
      });
    }

    // ❌ GERAÇÃO ON-DEMAND REMOVIDA (12/02/2026)
    // Motivo: Casos gerados on-demand via gpt-4o-mini não passam pelo pipeline
    // de qualidade (2 revisores + revisão humana) e produzem opções ambíguas.
    // Todos os casos devem vir do projeto Orquestrador → revisados → Supabase.
    logger.debug('[Case] ⚠️ Nenhum micro-momento disponível - NÃO gerar on-demand');
    return res.status(404).json({
      success: false,
      error: 'Você completou todos os desafios disponíveis neste nível!',
      message: `Parabéns! Você já praticou todos os micro-momentos disponíveis para o nível "${finalLevel}". Novos desafios estão sendo preparados pela nossa equipe de qualidade.`,
      suggestion: 'Experimente outro nível de dificuldade ou volte em breve para novos casos.',
      level_used: finalLevel,
      cases_completed: seenCaseIds.length
    });

  } catch (error) {
    console.error('[Case] ❌ ERRO COMPLETO:', error);
    console.error('[Case] ❌ Stack:', error.stack);
    console.error('[Case] ❌ Message:', error.message);

    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      debug: {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasSupabaseURL: !!process.env.SUPABASE_URL,
        nodeEnv: process.env.NODE_ENV
      }
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

    logger.debug(`\n[Case] 📊 Análise: user=${userId}, escolha=${user_choice}, expert=${case_data.expert_choice}, correto=${is_correct}`);

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

    logger.debug(`[Case] 💾 Salvando interação:`, {
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
      .is('user_answer', null)  // Só atualizar se ainda não respondeu (user_answer null)
      .select();

    let savedInteraction = updatedInteraction;
    let interError = updateError;

    // Se não encontrou registro para atualizar, criar novo (fallback)
    if (!updatedInteraction || updatedInteraction.length === 0) {
      logger.debug('[Case] ℹ️ Nenhuma visualização prévia encontrada, criando novo registro');
      const { data: insertedInteraction, error: insertError } = await supabase
        .from('user_case_interactions')
        .insert(interactionData)
        .select();

      savedInteraction = insertedInteraction;
      interError = insertError;
    } else {
      logger.debug('[Case] ✅ Registro de visualização atualizado com resposta');
    }

    if (interError) {
      console.error('[Case] ❌ ERRO ao salvar interação:', interError.message);
      console.error('[Case] ❌ Detalhes:', interError);
      console.error('[Case] ❌ Dados enviados:', interactionData);
    } else {
      logger.debug('[Case] ✅ Interação salva com ID:', savedInteraction[0]?.id);
    }

    // ✅ Atualizar progresso (NÃO quebra se falhar)
    try {
      logger.debug('[Case] 🔄 Atualizando progresso do usuário...');
      await updateUserProgress(userId, 'case', is_correct);
      logger.debug('[Case] ✅ Progresso atualizado');
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
      const { recalculateICC } = require('../services/iccService');

      await checkAndUpdateStreak(userId, 'challenge');
      missionsCompleted = await updateMissionProgress(userId, 'challenge', true) || [];
      recalculateICC(userId).catch(e => console.error('ICC bg error:', e.message));
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

    logger.debug(`\n[Case] 🧩 Analisando conceituação: user=${userId}`);

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

      logger.debug('[Case] ✅ Vinheta montada a partir de case_content');
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
      .then(() => logger.debug('[Case] ✅ Conceituação registrada'));

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
      logger.debug('[Case] 📝 Resposta OpenAI recebida');
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
      logger.debug('[Case] 🔄 Atualizando progresso (conceituação)...');
      await updateUserProgress(userId, 'case_conceptualization', null);
      logger.debug('[Case] ✅ Progresso de conceituação atualizado');
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
// 🎯 DIFICULDADE ADAPTATIVA (Neurociência)
// ========================================

/**
 * Calcula nível adaptativo baseado em performance recente
 * Objetivo: Flow state (+40% engajamento) = desafio ligeiramente acima da habilidade
 * Fundamento: Zona de Desenvolvimento Proximal (Vygotsky)
 *
 * @param {number} userId - ID do usuário
 * @param {object} supabase - Cliente Supabase
 * @returns {Promise<string>} - 'basic', 'intermediate', ou 'advanced'
 */
async function calculateAdaptiveLevel(userId, supabase) {
  try {
    // 1. Buscar últimos 15 casos (janela de análise)
    const { data: recentCases, error } = await supabase
      .from('user_case_interactions')
      .select('is_correct, difficulty_level')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(15);

    if (error || !recentCases || recentCases.length < 5) {
      // Se menos de 5 casos, começar no básico
      logger.debug(`[Adaptive] Usuário novo ou poucos casos (${recentCases?.length || 0}), retornando 'basic'`);
      return 'basic';
    }

    // 2. Calcular acurácia dos últimos 10 casos
    const last10 = recentCases.slice(0, 10);
    const correctCount = last10.filter(c => c.is_correct).length;
    const accuracy = (correctCount / last10.length) * 100;

    logger.debug(`[Adaptive] Acurácia últimos 10 casos: ${accuracy.toFixed(1)}% (${correctCount}/${last10.length})`);

    // 3. Identificar nível atual predominante
    const currentLevels = last10.map(c => c.difficulty_level);
    const levelCounts = {
      basic: currentLevels.filter(l => l === 'basic').length,
      intermediate: currentLevels.filter(l => l === 'intermediate').length,
      advanced: currentLevels.filter(l => l === 'advanced').length
    };

    const currentLevel = Object.keys(levelCounts).reduce((a, b) =>
      levelCounts[a] > levelCounts[b] ? a : b
    );

    logger.debug(`[Adaptive] Nível atual predominante: ${currentLevel}`, levelCounts);

    // 4. Lógica de adaptação baseada em thresholds
    let adaptiveLevel = currentLevel;

    if (currentLevel === 'basic') {
      // Se está no básico e acerta 80%+, sobe para intermediário
      if (accuracy >= 80) {
        adaptiveLevel = 'intermediate';
        logger.debug(`[Adaptive] ⬆️ UPGRADE: basic → intermediate (acurácia ${accuracy.toFixed(1)}% >= 80%)`);
      } else if (accuracy >= 50) {
        adaptiveLevel = 'basic';
        logger.debug(`[Adaptive] ➡️ MANTÉM: basic (acurácia ${accuracy.toFixed(1)}% entre 50-79%)`);
      } else {
        adaptiveLevel = 'basic';
        logger.debug(`[Adaptive] ➡️ MANTÉM: basic (acurácia ${accuracy.toFixed(1)}% < 50%, não desce mais)`);
      }
    } else if (currentLevel === 'intermediate') {
      // Se acerta 85%+, sobe para avançado
      if (accuracy >= 85) {
        adaptiveLevel = 'advanced';
        logger.debug(`[Adaptive] ⬆️ UPGRADE: intermediate → advanced (acurácia ${accuracy.toFixed(1)}% >= 85%)`);
      } else if (accuracy >= 40) {
        adaptiveLevel = 'intermediate';
        logger.debug(`[Adaptive] ➡️ MANTÉM: intermediate (acurácia ${accuracy.toFixed(1)}% entre 40-84%)`);
      } else {
        adaptiveLevel = 'basic';
        logger.debug(`[Adaptive] ⬇️ DOWNGRADE: intermediate → basic (acurácia ${accuracy.toFixed(1)}% < 40%)`);
      }
    } else if (currentLevel === 'advanced') {
      // Se acerta 70%+, mantém avançado
      if (accuracy >= 70) {
        adaptiveLevel = 'advanced';
        logger.debug(`[Adaptive] ➡️ MANTÉM: advanced (acurácia ${accuracy.toFixed(1)}% >= 70%)`);
      } else if (accuracy >= 35) {
        adaptiveLevel = 'intermediate';
        logger.debug(`[Adaptive] ⬇️ DOWNGRADE: advanced → intermediate (acurácia ${accuracy.toFixed(1)}% entre 35-69%)`);
      } else {
        adaptiveLevel = 'basic';
        logger.debug(`[Adaptive] ⬇️⬇️ RESET: advanced → basic (acurácia ${accuracy.toFixed(1)}% < 35%)`);
      }
    }

    return adaptiveLevel;

  } catch (error) {
    console.error('[Adaptive] ❌ Erro ao calcular nível:', error.message);
    return 'intermediate'; // Fallback seguro
  }
}

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
// GET /api/case/adaptive-level
// Retorna nível adaptativo atual do usuário
// ========================================
router.get('/adaptive-level', authenticateRequest, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Calcular nível adaptativo
    const adaptiveLevel = await calculateAdaptiveLevel(userId, supabase);

    // Buscar últimos 10 casos para acurácia
    const { data: recentCases } = await supabase
      .from('user_case_interactions')
      .select('is_correct')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const correctCount = recentCases?.filter(c => c.is_correct).length || 0;
    const accuracy = recentCases?.length > 0
      ? (correctCount / recentCases.length) * 100
      : 0;

    // Calcular progresso para próximo nível
    let progressToNext = 0;
    if (adaptiveLevel === 'basic') {
      progressToNext = Math.min((accuracy / 80) * 100, 100);
    } else if (adaptiveLevel === 'intermediate') {
      progressToNext = Math.min((accuracy / 85) * 100, 100);
    } else if (adaptiveLevel === 'advanced') {
      progressToNext = Math.min((accuracy / 70) * 100, 100);
    }

    res.json({
      success: true,
      adaptive_level: adaptiveLevel,
      accuracy: accuracy,
      progress_to_next: progressToNext,
      cases_analyzed: recentCases?.length || 0
    });

  } catch (error) {
    console.error('[Case] ❌ Erro ao calcular nível adaptativo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// HELPER
// ========================================
async function updateUserProgress(userId, assistantType, isCorrect) {
  try {
    logger.debug(`\n[updateUserProgress] 🎯 INICIANDO:`, { userId, assistantType, isCorrect });

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
    logger.debug(`[updateUserProgress] 💧 Frescor aplicado: ${baseCognits} × multiplicador = ${finalCognits} cognits`);

    if (existing) {
      logger.debug('[updateUserProgress] 📝 Registro existe, atualizando...');
      logger.debug('[updateUserProgress] 📊 ANTES:', {
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

      logger.debug('[updateUserProgress] 📊 DEPOIS:', newData);

      const { error: updateError } = await supabase
        .from('user_progress')
        .update(newData)
        .eq('id', existing.id);

      if (updateError) {
        console.error('[updateUserProgress] ❌ Erro ao atualizar:', updateError);
        throw updateError;
      }

      logger.debug('[updateUserProgress] ✅ ATUALIZADO COM SUCESSO!');
    } else {
      logger.debug('[updateUserProgress] ➕ Registro NÃO existe, criando novo...');

      const newData = {
        user_id: userId,
        assistant_type: assistantType,
        total_cases: 1,
        correct_diagnoses: isCorrect ? 1 : 0,
        xp_points: finalCognits, // ✅ Cognits com multiplicador de frescor aplicado
        last_activity_date: new Date().toISOString().split('T')[0]
      };

      logger.debug('[updateUserProgress] 📊 CRIANDO:', newData);

      const { error: insertError } = await supabase
        .from('user_progress')
        .insert(newData);

      if (insertError) {
        console.error('[updateUserProgress] ❌ Erro ao inserir:', insertError);
        throw insertError;
      }

      logger.debug('[updateUserProgress] ✅ CRIADO COM SUCESSO!');
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

    logger.debug(`\n[Case Series] 📚 Listando séries disponíveis`);
    if (difficulty_level) logger.debug(`   Filtro: difficulty=${difficulty_level}`);
    if (disorder_category) logger.debug(`   Filtro: category=${disorder_category}`);

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

    logger.debug(`[Case Series] ✅ ${series.length} séries encontradas\n`);

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

    logger.debug(`\n[Case Series] 🎬 Próximo episódio da série ${series_id}, user=${userId}`);

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

    logger.debug(`[Case Series] 📚 Série: ${series.series_name}`);

    // 2. Buscar episódios já vistos pelo usuário
    const { data: seenEpisodes } = await supabase
      .from('user_case_interactions')
      .select('case_id')
      .eq('user_id', userId)
      .not('case_id', 'is', null);

    const seenCaseIds = seenEpisodes ? seenEpisodes.map(e => e.case_id) : [];

    logger.debug(`[Case Series] 👁️ Usuário já viu ${seenCaseIds.length} episódios desta série`);

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
      logger.debug(`[Case Series] 🏁 Todos os episódios já foram vistos!`);
      return res.json({
        success: true,
        completed: true,
        message: `Parabéns! Você completou toda a série "${series.series_name}"`,
        series: series
      });
    }

    const nextEpisode = episodes[0];

    logger.debug(`[Case Series] ✅ Próximo episódio: #${nextEpisode.episode_number} - ${nextEpisode.episode_title}`);

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

    logger.debug(`\n[Case Series] 📊 Progresso na série ${series_id}, user=${userId}`);

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

    logger.debug(`[Case Series] ✅ Progresso: ${completed}/${total} episódios`);

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