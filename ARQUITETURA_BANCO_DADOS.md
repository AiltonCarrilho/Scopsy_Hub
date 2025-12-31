# 🗄️ ARQUITETURA DE BANCO DE DADOS - SCOPSY

**Data:** 29/12/2025
**Versão:** 1.0

---

## 📊 VISÃO GERAL

O Scopsy usa uma **arquitetura híbrida** com:
- **1 tabela principal** (`cases`) para TODOS os módulos
- **Diferenciação por campos** (moment_type, category, disorder_category)
- **Tabelas auxiliares** para interações, progresso, séries

---

## 🗂️ ESTRUTURA DAS TABELAS

### 1. **`cases`** - Tabela Principal (TODOS os módulos)

**Localização:** `sql-scripts/01-hybrid-schema-cases.sql`

```sql
CREATE TABLE cases (
  id UUID PRIMARY KEY,

  -- IDENTIFICAÇÃO
  case_title TEXT,
  disorder TEXT NOT NULL,
  difficulty_level TEXT,  -- 'basic', 'intermediate', 'advanced'

  -- CONTEÚDO
  case_content JSONB NOT NULL,  -- JSON completo do caso
  vignette TEXT,                -- Texto da vinheta
  correct_diagnosis TEXT,

  -- DIFERENCIAÇÃO POR MÓDULO (campos que separam)
  moment_type TEXT,              -- Desafios: 'resistencia_tecnica', 'ruptura_alianca', etc
  category TEXT,                 -- Conceituação: 'clinical_moment'
                                 -- Diagnóstico: 'anxiety', 'mood', 'trauma', etc

  -- SÉRIES (opcional)
  series_id UUID,                -- Vincula a uma série
  episode_number INT,
  episode_title TEXT,

  -- QUALIDADE
  status TEXT DEFAULT 'active',  -- 'active', 'pending', 'bad', 'needs_review'
  quality_score DECIMAL(3,2),

  -- MÉTRICAS
  times_used INT DEFAULT 0,
  times_correct INT DEFAULT 0,
  times_incorrect INT DEFAULT 0,

  -- METADADOS
  created_by TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### Como Cada Módulo Usa a Tabela `cases`:

| Módulo | Filtro Principal | Exemplo |
|--------|------------------|---------|
| **Desafios Clínicos** | `moment_type IS NOT NULL` | `moment_type = 'resistencia_tecnica'` |
| **Conceitualizações** | `category = 'clinical_moment'` | `category = 'clinical_moment' AND disorder_category = 'anxiety'` |
| **Radar Diagnóstico** | `category IN ('anxiety', 'mood', ...)` | `category = 'anxiety' AND difficulty_level = 'intermediate'` |
| **Séries de Casos** | `series_id IS NOT NULL` | `series_id = <uuid>` |

---

### 2. **`user_case_interactions`** - Histórico de Interações

**Localização:** `sql-scripts/02-hybrid-schema-interactions.sql`

```sql
CREATE TABLE user_case_interactions (
  id UUID PRIMARY KEY,

  -- RELACIONAMENTOS
  user_id BIGINT NOT NULL,
  case_id UUID,                  -- ✅ Rastreia qual caso foi visto

  -- RESPOSTAS (diferentes por módulo)
  user_diagnosis TEXT,           -- Radar Diagnóstico
  user_answer TEXT,              -- Genérico (Desafios, etc)
  user_justification TEXT,

  is_correct BOOLEAN,            -- NULL = só visualizou, não respondeu
  time_spent_seconds INT,

  -- METADADOS
  difficulty_level TEXT,
  disorder_category TEXT,

  -- FLAGS
  reported_issue BOOLEAN,
  issue_type TEXT,

  created_at TIMESTAMP
);
```

**Índices importantes:**
- `idx_interactions_user_cases` (user_id, case_id) - Anti-repetição
- `idx_interactions_case` (case_id, is_correct) - Qualidade

---

### 3. **`case_series`** - Séries de Casos (Modelo Judith Beck)

**Localização:** `sql-scripts/09-case-series.sql`

```sql
CREATE TABLE case_series (
  id UUID PRIMARY KEY,

  series_name TEXT NOT NULL,     -- "Marcos - TAG: Do Acolhimento à Alta"
  series_slug TEXT UNIQUE,       -- "marcos_tag_001"

  -- CLIENTE
  client_name TEXT,              -- "Marcos Silva"
  client_age INT,

  -- DIAGNÓSTICO
  disorder TEXT,
  disorder_category TEXT,

  -- ESTRUTURA
  total_episodes INT,            -- Ex: 8 sessões
  difficulty_level TEXT,

  description TEXT,
  learning_goals TEXT,

  status TEXT DEFAULT 'active',
  created_at TIMESTAMP
);
```

**Relação com `cases`:**
- Casos individuais têm `series_id` apontando para a série
- `episode_number` indica ordem (1, 2, 3...)

---

### 4. **Tabelas de Jornada Terapêutica**

**IMPORTANTE:** Jornada usa sistema SEPARADO (não usa `cases`)

**Tabelas (não encontradas nos scripts, inferidas do código):**
- `clinical_journeys` - Jornadas completas (ex: "Carolina - TAG 12 sessões")
- `journey_sessions` - Sessões individuais
- `user_journey_progress` - Progresso do usuário

---

## 🎯 ORGANIZAÇÃO POR MÓDULO

### MÓDULO 1: Desafios Clínicos (Micro-Momentos)

**Tabela:** `cases`
**Filtro:** `moment_type IS NOT NULL`
**Backend:** `src/routes/case.js`

#### Tipos de Micro-Momentos:

```javascript
moment_type = 'resistencia_tecnica'  // Resistência a técnicas
moment_type = 'ruptura_alianca'      // Ruptura na aliança
moment_type = 'revelacao_dificil'    // Cliente revela algo difícil
moment_type = 'intervencao_crucial'  // Momento de intervenção chave
moment_type = 'emocao_intensa'       // Momento de emoção intensa
moment_type = 'dilema_etico'         // Dilema ético na sessão
```

#### Estrutura dos Dados:

```json
{
  "context": {
    "session_number": "Sessão 5",
    "what_just_happened": "Cliente chegou nervoso...",
    "diagnosis": "TAG",
    "client_name": "João",
    "client_age": 35,
    "difficulty_level": "intermediate"
  },
  "critical_moment": {
    "dialogue": "- Cliente: 'Não sei se isso funciona mesmo...'\n- Você:",
    "non_verbal": "Cliente cruza os braços, desvia olhar",
    "emotional_tone": "Desconfiança e frustração"
  },
  "options": [
    "Explorar a origem da dúvida",
    "Validar sentimento e explicar racional",
    "Continuar com a técnica",
    "Encerrar sessão cedo"
  ],
  "expert_choice": "Validar sentimento e explicar racional",
  "expert_explanation": "..."
}
```

---

### MÓDULO 2: Conceitualizações

**Tabela:** `cases`
**Filtro:** `category = 'clinical_moment'`
**Backend:** `src/routes/case.js` (endpoint `/conceptualize`)

#### Características:

- **Vinhetas longas** (300-400 palavras)
- **Ricas em detalhes** (história de vida, gatilhos, padrões)
- **Objetivo:** Conceituação profunda (crenças, esquemas, plano de tratamento)

#### Estrutura dos Dados:

```json
{
  "vignette": "Texto longo de 300-400 palavras descrevendo caso completo...",
  "disorder": "Transtorno de Ansiedade Generalizada",
  "disorder_category": "anxiety",
  "difficulty_level": "advanced",
  "conceptualization_elements": {
    "automatic_thoughts": [...],
    "core_beliefs": [...],
    "intermediate_beliefs": [...],
    "vulnerabilities": [...],
    "precipitating_factors": [...],
    "behavioral_patterns": [...]
  }
}
```

---

### MÓDULO 3: Radar Diagnóstico

**Tabela:** `cases`
**Filtro:** `category IN ('anxiety', 'mood', 'trauma', ...)`
**Backend:** `src/routes/diagnostic.js`

#### Categorias DSM-5-TR:

```javascript
category = 'anxiety'           // Transtornos de Ansiedade
category = 'mood'              // Transtornos do Humor
category = 'trauma'            // Trauma e Estressores
category = 'psychotic'         // Transtornos Psicóticos
category = 'personality'       // Transtornos de Personalidade
category = 'eating'            // Transtornos Alimentares
category = 'substance'         // Uso de Substâncias
// ... outros
```

#### Formatos de Casos:

1. **Diagnóstico Diferencial** - "Qual diagnóstico?"
2. **Critério Ausente** - "Qual critério NÃO se aplica?"
3. **Intervenção** - "Qual intervenção adequada?"

#### Estrutura dos Dados:

```json
{
  "patient_data": {
    "demographics": "Mulher, 28 anos...",
    "chief_complaint": "Queixa principal...",
    "symptoms": ["sintoma 1", "sintoma 2"]
  },
  "format": "differential_diagnosis",
  "options": [
    "Transtorno de Ansiedade Generalizada",
    "Transtorno de Pânico",
    "Fobia Social",
    "Transtorno Obsessivo-Compulsivo"
  ],
  "correct_answer": "Transtorno de Ansiedade Generalizada",
  "dsm_criteria_present": [...],
  "explanation": "..."
}
```

---

### MÓDULO 4: Jornada Terapêutica

**Tabelas Separadas:** `clinical_journeys`, `journey_sessions`
**Backend:** `src/routes/journey.js`

#### Estrutura:

```
clinical_journeys
├─ id
├─ title: "Carolina - TAG: 12 Sessões TCC"
├─ client_profile: {...}
├─ total_sessions: 12
└─ difficulty: 'intermediate'

journey_sessions (12 registros por jornada)
├─ journey_id
├─ session_number: 1-12
├─ session_title: "Sessão 1: Avaliação Inicial"
├─ context: {...}
├─ decision_prompt: "..."
├─ options: [...]
└─ skill_id: 'rapport_building'
```

**IMPORTANTE:** Jornadas NÃO usam geração on-demand, são pré-populadas.

---

## 🤖 USO DOS ASSISTANTS OPENAI

**IDs Definidos:** `src/services/openai-service.js`

```javascript
const ASSISTANTS = {
  orchestrator: 'asst_n4KRyVMnbDGE0bQrJAyJspYw',
  case: 'asst_gF2t61jT43Kgwx6mb6pDEty3',
  diagnostic: 'asst_UqKPTw0ui3JvOt8NuahMLkAc',
  journey: 'asst_ydS6z2mQO82DtdBN4B1HSHP3',
  generator: 'asst_rG9kO0tUDTmSa1xzMnIEhRmU'
};
```

### Uso REAL por Módulo:

| Módulo | Usa Assistant OpenAI? | Como Usa? |
|--------|----------------------|-----------|
| **Desafios** | ❌ **NÃO** | Gera via `openai.chat.completions` (gpt-4o-mini) |
| **Conceitualizações** | ❌ **NÃO** | Feedback via `openai.chat.completions` (gpt-4o) |
| **Radar Diagnóstico** | ❌ **NÃO** | Gera via `openai.chat.completions` (gpt-4o-mini) |
| **Jornada** | ❌ **NÃO** | Pré-populado (não gera on-demand) |
| **Chat Conversacional** | ✅ **SIM** | Usa Assistants API (threads persistentes) |

### ⚠️ IMPORTANTE - Assistants OpenAI NÃO SÃO USADOS!

Os assistants definidos (`case`, `diagnostic`, `journey`) **EXISTEM mas NÃO SÃO UTILIZADOS** no sistema atual!

**Geração atual:**
```javascript
// src/routes/case.js linha 258
const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",  // ← Chat Completions, NÃO Assistants API
  // ...
});
```

**Apenas o Chat Conversacional** (`chat.html`) usa Assistants API para threads persistentes.

---

## 📈 POPULAÇÃO DE CASOS (Estado Atual)

### Scripts de População Disponíveis:

```bash
populate-micromoments.js       # ~28 micro-momentos
populate-anxiety.js            # 15 casos ansiedade
populate-trauma-mood.js        # 30 casos trauma/mood
populate-all-categories.js     # ~66 casos conceituação
populate-cases.js              # ~140 casos diagnóstico
populate-quick.js              # 30 casos resistência técnica
populate-case-series.js        # Séries longitudinais
populate-journey-sessions.js   # Jornadas 12 sessões
```

### Estimativa de Casos no Banco:

| Tipo | Estimativa | Campo Identificador |
|------|------------|-------------------|
| Micro-momentos | ~90-120 | `moment_type IS NOT NULL` |
| Conceitualizações | ~110 | `category = 'clinical_moment'` |
| Diagnóstico | ~140 | `category IN ('anxiety', 'mood', ...)` |
| Séries | ~12-20 | `series_id IS NOT NULL` |
| **TOTAL** | **~350-450** | |

---

## 🚨 PROBLEMAS IDENTIFICADOS

### 1. Assistants OpenAI Não São Usados

**Problema:**
- 5 assistants criados e configurados
- **NENHUM é usado** nos módulos principais
- Sistema usa Chat Completions direto

**Impacto:**
- Assistants sem uso = custo desnecessário de manutenção
- Prompts duplicados (no código em vez de configurados no Assistant)
- Dificulta mudanças (precisa alterar código, não só configuração)

**Solução Recomendada:**
- **OPÇÃO A:** Migrar para usar Assistants API (mais organizado)
- **OPÇÃO B:** Remover assistants não usados (simplificar)

### 2. Tabela Única `cases` Pode Dificultar Escalabilidade

**Problema:**
- Módulos diferentes compartilham mesma tabela
- Filtros complexos (moment_type vs category vs disorder_category)
- Schema "inchado" (campos específicos de cada módulo)

**Impacto:**
- Queries mais lentas (índices múltiplos)
- Confusão na manutenção
- Dificulta otimizações específicas por módulo

**Solução Futura:**
- Considerar separar em:
  - `clinical_moments` (micro-momentos)
  - `conceptualization_cases` (conceitualizações)
  - `diagnostic_cases` (diagnóstico)

### 3. Conceitualizações Não Geram On-Demand

**Problema:**
- Se banco esvaziar → Erro 404
- Usuário fica sem casos

**Impacto:**
- UX ruim se população for insuficiente

**Solução:**
- Implementar geração on-demand + review (roadmap já tem)

---

## 📋 RESUMO EXECUTIVO

### ✅ Pontos Fortes:

1. **Arquitetura híbrida funciona** (cache-first)
2. **Tabela única simplifica** operações CRUD
3. **Anti-repetição implementado** (user_case_interactions)
4. **Métricas de qualidade** (times_used, times_correct)

### ⚠️ Pontos de Atenção:

1. **Assistants OpenAI não são usados** (custo sem benefício)
2. **População baixa** (~350 casos para 4 módulos)
3. **Falta sistema de qualidade** (todos casos status='active' sem validação)

### 🔧 Ações Recomendadas:

1. **URGENTE:** Verificar se banco tem casos populados
2. **URGENTE:** Executar scripts de população se necessário
3. **MÉDIO PRAZO:** Decidir sobre uso dos Assistants OpenAI
4. **LONGO PRAZO:** Considerar separar tabelas por módulo

---

**Fim da Documentação**
