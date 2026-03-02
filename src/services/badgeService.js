/**
 * Badge Service
 * Gerencia a conquista e verificação de medalhas
 */
const { getFromBoostspace, saveToBoostspace, supabaseAdmin: supabase } = require('./database');
const logger = require('../config/logger');

/**
 * Verifica e concede medalhas baseadas em gatilhos
 * @param {string} userId
 * @param {string} date - Data de referência (opcional)
 */
async function checkAndAwardBadges(userId) {
    logger.info(`🏅 Checking badges for user ${userId}`);
    const newBadges = [];

    try {
        // 1. Buscar dados do usuário (Stats)
        const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
        if (!user) return [];

        // 2. Buscar medalhas já conquistadas
        const { data: earned } = await supabase.from('user_badges').select('badge_slug').eq('user_id', userId);
        const earnedSlugs = new Set(earned ? earned.map(b => b.badge_slug) : []);

        // 3. Buscar definições de medalhas
        const { data: definitions } = await supabase.from('badges').select('*');
        if (!definitions) return [];

        // 4. Verificar cada medalha não conquistada
        for (const badge of definitions) {
            if (earnedSlugs.has(badge.slug)) continue;

            let earnedIt = false;

            // Lógica de verificação hardcoded baseada no slug
            // Idealmente poderia ser dinâmica, mas hardcoded é mais seguro e flexível para regras complexas
            switch (badge.slug) {
                // --- STREAKS ---
                case 'streak-3':
                    if (user.longest_streak >= 3 || user.current_streak >= 3) earnedIt = true;
                    break;
                case 'streak-7':
                    if (user.longest_streak >= 7 || user.current_streak >= 7) earnedIt = true;
                    break;
                case 'streak-30':
                    if (user.longest_streak >= 30 || user.current_streak >= 30) earnedIt = true;
                    break;

                // --- LOGIN (Pioneiro/First login) ---
                case 'first-login':
                    // Se o usuário logou (e estamos aqui), ele ganhou.
                    earnedIt = true;
                    break;
                case 'pioneer':
                    // Verifica data de criação antes de 2025 (exemplo de regra Beta)
                    // Ou manual. Vou deixar false por padrão ou checar data.
                    const creation = new Date(user.created_at);
                    if (creation < new Date('2025-01-01')) earnedIt = true;
                    break;

                // --- LEARNING (Analista) ---
                // Precisamos contar os casos analisados.
                // Isso pode ser custoso, ideal usar contador no user ou count() na tabela logs/progress.
                case 'analyst-novice': // 5 casos
                case 'analyst-expert': // 50 casos
                    const caseCount = await countActivities(userId, 'challenge'); // ou 'case'
                    if (badge.slug === 'analyst-novice' && caseCount >= 5) earnedIt = true;
                    else if (badge.slug === 'analyst-expert' && caseCount >= 50) earnedIt = true;
                    break;

                case 'sharp-eye': // 10 diagnósticos corretos
                    const diagCount = await countActivities(userId, 'diagnostic', true); // is_correct param?
                    // Minha tabela user_activity_log não tem 'is_correct'.
                    // Precisaria consultar a tabela de respostas de diagnóstico ou confiar em contador no user.
                    // Vou pular por enqunato se não tiver tabela fácil.
                    break;
            }

            if (earnedIt) {
                logger.info(`🎉 Awarding badge ${badge.slug} to ${userId}`);

                const { error } = await supabase.from('user_badges').insert({
                    user_id: userId,
                    badge_slug: badge.slug,
                    earned_at: new Date()
                });

                if (!error) {
                    newBadges.push(badge);
                    // Opcional: Dar XP bonus do badge
                    if (badge.xp_bonus > 0) {
                        // Adicionar XP (via progress service ou direto)
                        // await addXp(userId, badge.xp_bonus);
                    }
                } else {
                    logger.error(`Error awarding badge ${badge.slug}`, { error });
                }
            }
        }

    } catch (error) {
        logger.error('Error in checkAndAwardBadges', { error });
    }

    return newBadges;
}

// Helper para contar atividades
async function countActivities(userId, type, mustBeSucces = false) {
    // Se tiver user_activity_log
    const { count, error } = await supabase
        .from('user_activity_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('activity_type', type);

    return count || 0;
}

async function getUserBadges(userId) {
    // Join user_badges com badges definitions
    const { data, error } = await supabase
        .from('user_badges')
        .select('*, badges(*)') // Join
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

    if (error) return [];

    // Flat structure
    return data.map(ub => ({
        ...ub.badges,
        earned_at: ub.earned_at,
        is_seen: ub.is_seen
    }));
}

async function getAllBadges() {
    const { data } = await supabase.from('badges').select('*').order('xp_bonus', { ascending: true });
    return data || [];
}

module.exports = {
    checkAndAwardBadges,
    getUserBadges,
    getAllBadges
};
