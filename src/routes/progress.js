const express = require('express');
const router = express.Router();
const { authenticateRequest } = require('../middleware/auth');
const { getFromBoostspace } = require('../services/database');
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
 * Retorna o resumo completo de progresso conforme arquitetura solicitada
 */
router.get('/summary', authenticateRequest, async (req, res) => {
    try {
        const userId = req.user.userId;

        // 1. Buscar Plan (tabela users)
        const users = await getFromBoostspace('users', { id: userId });
        if (!users || users.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        const user = users[0];

        // 🐞 DEBUG: Log completo do usuário
        logger.info('🐞 DEBUG USER DATA:', {
            userId,
            plan: user.plan,
            created_at: user.created_at,
            created_at_type: typeof user.created_at,
            created_at_isValid: user.created_at ? !isNaN(new Date(user.created_at).getTime()) : false
        });

        // 2. Buscar Progresso (tabela user_progress)
        const progressEntries = await getFromBoostspace('user_progress', { user_id: userId });

        logger.info('🐞 DEBUG PROGRESS ENTRIES:', {
            userId,
            entriesCount: progressEntries?.length || 0,
            entries: progressEntries
        });

        let totalExercises = 0;
        let totalCorrect = 0;
        let totalCognits = 0;

        // Agregar dados
        if (progressEntries && progressEntries.length > 0) {
            progressEntries.forEach(entry => {
                totalExercises += (entry.total_cases || 0);
                totalCorrect += (entry.correct_diagnoses || 0);
                totalCognits += (entry.cognits || 0); // ✅ Mudança: xp_points → cognits
            });
        }

        // 3. Calcular Métricas Derivadas
        const accuracy = totalExercises > 0
            ? Math.round((totalCorrect / totalExercises) * 100)
            : 0;

        const { level, title } = calculateLevelAndTitle(totalCognits);

        // 4. Trial Limits (Backend Logic) - BLINDAGEM REFORÇADA
        let trialDaysLeft = 7; // Default seguro

        if (user.plan === 'free') {
            let createdAt;

            // ✅ BLINDAGEM: Múltiplos formatos de data
            if (!user.created_at) {
                // Se não tem created_at, assumir criado agora (trial completo)
                logger.warn('⚠️ User sem created_at, usando data atual como fallback', { userId });
                createdAt = new Date();
                trialDaysLeft = 7;
            } else {
                // Tentar parsear a data
                createdAt = new Date(user.created_at);

                // Validar se a data é válida
                if (isNaN(createdAt.getTime())) {
                    logger.error('❌ User created_at INVÁLIDO', {
                        userId,
                        created_at: user.created_at,
                        created_at_type: typeof user.created_at
                    });
                    // Fallback: assumir usuário novo (trial completo)
                    createdAt = new Date();
                    trialDaysLeft = 7;
                } else {
                    // Data válida, calcular dias restantes
                    const now = new Date();
                    const diffTime = Math.abs(now - createdAt);
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    trialDaysLeft = Math.max(0, 7 - diffDays);

                    logger.info('✅ Cálculo Trial bem-sucedido', {
                        userId,
                        created_at_raw: user.created_at,
                        createdAt: createdAt.toISOString(),
                        now: now.toISOString(),
                        diffDays,
                        trialDaysLeft
                    });
                }
            }
        }

        // 5. Retorno Padronizado - BLINDAGEM TOTAL
        const breakdown = {
            raciocinio: Number(progressEntries?.find(p => p.assistant_type === 'case')?.total_cases || 0),
            radar: Number(progressEntries?.find(p => p.assistant_type === 'diagnostic')?.total_cases || 0),
            conceituacao: Number(progressEntries?.find(p => p.assistant_type === 'case_conceptualization')?.total_cases || 0),
            jornada: Number(progressEntries?.find(p => p.assistant_type === 'journey')?.total_cases || 0)
        };

        // 🐞 DEBUG: Log valores finais antes de enviar
        logger.info('📤 RETORNO FINAL /api/progress/summary:', {
            userId,
            plan: user.plan || 'free',
            trial_days_left: trialDaysLeft,
            breakdown,
            totalCognits,
            level,
            title
        });

        res.json({
            success: true,
            plan: user.plan || 'free',
            trial_days_left: Number(trialDaysLeft) || 7, // ✅ Garantir número

            // Stats
            exercises_done: Number(totalExercises) || 0,
            correct_answers: Number(totalCorrect) || 0,
            accuracy: Number(accuracy) || 0,

            // Gamification
            cognits: Number(totalCognits) || 0, // ✅ Cognits = unidades de sabedoria cognitiva
            level: Number(level) || 1,
            clinical_title: title || 'Estudante de Lente',

            // Contadores Específicos (para limites trial)
            breakdown: breakdown
        });

    } catch (error) {
        logger.error('❌ Erro ao buscar resumo de progresso', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.userId
        });

        // ✅ FALLBACK SEGURO: Em vez de retornar apenas erro,
        // retornar dados padrão para não quebrar o frontend
        res.status(200).json({
            success: true,
            plan: 'free',
            trial_days_left: 7, // Assumir trial completo em caso de erro

            // Stats default
            exercises_done: 0,
            correct_answers: 0,
            accuracy: 0,

            // Gamification default
            cognits: 0,
            level: 1,
            clinical_title: 'Estudante de Lente',

            // Breakdown default (zero em tudo)
            breakdown: {
                raciocinio: 0,
                radar: 0,
                conceituacao: 0,
                jornada: 0
            },

            // Flag de erro para frontend (opcional)
            _error: 'Erro ao carregar progresso, usando valores padrão'
        });
    }
});

module.exports = router;
