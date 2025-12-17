/**
 * Script para adicionar Cognits manualmente a um usuário
 * Útil para testar o sistema de gamificação e progressão de níveis
 *
 * Uso:
 * node scripts/add-cognits.js <email> <cognits> [assistant_type]
 *
 * Exemplos:
 * node scripts/add-cognits.js teste@scopsy.com 50 case
 * node scripts/add-cognits.js teste@scopsy.com 100 diagnostic
 * node scripts/add-cognits.js teste@scopsy.com 200
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

// Função principal
async function addCognits() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
📚 Uso: node scripts/add-cognits.js <email> <cognits> [assistant_type]

Exemplos:
  node scripts/add-cognits.js teste@scopsy.com 50 case
  node scripts/add-cognits.js teste@scopsy.com 100 diagnostic
  node scripts/add-cognits.js teste@scopsy.com 200 (adiciona a todos os tipos)

Assistant Types:
  - case (Desafios Clínicos: +8 cognits cada)
  - diagnostic (Radar Diagnóstico: +5 cognits cada)
  - journey (Jornada Terapêutica: +25 cognits por sessão)
  - case_conceptualization (Conceituação: +30 cognits)
    `);
    process.exit(1);
  }

  const email = args[0];
  const cognitsToAdd = parseInt(args[1]);
  const assistantType = args[2] || 'case'; // Default: Desafios Clínicos

  if (isNaN(cognitsToAdd) || cognitsToAdd <= 0) {
    console.error('❌ Erro: Cognits deve ser um número positivo');
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
      console.log('\n💡 Dica: Crie o usuário primeiro via signup ou no Supabase');
      process.exit(1);
    }

    const user = users[0];
    console.log(`✅ Usuário encontrado: ${user.name} (${user.plan})`);

    // 2. Buscar progresso existente
    const { data: existing, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('assistant_type', assistantType)
      .single();

    let result;

    if (existing) {
      // Atualizar progresso existente
      const newCognits = (existing.cognits || 0) + cognitsToAdd;
      const casesToAdd = Math.floor(cognitsToAdd / getCognitsPerCase(assistantType));

      result = await supabase
        .from('user_progress')
        .update({
          cognits: newCognits,
          total_cases: (existing.total_cases || 0) + casesToAdd,
          correct_diagnoses: (existing.correct_diagnoses || 0) + casesToAdd,
          last_activity_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', existing.id)
        .select();

      console.log(`\n📈 Progresso atualizado:`);
      console.log(`   Cognits: ${existing.cognits || 0} → ${newCognits} (+${cognitsToAdd})`);
      console.log(`   Casos: ${existing.total_cases || 0} → ${(existing.total_cases || 0) + casesToAdd} (+${casesToAdd})`);

    } else {
      // Criar novo registro de progresso
      const casesToAdd = Math.floor(cognitsToAdd / getCognitsPerCase(assistantType));

      result = await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          assistant_type: assistantType,
          cognits: cognitsToAdd,
          total_cases: casesToAdd,
          correct_diagnoses: casesToAdd,
          last_activity_date: new Date().toISOString().split('T')[0]
        })
        .select();

      console.log(`\n✨ Novo progresso criado:`);
      console.log(`   Cognits: ${cognitsToAdd}`);
      console.log(`   Casos: ${casesToAdd}`);
    }

    if (result.error) throw result.error;

    // 3. Calcular nível e título
    const totalCognits = await getTotalCognits(user.id);
    const { level, title } = calculateLevelAndTitle(totalCognits);

    console.log(`\n🎮 GAMIFICAÇÃO:`);
    console.log(`   Total de Cognits: ${totalCognits}`);
    console.log(`   Nível: ${level} - ${title}`);
    console.log(`   Tipo: ${assistantType}`);

    // 4. Mostrar próximo nível
    const nextMilestone = getNextMilestone(totalCognits);
    if (nextMilestone) {
      console.log(`\n🎯 Próxima Meta:`);
      console.log(`   ${nextMilestone.cognits - totalCognits} cognits para "${nextMilestone.title}"`);
    } else {
      console.log(`\n👑 PARABÉNS! Você atingiu o nível máximo!`);
    }

    console.log(`\n✅ Sucesso! Cognits adicionados.\n`);

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

// Helper: Calcular total de cognits do usuário
async function getTotalCognits(userId) {
  const { data: progressEntries } = await supabase
    .from('user_progress')
    .select('cognits')
    .eq('user_id', userId);

  if (!progressEntries || progressEntries.length === 0) return 0;

  return progressEntries.reduce((sum, entry) => sum + (entry.cognits || 0), 0);
}

// Helper: Cognits por tipo de módulo
function getCognitsPerCase(assistantType) {
  const cognitsMap = {
    'diagnostic': 5,           // Radar Diagnóstico
    'case': 8,                 // Desafios Clínicos
    'journey': 25,             // Jornada Terapêutica
    'case_conceptualization': 30  // Conceituação Cognitiva
  };
  return cognitsMap[assistantType] || 8;
}

// Helper: Calcular nível e título (igual ao backend)
function calculateLevelAndTitle(totalCognits) {
  let level = 1;
  let title = 'Estudante de Lente';

  if (totalCognits <= 150) {
    // Inicial: 0-150 cognits
    if (totalCognits < 50) { level = 1; title = 'Estudante de Lente'; }
    else if (totalCognits < 100) { level = 2; title = 'Observador Clínico'; }
    else { level = 3; title = 'Apontador de Sintomas'; }
  } else if (totalCognits <= 500) {
    // Intermediário: 151-500 cognits
    if (totalCognits < 266) { level = 4; title = 'Decodificador Diagnóstico'; }
    else if (totalCognits < 383) { level = 5; title = 'Mapeador de Comorbidades'; }
    else { level = 6; title = 'Construtor de Linha do Tempo'; }
  } else if (totalCognits <= 1200) {
    // Avançado: 501-1200 cognits
    if (totalCognits < 733) { level = 7; title = 'Lente Rápida'; }
    else if (totalCognits < 966) { level = 8; title = 'Escultor de Conceituação'; }
    else { level = 9; title = 'Terapeuta de Estratégia'; }
  } else {
    // Maestria: 1201+ cognits
    if (totalCognits < 2000) { level = 10; title = 'Arquiteto Cognitivo'; }
    else if (totalCognits < 3000) { level = 11; title = 'Mentor de Diagnóstico'; }
    else { level = 12; title = 'Clínico de Alta Performance'; }
  }

  return { level, title };
}

// Helper: Próximo marco de progresso
function getNextMilestone(currentCognits) {
  const milestones = [
    { cognits: 50, level: 2, title: 'Observador Clínico' },
    { cognits: 100, level: 3, title: 'Apontador de Sintomas' },
    { cognits: 266, level: 4, title: 'Decodificador Diagnóstico' },
    { cognits: 383, level: 5, title: 'Mapeador de Comorbidades' },
    { cognits: 500, level: 6, title: 'Construtor de Linha do Tempo' },
    { cognits: 733, level: 7, title: 'Lente Rápida' },
    { cognits: 966, level: 8, title: 'Escultor de Conceituação' },
    { cognits: 1200, level: 9, title: 'Terapeuta de Estratégia' },
    { cognits: 2000, level: 10, title: 'Arquiteto Cognitivo' },
    { cognits: 3000, level: 11, title: 'Mentor de Diagnóstico' },
  ];

  return milestones.find(m => m.cognits > currentCognits);
}

// Executar script
addCognits();
