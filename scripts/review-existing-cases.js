#!/usr/bin/env node
/**
 * SCOPSY - Script de Revisão em Batch
 *
 * Revisa casos existentes no banco de dados usando o case-review-service
 * Salva resultados em tabela de revisões para análise
 *
 * USO:
 *   node scripts/review-existing-cases.js --module=micromoment --limit=50
 *   node scripts/review-existing-cases.js --module=all --save
 *
 * @author Claude Code + Ailton
 * @date 2024-12-31
 */

// CRÍTICO: Limpar variáveis de ambiente do sistema antes de carregar .env
delete process.env.OPENAI_API_KEY;
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const { reviewBatch, categorizeCase, getQualityStats } = require('../src/services/case-review-service');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ═══════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse argumentos CLI
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value || true;
  return acc;
}, {});

const CONFIG = {
  module: args.module || 'all',  // 'micromoment' | 'diagnostic' | 'all'
  limit: parseInt(args.limit) || null,  // null = todos
  batchSize: parseInt(args.batch) || 10,
  save: args.save === 'true' || args.save === true,  // Salvar no banco
  output: args.output || 'review-results.json'  // Arquivo de saída
};

console.log('🔍 SCOPSY - Revisão de Casos Existentes\n');
console.log('Configuração:', CONFIG, '\n');

// ═══════════════════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════

/**
 * Buscar casos do banco por tipo
 */
async function fetchCases(moduleType, limit = null) {
  console.log(`\n📦 Buscando casos do tipo: ${moduleType}...`);

  let query = supabase
    .from('cases')
    .select('*')
    .eq('status', 'active');

  // Filtrar por tipo de módulo
  if (moduleType === 'micromoment') {
    // Micro-momentos: category=clinical_moment + moment_type específico (não 'clinical_moment')
    query = query
      .eq('category', 'clinical_moment')
      .not('moment_type', 'is', null)
      .not('moment_type', 'eq', 'clinical_moment');
  } else if (moduleType === 'diagnostic') {
    query = query.in('category', ['anxiety', 'mood', 'trauma', 'psychotic', 'personality', 'eating', 'substance']);
  } else if (moduleType === 'conceptualization') {
    // Conceptualizações: category=clinical_moment + (moment_type=null OU 'clinical_moment')
    query = query
      .eq('category', 'clinical_moment')
      .or('moment_type.is.null,moment_type.eq.clinical_moment');
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Erro ao buscar casos:', error.message);
    throw error;
  }

  console.log(`✅ Encontrados: ${data.length} casos`);
  return data;
}

/**
 * Mapear tipo de caso para tipo de módulo
 * LÓGICA:
 * 1. Diagnostic: category in ['anxiety', 'mood', 'trauma', etc]
 * 2. Micromoment: category='clinical_moment' + moment_type específico
 * 3. Conceptualization: category='clinical_moment' + moment_type genérico/null
 */
function mapCaseToModule(caseData) {
  // 1. Diagnóstico: category específica de transtorno
  if (['anxiety', 'mood', 'trauma', 'psychotic', 'personality', 'eating', 'substance'].includes(caseData.category)) {
    return 'diagnostic';
  }

  // 2. Se category='clinical_moment', distinguir por moment_type
  if (caseData.category === 'clinical_moment') {
    // Micro-momentos têm moment_type específico (não 'clinical_moment')
    if (caseData.moment_type && caseData.moment_type !== 'clinical_moment') {
      return 'micromoment';
    }
    // Conceptualizações têm moment_type null ou 'clinical_moment'
    return 'conceptualization';
  }

  // 3. Fallback: verificar estrutura do case_content
  const content = caseData.case_content || {};
  if (content.critical_moment && content.options) {
    return 'micromoment';
  }
  if (content.diagnostic_structure || content.criteria_present) {
    return 'diagnostic';
  }

  return null;  // Caso não identificado
}

/**
 * Salvar resultados de revisão no banco
 */
async function saveReviewResults(results) {
  console.log('\n💾 Salvando resultados no banco...');

  const reviewRecords = results
    .filter(r => !r.error)
    .map(r => ({
      case_id: r.metadata.case_id,
      module_type: r.metadata.module_type,
      score_total: r.score_total,
      classificacao: r.classificacao,
      aprovado: r.aprovado,
      requer_revisao_humana: r.requer_revisao_humana,
      acao_recomendada: r.acao,
      problemas_criticos: r.problemas_criticos || [],
      problemas_moderados: r.problemas_moderados || [],
      sugestao_correcao: r.sugestao_correcao || null,
      review_data: r,  // JSON completo
      reviewed_at: r.metadata.reviewed_at,
      tokens_used: r.metadata.tokens_used
    }));

  // Criar tabela se não existir (primeira execução)
  await createReviewTableIfNotExists();

  // Inserir resultados
  const { data, error } = await supabase
    .from('case_reviews')
    .upsert(reviewRecords, { onConflict: 'case_id' });

  if (error) {
    console.error('❌ Erro ao salvar:', error.message);
  } else {
    console.log(`✅ Salvos: ${reviewRecords.length} resultados`);
  }
}

/**
 * Criar tabela de revisões (se não existir)
 */
async function createReviewTableIfNotExists() {
  // Verificar se tabela existe
  const { data: tables } = await supabase
    .from('case_reviews')
    .select('case_id')
    .limit(1);

  // Se erro, tabela não existe - criar via SQL
  // (Em produção, usar migration proper)
  console.log('ℹ️  Tabela case_reviews já existe ou será criada manualmente');
}

/**
 * Gerar relatório HTML
 */
function generateHTMLReport(allResults, stats) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório de Revisão - Scopsy</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
    h1 { color: #2c3e50; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
    .stat-card { background: #ecf0f1; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: bold; color: #3498db; }
    .stat-label { color: #7f8c8d; margin-top: 8px; }
    .case-list { margin-top: 30px; }
    .case-item { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
    .case-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .badge-expert { background: #2ecc71; color: white; }
    .badge-adequada { background: #3498db; color: white; }
    .badge-questionavel { background: #f39c12; color: white; }
    .badge-inadequada { background: #e74c3c; color: white; }
    .problems { color: #e74c3c; margin-top: 10px; }
    .suggestions { color: #27ae60; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Relatório de Revisão de Casos - Scopsy</h1>
    <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
    <p><strong>Total de casos revisados:</strong> ${stats.total_cases}</p>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${stats.score_medio}</div>
        <div class="stat-label">Score Médio</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.distribuicao.expert}</div>
        <div class="stat-label">Expert (≥85)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.distribuicao.questionavel + stats.distribuicao.inadequada}</div>
        <div class="stat-label">Requerem Atenção</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.taxa_aprovacao}</div>
        <div class="stat-label">Taxa Aprovação</div>
      </div>
    </div>

    <h2>🔴 Casos que Requerem Revisão Humana</h2>
    <div class="case-list">
      ${allResults
        .filter(r => !r.error && (r.requer_revisao_humana || r.score_total < 70))
        .map(r => `
          <div class="case-item">
            <div class="case-header">
              <strong>Caso ${r.metadata.case_id?.substring(0, 8) || 'N/A'}</strong>
              <span class="badge badge-${r.classificacao?.toLowerCase()}">${r.classificacao} (${r.score_total}/100)</span>
            </div>
            ${r.problemas_criticos?.length > 0 ? `
              <div class="problems">
                <strong>⚠️ Problemas Críticos:</strong>
                <ul>${r.problemas_criticos.map(p => `<li>${p}</li>`).join('')}</ul>
              </div>
            ` : ''}
            ${r.sugestao_correcao ? `
              <div class="suggestions">
                <strong>💡 Sugestão:</strong> ${r.sugestao_correcao.justificativa}
              </div>
            ` : ''}
          </div>
        `).join('')}
    </div>

    <h2>📈 Problemas Mais Comuns</h2>
    <ul>
      ${stats.problemas_comuns?.map(p => `<li>${p.problema} (${p.ocorrencias}x)</li>`).join('') || '<li>Nenhum problema identificado</li>'}
    </ul>
  </div>
</body>
</html>
  `;

  const outputPath = path.join(process.cwd(), 'review-report.html');
  fs.writeFileSync(outputPath, html);
  console.log(`\n📄 Relatório HTML gerado: ${outputPath}`);
}

// ═══════════════════════════════════════════════════════════════════════
// EXECUÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════

async function main() {
  try {
    const startTime = Date.now();
    let allResults = [];

    // Determinar quais módulos revisar
    const modulesToReview = CONFIG.module === 'all'
      ? ['micromoment', 'diagnostic', 'conceptualization']
      : [CONFIG.module];

    console.log(`\n🎯 Módulos a revisar: ${modulesToReview.join(', ')}`);

    // Revisar cada módulo
    for (const moduleType of modulesToReview) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📋 MÓDULO: ${moduleType.toUpperCase()}`);
      console.log('='.repeat(70));

      // Buscar casos
      const allCases = await fetchCases(moduleType, CONFIG.limit);

      // FILTRAR casos que realmente pertencem a este módulo
      // (dados do banco podem ter category/moment_type inconsistentes)
      const cases = allCases.filter(c => {
        const mappedType = mapCaseToModule(c);
        if (mappedType !== moduleType) {
          console.log(`⚠️  Caso ${c.id.substring(0, 8)} classificado como ${mappedType}, pulando...`);
          return false;
        }
        return true;
      });

      if (cases.length === 0) {
        console.log('⚠️  Nenhum caso encontrado para este módulo (após filtragem)');
        continue;
      }

      console.log(`✅ ${cases.length} casos confirmados para revisão`);

      // Revisar em batch
      console.log(`\n🔄 Iniciando revisão (batch size: ${CONFIG.batchSize})...`);

      const { results, stats } = await reviewBatch(cases, moduleType, CONFIG.batchSize);

      console.log(`\n✅ Revisão concluída para ${moduleType}`);
      console.log(`   Aprovados: ${stats.aprovados}`);
      console.log(`   Revisão humana: ${stats.revisao_humana}`);
      console.log(`   Reprovados: ${stats.reprovados}`);
      console.log(`   Erros: ${stats.erros}`);

      allResults = allResults.concat(results);
    }

    // Estatísticas finais
    console.log(`\n${'='.repeat(70)}`);
    console.log('📊 ESTATÍSTICAS FINAIS');
    console.log('='.repeat(70));

    const finalStats = getQualityStats(allResults);
    console.log(JSON.stringify(finalStats, null, 2));

    // Salvar resultados
    if (CONFIG.save) {
      await saveReviewResults(allResults);
    }

    // Salvar JSON
    const jsonOutput = {
      config: CONFIG,
      timestamp: new Date().toISOString(),
      total_time_ms: Date.now() - startTime,
      stats: finalStats,
      results: allResults
    };

    fs.writeFileSync(CONFIG.output, JSON.stringify(jsonOutput, null, 2));
    console.log(`\n💾 Resultados salvos em: ${CONFIG.output}`);

    // Gerar relatório HTML
    generateHTMLReport(allResults, finalStats);

    // Resumo final
    console.log(`\n${'='.repeat(70)}`);
    console.log('✅ REVISÃO COMPLETA!');
    console.log('='.repeat(70));
    console.log(`Total de casos: ${allResults.length}`);
    console.log(`Tempo total: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    console.log(`Taxa de aprovação: ${finalStats.taxa_aprovacao}`);

    // Alertas importantes
    const criticalCases = allResults.filter(r => !r.error && r.score_total < 50);
    if (criticalCases.length > 0) {
      console.log(`\n⚠️  ATENÇÃO: ${criticalCases.length} casos CRÍTICOS identificados!`);
      console.log('   Revise o relatório HTML para detalhes.');
    }

    console.log('\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar
main();
