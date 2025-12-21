require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = 8; // Seu usuário de teste

async function debugJourneyProgress() {
  console.log('🔍 DEBUG: PROGRESSO DA JORNADA CLÍNICA\n');
  console.log('='.repeat(80));

  try {
    // 1. Buscar todas as jornadas
    console.log('\n📚 1. JORNADAS DISPONÍVEIS\n');
    const { data: journeys } = await supabase
      .from('clinical_journeys')
      .select('id, title, client_name, disorder')
      .eq('status', 'active');

    if (!journeys || journeys.length === 0) {
      console.log('   ❌ Nenhuma jornada encontrada!');
      process.exit(1);
    }

    journeys.forEach((j, i) => {
      console.log(`   ${i + 1}. ${j.client_name} - ${j.disorder}`);
      console.log(`      ID: ${j.id}\n`);
    });

    const journeyId = journeys[0].id;
    console.log(`   🎯 Analisando: ${journeys[0].client_name}\n`);

    // 2. Buscar TODOS os progressos (inclusive duplicados)
    console.log('📊 2. PROGRESSOS NO BANCO\n');
    const { data: allProgress } = await supabase
      .from('user_journey_progress')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('journey_id', journeyId)
      .order('created_at', { ascending: false });

    if (!allProgress || allProgress.length === 0) {
      console.log('   ⚠️  Nenhum progresso encontrado para este usuário');
    } else {
      console.log(`   Total de registros: ${allProgress.length}\n`);

      allProgress.forEach((p, i) => {
        console.log(`   Registro ${i + 1}:`);
        console.log(`   - ID: ${p.id}`);
        console.log(`   - Sessão atual: ${p.current_session}/12`);
        console.log(`   - Completo: ${p.is_completed}`);
        console.log(`   - Score final: ${p.final_score || 'N/A'}`);
        console.log(`   - Criado: ${p.created_at}`);
        console.log(`   - Última atualização: ${p.last_session_at || 'nunca'}`);
        console.log(`   - Pontos:`);
        console.log(`     • Rapport: ${p.total_rapport}`);
        console.log(`     • Insight: ${p.total_insight}`);
        console.log(`     • Mudança Comportamental: ${p.total_behavioral_change}`);
        console.log(`     • Redução de Sintomas: ${p.total_symptom_reduction}`);
        console.log();
      });

      if (allProgress.length > 1) {
        console.log('   ⚠️  DUPLICADOS ENCONTRADOS!');
        console.log('   Isso pode causar problemas de navegação.\n');
      }
    }

    // 3. Buscar decisões tomadas
    console.log('✅ 3. DECISÕES REGISTRADAS\n');
    const { data: sessions } = await supabase
      .from('journey_sessions')
      .select('id, session_number, session_title')
      .eq('journey_id', journeyId)
      .order('session_number');

    const { data: decisions } = await supabase
      .from('user_session_decisions')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('journey_id', journeyId)
      .order('created_at');

    if (!decisions || decisions.length === 0) {
      console.log('   ⚠️  Nenhuma decisão registrada ainda\n');
    } else {
      console.log(`   Total de decisões: ${decisions.length}\n`);

      // Mapear decisões por sessão
      const decisionsBySession = {};
      decisions.forEach(d => {
        const session = sessions.find(s => s.id === d.session_id);
        if (session) {
          decisionsBySession[session.session_number] = d;
        }
      });

      for (let i = 1; i <= 12; i++) {
        const decision = decisionsBySession[i];
        if (decision) {
          console.log(`   ✓ Sessão ${i}: Opção ${decision.option_chosen} (Ótima: ${decision.is_optimal})`);
          console.log(`     Pontos: R=${decision.rapport_gained} I=${decision.insight_gained} M=${decision.behavioral_change_gained} S=${decision.symptom_reduction_gained}`);
        } else {
          console.log(`   ○ Sessão ${i}: Não completada`);
        }
      }
      console.log();
    }

    // 4. Verificar lógica de completude
    console.log('🔍 4. ANÁLISE DE COMPLETUDE\n');

    if (allProgress && allProgress.length > 0) {
      const currentProgress = allProgress[0]; // Mais recente

      console.log(`   Sessão atual no banco: ${currentProgress.current_session}`);
      console.log(`   is_completed: ${currentProgress.is_completed}`);
      console.log(`   final_score: ${currentProgress.final_score || 'NULL'}`);
      console.log();

      if (currentProgress.is_completed && currentProgress.current_session < 12) {
        console.log('   ❌ PROBLEMA DETECTADO!');
        console.log('   → Marcado como completo mas não está na sessão 12');
        console.log('   → Isso causa exibição prematura da tela de conclusão\n');
      }

      if (currentProgress.current_session === 12 && !currentProgress.is_completed) {
        console.log('   ⚠️  INCONSISTÊNCIA:');
        console.log('   → Está na sessão 12 mas não marcado como completo\n');
      }

      if (!currentProgress.is_completed && currentProgress.current_session < 12) {
        console.log('   ✅ Estado normal - jornada em andamento\n');
      }
    }

    // 5. Recomendações
    console.log('💡 5. RECOMENDAÇÕES\n');
    console.log('='.repeat(80));

    if (allProgress && allProgress.length > 1) {
      console.log('\n   🔧 AÇÃO NECESSÁRIA: Limpar duplicados');
      console.log('   Execute: node clean-journey-duplicates.js\n');
    }

    if (allProgress && allProgress.length > 0) {
      const p = allProgress[0];
      if (p.is_completed && p.current_session < 12) {
        console.log('\n   🔧 AÇÃO NECESSÁRIA: Corrigir flag is_completed');
        console.log('   Vou criar um script para corrigir isso...\n');
      }
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('\n❌ ERRO:', error);
    console.error('Stack:', error.stack);
  }
}

debugJourneyProgress();
