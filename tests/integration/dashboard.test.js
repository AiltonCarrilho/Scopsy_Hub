/**
 * Testes de Integração - Dashboard
 *
 * Testa a rota GET /api/dashboard/stats
 * Valida correção implementada: retornar dados reais (não zeros hardcoded)
 */

const request = require('supertest');
const express = require('express');
const { createMockSupabaseClient } = require('../mocks/supabase.mock');

// Mock do logger (para não poluir console durante testes)
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock do middleware de autenticação (APENAS SIMULA DECODE, não ignora requisição sem header)
jest.mock('../../src/middleware/auth', () => {
  const original = jest.requireActual('../../src/middleware/auth');
  return {
    ...original,
    authenticateRequest: (req, res, next) => {
      // Simular verificação do JWT
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido ou inválido' });
      }
      req.user = { userId: 'user-123' };
      next();
    }
  };
});

const { supabase } = require('../../src/services/supabase');

// Criar app Express para testes
function createTestApp(supabaseMock) {
  // Injetar o mock diretamente na instância do supabase exportada!
  supabase.from = supabaseMock.from;

  const app = express();
  app.use(express.json());

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
          xp_points: 100,
          last_activity_date: new Date().toISOString().split('T')[0]
        },
        {
          user_id: 'user-123',
          assistant_type: 'diagnostic',
          total_cases: 5,
          correct_diagnoses: 4,
          xp_points: 50,
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
      desafios_clinicos: {
        total_cases: 10,
        xp_points: 100
      },
      radar_diagnostico: {
        total_cases: 5,
        xp_points: 50
      },
      badges: 2,
      badges_list: ['first-case', 'streak-7']
    });
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
      desafios_clinicos: { total_cases: 0, xp_points: 0 },
      conceituacao_cognitiva: { total_cases: 0, xp_points: 0 },
      radar_diagnostico: { total_cases: 0, xp_points: 0 },
      jornada_terapeutica: { total_sessions: 0, xp_points: 0 },
      badges: 0,
      badges_list: []
    });
  });

  // TESTE SUBSTITUÍDO: As rotas antigas de accuracy, practice_hours e streak foram 
  // migrados para o frontend ou removidos após o refactor modular do backend!
  // ============================================

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
  // TESTE 9: Multi-assistentes agregados
  // ============================================
  test('GET /stats deve exibir dados modulares de múltiplos assistentes', async () => {
    const mockData = {
      user_progress: [
        {
          user_id: 'user-123',
          assistant_type: 'case',
          total_cases: 10,
          xp_points: 100
        },
        {
          user_id: 'user-123',
          assistant_type: 'diagnostic',
          total_cases: 5,
          xp_points: 50
        },
        {
          user_id: 'user-123',
          assistant_type: 'journey',
          total_sessions: 3,
          xp_points: 30
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
    expect(response.body.desafios_clinicos.total_cases).toBe(10);
    expect(response.body.radar_diagnostico.xp_points).toBe(50);
    expect(response.body.jornada_terapeutica.total_sessions).toBe(3);
  });
});
