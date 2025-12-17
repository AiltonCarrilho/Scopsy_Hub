const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Usar service role key
);

async function upgradeToPremium() {
    // Listar usuários
    const { data: users, error: listError } = await supabase
        .from('users')
        .select('id, email, name, plan')
        .limit(10);

    if (listError) {
        console.error('❌ Erro ao listar usuários:', listError);
        return;
    }

    console.log('\n📋 Usuários disponíveis:');
    users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} - ${user.name} - Plan: ${user.plan || 'free'}`);
    });

    // Pegar o primeiro usuário e atualizar para premium
    if (users.length > 0) {
        const firstUser = users[0];
        console.log(`\n🔄 Atualizando ${firstUser.email} para Premium...`);

        const { data, error } = await supabase
            .from('users')
            .update({ plan: 'premium' })
            .eq('id', firstUser.id)
            .select();

        if (error) {
            console.error('❌ Erro ao atualizar:', error);
            return;
        }

        console.log('✅ Usuário atualizado para Premium!');
        console.log(`\n📧 Email: ${firstUser.email}`);
        console.log(`🎯 Plano: premium`);
        console.log(`\n💡 Use este email para fazer login e testar a gamificação!`);
    }
}

upgradeToPremium();
