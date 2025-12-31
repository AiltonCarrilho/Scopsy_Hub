#!/usr/bin/env node
/**
 * SCOPSY - Deletar 6 Casos Inadequados Restantes
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteRemainingCases() {
  console.log('🗑️  DELETAR 6 CASOS INADEQUADOS RESTANTES\n');
  console.log('='.repeat(70) + '\n');

  // 1. Buscar os 6 casos inadequados
  const { data: inadequate, error } = await supabase
    .from('case_reviews')
    .select('case_id, score_total, problemas_criticos')
    .eq('module_type', 'micromoment')
    .eq('classificacao', 'INADEQUADA')
    .order('score_total', { ascending: true });

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  console.log(`📋 Casos inadequados encontrados: ${inadequate.length}\n`);

  inadequate.forEach((caso, i) => {
    console.log(`${i + 1}. ${caso.case_id.substring(0, 8)} - Score: ${caso.score_total}/100`);
    console.log(`   Problemas: ${caso.problemas_criticos?.[0] || 'Nenhum'}`);
  });

  const ids = inadequate.map(c => c.case_id);

  // 2. Backup rápido
  const { data: cases } = await supabase
    .from('cases')
    .select('*')
    .in('id', ids);

  const backup = {
    metadata: {
      backup_date: new Date().toISOString(),
      total_cases: cases.length,
      reason: 'Deleção dos 6 casos inadequados restantes'
    },
    cases: cases,
    reviews: inadequate
  };

  const backupFilename = 'backup-6-casos-inadequados.json';
  fs.writeFileSync(backupFilename, JSON.stringify(backup, null, 2));
  console.log(`\n✅ Backup salvo: ${backupFilename}\n`);

  // 3. Deletar casos
  console.log('🗑️  Deletando casos...\n');

  const { error: deleteCasesError } = await supabase
    .from('cases')
    .delete()
    .in('id', ids);

  if (deleteCasesError) {
    console.error('❌ Erro ao deletar casos:', deleteCasesError.message);
    return;
  }

  console.log('✅ 6 casos deletados da tabela "cases"\n');

  // 4. Deletar reviews
  const { error: deleteReviewsError } = await supabase
    .from('case_reviews')
    .delete()
    .in('case_id', ids);

  if (deleteReviewsError) {
    console.error('❌ Erro ao deletar reviews:', deleteReviewsError.message);
    return;
  }

  console.log('✅ 6 reviews deletadas da tabela "case_reviews"\n');

  // 5. Estatísticas finais
  const { count: totalCases } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true })
    .eq('category', 'clinical_moment');

  const { data: distribution } = await supabase
    .from('case_reviews')
    .select('classificacao, score_total')
    .eq('module_type', 'micromoment');

  if (distribution) {
    const expert = distribution.filter(r => r.classificacao === 'EXPERT').length;
    const adequada = distribution.filter(r => r.classificacao === 'ADEQUADA').length;
    const questionavel = distribution.filter(r => r.classificacao === 'QUESTIONAVEL').length;
    const inadequada = distribution.filter(r => r.classificacao === 'INADEQUADA').length;

    const total = distribution.length;
    const approvalRate = ((expert / total) * 100).toFixed(1);
    const avgScore = (distribution.reduce((sum, r) => sum + r.score_total, 0) / total).toFixed(1);

    console.log('='.repeat(70));
    console.log('\n📊 ESTATÍSTICAS FINAIS:\n');
    console.log('-'.repeat(70));
    console.log(`Total de micromoments: ${totalCases}`);
    console.log('');
    console.log(`✅ EXPERT:       ${expert.toString().padStart(3)} (${(expert/total*100).toFixed(1)}%)`);
    console.log(`🟢 ADEQUADA:     ${adequada.toString().padStart(3)} (${(adequada/total*100).toFixed(1)}%)`);
    console.log(`🟡 QUESTIONÁVEL: ${questionavel.toString().padStart(3)} (${(questionavel/total*100).toFixed(1)}%)`);
    console.log(`🔴 INADEQUADA:   ${inadequada.toString().padStart(3)} (${(inadequada/total*100).toFixed(1)}%)`);
    console.log('');
    console.log(`Taxa de aprovação: ${approvalRate}%`);
    console.log(`Score médio: ${avgScore}/100`);
    console.log('');
    console.log('='.repeat(70));
    console.log('\n🎉 LIMPEZA COMPLETA!\n');
    console.log(`✅ Total deletado hoje: 254 casos (248 + 6)`);
    console.log(`✅ Database final: ${totalCases} micromoments`);
    console.log(`✅ Taxa de aprovação: ${approvalRate}%`);
    console.log(`✅ Score médio: ${avgScore}/100\n`);
  }
}

deleteRemainingCases();
