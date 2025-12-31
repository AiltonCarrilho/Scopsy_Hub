#!/usr/bin/env node
/**
 * SCOPSY - Validar Deleção de Casos
 *
 * Verifica se a deleção foi executada corretamente
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function validateDeletion() {
  console.log('🔍 VALIDAÇÃO DA DELEÇÃO\n');
  console.log('='.repeat(70) + '\n');

  // Ler lista de IDs que deveriam ter sido deletados
  const deletionReport = JSON.parse(
    fs.readFileSync('analise-casos-problematicos-2025-12-31.json', 'utf8')
  );

  const deletedIds = deletionReport.recommendations.delete;
  console.log(`📋 IDs que deveriam ter sido deletados: ${deletedIds.length}\n`);

  // 1. Verificar se os casos ainda existem
  const { data: remainingCases, error: casesError } = await supabase
    .from('cases')
    .select('id')
    .in('id', deletedIds);

  if (casesError) {
    console.error('❌ Erro ao verificar casos:', casesError.message);
    return;
  }

  console.log('🗑️  CASOS NA TABELA "cases":\n');
  console.log('-'.repeat(70));
  if (remainingCases.length === 0) {
    console.log('✅ SUCESSO: Todos os 248 casos foram deletados!\n');
  } else {
    console.log(`⚠️  ATENÇÃO: ${remainingCases.length} casos ainda existem!\n`);
    console.log('IDs que não foram deletados:');
    remainingCases.slice(0, 5).forEach(c => console.log(`  - ${c.id}`));
    if (remainingCases.length > 5) {
      console.log(`  ... e mais ${remainingCases.length - 5}\n`);
    }
  }

  // 2. Verificar se as reviews ainda existem
  const { data: remainingReviews, error: reviewsError } = await supabase
    .from('case_reviews')
    .select('case_id')
    .in('case_id', deletedIds);

  if (reviewsError) {
    console.error('❌ Erro ao verificar reviews:', reviewsError.message);
    return;
  }

  console.log('🗑️  REVIEWS NA TABELA "case_reviews":\n');
  console.log('-'.repeat(70));
  if (remainingReviews.length === 0) {
    console.log('✅ SUCESSO: Todas as 248 reviews foram deletadas!\n');
  } else {
    console.log(`⚠️  ATENÇÃO: ${remainingReviews.length} reviews ainda existem!\n`);
  }

  // 3. Estatísticas atualizadas
  const { count: totalCases } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true })
    .eq('category', 'clinical_moment');

  const { count: totalReviews } = await supabase
    .from('case_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('module_type', 'micromoment');

  console.log('\n📊 ESTATÍSTICAS ATUALIZADAS:\n');
  console.log('-'.repeat(70));
  console.log(`Total de micromoments restantes: ${totalCases || 0}`);
  console.log(`Total de reviews restantes: ${totalReviews || 0}`);
  console.log('');

  // 4. Distribuição por classificação
  const { data: distribution } = await supabase
    .from('case_reviews')
    .select('classificacao')
    .eq('module_type', 'micromoment');

  if (distribution) {
    const expert = distribution.filter(r => r.classificacao === 'EXPERT').length;
    const adequada = distribution.filter(r => r.classificacao === 'ADEQUADA').length;
    const questionavel = distribution.filter(r => r.classificacao === 'QUESTIONAVEL').length;
    const inadequada = distribution.filter(r => r.classificacao === 'INADEQUADA').length;

    const total = distribution.length;
    const approvalRate = total > 0 ? ((expert / total) * 100).toFixed(1) : 0;

    console.log('📈 DISTRIBUIÇÃO POR CLASSIFICAÇÃO:\n');
    console.log('-'.repeat(70));
    console.log(`✅ EXPERT:       ${expert.toString().padStart(3)} (${(expert/total*100).toFixed(1)}%)`);
    console.log(`🟢 ADEQUADA:     ${adequada.toString().padStart(3)} (${(adequada/total*100).toFixed(1)}%)`);
    console.log(`🟡 QUESTIONÁVEL: ${questionavel.toString().padStart(3)} (${(questionavel/total*100).toFixed(1)}%)`);
    console.log(`🔴 INADEQUADA:   ${inadequada.toString().padStart(3)} (${(inadequada/total*100).toFixed(1)}%)`);
    console.log('');
    console.log(`Taxa de aprovação: ${approvalRate}%`);
    console.log('');
  }

  // 5. Score médio
  const { data: scores } = await supabase
    .from('case_reviews')
    .select('score_total')
    .eq('module_type', 'micromoment');

  if (scores && scores.length > 0) {
    const avgScore = scores.reduce((sum, r) => sum + r.score_total, 0) / scores.length;

    console.log('📊 SCORE MÉDIO:\n');
    console.log('-'.repeat(70));
    console.log(`Score médio: ${avgScore.toFixed(1)}/100`);
    console.log('');
  }

  // 6. Resumo final
  console.log('='.repeat(70));
  console.log('\n🎯 RESUMO DA VALIDAÇÃO:\n');

  if (remainingCases.length === 0 && remainingReviews.length === 0) {
    console.log('✅ DELEÇÃO EXECUTADA COM SUCESSO!');
    console.log('✅ Todos os 248 casos foram removidos');
    console.log('✅ Todas as 248 reviews foram removidas');
    console.log('');
    console.log(`📈 Impacto: Database reduziu de 436 → ${totalCases || 0} casos`);
    console.log(`📈 Taxa de aprovação melhorou para ${approvalRate}%`);
    console.log('');
    console.log('🎉 Sistema de revisão está mais limpo e confiável!\n');
  } else {
    console.log('⚠️  DELEÇÃO PARCIAL OU INCOMPLETA');
    console.log(`   Casos não deletados: ${remainingCases.length}`);
    console.log(`   Reviews não deletadas: ${remainingReviews.length}`);
    console.log('');
    console.log('🔧 Recomendação: Execute o SQL novamente ou contate suporte.\n');
  }
}

validateDeletion();
