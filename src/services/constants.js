/**
 * Constants - Configurações centralizadas para OpenAI Services
 */

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

module.exports = {
  ASSISTANTS,
  TOKEN_LIMITS
};
