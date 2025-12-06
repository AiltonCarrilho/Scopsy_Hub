require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyTables() {
  console.log('🔍 VERIFICANDO TABELAS DA JORNADA CLÍNICA:\n');

  const tables = [
    'clinical_journeys',
    'journey_sessions', 
    'user_journey_progress',
    'user_session_decisions'
  ];

  let allExist = true;

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ ${table}: NÃO EXISTE`);
        allExist = false;
      } else {
        console.log(`   ✅ ${table}: OK`);
      }
    } catch (err) {
      console.log(`   ❌ ${table}: ERRO - ${err.message}`);
      allExist = false;
    }
  }

  console.log('\n');

  if (!allExist) {
    console.log('⚠️  TABELAS FALTANDO!\n');
    console.log('📝 INSTRUÇÕES:\n');
    console.log('1. Abra: https://supabase.com/dashboard/project/YOUR_PROJECT/editor');
    console.log('2. Clique em "SQL Editor" → "New query"');
    console.log('3. Cole o conteúdo de schema-jornada-clinica.sql');
    console.log('4. Clique em "Run"');
    console.log('5. Execute este script novamente\n');
    process.exit(1);
  } else {
    console.log('✅ Todas as tabelas existem!\n');
    process.exit(0);
  }
}

verifyTables();