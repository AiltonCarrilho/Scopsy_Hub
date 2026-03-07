/**
 * Journey Sessions Endpoint
 * GET /api/journey/:journeyId/sessions
 *
 * Carrega 12 sessões estruturadas do "Orquestrador de Casos Clínicos"
 * com todas as questões, opções e feedback
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticateRequest } = require('../middleware/auth');
const { logger } = require('../config/logger');
const supabase = require('../services/supabase');

const router = express.Router();

// Simple in-memory cache
const sessionCache = new Map();
const CACHE_TTL = 3600000; // 1 hour

/**
 * GET /api/journey/:journeyId/sessions
 * Carrega todas as 12 sessões com estrutura completa
 */
router.get('/:journeyId/sessions', authenticateRequest, async (req, res) => {
  try {
    const { journeyId } = req.params;
    const userId = req.user.id;

    logger.info('Carregando sessões da jornada', {
      journeyId,
      userId,
      timestamp: new Date().toISOString()
    });

    // ==========================================
    // 1. VALIDAR RLS - usuário só vê suas jornadas
    // ==========================================
    const { data: userJourney, error: rls_error } = await supabase
      .from('user_journey_progress')
      .select('journey_id, current_session')
      .eq('user_id', userId)
      .eq('journey_id', journeyId)
      .single();

    if (!userJourney || rls_error) {
      logger.warn('RLS violation attempted', { journeyId, userId });
      return res.status(403).json({
        success: false,
        error: 'Access denied to this journey'
      });
    }

    // ==========================================
    // 2. VERIFICAR CACHE
    // ==========================================
    const cacheKey = `journey:${journeyId}:sessions`;
    const cached = sessionCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      logger.info('Retornando sessões do cache', { journeyId });
      return res.json({
        success: true,
        journey: cached.journey,
        sessions: cached.sessions,
        metadata: {
          cached: true,
          cache_ttl_seconds: CACHE_TTL / 1000,
          loaded_at: new Date().toISOString()
        }
      });
    }

    // ==========================================
    // 3. CARREGAR JSONs DO ORQUESTRADOR
    // ==========================================
    const orchestratorPath = path.resolve(
      __dirname,
      '../../data/journeys'
    );

    if (!fs.existsSync(orchestratorPath)) {
      logger.error('Pasta do Orquestrador não encontrada', { orchestratorPath });
      return res.status(500).json({
        success: false,
        error: 'Journey data directory not found'
      });
    }

    const sessions = [];
    const ranges = [
      { file: `journey-${journeyId}-sessions-1-3-intermediate.json`, range: '1-3' },
      { file: `journey-${journeyId}-sessions-4-6-intermediate.json`, range: '4-6' },
      { file: `journey-${journeyId}-sessions-7-9-intermediate.json`, range: '7-9' },
      { file: `journey-${journeyId}-sessions-10-12-intermediate.json`, range: '10-12' }
    ];

    let journeyMetadata = null;

    for (const { file, range } of ranges) {
      const filePath = path.join(orchestratorPath, file);

      try {
        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(fileContent);

          // Capturar metadata da jornada (primeira iteração)
          if (!journeyMetadata && data.journey) {
            journeyMetadata = data.journey;
          }

          // Adicionar sessões
          if (data.sessions && Array.isArray(data.sessions)) {
            sessions.push(...data.sessions);
            logger.info(`Carregadas sessões ${range} para jornada ${journeyId}`);
          }
        } else {
          logger.warn(`Arquivo não encontrado: ${file}`, { journeyId });
        }
      } catch (fileError) {
        logger.error(`Erro ao ler arquivo ${file}`, {
          error: fileError.message,
          journeyId
        });
      }
    }

    if (sessions.length === 0) {
      logger.warn('Nenhuma sessão encontrada para jornada', { journeyId });
      return res.status(404).json({
        success: false,
        error: 'No sessions found for this journey'
      });
    }

    // ==========================================
    // 4. MONTAR RESPOSTA
    // ==========================================
    const journey = journeyMetadata || {
      id: journeyId,
      title: `Jornada Clínica ${journeyId}`,
      disorder: 'Clinical Case',
      difficulty: 'intermediate',
      total_sessions: sessions.length
    };

    const response = {
      success: true,
      journey,
      sessions: sessions.sort((a, b) => a.session_number - b.session_number),
      metadata: {
        cached: false,
        cache_ttl_seconds: CACHE_TTL / 1000,
        loaded_at: new Date().toISOString(),
        total_sessions: sessions.length
      }
    };

    // ==========================================
    // 5. ARMAZENAR EM CACHE
    // ==========================================
    sessionCache.set(cacheKey, {
      journey,
      sessions: response.sessions,
      timestamp: Date.now()
    });

    logger.info('Sessões carregadas com sucesso', {
      journeyId,
      sessionCount: sessions.length,
      cached: true
    });

    return res.json(response);

  } catch (error) {
    logger.error('Erro ao carregar sessões', {
      error: error.message,
      journeyId: req.params.journeyId,
      userId: req.user.id,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to load journey sessions'
    });
  }
});

module.exports = router;
