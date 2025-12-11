/**
 * Configuração do Jest para Scopsy Backend
 *
 * Documentação: https://jestjs.io/docs/configuration
 */

module.exports = {
  // Ambiente de execução (Node.js para backend)
  testEnvironment: 'node',

  // Diretório onde os relatórios de coverage serão salvos
  coverageDirectory: 'coverage',

  // Padrões de arquivos de teste
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],

  // Arquivos a serem incluídos no coverage
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js', // Excluir entry point
    '!**/node_modules/**',
    '!**/tests/**'
  ],

  // Limpar mocks automaticamente entre cada teste
  clearMocks: true,

  // Resetar mocks entre testes
  resetMocks: true,

  // Restore mocks entre testes
  restoreMocks: true,

  // Setup files (executados antes de cada teste)
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Timeout padrão (10 segundos - útil para chamadas OpenAI mockadas)
  testTimeout: 10000,

  // Threshold mínimo de coverage (começar com 50%, depois aumentar)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },

  // Ignorar estes diretórios
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/frontend/' // Frontend será testado separadamente
  ],

  // Exibir relatório de coverage no console
  verbose: true
};
