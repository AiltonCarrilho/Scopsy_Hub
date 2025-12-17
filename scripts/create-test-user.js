/**
 * Script para criar um usuário de teste completo
 * Cria usuário, adiciona cognits e configura como premium
 *
 * Uso:
 * node scripts/create-test-user.js [email] [cognits] [plan]
 *
 * Exemplos:
 * node scripts/create-test-user.js                              (usa defaults)
 * node scripts/create-test-user.js teste@scopsy.com 150 premium
 * node scripts/create-test-user.js demo@scopsy.com 500 pro
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

// Configuração Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_ANON_KEY devem estar no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Defaults
const DEFAULT_EMAIL = 'teste-premium@scopsy.com';
const DEFAULT_COGNITS = 150; // Nível 3: "Apontador de Sintomas"
const DEFAULT_PLAN = 'premium';
const DEFAULT_PASSWORD = 'Teste@123';
const DEFAULT_NAME = 'Usuário Premium de Teste';

// Função principal
async function createTestUser() {
  const args = process.argv.slice(2);

  const email = args[0] || DEFAULT_EMAIL;
  const cognits = parseInt(args[1]) || DEFAULT_COGNITS;
  const plan = args[2] || DEFAULT_PLAN;

  console.log(`\n🚀 CRIANDO USUÁRIO DE TESTE\n`);
  console.log(`📧 Email: ${email}`);
  console.log(`🎮 Cognits: ${cognits}`);
  console.log(`📦 Plano: ${plan}`);
  console.log(`🔑 Senha: ${DEFAULT_PASSWORD}\n`);

  try {
    // 1. Verificar se usuário já existe
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase());

    if (existing && existing.length > 0) {
      console.log(`⚠️  Usuário já existe! Usando usuário existente.\n`);
      const user = existing[0];

      // Atualizar plano
      await supabase
        .from('users')
        .update({ plan, subscription_status: 'active' })
        .eq('id', user.id);

      // Adicionar cognits
      await addCognitsToUser(user.id, cognits);

      console.log(`✅ Usuário atualizado com sucesso!\n`);
      showUserInfo(user.id, email, plan, cognits);
      return;
    }

    // 2. Criar novo usuário
    console.log(`📝 Criando novo usuário...`);
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name: DEFAULT_NAME,
        plan: plan,
        subscription_status: plan === 'free' ? 'inactive' : 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) throw createError;

    console.log(`✅ Usuário criado: ${newUser.id}\n`);

    // 3. Adicionar cognits
    await addCognitsToUser(newUser.id, cognits);

    // 4. Mostrar informações
    console.log(`\n✅ USUÁRIO DE TESTE CRIADO COM SUCESSO!\n`);
    showUserInfo(newUser.id, email, plan, cognits);

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    if (error.code === '23505') {
      console.log('💡 Dica: Email já existe. Tente outro email ou delete o usuário existente.');
    }
    process.exit(1);
  }
}

// Helper: Adicionar cognits ao usuário
async function addCognitsToUser(userId, totalCognits) {
  console.log(`📊 Adicionando ${totalCognits} cognits...`);

  // Distribuir cognits entre diferentes módulos para simular uso real
  const distribution = [
    { type: 'case', cognits: Math.floor(totalCognits * 0.4) },           // 40% Desafios
    { type: 'diagnostic', cognits: Math.floor(totalCognits * 0.3) },     // 30% Radar
    { type: 'journey', cognits: Math.floor(totalCognits * 0.2) },        // 20% Jornada
    { type: 'case_conceptualization', cognits: Math.floor(totalCognits * 0.1) } // 10% Conceituação
  ];

  for (const { type, cognits } of distribution) {
    if (cognits === 0) continue;

    const cases = Math.max(1, Math.floor(cognits / getCognitsPerCase(type)));

    await supabase
      .from('user_progress')
      .insert({
        user_id: userId,
        assistant_type: type,
        cognits: cognits,
        total_cases: cases,
        correct_diagnoses: Math.floor(cases * 0.8), // 80% de acurácia
        last_activity_date: new Date().toISOString().split('T')[0]
      });

    console.log(`   ✓ ${type}: ${cognits} cognits (${cases} casos)`);
  }
}

// Helper: Cognits por tipo
function getCognitsPerCase(assistantType) {
  const cognitsMap = {
    'diagnostic': 5,
    'case': 8,
    'journey': 25,
    'case_conceptualization': 30
  };
  return cognitsMap[assistantType] || 8;
}

// Helper: Calcular nível e título
function calculateLevelAndTitle(totalCognits) {
  let level = 1;
  let title = 'Estudante de Lente';

  if (totalCognits <= 150) {
    if (totalCognits < 50) { level = 1; title = 'Estudante de Lente'; }
    else if (totalCognits < 100) { level = 2; title = 'Observador Clínico'; }
    else { level = 3; title = 'Apontador de Sintomas'; }
  } else if (totalCognits <= 500) {
    if (totalCognits < 266) { level = 4; title = 'Decodificador Diagnóstico'; }
    else if (totalCognits < 383) { level = 5; title = 'Mapeador de Comorbidades'; }
    else { level = 6; title = 'Construtor de Linha do Tempo'; }
  } else if (totalCognits <= 1200) {
    if (totalCognits < 733) { level = 7; title = 'Lente Rápida'; }
    else if (totalCognits < 966) { level = 8; title = 'Escultor de Conceituação'; }
    else { level = 9; title = 'Terapeuta de Estratégia'; }
  } else {
    if (totalCognits < 2000) { level = 10; title = 'Arquiteto Cognitivo'; }
    else if (totalCognits < 3000) { level = 11; title = 'Mentor de Diagnóstico'; }
    else { level = 12; title = 'Clínico de Alta Performance'; }
  }

  return { level, title };
}

// Helper: Mostrar informações do usuário
function showUserInfo(userId, email, plan, cognits) {
  const { level, title } = calculateLevelAndTitle(cognits);

  console.log(`═══════════════════════════════════════════════`);
  console.log(`   CREDENCIAIS DE LOGIN`);
  console.log(`═══════════════════════════════════════════════`);
  console.log(`   Email:    ${email}`);
  console.log(`   Senha:    ${DEFAULT_PASSWORD}`);
  console.log(`   Plano:    ${plan}`);
  console.log(`───────────────────────────────────────────────`);
  console.log(`   GAMIFICAÇÃO`);
  console.log(`───────────────────────────────────────────────`);
  console.log(`   Cognits:  ${cognits}`);
  console.log(`   Nível:    ${level}`);
  console.log(`   Título:   ${title}`);
  console.log(`═══════════════════════════════════════════════\n`);
  console.log(`🌐 Faça login em: http://localhost:3000`);
  console.log(`📊 Dashboard: http://localhost:3000/dashboard.html\n`);
}

// Executar script
createTestUser();
