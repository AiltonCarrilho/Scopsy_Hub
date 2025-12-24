/**
 * Script para criar contas Premium direto no Supabase
 * Uso: node scripts/create-premium-accounts.js
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Contas para criar
const accounts = [
    {
        name: 'Alessandra',
        email: 'alessandra@scopsy.com.br',
        password: 'senha123456',
        plan: 'premium'
    },
    {
        name: 'Laura',
        email: 'laura@scopsy.com.br',
        password: 'senha123456',
        plan: 'premium'
    }
];

async function createAccount(account) {
    console.log(`\n🔄 Criando conta: ${account.email}...`);

    // Verificar se já existe
    const { data: existing } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', account.email)
        .single();

    if (existing) {
        console.log(`⚠️  Usuário já existe: ${account.email}`);
        console.log(`   Atualizando para Premium...`);

        const { error } = await supabase
            .from('users')
            .update({ plan: 'premium', trial_ends_at: null })
            .eq('email', account.email);

        if (error) {
            console.error(`❌ Erro ao atualizar:`, error.message);
            return false;
        }

        console.log(`✅ ${account.email} atualizado para PREMIUM!`);
        return true;
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(account.password, 12);

    // Criar usuário
    const { data, error } = await supabase
        .from('users')
        .insert({
            name: account.name,
            email: account.email,
            password_hash: passwordHash,
            plan: account.plan,
            trial_ends_at: null,
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error(`❌ Erro ao criar conta:`, error.message);
        return false;
    }

    console.log(`✅ Conta criada com sucesso!`);
    console.log(`   📧 Email: ${account.email}`);
    console.log(`   👤 Nome: ${account.name}`);
    console.log(`   🎯 Plano: ${account.plan.toUpperCase()}`);
    console.log(`   🔑 Senha: ${account.password}`);

    // Criar stats iniciais
    const { error: statsError } = await supabase
        .from('user_stats')
        .insert({
            user_id: data.id,
            cases_completed: 0,
            practice_hours: 0,
            accuracy: 0,
            streak_days: 0,
            last_activity: new Date().toISOString(),
            badges: [],
            xp_points: 0
        });

    if (statsError) {
        console.log(`⚠️  Stats não criados (pode não ter tabela):`, statsError.message);
    }

    return true;
}

async function main() {
    console.log('🚀 CRIANDO CONTAS PREMIUM - SCOPSY LAB\n');
    console.log('═'.repeat(60));

    let successCount = 0;
    let failCount = 0;

    for (const account of accounts) {
        const success = await createAccount(account);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
        console.log('─'.repeat(60));
    }

    console.log('\n📊 RESUMO FINAL:');
    console.log('═'.repeat(60));
    console.log(`✅ Sucesso: ${successCount}`);
    console.log(`❌ Falhas: ${failCount}`);
    console.log(`📋 Total: ${accounts.length}`);

    if (successCount > 0) {
        console.log('\n🎉 CONTAS PREMIUM CRIADAS!');
        console.log('\n📝 CREDENCIAIS DE ACESSO:');
        console.log('═'.repeat(60));
        accounts.forEach(account => {
            console.log(`\n👤 ${account.name}:`);
            console.log(`   Email: ${account.email}`);
            console.log(`   Senha: ${account.password}`);
            console.log(`   Plano: PREMIUM ✨`);
        });
        console.log('\n🌐 Acesso: https://lab.scopsy.com.br');
        console.log('═'.repeat(60));
    }
}

main().catch(console.error);
