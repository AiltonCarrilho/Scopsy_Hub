/**
 * Rotas de Streaks
 */
const express = require('express');
const router = express.Router();
const { authenticateRequest } = require('../middleware/auth');
const { getUserStreak } = require('../services/streakService');
const logger = require('../config/logger');

/**
 * GET /api/streaks
 * Retorna o status atual do streak do usuário
 */
router.get('/', authenticateRequest, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Obter dados do serviço
    const streakData = await getUserStreak(userId);

    res.json({
      success: true,
      streak: streakData
    });

  } catch (error) {
    logger.error('Erro na rota de streaks', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar dados de streak'
    });
  }
});

module.exports = router;
