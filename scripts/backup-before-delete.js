#!/usr/bin/env node
/**
 * SCOPSY - Backup de Casos Antes da Deleção
 *
 * Exporta os 248 casos que serão deletados para arquivo JSON
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function backupBeforeDelete() {
  console.log('🛡️  BACKUP DE CASOS - ANTES DA DELEÇÃO\n');
  console.log('='.repeat(70) + '\n');

  // Ler lista de IDs que serão deletados
  const deletionReport = JSON.parse(
    fs.readFileSync('analise-casos-problematicos-2025-12-31.json', 'utf8')
  );

  const idsToDelete = deletionReport.recommendations.delete;
  console.log(`📦 Total de casos para backup: ${idsToDelete.length}\n`);

  // Buscar dados completos dos casos
  const { data: cases, error: casesError } = await supabase
    .from('cases')
    .select('*')
    .in('id', idsToDelete);

  if (casesError) {
    console.error('❌ Erro ao buscar casos:', casesError.message);
    return;
  }

  console.log(`✅ ${cases.length} casos recuperados\n`);

  // Buscar reviews dos casos
  const { data: reviews, error: reviewsError } = await supabase
    .from('case_reviews')
    .select('*')
    .in('case_id', idsToDelete);

  if (reviewsError) {
    console.error('❌ Erro ao buscar reviews:', reviewsError.message);
    return;
  }

  console.log(`✅ ${reviews.length} reviews recuperadas\n`);

  // Criar backup
  const backup = {
    metadata: {
      backup_date: new Date().toISOString(),
      total_cases: cases.length,
      total_reviews: reviews.length,
      reason: 'Deleção de casos irrecuperáveis (score 0, múltiplos problemas)',
      can_restore: true
    },
    cases: cases,
    reviews: reviews,
    deletion_ids: idsToDelete
  };

  // Salvar backup
  const filename = `backup-casos-deletados-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2));

  const fileSizeMB = (fs.statSync(filename).size / 1024 / 1024).toFixed(2);

  console.log('💾 BACKUP SALVO COM SUCESSO!\n');
  console.log('-'.repeat(70));
  console.log(`Arquivo: ${filename}`);
  console.log(`Tamanho: ${fileSizeMB} MB`);
  console.log(`Casos: ${cases.length}`);
  console.log(`Reviews: ${reviews.length}`);
  console.log('');
  console.log('✅ Backup completo! Agora é seguro executar a deleção.\n');
  console.log('📋 Próximo passo: Executar sql-delete-irrecuperaveis.sql no Supabase\n');
}

backupBeforeDelete();
