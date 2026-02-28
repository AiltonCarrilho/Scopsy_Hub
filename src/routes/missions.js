/**
 * Rotas de Missões
 */
const express = require('express');
const router = express.Router();
const { authenticateRequest } = require('../middleware/auth');
const { getDailyMissions } = require('../services/missionService');
const logger = require('../config/logger');

/**
 * GET /api/missions
 * Retorna missões do dia e gera novas se necessário
 */
router.get('/', authenticateRequest, async (req, res) => {
  try {
    const userId = req.user.userId;
    const missions = await getDailyMissions(userId);

    res.json({
      success: true,
      missions
    });
  } catch (error) {
    logger.error('Erro ao buscar missões', { error: error.message });
    res.status(500).json({ success: false, error: 'Erro ao carregar missões' });
  }
});

module.exports = router;
