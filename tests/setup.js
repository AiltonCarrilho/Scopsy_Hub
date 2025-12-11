/**
 * Setup Global para Testes do Scopsy
 *
 * Este arquivo é executado ANTES de todos os testes
 * Configurado em jest.config.js -> setupFilesAfterEnv
 */

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jest-testing';
process.env.PORT = '3001'; // Porta diferente para não conflitar com dev

// Supabase (valores fake para testes - não serão usados com mocks)
process.env.SUPABASE_URL = 'https://fake-supabase-url-for-tests.supabase.co';
process.env.SUPABASE_ANON_KEY = 'fake-anon-key-for-tests';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-role-key-for-tests';

// Suprimir logs durante testes (opcional)
// Descomente se quiser silenciar os logs do Winston
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Configurar timezone para evitar problemas com datas
process.env.TZ = 'America/Sao_Paulo';

// Aumentar timeout para testes que fazem chamadas externas (mesmo mockadas)
jest.setTimeout(10000);

// Adicionar matchers customizados (opcional)
expect.extend({
  toBeValidJWT(received) {
    const jwtRegex = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;
    const pass = jwtRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid JWT`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid JWT`,
        pass: false,
      };
    }
  },
});

// Log de início dos testes (opcional)
console.log('\n🧪 Iniciando Testes do Scopsy Backend...\n');
