/**
 * Testes de Integração - Dashboard
 *
 * Testa a rota GET /api/dashboard/stats
 * Valida correção implementada: retornar dados reais (não zeros hardcoded)
 */

const request = require('supertest');
const express = require('express');
const { createMockSupabaseClient } = require('../mocks/supabase.mock');

// Mock do Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

// Mock do logger (para não poluir console durante testes)
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock do middleware de autenticação
jest.mock('../../src/middleware/auth', () => ({
  authenticateRequest: (req, res, next) => {
    // Simular usuário autenticado
    req.user = { userId: 'user-123' };
    next();
  },
  generateToken: jest.fn(),
  generateRefreshToken: jest.fn()
}));

const { createClient } = require('@supabase/supabase-js');

// Variável global para armazenar o mock atual
let currentSupabaseMock = null;

// Configurar createClient para usar o mock atual
createClient.mockImplementation(() => currentSupabaseMock);

// Criar app Express para testes
function createTestApp(supabaseMock) {
  // Atualizar mock global
  currentSupabaseMock = supabaseMock;

  const app = express();
  app.use(express.json());

  // Limpar e re-importar o dashboard router para pegar novo Supabase client
  delete require.cache[require.resolve('../../src/routes/dashboard')];
  const dashboardRouter = require('../../src/routes/dashboard');
  app.use('/api/dashboard', dashboardRouter);

  return app;
}

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // TESTE 1: Usuário com progresso (dados reais)
  // ============================================
  test('GET /stats deve retornar dados reais quando usuário tem progresso', async () => {
    // Arrange: Mock do Supabase com dados
    const mockData = {
      user_progress: [
        {
          user_id: 'user-123',
          assistant_type: 'case',
          total_cases: 10,
          correct_diagnoses: 8,
          cognits: 100,
          last_activity_date: new Date().toISOString().split('T')[0]
        },
        {
          user_id: 'user-123',
          assistant_type: 'diagnostic',
          total_cases: 5,
          correct_diagnoses: 4,
          cognits: 50,
          last_activity_date: new Date().toISOString().split('T')[0]
        }
      ],
      user_stats: [
        {
          user_id: 'user-123',
          streak_days: 3,
          badges: ['first-case', 'streak-7'],
          last_activity: new Date().toISOString()
        }
      ]
    };

    const supabaseMock = createMockSupabaseClient(mockData);
    const app = createTestApp(supabaseMock);

    // Act: Fazer request
    const response = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', 'Bearer fake-token');

    // Assert: Verificar resposta
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      cases_completed: 15, // 10 + 5
      accuracy: 80, // (8 + 4) / (10 + 5) * 100 = 80%
      cognits: 150, // 100 + 50 (mudança: xp_points → cognits)
      streak_days: 3,
      badges: ['first-case', 'streak-7']
    });

    // Verificar cálculo de practice_hours (15 casos * 10 min / 60)
    expect(response.body.practice_hours).toBeCloseTo(2.5, 1);
  });

  // ============================================
  // TESTE 2: Usuário novo (sem dados)
  // ============================================
  test('GET /stats deve retornar zeros quando usuário não tem dados', async () => {
    // Arrange: Mock vazio
    const mockData = {
      user_progress: [],
      user_stats: []
    };

    const supabaseMock = createMockSupabaseClient(mockData);
    const app = createTestApp(supabaseMock);

    // Act
    const response = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', 'Bearer fake-token');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      cases_completed: 0,
      practice_hours: 0,
      accuracy: 0,
      streak_days: 0,
      cognits: 0,
      badges: []
    });
  });

  // ============================================
  // TESTE 3: Cálculo correto de accuracy
  // ============================================
  test('GET /stats deve calcular accuracy corretamente', async () => {
    const mockData = {
      user_progress: [
        {
          user_id: 'user-123',
          total_cases: 20,
          correct_diagnoses: 19, // 95% accuracy
          cognits: 200
        }
      ],
      user_stats: [{ user_id: 'user-123' }]
    };

    const supabaseMock = createMockSupabaseClient(mockData);
    const app = createTestApp(supabaseMock);

    const response = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', 'Bearer fake-token');

    expect(response.status).toBe(200);
    expect(response.body.accuracy).toBe(95); // 19/20 * 100
  });

  // ============================================
  // TESTE 4: Accuracy = 0 quando nenhum caso completado
  // ============================================
  test('GET /stats deve retornar accuracy 0 quando não há casos', async () => {
    const mockData = {
      user_progress: [
        {
          user_id: 'user-123',
          total_cases: 0,
          correct_diagnoses: 0,
          cognits: 0
        }
      ],
      user_stats: [{ user_id: 'user-123' }]
    };

    const supabaseMock = createMockSupabaseClient(mockData);
    const app = createTestApp(supabaseMock);

    const response = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', 'Bearer fake-token');

    expect(response.status).toBe(200);
    expect(response.body.accuracy).toBe(0); // Evitar divisão por zero
  });

  // ============================================
  // TESTE 5: Cálculo correto de practice_hours
  // ============================================
  test('GET /stats deve calcular practice_hours corretamente (10 min/caso)', async () => {
    const mockData = {
      user_progress: [
        {
          user_id: 'user-123',
          total_cases: 30, // 30 casos * 10 min = 300 min = 5 horas
          correct_diagnoses: 25,
          cognits: 300
        }
      ],
      user_stats: [{ user_id: 'user-123' }]
    };

    const supabaseMock = createMockSupabaseClient(mockData);
    const app = createTestApp(supabaseMock);

    const response = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', 'Bearer fake-token');

    expect(response.status).toBe(200);
    expect(response.body.practice_hours).toBe(5); // 30 * 10 / 60 = 5
  });

  // ============================================
  // TESTE 6: Streak days quando ativo hoje
  // ============================================
  test('GET /stats deve retornar streak_days quando ativo hoje', async () => {
    const today = new Date().toISOString().split('T')[0];

    const mockData = {
      user_progress: [
        {
          user_id: 'user-123',
          total_cases: 5,
          correct_diagnoses: 4,
          cognits: 50,
          last_activity_date: today // Ativo hoje
        }
      ],
      user_stats: [
        {
          user_id: 'user-123',
          streak_days: 7
        }
      ]
    };

    const supabaseMock = createMockSupabaseClient(mockData);
    const app = createTestApp(supabaseMock);

    const response = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', 'Bearer fake-token');

    expect(response.status).toBe(200);
    expect(response.body.streak_days).toBe(7);
  });

  // ============================================
  // TESTE 7: Streak = 0 quando inativo por 2+ dias
  // ============================================
  test('GET /stats deve resetar streak quando inativo por 2+ dias', async () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];

    const mockData = {
      user_progress: [
        {
          user_id: 'user-123',
          total_cases: 5,
          correct_diagnoses: 4,
          cognits: 50,
          last_activity_date: threeDaysAgo // Último acesso há 3 dias
        }
      ],
      user_stats: [
        {
          user_id: 'user-123',
          streak_days: 7 // Tinha streak, mas perdeu
        }
      ]
    };

    const supabaseMock = createMockSupabaseClient(mockData);
    const app = createTestApp(supabaseMock);

    const response = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', 'Bearer fake-token');

    expect(response.status).toBe(200);
    expect(response.body.streak_days).toBe(0); // Resetado
  });

  // ============================================
  // TESTE 8: Requer autenticação (401 sem token)
  // ============================================
  test('GET /stats deve retornar 401 sem token de autenticação', async () => {
    const mockData = {};
    const supabaseMock = createMockSupabaseClient(mockData);
    const app = createTestApp(supabaseMock);

    const response = await request(app)
      .get('/api/dashboard/stats');
    // SEM header Authorization

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  // ============================================
  // TESTE 9: Aggregação de múltiplos assistentes
  // ============================================
  test('GET /stats deve agregar dados de todos os assistentes', async () => {
    const mockData = {
      user_progress: [
        {
          user_id: 'user-123',
          assistant_type: 'case',
          total_cases: 10,
          correct_diagnoses: 8,
          cognits: 100
        },
        {
          user_id: 'user-123',
          assistant_type: 'diagnostic',
          total_cases: 5,
          correct_diagnoses: 4,
          cognits: 50
        },
        {
          user_id: 'user-123',
          assistant_type: 'journey',
          total_cases: 3,
          correct_diagnoses: 3,
          cognits: 30
        }
      ],
      user_stats: [{ user_id: 'user-123' }]
    };

    const supabaseMock = createMockSupabaseClient(mockData);
    const app = createTestApp(supabaseMock);

    const response = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', 'Bearer fake-token');

    expect(response.status).toBe(200);
    expect(response.body.cases_completed).toBe(18); // 10 + 5 + 3
    expect(response.body.cognits).toBe(180); // 100 + 50 + 30
    expect(response.body.accuracy).toBe(83); // 15/18 * 100 ≈ 83%
  });
});
