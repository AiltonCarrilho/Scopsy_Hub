/**
 * Funções de Validação - Scopsy Backend
 *
 * Funções utilitárias para validar inputs do usuário
 */

/**
 * Valida formato de email
 * @param {string} email - Email a ser validado
 * @returns {boolean} True se válido, false caso contrário
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida formato de CRP (Conselho Regional de Psicologia)
 * Formato esperado: XX/XXXXX ou XX/XXXXXX (estado/número)
 * @param {string} crp - CRP a ser validado
 * @returns {boolean} True se válido, false caso contrário
 */
function isValidCRP(crp) {
  if (!crp || typeof crp !== 'string') {
    return false;
  }

  // Formato: 2 dígitos + / + 5 ou 6 dígitos
  // Exemplo: 06/12345 ou 01/123456
  const crpRegex = /^\d{2}\/\d{5,6}$/;
  return crpRegex.test(crp.trim());
}

/**
 * Valida força de senha
 * Critérios:
 * - Mínimo 8 caracteres
 * - Pelo menos 1 letra
 * - Pelo menos 1 número
 * @param {string} password - Senha a ser validada
 * @returns {boolean} True se válida, false caso contrário
 */
function isValidPassword(password) {
  if (!password || typeof password !== 'string') {
    return false;
  }

  // Mínimo 8 caracteres
  if (password.length < 8) {
    return false;
  }

  // Pelo menos uma letra
  if (!/[a-zA-Z]/.test(password)) {
    return false;
  }

  // Pelo menos um número
  if (!/[0-9]/.test(password)) {
    return false;
  }

  return true;
}

/**
 * Sanitiza string removendo tags HTML e caracteres perigosos
 * @param {string} input - String a ser sanitizada
 * @returns {string} String sanitizada
 */
function sanitizeString(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Valida se um valor é um número positivo
 * @param {any} value - Valor a ser validado
 * @returns {boolean} True se número positivo, false caso contrário
 */
function isPositiveNumber(value) {
  const num = Number(value);
  return !isNaN(num) && num > 0;
}

/**
 * Valida tipo de assistente
 * @param {string} type - Tipo do assistente
 * @returns {boolean} True se válido, false caso contrário
 */
function isValidAssistantType(type) {
  const validTypes = ['case', 'diagnostic', 'journey', 'orchestrator'];
  return validTypes.includes(type);
}

module.exports = {
  isValidEmail,
  isValidCRP,
  isValidPassword,
  sanitizeString,
  isPositiveNumber,
  isValidAssistantType,
};
