const express = require('express');
const bcrypt = require('bcrypt');
const {
  generateToken,
  generateRefreshToken,
  authenticateRequest
} = require('../middleware/auth');
const {
  saveToBoostspace,
  getFromBoostspace,
  updateInBoostspace
} = require('../services/database');
const logger = require('../config/logger');

const router = express.Router();

/**
 * POST /api/auth/signup
 * Criar nova conta
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, crp } = req.body;

    // Validação básica
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Email, senha e nome são obrigatórios'
      });
    }

    // Validar formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Email inválido'
      });
    }

    // Validar senha (mínimo 8 caracteres)
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Senha deve ter no mínimo 8 caracteres'
      });
    }

    logger.info('Tentativa de signup', { email });

    // Verificar se email já existe
    const existingUsers = await getFromBoostspace('users', { email });

    if (existingUsers && existingUsers.length > 0) {
      logger.warn('Email já cadastrado', { email });
      return res.status(409).json({
        error: 'Email já cadastrado'
      });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12);

    // Criar usuário - ✅ GARANTIR created_at no formato ISO
    const now = new Date();
    const userData = {
      // id será gerado automaticamente pelo Supabase!
      email: email.toLowerCase(),
      password_hash: passwordHash,
      name,
      crp: crp || null,
      plan: 'free',
      stripe_customer_id: null,
      subscription_status: 'inactive',
      created_at: now.toISOString(), // ✅ Formato ISO 8601
      updated_at: now.toISOString(),
      last_login: null
    };

    // 🐞 DEBUG: Verificar formato da data
    logger.info('🐞 DEBUG SIGNUP - userData antes de salvar:', {
      email: userData.email,
      created_at: userData.created_at,
      created_at_type: typeof userData.created_at,
      created_at_isValid: !isNaN(new Date(userData.created_at).getTime())
    });

    // Salvar no Boost.space
    const savedUser = await saveToBoostspace('users', userData);

    // 🐞 DEBUG: Verificar dados após salvar
    logger.info('🐞 DEBUG SIGNUP - savedUser retornado:', {
      id: savedUser.id,
      email: savedUser.email,
      created_at: savedUser.created_at,
      created_at_type: typeof savedUser.created_at
    });

    // Gerar tokens
    const token = generateToken(savedUser.id, 'free');
    const refreshToken = generateRefreshToken(savedUser.id);

    logger.info('Usuário criado com sucesso', {
      userId: savedUser.id,
      email
    });

    // Retornar dados (sem senha!)
    res.status(201).json({
      message: 'Conta criada com sucesso',
      user: {
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        crp: savedUser.crp,
        plan: savedUser.plan
      },
      token,
      refreshToken
    });

  } catch (error) {
    logger.error('Erro no signup', { error: error.message });
    res.status(500).json({
      error: 'Erro ao criar conta',
      details: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Fazer login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email e senha são obrigatórios'
      });
    }

    logger.info('Tentativa de login', { email });

    // Buscar usuário
    const users = await getFromBoostspace('users', {
      email: email.toLowerCase()
    });

    if (!users || users.length === 0) {
      logger.warn('Email não encontrado', { email });
      return res.status(401).json({
        error: 'Email ou senha incorretos'
      });
    }

    const user = users[0];

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      logger.warn('Senha incorreta', { email });
      return res.status(401).json({
        error: 'Email ou senha incorretos'
      });
    }

    // ✅ Atualizar last_login (async, não bloqueia resposta)
    updateInBoostspace('users', user.id, {
      last_login: new Date().toISOString()
    }).catch(err => {
      logger.error('Erro ao atualizar last_login', { error: err.message, userId: user.id });
    });

    // Gerar tokens
    const token = generateToken(user.id, user.plan);
    const refreshToken = generateRefreshToken(user.id);

    logger.info('Login bem-sucedido', {
      userId: user.id,
      email
    });

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        crp: user.crp,
        plan: user.plan
      },
      token,
      refreshToken
    });

  } catch (error) {
    logger.error('Erro no login', { error: error.message });
    res.status(500).json({
      error: 'Erro ao fazer login',
      details: error.message
    });
  }
});

/**
 * GET /api/auth/me
 * Retornar dados do usuário autenticado
 */
router.get('/me', authenticateRequest, async (req, res) => {
  try {
    const userId = req.user.userId;

    logger.info('Buscando dados do usuário', { userId });

    // Buscar usuário
    const users = await getFromBoostspace('users', { id: userId });

    if (!users || users.length === 0) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    const user = users[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        crp: user.crp,
        plan: user.plan,
        created_at: user.created_at
      }
    });

  } catch (error) {
    logger.error('Erro ao buscar usuário', { error: error.message });
    res.status(500).json({
      error: 'Erro ao buscar dados do usuário'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (placeholder - JWT é stateless)
 */
router.post('/logout', (req, res) => {
  // Com JWT, logout é feito no client (deletar token)
  res.json({
    message: 'Logout realizado. Delete o token no client.'
  });
});

module.exports = router;