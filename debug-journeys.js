require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugJourneys() {
  console.log('🔍 DEBUG - JORNADAS NO BANCO\n');

  try {
    // Buscar TODAS as jornadas
    const { data: journeys, error } = await supabase
      .from('clinical_journeys')
      .select('*');

    if (error) {
      console.error('❌ Erro ao buscar jornadas:', error.message);
      console.error('\nDetalhes:', error);
      process.exit(1);
    }

    console.log(`📊 Total de jornadas: ${journeys.length}\n`);

    if (journeys.length === 0) {
      console.log('⚠️  TABELA VAZIA!\n');
      console.log('📝 Execute: node create-journey.js\n');
      process.exit(0);
    }

    // Mostrar cada jornada
    journeys.forEach((j, i) => {
      console.log(`${i + 1}. ID: ${j.id}`);
      console.log(`   Título: ${j.title}`);
      console.log(`   Cliente: ${j.client_name}, ${j.client_age} anos`);
      console.log(`   Disorder: "${j.disorder}"`);
      console.log(`   Categoria: ${j.disorder_category}`);
      console.log(`   Nível: ${j.difficulty_level}`);
      console.log(`   Status: ${j.status}`);
      console.log(`   Criado: ${j.created_at}\n`);
    });

    // Verificar se tem a jornada de TAG
    const tag = journeys.find(j => j.disorder.includes('Ansiedade Generalizada'));
    
    if (tag) {
      console.log('✅ Jornada de TAG encontrada!');
      console.log(`   ID: ${tag.id}`);
      console.log(`   Disorder exato: "${tag.disorder}"\n`);

      // Verificar sessões
      const { data: sessions, error: sessError } = await supabase
        .from('journey_sessions')
        .select('session_number')
        .eq('journey_id', tag.id)
        .order('session_number');

      if (sessError) {
        console.error('❌ Erro ao buscar sessões:', sessError.message);
      } else {
        console.log(`📋 Sessões existentes: ${sessions.length}/12`);
        if (sessions.length > 0) {
          console.log(`   Sessões: ${sessions.map(s => s.session_number).join(', ')}`);
        }
        console.log('');
      }

      if (sessions.length === 0) {
        console.log('📝 Pronto para popular sessões!');
        console.log('   Execute: node populate-journey-sessions.js\n');
      } else if (sessions.length < 12) {
        console.log('⚠️  Sessões incompletas. Quer recriar?');
        console.log('   Execute: node populate-journey-sessions.js\n');
      } else {
        console.log('✅ Jornada completa com 12 sessões!');
        console.log('   Teste: http://127.0.0.1:5500/frontend/jornada.html\n');
      }

    } else {
      console.log('⚠️  Jornada de TAG NÃO encontrada!');
      console.log('\n📝 Execute: node create-journey.js\n');
    }

    process.exit(0);

  } catch (error) {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  }
}

debugJourneys();