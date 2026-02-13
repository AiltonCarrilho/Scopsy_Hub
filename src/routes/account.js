/**
 * Account Routes - Scopsy Lab
 * Gerenciamento de perfil e dados de assinatura
 */

const express = require('express');
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');
const { authenticateRequest } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/account/me
 * Retorna dados completos do perfil + assinatura
 */
router.get('/me', authenticateRequest, async (req, res) => {
    try {
        const userId = req.user.userId;

        logger.info('[ACCOUNT] Buscando perfil completo', { userId });

        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, name, crp, plan, subscription_status, subscription_started_at, subscription_ended_at, subscription_next_billing, kiwify_customer_id, created_at, last_login')
            .eq('id', userId)
            .single();

        if (error || !user) {
            logger.error('[ACCOUNT] Usuário não encontrado', { userId, error: error?.message });
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Calcular dias restantes do trial (se free)
        let trialDaysLeft = null;
        if (user.plan === 'free' && user.created_at) {
            const createdAt = new Date(user.created_at);
            const now = new Date();
            const diffDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
            trialDaysLeft = Math.max(0, 7 - diffDays);
        }

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                crp: user.crp || null,
                plan: user.plan,
                created_at: user.created_at,
                last_login: user.last_login
            },
            subscription: {
                status: user.subscription_status || 'inactive',
                started_at: user.subscription_started_at || null,
                ended_at: user.subscription_ended_at || null,
                next_billing: user.subscription_next_billing || null,
                kiwify_order_id: user.kiwify_customer_id || null
            },
            trial_days_left: trialDaysLeft
        });

    } catch (error) {
        logger.error('[ACCOUNT] Erro ao buscar perfil', { error: error.message });
        res.status(500).json({ error: 'Erro ao buscar dados da conta' });
    }
});

/**
 * PUT /api/account/profile
 * Atualizar nome e CRP do usuário
 */
router.put('/profile', authenticateRequest, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, crp } = req.body;

        // Validação
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ error: 'Nome deve ter no mínimo 2 caracteres' });
        }

        if (name.trim().length > 100) {
            return res.status(400).json({ error: 'Nome deve ter no máximo 100 caracteres' });
        }

        // Validar formato CRP se fornecido (XX/XXXXXX ou vazio)
        if (crp && crp.trim() !== '') {
            const crpRegex = /^\d{2}\/\d{4,6}$/;
            if (!crpRegex.test(crp.trim())) {
                return res.status(400).json({ error: 'CRP deve estar no formato XX/XXXXXX (ex: 06/123456)' });
            }
        }

        logger.info('[ACCOUNT] Atualizando perfil', { userId, name: name.trim() });

        const updateData = {
            name: name.trim(),
            crp: crp && crp.trim() !== '' ? crp.trim() : null,
            updated_at: new Date().toISOString()
        };

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select('id, email, name, crp, plan, created_at')
            .single();

        if (error) {
            logger.error('[ACCOUNT] Erro ao atualizar perfil', { error: error.message, userId });
            return res.status(500).json({ error: 'Erro ao atualizar perfil' });
        }

        // Atualizar localStorage no client ao receber resposta
        logger.info('[ACCOUNT] Perfil atualizado com sucesso', { userId });

        res.json({
            success: true,
            message: 'Perfil atualizado com sucesso',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                crp: updatedUser.crp,
                plan: updatedUser.plan,
                created_at: updatedUser.created_at
            }
        });

    } catch (error) {
        logger.error('[ACCOUNT] Erro ao atualizar perfil', { error: error.message });
        res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
});

/**
 * PUT /api/account/password
 * Alterar senha do usuário (requer senha atual)
 */
router.put('/password', authenticateRequest, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
        }

        if (new_password.length < 8) {
            return res.status(400).json({ error: 'Nova senha deve ter no mínimo 8 caracteres' });
        }

        if (new_password.length > 128) {
            return res.status(400).json({ error: 'Nova senha deve ter no máximo 128 caracteres' });
        }

        if (current_password === new_password) {
            return res.status(400).json({ error: 'Nova senha deve ser diferente da atual' });
        }

        // Buscar hash atual
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('id, password_hash')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Verificar senha atual
        const isMatch = await bcrypt.compare(current_password, user.password_hash);
        if (!isMatch) {
            logger.warn('[ACCOUNT] Tentativa de alteração com senha incorreta', { userId });
            return res.status(401).json({ error: 'Senha atual incorreta' });
        }

        // Hash nova senha
        const newHash = await bcrypt.hash(new_password, 12);

        const { error: updateError } = await supabase
            .from('users')
            .update({ password_hash: newHash, updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (updateError) {
            logger.error('[ACCOUNT] Erro ao atualizar senha', { error: updateError.message, userId });
            return res.status(500).json({ error: 'Erro ao atualizar senha' });
        }

        logger.info('[ACCOUNT] Senha alterada com sucesso', { userId });
        res.json({ success: true, message: 'Senha alterada com sucesso' });

    } catch (error) {
        logger.error('[ACCOUNT] Erro ao alterar senha', { error: error.message });
        res.status(500).json({ error: 'Erro ao alterar senha' });
    }
});

module.exports = router;
