/**
 * Support Routes
 * Rotas para envio de solicitações de suporte
 */

const express = require('express');
const { authenticateRequest } = require('../middleware/auth');
const { sendSupportEmail } = require('../services/emailService');
const logger = require('../config/logger');

const router = express.Router();

/**
 * POST /api/support
 * Envia uma mensagem de suporte
 */
router.post('/', authenticateRequest, async (req, res) => {
    try {
        const { subject, message } = req.body;
        const user = req.user; // Injetado pelo middleware auth

        if (!subject || !message) {
            return res.status(400).json({ error: 'Assunto e mensagem são obrigatórios' });
        }

        // Adicionar informações extras do usuário para o template de email
        const userContext = {
            id: user.userId,
            email: user.email,
            name: user.name || 'Usuário Scopsy',
            plan: user.plan
        };

        const success = await sendSupportEmail(userContext, subject, message);

        if (success) {
            return res.json({ success: true, message: 'Mensagem enviada com sucesso' });
        } else {
            return res.status(500).json({ error: 'Erro ao enviar mensagem. Tente novamente mais tarde.' });
        }

    } catch (error) {
        logger.error('[SUPPORT] Erro ao processar solicitação', { error: error.message });
        res.status(500).json({ error: 'Erro interno ao processar sua solicitação' });
    }
});

module.exports = router;
