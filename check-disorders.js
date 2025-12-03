const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDisorders() {
  console.log('📊 VERIFICANDO DISORDERS DOS CASOS clinical_moment...\n');

  const { data: cases, error } = await supabase
    .from('cases')
    .select('disorder, difficulty_level')
    .eq('category', 'clinical_moment')
    .eq('status', 'active');

  if (error) {
    console.error('Erro:', error);
    process.exit(1);
  }

  // Agrupar por disorder
  const disorderCount = {};
  const disorderByLevel = {};

  cases.forEach(c => {
    const disorder = c.disorder || 'Sem disorder';
    const level = c.difficulty_level || 'sem nível';
    
    disorderCount[disorder] = (disorderCount[disorder] || 0) + 1;
    
    const key = `${disorder} - ${level}`;
    disorderByLevel[key] = (disorderByLevel[key] || 0) + 1;
  });

  console.log('📋 DISORDERS (total por tipo):\n');
  Object.entries(disorderCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([disorder, count]) => {
      console.log(`  ${disorder}: ${count} casos`);
    });

  console.log('\n🔍 BREAKDOWN POR DISORDER + NÍVEL:\n');
  Object.entries(disorderByLevel)
    .sort((a, b) => b[1] - a[1])
    .forEach(([key, count]) => {
      console.log(`  ${key}: ${count}`);
    });

  console.log('\n🎯 CATEGORIAS NECESSÁRIAS:\n');
  const needed = {
    'Psicótico/Esquizofrenia': 0,
    'Humor/Depressão/Bipolar': 0,
    'Trauma/TEPT': 0,
    'Personalidade/Borderline': 0,
    'Alimentar/Anorexia/Bulimia': 0,
    'Substância/Álcool': 0
  };

  cases.forEach(c => {
    const d = c.disorder || '';
    if (d.includes('Psicótico') || d.includes('Esquizofrenia')) needed['Psicótico/Esquizofrenia']++;
    if (d.includes('Depres') || d.includes('Humor') || d.includes('Bipolar')) needed['Humor/Depressão/Bipolar']++;
    if (d.includes('Trauma') || d.includes('TEPT') || d.includes('Estresse')) needed['Trauma/TEPT']++;
    if (d.includes('Personalidade') || d.includes('Borderline')) needed['Personalidade/Borderline']++;
    if (d.includes('Alimentar') || d.includes('Anorexia') || d.includes('Bulimia')) needed['Alimentar/Anorexia/Bulimia']++;
    if (d.includes('Substância') || d.includes('Álcool') || d.includes('Dependência')) needed['Substância/Álcool']++;
  });

  Object.entries(needed).forEach(([cat, count]) => {
    const status = count > 0 ? '✅' : '❌';
    console.log(`  ${status} ${cat}: ${count} casos`);
  });

  process.exit(0);
}

checkDisorders().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});