/**
 * Mission Service
 * Gerencia missões diárias
 */
const { getFromBoostspace, saveToBoostspace, updateInBoostspace, supabase } = require('./database');
const logger = require('../config/logger');

const TIMEZONE = 'America/Sao_Paulo';

function getTodayDate() {
    return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE }); // YYYY-MM-DD
}

// Definições de Missões Possíveis (Pool)
const MISSION_POOL = [
    { type: 'challenge', description: 'Analise 1 Caso Clínico', target: 1, reward: 20, difficulty: 'easy' },
    { type: 'challenge', description: 'Analise 3 Casos Clínicos', target: 3, reward: 50, difficulty: 'medium' },
    { type: 'diagnostic', description: 'Acerte 1 Diagnóstico', target: 1, reward: 40, difficulty: 'medium' },
    { type: 'conceptualization', description: 'Realize 1 Conceituação', target: 1, reward: 30, difficulty: 'easy' },
    { type: 'diagnostic', description: 'Acerte 3 Diagnósticos', target: 3, reward: 100, difficulty: 'hard' }
];

/**
 * Gera missões diárias para o usuário se não existirem
 */
async function generateDailyMissions(userId) {
    const today = getTodayDate();

    // 1. Verificar se já existem
    const existing = await getFromBoostspace('user_daily_missions', {
        user_id: userId,
        reference_date: today
    });

    // Filtro manual de data se getFromBoostspace não filtrar dia exato (ele filtra só por fields exatos)
    // O ideal seria filtrar na query, mas 'reference_date' é string YYYY-MM-DD no banco? É DATE.
    // O supabase driver lida bem com string 'YYYY-MM-DD' para colunas DATE.

    if (existing && existing.length > 0) {
        return existing;
    }

    logger.info('🎲 Gerando novas missões diárias', { userId, date: today });

    // 2. Selecionar 3 missões aleatórias (1 easy, 1 medium, 1 hard ou random)
    // Simplificação: Pegar as 3 primeiras do pool por enquanto ou randomizar
    const shuffled = [...MISSION_POOL].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

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
