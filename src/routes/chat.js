// ========================================
// CHAT ROUTES - SCOPSY BACKEND (COM SUPABASE)
// ========================================

const express = require('express');
const router = express.Router();
const { authenticateRequest } = require('../middleware/auth');
const logger = require('../config/logger');
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

// Inicializar OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Inicializar Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// IDs dos assistentes
const ASSISTANT_IDS = {
    orchestrator: process.env.ORCHESTRATOR_ID || 'asst_orchestrator',
    case: process.env.CASE_ID || 'asst_case',
    diagnostic: process.env.DIAGNOSTIC_ID || 'asst_diagnostic',
    journey: process.env.JOURNEY_ID || 'asst_journey',
    generator: process.env.GENERATOR_ID || 'asst_generator'
};

// ========================================
// POST /api/chat/message
// Enviar mensagem e salvar no Supabase
// ========================================

router.post('/message', authenticateRequest, async (req, res) => {
    try {
        const { message, assistantType = 'case', conversationId = null } = req.body;
        const userId = req.userId;

        // Validações
        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Mensagem não pode estar vazia' });
        }

        if (message.length > 2000) {
            return res.status(400).json({ error: 'Mensagem muito longa (máximo 2000 caracteres)' });
        }

        if (!ASSISTANT_IDS[assistantType]) {
            return res.status(400).json({ error: 'Tipo de assistente inválido' });
        }

        logger.info(`📨 Nova mensagem de usuário ${userId} para ${assistantType}: ${message.substring(0, 50)}...`);

        // 1. OBTER OU CRIAR CONVERSA NO SUPABASE
        let conversation;
        
        if (conversationId) {
            // Buscar conversa existente
            const { data, error } = await supabase
                .from('chat_conversations')
                .select('*')
                .eq('id', conversationId)
                .eq('user_id', userId)
                .single();

            if (error || !data) {
                return res.status(404).json({ error: 'Conversa não encontrada' });
            }

            conversation = data;
        } else {
            // Criar nova conversa
            const { data, error } = await supabase
                .from('chat_conversations')
                .insert([{
                    user_id: userId,
                    assistant_type: assistantType,
                    title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
                }])
                .select()
                .single();

            if (error) {
                logger.error('❌ Erro ao criar conversa:', error);
                return res.status(500).json({ error: 'Erro ao criar conversa' });
            }

            conversation = data;
            logger.info(`✅ Nova conversa criada: ${conversation.id}`);
        }

        // 2. SALVAR MENSAGEM DO USUÁRIO NO SUPABASE
        const { error: userMsgError } = await supabase
            .from('chat_messages')
            .insert([{
                conversation_id: conversation.id,
                role: 'user',
                content: message
            }]);

        if (userMsgError) {
            logger.error('❌ Erro ao salvar mensagem do usuário:', userMsgError);
        }

        // 3. OBTER OU CRIAR THREAD DO OPENAI
        let threadId = conversation.thread_id;

        if (!threadId) {
            logger.info(`🆕 Criando nova thread OpenAI`);
            const thread = await openai.beta.threads.create();
            threadId = thread.id;

            // Atualizar thread_id na conversa
            await supabase
                .from('chat_conversations')
                .update({ thread_id: threadId })
                .eq('id', conversation.id);

            logger.info(`✅ Thread criada: ${threadId}`);
        }

        // 4. ADICIONAR MENSAGEM À THREAD DO OPENAI
        await openai.beta.threads.messages.create(threadId, {
            role: 'user',
            content: message
        });

        logger.info(`✅ Mensagem adicionada à thread ${threadId}`);

        // 5. EXECUTAR ASSISTENTE
        const run = await openai.beta.threads.runs.create(threadId, {
            assistant_id: ASSISTANT_IDS[assistantType]
        });

        logger.info(`🤖 Assistente ${assistantType} iniciado (run: ${run.id})`);

        // 6. POLLING PARA AGUARDAR RESPOSTA
        let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
        let attempts = 0;
        const maxAttempts = 30;

        while (runStatus.status !== 'completed' && attempts < maxAttempts) {
            if (['failed', 'cancelled', 'expired'].includes(runStatus.status)) {
                throw new Error(`Assistente falhou com status: ${runStatus.status}`);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
            runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
            attempts++;

            if (attempts % 5 === 0) {
                logger.info(`⏳ Aguardando resposta... (${attempts}s) - Status: ${runStatus.status}`);
            }
        }

        if (runStatus.status !== 'completed') {
            throw new Error('Timeout: Assistente demorou muito para responder');
        }

        logger.info(`✅ Assistente completou execução`);

        // 7. OBTER RESPOSTA DO ASSISTENTE
        const messages = await openai.beta.threads.messages.list(threadId, {
            limit: 1,
            order: 'desc'
        });

        const assistantMessage = messages.data[0];
        const responseText = assistantMessage.content[0].text.value;

        logger.info(`📤 Resposta do assistente: ${responseText.substring(0, 100)}...`);

        // 8. SALVAR RESPOSTA DO ASSISTENTE NO SUPABASE
        const { error: assistantMsgError } = await supabase
            .from('chat_messages')
            .insert([{
                conversation_id: conversation.id,
                role: 'assistant',
                content: responseText
            }]);

        if (assistantMsgError) {
            logger.error('❌ Erro ao salvar resposta do assistente:', assistantMsgError);
        }

        // 9. ATUALIZAR updated_at DA CONVERSA
        await supabase
            .from('chat_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversation.id);

        // 10. RETORNAR RESPOSTA
        res.json({
            success: true,
            response: responseText,
            conversationId: conversation.id,
            assistantUsed: assistantType,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('❌ Erro ao processar mensagem:', error);
        res.status(500).json({
            error: 'Erro ao processar mensagem',
            details: error.message
        });
    }
});

// ========================================
// GET /api/chat/conversations
// Listar conversas do usuário
// ========================================

router.get('/conversations', authenticateRequest, async (req, res) => {
    try {
        const userId = req.userId;
        const { assistantType } = req.query;

        let query = supabase
            .from('chat_conversations')
            .select('*')
            .eq('user_id', userId)
            .eq('is_archived', false)
            .order('updated_at', { ascending: false });

        if (assistantType) {
            query = query.eq('assistant_type', assistantType);
        }

        const { data, error } = await query;

        if (error) {
            logger.error('❌ Erro ao buscar conversas:', error);
            return res.status(500).json({ error: 'Erro ao buscar conversas' });
        }

        res.json({
            success: true,
            conversations: data
        });

    } catch (error) {
        logger.error('❌ Erro ao buscar conversas:', error);
        res.status(500).json({
            error: 'Erro ao buscar conversas',
            details: error.message
        });
    }
});

// ========================================
// GET /api/chat/conversation/:id
// Obter histórico de uma conversa
// ========================================

router.get('/conversation/:id', authenticateRequest, async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        // Buscar conversa
        const { data: conversation, error: convError } = await supabase
            .from('chat_conversations')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (convError || !conversation) {
            return res.status(404).json({ error: 'Conversa não encontrada' });
        }

        // Buscar mensagens
        const { data: messages, error: msgError } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('conversation_id', id)
            .order('created_at', { ascending: true });

        if (msgError) {
            logger.error('❌ Erro ao buscar mensagens:', msgError);
            return res.status(500).json({ error: 'Erro ao buscar mensagens' });
        }

        res.json({
            success: true,
            conversation: conversation,
            messages: messages
        });

    } catch (error) {
        logger.error('❌ Erro ao buscar conversa:', error);
        res.status(500).json({
            error: 'Erro ao buscar conversa',
            details: error.message
        });
    }
});

// ========================================
// POST /api/chat/feedback
// Salvar feedback de uma mensagem
// ========================================

router.post('/feedback', authenticateRequest, async (req, res) => {
    try {
        const { messageId, feedback } = req.body;

        if (!['helpful', 'not_helpful'].includes(feedback)) {
            return res.status(400).json({ error: 'Feedback inválido' });
        }

        const { error } = await supabase
            .from('chat_messages')
            .update({ feedback })
            .eq('id', messageId);

        if (error) {
            logger.error('❌ Erro ao salvar feedback:', error);
            return res.status(500).json({ error: 'Erro ao salvar feedback' });
        }

        res.json({
            success: true,
            message: 'Feedback salvo com sucesso'
        });

    } catch (error) {
        logger.error('❌ Erro ao salvar feedback:', error);
        res.status(500).json({
            error: 'Erro ao salvar feedback',
            details: error.message
        });
    }
});

// ========================================
// DELETE /api/chat/conversation/:id
// Arquivar (deletar) conversa
// ========================================

router.delete('/conversation/:id', authenticateRequest, async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        const { error } = await supabase
            .from('chat_conversations')
            .update({ is_archived: true })
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            logger.error('❌ Erro ao arquivar conversa:', error);
            return res.status(500).json({ error: 'Erro ao arquivar conversa' });
        }

        res.json({
            success: true,
            message: 'Conversa arquivada com sucesso'
        });

    } catch (error) {
        logger.error('❌ Erro ao arquivar conversa:', error);
        res.status(500).json({
            error: 'Erro ao arquivar conversa',
            details: error.message
        });
    }
});

module.exports = router;