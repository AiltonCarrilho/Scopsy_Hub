/**
 * Message Handler - Processamento de mensagens com assistentes
 * Responsabilidade: Enviar, fazer polling, salvar, rotear mensagens
 */

const OpenAI = require('openai');
const logger = require('../config/logger');
const { saveToBoostspace, getFromBoostspace } = require('./database');
const { ASSISTANTS, TOKEN_LIMITS } = require('./constants');
const {
  estimateTokens,
  updateUserStats,
  sleep,
  getCached,
  setCached
} = require('./token-counter');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Enviar mensagem para assistente com polling até completar
 *
 * @param {string} threadId - ID do thread OpenAI
 * @param {string} assistantType - Tipo do assistente
 * @param {string} message - Mensagem do usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Resposta com metadados
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

    // Check cache para respostas comuns
    const cacheKey = `${assistantType}:${message.toLowerCase().trim()}`;
    const cached = getCached(cacheKey);
    if (cached) {
      logger.info('Resposta em cache encontrada', { cacheKey });
      return cached;
    }

    // 1. Adicionar mensagem do usuário ao thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message
    });

    // 2. Criar run com o assistente
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      max_prompt_tokens: tokenLimit,
      max_completion_tokens: tokenLimit
    });

    logger.info('Run criado', { runId: run.id, status: run.status });

    // 3. Polling até completar
    await pollRunStatus(threadId, run.id);

    // 4. Recuperar mensagens (última resposta do assistant)
    const messages = await openai.beta.threads.messages.list(threadId, {
      limit: 1,
      order: 'desc'
    });

    const assistantMessage = messages.data[0];
    const textContent = assistantMessage.content
      .filter(c => c.type === 'text')
      .map(c => c.text.value)
      .join('\n');

    // Calcular tokens usados
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
      setCached(cacheKey, result);
    }

    // Salvar mensagens (async, não bloqueia)
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
  let delay = 1000;

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

      if (['failed', 'cancelled', 'expired'].includes(run.status)) {
        throw new Error(`Run falhou: ${run.status}. Razão: ${run.last_error?.message || 'unknown'}`);
      }

      if (run.status === 'requires_action') {
        logger.warn('Run requer ação (function calling)', { runId });
        throw new Error('Assistente requer ação externa não suportada');
      }

      // Backoff exponencial
      await sleep(delay);

      if (attempts < 5) {
        delay = 1000;
      } else if (attempts < 10) {
        delay = 2000;
      } else if (attempts < 20) {
        delay = 3000;
      } else {
        delay = 5000;
      }

      attempts++;

    } catch (error) {
      if (error.message.includes('Run falhou')) {
        throw error;
      }

      logger.error('Erro no polling', {
        error: error.message,
        attempt: attempts + 1
      });

      await sleep(2000);
      attempts++;
    }
  }

  throw new Error('Timeout: Run não completou (~3 minutos)');
}

/**
 * Rotear mensagem para o assistente correto
 *
 * @param {string} message - Mensagem do usuário
 * @param {string} currentAssistant - Assistente atual (null se primeira)
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

  // Palavras-chave para Case
  const caseKeywords = ['caso', 'raciocínio', 'intervir', 'tcc', 'simulação', 'atender', 'técnica'];
  if (caseKeywords.some(kw => messageLower.includes(kw))) {
    return 'case';
  }

  // Palavras-chave para Orchestrator
  const orchestratorKeywords = ['criar caso', 'gerar caso', 'customizar', 'personalizar'];
  if (orchestratorKeywords.some(kw => messageLower.includes(kw))) {
    return 'orchestrator';
  }

  // Padrão: Case
  return 'case';
}

/**
 * Salvar mensagens no Boost.space (async)
 *
 * @param {string} threadId - ID do thread
 * @param {string} userId - ID do usuário
 * @param {string} userMessage - Mensagem do usuário
 * @param {string} assistantResponse - Resposta do assistente
 * @param {number} tokensUsed - Tokens gastos
 * @returns {Promise<void>}
 */
async function saveMessagesToBoostspace(threadId, userId, userMessage, assistantResponse, tokensUsed) {
  try {
    const conversations = await getFromBoostspace('conversations', {
      thread_id: threadId
    });

    if (!conversations || conversations.length === 0) {
      logger.warn('Conversation não encontrada', { threadId });
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

    logger.info('Mensagens salvas', { conversationId });

  } catch (error) {
    logger.error('Erro ao salvar mensagens', { error: error.message });
    // Não propagar - salvar é secundário
  }
}

module.exports = {
  sendMessage,
  pollRunStatus,
  routeToAssistant,
  saveMessagesToBoostspace
};
