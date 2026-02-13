/**
 * Gamification Routes (Unified)
 * Stats, Badges, Profile
 */
const express = require('express');
const router = express.Router();
const { authenticateRequest } = require('../middleware/auth');
const { getUserBadges, getAllBadges, checkAndAwardBadges } = require('../services/badgeService');
const { getDailyMissions } = require('../services/missionService');
const { getFromBoostspace, supabase } = require('../services/database');
const { getICCTier } = require('../services/iccService');
const logger = require('../config/logger');

/**
 * GET /api/gamification/profile
 * Retorna perfil completo de gamificação (Level, Streaks, Badges, Missões)
 */
router.get('/profile', authenticateRequest, async (req, res) => {
    try {
        const userId = req.user.userId;

        // 1. User Stats (Level, XP, Streak, ICC)
        const { data: user } = await supabase.from('users').select('cognits, level, current_streak, longest_streak, icc_score, icc_acuracia, icc_consistencia, icc_variedade, icc_complexidade').eq('id', userId).single();

        // 2. Badges Earned
        const userBadges = await getUserBadges(userId);

        // 3. Daily Missions
        const missions = await getDailyMissions(userId);

        // 4. ICC
        const iccScore = Number(user?.icc_score) || 0;

        res.json({
            success: true,
            stats: {
                level: user?.level || 1,
                xp: user?.cognits || 0,
                streak: user?.current_streak || 0,
                longest_streak: user?.longest_streak || 0
            },
            icc: {
                score: iccScore,
                acuracia: Number(user?.icc_acuracia) || 0,
                consistencia: Number(user?.icc_consistencia) || 0,
                variedade: Number(user?.icc_variedade) || 0,
                complexidade: Number(user?.icc_complexidade) || 0,
                ...getICCTier(iccScore)
            },
            badges: userBadges,
            missions: missions
        });

    } catch (error) {
        logger.error('Erro get gamification profile', { error: error.message });
        res.status(500).json({ success: false, error: 'Erro ao carregar perfil de jogo' });
    }
});

/**
 * GET /api/gamification/badges
 * Retorna todas as medalhas possíveis (para a galeria)
 */
router.get('/badges', authenticateRequest, async (req, res) => {
    try {
        const userId = req.user.userId;
        const allBadges = await getAllBadges();
        const earned = await getUserBadges(userId);
        const earnedSlugs = new Set(earned.map(b => b.slug));

        // Mapear status
        const badgesWithStatus = allBadges.map(b => ({
            ...b,
            earned: earnedSlugs.has(b.slug),
            earned_at: earned.find(e => e.slug === b.slug)?.earned_at || null
        }));

        res.json({
            success: true,
            badges: badgesWithStatus
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
