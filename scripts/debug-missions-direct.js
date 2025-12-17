require('dotenv').config();
// Fix env vars names for local script
process.env.SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

const { generateDailyMissions, getDailyMissions } = require('../src/services/missionService');
const { createClient } = require('@supabase/supabase-js');

async function debug() {
    console.log('🔍 Debugging Mission Service directly...');

    // 1. Create a dummy user directly in DB to avoid Auth complexity
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

    // Random Key for user unique constraint (email)
    const email = `debug_${Date.now()}@test.com`;

    const { data: user, error: uErr } = await supabase.from('users').insert({
        email: email,
        name: 'Debug User',
        password_hash: 'ignore',
        plan: 'free',
        cognits: 0,
        level: 1
    }).select().single();

    if (uErr) {
        console.error('❌ Error creating debug user:', uErr);
        // Tentar pegar um existente
        const { data: existing } = await supabase.from('users').select('*').limit(1).single();
        if (existing) {
            console.log('⚠️ Using existing user:', existing.id);
            await runTest(existing.id);
        }
        return;
    }

    console.log('✅ Debug User Created:', user.id);
    await runTest(user.id);
}

async function runTest(userId) {
    try {
        console.log('▶️ Calling generateDailyMissions...');
        const missions = await generateDailyMissions(userId);
        console.log('✅ result:', missions);

        console.log('▶️ Calling getDailyMissions...');
        const fetched = await getDailyMissions(userId);
        console.log('✅ fetched:', fetched.length);

    } catch (e) {
        console.error('❌ EXCEPTION:', e);
    }
}

debug();
