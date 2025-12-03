const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugCase() {
  console.log('🔍 DEBUG: Estrutura de caso psicótico\n');

  const { data: cases, error } = await supabase
    .from('cases')
    .select('*')
    .eq('category', 'clinical_moment')
    .ilike('disorder', '%Psicótico%')
    .limit(1);

  if (error) {
    console.error('Erro:', error);
    process.exit(1);
  }

  if (!cases || cases.length === 0) {
    console.log('Nenhum caso psicótico encontrado!');
    process.exit(0);
  }

  const caso = cases[0];

  console.log('📋 ID:', caso.id);
  console.log('📋 Disorder:', caso.disorder);
  console.log('📋 Difficulty:', caso.difficulty_level);
  console.log('\n🔍 VIGNETTE FIELD:');
  console.log('   Tipo:', typeof caso.vignette);
  console.log('   Tamanho:', caso.vignette ? caso.vignette.length : 0);
  console.log('   Primeiros 200 chars:', caso.vignette ? caso.vignette.substring(0, 200) : 'null');
  
  console.log('\n🔍 CASE_CONTENT FIELD:');
  console.log('   Existe?', !!caso.case_content);
  if (caso.case_content) {
    console.log('   Keys:', Object.keys(caso.case_content));
    console.log('   Tem context?', !!caso.case_content.context);
    console.log('   Tem critical_moment?', !!caso.case_content.critical_moment);
    console.log('   JSON completo:', JSON.stringify(caso.case_content, null, 2));
  }

  console.log('\n✅ DIAGNÓSTICO:');
  if (caso.vignette && caso.vignette.length > 100) {
    console.log('   ✅ Tem vignette completa - Backend DEVE usar direto');
  } else if (caso.case_content?.context?.what_just_happened) {
    console.log('   ⚠️ Micro-momento - Backend vai montar vinheta');
  } else {
    console.log('   ❌ SEM DADOS - Problema de população!');
  }

  process.exit(0);
}

debugCase().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});