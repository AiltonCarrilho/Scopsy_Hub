#!/usr/bin/env node
/**
 * SCOPSY - Importar Resultados de Revisão para Banco de Dados
 *
 * Lê review-results.json e insere registros na tabela case_reviews
 *
 * USO:
 *   node scripts/import-reviews-to-db.js
 *
 * @author Claude Code + Ailton
 * @date 2024-12-31
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ═══════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESULTS_FILE = path.join(__dirname, '..', 'review-results.json');

console.log('🔄 SCOPSY - Importação de Revisões para Banco\n');

// ═══════════════════════════════════════════════════════════════════════
// FUNÇÕES
// ═══════════════════════════════════════════════════════════════════════

/**
 * Mapear resultado para formato do banco
 */
function mapReviewToRecord(result) {
  // Campos comuns a todos os módulos
  const base = {
    case_id: result.metadata?.case_id,
    module_type: result.metadata?.module_type,
    score_total: result.score_total || 0,
    aprovado: result.aprovado || false,
    requer_revisao_humana: result.requer_revisao_humana || false,
    acao_recomendada: result.acao || 'REVISAR',
    review_data: result,
    reviewed_at: result.metadata?.reviewed_at || new Date().toISOString(),
    reviewed_by: result.metadata?.model || 'gpt-4o-mini',
    tokens_used: result.metadata?.tokens_used || 0
  };

  // Classificação baseada em score
  if (result.score_total >= 85) {
    base.classificacao = 'EXPERT';
  } else if (result.score_total >= 70) {
    base.classificacao = 'ADEQUADA';
  } else if (result.score_total >= 50) {
    base.classificacao = 'QUESTIONAVEL';
  } else {
    base.classificacao = 'INADEQUADA';
  }

  // Campos específicos por tipo de módulo
  if (result.metadata?.module_type === 'micromoment') {
    base.problemas_criticos = result.problemas_criticos || [];
    base.problemas_moderados = result.problemas_moderados || [];
    base.sugestao_correcao = result.sugestao_correcao || null;
  } else if (result.metadata?.module_type === 'diagnostic') {
    base.problemas_criticos = result.problemas_dsm5 || [];
    base.problemas_moderados = result.diferenciais_ausentes || [];
    base.sugestao_correcao = null;
  } else if (result.metadata?.module_type === 'conceptualization') {
    base.problemas_criticos = result.problemas_conceituais || [];
    base.problemas_moderados = [];
    base.sugestao_correcao = result.sugestoes ? { sugestoes: result.sugestoes } : null;
  }

  return base;
}

/**
 * Validar registro antes de inserir
 */
function validateRecord(record) {
  const errors = [];

  if (!record.case_id) errors.push('case_id obrigatório');
  if (!record.module_type) errors.push('module_type obrigatório');
  if (record.score_total == null || record.score_total < 0 || record.score_total > 100) {
    errors.push('score_total deve estar entre 0 e 100');
  }
  if (!record.classificacao) errors.push('classificacao obrigatória');

  return errors;
}

/**
 * Importar resultados em batches
 */
async function importReviews() {
  try {
    // Ler arquivo
    console.log('📂 Lendo review-results.json...');
    const rawData = fs.readFileSync(RESULTS_FILE, 'utf8');
    const data = JSON.parse(rawData);

    console.log(`✅ Encontrados: ${data.results.length} resultados\n`);

    // Filtrar apenas resultados válidos (sem erro)
    const validResults = data.results.filter(r => !r.error);
    console.log(`✅ Válidos (sem erro): ${validResults.length}`);
    console.log(`⚠️  Com erro (ignorados): ${data.results.length - validResults.length}\n`);

    // Mapear para formato do banco
    console.log('🔄 Mapeando registros...');
    const records = validResults.map(mapReviewToRecord);

    // Validar registros
    console.log('✔️  Validando registros...');
    let invalidCount = 0;
    const validRecords = records.filter(rec => {
      const errors = validateRecord(rec);
      if (errors.length > 0) {
        invalidCount++;
        console.log(`   ⚠️  Registro inválido (${rec.case_id?.substring(0, 8)}): ${errors.join(', ')}`);
        return false;
      }
      return true;
    });

    console.log(`✅ Válidos para importar: ${validRecords.length}`);
    if (invalidCount > 0) {
      console.log(`⚠️  Inválidos (ignorados): ${invalidCount}\n`);
    }

    // Inserir em batches de 50
    const BATCH_SIZE = 50;
    const batches = [];
    for (let i = 0; i < validRecords.length; i += BATCH_SIZE) {
      batches.push(validRecords.slice(i, i + BATCH_SIZE));
    }

    console.log(`\n📦 Inserindo em ${batches.length} batches de até ${BATCH_SIZE} registros...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      process.stdout.write(`   Batch ${i + 1}/${batches.length} (${batch.length} registros)... `);

      try {
        const { data: inserted, error } = await supabase
          .from('case_reviews')
          .upsert(batch, { onConflict: 'case_id' });

        if (error) {
          console.log(`❌ ERRO: ${error.message}`);
          errorCount += batch.length;
        } else {
          console.log('✅');
          successCount += batch.length;
        }
      } catch (err) {
        console.log(`❌ ERRO: ${err.message}`);
        errorCount += batch.length;
      }

      // Delay pequeno entre batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Resumo final
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMO DA IMPORTAÇÃO');
    console.log('='.repeat(70));
    console.log(`Total processados: ${validRecords.length}`);
    console.log(`✅ Inseridos com sucesso: ${successCount}`);
    if (errorCount > 0) {
      console.log(`❌ Erros: ${errorCount}`);
    }
    console.log('');

    // Verificar contagem no banco
    const { count } = await supabase
      .from('case_reviews')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total de registros na tabela: ${count}\n`);

    // Estatísticas rápidas
    const { data: stats } = await supabase
      .from('case_reviews')
      .select('classificacao')
      .order('classificacao');

    if (stats) {
      const grouped = stats.reduce((acc, row) => {
        acc[row.classificacao] = (acc[row.classificacao] || 0) + 1;
        return acc;
      }, {});

      console.log('📈 DISTRIBUIÇÃO:');
      Object.entries(grouped)
        .sort((a, b) => b[1] - a[1])
        .forEach(([classificacao, count]) => {
          console.log(`   ${classificacao.padEnd(15)}: ${count}`);
        });
    }

    console.log('\n✅ Importação concluída!\n');
    console.log('📋 Próximos passos:');
    console.log('   1. Verificar fila: SELECT * FROM human_review_queue;');
    console.log('   2. Ver estatísticas: SELECT * FROM quality_stats_by_module;');
    console.log('   3. Casos críticos: SELECT * FROM critical_cases;\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// EXECUÇÃO
// ═══════════════════════════════════════════════════════════════════════

// Verificar se arquivo existe
if (!fs.existsSync(RESULTS_FILE)) {
  console.error('❌ Arquivo review-results.json não encontrado!');
  console.error('   Execute primeiro: node scripts/review-existing-cases.js --module=all\n');
  process.exit(1);
}

// Confirmar com usuário
console.log('⚠️  ATENÇÃO: Este script vai inserir/atualizar registros na tabela case_reviews.');
console.log('   Certifique-se que a tabela foi criada (sql-scripts/case_reviews_table.sql)\n');

// Executar
importReviews();
