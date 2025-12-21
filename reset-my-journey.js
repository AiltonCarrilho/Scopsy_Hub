require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = 8;

async function resetJourney() {
  console.log('🔄 RESETANDO JORNADA CLÍNICA\n');
  console.log('='.repeat(80));

  try {
    // 1. Buscar jornada ativa
    const { data: journey } = await supabase
      .from('clinical_journeys')
      .select('id, title, client_name')
      .eq('status', 'active')
      .limit(1)
      .single();

    if (!journey) {
      console.log('❌ Nenhuma jornada encontrada!');
      process.exit(1);
    }

    console.log(`\n📚 Jornada: ${journey.client_name}`);
    console.log(`ID: ${journey.id}\n`);

    // 2. Deletar TODOS os progressos existentes
    console.log('🗑️  Deletando progressos antigos...');
    const { error: deleteProgressError } = await supabase
      .from('user_journey_progress')
      .delete()
      .eq('user_id', USER_ID)
      .eq('journey_id', journey.id);

    if (deleteProgressError) throw deleteProgressError;
    console.log('✅ Progressos deletados\n');

    // 3. Deletar TODAS as decisões antigas
    console.log('🗑️  Deletando decisões antigas...');
    const { error: deleteDecisionsError } = await supabase
      .from('user_session_decisions')
      .delete()
      .eq('user_id', USER_ID)
      .eq('journey_id', journey.id);

    if (deleteDecisionsError) throw deleteDecisionsError;
    console.log('✅ Decisões deletadas\n');

    // 4. Criar progresso LIMPO começando da sessão 1
    console.log('✨ Criando progresso novo...');
    const { data: newProgress, error: createError } = await supabase
      .from('user_journey_progress')
      .insert({
        user_id: USER_ID,
        journey_id: journey.id,
        current_session: 1,
        total_rapport: 0,
        total_insight: 0,
        total_behavioral_change: 0,
        total_symptom_reduction: 0,
        is_completed: false
      })
      .select()
      .single();

    if (createError) throw createError;

    console.log('✅ Progresso criado!\n');
    console.log('📊 Estado inicial:');
    console.log(`   - Sessão: ${newProgress.current_session}/12`);
    console.log(`   - Completo: ${newProgress.is_completed}`);
    console.log(`   - Pontos: R=${newProgress.total_rapport} I=${newProgress.total_insight} M=${newProgress.total_behavioral_change} S=${newProgress.total_symptom_reduction}`);

    console.log('\n' + '='.repeat(80));
    console.log('🎉 RESET COMPLETO!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Recarregue a página da jornada (F5)');
    console.log('   2. Deve começar na Sessão 1');
    console.log('   3. Complete as sessões em ordem\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERRO:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

resetJourney();
