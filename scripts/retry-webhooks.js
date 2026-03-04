#!/usr/bin/env node

// ========================================
// RETRY-WEBHOOKS.JS
// ========================================
// Script para reprocessar webhooks falhados
//
// Uso: npm run retry:webhooks
//      npm run retry:webhooks -- --limit 5
//      npm run retry:webhooks -- --days 7
//
// Referência: P0.3-kiwify-webhooks.md

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const logger = require('../src/config/logger');
const { supabaseAdmin: supabase } = require('../src/services/supabase');
const { processKiwifyEvent } = require('../src/services/kiwify-service');

// ========================================
// CONFIGURAÇÃO
// ========================================

const DEFAULTS = {
  limit: 10,           // Max webhooks para reprocessar por vez
  maxDays: 7,          // Não reprocessar webhooks com > 7 dias
  maxAttempts: 5       // Não reprocessar se já tentou 5 vezes
};

// Parse de argumentos CLI
const args = process.argv.slice(2);
const options = {
  limit: DEFAULTS.limit,
  maxDays: DEFAULTS.maxDays,
  verbose: args.includes('--verbose'),
  dryRun: args.includes('--dry-run')
};

// Parsear --limit N
const limitIndex = args.indexOf('--limit');
if (limitIndex !== -1 && limitIndex + 1 < args.length) {
  options.limit = parseInt(args[limitIndex + 1], 10);
}

// Parsear --days N
const daysIndex = args.indexOf('--days');
if (daysIndex !== -1 && daysIndex + 1 < args.length) {
  options.maxDays = parseInt(args[daysIndex + 1], 10);
}

// ========================================
// MAIN FUNCTION
// ========================================

async function retryWebhooks() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 WEBHOOK RETRY COMMAND');
  console.log('='.repeat(60));

  try {
    // ========================================
    // 1. VALIDAR CONEXÃO COM SUPABASE
    // ========================================
    console.log('\n📊 Conectando ao Supabase...');

    const { data: testConnection, error: testError } = await supabase
      .from('webhook_logs')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Erro ao conectar:', testError.message);
      process.exit(1);
    }

    console.log('✅ Conexão OK');

    // ========================================
    // 2. BUSCAR WEBHOOKS PENDENTES
    // ========================================
    console.log('\n🔍 Buscando webhooks pendentes...');
    console.log(`   Critérios: status=pending|retrying, next_retry <= NOW, attempts < ${options.maxAttempts}`);

    const { data: pendingWebhooks, error: fetchError } = await supabase
      .from('webhook_logs_pending_retry')
      .select('*')
      .lte('next_retry_at', new Date().toISOString())
      .lt('attempt_count', options.maxAttempts)
      .order('next_retry_at', { ascending: true })
      .limit(options.limit);

    if (fetchError) {
      console.error('❌ Erro ao buscar webhooks:', fetchError.message);
      process.exit(1);
    }

    console.log(`✅ Encontrados: ${pendingWebhooks?.length || 0} webhooks`);

    // ========================================
    // 3. VALIDAR SE HÁ WEBHOOKS
    // ========================================
    if (!pendingWebhooks || pendingWebhooks.length === 0) {
      console.log('\n✅ Nenhum webhook pendente para reprocessar');
      console.log('═'.repeat(60) + '\n');
      process.exit(0);
    }

    // ========================================
    // 4. REPROCESSAR WEBHOOKS
    // ========================================
    console.log(`\n⚙️  Reprocessando ${pendingWebhooks.length} webhooks...\n`);

    let successCount = 0;
    let failCount = 0;

    for (const webhookLog of pendingWebhooks) {
      const {
        id,
        event_type,
        payload,
        signature,
        attempt_count,
        customer_email
      } = webhookLog;

      // Mostrar status do webhook
      const logPrefix = `   [${attempt_count + 1}/${options.maxAttempts}] ${event_type}`;
      if (options.verbose) {
        console.log(`${logPrefix} (ID: ${id}, Email: ${customer_email})`);
      } else {
        console.log(logPrefix);
      }

      // Dry-run: não processar realmente
      if (options.dryRun) {
        console.log(`      → DRY-RUN: seria reprocessado`);
        successCount++;
        continue;
      }

      // Tentar reprocessar
      try {
        await processKiwifyEvent(payload, signature);
        console.log(`      ✅ Sucesso`);
        successCount++;
      } catch (error) {
        console.log(`      ❌ Erro: ${error.message}`);
        failCount++;

        // Log detalhado em verbose mode
        if (options.verbose) {
          console.log(`         Stack: ${error.stack}`);
        }
      }
    }

    // ========================================
    // 5. SUMÁRIO FINAL
    // ========================================
    console.log('\n' + '─'.repeat(60));
    console.log('📊 SUMÁRIO:');
    console.log('─'.repeat(60));
    console.log(`  Total processado: ${pendingWebhooks.length}`);
    console.log(`  ✅ Sucesso:       ${successCount}`);
    console.log(`  ❌ Falhas:        ${failCount}`);

    if (options.dryRun) {
      console.log(`\n  ℹ️  Modo DRY-RUN: nenhum webhook foi realmente processado`);
    }

    console.log('═'.repeat(60) + '\n');

    // ========================================
    // 6. EXIT STATUS
    // ========================================
    if (failCount > 0) {
      console.log(`⚠️  ${failCount} webhooks falharam. Execute novamente em alguns minutos.`);
      process.exit(1);
    } else {
      console.log('✅ Todos os webhooks foram reprocessados com sucesso!');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Erro não previsto:', error.message);
    logger.error('[RETRY-WEBHOOKS] Erro não previsto', { error });
    process.exit(1);
  }
}

// ========================================
// HELP MESSAGE
// ========================================

function showHelp() {
  console.log(`
🔄 WEBHOOK RETRY COMMAND
Usage: npm run retry:webhooks [OPTIONS]

OPTIONS:
  --limit N        Máximo de webhooks para reprocessar (default: ${DEFAULTS.limit})
  --days N         Ignorar webhooks com mais de N dias (default: ${DEFAULTS.maxDays})
  --dry-run        Simular sem processar realmente
  --verbose        Mostrar detalhes de cada webhook
  --help           Mostrar esta mensagem

EXEMPLOS:
  # Reprocessar até 10 webhooks pendentes
  npm run retry:webhooks

  # Reprocessar até 5 webhooks
  npm run retry:webhooks -- --limit 5

  # Simular sem processar (dry-run)
  npm run retry:webhooks -- --dry-run

  # Modo verbose com detalhes
  npm run retry:webhooks -- --verbose

  # Combinar opções
  npm run retry:webhooks -- --limit 5 --dry-run --verbose

OBSERVAÇÕES:
  • Webhooks só são reprocessados se: status=pending|retrying E next_retry <= NOW
  • Máximo de tentativas: ${DEFAULTS.maxAttempts} (depois vai para 'failed' permanente)
  • Para reprocessar manualmente webhooks antigos, use banco SQL:
    UPDATE webhook_logs
    SET status='retrying', next_retry_at=NOW()
    WHERE event_type='order.approved' AND status='failed';

REFERÊNCIA:
  • Story: P0.3-kiwify-webhooks.md
  • View: webhook_logs_pending_retry
  • View: webhook_logs_recent_errors
  `);
}

// ========================================
// EXECUTAR
// ========================================

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

retryWebhooks();
