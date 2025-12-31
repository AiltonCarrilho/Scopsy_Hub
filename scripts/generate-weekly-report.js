#!/usr/bin/env node
/**
 * SCOPSY - Relatório Semanal de Revisão
 *
 * Gera relatório completo do progresso semanal
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function generateWeeklyReport() {
  console.log('📊 SCOPSY - RELATÓRIO SEMANAL\n');
  console.log('Período: Últimos 7 dias\n');
  console.log('='.repeat(70) + '\n');

  // 1. KPIs Gerais
  const { count: totalCount } = await supabase
    .from('case_reviews')
    .select('*', { count: 'exact', head: true });

  const { count: aprovadosCount } = await supabase
    .from('case_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('aprovado', true);

  const { count: filaCount } = await supabase
    .from('case_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('requer_revisao_humana', true)
    .is('human_reviewed_at', null);

  const { count: revisadosSemanaCount } = await supabase
    .from('case_reviews')
    .select('*', { count: 'exact', head: true })
    .gte('human_reviewed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  console.log('📈 VISÃO GERAL');
  console.log('-'.repeat(70));
  console.log(`Total de casos no sistema: ${totalCount || 0}`);
  console.log(`Casos aprovados (expert): ${aprovadosCount || 0}`);
  console.log(`Fila de revisão pendente: ${filaCount || 0}`);
  console.log(`Casos revisados esta semana: ${revisadosSemanaCount || 0}\n`);

  // 2. Progresso Semanal
  const { data: progressoDiario } = await supabase
    .from('case_reviews')
    .select('human_reviewed_at, score_total, human_decision')
    .gte('human_reviewed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('human_reviewed_at');

  if (progressoDiario && progressoDiario.length > 0) {
    console.log('📅 PROGRESSO DIÁRIO');
    console.log('-'.repeat(70));

    const porDia = {};
    progressoDiario.forEach(rev => {
      const dia = new Date(rev.human_reviewed_at).toLocaleDateString('pt-BR');
      porDia[dia] = (porDia[dia] || 0) + 1;
    });

    Object.entries(porDia).forEach(([dia, count]) => {
      console.log(`${dia}: ${count} casos revisados`);
    });

    const mediaDiaria = progressoDiario.length / 7;
    console.log(`\nMédia diária: ${mediaDiaria.toFixed(1)} casos/dia`);
    console.log(`Projeção mensal: ${(mediaDiaria * 30).toFixed(0)} casos\n`);
  } else {
    console.log('📅 PROGRESSO DIÁRIO');
    console.log('-'.repeat(70));
    console.log('Nenhum caso revisado esta semana ainda.\n');
  }

  // 3. Taxa de Concordância
  const { data: decisoes } = await supabase
    .from('case_reviews')
    .select('human_decision')
    .not('human_decision', 'is', null);

  if (decisoes && decisoes.length > 0) {
    console.log('🤝 TAXA DE CONCORDÂNCIA COM GPT');
    console.log('-'.repeat(70));

    const concordo = decisoes.filter(d => d.human_decision === 'CONCORDO').length;
    const discordo = decisoes.filter(d => d.human_decision === 'DISCORDO').length;
    const modificado = decisoes.filter(d => d.human_decision === 'MODIFICADO').length;

    console.log(`Concordo com GPT: ${concordo} (${(concordo/decisoes.length*100).toFixed(1)}%)`);
    console.log(`Discordo do GPT: ${discordo} (${(discordo/decisoes.length*100).toFixed(1)}%)`);
    console.log(`Caso modificado: ${modificado} (${(modificado/decisoes.length*100).toFixed(1)}%)\n`);
  }

  // 4. Problemas Mais Comuns
  const { data: todosRevisados } = await supabase
    .from('case_reviews')
    .select('problemas_criticos, human_decision')
    .eq('human_decision', 'CONCORDO');

  if (todosRevisados && todosRevisados.length > 0) {
    console.log('🚨 PROBLEMAS MAIS COMUNS (onde concordamos com GPT)');
    console.log('-'.repeat(70));

    const problemas = {};
    todosRevisados.forEach(rev => {
      rev.problemas_criticos?.forEach(prob => {
        problemas[prob] = (problemas[prob] || 0) + 1;
      });
    });

    Object.entries(problemas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([problema, count], i) => {
        console.log(`${i + 1}. [${count}x] ${problema.substring(0, 60)}...`);
      });
    console.log('');
  }

  // 5. Próximos Casos Urgentes
  const { data: urgentes } = await supabase
    .from('case_reviews')
    .select('case_id, module_type, score_total, classificacao')
    .eq('requer_revisao_humana', true)
    .is('human_reviewed_at', null)
    .order('score_total', { ascending: true })
    .limit(10);

  console.log('⚠️  PRÓXIMOS 10 CASOS MAIS URGENTES');
  console.log('-'.repeat(70));
  urgentes.forEach((caso, i) => {
    console.log(`${i + 1}. [Score ${caso.score_total}] ${caso.module_type} - ${caso.classificacao}`);
  });
  console.log('');

  // 6. Meta Semanal
  const metaSemanal = 50; // 10 casos/dia × 5 dias úteis
  const realizadoSemana = revisadosSemanaCount || 0;
  const percentualMeta = (realizadoSemana / metaSemanal * 100).toFixed(1);

  console.log('🎯 META SEMANAL');
  console.log('-'.repeat(70));
  console.log(`Meta: ${metaSemanal} casos/semana`);
  console.log(`Realizado: ${realizadoSemana} casos`);
  console.log(`Progresso: ${percentualMeta}% da meta`);

  if (realizadoSemana >= metaSemanal) {
    console.log('✅ META ATINGIDA! 🎉');
  } else {
    const faltam = metaSemanal - realizadoSemana;
    console.log(`⚠️  Faltam ${faltam} casos para atingir a meta`);
  }
  console.log('');

  // 7. Tempo Estimado para Concluir Fila
  if (revisadosSemanaCount > 0) {
    const casosRestantes = filaCount;
    const velocidadeSemanal = revisadosSemanaCount;
    const semanasRestantes = Math.ceil(casosRestantes / velocidadeSemanal);

    console.log('⏱️  ESTIMATIVA DE CONCLUSÃO');
    console.log('-'.repeat(70));
    console.log(`Casos restantes na fila: ${casosRestantes}`);
    console.log(`Velocidade atual: ${velocidadeSemanal} casos/semana`);
    console.log(`Tempo estimado: ${semanasRestantes} semanas (${Math.ceil(semanasRestantes/4)} meses)`);
    console.log('');
  }

  // 8. Salvar em arquivo
  const report = {
    data_geracao: new Date().toISOString(),
    periodo: 'ultimos_7_dias',
    kpis: {
      total_casos: totalCount,
      aprovados: aprovadosCount,
      fila_pendente: filaCount,
      revisados_semana: revisadosSemanaCount
    },
    progresso_diario: progressoDiario,
    meta_semanal: {
      meta: metaSemanal,
      realizado: realizadoSemana,
      percentual: percentualMeta
    }
  };

  const filename = `relatorio-semanal-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));

  console.log('💾 RELATÓRIO SALVO');
  console.log('-'.repeat(70));
  console.log(`Arquivo: ${filename}`);
  console.log('');
  console.log('='.repeat(70));
  console.log('✅ Relatório semanal gerado com sucesso!\n');
}

generateWeeklyReport();
