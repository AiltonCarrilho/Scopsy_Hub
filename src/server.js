// ========================================
// SERVER.JS - SCOPSY (VERSÃO CORRIGIDA)
// ========================================

// 🔒 Usar .env.local apenas em desenvolvimento
// Em produção, usar variáveis de ambiente do sistema (Render)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.local' });
}
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./config/logger');


// ========================================
// 1. EXPRESS + SERVER
// ========================================
const app = express();

// Trust proxy (necessário para Render/Heroku/etc)
app.set('trust proxy', 1);

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? [
        // 🔒 PRODUÇÃO - Apenas domínios oficiais
        'https://www.scopsy.com.br',
        'https://scopsy.com.br',
        'https://lab.scopsy.com.br',
        'https://app.scopsy.com.br',
        process.env.FRONTEND_URL
      ].filter(Boolean)
      : [
        // 🛠️ DESENVOLVIMENTO - Portas locais comuns
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:5500',  // VSCode Live Server
        'http://localhost:5501',
        'http://localhost:5502',
        'http://localhost:5503',
        'http://localhost:5504',
        'http://localhost:5505',
        'http://localhost:5173',  // Vite
        'http://localhost:8080',  // Webpack dev server
        'http://localhost:8000',  // Python/outros
        'http://localhost:4200',  // Angular
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:5500',  // VSCode Live Server
        'http://127.0.0.1:5501',
        'http://127.0.0.1:5502',
        'http://127.0.0.1:5503',
        'http://127.0.0.1:5504',
        'http://127.0.0.1:5505',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:8000',
        'http://127.0.0.1:4200',
        'https://www.scopsy.com.br',
        'https://scopsy.com.br',
        process.env.FRONTEND_URL
      ].filter(Boolean),
    credentials: true
  }
});

// ========================================
// 2. MIDDLEWARES
// ========================================

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS - RESTRITO AO DOMÍNIO (Segurança!)
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
    // 🔒 PRODUÇÃO - Apenas domínios oficiais
    'https://www.scopsy.com.br',
    'https://scopsy.com.br',
    'https://lab.scopsy.com.br',
    'https://app.scopsy.com.br', // Se tiver subdomínio separado
    process.env.FRONTEND_URL,
    // Vercel deployment URLs (para preview e produção)
    /https:\/\/.*\.vercel\.app$/
  ].filter(Boolean)
  : [
    // 🛠️ DESENVOLVIMENTO - Portas locais comuns
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5500',  // VSCode Live Server
    'http://localhost:5501',
    'http://localhost:5502',
    'http://localhost:5503',
    'http://localhost:5504',
    'http://localhost:5505',
    'http://localhost:5173',  // Vite
    'http://localhost:8080',  // Webpack dev server
    'http://localhost:8000',  // Python/outros
    'http://localhost:4200',  // Angular
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:5500',  // VSCode Live Server
    'http://127.0.0.1:5501',
    'http://127.0.0.1:5502',
    'http://127.0.0.1:5503',
    'http://127.0.0.1:5504',
    'http://127.0.0.1:5505',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8000',
    'http://127.0.0.1:4200',
    'https://www.scopsy.com.br',
    'https://scopsy.com.br',
    process.env.FRONTEND_URL
  ].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // 🔓 DESENVOLVIMENTO: Permite requisições sem origin (arquivos locais, Postman, etc)
    if (!origin && process.env.NODE_ENV !== 'production') {
      logger.info('✅ CORS permitido: requisição sem origin (arquivo local ou Postman)');
      return callback(null, true);
    }

    // 🔒 PRODUÇÃO: Permite requisições sem origin apenas de mobile apps
    if (!origin && process.env.NODE_ENV === 'production') {
      logger.info('✅ CORS permitido: requisição sem origin (mobile app)');
      return callback(null, true);
    }

    // Verificar se origin está na lista (suporta strings e regex)
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      }
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      logger.info(`✅ CORS permitido: ${origin}`);
      callback(null, true);
    } else {
      logger.warn(`❌ CORS BLOQUEADO - Origin: "${origin}" não está na lista de permitidas`);
      logger.warn(`📋 Origins permitidas: ${JSON.stringify(allowedOrigins, null, 2)}`);
      callback(new Error('Origin não permitida pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiters
const { apiLimiter, openaiLimiter, authLimiter, webhookLimiter } = require('./middleware/rateLimiter');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const path = require('path'); // Ensure path is imported if not already, or use it here
app.use(express.static(path.join(__dirname, '../frontend')));


// ========================================
// 3. ROTAS
// ========================================
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const chatRoutes = require('./routes/chat');
const diagnosticRoutes = require('./routes/diagnostic');
const caseRoutes = require('./routes/case');
const journeyRoutes = require('./routes/journey');
const skillsRoutes = require('./routes/skills');
const webhooksRoutes = require('./routes/webhooks');

// ✅ ROTAS COM RATE LIMITING E PROTEÇÃO

// Auth routes - Rate limit mais restritivo (anti brute-force)
app.use('/api/auth', authLimiter, authRoutes);

// Rotas gerais - Rate limit padrão da API
app.use('/api/dashboard', apiLimiter, dashboardRoutes);
app.use('/api/chat', apiLimiter, chatRoutes);
app.use('/api/progress', apiLimiter, require('./routes/progress'));
app.use('/api/streaks', apiLimiter, require('./routes/streaks'));
app.use('/api/missions', apiLimiter, require('./routes/missions'));
app.use('/api/gamification', apiLimiter, require('./routes/gamification'));
app.use('/api/freshness', apiLimiter, require('./routes/freshness'));
app.use('/api/skills', apiLimiter, skillsRoutes);

// ⚠️ ROTAS OPENAI - Rate limit MAIS AGRESSIVO (custo!)
app.use('/api/diagnostic', openaiLimiter, diagnosticRoutes);
app.use('/api/case', openaiLimiter, caseRoutes);

// 📚 ROTAS JOURNEY - Rate limit padrão API (são apenas leituras de banco)
app.use('/api/journey', apiLimiter, journeyRoutes);

// 🔔 WEBHOOKS - Rate limit separado (Kiwify)
app.use('/api/webhooks', webhookLimiter, webhooksRoutes);

// ========================================
// 4. HEALTH CHECK
// ========================================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ========================================
// 5. SOCKET.IO
// ========================================
io.on('connection', (socket) => {
  logger.info(`🔌 Socket conectado: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`❌ Socket desconectado: ${socket.id}`);
  });

  socket.on('join_room', ({ userId }) => {
    socket.join(`user_${userId}`);
    logger.info(`👤 Usuário ${userId} entrou na sala`);
  });
});

app.set('io', io);

// ========================================
// 6. TRATAMENTO DE ERROS
// ========================================
app.use((err, req, res, next) => {
  logger.error('❌ Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// ========================================
// 7. INICIAR SERVIDOR
// ========================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`);
  logger.info(`✅ Supabase client initialized`);
  logger.info(`📡 Health check: http://localhost:${PORT}/health`);
});

// ========================================
// 8. FINALIZAÇÃO GRACIOSA
// ========================================
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM recebido, fechando servidor...');
  server.close(() => {
    logger.info('✅ Servidor encerrado com segurança');
    process.exit(0);
  });
});

module.exports = { app, server, io };
// Deploy trigger 1767143523
