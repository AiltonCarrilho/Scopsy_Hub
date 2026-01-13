/**
 * HEALTH CHECK ROUTE
 * ===================
 * Endpoint para monitoramento e keep-alive do Supabase
 * 
 * Este endpoint faz duas coisas:
 * 1. Mantém o serviço Render acordado
 * 2. Faz um ping no Supabase para evitar pausa por inatividade
 * 
 * Configure um serviço de uptime (UptimeRobot, Cron-Job.org) 
 * para chamar este endpoint a cada 5-10 minutos
 */

const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const { supabase } = require('../services/supabase');

/**
 * GET /api/health
 * Health check completo com ping no Supabase
 */
router.get('/', async (req, res) => {
    const startTime = Date.now();
    let supabaseStatus = 'unknown';
    let supabaseLatency = null;

    try {
        // Ping simples no Supabase - SELECT 1 em qualquer tabela
        const supabaseStart = Date.now();
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        supabaseLatency = Date.now() - supabaseStart;

        if (error) {
            // Mesmo com erro, o importante é que houve conexão
            // Se a tabela não existir, ainda assim o Supabase é "acordado"
            logger.warn(`⚠️ Health check Supabase warning: ${error.message}`);
            supabaseStatus = 'connected_with_warning';
        } else {
            supabaseStatus = 'healthy';
        }
    } catch (err) {
        logger.error(`❌ Health check Supabase error: ${err.message}`);
        supabaseStatus = 'error';
    }

    const totalLatency = Date.now() - startTime;

    // Log para rastreamento
    logger.info(`🏥 Health check - Supabase: ${supabaseStatus} (${supabaseLatency}ms) | Total: ${totalLatency}ms`);

    res.json({
        status: supabaseStatus === 'healthy' || supabaseStatus === 'connected_with_warning' ? 'OK' : 'DEGRADED',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        services: {
            render: {
                status: 'healthy',
                uptime: `${Math.floor(process.uptime() / 60)} minutes`
            },
            supabase: {
                status: supabaseStatus,
                latency: supabaseLatency ? `${supabaseLatency}ms` : null
            }
        },
        latency: `${totalLatency}ms`,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

/**
 * GET /api/health/ping
 * Ping ultraleve - apenas confirma que o servidor está respondendo
 * Útil para monitoramento mais frequente sem overhead
 */
router.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

/**
 * GET /api/health/supabase
 * Testa especificamente a conexão com o Supabase
 */
router.get('/supabase', async (req, res) => {
    try {
        const startTime = Date.now();

        // Query mais completa para garantir que o DB está funcionando
        const { data, error } = await supabase.rpc('check_health', {});

        // Se a função não existir, tenta um select simples
        if (error && error.message.includes('function')) {
            const { data: fallbackData, error: fallbackError } = await supabase
                .from('users')
                .select('COUNT(*)', { count: 'exact' });

            if (fallbackError) {
                throw fallbackError;
            }
        } else if (error) {
            throw error;
        }

        const latency = Date.now() - startTime;

        res.json({
            status: 'OK',
            message: 'Supabase is responsive',
            latency: `${latency}ms`,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        logger.error(`❌ Supabase health check failed: ${err.message}`);
        res.status(503).json({
            status: 'ERROR',
            message: 'Supabase connection failed',
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
