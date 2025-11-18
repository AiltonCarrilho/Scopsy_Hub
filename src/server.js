// ========================================
// SERVER.JS - SCOPSY
// Ordem correta de inicialização
// ========================================

require('dotenv').config({ path: '.env.local' });
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./config/logger');

// ========================================
// 1. CRIAR APP EXPRESS (PRIMEIRO!)
// ========================================

const app = express();
const server = http.createServer(app);

// ========================================
// 2. CONFIGURAR SOCKET.IO
// ========================================

const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:3001',
        credentials: true
    }
});

// ========================================
// 3. MIDDLEWARE BÁSICOS
// ========================================

app.use(helmet());
// Configurar CORS (aceitar múltiplas origens)
app.use(cors({
    origin: [
        'http://localhost:3001',
        'http://127.0.0.1:5500',
        'http://localhost:5500',
        'http://127.0.0.1:3001'
    ],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// 4. SERVIR ARQUIVOS ESTÁTICOS
// ========================================

app.use(express.static('public'));

// ========================================
// 5. IMPORTAR ROTAS (DEPOIS DO APP!)
// ========================================

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const chatRoutes = require('./routes/chat');

// ========================================
// 6. REGISTRAR ROTAS
// ========================================

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);

logger.info('✅ Rotas registradas: /api/auth, /api/chat');

// ========================================
// 7. ROTA DE HEALTH CHECK
// ========================================

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ========================================
// 8. SOCKET.IO EVENTS
// ========================================

io.on('connection', (socket) => {
    logger.info(`🔌 Socket conectado: ${socket.id}`);

    socket.on('disconnect', () => {
        logger.info(`❌ Socket desconectado: ${socket.id}`);
    });

    socket.on('join_room', (data) => {
        const { userId } = data;
        socket.join(`user_${userId}`);
        logger.info(`👤 Usuário ${userId} entrou na sala`);
    });
});

// Disponibilizar io globalmente (para usar nas rotas)
app.set('io', io);

// ========================================
// 9. ERROR HANDLER (ÚLTIMO!)
// ========================================

app.use((err, req, res, next) => {
    logger.error('❌ Erro não tratado:', err);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: err.message
    });
});

// ========================================
// 10. INICIAR SERVIDOR
// ========================================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    logger.info(`🚀 Servidor rodando na porta ${PORT}`);
    logger.info(`📡 Health check: http://localhost:${PORT}/health`);
    logger.info(`🔐 Auth: http://localhost:${PORT}/api/auth`);
    logger.info(`💬 Chat: http://localhost:${PORT}/api/chat`);
});

// ========================================
// GRACEFUL SHUTDOWN
// ========================================

process.on('SIGTERM', () => {
    logger.info('👋 SIGTERM recebido, fechando servidor...');
    server.close(() => {
        logger.info('✅ Servidor fechado');
        process.exit(0);
    });
});

module.exports = { app, server, io };

