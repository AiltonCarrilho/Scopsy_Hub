// ========================================
// SERVER.JS - SCOPSY (VERSÃO CORRIGIDA)
// ========================================

require('dotenv').config({ path: '.env.local' });
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
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      'http://localhost:3001',
      'http://127.0.0.1:5500',
      'http://localhost:5500',
      'http://127.0.0.1:3001'
    ],
    credentials: true
  }
});

// ========================================
// 2. MIDDLEWARES
// ========================================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());

// STRIPE WEBHOOK (Must be before express.json)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

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
const paymentsRoutes = require('./routes/payments'); // New

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/diagnostic', diagnosticRoutes);
app.use('/api/case', caseRoutes);
app.use('/api/journey', journeyRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/progress', require('./routes/progress'));
app.use('/api/streaks', require('./routes/streaks')); // 🔥 New Gamification
app.use('/api/missions', require('./routes/missions')); // 🎯 New Missions
app.use('/api/gamification', require('./routes/gamification')); // 🏆 Badges & Profile
app.use('/api/payments', paymentsRoutes); // New

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
