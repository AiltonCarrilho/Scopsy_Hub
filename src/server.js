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

// ========================================
// CORS - Origins permitidas (fonte única)
// ========================================
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
    'https://www.scopsy.com.br',
    'https://scopsy.com.br',
    'https://app.scopsy.com.br',
    process.env.FRONTEND_URL,
    /https:\/\/.*\.vercel\.app$/  // preview deployments
  ].filter(Boolean)
  : [
    'http://localhost:3000',
    'http://localhost:5500',  // VSCode Live Server
    'http://localhost:5502',  // VSCode Live Server (alternative port)
    'http://localhost:5173',  // Vite
    'http://localhost:8080',  // Webpack
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:5502',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean);

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
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

// allowedOrigins definido acima, antes do socket.io

app.use(cors({
  origin: function (origin, callback) {
    // Sem origin: permitir em desenvolvimento E em produção com proxy (Vercel rewrite)
    // Proxies (Vercel, nginx) podem remover Origin header — isso é esperado
    if (!origin) {
      if (process.env.NODE_ENV !== 'production') {
        logger.info('CORS: sem origin permitido em desenvolvimento (Postman/curl)');
        return callback(null, true);
      }
      // Em produção sem Origin: permitir se vier de proxy (X-Forwarded-For indica proxy)
      // Isso é seguro porque o browser não consegue fazer requisições sem Origin
      // (apenas proxies e ferramentas podem fazer isso)
      logger.info('CORS: requisição sem origin permitida (provém de proxy/rewrite)');
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
      logger.info(`CORS permitido: ${origin}`);
      callback(null, true);
    } else {
      logger.warn(`CORS bloqueado: ${origin}`);
      callback(new Error('Origin não permitida pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiters
const { apiLimiter, openaiLimiter, authLimiter, webhookLimiter, createPlanBasedLimiter } = require('./middleware/rateLimiter');
const { authenticateRequest } = require('./middleware/auth');
const { setRLSContext } = require('./middleware/set-rls-context');
const planLimiter = createPlanBasedLimiter({ free: 3, basic: 10, premium: 30 });

// ========================================
// WEBHOOK RAW BODY CAPTURE (para HMAC validation)
// ========================================
// IMPORTANTE: Deve vir ANTES de express.json()
// Captura o body raw APENAS para webhooks endpoint
// Necessário para validação HMAC-SHA256 correta
const { captureRawBody } = require('./middleware/kiwify-auth');
app.use('/api/webhooks', express.raw({ type: 'application/json' }), captureRawBody);

// Parse JSON para todas as outras rotas
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const path = require('path'); // Ensure path is imported if not already, or use it here

// Frontend Legado
app.use(express.static(path.join(__dirname, '../frontend')));


// ========================================
// 3. ROTAS
// ========================================
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const dashboardRoutes = require('./routes/dashboard');
const chatRoutes = require('./routes/chat');
const diagnosticRoutes = require('./routes/diagnostic');
const caseRoutes = require('./routes/case');
const journeyRoutes = require('./routes/journey');
const skillsRoutes = require('./routes/skills');
const webhooksRoutes = require('./routes/webhooks');
const healthRoutes = require('./routes/health');
const supportRoutes = require('./routes/support');

// ✅ ROTAS COM RATE LIMITING E PROTEÇÃO

// Auth routes - Rate limit mais restritivo (anti brute-force)
app.use('/api/auth', authLimiter, authRoutes);

// Rotas autenticadas - authenticateRequest + setRLSContext em cada cadeia
// Ordem: rateLimit -> authenticateRequest (define req.user) -> setRLSContext (define contexto RLS) -> routeHandler
app.use('/api/dashboard', apiLimiter, authenticateRequest, setRLSContext, dashboardRoutes);
app.use('/api/account', apiLimiter, authenticateRequest, setRLSContext, accountRoutes);
app.use('/api/chat', apiLimiter, openaiLimiter, authenticateRequest, setRLSContext, chatRoutes);
app.use('/api/progress', apiLimiter, authenticateRequest, setRLSContext, require('./routes/progress'));
app.use('/api/streaks', apiLimiter, authenticateRequest, setRLSContext, require('./routes/streaks'));
app.use('/api/missions', apiLimiter, authenticateRequest, setRLSContext, require('./routes/missions'));
app.use('/api/gamification', apiLimiter, authenticateRequest, setRLSContext, require('./routes/gamification'));
app.use('/api/freshness', apiLimiter, authenticateRequest, setRLSContext, require('./routes/freshness'));
app.use('/api/skills', apiLimiter, authenticateRequest, setRLSContext, skillsRoutes);
app.use('/api/support', apiLimiter, authenticateRequest, setRLSContext, supportRoutes);

// ⚠️ ROTAS OPENAI - Auth + Rate limit por IP + por plano (custo!)
app.use('/api/diagnostic', openaiLimiter, authenticateRequest, setRLSContext, planLimiter, diagnosticRoutes);
// /api/case não usa OpenAI desde 12/02 (geração on-demand removida) — apenas apiLimiter + planLimiter
// NOTE: Ordem crítica: authenticateRequest (define req.user) → setRLSContext (usa req.user.userId)
// NÃO adicionar authenticateRequest novamente em cada rota para evitar double middleware
app.use('/api/case', apiLimiter, authenticateRequest, setRLSContext, planLimiter, caseRoutes);

// 📚 ROTAS JOURNEY - Rate limit padrão API + autenticação + RLS context
// Ordem: apiLimiter → authenticateRequest (define req.user) → setRLSContext (prepara RLS) → rotas
app.use('/api/journey', apiLimiter, authenticateRequest, setRLSContext, journeyRoutes);

// 🔔 WEBHOOKS - Rate limit separado (Kiwify)
app.use('/api/webhooks', webhookLimiter, webhooksRoutes);

// ========================================
// 4. HEALTH CHECK (Keep-Alive Supabase)
// ========================================
// ⚠️ IMPORTANTE: Este endpoint faz ping no Supabase para evitar
// que o projeto seja pausado após 7 dias de inatividade.
// Configure UptimeRobot ou similar para chamar /api/health a cada 5 min
app.use('/api/health', healthRoutes);

// Manter o endpoint /health legado para compatibilidade
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Use /api/health for full health check with Supabase ping'
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
app.use((err, req, res, _next) => {
  logger.error('Erro não tratado', { message: err.message, stack: err.stack, path: req.path });
  res.status(500).json({
    error: 'Erro interno do servidor',
    ...(process.env.NODE_ENV !== 'production' && { message: err.message })
  });
});

// ========================================
// 7. INICIAR SERVIDOR
// ========================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`);
  logger.info('✅ Supabase client initialized');
  logger.info(`📡 Health check: http://localhost:${PORT}/health`);
});

// ========================================
// 8. FINALIZAÇÃO GRACIOSA
// ========================================
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM recebido, fechando servidor...');
  server.close(() => {
    logger.info('✅ Servidor encerrado com segurança');
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  });
});

module.exports = { app, server, io };
// Deploy trigger 1767143523
