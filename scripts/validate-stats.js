require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const logger = require('../src/config/logger');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function validateStats(userId) {
    console.log(`🔍 Validating Stats for User: ${userId}`);

    // 1. Fetch User Data
    const { data: user, error: uErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (uErr) {
        console.error('❌ Error fetching user:', uErr.message);
        return;
    }

    // 2. Validate Streak
    // Recalculate streak from logs
    const { data: logs, error: lErr } = await supabase
        .from('user_activity_log')
        .select('activity_date')
        .eq('user_id', userId)
        .order('activity_date', { ascending: false });

    if (lErr) {
        console.error('❌ Error fetching logs:', lErr.message);
    } else {
        const calculatedStreak = calculateStreakFromLogs(logs);
        console.log(`\n🔥 Streak Check:`);
        console.log(`   - Stored: ${user.current_streak}`);
        console.log(`   - Calculated: ${calculatedStreak}`);

        if (user.current_streak !== calculatedStreak) {
            console.warn('   ⚠️ MISMATCH! Streak stored in user table differs from log calculation.');
        } else {
            console.log('   ✅ Match');
        }
    }

    // 3. Validate Copgnits (Exemplo básico)
    // Se tivermos tabela de histórico de pontos, somaríamos.
    console.log(`\n⭐ Cognits Check:`);
    console.log(`   - Current: ${user.cognits || 0}`);
    console.log(`   - (Detailed history not available for full validation yet)`);

}

function calculateStreakFromLogs(logs) {
    if (!logs || logs.length === 0) return 0;

    // Unique dates set
    const dates = [...new Set(logs.map(l => l.activity_date))].sort().reverse();

    // Check consecutive days from today/yesterday
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Se a última atividade não foi hoje ou ontem, streak quebrou (é 0)
    // Exceto se estamos no meio do dia e o usuário ainda não logou?
    // Minha lógica de streakService reseta no login.
    // O cálculo REAIS é: dias consecutivos a partir do mais recente.

    if (dates.length === 0) return 0;

    // Se o último dia não for hoje nem ontem, streak deve ser 0 (mas pode estar armazenado antigo se o user não logou)
    // O valor no banco só atualiza quando o user loga/age.
    // Então "Stored" é "Snapshot no último login".

    let currentDate = new Date(dates[0]);
    // Iterar para trás
    // ... simplificação para teste:
    // Apenas conta dias consecutivos no array `dates` (que já está ordenado desc)

    // Não vou implementar lógica complexa de data aqui agora, vou confiar no streakService.
    // Esse validador é mais para ver se TEM dados.
    return 'Pending Implementation of Full Calc';
}

// Se rodar direto: node validate-stats.js <userId>
const args = process.argv.slice(2);
if (args.length > 0) {
    validateStats(args[0]);
} else {
    console.log('Usage: node scripts/validate-stats.js <user_id>');
    // Tenta pegar o primeiro usuário do banco
    (async () => {
        const { data } = await supabase.from('users').select('id, email').limit(1);
        if (data && data.length > 0) {
            console.log(`Picking random user: ${data[0].email}`);
            validateStats(data[0].id);
        } else {
            console.log('No users found.');
        }
    })();
}
