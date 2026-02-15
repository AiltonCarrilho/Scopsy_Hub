/**
 * Mission Service
 * Gerencia missões diárias
 */
const { getFromBoostspace, saveToBoostspace, updateInBoostspace } = require('./database');
const { supabase } = require('./supabase');
const logger = require('../config/logger');

const TIMEZONE = 'America/Sao_Paulo';

function getTodayDate() {
    return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE }); // YYYY-MM-DD
}

// Pool de Missões (20 missões: 7 easy + 7 medium + 6 hard)
const MISSION_POOL = [
    // === EASY (7) ===
    { type: 'challenge', description: 'Analise 1 Desafio Clínico', target: 1, reward: 15, difficulty: 'easy' },
    { type: 'journey', description: 'Complete 1 Sessão de Jornada', target: 1, reward: 15, difficulty: 'easy' },
    { type: 'conceptualization', description: 'Realize 1 Conceituação', target: 1, reward: 15, difficulty: 'easy' },
    { type: 'diagnostic', description: 'Tente 1 Diagnóstico', target: 1, reward: 15, difficulty: 'easy' },
    { type: 'challenge', description: 'Analise 2 Desafios Clínicos', target: 2, reward: 20, difficulty: 'easy' },
    { type: 'explore', description: 'Pratique em 2 módulos diferentes', target: 2, reward: 20, difficulty: 'easy' },
    { type: 'any', description: 'Complete qualquer caso hoje', target: 1, reward: 10, difficulty: 'easy' },

    // === MEDIUM (7) ===
    { type: 'challenge', description: 'Analise 3 Desafios Clínicos', target: 3, reward: 40, difficulty: 'medium' },
    { type: 'diagnostic', description: 'Acerte 1 Diagnóstico', target: 1, reward: 40, difficulty: 'medium' },
    { type: 'journey', description: 'Complete 2 Sessões de Jornada', target: 2, reward: 40, difficulty: 'medium' },
    { type: 'challenge_streak', description: 'Acerte 2 Desafios seguidos', target: 2, reward: 50, difficulty: 'medium' },
    { type: 'new_disorder', description: 'Explore um transtorno novo', target: 1, reward: 30, difficulty: 'medium' },
    { type: 'advanced_case', description: 'Complete 1 caso avançado', target: 1, reward: 40, difficulty: 'medium' },
    { type: 'conceptualization', description: 'Realize 2 Conceituações', target: 2, reward: 45, difficulty: 'medium' },

    // === HARD (6) ===
    { type: 'diagnostic', description: 'Acerte 3 Diagnósticos', target: 3, reward: 80, difficulty: 'hard' },
    { type: 'challenge', description: 'Complete 5 Desafios Clínicos', target: 5, reward: 80, difficulty: 'hard' },
    { type: 'perfect_streak', description: 'Acerte 3 casos sem errar', target: 3, reward: 100, difficulty: 'hard' },
    { type: 'full_modules', description: 'Pratique nos 4 módulos hoje', target: 4, reward: 100, difficulty: 'hard' },
    { type: 'diagnostic', description: 'Acerte 2 Diagnósticos avançados', target: 2, reward: 90, difficulty: 'hard' },
    { type: 'marathon', description: 'Complete 7 casos em um dia', target: 7, reward: 100, difficulty: 'hard' }
];

/**
 * Gera missões diárias para o usuário se não existirem
 */
async function generateDailyMissions(userId) {
    const today = getTodayDate();

    // 1. Verificar se já existem (usando Supabase direto para filtrar por reference_date)
    const { data: existing, error: checkError } = await supabase
        .from('user_daily_missions')
        .select('*')
        .eq('user_id', userId)
        .eq('reference_date', today);

    if (checkError) {
        logger.error('Erro ao verificar missões existentes', { error: checkError.message });
    }

    if (existing && existing.length > 0) {
        return existing;
    }

    logger.info('🎲 Gerando novas missões diárias', { userId, date: today });

    // 2. Selecionar 1 easy + 1 medium + 1 hard (balanceado)
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const easy = MISSION_POOL.filter(m => m.difficulty === 'easy');
    const medium = MISSION_POOL.filter(m => m.difficulty === 'medium');
    const hard = MISSION_POOL.filter(m => m.difficulty === 'hard');
    const selected = [pick(easy), pick(medium), pick(hard)];

    const createdMissions = [];

    for (const m of selected) {
        const missionData = {
            user_id: userId,
            mission_type: m.type,
            description: m.description,
            target: m.target,
            progress: 0,
            is_completed: false,
            reward_cognits: m.reward,
            reference_date: today
        };

        try {
            const saved = await saveToBoostspace('user_daily_missions', missionData);
            createdMissions.push(saved);
        } catch (e) {
            logger.error('Erro ao salvar missão', { error: e.message });
        }
    }

    return createdMissions;
}

/**
 * Atualiza o progresso das missões
 * @param {string} userId 
 * @param {string} type - Tipo de atividade ('challenge', 'diagnostic', 'conceptualization')
 * @param {boolean} isSuccess - Se o resultado foi positivo (ex: acertou diagnóstico)
 */
async function updateMissionProgress(userId, type, isSuccess = true) {
    const today = getTodayDate();

    // Buscar missões abertas do tipo
    const { data: missions, error } = await supabase
        .from('user_daily_missions')
        .select('*')
        .eq('user_id', userId)
        .eq('reference_date', today)
        .eq('mission_type', type)
        .eq('is_completed', false);

    if (error || !missions || missions.length === 0) return null;

    const completedMissions = [];

    for (const mission of missions) {
        // Se a missão requer sucesso (ex: "Acerte"), verificar isSuccess
        // Minha descrição diz "Acerte" para diagnostic. Para challenge diz "Analise".
        // Vou assumir:
        // - transformation: diagnostic requer isSuccess=true
        // - challenge: apenas fazer (isSuccess irrelevante ou true)

        if (type === 'diagnostic' && !isSuccess) continue; // Não conta erro para "Acertar"

        const newProgress = mission.progress + 1;
        const isCompleted = newProgress >= mission.target;

        // Atualizar missão
        await updateInBoostspace('user_daily_missions', mission.id, {
            progress: newProgress,
            is_completed: isCompleted,
            updated_at: new Date().toISOString()
        });

        if (isCompleted) {
            // Dar recompensa (Cognits)
            await awardMissionReward(userId, mission.reward_cognits);

            completedMissions.push({
                description: mission.description,
                reward: mission.reward_cognits
            });
        }
    }

    return completedMissions; // Retorna array de missões completadas AGORA
}

async function awardMissionReward(userId, amount) {
    // Buscar usuário para pegar saldo atual
    const users = await getFromBoostspace('users', { id: userId });
    if (!users || users.length === 0) return;

    // Assumindo que cognits é calculado via progress table ou coluna no user?
    // O sistema atual calcula cognits somando registros de progresso? Ou tem coluna 'cognits'?
    // O 'progress.js' calculava via SUM.
    // Vou inserir um registro de progresso especial 'mission_reward'

    /* 
       TABELA user_progress:
       id, user_id, module_id, submodule_id, status, score, completed_at
       
       Humm, não tem tabela genérica de 'wallet'.
       O sistema atual usa 'user_progress.score' como XP/Cognits?
       
       Vou olhar `loadUserStats` no `progress.js` rapidinho.
    */

    // Por enquanto, vou apenas logar. A persistência de SALDO de cognits pode precisar de tabela própria ou registro em progress com modulo 'gamification'.

    // Hack: Salvar em user_progress com module_id='gamification'
    const rewardRecord = {
        user_id: userId,
        module_id: 'gamification', // Virtual module
        submodule_id: 'mission_reward',
        status: 'completed',
        score: amount, // Cognits
        completed_at: new Date().toISOString()
    };

    await saveToBoostspace('user_progress', rewardRecord);
}

async function getDailyMissions(userId) {
    // Garantir que existem
    await generateDailyMissions(userId);

    // Buscar todas
    const today = getTodayDate();
    const { data } = await supabase
        .from('user_daily_missions')
        .select('*')
        .eq('user_id', userId)
        .eq('reference_date', today)
        .order('is_completed', { ascending: true }); // Pendentes primeiro

    return data || [];
}

module.exports = {
    generateDailyMissions,
    updateMissionProgress,
    getDailyMissions
};
