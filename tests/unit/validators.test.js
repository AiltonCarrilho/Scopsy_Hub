/**
 * Testes Unitários - Validators
 *
 * Este arquivo testa as funções de validação em src/utils/validators.js
 * Cada função tem múltiplos casos de teste (sucesso e falha)
 */

const {
  isValidEmail,
  isValidCRP,
  isValidPassword,
  sanitizeString,
  isPositiveNumber,
  isValidAssistantType,
} = require('../../src/utils/validators');

// ============================================
// TESTES: isValidEmail()
// ============================================
describe('isValidEmail', () => {
  test('deve retornar true para email válido', () => {
    expect(isValidEmail('usuario@scopsy.com.br')).toBe(true);
    expect(isValidEmail('teste@gmail.com')).toBe(true);
    expect(isValidEmail('joao.silva@hotmail.com')).toBe(true);
  });

  test('deve retornar false para email inválido', () => {
    expect(isValidEmail('email-sem-arroba.com')).toBe(false);
    expect(isValidEmail('@sem-usuario.com')).toBe(false);
    expect(isValidEmail('sem-dominio@')).toBe(false);
    expect(isValidEmail('sem.extensao@dominio')).toBe(false);
  });

  test('deve retornar false para valores não-string', () => {
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(123)).toBe(false);
    expect(isValidEmail({})).toBe(false);
  });

  test('deve trimmar espaços antes de validar', () => {
    expect(isValidEmail('  usuario@scopsy.com.br  ')).toBe(true);
  });
});

// ============================================
// TESTES: isValidCRP()
// ============================================
describe('isValidCRP', () => {
  test('deve retornar true para CRP válido', () => {
    expect(isValidCRP('06/12345')).toBe(true);
    expect(isValidCRP('01/123456')).toBe(true);
    expect(isValidCRP('12/54321')).toBe(true);
  });

  test('deve retornar false para CRP inválido', () => {
    expect(isValidCRP('6/12345')).toBe(false); // Estado com 1 dígito
    expect(isValidCRP('06/1234')).toBe(false); // Número com 4 dígitos
    expect(isValidCRP('06-12345')).toBe(false); // Separador errado
    expect(isValidCRP('0612345')).toBe(false); // Sem separador
  });

  test('deve retornar false para valores não-string', () => {
    expect(isValidCRP(null)).toBe(false);
    expect(isValidCRP(undefined)).toBe(false);
    expect(isValidCRP(612345)).toBe(false);
  });
});

// ============================================
// TESTES: isValidPassword()
// ============================================
describe('isValidPassword', () => {
  test('deve retornar true para senha válida', () => {
    expect(isValidPassword('senha123')).toBe(true);
    expect(isValidPassword('Abc12345')).toBe(true);
    expect(isValidPassword('senhaForte999')).toBe(true);
  });

  test('deve retornar false para senha muito curta', () => {
    expect(isValidPassword('abc123')).toBe(false); // Menos de 8 caracteres
    expect(isValidPassword('1234567')).toBe(false); // 7 caracteres
  });

  test('deve retornar false para senha sem letra', () => {
    expect(isValidPassword('12345678')).toBe(false); // Só números
  });

  test('deve retornar false para senha sem número', () => {
    expect(isValidPassword('senhasemnum')).toBe(false); // Só letras
  });

  test('deve retornar false para valores não-string', () => {
    expect(isValidPassword(null)).toBe(false);
    expect(isValidPassword(undefined)).toBe(false);
    expect(isValidPassword(12345678)).toBe(false);
  });
});

// ============================================
// TESTES: sanitizeString()
// ============================================
describe('sanitizeString', () => {
  test('deve escapar tags HTML', () => {
    expect(sanitizeString('<script>alert("XSS")</script>'))
      .toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
  });

  test('deve escapar caracteres perigosos', () => {
    expect(sanitizeString('<>"\'/')).toBe('&lt;&gt;&quot;&#x27;&#x2F;');
  });

  test('deve trimmar espaços', () => {
    expect(sanitizeString('  texto com espaços  ')).toBe('texto com espaços');
  });

  test('deve retornar string vazia para valores inválidos', () => {
    expect(sanitizeString(null)).toBe('');
    expect(sanitizeString(undefined)).toBe('');
    expect(sanitizeString(123)).toBe('');
  });

  test('deve preservar texto normal', () => {
    expect(sanitizeString('Texto normal sem caracteres especiais'))
      .toBe('Texto normal sem caracteres especiais');
  });
});

// ============================================
// TESTES: isPositiveNumber()
// ============================================
describe('isPositiveNumber', () => {
  test('deve retornar true para números positivos', () => {
    expect(isPositiveNumber(1)).toBe(true);
    expect(isPositiveNumber(100)).toBe(true);
    expect(isPositiveNumber(0.5)).toBe(true);
    expect(isPositiveNumber('42')).toBe(true); // String número
  });

  test('deve retornar false para zero e negativos', () => {
    expect(isPositiveNumber(0)).toBe(false);
    expect(isPositiveNumber(-1)).toBe(false);
    expect(isPositiveNumber(-100)).toBe(false);
  });

  test('deve retornar false para não-números', () => {
    expect(isPositiveNumber('abc')).toBe(false);
    expect(isPositiveNumber(null)).toBe(false);
    expect(isPositiveNumber(undefined)).toBe(false);
    expect(isPositiveNumber({})).toBe(false);
  });
});

// ============================================
// TESTES: isValidAssistantType()
// ============================================
describe('isValidAssistantType', () => {
  test('deve retornar true para tipos válidos', () => {
    expect(isValidAssistantType('case')).toBe(true);
    expect(isValidAssistantType('diagnostic')).toBe(true);
    expect(isValidAssistantType('journey')).toBe(true);
    expect(isValidAssistantType('orchestrator')).toBe(true);
  });

  test('deve retornar false para tipos inválidos', () => {
    expect(isValidAssistantType('generator')).toBe(false);
    expect(isValidAssistantType('invalid')).toBe(false);
    expect(isValidAssistantType('CASE')).toBe(false); // Case-sensitive
    expect(isValidAssistantType('')).toBe(false);
  });

  test('deve retornar false para valores não-string', () => {
    expect(isValidAssistantType(null)).toBe(false);
    expect(isValidAssistantType(undefined)).toBe(false);
    expect(isValidAssistantType(123)).toBe(false);
  });
});
