const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    const { data, error, count } = await supabase
      .from('cases')
      .select('*', { count: 'exact' })
      .eq('status', 'active');

    if (error) throw error;

    console.log('🗃️  CASOS NO CACHE (Desafios/Micro-Momentos):\n');
    console.log('Total:', count || data.length, '\n');

    // Agrupar por tipo
    const byType = {};
    const byCategory = {};

    data.forEach(c => {
      const type = c.moment_type || 'other';
      const cat = c.category || 'unknown';
      byType[type] = (byType[type] || 0) + 1;
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });

    console.log('📊 Por categoria:');
    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} casos`);
    });

    console.log('\n📊 Por tipo de momento:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} casos`);
    });

    console.log('\n🔍 Exemplos (primeiros 10):');
    data.slice(0, 10).forEach((c, idx) => {
      const ctx = c.case_content?.context || {};
      const name = ctx.client_name || 'N/A';
      const moment = c.moment_type || 'N/A';
      const used = c.times_used || 0;
      const disorder = c.disorder || 'N/A';
      console.log(`${idx + 1}. ${name} - ${disorder} (${moment}) - usado ${used}x`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
})();
