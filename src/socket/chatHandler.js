/**
 * Socket.io Chat Handler
 * Gerencia comunicação real-time do chat
 */

const logger = require('../config/logger');
const { sendMessage, getOrCreateThread, routeToAssistant } = require('../services/openai-service');
const { verifyToken } = require('../middleware/auth');
// supabaseAdmin: used for rate limiting (user_rate_limits) — admin operation, RLS bypass intentional
// supabase (anon): used to call set_auth_context() RPC before thread queries
// Note: chat_conversations/messages are queried via database.js (anon client) in thread-manager.js
const { supabase, supabaseAdmin } = require('../services/supabase');

// Store de conexões ativas (userId -> socketId)
const activeConnections = new Map();

/**
 * Inicializar handlers do Socket.io
 */
function initializeSocketHandlers(io) {

  // Middleware de autenticação
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Token não fornecido'));
      }

      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      socket.userPlan = decoded.plan;

      logger.info('Cliente autenticado no WebSocket', {
        userId: socket.userId,
        socketId: socket.id
      });

      next();
    } catch (error) {
      logger.error('Erro auth WebSocket', { error: error.message });
      next(new Error('Autenticação falhou'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;

    logger.info('Cliente conectado', { userId, socketId: socket.id });

    // Adicionar ao store de conexões
    activeConnections.set(userId, socket.id);

    // Join room privado do usuário
    socket.join(`user:${userId}`);

    /**
     * Evento: send_message
     * Cliente envia mensagem para assistente
     */
    socket.on('send_message', async (data) => {
      try {
        const { message, assistantType, conversationId } = data;

        logger.info('Mensagem recebida via WebSocket', {
          userId,
          assistantType,
          messageLength: message.length
        });

        // Validar rate limiting baseado no plano
        const rateLimitOk = await checkRateLimit(userId, socket.userPlan);
        if (!rateLimitOk) {
          return socket.emit('error', {
            message: 'Limite de mensagens excedido para seu plano',
            code: 'RATE_LIMIT_EXCEEDED'
          });
        }

        // Confirmar recebimento
        socket.emit('message_received', {
          status: 'processing',
          timestamp: new Date().toISOString()
        });

        // Indicar que assistente está "digitando"
        socket.emit('assistant_typing', {
          assistantType
        });

        // Rotear para assistente apropriado se não especificado
        const targetAssistant = assistantType || routeToAssistant(message);

        // Set RLS context before thread-manager queries Supabase (conversations table)
        // This ensures thread data is isolated per user via Row Level Security
        if (supabase) {
          const { error: rlsError } = await supabase.rpc('set_auth_context', {
            p_user_id: userId
          });
          if (rlsError) {
            logger.warn('Socket: failed to set RLS context', { error: rlsError.message, userId });
            // Non-fatal: thread-manager queries use database.js (anon client)
            // RLS will enforce isolation even if context call fails (returns empty, not data leak)
          } else {
            logger.debug('Socket: RLS context set', { userId });
          }
        }

        // Get ou criar thread
        const threadId = await getOrCreateThread(userId, targetAssistant, conversationId);

        // Enviar mensagem para OpenAI (isso pode demorar 10-60s)
        const response = await sendMessage(threadId, targetAssistant, message, userId);

        // Enviar resposta ao cliente
        socket.emit('message_response', {
          response: response.response,
          threadId: response.threadId,
          conversationId: conversationId || response.threadId,
          assistantType: targetAssistant,
          tokensUsed: response.tokensUsed,
          timestamp: response.timestamp
        });

        logger.info('Mensagem processada e enviada', {
          userId,
          tokensUsed: response.tokensUsed
        });

      } catch (error) {
        logger.error('Erro ao processar mensagem', {
          error: error.message,
          userId
        });

        socket.emit('error', {
          message: 'Erro ao processar mensagem',
          code: 'PROCESSING_ERROR',
          ...(process.env.NODE_ENV !== 'production' && { details: error.message })
        });
      }
    });

    /**
     * Evento: stop_typing
     * Cliente parou de digitar (feedback UX)
     */
    socket.on('stop_typing', () => {
      // Apenas log por ora, pode usar para indicadores UX futuros
      logger.debug('Cliente parou de digitar', { userId });
    });

    /**
     * Evento: disconnect
     * Cliente desconectou
     */
    socket.on('disconnect', (reason) => {
      logger.info('Cliente desconectado', {
        userId,
        socketId: socket.id,
        reason
      });

      // Remover do store
      activeConnections.delete(userId);
    });

  });

  logger.info('✅ Socket.io handlers inicializados');
}

/**
 * Check rate limiting baseado no plano do usuário
 * ✅ IMPLEMENTADO com Supabase
 */
async function checkRateLimit(userId, plan) {
  try {
    const limits = {
      free: 20,      // 20 mensagens/dia
      basic: 100,    // 100 mensagens/dia
      pro: 500,      // 500 mensagens/dia
      premium: 9999  // Ilimitado
    };

    const userLimit = limits[plan] || limits.free;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Buscar contador de mensagens de hoje
    const { data: rateData, error: fetchError } = await supabaseAdmin
      .from('user_rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      logger.error('Erro ao buscar rate limit', { error: fetchError.message });
      return true; // Em caso de erro, permitir (fail-open)
    }

    // Se não existe registro de hoje, criar
    if (!rateData) {
      await supabaseAdmin
        .from('user_rate_limits')
        .insert({
          user_id: userId,
          date: today,
          message_count: 1,
          plan: plan
        });

      logger.info('Rate limit: primeiro uso hoje', { userId, plan });
      return true;
    }

    // Verificar se ultrapassou limite
    if (rateData.message_count >= userLimit) {
      logger.warn('Rate limit excedido', {
        userId,
        plan,
        count: rateData.message_count,
        limit: userLimit
      });
      return false;
    }

    // Incrementar contador
    await supabaseAdmin
      .from('user_rate_limits')
      .update({ message_count: rateData.message_count + 1 })
      .eq('user_id', userId)
      .eq('date', today);

    logger.info('Rate limit OK', {
      userId,
      count: rateData.message_count + 1,
      limit: userLimit
    });

    return true;

  } catch (error) {
    logger.error('Erro no rate limiting', { error: error.message });
    return true; // Fail-open: se erro, permitir
  }
}

/**
 * Enviar notificação para usuário específico
 * (útil para webhooks de pagamento, badges desbloqueados, etc)
 */
function sendNotificationToUser(userId, notification) {
  const socketId = activeConnections.get(userId);

  if (socketId) {
    const io = require('../server').io;
    io.to(socketId).emit('notification', notification);
    logger.info('Notificação enviada', { userId, type: notification.type });
  }
}

module.exports = {
  initializeSocketHandlers,
  sendNotificationToUser
};
