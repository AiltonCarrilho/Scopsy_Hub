/**
 * Script para atualizar usuários para Premium manualmente
 *
 * Uso:
 * node scripts/upgrade-user-premium.js email@exemplo.com
 *
 * Ou para múltiplos usuários:
 * node scripts/upgrade-user-premium.js email1@exemplo.com email2@exemplo.com email3@exemplo.com
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key bypassa RLS
);

async function upgradeToPremium(email) {
    console.log(`\n🔍 Buscando usuário: ${email}...`);

    // Buscar usuário por email
    const { data: user, error: findError } = await supabase
        .from('users')
        .select('id, email, name, plan, trial_ends_at')
        .eq('email', email)
        .single();

    if (findError || !user) {
        console.error(`❌ Usuário não encontrado: ${email}`);
        return false;
    }

    console.log(`\n📋 Dados atuais:`);
    console.log(`   Nome: ${user.name || 'N/A'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Plano atual: ${user.plan || 'free'}`);
    console.log(`   Trial ends: ${user.trial_ends_at || 'N/A'}`);

    // Atualizar para premium
    console.log(`\n🔄 Atualizando para Premium...`);

    const { data, error } = await supabase
        .from('users')
        .update({
            plan: 'premium',
            trial_ends_at: null // Remove trial limit
        })
        .eq('id', user.id)
        .select();

    if (error) {
        console.error(`❌ Erro ao atualizar:`, error);
        return false;
    }

    console.log(`✅ SUCESSO! ${user.email} agora é PREMIUM!`);
    console.log(`\n🎉 Benefícios Premium ativados:`);
    console.log(`   ✅ Casos ilimitados`);
    console.log(`   ✅ Todos os assistentes`);
    console.log(`   ✅ Sistema de gamificação completo`);
    console.log(`   ✅ Badges e conquistas`);
    console.log(`   ✅ Certificado de conclusão`);
    console.log(`   ✅ Sem limite de trial`);

    return true;
}

async function main() {
    const emails = process.argv.slice(2);

    if (emails.length === 0) {
        console.log('❌ Uso: node scripts/upgrade-user-premium.js email@exemplo.com');
        console.log('\nExemplo:');
        console.log('   node scripts/upgrade-user-premium.js socia1@exemplo.com socia2@exemplo.com');
        process.exit(1);
    }

    console.log('🚀 Upgrade para Premium - Scopsy Lab\n');
    console.log(`📧 Usuários para atualizar: ${emails.length}`);

    let successCount = 0;
    let failCount = 0;

    for (const email of emails) {
        const success = await upgradeToPremium(email);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
        console.log('─'.repeat(60));
    }

    console.log(`\n📊 RESUMO:`);
    console.log(`   ✅ Sucesso: ${successCount}`);
    console.log(`   ❌ Falhas: ${failCount}`);
    console.log(`   📋 Total: ${emails.length}\n`);
}

main();
