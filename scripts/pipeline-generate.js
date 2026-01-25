require('dotenv').config();
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Config
const INPUT_DIR = path.join(__dirname, '../content-pipeline/1-inputs');
const DRAFTS_DIR = path.join(__dirname, '../content-pipeline/2-drafts');
const ARCHIVE_DIR = path.join(__dirname, '../content-pipeline/5-archived');
const LOG_DIR = path.join(__dirname, '../content-pipeline/logs');

// Ensure Log Dir
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Logger Setup
const logFile = path.join(LOG_DIR, `${new Date().toISOString().split('T')[0]}.log`);
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(message);
}

// Utils
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function callWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      log(`⚠️  Tentativa ${i + 1} falhou, aguardando... (${error.message})`);
      await sleep(2000 * (i + 1)); // Backoff exponencial
    }
  }
}

// Prompts de Sistema por Módulo
const PROMPTS = {
  'CONCEITUALIZACAO': `Você é um gerador de casos para CONCEITUALIZAÇÃO COGNITIVA (TCC).
OBJETIVO: Criar casos ricos (300+ palavras) focados em identificar Trio Cognitivo, Crenças e Comportamentos.
SAÍDA: JSON com campos 'conceptualization_data' detalhados.

FORMATO JSON:
{
  "case_title": "Título",
  "disorder": "Diagnóstico",
  "difficulty_level": "basic|intermediate|advanced",
  "moment_type": "conceptualization",
  "vignette": "Texto narrativo completo...",
  "case_content": { ... },
  "expert_choice": "Explicação...",
  "learning_point": { ... }
}`,

  'DESAFIOS': `Você é um gerador de MICRO-MOMENTOS CLÍNICOS (Desafios).
OBJETIVO: Criar diálogos curtos e tensos que exigem decisão rápida do terapeuta.
SAÍDA: JSON com 'decision_point', 'options' (A-D) e 'expert_reasoning'.

FORMATO JSON:
{
  "moment_type": "desafio_clinico",
  "context": { ... },
  "critical_moment": { "dialogue": "..." },
  "decision_point": "O que fazer?",
  "options": [ { "letter": "A", "response": "..." } ],
  "expert_choice": "A",
  "expert_reasoning": { ... }
}`,

  'RADAR': `Você é um gerador de casos para DIAGNÓSTICO DIFERENCIAL (Radar).
OBJETIVO: Criar casos com sintomas ambíguos para treinar precisão diagnóstica.
SAÍDA: JSON com 'diagnostic_hints', 'rule_outs' e 'correct_diagnosis' justificado.`,

  'JORNADA': `Você é um gerador de SÉRIES LONGITUDINAIS (Jornada).
OBJETIVO: Criar episódios sequenciais do MESMO paciente.
SAÍDA: JSON com 'episode_number', 'evolution_since_last' e 'session_context'.`
};

const DEFAULT_MODULE = 'CONCEITUALIZACAO';

// Stats
const stats = {
  total: 0,
  aprovados: 0,
  erros: 0,
  tokens: 0,
  startTime: Date.now()
};

async function main() {
  log('🚀 Iniciando Pipeline de Geração de Casos (Enhanced)...');

  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`❌ Diretório de entrada não encontrado: ${INPUT_DIR}`);
    return;
  }

  const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.md') || f.endsWith('.txt'));

  if (files.length === 0) {
    log('⚠️  Nenhum arquivo encontrado em content-pipeline/1-inputs/');
    return;
  }

  log(`📂 Encontrados ${files.length} arquivos para processar.`);

  // Process in Batch
  await processarEmBatch(files, 3); // Batch size 3

  printStats();
}

async function processarEmBatch(files, batchSize = 3) {
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);

    log(`\n📦 Processando batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)}`);

    await Promise.all(
      batch.map(file => processFile(file))
    );

    if (i + batchSize < files.length) {
      log('⏸️  Aguardando 2s antes do próximo batch...');
      await sleep(2000);
    }
  }
}

function validarEstruturaCaso(caso) {
  const erros = [];
  if (!caso.case_title && !caso.moment_type) erros.push('Falta case_title ou moment_type');
  // Adicione mais validações conforme necessidade
  return erros;
}

async function processFile(filename) {
  const filePath = path.join(INPUT_DIR, filename);
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    log(`❌ Erro ao ler arquivo ${filename}: ${e.message}`);
    stats.erros++;
    return;
  }

  const moduleMatch = content.match(/MODULO:\s*([A-Z_]+)/i);
  const moduleKey = moduleMatch ? moduleMatch[1].toUpperCase().trim() : DEFAULT_MODULE;
  const systemPrompt = PROMPTS[moduleKey] || PROMPTS[DEFAULT_MODULE];

  log(`📄 Processando: ${filename} (Módulo: ${moduleKey})...`);

  const blocks = splitIntoBlocks(content);
  log(`   🔸 ${filename}: ${blocks.length} blocos.`);

  for (let i = 0; i < blocks.length; i++) {
    const blockContent = blocks[i];
    const blockId = `${filename.replace('.md', '')}_block_${i + 1}`;
    stats.total++;

    try {
      const completion = await callWithRetry(() =>
        openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `INPUT DE CONTEÚDO:\n\n${blockContent}` }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7
        })
      );

      stats.tokens += completion.usage?.total_tokens || 0;
      const jsonResult = JSON.parse(completion.choices[0].message.content);

      // Validação
      const errosValidacao = validarEstruturaCaso(jsonResult);
      if (errosValidacao.length > 0) {
        log(`   ❌ Caso inválido (${blockId}): ${errosValidacao.join(', ')}`);
        stats.erros++;
        continue;
      }

      jsonResult.created_by = 'smart_pipeline';
      jsonResult.pipeline_metadata = {
        source_file: filename,
        generated_at: new Date().toISOString(),
        block_index: i,
        module: moduleKey
      };

      const outFilename = `${blockId}.json`;
      const outPath = path.join(DRAFTS_DIR, outFilename);
      fs.writeFileSync(outPath, JSON.stringify(jsonResult, null, 2));

      log(`      ✅ Gerado: 2-drafts/${outFilename}`);
      stats.aprovados++;

    } catch (err) {
      log(`      ❌ Erro bloco ${i + 1} de ${filename}: ${err.message}`);
      stats.erros++;
    }
  }

  // Move to Archive
  try {
    const archivePath = path.join(ARCHIVE_DIR, filename);
    fs.renameSync(filePath, archivePath);
    log(`   📦 Arquivado: ${filename}`);
  } catch (e) {
    log(`   ⚠️  Erro ao arquivar ${filename}: ${e.message}`);
  }
}

function splitIntoBlocks(text) {
  const parts = text.split(/(?=### CASO|BLOCO:)/g).filter(p => p.trim().length > 50);
  if (parts.length === 0) return [text];
  return parts;
}

function printStats() {
  log('\n📊 ESTATÍSTICAS DA GERAÇÃO:');
  log(`Total processado (blocos): ${stats.total}`);
  log(`✅ Sucessos: ${stats.aprovados} (${stats.total ? (stats.aprovados / stats.total * 100).toFixed(1) : 0}%)`);
  log(`❌ Falhas: ${stats.erros}`);
  log(`💰 Tokens usados: ~${stats.tokens}`);
  log(`⏱️  Tempo total: ${((Date.now() - stats.startTime) / 1000).toFixed(1)}s`);
}

main();
