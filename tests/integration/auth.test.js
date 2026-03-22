/**
 * Testes de Integração - Autenticação
 *
 * Testa as rotas de autenticação:
 * - POST /api/auth/signup
 * - POST /api/auth/login
 * - GET /api/auth/me
 *
 * Valida correções implementadas: last_login update, validações
 */

const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');

// Mock do logger
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock do database
jest.mock('../../src/services/database');

// (Removido mock do middleware auth para gerar JWTs REAIS durante o teste para que a rota /me valide com sucesso)

const {
  saveToBoostspace,
  getFromBoostspace,
  updateInBoostspace
} = require('../../src/services/database');

const {
  resetMockDatabase,
  seedMockDatabase
} = require('../mocks/database.mock');

// Importar mocks do database
const databaseMock = require('../mocks/database.mock');

// Configurar mocks (movido para dentro do beforeEach devido ao resetMocks: true no jest.config.js!)
// saveToBoostspace.mockImplementation(...) 

// Criar app Express para testes
function createTestApp() {
  const app = express();
  app.use(express.json());

  const authRouter = require('../../src/routes/auth');
  app.use('/api/auth', authRouter);

  return app;
}

describe('Auth Integration Tests', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Re-aplicar os mocks aqui para sobreviver ao resetMocks do Jest!
    saveToBoostspace.mockImplementation(databaseMock.saveToBoostspace);
    getFromBoostspace.mockImplementation(databaseMock.getFromBoostspace);
    updateInBoostspace.mockImplementation(databaseMock.updateInBoostspace);
    
    resetMockDatabase();
    app = createTestApp();
  });

  // ============================================
  // TESTES: POST /api/auth/signup
  // ============================================
  describe('POST /api/auth/signup', () => {
    test('deve criar usuário com dados válidos', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'novo@teste.com',
          password: 'senha12345',
          name: 'Usuário Novo',
          crp: '06/12345'
        });

      if (response.status === 500) console.log("SIGNUP 500 ERROR:", response.body);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Conta criada com sucesso');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toMatchObject({
        email: 'novo@teste.com',
        name: 'Usuário Novo',
        crp: '06/12345',
        plan: 'free'
      });
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    test('deve normalizar email para lowercase', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'USUARIO@TESTE.COM',
          password: 'senha12345',
          name: 'Teste'
        });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe('usuario@teste.com');
    });

    test('deve retornar erro 400 quando faltar email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          password: 'senha12345',
          name: 'Teste'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email, senha e nome são obrigatórios');
    });

    test('deve retornar erro 400 quando faltar senha', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'teste@teste.com',
          name: 'Teste'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email, senha e nome são obrigatórios');
    });

    test('deve retornar erro 400 quando faltar nome', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'teste@teste.com',
          password: 'senha12345'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email, senha e nome são obrigatórios');
    });

    test('deve retornar erro 400 para email inválido', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'email-invalido',
          password: 'senha12345',
          name: 'Teste'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email inválido');
    });

    test('deve retornar erro 400 para senha muito curta', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'teste@teste.com',
          password: '123',  // Menos de 8 caracteres
          name: 'Teste'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Senha deve ter no mínimo 8 caracteres');
    });

    test('deve retornar erro 409 quando email já existe', async () => {
      // Primeiro signup
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'existente@teste.com',
          password: 'senha12345',
          name: 'Primeiro'
        });

      // Tentar criar novamente com mesmo email
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'existente@teste.com',
          password: 'outrasenha123',
          name: 'Segundo'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Email já cadastrado');
    });

    test('deve hashear a senha antes de salvar', async () => {
      const plainPassword = 'senha12345';

      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'hash@teste.com',
          password: plainPassword,
          name: 'Teste Hash'
        });

      // Verificar que saveToBoostspace foi chamado
      expect(saveToBoostspace).toHaveBeenCalled();

      // Pegar os dados que foram salvos
      const savedData = saveToBoostspace.mock.calls[0][1];

      // Verificar que password_hash existe e NÃO é a senha em texto plano
      expect(savedData.password_hash).toBeDefined();
      expect(savedData.password_hash).not.toBe(plainPassword);

      // Verificar que o hash é válido
      const isValid = await bcrypt.compare(plainPassword, savedData.password_hash);
      expect(isValid).toBe(true);
    });

    test('CRP é opcional (pode ser null)', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'semcrp@teste.com',
          password: 'senha12345',
          name: 'Sem CRP'
          // crp não enviado
        });

      expect(response.status).toBe(201);
      expect(response.body.user.crp).toBeNull();
    });
  });

  // ============================================
  // TESTES: POST /api/auth/login
  // ============================================
  describe('POST /api/auth/login', () => {
    // Criar usuário antes de cada teste de login
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'login@teste.com',
          password: 'senha12345',
          name: 'Teste Login',
          crp: '06/12345'
        });
    });

    test('deve fazer login com credenciais válidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@teste.com',
          password: 'senha12345'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login realizado com sucesso');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toMatchObject({
        email: 'login@teste.com',
        name: 'Teste Login',
        plan: 'free'
      });
    });

    test('deve aceitar email em uppercase (normalizar)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'LOGIN@TESTE.COM',  // Uppercase
          password: 'senha12345'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('login@teste.com');
    });

    test('deve retornar 401 para email inexistente', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'naoexiste@teste.com',
          password: 'senha12345'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Email ou senha incorretos');
    });

    test('deve retornar 401 para senha incorreta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@teste.com',
          password: 'senhaerrada123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Email ou senha incorretos');
    });

    test('deve retornar 400 quando faltar email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'senha12345'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email e senha são obrigatórios');
    });

    test('deve retornar 400 quando faltar senha', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@teste.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email e senha são obrigatórios');
    });

    test('✅ deve atualizar last_login ao fazer login', async () => {
      // Fazer login
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@teste.com',
          password: 'senha12345'
        });

      // Verificar que updateInBoostspace foi chamado
      expect(updateInBoostspace).toHaveBeenCalled();

      // Verificar que foi atualizado com last_login
      const updateCall = updateInBoostspace.mock.calls.find(
        call => call[0] === 'users' && call[2].last_login
      );

      expect(updateCall).toBeDefined();
      expect(updateCall[2].last_login).toBeDefined();

      // Verificar que é uma data válida
      const lastLogin = new Date(updateCall[2].last_login);
      expect(lastLogin.toString()).not.toBe('Invalid Date');
    });
  });

  // ============================================
  // TESTES: GET /api/auth/me
  // ============================================
  describe('GET /api/auth/me', () => {
    let userId;
    let token;

    beforeEach(async () => {
      // Criar usuário
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'me@teste.com',
          password: 'senha12345',
          name: 'Teste Me',
          crp: '06/99999'
        });

      userId = signupResponse.body.user.id;
      token = signupResponse.body.token;
    });

    test('deve retornar dados do usuário autenticado', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        id: userId,
        email: 'me@teste.com',
        name: 'Teste Me',
        crp: '06/99999',
        plan: 'free'
      });
      expect(response.body.user).toHaveProperty('created_at');
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    test('deve retornar 401 sem token', async () => {
      const response = await request(app)
        .get('/api/auth/me');
      // SEM header Authorization

      expect(response.status).toBe(401);
    });

    test('deve retornar 401 com token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token-invalido');

      expect(response.status).toBe(401);
    });
  });

  // ============================================
  // TESTES: POST /api/auth/logout
  // ============================================
  describe('POST /api/auth/logout', () => {
    test('deve retornar mensagem de logout (stateless)', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Logout realizado');
    });
  });
});
