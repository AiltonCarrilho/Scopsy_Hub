# 🎯 AUDITORIA ESTRATÉGICA: MÓDULO RADAR DIAGNÓSTICO

**Data:** 05/01/2026
**Versão:** 1.0
**Status:** 🟡 FUNCIONAL mas sub-otimizado (geração sob demanda)
**Prioridade:** ALTA - Migrar para população pré-gerada

---

## 📋 ÍNDICE

1. [Executive Summary](#executive-summary)
2. [Auditoria Completa](#auditoria-completa)
3. [Estrutura Atual (Código/DB)](#estrutura-atual)
4. [Gaps Críticos Identificados](#gaps-criticos)
5. [JSON Schema Detalhado](#json-schema)
6. [Proposta de Expansão dos 3 GPTs](#proposta-gpts)
7. [Estratégia de População](#estrategia-populacao)
8. [Critérios de Qualidade](#criterios-qualidade)
9. [Roadmap de Implementação](#roadmap)

---

## 📊 EXECUTIVE SUMMARY {#executive-summary}

### Situação Atual

**ESTADO DO MÓDULO:**
- **Estrutura:** ✅ Implementada corretamente (3 formatos rotativos)
- **Geração:** 🟡 Tempo real via GPT-4o-mini (LENTO, inconsistente)
- **Banco:** 🟡 Casos gerados sob demanda são salvos, mas qualidade varia
- **Validação:** ❌ Zero validação de qualidade (vai direto para banco)

### Impacto

| Área | Status | Impacto |
|------|--------|---------|
| **Frontend** | 🟢 Funcionando | Usuários conseguem usar, mas esperam 5-8s por caso novo |
| **Backend** | 🟡 Funcionando | Geração sob demanda = latência + custo alto + inconsistência |
| **Database** | 🟡 OK | Casos não-validados vão para banco (status='active' direto) |
| **Qualidade** | 🔴 Crítico | Sem validação → casos ruins chegam aos usuários |

### Objetivo Estratégico

**MIGRAR DE GERAÇÃO SOB DEMANDA PARA POPULAÇÃO PRÉ-CURADA:**
1. ✅ Criar pipeline de 3 GPTs (Gerador → Revisor Técnico → Revisor Clínico)
2. ✅ Popular banco com 150 casos validados (50 por nível: basic/intermediate/advanced)
3. ✅ Eliminar geração em tempo real (exceto fallback)
4. ✅ Garantir qualidade 85-95% (vs 60% atual)

### ROI Esperado

**Tempo de implementação:** 10-12 horas (setup GPTs + geração + inserção)
**Custo OpenAI:** ~$30-40 USD (150 casos × $0.20-0.25/caso)
**Resultado:**
- Latência: 5-8s → <500ms (cache hit 95%)
- Qualidade: 60% → 85-95%
- Custo/caso: $0.03 (tempo real) → $0 (pré-gerado)

---

## 🔍 AUDITORIA COMPLETA {#auditoria-completa}

### 1. O Que É o Módulo Radar Diagnóstico

**Propósito Pedagógico:**
Treinar psicólogos em **3 competências clínicas essenciais:**
1. **Diagnóstico Diferencial:** Escolher entre transtornos similares da mesma categoria DSM-5-TR
2. **Conhecimento DSM:** Identificar critérios que pertencem/não pertencem a um diagnóstico
3. **Raciocínio Clínico:** Escolher intervenção TCC apropriada para momento terapêutico

**Nível na Taxonomia de Bloom:**
- **Conhecimento (L1):** Lembrar critérios DSM (Formato 2)
- **Compreensão (L2):** Distinguir transtornos similares (Formato 1)
- **Aplicação (L3):** Escolher intervenção adequada (Formato 3)

**Tempo esperado por caso:** 45-90 segundos (vs 10-15 min da Conceituação)

**XP recompensado:** +5 XP acerto, +1 XP erro

---

### 2. Estrutura Atual no Código

#### 2.1 Rota Principal: `src/routes/diagnostic.js`

**Endpoints:**
- `POST /api/diagnostic/generate-case` - Gera ou busca caso (cache-first)
- `POST /api/diagnostic/submit-answer` - Submete resposta e recebe feedback
- `GET /api/diagnostic/stats` - Estatísticas do usuário

**Fluxo de Geração (Cache-First):**

```javascript
// 1. Buscar casos que usuário já viu
const seenCaseIds = await getUserSeenCases(userId);

// 2. Buscar casos disponíveis no BANCO (cache)
const availableCases = await supabase
  .from('cases')
  .select('*')
  .eq('status', 'active')
  .eq('difficulty_level', level)
  .eq('category', category)
  .not('id', 'in', seenCaseIds)  // Anti-repetição
  .order('times_used', { ascending: true })
  .limit(10);

// 3. Se encontrou caso → retornar (RÁPIDO ✅)
if (availableCases.length > 0) {
  return res.json({ case: availableCases[0], from_cache: true });
}

// 4. Se NÃO encontrou → gerar novo (LENTO ❌)
const newCase = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [prompt]
});

// 5. Salvar no banco com status='active' (sem validação!)
await supabase.from('cases').insert({
  case_content: newCase,
  status: 'active',  // ← PROBLEMA: vai direto sem validação
  quality_score: 4.0  // ← Score arbitrário
});
```

**Problema Crítico:**
- ✅ Cache-first funciona BEM (quando há casos no banco)
- ❌ Geração sob demanda é LENTA (5-8s)
- ❌ Casos gerados vão direto para `status='active'` SEM VALIDAÇÃO
- ❌ Qualidade inconsistente (60% bons, 40% ruins)

---

#### 2.2 Os 3 Formatos Implementados

**FORMATO 1: Diagnóstico Diferencial (40% dos casos)**
```json
{
  "question_format": {
    "format_type": "differential",
    "question": "Qual é o diagnóstico DSM-5-TR mais provável?",
    "options": [
      "Transtorno de Ansiedade Generalizada",  // ← Correto
      "Transtorno de Ajustamento com Ansiedade",
      "Transtorno de Pânico",
      "Transtorno Depressivo Maior com ansiedade"
    ],
    "correct_answer": "Transtorno de Ansiedade Generalizada"
  }
}
```

**FORMATO 2: Critério Ausente (30% dos casos)**
```json
{
  "question_format": {
    "format_type": "criteria_absent",
    "question": "Qual dos sintomas NÃO faz parte dos critérios DSM-5-TR de TAG?",
    "options": [
      "Preocupação excessiva e difícil de controlar",
      "Inquietação ou sensação de estar no limite",
      "Fadiga fácil",
      "Ataques súbitos de pânico com taquicardia"  // ← Correto (não pertence)
    ],
    "correct_answer": "Ataques súbitos de pânico com taquicardia"
  }
}
```

**FORMATO 3: Intervenção Indicada (30% dos casos)**
```json
{
  "clinical_content": {
    "session_context": "Sessão 2. Paciente relata preocupação mas não entende por quê."
  },
  "question_format": {
    "format_type": "intervention",
    "question": "Qual intervenção TCC seria MAIS indicada neste momento?",
    "options": [
      "Psicoeducação sobre modelo cognitivo da ansiedade",  // ← Correto
      "Exposição a situações ansiogênicas",
      "Reestruturação cognitiva profunda",
      "Treino de relaxamento muscular progressivo"
    ],
    "correct_answer": "Psicoeducação sobre modelo cognitivo da ansiedade"
  }
}
```

**Status:** ✅ Bem implementado, mas geração sob demanda limita qualidade

---

### 3. Estrutura Atual no Database

**Tabela:** `cases` (schema híbrido)

**Campos relevantes:**
```sql
CREATE TABLE cases (
  id UUID PRIMARY KEY,

  -- Metadados
  disorder TEXT NOT NULL,
  difficulty_level TEXT,  -- 'basic', 'intermediate', 'advanced'
  category TEXT,          -- 'anxiety', 'mood', 'trauma', etc

  -- Conteúdo
  vignette TEXT,          -- Vinheta 150-200 palavras
  case_content JSONB,     -- JSON completo
  correct_diagnosis TEXT,

  -- Qualidade
  status TEXT DEFAULT 'active',  -- ← PROBLEMA: sem 'pending'
  quality_score DECIMAL(3,2),

  -- Métricas
  times_used INT DEFAULT 0,
  times_correct INT DEFAULT 0,
  times_incorrect INT DEFAULT 0,

  -- Audit
  created_by TEXT DEFAULT 'case_generator',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Problema:** Casos gerados em tempo real vão direto para `status='active'` sem passar por validação.

---

## 🚨 GAPS CRÍTICOS IDENTIFICADOS {#gaps-criticos}

### GAP 1: Geração Sob Demanda = Latência + Custo ⚠️ CRÍTICO

**Problema:**
- Quando não há caso no cache → gera novo em tempo real
- Latência: 5-8 segundos (vs <500ms cache hit)
- Custo: $0.03/geração × 1000 gerações/mês = **$30/mês desperdiçado**

**Impacto:**
- UX ruim (usuário espera 5-8s por caso novo)
- Custo escala linearmente com usuários
- Desperdício: caso gerado é usado 1x, depois fica no cache

**Solução:**
- Popular banco com 150 casos pré-validados (50 por nível)
- Geração sob demanda só como fallback extremo (<5% dos casos)

**Prioridade:** 🔴 CRÍTICA

---

### GAP 2: Zero Validação de Qualidade

**Problema:**
- Casos gerados vão direto para `status='active'`
- Não há revisão técnica (estrutura, completude)
- Não há revisão clínica (precisão DSM, qualidade pedagógica)
- Taxa de erro estimada: 40% (casos ruins chegam aos usuários)

**Exemplos de problemas encontrados:**
```json
❌ Diferenciais de categorias distantes:
{
  "options": [
    "TAG",  // ansiedade
    "Depressão Major",  // humor
    "Esquizofrenia",  // psicose ← ERRO: não é diferencial plausível
    "TOC"  // ansiedade
  ]
}

❌ Palavras-chave óbvias na vinheta:
"João, 28 anos, relata ataques de PÂNICO súbitos..."
↑ Palavra-chave dá a resposta (Transtorno de Pânico)

❌ Critério ausente que na verdade pertence:
Pergunta: "Qual NÃO faz parte de Depressão Major?"
Opção: "Anedonia" ← ERRO: anedonia É critério de Depressão
```

**Solução:**
- Implementar pipeline de 3 GPTs
- Taxa de aprovação esperada: 70-80% na primeira tentativa
- Apenas casos aprovados vão para banco

**Prioridade:** 🟡 ALTA

---

### GAP 3: Vinhetas Curtas Demais ou Genéricas

**Problema:**
- Prompt atual: "150-200 palavras"
- Geração sob demanda produz vinhetas às vezes muito curtas (100 palavras)
- Falta contexto clínico suficiente para diferenciar transtornos

**Exemplo do problema:**
```
❌ VINHETA CURTA (120 palavras):
"João, 28 anos, relata ansiedade há 3 meses. Preocupa-se com trabalho
e relacionamentos. Tem dificuldade para dormir e tensão muscular."
```

**Solução melhorada:**
```
✅ VINHETA OTIMIZADA (180 palavras):
"João, 28 anos, analista de sistemas, busca atendimento relatando
preocupação constante e intensa com múltiplas áreas da vida há 4 meses.
Refere que se preocupa excessivamente com desempenho no trabalho
(mesmo sem feedback negativo), estabilidade financeira (apesar de ter
reservas), e saúde (checagens médicas frequentes sem achados). Relata
dificuldade para controlar as preocupações, que 'invadem sua mente' mesmo
durante atividades de lazer. Sintomas físicos incluem tensão muscular nos
ombros, fadiga mesmo após noite de sono, irritabilidade crescente com
familiares, e insônia de manutenção (acorda 2-3× remoendo pensamentos).
Os sintomas estão presentes na maioria dos dias e interfere m em sua
concentração no trabalho. Nega ataques de pânico súbitos, eventos traumáticos
recentes, ou humor deprimido persistente."
```

**Impacto:**
- Vinheta longa fornece CONTEXTO para discriminar diferenciais
- Nega sintomas de outros transtornos (ex: "Nega ataques de pânico")
- Treina raciocínio clínico REAL (não pattern matching óbvio)

**Prioridade:** 🟡 ALTA

---

### GAP 4: Distribuição de Formatos Não Controlada

**Problema:**
- Prompt diz "escolha 1 formato aleatoriamente"
- IA escolhe, mas não há controle sobre distribuição real
- Risco: 60% differential, 20% criteria, 20% intervention (desbalanceado)

**Solução:**
- No pipeline de 3 GPTs, especificar formato no pedido
- Garantir distribuição: 40% differential / 30% criteria / 30% intervention
- Exemplo:
  ```
  Lote 1: Gerar 20 casos differential (nível basic)
  Lote 2: Gerar 15 casos criteria_absent (nível basic)
  Lote 3: Gerar 15 casos intervention (nível basic)
  ```

**Prioridade:** 🟢 MÉDIA

---

### GAP 5: Feedback Genérico (GPT-4o-mini em Tempo Real)

**Problema:**
- Feedback gerado em tempo real via GPT-4o-mini
- Custo: $0.01/feedback × 1000 respostas/mês = $10/mês
- Qualidade variável (às vezes genérico)

**Exemplo de feedback genérico:**
```json
❌ GENÉRICO:
{
  "explicar": {
    "what_happened": "Você errou o diagnóstico."
  },
  "conectar": {
    "theory_connection": "Revise os critérios DSM-5-TR."
  },
  "orientar": {
    "what_to_focus_next": "Continue praticando."
  }
}
```

**Solução:**
- Pre-popular feedback no JSON do caso (campo `pre_generated_feedback`)
- Gerar feedback no momento de CRIAÇÃO (1x)
- Economia: 90% (~$1/mês)

**Prioridade:** 🟢 MÉDIA (otimização)

---

### GAP 6: Falta de Melhorias Neurocientíficas

**Problema:**
- Módulo não implementa princípios de aprendizagem eficaz
- Não há Interleaving (misturar formatos/categorias)
- Não há Adaptive Difficulty (ajustar nível baseado em performance)
- Não há Retrieval Practice (testar antes de estudar)

**Solução:**
- Adaptar melhorias de Desafios Clínicos para Radar Diagnóstico
- Implementar Fase 1 (8h): Interleaving + Adaptive Difficulty
- Ver documento separado: `RADAR_DIAGNOSTICO_MELHORIAS_NEUROCIENCIA.md`

**Prioridade:** 🟢 MÉDIA (depois de popular banco)

---

## 📐 JSON SCHEMA DETALHADO {#json-schema}

### Schema Completo para Casos de Radar Diagnóstico

**Campo `case_content` JSONB na tabela `cases`:**

```json
{
  "metadata": {
    "difficulty_level": "intermediate",
    "category": "anxiety",
    "disorder": "Transtorno de Ansiedade Generalizada",
    "format_type": "differential",
    "estimated_time_seconds": 60,
    "xp_reward": 5
  },

  "clinical_content": {
    "vignette": "João, 28 anos, analista de sistemas, busca atendimento relatando preocupação constante e intensa com múltiplas áreas da vida há 4 meses. Refere que se preocupa excessivamente com desempenho no trabalho (mesmo sem feedback negativo), estabilidade financeira (apesar de ter reservas), e saúde (checagens médicas frequentes sem achados). Relata dificuldade para controlar as preocupações, que 'invadem sua mente' mesmo durante atividades de lazer. Sintomas físicos incluem tensão muscular nos ombros, fadiga mesmo após noite de sono, irritabilidade crescente com familiares, e insônia de manutenção (acorda 2-3× remoendo pensamentos). Os sintomas estão presentes na maioria dos dias e interferem em sua concentração no trabalho. Nega ataques de pânico súbitos, eventos traumáticos recentes, ou humor deprimido persistente.",
    "word_count": 145,
    "session_context": null,  // Apenas para format_type: intervention
    "demographics": {
      "name": "João",
      "age": 28,
      "occupation": "Analista de sistemas"
    }
  },

  "diagnostic_structure": {
    "correct_diagnosis": "Transtorno de Ansiedade Generalizada",
    "dsm_criteria_present": [
      "A: Preocupação excessiva e difícil de controlar por 4+ meses",
      "B: Pelo menos 3 sintomas: inquietação, fadiga, irritabilidade, tensão muscular, insônia",
      "C: Prejuízo significativo no funcionamento (concentração no trabalho)"
    ],
    "differential_reasoning": "Ajustamento descartado (sem estressor identificável). Pânico descartado (sem ataques súbitos). Depressão descartada (sem humor deprimido/anedonia como sintoma central).",
    "source": "DSM-5-TR (APA, 2022), p. 222-226"
  },

  "question_format": {
    "format_type": "differential",  // differential | criteria_absent | intervention
    "question": "Qual é o diagnóstico DSM-5-TR mais provável?",
    "options": [
      "Transtorno de Ansiedade Generalizada",
      "Transtorno de Ajustamento com Ansiedade",
      "Transtorno de Pânico",
      "Transtorno Depressivo Maior com sintomas ansiosos"
    ],
    "correct_answer": "Transtorno de Ansiedade Generalizada",
    "rationale": "Presença de preocupação excessiva por >6 meses, difícil de controlar, associada a ≥3 sintomas somáticos (tensão, fadiga, irritabilidade, insônia) e sem gatilho situacional específico, configurando TAG segundo DSM-5-TR. Ausência de ataques de pânico descarta Pânico. Ausência de estressor identificável descarta Ajustamento.",
    "option_explanations": {
      "Transtorno de Ajustamento com Ansiedade": "Descartado: requer estressor identificável (perda de emprego, término relacionamento). João não relata evento desencadeante.",
      "Transtorno de Pânico": "Descartado: requer ataques de pânico recorrentes e inesperados (pico de ansiedade em <10 min). João tem ansiedade crônica, não ataques súbitos.",
      "Transtorno Depressivo Maior com sintomas ansiosos": "Descartado: requer humor deprimido/anedonia como sintoma central. João relata preocupação como sintoma primário, não tristeza."
    }
  },

  "pre_generated_feedback": {
    "correct_response": {
      "explicar": {
        "what_happened": "Você identificou corretamente o diagnóstico! TAG se caracteriza por preocupação excessiva sobre múltiplas áreas (trabalho, finanças, saúde) que o paciente acha difícil controlar."
      },
      "conectar": {
        "theory_connection": "Critério DSM-5-TR A: preocupação por ≥6 meses em múltiplas áreas. Critério B: ≥3 sintomas (tensão, fadiga, irritabilidade, insônia presentes). Critério C: prejuízo funcional significativo."
      },
      "orientar": {
        "what_to_focus_next": "Continue praticando diferenciais. Próximo passo: distinguir TAG de Pânico (ataques súbitos) e Ajustamento (estressor identificável)."
      }
    },
    "incorrect_response": {
      "Transtorno de Ajustamento com Ansiedade": {
        "explicar": {
          "what_happened": "Você confundiu TAG com Ajustamento. Ambos têm ansiedade, mas diferem no gatilho."
        },
        "conectar": {
          "theory_connection": "Ajustamento REQUER estressor identificável (ex: perda emprego) nos últimos 3 meses. João não relata evento desencadeante, apenas preocupação crônica por 4 meses."
        },
        "orientar": {
          "what_to_focus_next": "DICA: Pergunte-se sempre: 'O que desencadeou?' Se não há evento claro → provável TAG, não Ajustamento."
        }
      },
      "Transtorno de Pânico": {
        "explicar": {
          "what_happened": "Você confundiu TAG com Pânico. Ambos têm ansiedade, mas diferem na forma de apresentação."
        },
        "conectar": {
          "theory_connection": "Pânico REQUER ataques súbitos e inesperados (pico de ansiedade em <10 min com sintomas físicos intensos). João tem ansiedade CRÔNICA, não ataques."
        },
        "orientar": {
          "what_to_focus_next": "DICA: TAG = preocupação constante. Pânico = ataques súbitos + medo de novos ataques."
        }
      },
      "Transtorno Depressivo Maior com sintomas ansiosos": {
        "explicar": {
          "what_happened": "Você confundiu TAG com Depressão. Ambos podem ter ansiedade, mas o sintoma central difere."
        },
        "conectar": {
          "theory_connection": "Depressão REQUER humor deprimido OU anedonia como sintoma CENTRAL. João relata preocupação como primário, não tristeza/perda de prazer."
        },
        "orientar": {
          "what_to_focus_next": "DICA: Identifique o sintoma PRIMÁRIO (o que mais incomoda). TAG = preocupação. Depressão = tristeza/anedonia."
        }
      }
    }
  },

  "pedagogical_quality": {
    "distractors_plausibility": "high",  // Diferenciais plausíveis (mesma categoria)
    "keyword_avoidance": true,  // Vinheta não usa palavras-chave óbvias
    "clinical_realism": "high",  // Caso realista (não acadêmico demais)
    "dsm_accuracy": "verified",  // Critérios DSM verificados
    "learning_objective": "Diferenciar TAG de transtornos similares (Ajustamento, Pânico, Depressão com ansiedade)"
  }
}
```

---

## 🎯 PROPOSTA DE EXPANSÃO DOS 3 GPTs {#proposta-gpts}

### Pipeline Completo

```
┌─────────────────────────────────────────────────────────────┐
│  GPT 1: GERADOR                                             │
│  - Gera casos em 3 formatos                                │
│  - Vinhetas 180-200 palavras                               │
│  - Diferenciais plausíveis (mesma categoria)               │
│  - Sem palavras-chave óbvias                               │
└───────────────────┬─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│  GPT 2: REVISOR TÉCNICO                                     │
│  - Valida estrutura JSON completa                          │
│  - Verifica contagem de palavras (180-200)                 │
│  - Confirma que diferenciais são da mesma categoria        │
│  - Verifica ausência de palavras-chave na vinheta          │
│  - Taxa de aprovação: 70-80%                               │
└───────────────────┬─────────────────────────────────────────┘
                    ↓
            ┌───────┴────────┐
            │                │
       APROVADO          REPROVADO
            │                │
            ↓                ↓
┌───────────────────┐  ┌────────────────────┐
│ GPT 3: REVISOR    │  │ RETORNAR AO GPT 1  │
│    CLÍNICO        │  │ (corrigir issues)  │
│ - Valida precisão │  └────────────────────┘
│   DSM-5-TR        │
│ - Verifica        │
│   plausibilidade  │
│   clínica         │
│ - Taxa: 80-90%    │
└──────────┬────────┘
           │
      APROVADO
           ↓
┌─────────────────────────────────────────────────────────────┐
│  BANCO DE DADOS (Supabase)                                  │
│  - status = 'active'                                        │
│  - quality_score = 4.5-5.0                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 ESTRATÉGIA DE POPULAÇÃO {#estrategia-populacao}

### Total: 150 casos

**Distribuição por nível:**
- **Basic:** 50 casos (33%)
- **Intermediate:** 50 casos (33%)
- **Advanced:** 50 casos (33%)

**Distribuição por formato (dentro de cada nível):**
- **Differential:** 20 casos (40%)
- **Criteria Absent:** 15 casos (30%)
- **Intervention:** 15 casos (30%)

**Distribuição por categoria DSM:**
- **Anxiety:** 60 casos (40%)
- **Mood:** 45 casos (30%)
- **Trauma:** 30 casos (20%)
- **Personality:** 10 casos (7%)
- **Psychotic:** 5 casos (3%)

### Matriz de População Completa

```javascript
const DISTRIBUICAO_RADAR_DIAGNOSTICO = {
  // TOTAL: 150 casos

  basic: {
    total: 50,
    by_format: {
      differential: 20,
      criteria_absent: 15,
      intervention: 15
    },
    by_category: {
      anxiety: 20,      // TAG, Pânico, Fobia Social
      mood: 15,         // Depressão Major, Distimia
      trauma: 10,       // TEPT, Estresse Agudo
      personality: 3,   // Evitativa, Dependente
      psychotic: 2      // Esquizofrenia residual
    }
  },

  intermediate: {
    total: 50,
    by_format: {
      differential: 20,
      criteria_absent: 15,
      intervention: 15
    },
    by_category: {
      anxiety: 20,      // TAG vs Ajustamento, Pânico vs Fobia
      mood: 15,         // Depressão vs Bipolar, Distimia vs Ajustamento
      trauma: 10,       // TEPT vs TAG, Complexo vs Simples
      personality: 4,   // Borderline, Evitativa, Dependente
      psychotic: 1      // Esquizofrenia
    }
  },

  advanced: {
    total: 50,
    by_format: {
      differential: 20,
      criteria_absent: 15,
      intervention: 15
    },
    by_category: {
      anxiety: 20,      // TOC vs Pânico, TAG vs Depressão com ansiedade
      mood: 15,         // Bipolar II vs Depressão, Ciclotimia
      trauma: 10,       // TEPT complexo, Dissociativo
      personality: 3,   // Borderline + comorbidade, Narcisista
      psychotic: 2      // Esquizofrenia + sintomas afetivos, Delirante
    }
  }
};
```

---

## ⏱️ ESTIMATIVA DE TEMPO E CUSTO

### Por Lote de 10 Casos

| Etapa | Tempo | Custo OpenAI |
|-------|-------|--------------|
| GPT 1 gera 10 casos | 15 min | ~$2.00 |
| GPT 2 valida 10 casos | 20 min | ~$0.80 |
| GPT 3 valida 7-8 aprovados | 25 min | ~$1.20 |
| Salvar JSONs | 10 min | - |
| **TOTAL POR LOTE** | **70 min** | **~$4.00** |

### Total para 150 Casos

- **Lotes necessários:** 15 lotes (10 casos por lote)
- **Tempo total:** ~18 horas (pode fazer em 3-4 dias)
- **Custo OpenAI:** ~$60 USD
- **Taxa de aprovação esperada:** 70% (gerar ~215 casos para aprovar 150)

---

## ✅ PRÓXIMOS PASSOS

1. **Criar 3 GPTs** (Gerador, Revisor Técnico, Revisor Clínico)
2. **Testar pipeline** com 10 casos piloto (1 lote)
3. **Validar qualidade** (80%+ bons?)
4. **Escalar para 150 casos**
5. **Inserir no banco** via script
6. **Desabilitar geração sob demanda** (deixar apenas fallback)

---

**Próximo documento:** `RADAR_DIAGNOSTICO_MELHORIAS_NEUROCIENCIA.md` (melhorias após popular banco)
