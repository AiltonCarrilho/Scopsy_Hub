# 🤖 SISTEMA DE AUTOMAÇÃO: GERAÇÃO E VALIDAÇÃO DE CASOS CLÍNICOS

**Data:** 05/01/2026
**Versão:** 1.0
**Projeto:** Scopsy - Plataforma de Treinamento Clínico
**Objetivo:** Automatizar pipeline completo de criação, validação e população de casos clínicos usando OpenAI Assistants API

---

## 📚 ÍNDICE

1. [Contexto do Projeto](#contexto)
2. [Visão Geral do Sistema](#visao-geral)
3. [Arquitetura do Pipeline](#arquitetura)
4. [Fluxo Detalhado Caso a Caso](#fluxo)
5. [Estrutura de Código](#estrutura)
6. [Implementação Completa](#implementacao)
7. [Como Executar](#execucao)
8. [Monitoramento e Logs](#monitoramento)
9. [Tratamento de Erros](#erros)
10. [Custos e Performance](#custos)

---

## 🎯 CONTEXTO DO PROJETO {#contexto}

### O Que É o Scopsy

**Scopsy** é uma plataforma SaaS de treinamento clínico para psicólogos através de casos simulados com feedback formativo. Um dos módulos principais é **Desafios Clínicos (Micro-Momentos)**, que treina tomada de decisão em momentos críticos de 30-60 segundos.

### Módulo: Desafios Clínicos

**Propósito:** Treinar psicólogos em momentos críticos da terapia
**Formato:** Casos clínicos de múltipla escolha com feedback estruturado em 3 camadas
**Abordagens:** TCC (Terapia Cognitivo-Comportamental), ACT, DBT

**6 Tipos de Micro-Momentos:**
1. `ruptura_alianca` - Ruptura na Aliança Terapêutica
2. `revelacao_dificil` - Revelação Sensível
3. `resistencia_tecnica` - Resistência a Técnica
4. `intervencao_crucial` - Momento de Intervenção Chave
5. `dilema_etico` - Dilema Ético
6. `tecnica_oportuna` - Timing de Técnica

**3 Níveis de Dificuldade:**
- `basic` - Conceitos introdutórios, resposta clara
- `intermediate` - Nuances clínicas, requer raciocínio
- `advanced` - Ambiguidade genuína, múltiplas perspectivas legítimas

### Stack Técnico

- **Backend:** Node.js + Express
- **Database:** Supabase (PostgreSQL)
- **IA:** OpenAI Assistants API (gpt-4-turbo-preview)
- **Logging:** Winston

### Schema do Banco de Dados

**Tabela: `cases`**
```sql
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Metadados
  disorder TEXT NOT NULL,              -- Ex: "TAG", "Depressão"
  difficulty_level TEXT NOT NULL,      -- 'basic', 'intermediate', 'advanced'
  moment_type TEXT NOT NULL,           -- Um dos 6 tipos acima

  -- Conteúdo (JSON completo do caso)
  case_content JSONB NOT NULL,

  -- Validação e qualidade
  status TEXT DEFAULT 'pending',       -- 'pending', 'active', 'archived'
  quality_score DECIMAL(3,2),          -- 0-5 (calculado após uso)

  -- Métricas de uso
  times_used INT DEFAULT 0,
  times_correct INT DEFAULT 0,
  times_incorrect INT DEFAULT 0,

  -- Auditoria
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Campo `case_content` (JSONB):**
```json
{
  "moment_type": "ruptura_alianca",
  "difficulty_level": "basic",
  "concept_key": "resistencia_tecnica_exploracao_colaborativa",
  "skills_trained": ["alianca_terapeutica", "validacao_emocional"],

  "context": {
    "session_number": "Sessão 5",
    "client_name": "João Silva",
    "client_age": 35,
    "diagnosis": "TAG",
    "what_just_happened": "Terapeuta sugeriu registro de pensamentos..."
  },

  "critical_moment": {
    "dialogue": "Cliente: 'Eu tentei isso antes e não funcionou...'",
    "non_verbal": "Cruza braços, desvia olhar",
    "emotional_tone": "Desconfiança e frustração"
  },

  "decision_point": "O QUE VOCÊ DIZ/FAZ AGORA?",

  "options": [
    {"letter": "A", "response": "...", "approach": "Validação + Exploração"},
    {"letter": "B", "response": "...", "approach": "Normalização"},
    {"letter": "C", "response": "...", "approach": "Mudança de Abordagem"},
    {"letter": "D", "response": "...", "approach": "Insistência Técnica"}
  ],

  "expert_choice": "A",

  "expert_reasoning": {
    "why_this_works": "...",
    "why_others_fail": {"option_B": "...", "option_C": "...", "option_D": "..."},
    "core_principle": "Aliança > Técnica",
    "what_happens_next": "..."
  },

  "theoretical_depth": {
    "key_references": ["Beck, J. S. (2011). Cognitive Behavior Therapy...", "..."],
    "related_concepts": ["Aliança terapêutica", "Resistência"],
    "clinical_nuance": "Texto rico com conceitos fundamentados..."
  },

  "learning_point": {
    "pattern_to_recognize": "...",
    "instant_response": "...",
    "common_mistake": "..."
  }
}
```

---

## 🔄 VISÃO GERAL DO SISTEMA {#visao-geral}

### Objetivo

Criar um sistema automatizado que:
1. **Gera** casos clínicos de alta qualidade
2. **Valida** tecnicamente (estrutura, consistência)
3. **Valida** clinicamente (precisão teórica, ética)
4. **Popula** no banco de dados
5. **Substitui** casos rejeitados automaticamente
6. **Monitora** qualidade e taxa de aprovação

### Fluxo Macro

```
┌─────────────────────────────────────────────────────────┐
│  ENTRADA: Especificação do lote                         │
│  Ex: 6 casos (1 de cada tipo), níveis variados          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  PROCESSAMENTO CASO A CASO (não em lote!)               │
│                                                          │
│  Para cada caso:                                         │
│    1. Gerar (Assistant 1)                                │
│    2. Validar Técnica (Assistant 2)                      │
│       └─ Se REJEITADO → voltar ao passo 1 (substituto) │
│       └─ Se REALOCADO (ex: advanced→intermediate)       │
│          → voltar ao passo 1 com novo nível             │
│    3. Validar Clínica (Assistant 3)                      │
│       └─ Se REJEITADO → voltar ao passo 1 (substituto) │
│       └─ Se ESCALADO → marcar para revisão humana       │
│    4. Inserir no banco (status: pending)                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  SAÍDA: Lote completo de casos aprovados                │
│  + Relatório de processamento                            │
│  + Métricas (taxa aprovação, tempo, tentativas)          │
└─────────────────────────────────────────────────────────┘
```

### Diferencial: Processamento Individual

**❌ NÃO fazer (batch ingênuo):**
```javascript
// ERRADO: Gerar 6 → Validar 6 → Se 2 rejeitados, não há substitutos
const cases = await generateAll(6);
const validatedCases = await validateAll(cases);
// Problema: Se 2 foram rejeitados, ficamos com 4 casos apenas
```

**✅ FAZER (caso a caso com retry):**
```javascript
// CORRETO: Cada caso passa por pipeline completo individualmente
for (let i = 0; i < 6; i++) {
  let approved = false;
  let attempts = 0;

  while (!approved && attempts < 3) {
    const caso = await generate(spec);
    const techReview = await validateTechnical(caso);

    if (techReview.rejected) {
      attempts++;
      continue; // Tenta gerar novo caso
    }

    if (techReview.reallocated) {
      spec.level = techReview.newLevel; // Ajusta nível
      attempts++;
      continue;
    }

    const clinicalReview = await validateClinical(caso);

    if (clinicalReview.approved) {
      await insertDatabase(caso);
      approved = true;
    } else {
      attempts++;
    }
  }
}
```

---

## 🏗️ ARQUITETURA DO PIPELINE {#arquitetura}

### Componentes Principais

```
┌────────────────────────────────────────────────────────────────┐
│  APLICAÇÃO NODE.JS                                             │
│  (Nova pasta: scopsy-case-automation/)                         │
└────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ OpenAI           │  │ Supabase         │  │ Sistema de Logs  │
│ Assistants API   │  │ (PostgreSQL)     │  │ (Winston)        │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ Assistant 1      │  │ Tabela: cases    │  │ - pipeline.log   │
│ (Gerador)        │  │                  │  │ - errors.log     │
│                  │  │ - case_content   │  │ - metrics.log    │
│ Assistant 2      │  │ - status         │  │                  │
│ (Revisor Técnico)│  │ - created_by     │  │ Dashboard stats  │
│                  │  │                  │  │ em tempo real    │
│ Assistant 3      │  │ Revisão humana   │  │                  │
│ (Revisor Clínico)│  │ aprova depois    │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### 3 Assistants OpenAI

**Assistant 1: Gerador de Casos**
- **Função:** Criar casos clínicos ricos e estruturados
- **Input:** Especificação (tipo, nível, transtorno)
- **Output:** JSON completo do caso
- **Temperature:** 0.85 (criatividade moderada-alta)
- **Instruções:** `GPT_1_GERADOR_INSTRUCOES.md` (2000+ linhas)

**Assistant 2: Revisor Técnico**
- **Função:** Validar estrutura, consistência, critérios pedagógicos
- **Input:** JSON do caso
- **Output:** Status (APROVADO / AJUSTES / REJEITADO / REALOCADO)
- **Temperature:** 0.3 (rigor, consistência)
- **Instruções:** `GPT_2_REVISOR_TECNICO_INSTRUCOES.md` (1500+ linhas)

**Assistant 3: Revisor Clínico**
- **Função:** Validar precisão clínica, citações, ética
- **Input:** JSON do caso aprovado tecnicamente
- **Output:** Status (APROVADO / AJUSTES / REJEITADO / ESCALADO)
- **Temperature:** 0.4 (rigor + flexibilidade)
- **Instruções:** `GPT_3_REVISOR_CLINICO_INSTRUCOES.md` (2000+ linhas)

---

## 🔄 FLUXO DETALHADO CASO A CASO {#fluxo}

### Diagrama de Estado de Um Caso

```
                  [INÍCIO]
                     │
                     ▼
          ┌──────────────────┐
          │  GERAR CASO      │
          │  (Assistant 1)   │
          └──────────────────┘
                     │
                     ▼
          ┌──────────────────┐
          │ VALIDAR TÉCNICA  │
          │  (Assistant 2)   │
          └──────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    [APROVADO]  [REJEITADO]  [REALOCADO]
        │            │            │
        │            └────────────┴─────► [Volta ao GERAR]
        │                                  (tentativa++)
        ▼
  ┌──────────────────┐
  │ VALIDAR CLÍNICA  │
  │  (Assistant 3)   │
  └──────────────────┘
        │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    [APROVADO]  [REJEITADO]  [ESCALADO]
        │            │            │
        │            └────────────┴─────► [Volta ao GERAR]
        │                                  (tentativa++)
        ▼
  ┌──────────────────┐
  │ INSERIR NO BANCO │
  │ (status:pending) │
  └──────────────────┘
        │
        ▼
     [FIM]
```

### Estados Possíveis

**Após Validação Técnica (Assistant 2):**
- ✅ **APROVADO:** Passa para validação clínica
- ⚠️ **AJUSTES MENORES:** Corrige automaticamente + passa para clínica
- ❌ **REJEITADO:** Gera novo caso (tentativa++)
- 🔄 **REALOCADO:** Gera novo caso com nível ajustado (ex: advanced → intermediate)

**Após Validação Clínica (Assistant 3):**
- ✅ **APROVADO:** Insere no banco
- ⚠️ **AJUSTES MENORES:** Corrige automaticamente + insere no banco
- ❌ **REJEITADO:** Gera novo caso (tentativa++)
- ❓ **ESCALADO:** Insere no banco com flag `needs_human_review`

### Lógica de Retry

**Limite de tentativas:** 3 por caso

```javascript
const MAX_ATTEMPTS = 3;

async function processCase(spec) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // 1. GERAR
      const caso = await generateCase(spec);

      // 2. VALIDAR TÉCNICA
      const techReview = await validateTechnical(caso);

      if (techReview.status === 'REJECTED') {
        logger.warn(`Caso rejeitado tecnicamente (tentativa ${attempt})`, {
          reason: techReview.reason
        });
        continue; // Tenta novamente
      }

      if (techReview.status === 'REALLOCATED') {
        logger.info(`Caso realocado: ${spec.level} → ${techReview.newLevel}`);
        spec.level = techReview.newLevel; // Ajusta spec
        continue; // Tenta novamente com novo nível
      }

      // Aplicar ajustes menores se necessário
      if (techReview.status === 'MINOR_FIXES') {
        caso = applyFixes(caso, techReview.fixes);
      }

      // 3. VALIDAR CLÍNICA
      const clinicalReview = await validateClinical(caso);

      if (clinicalReview.status === 'REJECTED') {
        logger.warn(`Caso rejeitado clinicamente (tentativa ${attempt})`, {
          reason: clinicalReview.reason
        });
        continue; // Tenta novamente
      }

      // Aplicar ajustes menores se necessário
      if (clinicalReview.status === 'MINOR_FIXES') {
        caso = applyFixes(caso, clinicalReview.fixes);
      }

      // Marcar se foi escalado
      if (clinicalReview.status === 'ESCALATED') {
        caso._needsHumanReview = true;
        caso._escalationReason = clinicalReview.reason;
      }

      // 4. INSERIR NO BANCO
      const inserted = await insertCase(caso);

      logger.info(`✅ Caso aprovado e inserido (tentativa ${attempt})`, {
        id: inserted.id,
        type: spec.type,
        level: spec.level
      });

      return inserted; // SUCESSO

    } catch (error) {
      logger.error(`Erro na tentativa ${attempt}`, { error });
      if (attempt === MAX_ATTEMPTS) throw error;
    }
  }

  // Se chegou aqui, esgotou tentativas
  throw new Error(`Falha ao gerar caso após ${MAX_ATTEMPTS} tentativas`);
}
```

---

## 📁 ESTRUTURA DE CÓDIGO {#estrutura}

### Estrutura de Pastas

```
scopsy-case-automation/              ← NOVA PASTA (criar)
├── src/
│   ├── config/
│   │   ├── openai.js                ← Config OpenAI SDK
│   │   ├── supabase.js              ← Config Supabase client
│   │   └── logger.js                ← Config Winston
│   │
│   ├── services/
│   │   ├── assistants.js            ← Gerenciar Assistants API
│   │   ├── generator.js             ← Geração de casos (Assistant 1)
│   │   ├── technical-reviewer.js    ← Validação técnica (Assistant 2)
│   │   ├── clinical-reviewer.js     ← Validação clínica (Assistant 3)
│   │   └── database.js              ← Inserção no banco
│   │
│   ├── pipeline/
│   │   ├── process-case.js          ← Pipeline individual (1 caso)
│   │   ├── process-batch.js         ← Pipeline lote (N casos)
│   │   └── retry-logic.js           ← Lógica de retry
│   │
│   ├── utils/
│   │   ├── json-parser.js           ← Parsear JSON dos Assistants
│   │   ├── validators.js            ← Validações auxiliares
│   │   └── metrics.js               ← Coleta de métricas
│   │
│   └── scripts/
│       ├── create-assistants.js     ← Criar Assistants (rodar 1x)
│       ├── generate-batch.js        ← Gerar lote de casos
│       └── check-status.js          ← Verificar status do pipeline
│
├── docs/
│   ├── GPT_1_GERADOR_INSTRUCOES.md
│   ├── GPT_2_REVISOR_TECNICO_INSTRUCOES.md
│   └── GPT_3_REVISOR_CLINICO_INSTRUCOES.md
│
├── logs/
│   ├── pipeline.log                 ← Logs gerais
│   ├── errors.log                   ← Apenas erros
│   └── metrics.log                  ← Métricas (tempo, taxa aprovação)
│
├── .env                             ← Variáveis de ambiente
├── .gitignore
├── package.json
└── README.md
```

---

## 💻 IMPLEMENTAÇÃO COMPLETA {#implementacao}

### 1. Setup do Projeto

**Criar pasta:**
```bash
mkdir scopsy-case-automation
cd scopsy-case-automation
npm init -y
```

**Instalar dependências:**
```bash
npm install openai @supabase/supabase-js winston dotenv
```

**Criar `.env`:**
```env
# OpenAI
OPENAI_API_KEY=sk-proj-...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Assistants (serão preenchidos após criar)
ASSISTANT_GENERATOR_ID=
ASSISTANT_TECHNICAL_REVIEWER_ID=
ASSISTANT_CLINICAL_REVIEWER_ID=

# Config
MAX_RETRY_ATTEMPTS=3
NODE_ENV=development
```

---

### 2. Configuração Base

**`src/config/openai.js`:**
```javascript
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = { openai };
```

**`src/config/supabase.js`:**
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = { supabase };
```

**`src/config/logger.js`:**
```javascript
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Arquivo: todos os logs
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/pipeline.log'),
      level: 'info'
    }),
    // Arquivo: apenas erros
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/errors.log'),
      level: 'error'
    })
  ]
});

module.exports = { logger };
```

---

### 3. Criar Assistants (Rodar 1x)

**`src/scripts/create-assistants.js`:**
```javascript
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { openai } = require('../config/openai');
const { logger } = require('../config/logger');

async function createAssistants() {
  logger.info('🚀 Criando Assistants OpenAI...');

  try {
    // 1. LER INSTRUÇÕES DOS ARQUIVOS
    const docsPath = path.join(__dirname, '../../docs');

    const instructions1 = fs.readFileSync(
      path.join(docsPath, 'GPT_1_GERADOR_INSTRUCOES.md'),
      'utf-8'
    );

    const instructions2 = fs.readFileSync(
      path.join(docsPath, 'GPT_2_REVISOR_TECNICO_INSTRUCOES.md'),
      'utf-8'
    );

    const instructions3 = fs.readFileSync(
      path.join(docsPath, 'GPT_3_REVISOR_CLINICO_INSTRUCOES.md'),
      'utf-8'
    );

    // 2. CRIAR ASSISTANT 1 (GERADOR)
    logger.info('📝 Criando Assistant 1 (Gerador)...');
    const assistant1 = await openai.beta.assistants.create({
      name: "Scopsy Case Generator",
      description: "Generates clinical micro-moment cases",
      instructions: instructions1,
      model: "gpt-4-turbo-preview",
      tools: [{ type: "code_interpreter" }],
      temperature: 0.85
    });
    logger.info(`✅ Assistant 1 criado: ${assistant1.id}`);

    // 3. CRIAR ASSISTANT 2 (REVISOR TÉCNICO)
    logger.info('🔍 Criando Assistant 2 (Revisor Técnico)...');
    const assistant2 = await openai.beta.assistants.create({
      name: "Scopsy Technical Reviewer",
      description: "Validates structure and technical quality",
      instructions: instructions2,
      model: "gpt-4-turbo-preview",
      tools: [{ type: "code_interpreter" }],
      temperature: 0.3
    });
    logger.info(`✅ Assistant 2 criado: ${assistant2.id}`);

    // 4. CRIAR ASSISTANT 3 (REVISOR CLÍNICO)
    logger.info('🩺 Criando Assistant 3 (Revisor Clínico)...');
    const assistant3 = await openai.beta.assistants.create({
      name: "Scopsy Clinical Reviewer",
      description: "Validates clinical accuracy and ethics",
      instructions: instructions3,
      model: "gpt-4-turbo-preview",
      tools: [{ type: "code_interpreter" }],
      temperature: 0.4
    });
    logger.info(`✅ Assistant 3 criado: ${assistant3.id}`);

    // 5. SALVAR IDs EM .ENV
    const envConfig = `
# Assistants IDs (gerados em ${new Date().toISOString()})
ASSISTANT_GENERATOR_ID=${assistant1.id}
ASSISTANT_TECHNICAL_REVIEWER_ID=${assistant2.id}
ASSISTANT_CLINICAL_REVIEWER_ID=${assistant3.id}
`;

    const envPath = path.join(__dirname, '../../.env');
    fs.appendFileSync(envPath, envConfig);

    logger.info('✅ IDs salvos em .env');
    logger.info('\n🎉 Todos os Assistants criados com sucesso!');
    logger.info('\nPróximo passo: node src/scripts/generate-batch.js');

  } catch (error) {
    logger.error('❌ Erro ao criar Assistants', { error: error.message });
    throw error;
  }
}

createAssistants();
```

**Rodar:**
```bash
node src/scripts/create-assistants.js
```

---

### 4. Services: Comunicação com Assistants

**`src/services/assistants.js`:**
```javascript
const { openai } = require('../config/openai');
const { logger } = require('../config/logger');

/**
 * Enviar mensagem para Assistant e aguardar resposta
 */
async function sendMessageToAssistant(assistantId, message, context = {}) {
  try {
    // 1. Criar thread
    const thread = await openai.beta.threads.create();

    // 2. Adicionar mensagem
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message
    });

    // 3. Executar run
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId
    });

    // 4. Aguardar conclusão (polling)
    const result = await pollRunUntilComplete(thread.id, run.id);

    return result;

  } catch (error) {
    logger.error('Erro ao comunicar com Assistant', {
      assistantId,
      error: error.message,
      context
    });
    throw error;
  }
}

/**
 * Poll até run completar (timeout: 2 minutos)
 */
async function pollRunUntilComplete(threadId, runId, maxAttempts = 60) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const run = await openai.beta.threads.runs.retrieve(threadId, runId);

    if (run.status === 'completed') {
      // Buscar mensagens do thread
      const messages = await openai.beta.threads.messages.list(threadId);
      const lastMessage = messages.data[0];
      return lastMessage.content[0].text.value;
    }

    if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
      throw new Error(`Run ${run.status}: ${run.last_error?.message || 'Unknown error'}`);
    }

    // Aguardar 2 segundos antes de tentar novamente
    await sleep(2000);
  }

  throw new Error(`Timeout: Run não completou em ${maxAttempts * 2}s`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  sendMessageToAssistant,
  pollRunUntilComplete
};
```

---

**`src/services/generator.js`:**
```javascript
const { sendMessageToAssistant } = require('./assistants');
const { logger } = require('../config/logger');
const { parseJSON } = require('../utils/json-parser');

/**
 * Gerar caso clínico (Assistant 1)
 */
async function generateCase(spec) {
  const { type, level, disorder } = spec;

  logger.info('📝 Gerando caso...', { type, level, disorder });

  const prompt = `Crie 1 caso de ${type}, nível ${level}, foco em ${disorder || 'transtorno variado'}.

IMPORTANTE: Retorne APENAS o JSON completo do caso, sem texto adicional antes ou depois.`;

  const assistantId = process.env.ASSISTANT_GENERATOR_ID;
  const response = await sendMessageToAssistant(assistantId, prompt, spec);

  // Parsear JSON do response
  const caseData = parseJSON(response);

  logger.info('✅ Caso gerado', {
    type: caseData.moment_type,
    level: caseData.difficulty_level
  });

  return caseData;
}

module.exports = { generateCase };
```

---

**`src/services/technical-reviewer.js`:**
```javascript
const { sendMessageToAssistant } = require('./assistants');
const { logger } = require('../config/logger');

/**
 * Validar caso tecnicamente (Assistant 2)
 */
async function validateTechnical(caseData) {
  logger.info('🔍 Validando tecnicamente...');

  const prompt = `Faça revisão técnica completa deste caso:

${JSON.stringify(caseData, null, 2)}

IMPORTANTE: Ao final do relatório, inclua uma linha:
STATUS: [APROVADO | AJUSTES_MENORES | REJEITADO | REALOCADO]

Se REALOCADO, inclua também:
NOVO_NIVEL: [basic | intermediate | advanced]`;

  const assistantId = process.env.ASSISTANT_TECHNICAL_REVIEWER_ID;
  const response = await sendMessageToAssistant(assistantId, prompt);

  // Parsear status do relatório
  const result = parseReviewStatus(response);

  logger.info(`📊 Validação técnica: ${result.status}`, {
    problems: result.problems?.length || 0
  });

  return result;
}

/**
 * Parsear status do relatório de revisão
 */
function parseReviewStatus(reportText) {
  const statusMatch = reportText.match(/STATUS:\s*(APROVADO|AJUSTES_MENORES|REJEITADO|REALOCADO)/i);
  const status = statusMatch ? statusMatch[1].toUpperCase() : 'UNKNOWN';

  const result = {
    status,
    fullReport: reportText,
    problems: []
  };

  // Se REALOCADO, extrair novo nível
  if (status === 'REALOCADO') {
    const levelMatch = reportText.match(/NOVO_NIVEL:\s*(basic|intermediate|advanced)/i);
    result.newLevel = levelMatch ? levelMatch[1].toLowerCase() : null;
  }

  // Extrair problemas (simplificado - você pode refinar)
  if (status === 'REJEITADO' || status === 'AJUSTES_MENORES') {
    const problemMatches = reportText.match(/Problema:\s*(.+)/gi);
    if (problemMatches) {
      result.problems = problemMatches.map(m => m.replace(/Problema:\s*/i, '').trim());
    }
  }

  return result;
}

module.exports = { validateTechnical };
```

---

**`src/services/clinical-reviewer.js`:**
```javascript
const { sendMessageToAssistant } = require('./assistants');
const { logger } = require('../config/logger');

/**
 * Validar caso clinicamente (Assistant 3)
 */
async function validateClinical(caseData) {
  logger.info('🩺 Validando clinicamente...');

  const prompt = `Faça revisão clínica completa deste caso (já aprovado tecnicamente):

${JSON.stringify(caseData, null, 2)}

IMPORTANTE: Ao final do relatório, inclua uma linha:
STATUS: [APROVADO | AJUSTES_MENORES | REJEITADO | ESCALADO]`;

  const assistantId = process.env.ASSISTANT_CLINICAL_REVIEWER_ID;
  const response = await sendMessageToAssistant(assistantId, prompt);

  const result = parseReviewStatus(response);

  logger.info(`📊 Validação clínica: ${result.status}`, {
    problems: result.problems?.length || 0
  });

  return result;
}

function parseReviewStatus(reportText) {
  const statusMatch = reportText.match(/STATUS:\s*(APROVADO|AJUSTES_MENORES|REJEITADO|ESCALADO)/i);
  const status = statusMatch ? statusMatch[1].toUpperCase() : 'UNKNOWN';

  const result = {
    status,
    fullReport: reportText,
    problems: []
  };

  // Se ESCALADO, extrair razão
  if (status === 'ESCALADO') {
    const reasonMatch = reportText.match(/Razão do escalonamento:(.+)/i);
    result.escalationReason = reasonMatch ? reasonMatch[1].trim() : 'Não especificado';
  }

  // Extrair problemas
  if (status === 'REJEITADO' || status === 'AJUSTES_MENORES') {
    const problemMatches = reportText.match(/Problema:\s*(.+)/gi);
    if (problemMatches) {
      result.problems = problemMatches.map(m => m.replace(/Problema:\s*/i, '').trim());
    }
  }

  return result;
}

module.exports = { validateClinical };
```

---

**`src/services/database.js`:**
```javascript
const { supabase } = require('../config/supabase');
const { logger } = require('../config/logger');

/**
 * Inserir caso no banco
 */
async function insertCase(caseData, options = {}) {
  const { needsHumanReview = false, escalationReason = null } = options;

  logger.info('💾 Inserindo caso no banco...', {
    type: caseData.moment_type,
    level: caseData.difficulty_level
  });

  try {
    const { data, error } = await supabase
      .from('cases')
      .insert({
        disorder: caseData.context?.diagnosis || 'Unknown',
        difficulty_level: caseData.difficulty_level,
        moment_type: caseData.moment_type,
        case_content: caseData,
        status: needsHumanReview ? 'pending_review' : 'pending',
        created_by: 'assistant_pipeline_v1',
        quality_score: null,
        times_used: 0
      })
      .select()
      .single();

    if (error) throw error;

    logger.info('✅ Caso inserido', { id: data.id });

    // Se foi escalado, criar registro de revisão pendente
    if (needsHumanReview) {
      await createReviewTask(data.id, escalationReason);
    }

    return data;

  } catch (error) {
    logger.error('❌ Erro ao inserir caso', { error: error.message });
    throw error;
  }
}

/**
 * Criar tarefa de revisão humana (simplificado)
 */
async function createReviewTask(caseId, reason) {
  logger.info('📋 Criando tarefa de revisão humana', { caseId, reason });

  // Aqui você poderia criar em tabela 'review_tasks' ou enviar email
  // Por enquanto, apenas log
  logger.warn('⚠️ CASO ESCALADO PARA REVISÃO HUMANA', {
    caseId,
    reason
  });
}

module.exports = { insertCase };
```

---

### 5. Pipeline: Processamento Caso a Caso

**`src/pipeline/process-case.js`:**
```javascript
const { generateCase } = require('../services/generator');
const { validateTechnical } = require('../services/technical-reviewer');
const { validateClinical } = require('../services/clinical-reviewer');
const { insertCase } = require('../services/database');
const { logger } = require('../config/logger');

const MAX_ATTEMPTS = parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3;

/**
 * Processar 1 caso completo com retry
 */
async function processCase(spec, caseIndex) {
  const { type, level, disorder } = spec;

  logger.info(`\n${'='.repeat(60)}`);
  logger.info(`🎯 INICIANDO CASO ${caseIndex}: ${type} (${level})`);
  logger.info(`${'='.repeat(60)}\n`);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    logger.info(`🔄 Tentativa ${attempt}/${MAX_ATTEMPTS}`);

    try {
      // ============================================
      // ETAPA 1: GERAÇÃO
      // ============================================
      const startTime = Date.now();
      const caseData = await generateCase(spec);
      const genTime = Date.now() - startTime;

      logger.info(`⏱️ Geração: ${genTime}ms`);

      // ============================================
      // ETAPA 2: VALIDAÇÃO TÉCNICA
      // ============================================
      const techStart = Date.now();
      const techReview = await validateTechnical(caseData);
      const techTime = Date.now() - techStart;

      logger.info(`⏱️ Validação técnica: ${techTime}ms`);

      // TRATAMENTO: REJEITADO
      if (techReview.status === 'REJEITADO') {
        logger.warn(`❌ Caso rejeitado tecnicamente (tentativa ${attempt})`);
        logger.warn(`Problemas: ${techReview.problems.join('; ')}`);
        continue; // Tenta novamente
      }

      // TRATAMENTO: REALOCADO
      if (techReview.status === 'REALOCADO') {
        logger.info(`🔄 Caso realocado: ${spec.level} → ${techReview.newLevel}`);
        spec.level = techReview.newLevel; // Ajusta spec
        continue; // Tenta novamente com novo nível
      }

      // TRATAMENTO: AJUSTES MENORES (opcional: aplicar automaticamente)
      if (techReview.status === 'AJUSTES_MENORES') {
        logger.info('⚠️ Ajustes menores necessários (prosseguindo)');
        // Aqui você poderia implementar auto-correção
      }

      // ============================================
      // ETAPA 3: VALIDAÇÃO CLÍNICA
      // ============================================
      const clinicalStart = Date.now();
      const clinicalReview = await validateClinical(caseData);
      const clinicalTime = Date.now() - clinicalStart;

      logger.info(`⏱️ Validação clínica: ${clinicalTime}ms`);

      // TRATAMENTO: REJEITADO
      if (clinicalReview.status === 'REJEITADO') {
        logger.warn(`❌ Caso rejeitado clinicamente (tentativa ${attempt})`);
        logger.warn(`Problemas: ${clinicalReview.problems.join('; ')}`);
        continue; // Tenta novamente
      }

      // TRATAMENTO: AJUSTES MENORES
      if (clinicalReview.status === 'AJUSTES_MENORES') {
        logger.info('⚠️ Ajustes clínicos menores (prosseguindo)');
      }

      // TRATAMENTO: ESCALADO
      const needsReview = clinicalReview.status === 'ESCALADO';
      if (needsReview) {
        logger.warn('❓ Caso escalado para revisão humana');
        logger.warn(`Razão: ${clinicalReview.escalationReason}`);
      }

      // ============================================
      // ETAPA 4: INSERIR NO BANCO
      // ============================================
      const insertStart = Date.now();
      const inserted = await insertCase(caseData, {
        needsHumanReview: needsReview,
        escalationReason: clinicalReview.escalationReason
      });
      const insertTime = Date.now() - insertStart;

      logger.info(`⏱️ Inserção: ${insertTime}ms`);

      // ============================================
      // SUCESSO!
      // ============================================
      const totalTime = Date.now() - startTime;

      logger.info(`\n✅ CASO ${caseIndex} CONCLUÍDO COM SUCESSO!`);
      logger.info(`   ID: ${inserted.id}`);
      logger.info(`   Tipo: ${type} (${level})`);
      logger.info(`   Tentativas: ${attempt}`);
      logger.info(`   Tempo total: ${totalTime}ms`);
      logger.info(`   Status: ${needsReview ? 'PENDING_REVIEW' : 'PENDING'}`);

      return {
        success: true,
        caseId: inserted.id,
        attempts: attempt,
        timeMs: totalTime,
        needsReview
      };

    } catch (error) {
      logger.error(`❌ Erro na tentativa ${attempt}`, {
        error: error.message,
        stack: error.stack
      });

      if (attempt === MAX_ATTEMPTS) {
        logger.error(`❌ CASO ${caseIndex} FALHOU após ${MAX_ATTEMPTS} tentativas`);
        throw error;
      }
    }
  }

  // Não deveria chegar aqui
  throw new Error(`Falha ao processar caso após ${MAX_ATTEMPTS} tentativas`);
}

module.exports = { processCase };
```

---

**`src/pipeline/process-batch.js`:**
```javascript
const { processCase } = require('./process-case');
const { logger } = require('../config/logger');
const { recordMetrics } = require('../utils/metrics');

/**
 * Processar lote de casos (um por vez, com retry individual)
 */
async function processBatch(specs) {
  const batchStartTime = Date.now();

  logger.info(`\n${'#'.repeat(70)}`);
  logger.info(`🚀 INICIANDO LOTE: ${specs.length} casos`);
  logger.info(`${'#'.repeat(70)}\n`);

  const results = [];
  const errors = [];

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];

    try {
      const result = await processCase(spec, i + 1);
      results.push(result);
    } catch (error) {
      logger.error(`❌ Caso ${i + 1} falhou completamente`, {
        spec,
        error: error.message
      });
      errors.push({
        caseIndex: i + 1,
        spec,
        error: error.message
      });
    }
  }

  // ============================================
  // RELATÓRIO FINAL
  // ============================================
  const batchTime = Date.now() - batchStartTime;

  const summary = {
    total: specs.length,
    succeeded: results.length,
    failed: errors.length,
    totalAttempts: results.reduce((sum, r) => sum + r.attempts, 0),
    needsReview: results.filter(r => r.needsReview).length,
    totalTimeMs: batchTime,
    avgTimePerCase: Math.round(batchTime / specs.length)
  };

  logger.info(`\n${'#'.repeat(70)}`);
  logger.info(`📊 LOTE CONCLUÍDO`);
  logger.info(`${'#'.repeat(70)}`);
  logger.info(`Total de casos: ${summary.total}`);
  logger.info(`✅ Sucesso: ${summary.succeeded}`);
  logger.info(`❌ Falha: ${summary.failed}`);
  logger.info(`⚠️ Necessitam revisão humana: ${summary.needsReview}`);
  logger.info(`🔄 Total de tentativas: ${summary.totalAttempts}`);
  logger.info(`⏱️ Tempo total: ${Math.round(batchTime / 1000)}s`);
  logger.info(`⏱️ Tempo médio/caso: ${Math.round(summary.avgTimePerCase / 1000)}s`);
  logger.info(`${'#'.repeat(70)}\n`);

  // Gravar métricas
  await recordMetrics(summary);

  if (errors.length > 0) {
    logger.warn('⚠️ Casos com falha:');
    errors.forEach(err => {
      logger.warn(`   - Caso ${err.caseIndex}: ${err.spec.type} (${err.spec.level})`);
      logger.warn(`     Erro: ${err.error}`);
    });
  }

  return {
    summary,
    results,
    errors
  };
}

module.exports = { processBatch };
```

---

### 6. Script Principal: Gerar Lote

**`src/scripts/generate-batch.js`:**
```javascript
require('dotenv').config();
const { processBatch } = require('../pipeline/process-batch');
const { logger } = require('../config/logger');

/**
 * Especificação do lote
 */
const BATCH_SPECS = [
  { type: 'ruptura_alianca', level: 'basic', disorder: 'TAG' },
  { type: 'revelacao_dificil', level: 'intermediate', disorder: 'Depressão' },
  { type: 'resistencia_tecnica', level: 'advanced', disorder: 'TOC' },
  { type: 'intervencao_crucial', level: 'basic', disorder: 'TEPT' },
  { type: 'dilema_etico', level: 'intermediate', disorder: 'Fobia Social' },
  { type: 'tecnica_oportuna', level: 'advanced', disorder: 'Pânico' }
];

/**
 * Main
 */
async function main() {
  try {
    logger.info('🚀 Iniciando pipeline de geração automatizada');

    // Validar que Assistants foram criados
    if (!process.env.ASSISTANT_GENERATOR_ID) {
      throw new Error('Assistants não criados. Execute: node src/scripts/create-assistants.js');
    }

    // Processar lote
    const { summary, results, errors } = await processBatch(BATCH_SPECS);

    // Resultado
    if (summary.failed === 0) {
      logger.info('🎉 Lote concluído com 100% de sucesso!');
      process.exit(0);
    } else {
      logger.warn(`⚠️ Lote concluído com ${summary.failed} falha(s)`);
      process.exit(1);
    }

  } catch (error) {
    logger.error('❌ Erro fatal no pipeline', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

main();
```

**Rodar:**
```bash
node src/scripts/generate-batch.js
```

---

### 7. Utils: Auxiliares

**`src/utils/json-parser.js`:**
```javascript
/**
 * Parsear JSON do response do Assistant
 */
function parseJSON(text) {
  // Tentar extrair JSON do texto
  // (Assistants às vezes retornam texto + JSON)

  // Método 1: Texto é JSON puro
  try {
    return JSON.parse(text);
  } catch (e) {
    // Não é JSON puro, continuar
  }

  // Método 2: JSON dentro de código markdown
  const codeBlockMatch = text.match(/```json\n([\s\S]+?)\n```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1]);
  }

  // Método 3: JSON solto no texto
  const jsonMatch = text.match(/\{[\s\S]+\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error('Não foi possível extrair JSON do response');
}

module.exports = { parseJSON };
```

**`src/utils/metrics.js`:**
```javascript
const fs = require('fs');
const path = require('path');

/**
 * Gravar métricas em arquivo
 */
async function recordMetrics(summary) {
  const metricsPath = path.join(__dirname, '../../logs/metrics.log');

  const entry = {
    timestamp: new Date().toISOString(),
    ...summary
  };

  fs.appendFileSync(metricsPath, JSON.stringify(entry) + '\n');
}

module.exports = { recordMetrics };
```

---

## 🚀 COMO EXECUTAR {#execucao}

### Setup Inicial (1x)

**1. Criar pasta e instalar dependências:**
```bash
mkdir scopsy-case-automation
cd scopsy-case-automation
npm init -y
npm install openai @supabase/supabase-js winston dotenv
```

**2. Copiar arquivos:**
- Copiar estrutura de código acima
- Copiar os 3 arquivos `GPT_*_INSTRUCOES.md` para `docs/`

**3. Configurar `.env`:**
```env
OPENAI_API_KEY=sk-proj-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
MAX_RETRY_ATTEMPTS=3
```

**4. Criar Assistants:**
```bash
node src/scripts/create-assistants.js
```

Isso vai criar os 3 Assistants e salvar IDs no `.env`.

---

### Gerar Lote de Casos

**Comando:**
```bash
node src/scripts/generate-batch.js
```

**O que acontece:**
1. Processa 6 casos (1 de cada tipo)
2. Cada caso passa por: Gerar → Validar Técnica → Validar Clínica → Inserir
3. Se rejeitado: tenta novamente (até 3x)
4. Se realocado: ajusta nível e tenta novamente
5. Ao final: relatório completo

**Tempo estimado:** 10-20 minutos (depende de API OpenAI)

---

### Customizar Lote

**Editar `src/scripts/generate-batch.js`:**
```javascript
const BATCH_SPECS = [
  { type: 'ruptura_alianca', level: 'basic', disorder: 'TAG' },
  { type: 'ruptura_alianca', level: 'intermediate', disorder: 'TAG' },
  { type: 'ruptura_alianca', level: 'advanced', disorder: 'TAG' },
  // ... adicionar quantos quiser
];
```

---

## 📊 MONITORAMENTO E LOGS {#monitoramento}

### Logs Disponíveis

**`logs/pipeline.log`:**
```
[2026-01-05T10:30:00.000Z] info: 🚀 Iniciando pipeline de geração automatizada
[2026-01-05T10:30:05.000Z] info: 🎯 INICIANDO CASO 1: ruptura_alianca (basic)
[2026-01-05T10:30:15.000Z] info: 📝 Gerando caso...
[2026-01-05T10:30:45.000Z] info: ✅ Caso gerado
[2026-01-05T10:30:50.000Z] info: 🔍 Validando tecnicamente...
[2026-01-05T10:31:20.000Z] info: 📊 Validação técnica: APROVADO
...
```

**`logs/errors.log`:**
```
[2026-01-05T10:35:00.000Z] error: ❌ Erro na tentativa 1
  error: "Timeout aguardando conclusão"
  stack: "Error: Timeout..."
```

**`logs/metrics.log`:**
```json
{"timestamp":"2026-01-05T10:45:00.000Z","total":6,"succeeded":5,"failed":1,"totalAttempts":8,"needsReview":1,"totalTimeMs":900000,"avgTimePerCase":150000}
```

---

### Verificar Status

**Script:** `src/scripts/check-status.js`
```javascript
require('dotenv').config();
const { supabase } = require('../config/supabase');

async function checkStatus() {
  const { data, error } = await supabase
    .from('cases')
    .select('id, moment_type, difficulty_level, status, created_at')
    .eq('created_by', 'assistant_pipeline_v1')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Erro:', error);
    return;
  }

  console.log('\n📊 Últimos 20 casos gerados:\n');
  data.forEach(c => {
    console.log(`  ${c.id.substring(0, 8)} | ${c.moment_type.padEnd(20)} | ${c.difficulty_level.padEnd(12)} | ${c.status} | ${c.created_at}`);
  });
}

checkStatus();
```

**Rodar:**
```bash
node src/scripts/check-status.js
```

---

## ⚠️ TRATAMENTO DE ERROS {#erros}

### Erros Comuns

**1. "Assistants não criados"**
```
Erro: Assistants não criados. Execute: node src/scripts/create-assistants.js
```
**Solução:** Rodar script de criação de Assistants.

---

**2. "Timeout aguardando conclusão"**
```
Erro: Timeout: Run não completou em 120s
```
**Causa:** Assistant demorou muito (caso complexo, API lenta)
**Solução:** Aumentar `maxAttempts` em `pollRunUntilComplete` ou tentar novamente.

---

**3. "Não foi possível extrair JSON"**
```
Erro: Não foi possível extrair JSON do response
```
**Causa:** Assistant retornou texto sem JSON válido
**Solução:**
- Verificar instruções do Assistant (pedir explicitamente JSON)
- Refinar `parseJSON` para lidar com mais formatos

---

**4. "Caso rejeitado após 3 tentativas"**
```
Erro: Falha ao processar caso após 3 tentativas
```
**Causa:** Gerador não consegue criar caso que passe nas validações
**Solução:**
- Revisar instruções do GPT 1 (Gerador)
- Relaxar critérios dos revisores (se muito rigorosos)
- Aumentar MAX_ATTEMPTS

---

## 💰 CUSTOS E PERFORMANCE {#custos}

### Estimativa de Custos (OpenAI API)

**Por caso (estimativa):**
- **Geração (Assistant 1):** ~3.000 tokens output = $0.09
- **Revisão Técnica (Assistant 2):** ~1.000 tokens output = $0.03
- **Revisão Clínica (Assistant 3):** ~1.500 tokens output = $0.045
- **TOTAL:** ~$0.15-0.20 por caso

**Lote de 6 casos:**
- ~$1.00-1.20

**Considerando retries (média 1.3 tentativas/caso):**
- ~$1.30-1.50 por lote de 6 casos

**Para 100 casos:**
- ~$20-25

---

### Performance

**Tempo por caso:**
- Geração: 30-60s
- Validação técnica: 20-40s
- Validação clínica: 30-50s
- Inserção: 1-2s
- **TOTAL:** 2-3 minutos/caso (média)

**Lote de 6 casos:**
- 12-18 minutos

**Limitação:** OpenAI API tem rate limits (não paralelizar demais)

---

## 🎯 PRÓXIMOS PASSOS

### Depois de Implementar

**1. População inicial:**
```bash
# Gerar 30 casos (5 de cada tipo)
node src/scripts/generate-batch.js
# (editar BATCH_SPECS para 30 specs)
```

**2. Revisão humana:**
- Verificar casos com `status='pending_review'`
- Aprovar ou rejeitar
- Mudar para `status='active'`

**3. Monitoramento:**
- Analisar logs
- Taxa de aprovação por tipo/nível
- Identificar padrões de erro

**4. Iteração:**
- Ajustar instruções dos Assistants
- Refinar critérios de validação
- Otimizar pipeline

---

## 📦 RESUMO EXECUTIVO

### O Que Você Terá

Após implementar este documento:

✅ **Sistema automatizado** de geração de casos
✅ **Pipeline robusto** com retry e validação em múltiplas camadas
✅ **Processamento individual** caso a caso (não batch ingênuo)
✅ **Substituição automática** de casos rejeitados
✅ **Realocação automática** de níveis (ex: advanced → intermediate)
✅ **Escalação** de casos ambíguos para humano
✅ **Logs completos** para auditoria
✅ **Métricas** de performance e qualidade

### Capacidade

- **Volume:** 30-60 casos/dia
- **Qualidade:** Taxa de aprovação >70% (após iteração)
- **Custo:** ~$0.20/caso ($20-25 para 100 casos)
- **Tempo:** ~2-3 min/caso

---

## 🎉 CONCLUSÃO

Este sistema permite que você **escale a produção de conteúdo** de forma automatizada, mantendo **alta qualidade** através de validação em múltiplas camadas.

**Diferenciais:**
- ✅ Processamento caso a caso (não batch ingênuo)
- ✅ Retry automático (até 3 tentativas)
- ✅ Realocação de nível (advanced → intermediate)
- ✅ Escalação para humano (quando necessário)
- ✅ Logs completos e métricas

**Implementar este sistema = Acelerar 10x a criação de conteúdo do Scopsy!** 🚀

---

**Versão:** 1.0
**Data:** 05/01/2026
**Status:** Pronto para implementação
**Próximo passo:** Criar pasta `scopsy-case-automation/` e começar implementação
