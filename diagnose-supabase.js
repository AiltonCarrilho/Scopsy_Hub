require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseDatabase() {
  console.log('🔍 DIAGNÓSTICO DO BANCO DE DADOS SUPABASE\n');
  console.log('='.repeat(80));

  try {
    // 1. Verificar tabelas principais
    console.log('\n📊 1. VERIFICANDO TABELAS PRINCIPAIS\n');

    const tables = [
      'users',
      'clinical_journeys',
      'journey_sessions',
      'user_journey_progress',
      'user_session_decisions',
      'cases',
      'user_case_interactions',
      'skills',
      'case_series'
    ];

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`   ❌ ${table.padEnd(30)} - NÃO EXISTE ou SEM PERMISSÃO`);
        } else {
          console.log(`   ✅ ${table.padEnd(30)} - ${count || 0} registros`);
        }
      } catch (e) {
        console.log(`   ❌ ${table.padEnd(30)} - ERRO: ${e.message}`);
      }
    }

    // 2. Verificar estrutura de user_journey_progress
    console.log('\n📋 2. ESTRUTURA DA TABELA user_journey_progress\n');

    const { data: progressSample, error: progressError } = await supabase
      .from('user_journey_progress')
      .select('*')
      .limit(1);

    if (progressError) {
      console.log(`   ❌ Erro ao buscar: ${progressError.message}`);
    } else if (progressSample && progressSample.length > 0) {
      const columns = Object.keys(progressSample[0]);
      console.log('   Colunas encontradas:');
      columns.forEach(col => {
        const value = progressSample[0][col];
        const type = value === null ? 'NULL' : typeof value;
        console.log(`   - ${col.padEnd(30)} (${type})`);
      });

      // Verificar se archived_at existe
      if (columns.includes('archived_at')) {
        console.log('\n   ✅ Coluna archived_at EXISTE');
      } else {
        console.log('\n   ❌ Coluna archived_at NÃO EXISTE (precisa criar!)');
      }
    } else {
      console.log('   ⚠️  Tabela vazia - não pode verificar estrutura');
    }

    // 3. Verificar registros duplicados/problemáticos
    console.log('\n🔍 3. VERIFICANDO REGISTROS PROBLEMÁTICOS\n');

    // Buscar todos os progressos do usuário 8
    const { data: allProgress, error: allError } = await supabase
      .from('user_journey_progress')
      .select('id, user_id, journey_id, current_session, is_completed, created_at')
      .eq('user_id', 8)
      .order('created_at', { ascending: false });

    if (allError) {
      console.log(`   ❌ Erro: ${allError.message}`);
    } else {
      console.log(`   Total de progressos do usuário 8: ${allProgress?.length || 0}`);

      if (allProgress && allProgress.length > 0) {
        // Agrupar por journey_id
        const byJourney = {};
        allProgress.forEach(p => {
          if (!byJourney[p.journey_id]) {
            byJourney[p.journey_id] = [];
          }
          byJourney[p.journey_id].push(p);
        });

        console.log('\n   Progressos por jornada:');
        Object.keys(byJourney).forEach(journeyId => {
          const progs = byJourney[journeyId];
          console.log(`\n   Journey: ${journeyId.substring(0, 8)}...`);
          console.log(`   - Total de registros: ${progs.length}`);

          if (progs.length > 1) {
            console.log('   ⚠️  DUPLICADOS ENCONTRADOS:');
            progs.forEach((p, i) => {
              console.log(`      ${i + 1}. Sessão ${p.current_session}/12, Completo: ${p.is_completed}, Criado: ${p.created_at}`);
            });
          } else {
            const p = progs[0];
            console.log(`   - Sessão atual: ${p.current_session}/12`);
            console.log(`   - Completo: ${p.is_completed}`);
          }
        });
      }
    }

    // 4. Verificar jornadas disponíveis
    console.log('\n\n📚 4. JORNADAS CLÍNICAS DISPONÍVEIS\n');

    const { data: journeys, error: journeysError } = await supabase
      .from('clinical_journeys')
      .select('id, title, client_name, disorder, status')
      .order('created_at', { ascending: false });

    if (journeysError) {
      console.log(`   ❌ Erro: ${journeysError.message}`);
    } else {
      console.log(`   Total de jornadas: ${journeys?.length || 0}\n`);
      journeys?.forEach((j, i) => {
        console.log(`   ${i + 1}. ${j.client_name} - ${j.disorder}`);
        console.log(`      ID: ${j.id}`);
        console.log(`      Status: ${j.status}\n`);
      });
    }

    // 5. Verificar sessões
    console.log('\n📖 5. SESSÕES DAS JORNADAS\n');

    if (journeys && journeys.length > 0) {
      const firstJourney = journeys[0];
      const { count: sessionCount } = await supabase
        .from('journey_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('journey_id', firstJourney.id);

      console.log(`   Jornada "${firstJourney.client_name}": ${sessionCount || 0} sessões`);

      if (sessionCount === 0) {
        console.log('   ⚠️  PROBLEMA: Jornada sem sessões! Execute populate-journey-sessions.js');
      }
    }

    // 6. Verificar cases
    console.log('\n\n🎯 6. CASOS CLÍNICOS (DESAFIOS)\n');

    const { count: casesCount, error: casesCountError } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (casesCountError) {
      console.log(`   ❌ Erro: ${casesCountError.message}`);
    } else {
      console.log(`   Total de casos ativos: ${casesCount || 0}`);

      if (casesCount === 0) {
        console.log('   ⚠️  PROBLEMA: Nenhum caso ativo! Execute um script populate-*.js');
      }
    }

    // 7. Recomendações
    console.log('\n\n💡 RECOMENDAÇÕES\n');
    console.log('='.repeat(80));

    const recommendations = [];

    // Verificar archived_at
    if (progressSample && progressSample.length > 0) {
      const hasArchivedAt = Object.keys(progressSample[0]).includes('archived_at');
      if (!hasArchivedAt) {
        recommendations.push({
          priority: 'CRÍTICO',
          action: 'Adicionar coluna archived_at',
          command: 'Execute o SQL no Supabase Dashboard (ver instruções anteriores)'
        });
      }
    }

    // Verificar duplicados
    if (allProgress && allProgress.length > 0) {
      const byJourney = {};
      allProgress.forEach(p => {
        if (!byJourney[p.journey_id]) byJourney[p.journey_id] = [];
        byJourney[p.journey_id].push(p);
      });

      const duplicates = Object.values(byJourney).filter(progs => progs.length > 1);
      if (duplicates.length > 0) {
        recommendations.push({
          priority: 'ALTO',
          action: 'Limpar registros duplicados',
          command: 'Aguarde - vou criar um script de limpeza'
        });
      }
    }

    // Verificar sessões
    if (journeys && journeys.length > 0) {
      const firstJourney = journeys[0];
      const { count: sessionCount } = await supabase
        .from('journey_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('journey_id', firstJourney.id);

      if (!sessionCount || sessionCount === 0) {
        recommendations.push({
          priority: 'ALTO',
          action: 'Popular sessões das jornadas',
          command: 'node populate-journey-sessions.js'
        });
      }
    }

    // Exibir recomendações
    if (recommendations.length === 0) {
      console.log('   ✅ Nenhum problema encontrado! Banco está OK.');
    } else {
      recommendations.forEach((rec, i) => {
        console.log(`\n   ${i + 1}. [${rec.priority}] ${rec.action}`);
        console.log(`      → ${rec.command}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Diagnóstico completo!\n');

  } catch (error) {
    console.error('\n❌ ERRO NO DIAGNÓSTICO:', error);
    console.error('Stack:', error.stack);
  }
}

diagnoseDatabase();
