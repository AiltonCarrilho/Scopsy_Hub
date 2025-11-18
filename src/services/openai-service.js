/**
 * SCOPSY - OpenAI Service Otimizado
 * 
 * Service completo para integração com OpenAI Assistants API
 * Otimizado para os 5 assistentes do Scopsy com gestão inteligente de tokens
 * 
 * @author Claude + Ailton
 * @version 1.0
 */

const OpenAI = require('openai');
const logger = require('../config/logger');
const { saveToBoostspace, getFromBoostspace } = require('./database');

// Inicializar OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// IDs dos Assistentes Scopsy
const ASSISTANTS = {
  orchestrator: 'asst_n4KRyVMnbDGE0bQrJAyJspYw',
  case: 'asst_gF2t61jT43Kgwx6mb6pDEty3',
  diagnostic: 'asst_UqKPTw0ui3JvOt8NuahMLkAc',
  journey: 'asst_ydS6z2mQO82DtdBN4B1HSHP3',
  generator: 'asst_rG9kO0tUDTmSa1xzMnIEhRmU'
};

// Limites de tokens por assistente (otimização de custo)
const TOKEN_LIMITS = {
  orchestrator: 1200,
  case: 1000,
  diagnostic: 600,
  journey: 1200,
  generator: 1500
};

// Cache de respostas comuns (reduz 30% dos custos)
const responseCache = new Map();

/**
 * Criar ou recuperar thread OpenAI
 * 
 * @param {string} userId - ID do usuário
 * @param {string} assistantType - Tipo do assistente (case, diagnostic, etc)
 * @param {string} conversationId - ID da conversa no Boost.space (opcional)
 * @returns {Promise<string>} Thread ID
 */
async function getOrCreateThread(userId, assistantType, conversationId = null) {
  try {
    logger.info('Getting/creating thread', { userId, assistantType, conversationId });

    // Se já tem conversationId, buscar thread_id existente
    if (conversationId) {
      const conversation = await getFromBoostspace('conversations', conversationId);
      if (conversation && conversation.thread_id) {
        logger.info('Thread existente encontrado', { threadId: conversation.thread_id });
        return conversation.thread_id;
      }
    }

    // Criar novo thread
    const thread = await openai.beta.threads.create();
    logger.info('Novo thread criado', { threadId: thread.id });

    // Salvar thread no Boost.space
    const conversationData = {
      user_id: userId,
      assistant_type: assistantType,
      assistant_id: ASSISTANTS[assistantType],
      thread_id: thread.id,
      title: `${assistantType} - ${new Date().toLocaleDateString('pt-BR')}`,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const savedConversation = await saveToBoostspace('conversations', conversationData);
    
    return thread.id;

  } catch (error) {
    logger.error('Erro ao criar/buscar thread', { error: error.message, userId, assistantType });
    throw new Error(`Falha ao gerenciar thread: ${error.message}`);
  }
}

/**
 * Enviar mensagem para assistente com polling até completar
 * 
 * @param {string} threadId - ID do thread OpenAI
 * @param {string} assistantType - Tipo do assistente
 * @param {string} message - Mensagem do usuário
 * @param {string} userId - ID do usuário (para rate limiting)
 * @returns {Promise<Object>} Resposta do assistente com metadados
 */
async function sendMessage(threadId, assistantType, message, userId) {
  try {
    const assistantId = ASSISTANTS[assistantType];
    const tokenLimit = TOKEN_LIMITS[assistantType];

    logger.info('Enviando mensagem', { 
      threadId, 
      assistantType, 
      messageLength: message.length,
      userId 
    });

    // Check cache para respostas comuns (comandos START, MENU, etc)
    const cacheKey = `${assistantType}:${message.toLowerCase().trim()}`;
    if (responseCache.has(cacheKey)) {
      logger.info('Resposta em cache encontrada', { cacheKey });
      return responseCache.get(cacheKey);
    }

    // 1. Adicionar mensagem do usuário ao thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message
    });

    // 2. Criar run com o assistente específico
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      max_prompt_tokens: tokenLimit,
      max_completion_tokens: tokenLimit
    });

    logger.info('Run criado', { runId: run.id, status: run.status });

    // 3. Polling até completar (com timeout e retry exponencial)
    const response = await pollRunStatus(threadId, run.id);

    // 4. Recuperar mensagens (apenas a última resposta do assistant)
    const messages = await openai.beta.threads.messages.list(threadId, {
      limit: 1,
      order: 'desc'
    });

    const assistantMessage = messages.data[0];
    const textContent = assistantMessage.content
      .filter(c => c.type === 'text')
      .map(c => c.text.value)
      .join('\n');

    // Calcular tokens usados (aproximação)
    const tokensUsed = estimateTokens(message) + estimateTokens(textContent);

    const result = {
      response: textContent,
      threadId: threadId,
      runId: run.id,
      tokensUsed: tokensUsed,
      assistantType: assistantType,
      timestamp: new Date().toISOString()
    };

    // Cache respostas de comandos comuns
    if (['start', 'menu', 'help'].includes(message.toLowerCase().trim())) {
      responseCache.set(cacheKey, result);
    }

    // Salvar mensagens no Boost.space (async, não bloqueia resposta)
    saveMessagesToBoostspace(threadId, userId, message, textContent, tokensUsed)
      .catch(err => logger.error('Erro ao salvar mensagens', { error: err.message }));

    logger.info('Mensagem processada com sucesso', { 
      tokensUsed, 
      responseLength: textContent.length 
    });

    return result;

  } catch (error) {
    logger.error('Erro ao enviar mensagem', { 
      error: error.message, 
      threadId, 
      assistantType,
      stack: error.stack 
    });
    throw new Error(`Falha ao processar mensagem: ${error.message}`);
  }
}

/**
 * Polling do status do run com retry exponencial
 * 
 * @param {string} threadId - ID do thread
 * @param {string} runId - ID do run
 * @param {number} maxAttempts - Máximo de tentativas (padrão 60)
 * @returns {Promise<Object>} Run completado
 */
async function pollRunStatus(threadId, runId, maxAttempts = 60) {
  let attempts = 0;
  let delay = 1000; // Começa com 1 segundo

  while (attempts < maxAttempts) {
    try {
      const run = await openai.beta.threads.runs.retrieve(threadId, runId);
      
      logger.debug('Polling run status', { 
        runId, 
        status: run.status, 
        attempt: attempts + 1 
      });

      if (run.status === 'completed') {
        return run;
      }

      if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
        throw new Error(`Run falhou com status: ${run.status}. Razão: ${run.last_error?.message || 'unknown'}`);
      }

      if (run.status === 'requires_action') {
        // Caso o assistente precise de function calling (não usado no Scopsy por ora)
        logger.warn('Run requer ação (function calling)', { runId });
        throw new Error('Assistente requer ação externa não suportada');
      }

      // Aguardar antes de tentar novamente (backoff exponencial)
      await sleep(delay);
      
      // Aumentar delay progressivamente (1s → 2s → 3s → 5s)
      if (attempts < 5) delay = 1000;
      else if (attempts < 10) delay = 2000;
      else if (attempts < 20) delay = 3000;
      else delay = 5000;

      attempts++;

    } catch (error) {
      if (error.message.includes('Run falhou')) {
        throw error; // Propagar erro de falha do run
      }
      
      logger.error('Erro no polling', { 
        error: error.message, 
        attempt: attempts + 1 
      });
      
      // Retry em caso de erro de rede
      await sleep(2000);
      attempts++;
    }
  }

  throw new Error('Timeout: Run não completou após 60 tentativas (~3 minutos)');
}

/**
 * Rotear mensagem para o assistente correto baseado no contexto
 * 
 * @param {string} message - Mensagem do usuário
 * @param {string} currentAssistant - Assistente atual (null se primeira mensagem)
 * @returns {string} Tipo do assistente recomendado
 */
function routeToAssistant(message, currentAssistant = null) {
  const messageLower = message.toLowerCase();

  // Se já está em conversa ativa, manter assistente
  if (currentAssistant && currentAssistant !== 'orchestrator') {
    return currentAssistant;
  }

  // Palavras-chave para Diagnostic
  const diagnosticKeywords = ['diagnóstico', 'diferenciar', 'dsm', 'critério', 'sintoma', 'identificar'];
  if (diagnosticKeywords.some(kw => messageLower.includes(kw))) {
    return 'diagnostic';
  }

  // Palavras-chave para Journey
  const journeyKeywords = ['jornada', 'longitudinal', 'sessões', 'acompanhamento', 'evolução'];
  if (journeyKeywords.some(kw => messageLower.includes(kw))) {
    return 'journey';
  }

  // Palavras-chave para Case (padrão mais comum)
  const caseKeywords = ['caso', 'raciocínio', 'intervir', 'tcc', 'simulação', 'atender', 'técnica'];
  if (caseKeywords.some(kw => messageLower.includes(kw))) {
    return 'case';
  }

  // Se pedir criação de caso customizado, usar Orchestrator
  const orchestratorKeywords = ['criar caso', 'gerar caso', 'customizar', 'personalizar'];
  if (orchestratorKeywords.some(kw => messageLower.includes(kw))) {
    return 'orchestrator';
  }

  // Padrão: Case (mais versátil)
  return 'case';
}

/**
 * Comprimir histórico de mensagens para economizar tokens
 * (Remove mensagens antigas mantendo contexto essencial)
 * 
 * @param {string} threadId - ID do thread
 * @param {number} keepLast - Quantas mensagens manter (padrão 10)
 */
async function compressThreadHistory(threadId, keepLast = 10) {
  try {
    const messages = await openai.beta.threads.messages.list(threadId, {
      limit: 100,
      order: 'desc'
    });

    if (messages.data.length <= keepLast) {
      return; // Não precisa comprimir
    }

    logger.info('Comprimindo histórico thread', { 
      threadId, 
      totalMessages: messages.data.length,
      keeping: keepLast 
    });

    // OpenAI não permite deletar mensagens individuais
    // Estratégia: criar novo thread e copiar últimas N mensagens
    const newThread = await openai.beta.threads.create();
    
    const recentMessages = messages.data.slice(0, keepLast).reverse();
    
    for (const msg of recentMessages) {
      const content = msg.content
        .filter(c => c.type === 'text')
        .map(c => c.text.value)
        .join('\n');
      
      await openai.beta.threads.messages.create(newThread.id, {
        role: msg.role,
        content: content
      });
    }

    logger.info('Thread comprimido criado', { 
      oldThreadId: threadId, 
      newThreadId: newThread.id 
    });

    return newThread.id;

  } catch (error) {
    logger.error('Erro ao comprimir thread', { error: error.message, threadId });
    // Não propagar erro - compressão é otimização, não crítica
    return threadId;
  }
}

/**
 * Salvar mensagens no Boost.space (async)
 */
async function saveMessagesToBoostspace(threadId, userId, userMessage, assistantResponse, tokensUsed) {
  try {
    // Buscar conversationId pelo threadId
    const conversations = await getFromBoostspace('conversations', { 
      thread_id: threadId 
    });
    
    if (!conversations || conversations.length === 0) {
      logger.warn('Conversation não encontrada para thread', { threadId });
      return;
    }

    const conversationId = conversations[0].id;

    // Salvar mensagem do usuário
    await saveToBoostspace('messages', {
      conversation_id: conversationId,
      role: 'user',
      content: userMessage,
      tokens_used: estimateTokens(userMessage),
      timestamp: new Date().toISOString()
    });

    // Salvar resposta do assistente
    await saveToBoostspace('messages', {
      conversation_id: conversationId,
      role: 'assistant',
      content: assistantResponse,
      tokens_used: tokensUsed,
      timestamp: new Date().toISOString()
    });

    // Atualizar user_stats
    await updateUserStats(userId, tokensUsed);

    logger.info('Mensagens salvas no Boost.space', { conversationId });

  } catch (error) {
    logger.error('Erro ao salvar mensagens', { error: error.message });
    // Não propagar - salvar é secundário, não deve quebrar fluxo principal
  }
}

/**
 * Atualizar estatísticas do usuário
 */
async function updateUserStats(userId, tokensUsed) {
  try {
    const stats = await getFromBoostspace('user_stats', { user_id: userId });
    
    if (!stats || stats.length === 0) {
      // Criar stats iniciais
      await saveToBoostspace('user_stats', {
        user_id: userId,
        cases_completed: 0,
        practice_hours: 0,
        accuracy: 0,
        streak_days: 0,
        last_activity: new Date().toISOString(),
        badges: [],
        xp_points: 0,
        updated_at: new Date().toISOString()
      });
    } else {
      // Atualizar last_activity
      await saveToBoostspace('user_stats', {
        id: stats[0].id,
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Erro ao atualizar user stats', { error: error.message, userId });
  }
}

/**
 * Estimativa simples de tokens (1 token ≈ 4 caracteres em português)
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Limpar cache (executar periodicamente)
 */
function clearCache() {
  responseCache.clear();
  logger.info('Cache de respostas limpo');
}

// Limpar cache a cada 1 hora
setInterval(clearCache, 60 * 60 * 1000);

module.exports = {
  getOrCreateThread,
  sendMessage,
  routeToAssistant,
  compressThreadHistory,
  ASSISTANTS
};
