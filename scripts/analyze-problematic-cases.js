#!/usr/bin/env node
/**
 * SCOPSY - Análise Detalhada de Casos Problemáticos
 *
 * Analisa os 254 casos inadequados e gera relatório acionável
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeProblematicCases() {
  console.log('🔍 SCOPSY - ANÁLISE DE CASOS PROBLEMÁTICOS\n');
  console.log('='.repeat(70) + '\n');

  // 1. Buscar todos os casos inadequados
  const { data: problematicCases, error } = await supabase
    .from('case_reviews')
    .select(`
      case_id,
      score_total,
      problemas_criticos,
      sugestao_correcao,
      reviewed_at
    `)
    .eq('module_type', 'micromoment')
    .eq('classificacao', 'INADEQUADA')
    .order('score_total', { ascending: true });

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  console.log(`📊 Total de casos inadequados: ${problematicCases.length}\n`);

  // 2. Categorizar por tipo de problema
  const problemCategories = {};
  const problemCombinations = {};
  const casesWithMultipleProblems = [];

  problematicCases.forEach(caso => {
    const problems = caso.problemas_criticos || [];

    // Contar cada tipo de problema
    problems.forEach(prob => {
      problemCategories[prob] = (problemCategories[prob] || []);
      problemCategories[prob].push({
        case_id: caso.case_id,
        score: caso.score_total,
        suggestions: caso.sugestao_correcao
      });
    });

    // Combinações de problemas
    if (problems.length > 1) {
      const combo = problems.sort().join(' + ');
      problemCombinations[combo] = (problemCombinations[combo] || 0) + 1;
      casesWithMultipleProblems.push({
        case_id: caso.case_id,
        score: caso.score_total,
        problems: problems,
        suggestions: caso.sugestao_correcao
      });
    }
  });

  // 3. Ranking de problemas por frequência
  console.log('📈 RANKING DE PROBLEMAS (por frequência)\n');
  console.log('-'.repeat(70));

  const rankedProblems = Object.entries(problemCategories)
    .sort((a, b) => b[1].length - a[1].length);

  rankedProblems.forEach(([problem, cases], index) => {
    const avgScore = cases.reduce((sum, c) => sum + c.score, 0) / cases.length;
    console.log(`${index + 1}. [${cases.length} casos] ${problem}`);
    console.log(`   Score médio: ${avgScore.toFixed(1)}/100`);
    console.log(`   Piores 3 casos: ${cases.slice(0, 3).map(c =>
      `${c.case_id.substring(0, 8)} (${c.score})`
    ).join(', ')}`);
    console.log('');
  });

  // 4. Análise de casos com múltiplos problemas
  console.log('\n🚨 CASOS COM MÚLTIPLOS PROBLEMAS\n');
  console.log('-'.repeat(70));
  console.log(`Total: ${casesWithMultipleProblems.length} casos\n`);

  const topCombinations = Object.entries(problemCombinations)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  console.log('Top 5 combinações mais comuns:');
  topCombinations.forEach(([combo, count], i) => {
    console.log(`${i + 1}. [${count}x] ${combo}`);
  });
  console.log('');

  // 5. Casos críticos (score < 20)
  const criticalCases = problematicCases.filter(c => c.score_total < 20);

  console.log('\n🔴 CASOS CRÍTICOS (score < 20)\n');
  console.log('-'.repeat(70));
  console.log(`Total: ${criticalCases.length} casos\n`);

  criticalCases.slice(0, 10).forEach((caso, i) => {
    console.log(`${i + 1}. ${caso.case_id.substring(0, 8)} - Score: ${caso.score_total}/100`);
    console.log(`   Problemas: ${caso.problemas_criticos?.join(', ') || 'Nenhum'}`);
    console.log(`   Sugestão: ${caso.sugestao_correcao?.action || 'Nenhuma'}`);
    console.log('');
  });

  // 6. Recomendações por categoria
  console.log('\n💡 RECOMENDAÇÕES DE AÇÃO\n');
  console.log('-'.repeat(70));

  const recommendations = {
    'DELETAR': [],
    'CORRIGIR_URGENTE': [],
    'CORRIGIR_MÉDIO': [],
    'REVISAR_MANUAL': []
  };

  problematicCases.forEach(caso => {
    const problems = caso.problemas_criticos || [];
    const score = caso.score_total;

    // Casos irrecuperáveis (múltiplos problemas graves + score < 15)
    if (problems.length >= 3 && score < 15) {
      recommendations.DELETAR.push(caso);
    }
    // Problemas críticos mas recuperáveis (1-2 problemas + score 15-30)
    else if (problems.length <= 2 && score >= 15 && score < 30) {
      recommendations.CORRIGIR_URGENTE.push(caso);
    }
    // Problemas moderados (score 30-40)
    else if (score >= 30 && score < 40) {
      recommendations.CORRIGIR_MÉDIO.push(caso);
    }
    // Edge cases que precisam análise humana
    else {
      recommendations.REVISAR_MANUAL.push(caso);
    }
  });

  console.log(`🗑️  DELETAR (irrecuperáveis): ${recommendations.DELETAR.length} casos`);
  console.log(`   → Múltiplos problemas graves (≥3) + Score < 15`);
  console.log(`   → Não vale esforço de correção\n`);

  console.log(`🚨 CORRIGIR URGENTE: ${recommendations.CORRIGIR_URGENTE.length} casos`);
  console.log(`   → 1-2 problemas + Score 15-29`);
  console.log(`   → Correção simples, alto impacto\n`);

  console.log(`⚠️  CORRIGIR MÉDIO: ${recommendations.CORRIGIR_MÉDIO.length} casos`);
  console.log(`   → Score 30-39`);
  console.log(`   → Melhorias pontuais\n`);

  console.log(`👁️  REVISAR MANUAL: ${recommendations.REVISAR_MANUAL.length} casos`);
  console.log(`   → Edge cases que precisam análise humana\n`);

  // 7. Salvar relatórios detalhados
  const reports = {
    summary: {
      total: problematicCases.length,
      critical: criticalCases.length,
      multiple_problems: casesWithMultipleProblems.length,
      recommendations: {
        delete: recommendations.DELETAR.length,
        urgent: recommendations.CORRIGIR_URGENTE.length,
        medium: recommendations.CORRIGIR_MÉDIO.length,
        manual: recommendations.REVISAR_MANUAL.length
      }
    },
    problem_ranking: rankedProblems.map(([problem, cases]) => ({
      problem,
      count: cases.length,
      avg_score: cases.reduce((sum, c) => sum + c.score, 0) / cases.length,
      worst_cases: cases.slice(0, 5).map(c => c.case_id)
    })),
    recommendations: {
      delete: recommendations.DELETAR.map(c => c.case_id),
      urgent: recommendations.CORRIGIR_URGENTE.map(c => ({
        case_id: c.case_id,
        score: c.score_total,
        problems: c.problemas_criticos,
        suggestions: c.sugestao_correcao
      })),
      medium: recommendations.CORRIGIR_MÉDIO.map(c => ({
        case_id: c.case_id,
        score: c.score_total,
        problems: c.problemas_criticos
      })),
      manual: recommendations.REVISAR_MANUAL.map(c => ({
        case_id: c.case_id,
        score: c.score_total,
        problems: c.problemas_criticos
      }))
    },
    critical_cases: criticalCases.map(c => ({
      case_id: c.case_id,
      score: c.score_total,
      problems: c.problemas_criticos,
      suggestions: c.sugestao_correcao
    }))
  };

  const filename = `analise-casos-problematicos-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(filename, JSON.stringify(reports, null, 2));

  console.log('\n💾 RELATÓRIO SALVO\n');
  console.log('-'.repeat(70));
  console.log(`Arquivo: ${filename}\n`);

  // 8. Gerar CSVs para ação
  const csvDelete = [
    'Case ID,Score,Problemas,Motivo',
    ...recommendations.DELETAR.map(c =>
      `"${c.case_id}","${c.score_total}","${c.problemas_criticos?.join('; ')}","Irrecuperável"`
    )
  ].join('\n');

  const csvUrgent = [
    'Case ID,Score,Problemas,Sugestões de Correção',
    ...recommendations.CORRIGIR_URGENTE.map(c =>
      `"${c.case_id}","${c.score_total}","${c.problemas_criticos?.join('; ')}","${c.sugestao_correcao?.action || ''}"`
    )
  ].join('\n');

  fs.writeFileSync('casos-para-deletar.csv', csvDelete, 'utf8');
  fs.writeFileSync('casos-para-corrigir-urgente.csv', csvUrgent, 'utf8');

  console.log('📊 CSVs GERADOS:\n');
  console.log('   ✓ casos-para-deletar.csv');
  console.log('   ✓ casos-para-corrigir-urgente.csv\n');

  // 9. SQL scripts prontos para executar
  const deleteSql = `-- DELETE casos irrecuperáveis (${recommendations.DELETAR.length} casos)
-- ATENÇÃO: BACKUP antes de executar!

DELETE FROM cases
WHERE id IN (
  ${recommendations.DELETAR.map(c => `'${c.case_id}'`).join(',\n  ')}
);

-- Deletar reviews desses casos também
DELETE FROM case_reviews
WHERE case_id IN (
  ${recommendations.DELETAR.map(c => `'${c.case_id}'`).join(',\n  ')}
);
`;

  fs.writeFileSync('sql-delete-irrecuperaveis.sql', deleteSql);
  console.log('   ✓ sql-delete-irrecuperaveis.sql\n');

  console.log('='.repeat(70));
  console.log('\n✅ Análise completa!\n');
  console.log('📋 PRÓXIMOS PASSOS:\n');
  console.log('1. Revisar casos-para-deletar.csv e executar SQL (se concordar)');
  console.log('2. Corrigir casos-para-corrigir-urgente.csv (prioridade)');
  console.log('3. Revisar casos-para-corrigir-médio.csv (quando possível)');
  console.log('4. Análise manual dos edge cases\n');
}

analyzeProblematicCases();
