const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabase');
const logger = require('../config/logger');

// ========================================
// GET /api/health
// Health Check com Ping no Banco
// ========================================
router.get('/', async (req, res) => {
    const start = Date.now();
    let dbStatus = 'unknown';
    let dbLatency = 0;

    try {
        // Query leve para verificar conexão com Supabase
        // Apenas conta 1 registro na tabela users
        const { count, error } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;

        dbStatus = 'connected';
        dbLatency = Date.now() - start;

        // Log periódico apenas pra debug (opcional, pode ser ruidoso)
        // logger.info('✅ Health Check: Database OK', { latency: dbLatency });

        res.json({
            status: 'OK',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            database: {
                status: dbStatus,
                latency_ms: dbLatency,
                users_count: count // Informativo, mostra que leu do banco
            },
            service: 'scopsy-backend',
            version: process.env.npm_package_version || '1.0.0'
        });

    } catch (error) {
        logger.error('❌ Health Check Falhou:', error);
        
        res.status(500).json({
            status: 'ERROR',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            database: {
                status: 'disconnected',
                error: error.message
            }
        });
    }
});

module.exports = router;
