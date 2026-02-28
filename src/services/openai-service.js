/**
 * SCOPSY - OpenAI Service (Orquestrador)
 *
 * Refatorado em 3 módulos especializados para melhor maintainability:
 * - thread-manager.js: Gerenciamento de threads
 * - message-handler.js: Processamento de mensagens
 * - token-counter.js: Contagem de tokens e cache
 *
 * @version 2.0 (Refatorado 2026-02-28)
 */

// Re-exportar funções públicas dos módulos
const { getOrCreateThread, compressThreadHistory } = require('./thread-manager');
const { sendMessage, pollRunStatus, routeToAssistant } = require('./message-handler');
const { ASSISTANTS } = require('./constants');

module.exports = {
  // Thread management
  getOrCreateThread,
  compressThreadHistory,

  // Message handling
  sendMessage,
  pollRunStatus,
  routeToAssistant,

  // Constants
  ASSISTANTS
};
