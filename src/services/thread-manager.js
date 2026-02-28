/**
 * Thread Manager - Gerenciamento de threads OpenAI
 * Responsabilidade: Criar, recuperar e comprimir threads
 */

const OpenAI = require('openai');
const logger = require('../config/logger');
const { saveToBoostspace, getFromBoostspace } = require('./database');
const { ASSISTANTS } = require('./constants');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Criar ou recuperar thread OpenAI
 *
 * @param {string} userId - ID do usuário
 * @param {string} assistantType - Tipo do assistente
 * @param {string} conversationId - ID da conversa (opcional)
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

    await saveToBoostspace('conversations', conversationData);

    return thread.id;

  } catch (error) {
    logger.error('Erro ao criar/buscar thread', { error: error.message, userId, assistantType });
    throw new Error(`Falha ao gerenciar thread: ${error.message}`);
  }
}

/**
 * Comprimir histórico de mensagens (Remove antigas, mantém contexto)
 *
 * @param {string} threadId - ID do thread
 * @param {number} keepLast - Quantas mensagens manter
 * @returns {Promise<string>} ID do novo thread (ou threadId original se erro)
 */
async function compressThreadHistory(threadId, keepLast = 10) {
  try {
    const messages = await openai.beta.threads.messages.list(threadId, {
      limit: 100,
      order: 'desc'
    });

    if (messages.data.length <= keepLast) {
      return threadId; // Não precisa comprimir
    }

    logger.info('Comprimindo histórico thread', {
      threadId,
      totalMessages: messages.data.length,
      keeping: keepLast
    });

    // Criar novo thread e copiar últimas N mensagens
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
    return threadId; // Compressão é otimização, não crítica
  }
}

module.exports = {
  getOrCreateThread,
  compressThreadHistory
};
