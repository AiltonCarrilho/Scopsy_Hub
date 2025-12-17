/**
 * Script para alterar o plano de um usuário
 * Útil para testar a interface Trial vs Premium
 *
 * Uso:
 * node scripts/set-plan.js <email> <plan>
 *
 * Exemplos:
 * node scripts/set-plan.js teste@scopsy.com premium
 * node scripts/set-plan.js teste@scopsy.com pro
 * node scripts/set-plan.js teste@scopsy.com free
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuração Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_ANON_KEY devem estar no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Planos válidos
const VALID_PLANS = ['free', 'basic', 'pro', 'premium'];

// Função principal
async function setPlan() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
📚 Uso: node scripts/set-plan.js <email> <plan>

Planos disponíveis:
  - free     (Trial: 7 dias, 30 acessos)
  - basic    (R$ 29,90/mês - casos ilimitados)
  - pro      (R$ 69,90/mês - badges + certificados)
  - premium  (R$ 149,90/mês - supervisão + API)

Exemplos:
  node scripts/set-plan.js teste@scopsy.com premium
  node scripts/set-plan.js teste@scopsy.com free
    `);
    process.exit(1);
  }

  const email = args[0];
  const newPlan = args[1].toLowerCase();

  if (!VALID_PLANS.includes(newPlan)) {
    console.error(`❌ Erro: Plano inválido. Use: ${VALID_PLANS.join(', ')}`);
    process.exit(1);
  }

  try {
    // 1. Buscar usuário
    console.log(`\n🔍 Buscando usuário: ${email}`);
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase());

    if (userError) throw userError;
    if (!users || users.length === 0) {
      console.error(`❌ Usuário não encontrado: ${email}`);
      console.log('\n💡 Dica: Crie o usuário primeiro via signup');
      process.exit(1);
    }

    const user = users[0];
    const oldPlan = user.plan;

    if (oldPlan === newPlan) {
      console.log(`\n⚠️  Usuário já está no plano "${newPlan}"`);
      process.exit(0);
    }

    // 2. Atualizar plano
    console.log(`\n📝 Atualizando plano: ${oldPlan} → ${newPlan}`);
    const { error: updateError } = await supabase
      .from('users')
      .update({
        plan: newPlan,
        subscription_status: newPlan === 'free' ? 'inactive' : 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // 3. Mostrar resultado
    console.log(`\n✅ Plano atualizado com sucesso!`);
    console.log(`\n👤 Usuário: ${user.name} (${user.email})`);
    console.log(`📦 Plano anterior: ${oldPlan}`);
    console.log(`📦 Novo plano: ${newPlan}`);

    if (newPlan === 'free') {
      console.log(`\n⏱️  TRIAL MODE:`);
      console.log(`   - 7 dias de acesso`);
      console.log(`   - 30 atividades (Raciocínio + Radar)`);
      console.log(`   - Interface mostra: "Acessos Restantes" e "Dias Restantes"`);
    } else {
      console.log(`\n🎮 PREMIUM MODE:`);
      console.log(`   - Acesso ilimitado`);
      console.log(`   - Interface mostra: "Cognits" e "Desafios Concluídos"`);
      console.log(`   - Sistema de níveis e títulos clínicos ativo`);
    }

    console.log(`\n🔄 Faça login novamente para ver as mudanças.\n`);

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar script
setPlan();
