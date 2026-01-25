require('dotenv').config();
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Config
const DRAFTS_DIR = path.join(__dirname, '../content-pipeline/2-drafts');
const REJECTED_DIR = path.join(__dirname, '../content-pipeline/2-drafts/rejected');
const REVIEW_DIR = path.join(__dirname, '../content-pipeline/3-review');
const LOG_DIR = path.join(__dirname, '../content-pipeline/logs');

// Ensure Dirs
[REJECTED_DIR, REVIEW_DIR, LOG_DIR].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Logger
const logFile = path.join(LOG_DIR, `REVIEW-${new Date().toISOString().split('T')[0]}.log`);
function log(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
    console.log(message);
}

// Stats
const stats = { total: 0, aprovados: 0, rejeitados: 0, tokens: 0 };

const REVIEW_PROMPT = `Você é um SUPERVISOR CLÍNICO SÊNIOR (PhD) especializado em TCC.
AVALIE ESTE CASO CLÍNICO COM RIGOR MÁXIMO.

CRITÉRIOS DE APROVAÇÃO (TODOS devem ser atendidos):

1. **Realismo Clínico** (0-10):
   - Apresentação do paciente é verossímil?
   - Histórico coerente com quadro atual?
   - Linguagem apropriada para idade/contexto?

2. **Precisão Diagnóstica/Teórica** (0-10):
   - Sintomas alinhados com critérios DSM-5-TR?
   - Conceituação (se houver) respeita modelo de Beck/Clark?

3. **Qualidade Pedagógica** (0-10):
   - O caso ensina algo claro?
   - Se for múltipla escolha, os distratores são inteligentes?

4. **Ética e Segurança** (0-10):
   - Risco de iatrogenia? (Nota baixa aqui VETA o caso)
   - Respeita diversidade e evita estigmas?

IMPORTANTE: 
- Seja EXTREMAMENTE CRÍTICO.
- Nota mínima para aprovação: 8/10 em MÉDIA, mas NENHUM critério pode ser < 6.
- Ética < 8 reprova imediatamente.

RESPONDA EM JSON:
{
  "aprovado": true, // ou false
  "notas": {
    "realismo": 0,
    "teoria": 0,
    "pedagogia": 0,
    "etica": 0
  },
  "feedback_detalhado": "Análise crítica...",
  "sugestoes_melhoria": ["..."]
}`;

async function main() {
    log('🩺 Iniciando Auditoria Científica (Reviewer Agent)...');

    if (!fs.existsSync(DRAFTS_DIR)) {
        console.error(`❌ Drafts dir not found`);
        return;
    }

    const files = fs.readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.json'));

    if (files.length === 0) {
        log('⚠️  Nenhum caso pendente em 2-drafts.');
        return;
    }

    log(`📂 Encontrados ${files.length} casos para auditar.\n`);

    for (const file of files) {
        await auditCase(file);
    }

    log('\n=====================================');
    log(`📊 RESUMO AUDITORIA:`);
    log(`   ✅ Aprovados: ${stats.aprovados}`);
    log(`   🚫 Rejeitados: ${stats.rejeitados}`);
    log('=====================================');
}

async function auditCase(filename) {
    const filePath = path.join(DRAFTS_DIR, filename);
    let content, caseJson;

    try {
        content = fs.readFileSync(filePath, 'utf-8');
        caseJson = JSON.parse(content);
    } catch (e) {
        log(`❌ Erro ao ler JSON ${filename}: ${e.message}`);
        return;
    }

    log(`🔍 Auditando: ${filename} (${caseJson.moment_type || 'Geral'})...`);
    stats.total++;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: REVIEW_PROMPT },
                { role: "user", content: `CASO:\n\n${JSON.stringify(caseJson, null, 2)}` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2
        });

        stats.tokens += completion.usage?.total_tokens || 0;
        const reviewResult = JSON.parse(completion.choices[0].message.content);

        // Anexar feedback
        caseJson.ai_peer_review = reviewResult;

        if (reviewResult.aprovado) {
            log(`   ✅ APROVADO (Notas: R:${reviewResult.notas.realismo} T:${reviewResult.notas.teoria} P:${reviewResult.notas.pedagogia})`);

            const outPath = path.join(REVIEW_DIR, filename);
            fs.writeFileSync(outPath, JSON.stringify(caseJson, null, 2));
            fs.unlinkSync(filePath);
            stats.aprovados++;

        } else {
            log(`   🚫 REJEITADO (Motivo: ${reviewResult.feedback_detalhado.substring(0, 100)}...)`);

            const outPath = path.join(REJECTED_DIR, filename);
            fs.writeFileSync(outPath, JSON.stringify(caseJson, null, 2));
            fs.unlinkSync(filePath);
            stats.rejeitados++;
        }

    } catch (err) {
        log(`   ❌ Erro na auditoria de ${filename}: ${err.message}`);
    }
}

main();
