const express = require('express');
const router = express.Router();
const { authenticateRequest } = require('../middleware/auth');
const { getFromBoostspace, deleteFromBoostspace } = require('../services/database');
const { getICCTier } = require('../services/iccService');
const logger = require('../config/logger');

// ===========================================
// CONFIGURAÇÃO DE GAMIFICAÇÃO
// ===========================================
const XP_TITLES = [
    { level: 1, title: 'Estudante de Lente', min: 0, max: 150 },
    { level: 2, title: 'Observador Clínico', min: 0, max: 150 }, // Nota: Levels 1-3 compartilham range no doc, ajustaremos lógica
    { level: 3, title: 'Apontador de Sintomas', min: 0, max: 150 },

    // Intermediário (151-500)
    { level: 4, title: 'Decodificador Diagnóstico', min: 151, max: 500 },
    { level: 5, title: 'Mapeador de Comorbidades', min: 151, max: 500 },
    { level: 6, title: 'Construtor de Linha do Tempo', min: 151, max: 500 },

    // Avançado (501-1200)
    { level: 7, title: 'Lente Rápida', min: 501, max: 1200 },
    { level: 8, title: 'Escultor de Conceituação', min: 501, max: 1200 },
    { level: 9, title: 'Terapeuta de Estratégia', min: 501, max: 1200 },

    // Maestria (1201+)
    { level: 10, title: 'Arquiteto Cognitivo', min: 1201, max: 99999 },
    { level: 11, title: 'Mentor de Diagnóstico', min: 1201, max: 99999 },
    { level: 12, title: 'Clínico de Alta Performance', min: 1201, max: 99999 }
];

// Função Helper para determinar Título e Nível baseado nos Cognits Totais
function calculateLevelAndTitle(totalCognits) {
    // Sistema de Progressão baseado em Cognits (unidades de sabedoria cognitiva)
    // Documentação: GAMIFICAÇÃO - Sistema de Níveis, Cognits e Títulos Clínicos
    // Faixas: Inicial (0-150), Intermediário (151-500), Avançado (501-1200), Maestria (1201+)

    let level = 1;
    let title = 'Estudante de Lente';

    if (totalCognits <= 150) {
        // Inicial: 0-150 cognits
        if (totalCognits < 50) { level = 1; title = 'Estudante de Lente'; }
        else if (totalCognits < 100) { level = 2; title = 'Observador Clínico'; }
        else { level = 3; title = 'Apontador de Sintomas'; }
    } else if (totalCognits <= 500) {
        // Intermediário: 151-500 cognits
        if (totalCognits < 266) { level = 4; title = 'Decodificador Diagnóstico'; }
        else if (totalCognits < 383) { level = 5; title = 'Mapeador de Comorbidades'; }
        else { level = 6; title = 'Construtor de Linha do Tempo'; }
    } else if (totalCognits <= 1200) {
        // Avançado: 501-1200 cognits
        if (totalCognits < 733) { level = 7; title = 'Lente Rápida'; }
        else if (totalCognits < 966) { level = 8; title = 'Escultor de Conceituação'; }
        else { level = 9; title = 'Terapeuta de Estratégia'; }
    } else {
        // Maestria: 1201+ cognits
        if (totalCognits < 2000) { level = 10; title = 'Arquiteto Cognitivo'; }
        else if (totalCognits < 3000) { level = 11; title = 'Mentor de Diagnóstico'; }
        else { level = 12; title = 'Clínico de Alta Performance'; }
    }

    return { level, title };
}


/**
 * GET /api/progress/summary
 * Retorna resumo de progresso DIFERENCIADO para Trial vs Premium
 */
router.get('/summary', authenticateRequest, async (req, res) => {
    try {
        const userId = req.user.userId;

        // 1. Buscar usuário
        const users = await getFromBoostspace('users', { id: userId });
        if (!users || users.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        const user = users[0];
        const userPlan = user.plan || 'free';
        const isTrial = userPlan === 'free';

        logger.info('📊 /api/progress/summary:', { userId, plan: userPlan, isTrial });

        // 2. Buscar progresso por assistente
        const progressEntries = await getFromBoostspace('user_progress', { user_id: userId });

        // 3. Montar breakdown por assistente
        const breakdown = {
            raciocinio: Number(progressEntries?.find(p => p.assistant_type === 'case')?.total_cases || 0),
            radar: Number(progressEntries?.find(p => p.assistant_type === 'diagnostic')?.total_cases || 0),
            conceituacao: Number(progressEntries?.find(p => p.assistant_type === 'case_conceptualization')?.total_cases || 0),
            jornada: Number(progressEntries?.find(p => p.assistant_type === 'journey')?.total_cases || 0)
        };

        // 4. TRIAL: Calcular limites e dias restantes
        if (isTrial) {
            // Limites fixos do Trial
            const TRIAL_LIMITS = {
                raciocinio: 30,    // Desafios Clínicos
                radar: 30,         // Radar Diagnóstico
                conceituacao: 7,   // Conceituação Cognitiva
                jornada: 0         // Bloqueado (só Premium)
            };

            // Calcular remaining por assistente
            const remaining = {
                raciocinio: Math.max(0, TRIAL_LIMITS.raciocinio - breakdown.raciocinio),
                radar: Math.max(0, TRIAL_LIMITS.radar - breakdown.radar),
                conceituacao: Math.max(0, TRIAL_LIMITS.conceituacao - breakdown.conceituacao),
                jornada: 0  // Sempre bloqueado no Trial
            };

            // Calcular dias restantes
            let trialDaysLeft = 7;
            if (user.created_at) {
                const createdAt = new Date(user.created_at);
                if (!isNaN(createdAt.getTime())) {
                    const now = new Date();
                    const diffDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
                    trialDaysLeft = Math.max(0, 7 - diffDays);
                }
            }

            logger.info('✅ TRIAL:', { userId, trialDaysLeft, breakdown, remaining });

            return res.json({
                success: true,
                plan: 'free',
                trial_days_left: trialDaysLeft,

                limits: TRIAL_LIMITS,
                breakdown: breakdown,
                remaining: remaining
            });
        }

        // 5. PREMIUM: Calcular cognits, level, título e ACURÁCIA
        let totalCognits = 0;
        let totalCases = 0;
        let totalCorrect = 0;

        if (progressEntries && progressEntries.length > 0) {
            progressEntries.forEach(entry => {
                // ⚠️ Usando xp_points até migrar coluna
                totalCognits += (entry.xp_points || entry.cognits || 0);

                // Calcular acurácia
                totalCases += (entry.total_cases || 0);
                totalCorrect += (entry.correct_diagnoses || 0);
            });
        }

        // Calcular acurácia percentual
        const accuracy = totalCases > 0
            ? Math.round((totalCorrect / totalCases) * 100)
            : 0;

        const { level, title } = calculateLevelAndTitle(totalCognits);

        // Calcular próximo nível
        let nextLevelAt = 151; // Default (nível 4)
        if (totalCognits < 151) nextLevelAt = 151;
        else if (totalCognits < 501) nextLevelAt = 501;
        else if (totalCognits < 1201) nextLevelAt = 1201;
        else nextLevelAt = totalCognits + 500; // Maestria continua crescendo

        const nextLevelRemaining = Math.max(0, nextLevelAt - totalCognits);

        logger.info('✅ PREMIUM:', {
            userId,
            totalCognits,
            level,
            title,
            accuracy,
            totalCases,
            totalCorrect
        });

        // ICC (Índice de Confiança Clínica)
        const iccScore = Number(user.icc_score) || 0;
        const icc = {
            score: iccScore,
            acuracia: Number(user.icc_acuracia) || 0,
            consistencia: Number(user.icc_consistencia) || 0,
            variedade: Number(user.icc_variedade) || 0,
            complexidade: Number(user.icc_complexidade) || 0,
            ...getICCTier(iccScore)
        };

        return res.json({
            success: true,
            plan: userPlan,

            cognits: totalCognits,
            level: level,
            clinical_title: title,
            accuracy: accuracy,

            icc: icc,

            breakdown: breakdown,

            stats: {
                total_cases: totalCases,
                correct_cases: totalCorrect,
                accuracy_rate: accuracy
            },

            next_level: {
                at: nextLevelAt,
                remaining: nextLevelRemaining
            }
        });

    } catch (error) {
        logger.error('❌ Erro em /api/progress/summary:', {
            error: error.message,
            userId: req.user?.userId
        });

        // Fallback seguro
        res.status(200).json({
            success: true,
            plan: 'free',
            trial_days_left: 7,
            limits: { raciocinio: 30, radar: 30, conceituacao: 7, jornada: 0 },
            breakdown: { raciocinio: 0, radar: 0, conceituacao: 0, jornada: 0 },
            remaining: { raciocinio: 30, radar: 30, conceituacao: 7, jornada: 0 },
            _error: 'Fallback - erro ao carregar dados'
        });
    }
});

/**
 * POST /api/progress/reset
 * 🗑️ DEBUG: Reseta o progresso do usuário (apaga todos os registros de user_progress)
 * ATENÇÃO: Usar apenas para debug/testes
 */
router.post('/reset', authenticateRequest, async (req, res) => {
    try {
        const userId = req.user.userId;

        logger.warn('🗑️ RESET DE PROGRESSO SOLICITADO', { userId });

        // Buscar todos os registros de progresso do usuário
        const progressEntries = await getFromBoostspace('user_progress', { user_id: userId });

        if (!progressEntries || progressEntries.length === 0) {
            return res.json({
                success: true,
                message: 'Nenhum registro de progresso encontrado',
                deleted_count: 0
            });
        }

        // Deletar cada registro
        let deletedCount = 0;
        for (const entry of progressEntries) {
            try {
                logger.info('🗑️ Deletando entrada de progresso', { entryId: entry.id, userId });

                await deleteFromBoostspace('user_progress', entry.id);

                deletedCount++;
            } catch (delError) {
                logger.error('❌ Erro ao deletar entrada de progresso', {
                    error: delError.message,
                    entryId: entry.id,
                    userId
                });
            }
        }

        logger.info('✅ Reset de progresso concluído', { userId, deletedCount });

        res.json({
            success: true,
            message: 'Progresso resetado com sucesso',
            deleted_count: deletedCount
        });

    } catch (error) {
        logger.error('❌ Erro ao resetar progresso', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.userId
        });

        res.status(500).json({
            success: false,
            error: 'Erro ao resetar progresso'
        });
    }
});

module.exports = router;
