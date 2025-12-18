/**
 * FRESHNESS ROUTES
 * API endpoints para sistema de frescor clínico
 */

const express = require('express');
const router = express.Router();
const { authenticateRequest } = require('../middleware/auth');
const { calculateFreshness, getFreshnessStatus } = require('../services/freshnessService');
const { supabase } = require('../services/supabase');
const logger = require('../config/logger');

/**
 * GET /api/freshness/status
 * Retorna status atual de frescor do usuário
 */
router.get('/status', authenticateRequest, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Calcular frescor atual
        const multiplier = await calculateFreshness(userId);

        // Obter status visual
        const status = getFreshnessStatus(multiplier);

        // Buscar última prática
        const { data: user } = await supabase
            .from('users')
            .select('last_practice_date')
            .eq('id', userId)
            .single();

        // Calcular dias desde última prática
        let daysSinceLastPractice = 0;
        if (user?.last_practice_date) {
            const today = new Date();
            const lastPractice = new Date(user.last_practice_date);
            daysSinceLastPractice = Math.floor((today - lastPractice) / (1000 * 60 * 60 * 24));
        }

        res.json({
            success: true,
            freshness: {
                multiplier: multiplier,
                percentage: Math.round(multiplier * 100),
                status: status.status,
                color: status.color,
                emoji: status.emoji,
                message: status.message,
                description: status.description,
                days_since_practice: daysSinceLastPractice,
                last_practice_date: user?.last_practice_date
            }
        });

    } catch (error) {
        logger.error('Erro ao buscar status de frescor:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar status de frescor'
        });
    }
});

module.exports = router;
