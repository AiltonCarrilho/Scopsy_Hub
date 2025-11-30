const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCases() {
  console.log('📊 VERIFICANDO CASOS NO BANCO...\n');

  // Total de casos
  const { count: total } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  console.log(`Total de casos ativos: ${total}\n`);

  // Por moment_type
  const { data: byType } = await supabase
    .from('cases')
    .select('moment_type')
    .eq('status', 'active');

  const typeCounts = {};
  byType.forEach(c => {
    const type = c.moment_type || 'null';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  console.log('📋 Por tipo de momento:');
  Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} casos`);
  });

  // Por difficulty_level
  const { data: byLevel } = await supabase
    .from('cases')
    .select('difficulty_level, moment_type')
    .eq('status', 'active')
    .not('moment_type', 'is', null);

  console.log('\n📊 Por nível (apenas micro-momentos):');
  const levelCounts = {};
  byLevel.forEach(c => {
    const level = c.difficulty_level || 'null';
    levelCounts[level] = (levelCounts[level] || 0) + 1;
  });

  Object.entries(levelCounts).forEach(([level, count]) => {
    console.log(`  ${level}: ${count} casos`);
  });

  // Detalhado: tipo + nível
  console.log('\n🔍 Detalhado (tipo + nível):');
  const detailed = {};
  byLevel.forEach(c => {
    const key = `${c.moment_type || 'null'}_${c.difficulty_level || 'null'}`;
    detailed[key] = (detailed[key] || 0) + 1;
  });

  Object.entries(detailed).sort((a, b) => b[1] - a[1]).forEach(([key, count]) => {
    console.log(`  ${key}: ${count}`);
  });

  console.log('\n✅ Verificação concluída!');
  process.exit(0);
}

checkCases().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});