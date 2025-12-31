#!/usr/bin/env node
/**
 * SCOPSY - Exportar Casos EXPERT para Produção
 *
 * Gera lista dos 125 casos aprovados (EXPERT) prontos para uso
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function exportExpertCases() {
  console.log('📋 EXPORTANDO CASOS EXPERT PARA PRODUÇÃO\n');
  console.log('='.repeat(70) + '\n');

  // 1. Buscar casos EXPERT com dados completos
  const { data: expertReviews, error: reviewError } = await supabase
    .from('case_reviews')
    .select('case_id, score_total, reviewed_at')
    .eq('module_type', 'micromoment')
    .eq('classificacao', 'EXPERT')
    .order('score_total', { ascending: false });

  if (reviewError) {
    console.error('❌ Erro ao buscar reviews:', reviewError.message);
    return;
  }

  console.log(`✅ ${expertReviews.length} casos EXPERT encontrados\n`);

  // 2. Buscar dados completos dos casos
  const caseIds = expertReviews.map(r => r.case_id);

  const { data: cases, error: casesError } = await supabase
    .from('cases')
    .select('id, disorder, category, moment_type, case_content, created_at')
    .in('id', caseIds);

  if (casesError) {
    console.error('❌ Erro ao buscar casos:', casesError.message);
    return;
  }

  console.log(`✅ Dados completos recuperados\n`);

  // 3. Mesclar dados
  const expertCases = expertReviews.map(review => {
    const caseData = cases.find(c => c.id === review.case_id);
    return {
      case_id: review.case_id,
      score: review.score_total,
      disorder: caseData?.disorder,
      moment_type: caseData?.moment_type,
      client_name: caseData?.case_content?.client_name,
      critical_moment: caseData?.case_content?.critical_moment,
      has_dialogue: !!caseData?.case_content?.dialogue,
      has_options: Array.isArray(caseData?.case_content?.options) && caseData.case_content.options.length > 0,
      expert_choice: caseData?.case_content?.expert_choice,
      reviewed_at: review.reviewed_at,
      created_at: caseData?.created_at
    };
  });

  // 4. Estatísticas
  console.log('📊 ESTATÍSTICAS DOS CASOS EXPERT:\n');
  console.log('-'.repeat(70));

  const avgScore = expertCases.reduce((sum, c) => sum + c.score, 0) / expertCases.length;
  const minScore = Math.min(...expertCases.map(c => c.score));
  const maxScore = Math.max(...expertCases.map(c => c.score));

  console.log(`Score médio: ${avgScore.toFixed(1)}/100`);
  console.log(`Score mínimo: ${minScore}/100`);
  console.log(`Score máximo: ${maxScore}/100`);
  console.log('');

  // Distribuição por moment_type
  const byType = {};
  expertCases.forEach(c => {
    byType[c.moment_type] = (byType[c.moment_type] || 0) + 1;
  });

  console.log('Por tipo de momento:');
  Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type || 'não especificado'}: ${count} casos`);
    });
  console.log('');

  // Distribuição por transtorno
  const byDisorder = {};
  expertCases.forEach(c => {
    byDisorder[c.disorder] = (byDisorder[c.disorder] || 0) + 1;
  });

  console.log('Por transtorno:');
  Object.entries(byDisorder)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([disorder, count]) => {
      console.log(`  ${disorder}: ${count} casos`);
    });
  console.log('');

  // 5. Exportar JSON completo
  const jsonExport = {
    metadata: {
      export_date: new Date().toISOString(),
      total_cases: expertCases.length,
      avg_score: avgScore,
      classification: 'EXPERT',
      ready_for_production: true
    },
    cases: expertCases,
    full_case_data: cases
  };

  const jsonFilename = 'casos-expert-producao.json';
  fs.writeFileSync(jsonFilename, JSON.stringify(jsonExport, null, 2));

  const jsonSizeMB = (fs.statSync(jsonFilename).size / 1024 / 1024).toFixed(2);
  console.log(`✅ JSON completo: ${jsonFilename} (${jsonSizeMB} MB)\n`);

  // 6. Exportar CSV simples (IDs + Score)
  const csvSimple = [
    'Case ID,Score,Disorder,Moment Type,Client Name,Has Dialogue,Has Options',
    ...expertCases.map(c =>
      `"${c.case_id}",${c.score},"${c.disorder}","${c.moment_type}","${c.client_name || ''}",${c.has_dialogue},${c.has_options}`
    )
  ].join('\n');

  const csvSimpleFilename = 'casos-expert-lista.csv';
  fs.writeFileSync(csvSimpleFilename, csvSimple, 'utf8');
  console.log(`✅ CSV lista: ${csvSimpleFilename}\n`);

  // 7. Exportar TXT com apenas IDs (para queries)
  const txtIds = expertCases.map(c => c.case_id).join('\n');
  const txtFilename = 'casos-expert-ids.txt';
  fs.writeFileSync(txtFilename, txtIds, 'utf8');
  console.log(`✅ TXT IDs: ${txtFilename}\n`);

  // 8. SQL para marcar como em produção (futuro)
  const sqlMarkProduction = `-- Marcar 125 casos EXPERT como prontos para produção
-- Execute quando tiver coluna 'in_production' na tabela cases

UPDATE cases
SET in_production = true
WHERE id IN (
  ${expertCases.map(c => `'${c.case_id}'`).join(',\n  ')}
);

-- Resultado esperado: 125 rows affected
`;

  const sqlFilename = 'sql-mark-expert-production.sql';
  fs.writeFileSync(sqlFilename, sqlMarkProduction);
  console.log(`✅ SQL script: ${sqlFilename}\n`);

  // 9. Resumo final
  console.log('='.repeat(70));
  console.log('\n🎯 RESUMO DA EXPORTAÇÃO:\n');
  console.log('-'.repeat(70));
  console.log(`✅ ${expertCases.length} casos EXPERT exportados`);
  console.log(`✅ Score médio: ${avgScore.toFixed(1)}/100`);
  console.log(`✅ 4 arquivos gerados:`);
  console.log(`   1. ${jsonFilename} - Dados completos (para API/backend)`);
  console.log(`   2. ${csvSimpleFilename} - Lista em Excel (para revisão)`);
  console.log(`   3. ${txtFilename} - IDs puros (para queries)`);
  console.log(`   4. ${sqlFilename} - SQL para marcar produção\n`);
  console.log('🚀 Casos prontos para deploy em produção!\n');
}

exportExpertCases();
