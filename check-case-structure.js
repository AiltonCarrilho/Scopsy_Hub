const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCaseStructure() {
  console.log('🔍 Verificando estrutura de casos clinical_moment...\n');

  // Buscar 1 caso clinical_moment
  const { data: cases, error } = await supabase
    .from('cases')
    .select('*')
    .eq('category', 'clinical_moment')
    .eq('status', 'active')
    .limit(1);

  if (error) {
    console.error('Erro:', error);
    return;
  }

  if (!cases || cases.length === 0) {
    console.log('Nenhum caso clinical_moment encontrado');
    return;
  }

  const caso = cases[0];

  console.log('📋 ESTRUTURA DO CASO:');
  console.log('ID:', caso.id);
  console.log('Disorder:', caso.disorder);
  console.log('Category:', caso.category);
  console.log('Difficulty:', caso.difficulty_level);
  console.log('\n📦 CASE_CONTENT:');
  console.log(JSON.stringify(caso.case_content, null, 2));

  console.log('\n🔑 CAMPOS DISPONÍVEIS EM case_content:');
  if (caso.case_content) {
    Object.keys(caso.case_content).forEach(key => {
      console.log(`  - ${key}`);
    });
  }

  console.log('\n📝 VIGNETTE DIRETO:');
  console.log(caso.vignette || 'Campo vignette não existe na tabela');

  process.exit(0);
}

checkCaseStructure().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});