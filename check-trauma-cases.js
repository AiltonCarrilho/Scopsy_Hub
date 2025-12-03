const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTraumaCases() {
  console.log('🔍 VERIFICANDO CASOS DE TRAUMA\n');

  const { data: cases, error } = await supabase
    .from('cases')
    .select('*')
    .eq('category', 'clinical_moment')
    .eq('created_by', 'diverse_population_script')
    .ilike('disorder', '%Trauma%')
    .eq('status', 'active');

  if (error) {
    console.error('Erro:', error);
    process.exit(1);
  }

  console.log('📊 TOTAL DE CASOS TRAUMA:', cases.length);
  
  // Agrupar por nível
  const byLevel = {
    basic: 0,
    intermediate: 0,
    advanced: 0
  };

  cases.forEach(c => {
    byLevel[c.difficulty_level]++;
  });

  console.log('\n📋 POR NÍVEL:');
  console.log(`  Basic: ${byLevel.basic}`);
  console.log(`  Intermediate: ${byLevel.intermediate}`);
  console.log(`  Advanced: ${byLevel.advanced}`);

  console.log('\n📝 DISORDERS:');
  const disorders = {};
  cases.forEach(c => {
    disorders[c.disorder] = (disorders[c.disorder] || 0) + 1;
  });
  
  Object.entries(disorders).forEach(([disorder, count]) => {
    console.log(`  ${disorder}: ${count}`);
  });

  process.exit(0);
}

checkTraumaCases().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});