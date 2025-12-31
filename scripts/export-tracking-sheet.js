#!/usr/bin/env node
/**
 * SCOPSY - Exportar Planilha de Tracking
 *
 * Gera CSV com casos da fila de revisão para tracking em Excel/Sheets
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function exportTrackingSheet() {
  console.log('📊 Exportando planilha de tracking...\n');

  // Buscar todos casos da fila
  const { data: queue, error } = await supabase
    .from('case_reviews')
    .select(`
      case_id,
      module_type,
      score_total,
      classificacao,
      problemas_criticos,
      reviewed_at,
      human_reviewed_at,
      human_decision,
      human_notes
    `)
    .eq('requer_revisao_humana', true)
    .order('score_total', { ascending: true });

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  console.log(`✅ ${queue.length} casos na fila\n`);

  // Definir prioridade baseada em score
  const getPrioridade = (score) => {
    if (score < 30) return 'URGENTE';
    if (score < 50) return 'ALTA';
    if (score < 60) return 'MÉDIA';
    return 'BAIXA';
  };

  // Criar CSV
  const headers = [
    'Case ID',
    'Módulo',
    'Score',
    'Classificação',
    'Prioridade',
    'Status',
    'Revisado Por',
    'Data Revisão',
    'Decisão',
    'Problemas Principais',
    'Notas'
  ];

  const rows = queue.map(caso => [
    caso.case_id.substring(0, 8),
    caso.module_type,
    caso.score_total,
    caso.classificacao,
    getPrioridade(caso.score_total),
    caso.human_reviewed_at ? 'Revisado' : 'Pendente',
    caso.human_reviewed_at ? 'Supervisora' : '',
    caso.human_reviewed_at ? new Date(caso.human_reviewed_at).toLocaleDateString('pt-BR') : '',
    caso.human_decision || '',
    caso.problemas_criticos?.[0] || '',
    caso.human_notes || ''
  ]);

  // Formatar CSV
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Salvar arquivo
  const filename = `tracking-revisao-${new Date().toISOString().split('T')[0]}.csv`;
  fs.writeFileSync(filename, csv, 'utf8');

  console.log(`✅ Planilha exportada: ${filename}`);
  console.log(`\n📊 RESUMO:`);
  console.log(`   Total de casos: ${queue.length}`);
  console.log(`   Pendentes: ${queue.filter(c => !c.human_reviewed_at).length}`);
  console.log(`   Revisados: ${queue.filter(c => c.human_reviewed_at).length}`);

  // Distribuição por prioridade
  const urgente = queue.filter(c => c.score_total < 30).length;
  const alta = queue.filter(c => c.score_total >= 30 && c.score_total < 50).length;
  const media = queue.filter(c => c.score_total >= 50 && c.score_total < 60).length;
  const baixa = queue.filter(c => c.score_total >= 60).length;

  console.log(`\n   Por prioridade:`);
  console.log(`   - URGENTE (<30): ${urgente}`);
  console.log(`   - ALTA (30-49): ${alta}`);
  console.log(`   - MÉDIA (50-59): ${media}`);
  console.log(`   - BAIXA (≥60): ${baixa}`);

  console.log(`\n📝 Próximo passo:`);
  console.log(`   Abrir ${filename} no Excel ou Google Sheets\n`);
}

exportTrackingSheet();
