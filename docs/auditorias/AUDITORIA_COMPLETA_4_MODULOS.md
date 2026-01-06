# 🔍 AUDITORIA COMPLETA - SCOPSY LAB
## Análise Minuciosa dos 4 Módulos + Knowledge Base Strategy

**Data:** 04/01/2026
**Objetivo:** Mapear elementos formativos existentes, identificar gaps, propor Knowledge Base unificado
**Filosofia:** "O duolingo dos psicólogos" - Entrega de valor real através de feedback formativo de alto nível

---

## 📊 VISÃO GERAL DO SISTEMA

### Filosofia Pedagógica Central

```
┌────────────────────────────────────────────────────────────────┐
│          SCOPSY LAB = DUOLINGO DOS PSICÓLOGOS                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  🎯 Foco: Competências clínicas REAIS, não teóricas abstratas │
│  ⚡ Velocidade: Feedback instantâneo, não genérico             │
│  📚 Profundidade: Cita fontes (Beck, DSM-5), não inventa      │
│  💎 Valor: Insights acionáveis, não platitudes                 │
│  🔄 Ciclo: Prática → Feedback Formativo → Insight → Crescimento│
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Princípio de Economia de Tokens

**🧠 ESTRATÉGIA ATUAL (muito inteligente):**
- **Conteúdo formativo no banco de dados** → Economiza tokens da IA
- **IA dedicada a instâncias livres** → Personalização e nuances
- **Resultado:** Consistência + Personalização sem explodir custos

**Exemplo prático:**
```javascript
// ❌ CARO: Pedir IA para gerar feedback completo toda vez
const feedback = await openai.chat.completion({
  prompt: "Explique por que TAG difere de Pânico..."
  // +800 tokens (~$0.02 por resposta)
});

// ✅ ECONÔMICO: Banco tem diferenciais pré-formatados
const differential = await database.getDifferential('TAG', 'Panic');
const personalizedInsight = await openai.chat.completion({
  prompt: `Base: ${differential}. Personalize para: ${userAnswer}`
  // +200 tokens (~$0.005 por resposta)
});
```

**Economia:** 75% menos tokens = mais usuários atendidos com mesmo budget

---

## 1️⃣ MÓDULO: DESAFIOS CLÍNICOS (Micro-Momentos)

### 🎯 Propósito
Treino de **raciocínio clínico rápido** em momentos críticos de 30-60 segundos que exigem decisão imediata.

### 📐 Estrutura Atual

```json
{
  "moment_type": "resistencia_tecnica | ruptura_alianca | revelacao_dificil | intervencao_crucial | dilema_etico | tecnica_oportuna",

  "context": {
    "session_number": "Sessão 1-10",
    "client_name": "Nome brasileiro",
    "client_age": 20-60,
    "diagnosis": "Diagnóstico breve",
    "what_just_happened": "2-3 frases: O que aconteceu ANTES"
  },

  "critical_moment": {
    "dialogue": "Fala do cliente (40-80 palavras). REALISTA.",
    "non_verbal": "Linguagem corporal (1-2 frases)",
    "emotional_tone": "Tom emocional"
  },

  "decision_point": "O QUE VOCÊ DIZ/FAZ NOS PRÓXIMOS 30 SEGUNDOS?",

  "options": [
    {"letter": "A", "response": "Resposta A (15-30 palavras)", "approach": "Nome abordagem"},
    {"letter": "B", "response": "Resposta B", "approach": "Nome abordagem"},
    {"letter": "C", "response": "Resposta C", "approach": "Nome abordagem"},
    {"letter": "D", "response": "Resposta D", "approach": "Nome abordagem"}
  ],

  "expert_choice": "A, B, C ou D",

  "expert_reasoning": {
    "why_this_works": "Por que funciona (3-4 frases)",
    "why_others_fail": {
      "option_X": "Por que falha (1-2 frases)",
      "option_Y": "Por que falha",
      "option_Z": "Por que falha"
    },
    "core_principle": "Princípio marcante (1 frase)",
    "what_happens_next": "O que acontece depois (2-3 frases)"
  },

  "learning_point": {
    "pattern_to_recognize": "Padrão futuro",
    "instant_response": "Resposta automática",
    "common_mistake": "Erro comum"
  }
}
```

### ✅ ELEMENTOS FORMATIVOS EXISTENTES (Muito bons!)

#### 1. Feedback Estruturado em 3 Camadas
- **Imediato:** "✅ Decisão de Expert!" ou "💡 Um expert escolheria X"
- **Raciocínio Expert:** Por que a escolha funciona (3-4 frases)
- **Princípio Clínico:** Frase marcante para memorizar

#### 2. Learning Point (Ouro Pedagógico!)
- **Padrão a reconhecer:** Generaliza para situações futuras
- **Resposta automática:** O que fazer quando ver o padrão
- **Erro comum:** O que NÃO fazer

#### 3. Análise de Raciocínio do Usuário
```javascript
user_reasoning_analysis: `Seu raciocínio: "${user_reasoning}"`
```
Valida o pensamento do estudante, não só a resposta.

### ⚠️ GAPS IDENTIFICADOS

#### 1. **Falta Citação de Fontes**
- Não cita Beck, Leahy, ou outros autores
- Princípios aparecem sem referência teórica
- **Impacto:** Estudante não sabe ONDE estudar mais

**Solução:**
```json
"expert_reasoning": {
  "why_this_works": "Validação empática antes de confrontar pensamento (Beck, 2011, p.123). Isso estabelece rapport e reduz defensividade.",
  "source": "Beck, J. (2011). Cognitive Therapy: Basics and Beyond, p.123",
  "related_reading": ["Leahy (2017). Cognitive Therapy Techniques, Cap.5"]
}
```

#### 2. **Não Há Diferenciais Entre Abordagens**
- Opções são "certa" vs "erradas"
- Mas não explica NUANCES entre abordagens válidas
- **Exemplo:** "Validação Empática (A) vs. Sondagem Socrática (B)" - ambas válidas, mas A é melhor NESTE momento. Por quê?

**Solução:**
```json
"context_sensitivity": {
  "why_A_better_than_B_here": "Validação (A) é superior à Sondagem (B) porque cliente está emocionalmente ativado. Sondagem funciona APÓS estabilização emocional (Linehan, 2015, DBT).",
  "when_B_would_work": "Sondagem Socrática seria ideal se cliente estivesse calmo e pedindo ajuda para entender seu pensamento."
}
```

#### 3. **Falta Progressão de Complexidade Explícita**
- Níveis basic/intermediate/advanced não são EXPLICADOS
- O que torna um caso "avançado"?

**Solução:**
```json
"difficulty_rationale": {
  "level": "advanced",
  "why_advanced": "Cliente apresenta ruptura + defesa + vulnerabilidade simultâneas. Requer navegação de 3 dinâmicas concorrentes (Safran & Muran, 2000).",
  "simpler_version": "Nível básico teria apenas ruptura clara, sem defesa sobreposta."
}
```

---

## 2️⃣ MÓDULO: CONCEITUAÇÃO DE CASOS (TCC Profunda)

### 🎯 Propósito
Treino de **conceituação cognitivo-comportamental completa** - da tríade até plano de intervenção.

### 📐 Estrutura Atual

```javascript
// Frontend: 4 textareas (usuário preenche)
1. "Tríade Cognitiva" - Pensamentos → Emoções → Comportamentos
2. "Crenças" - Centrais, intermediárias, automáticas
3. "Formulação Conceitual" - Vulnerabilidades, gatilhos, mantenedores
4. "Estratégia de Intervenção" - Foco terapêutico + técnicas

// Backend: Feedback formativo via GPT-4o
{
  "triade_feedback": "Feedback sobre tríade (3-4 frases)",
  "crencas_feedback": "Feedback sobre crenças (3-4 frases)",
  "formulacao_feedback": "Feedback sobre formulação (4-5 frases)",
  "intervencao_feedback": "Feedback sobre intervenção (3-4 frases)",
  "strengths": "2-3 pontos fortes específicos",
  "areas_to_develop": "2-3 áreas para aprofundar"
}
```

### ✅ ELEMENTOS FORMATIVOS EXISTENTES

#### 1. Feedback Formativo por Seção
Cada parte da conceituação recebe feedback específico - não genérico.

#### 2. Tom Validador
"SEMPRE valide pontos fortes ANTES de sugerir melhorias" (system prompt)

#### 3. XP Generoso
+30 cognits por conceituação completa (vs +8 em desafios) → Incentiva trabalho profundo

### ⚠️ GAPS CRÍTICOS (MAIS GRAVES)

#### 1. **ZERO CASOS DE CONCEITUAÇÃO NO BANCO!**
```bash
Total de casos: 278
Casos de conceituação: 0  ❌
```
**Resultado:** Módulo não funciona! Frontend retorna "Nenhum caso disponível".

#### 2. **Feedback Gerado 100% por IA**
- Sem base no banco de dados
- Sem citações de Beck, Judith Beck, Greenberger
- Sem exemplos de formulações modelo
- **Custo:** ~$0.06 por conceituação (alto!)
- **Qualidade:** Inconsistente, depende do prompt

**Solução Proposta:**
```json
// Knowledge Base: Formulações Modelo
{
  "disorder": "TAG",
  "model_formulation": {
    "typical_triad": {
      "thoughts": ["Vou perder o controle", "Algo terrível vai acontecer"],
      "emotions": ["Ansiedade intensa", "Medo"],
      "behaviors": ["Evitação", "Reasseguramento excessivo"],
      "source": "Beck, J. (2011), p.145-147"
    },
    "typical_beliefs": {
      "core": "Sou vulnerável/incompetente",
      "intermediate": "Se eu não controlar tudo, algo ruim acontecerá",
      "automatic": "Não vou conseguir lidar",
      "source": "Beck, A.T. et al (1985). Anxiety Disorders and Phobias, p.92"
    },
    "formulation_template": "Cliente desenvolveu crença de vulnerabilidade devido a [histórico de superproteção parental]. Atualmente, situações de [incerteza] ativam esta crença, gerando [preocupação excessiva e evitação]. Padrão se mantém porque [evitação impede teste de hipótese].",
    "source": "Greenberger & Padesky (2015). Mind Over Mood, Case 3"
  }
}
```

#### 3. **Não Ensina COMO Conceitualizar**
- Assume que estudante já sabe
- Não há guia passo a passo
- Não há exemplo antes de começar

**Solução:**
```html
<div class="info-box exemplos">
  <h4>💡 Exemplo de Tríade Cognitiva (TAG)</h4>
  <p><strong>Pensamento:</strong> "Vou fracassar nesta apresentação e todos perceberão minha incompetência"</p>
  <p><strong>Emoção:</strong> Ansiedade intensa (8/10), medo de julgamento</p>
  <p><strong>Comportamento:</strong> Procrastina preparação, considera cancelar, ensaia excessivamente (Beck, 2011)</p>
  <button onclick="showMoreExamples()">Ver mais exemplos</button>
</div>
```

---

## 3️⃣ MÓDULO: RADAR DIAGNÓSTICO (DSM-5-TR)

### 🎯 Propósito
Treino de **diagnóstico diferencial** preciso baseado em DSM-5-TR.

### 📐 Estrutura Atual

#### 3 Formatos de Perguntas (Excelente Diversidade!)

**FORMATO 1: Diagnóstico Diferencial (40%)**
- Pergunta: "Qual é o diagnóstico DSM-5-TR mais provável?"
- 4 opções da MESMA categoria (ex: TAG vs Pânico vs Fobia Social vs Ajustamento)

**FORMATO 2: Critério Ausente (30%)**
- Dá o diagnóstico na pergunta
- Pergunta: "Qual sintoma NÃO faz parte dos critérios DSM-5-TR?"
- 3 critérios corretos + 1 que não pertence

**FORMATO 3: Intervenção Indicada (30%)**
- Contexto de sessão (ex: "Sessão 2, após psicoeducação")
- Pergunta: "Qual intervenção TCC seria MAIS indicada NESTE momento?"
- 4 intervenções plausíveis

### ✅ ELEMENTOS FORMATIVOS EXISTENTES

#### 1. Feedback ECO (Excelente Framework!)
```json
{
  "feedback_eco": {
    "explicar": {
      "what_happened": "Contexto clínico (2-3 frases)"
    },
    "conectar": {
      "theory_connection": "DSM-5-TR relevante (2 frases)"
    },
    "orientar": {
      "what_to_focus_next": "Próximo passo (1-2 frases)"
    }
  }
}
```
**Por que é bom:** Explica, conecta teoria, orienta futuro - ciclo completo de aprendizado.

#### 2. Regras Anti-One-Word-Diagnosis
```
EVITAR "ONE-WORD DIAGNOSIS":
- NÃO use palavras-chave óbvias na vinheta
- Descreva SINTOMAS e CONTEXTO, não o nome do transtorno
- Exemplo: NÃO escreva "pânico" se diagnóstico é Transtorno de Pânico
```
Força raciocínio clínico real, não reconhecimento de padrões.

#### 3. Diferenciais Plausíveis Obrigatórios
```
Anxiety: TAG vs. Pânico vs. Fobia Social vs. Ajustamento
Mood: Depressão Maior vs. Distimia vs. Ajustamento vs. Bipolar (fase depr.)
```
Não são óbvios - exigem conhecimento DSM-5-TR real.

### ⚠️ GAPS IDENTIFICADOS

#### 1. **Feedback ECO Muito Enxuto**
- 2-3 frases por seção → Muito superficial
- Não cita páginas DSM-5-TR
- Não explica DIFERENÇA entre diferenciais

**Solução:**
```json
{
  "feedback_eco": {
    "explicar": {
      "what_happened": "Você identificou Transtorno de Pânico.",
      "diagnostic_criteria_present": [
        "Ataques de pânico recorrentes (Critério A - DSM-5-TR p.208)",
        "Preocupação persistente sobre ataques (Critério B)",
        "Mudança comportamental (evitação de locais) (Critério C)"
      ],
      "why_not_TAG": "TAG difere por preocupação GENERALIZADA (múltiplas áreas), não focada em ataques. Ver DSM-5-TR p.222 para comparação."
    },
    "conectar": {
      "dsm5_differential": {
        "correct": "Transtorno de Pânico (DSM-5-TR, p.208-209)",
        "vs_TAG": "TAG: preocupação difusa, não focada em ataques (p.222)",
        "vs_Fobia_Social": "Fobia Social: medo de julgamento, não sensações corporais (p.202)",
        "table_reference": "Ver Tabela de Diagnóstico Diferencial, DSM-5-TR p.211"
      },
      "source": "American Psychiatric Association (2022). DSM-5-TR"
    },
    "orientar": {
      "what_to_focus_next": "Estude critérios de duração: Pânico (1 mês), TEPT (1 mês), Estresse Agudo (3 dias a 1 mês).",
      "suggested_reading": "Beck, A.T. & Emery, G. (1985). Anxiety Disorders and Phobias, Cap.3 (Transtorno de Pânico)",
      "practice_next": "Pratique diferenciais entre Pânico, TEPT e Fobia Específica"
    }
  }
}
```

#### 2. **Não Há "Biblioteca de Diferenciais" no Banco**
- IA gera explicação nova toda vez
- Inconsistência entre respostas
- Alto custo de tokens

**Solução: Tabela no Supabase**
```sql
CREATE TABLE knowledge_differential_pairs (
  id UUID PRIMARY KEY,
  disorder_A TEXT, -- "Transtorno de Pânico"
  disorder_B TEXT, -- "TAG"
  category TEXT, -- "anxiety"

  key_differences JSONB,
  /*
  {
    "symptom_focus": {
      "A": "Ataques súbitos e intensos",
      "B": "Preocupação crônica e difusa"
    },
    "duration": {
      "A": "Episódico (minutos)",
      "B": "Contínuo (meses)"
    },
    "content": {
      "A": "Medo de sensações corporais",
      "B": "Preocupação com eventos futuros"
    }
  }
  */

  dsm5_pages TEXT, -- "p.208 (Pânico) vs p.222 (TAG)"
  diagnostic_table_reference TEXT, -- "Tabela 3.1, p.211"

  clinical_pearls TEXT, -- "Pânico: pergunte 'teve medo de morrer?'. TAG: pergunte 'sobre quais áreas se preocupa?'"

  source_references JSONB,
  /* ["DSM-5-TR (2022)", "Beck & Emery (1985), p.45-67"] */

  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. **Formato 3 (Intervenção) Não Está Sendo Gerado**
- Backend tem código para 3 formatos
- Mas análise dos casos mostra 99% formato 1 (diferencial)
- Formato 2 (critério ausente) e 3 (intervenção) raros

**Causa:** Random selection não está balanceado
```javascript
// Atual: escolha "aleatória" viesada para formato 1
FORMATO 1: DIAGNÓSTICO DIFERENCIAL (40% dos casos)
FORMATO 2: CRITÉRIO AUSENTE (30% dos casos)
FORMATO 3: INTERVENÇÃO INDICADA (30% dos casos)
```
Mas na prática, formato 1 domina.

**Solução:** Forçar distribuição no banco
```javascript
// Ao popular banco, garantir:
- 40% dos casos são formato "differential"
- 30% dos casos são formato "criteria_absent"
- 30% dos casos são formato "intervention"

// Tag no banco:
case_content.question_format.format_type = "differential" | "criteria_absent" | "intervention"
```

---

## 4️⃣ MÓDULO: JORNADA TERAPÊUTICA (12 Sessões)

### 🎯 Propósito
Acompanhamento **longitudinal** de paciente através de 12 sessões - conceituação + intervenção + evolução.

### 📐 Estrutura Atual

```javascript
// Tabela: clinical_journeys
{
  "id": "uuid",
  "title": "Maria - TAG e Perfeccionismo",
  "disorder_category": "anxiety",
  "difficulty_level": "intermediate",
  "total_sessions": 12,
  "status": "active",

  "patient_profile": {
    "name": "Maria",
    "age": 34,
    "occupation": "Arquiteta",
    "diagnosis": "TAG + Perfeccionismo",
    "core_issues": ["Crença de incompetência", "Necessidade de controle"]
  },

  "sessions": [
    {
      "session_number": 1,
      "title": "Avaliação Inicial",
      "goals": ["Estabelecer rapport", "Coletar história"],
      "content": "Vinheta da sessão...",
      "therapist_dilemmas": ["Quanto aprofundar na primeira sessão?"],
      "metrics": {
        "rapport_built": 0-100,
        "insight_gained": 0-100,
        "behavioral_change": 0-100,
        "symptom_reduction": 0-100
      }
    },
    // ... 11 mais sessões
  ]
}

// Tabela: user_journey_progress
{
  "user_id": "uuid",
  "journey_id": "uuid",
  "current_session": 1-12,
  "total_rapport": 0-1200, // soma das 12 sessões
  "total_insight": 0-1200,
  "total_behavioral_change": 0-1200,
  "total_symptom_reduction": 0-1200
}
```

### ✅ ELEMENTOS FORMATIVOS EXISTENTES

#### 1. Métricas Multidimensionais
Não é só "certo/errado" - são 4 dimensões:
- **Rapport:** Aliança terapêutica construída
- **Insight:** Compreensão do paciente sobre seus padrões
- **Mudança Comportamental:** Ações diferentes
- **Redução de Sintomas:** Melhora objetiva

#### 2. Evolução Longitudinal
Decisões em sessão 3 afetam sessão 7 - realismo terapêutico.

### ⚠️ GAPS CRÍTICOS (MÓDULO MENOS DESENVOLVIDO)

#### 1. **Backend Está Incompleto**
- Rotas básicas (list, get, start) existem
- **MAS NÃO HÁ:**
  - Rota para submeter decisão de sessão
  - Lógica de cálculo de métricas (rapport, insight, etc)
  - Feedback formativo por sessão
  - Sistema de "desfechos" (o que acontece no final)

#### 2. **Não Há Jornadas Populadas**
Similar ao problema de conceituação - banco vazio.

#### 3. **Falta Conexão com Teoria TCC**
- Não cita protocolos (Clark & Beck para TAG, Barlow para Pânico)
- Não explica FASES da terapia (avaliação → conceitualização → intervenção → prevenção de recaída)
- Não ensina QUANDO usar quais técnicas

**Solução: Template de Jornada Estruturada**
```json
{
  "journey_template": {
    "disorder": "TAG",
    "protocol_source": "Clark & Beck (2010). Cognitive Therapy of Anxiety Disorders",

    "phases": [
      {
        "phase": "Avaliação e Socialização (Sessões 1-2)",
        "goals": ["Rapport", "História", "Psicoeducação modelo cognitivo"],
        "techniques": ["Entrevista clínica", "Psicoeducação", "Diagrama cognitivo"],
        "source": "Beck (2011), Cap.3"
      },
      {
        "phase": "Conceituação (Sessões 3-4)",
        "goals": ["Identificar crenças", "Formular caso"],
        "techniques": ["Registro de pensamentos", "Seta descendente"],
        "source": "Beck (2011), Cap.8"
      },
      {
        "phase": "Intervenção (Sessões 5-9)",
        "goals": ["Reestruturação cognitiva", "Experimentos comportamentais"],
        "techniques": ["Questionamento socrático", "Exposição gradual", "Testes de hipótese"],
        "source": "Clark & Beck (2010), Cap.14"
      },
      {
        "phase": "Consolidação (Sessões 10-11)",
        "goals": ["Generalizar aprendizados", "Preparar término"],
        "techniques": ["Revisão de ganhos", "Plano de manutenção"],
        "source": "Beck (2011), Cap.18"
      },
      {
        "phase": "Término e Prevenção de Recaída (Sessão 12)",
        "goals": ["Encerrar terapia", "Plano de ação futuro"],
        "techniques": ["Carta ao eu futuro", "Cartão de enfrentamento"],
        "source": "Beck (2011), Cap.19"
      }
    ]
  }
}
```

---

## 🎓 KNOWLEDGE BASE UNIFICADO - PROPOSTA COMPLETA

### Princípios de Design

1. **Um Caso, Múltiplas Fontes**
   - Vinheta → inspirada em Greenberger (2015)
   - Critérios diagnósticos → DSM-5-TR
   - Crenças → Beck (2011)
   - Técnicas → Leahy (2017)

2. **Rastreabilidade Total**
   - Cada elemento tem `source` field
   - Estudante pode aprofundar lendo fonte original

3. **Feedback Formativo = Banco + IA**
   - **80% do conteúdo:** Banco de dados (consistente)
   - **20% personalização:** IA (adaptada ao usuário)

### Schema Completo do Knowledge Base

```sql
-- ============================================
-- 1. TRANSTORNOS (DSM-5-TR Estruturado)
-- ============================================
CREATE TABLE knowledge_disorders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identificação
  disorder_name TEXT NOT NULL, -- "Transtorno de Ansiedade Generalizada"
  dsm5_code TEXT, -- "300.02 (F41.1)"
  category TEXT, -- 'anxiety', 'mood', 'trauma', 'personality', 'psychotic', 'eating', 'substance'

  -- Critérios diagnósticos (DSM-5-TR)
  diagnostic_criteria JSONB NOT NULL,
  /*
  {
    "criterion_A": {
      "description": "Ansiedade e preocupação excessivas...",
      "duration": "Pelo menos 6 meses",
      "dsm5_page": "p.222"
    },
    "criterion_B": {...},
    "criterion_C": {...}
  }
  */

  -- Sintomas típicos
  typical_symptoms JSONB,
  /* ["Inquietação", "Fadiga fácil", "Dificuldade concentração", "Irritabilidade", "Tensão muscular", "Insônia"] */

  -- Sintomas associados (não critérios)
  associated_features JSONB,
  /* ["Cefaleia tensional", "Sintomas gastrointestinais", "Sudorese"] */

  -- Epidemiologia
  prevalence_rate FLOAT, -- 0.029 (2.9%)
  typical_onset_age TEXT, -- "adolescência tardia a adulto jovem"
  gender_ratio TEXT, -- "2:1 mulheres:homens"

  -- Curso
  course_description TEXT, -- "Crônico, com flutuações"

  -- Comorbidades comuns
  common_comorbidities JSONB,
  /* ["Depressão Maior (60%)", "Outros transtornos de ansiedade (50%)", "Uso de substâncias (20%)"] */

  -- Referências
  source_references JSONB,
  /*
  [
    {
      "type": "diagnostic_manual",
      "citation": "APA (2022). DSM-5-TR, p.222-226",
      "isbn": "978-0890425787"
    },
    {
      "type": "textbook",
      "citation": "Clark & Beck (2010). Cognitive Therapy of Anxiety Disorders, p.265-311"
    }
  ]
  */

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. CRENÇAS TÍPICAS POR TRANSTORNO
-- ============================================
CREATE TABLE knowledge_beliefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disorder_id UUID REFERENCES knowledge_disorders(id),

  -- Tipo de crença
  belief_type TEXT NOT NULL, -- 'core', 'intermediate', 'automatic'
  belief_content TEXT NOT NULL, -- "Sou incompetente e vulnerável"

  -- Contexto
  common_in_level TEXT, -- 'basic', 'intermediate', 'advanced'
  triggers JSONB, -- Situações que ativam esta crença
  /* ["Situações de avaliação", "Tarefas novas/desafiadoras", "Críticas"] */

  -- Exemplos de manifestação
  examples JSONB,
  /*
  [
    {
      "situation": "Apresentação no trabalho",
      "automatic_thought": "Vou travar e todos perceberão minha incompetência",
      "emotion": "Ansiedade intensa",
      "behavior": "Evita ou ensaia excessivamente"
    }
  ]
  */

  -- Desenvolvimento
  typical_origins TEXT, -- "Superproteção parental, críticas excessivas na infância"

  -- Fonte teórica
  source_author TEXT, -- "Beck, Judith"
  source_book TEXT, -- "Cognitive Therapy: Basics and Beyond"
  source_year INTEGER, -- 2011
  page_reference TEXT, -- "p.145-147"

  -- Técnicas de intervenção
  recommended_techniques JSONB,
  /* ["Seta descendente", "Questionamento socrático", "Experimentos comportamentais"] */

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. TRÍADES COGNITIVAS MAPEADAS
-- ============================================
CREATE TABLE knowledge_cognitive_triads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disorder_id UUID REFERENCES knowledge_disorders(id),

  -- Tríade completa
  typical_thoughts JSONB NOT NULL,
  /*
  [
    "Vou perder o controle",
    "Algo terrível vai acontecer",
    "Não vou conseguir lidar",
    "Preciso estar sempre preparado"
  ]
  */

  typical_emotions JSONB NOT NULL,
  /* ["Ansiedade intensa", "Medo", "Apreensão", "Nervosismo"] */

  typical_behaviors JSONB NOT NULL,
  /*
  [
    {
      "category": "evitacao",
      "behaviors": ["Evita situações incertas", "Procrastina decisões"]
    },
    {
      "category": "rituais",
      "behaviors": ["Reasseguramento excessivo", "Checagem compulsiva"]
    }
  ]
  */

  -- Ciclo de manutenção
  maintenance_cycle TEXT,
  /* "Preocupação → Ansiedade → Evitação → Alívio temporário → Reforça crença de vulnerabilidade → Mais preocupação" */

  -- Gatilhos típicos
  common_triggers JSONB,
  /* ["Incerteza", "Responsabilidade", "Mudanças", "Prazos"] */

  -- Fatores mantenedores
  maintaining_factors JSONB,
  /*
  [
    "Evitação impede teste de hipótese",
    "Reasseguramento reforça dependência",
    "Atenção seletiva para ameaças",
    "Interpretação catastrófica de sintomas"
  ]
  */

  -- Referência teórica
  source_reference TEXT,
  /* "Beck, A.T. et al (1985). Anxiety Disorders and Phobias, p.92-95" */

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. DIAGNÓSTICO DIFERENCIAL
-- ============================================
CREATE TABLE knowledge_differential_pairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Par de transtornos
  disorder_A_id UUID REFERENCES knowledge_disorders(id),
  disorder_B_id UUID REFERENCES knowledge_disorders(id),
  category TEXT, -- 'anxiety', 'mood', etc

  -- Diferenças-chave
  key_differences JSONB NOT NULL,
  /*
  {
    "symptom_focus": {
      "A_name": "Transtorno de Pânico",
      "A_focus": "Ataques súbitos e intensos com medo de morrer",
      "B_name": "TAG",
      "B_focus": "Preocupação crônica sobre múltiplos eventos futuros"
    },
    "duration_pattern": {
      "A": "Episódico (minutos), com períodos livres",
      "B": "Contínuo (meses), flutuante mas persistente"
    },
    "content_of_anxiety": {
      "A": "Medo de sensações corporais (palpitações, tontura)",
      "B": "Preocupação com eventos externos (trabalho, saúde, finanças)"
    },
    "avoidance_pattern": {
      "A": "Evita locais onde teve ataques (shopping, ônibus)",
      "B": "Evita decisões e situações incertas"
    }
  }
  */

  -- Referências DSM-5-TR
  dsm5_differential_table TEXT, -- "Tabela 3.1, DSM-5-TR p.211"
  dsm5_disorder_A_page TEXT, -- "p.208-209"
  dsm5_disorder_B_page TEXT, -- "p.222-226"

  -- Perguntas clínicas que diferenciam
  clinical_pearls TEXT,
  /*
  "Pânico: 'Você teve medo de morrer ou enlouquecer durante esses episódios?'
   TAG: 'Sobre quais áreas da vida você se preocupa? É difícil controlar essas preocupações?'"
  */

  -- Casos-exemplo
  example_vignettes JSONB,
  /*
  {
    "clearly_A": "João, 28a, relata 3 episódios nas últimas 2 semanas de palpitações súbitas...",
    "clearly_B": "Maria, 34a, preocupa-se diariamente há 10 meses sobre trabalho, saúde dos pais...",
    "ambiguous": "Carlos, 41a, ansioso há 6 meses. Preocupa-se com saúde mas também teve 2 episódios de palpitações..."
  }
  */

  -- Referências adicionais
  source_references JSONB,
  /*
  [
    "DSM-5-TR (2022)",
    "Clark & Beck (2010). Cognitive Therapy of Anxiety Disorders, p.265-311 (TAG), p.349-382 (Pânico)"
  ]
  */

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 5. TÉCNICAS DE INTERVENÇÃO
-- ============================================
CREATE TABLE knowledge_interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identificação
  technique_name TEXT NOT NULL, -- "Questionamento Socrático"
  technique_category TEXT, -- "reestruturacao_cognitiva", "exposicao", "ativacao_comportamental", etc

  -- Aplicabilidade
  indicated_for_disorders JSONB, -- Array de disorder_ids
  indicated_for_problems JSONB, -- ["Pensamentos catastróficos", "Evitação", "Rumina��ão"]

  -- Quando usar
  when_to_use TEXT,
  /* "Após rapport estabelecido e psicoeducação. Cliente demonstra curiosidade sobre seus pensamentos. NÃO usar se cliente muito emocionalmente ativado." */

  contraindications TEXT,
  /* "Evitar em: crise aguda, desregulação emocional intensa, ideação suicida ativa" */

  -- Protocolo passo a passo
  step_by_step JSONB,
  /*
  [
    {
      "step": 1,
      "action": "Identificar pensamento automático",
      "therapist_says": "Qual pensamento passou pela sua cabeça naquele momento?",
      "rationale": "Consciência é primeiro passo para mudança"
    },
    {
      "step": 2,
      "action": "Examinar evidências",
      "therapist_says": "Que evidências você tem de que isso é verdade?",
      "rationale": "Testar validade empírica do pensamento"
    },
    {...}
  ]
  */

  -- Exemplos clínicos
  clinical_examples JSONB,
  /*
  [
    {
      "disorder": "TAG",
      "situation": "Cliente: 'Vou ser demitido com certeza'",
      "therapist_response": "Que evidências você tem? Já aconteceu algo que indique isso?",
      "expected_outcome": "Cliente percebe que não há evidências concretas, apenas interpretação"
    }
  ]
  */

  -- Evidências de eficácia
  efficacy_level TEXT, -- 'empirically_supported', 'probably_efficacious', 'promising', 'experimental'
  research_references JSONB,
  /*
  [
    {
      "study": "Butler et al. (2006). Meta-analysis of CBT",
      "finding": "Questionamento socrático é componente essencial de TCC eficaz",
      "effect_size": "d = 0.95 (large)"
    }
  ]
  */

  -- Fonte teórica
  source_author TEXT, -- "Padesky, Christine"
  source_book TEXT, -- "Socratic Questioning in Cognitive Therapy"
  source_year INTEGER,
  page_reference TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 6. CASOS MODELO (Gold Standard)
-- ============================================
CREATE TABLE knowledge_case_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disorder_id UUID REFERENCES knowledge_disorders(id),

  -- Metadados
  difficulty_level TEXT, -- 'basic', 'intermediate', 'advanced'
  case_type TEXT, -- 'micro_moment', 'conceptualization', 'diagnostic', 'journey_session'

  -- Caso completo
  vignette TEXT NOT NULL, -- 300-400 palavras

  -- Para conceituação
  cognitive_triad JSONB,
  beliefs JSONB, -- core, intermediate, automatic
  formulation TEXT, -- Formulação completa
  intervention_plan JSONB,

  -- Para diagnóstico
  differential_options JSONB, -- 4 opções plausíveis
  correct_diagnosis TEXT,
  diagnostic_reasoning TEXT,

  -- Para micro-momento
  moment_type TEXT,
  expert_choice TEXT,
  expert_reasoning JSONB,
  learning_point JSONB,

  -- Qualidade
  quality_score FLOAT DEFAULT 5.0, -- 1-5
  reviewed_by TEXT, -- Nome psicóloga que aprovou
  reviewed_at TIMESTAMP,

  -- Fonte
  source_type TEXT, -- 'book_example', 'clinical_case_anonimized', 'created_by_expert', 'adapted_from_literature'
  source_reference TEXT,
  /* "Adaptado de: Greenberger & Padesky (2015). Mind Over Mood, Case Study 3, p.78-82" */

  -- Pedagogia
  learning_objectives JSONB,
  /* ["Identificar tríade cognitiva", "Diferenciar crenças centrais vs intermediárias", "Propor técnica adequada"] */

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 7. REFERÊNCIAS BIBLIOGRÁFICAS
-- ============================================
CREATE TABLE knowledge_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tipo
  reference_type TEXT NOT NULL, -- 'book', 'article', 'guideline', 'manual', 'chapter'

  -- Bibliográfico
  authors JSONB NOT NULL, -- ["Beck, Judith S."] ou ["Beck, A.T.", "Rush, A.J.", "Shaw, B.F."]
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  publisher TEXT,
  isbn TEXT,
  doi TEXT,

  -- Detalhes
  edition TEXT, -- "2nd edition"
  pages TEXT, -- "p.145-167" se for capítulo

  -- Relevância
  topics JSONB, -- ["TAG", "Conceituação cognitiva", "Crenças centrais"]
  credibility_score INTEGER DEFAULT 5, -- 1-5 (Beck = 5, blog random = 1)

  -- Acesso
  pdf_url TEXT,
  amazon_link TEXT,
  library_call_number TEXT,

  -- Resumo
  summary TEXT, -- Resumo executivo 2-3 parágrafos
  key_concepts JSONB, -- Conceitos-chave cobertos

  -- Citação formatada (APA 7)
  citation_apa TEXT,
  /* "Beck, J. S. (2011). Cognitive therapy: Basics and beyond (2nd ed.). Guilford Press." */

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 8. PROTOCOLOS TERAPÊUTICOS
-- ============================================
CREATE TABLE knowledge_therapy_protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identificação
  protocol_name TEXT NOT NULL, -- "Protocolo Clark & Beck para TAG"
  disorder_id UUID REFERENCES knowledge_disorders(id),

  -- Fases do tratamento
  phases JSONB NOT NULL,
  /*
  [
    {
      "phase_number": 1,
      "phase_name": "Avaliação e Socialização",
      "sessions": "1-2",
      "goals": ["Estabelecer rapport", "Coletar história", "Psicoeducar modelo cognitivo"],
      "techniques": ["Entrevista clínica", "Psicoeducação", "Diagrama cognitivo TAG"],
      "homework": ["Registro de preocupações (frequência e duração)"],
      "expected_outcomes": ["Cliente entende modelo cognitivo", "Aliança terapêutica sólida"],
      "source": "Clark & Beck (2010), Cap.13, p.265-275"
    },
    {
      "phase_number": 2,
      "phase_name": "Conceituação de Caso",
      "sessions": "3-4",
      "goals": ["Identificar crenças nucleares", "Formular caso"],
      "techniques": ["Seta descendente", "História de vida", "Análise funcional"],
      "homework": ["Registro de pensamentos automáticos"],
      "expected_outcomes": ["Formulação clara do caso", "Cliente identifica padrões"],
      "source": "Clark & Beck (2010), Cap.13, p.276-285"
    },
    {...fase 3, 4, 5}
  ]
  */

  // Duração típica
  typical_duration TEXT, -- "12-16 sessões"

  // Critérios de sucesso
  success_criteria JSONB,
  /* ["Redução ≥50% nos escores de ansiedade", "Cliente usa técnicas independentemente", "Melhora funcional (trabalho, relações)"] */

  // Fonte
  source_reference TEXT,
  /* "Clark, D.A., & Beck, A.T. (2010). Cognitive Therapy of Anxiety Disorders: Science and Practice. Guilford Press." */
  source_pages TEXT, -- "p.265-350"

  // Evidências
  empirical_support JSONB,
  /*
  [
    {
      "study": "Borkovec & Costello (1993)",
      "finding": "TCC superior a relaxamento aplicado",
      "effect_size": "d = 1.15"
    }
  ]
  */

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 9. INSIGHTS E DICAS CLÍNICAS
-- ============================================
CREATE TABLE knowledge_clinical_pearls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  // Categorização
  pearl_type TEXT, -- 'diagnostic_tip', 'intervention_timing', 'common_mistake', 'therapeutic_stance'
  disorders JSONB, -- Array de disorder_ids relevantes

  // Conteúdo
  title TEXT NOT NULL, -- "Como diferenciar preocupação normal de TAG"
  content TEXT NOT NULL,
  /*
  "TAG: preocupação EXCESSIVA e INCONTROLÁVEL sobre MÚLTIPLAS áreas, causando SOFRIMENTO SIGNIFICATIVO.
   Preocupação normal: proporcional ao evento, controlável, não interfere em funcionamento.
   Pergunta-chave: 'Você consegue interromper a preocupação quando quer?'"
  */

  // Contexto
  when_relevant TEXT, -- "Durante avaliação diagnóstica inicial"

  // Fonte
  source_expert TEXT, -- "Beck, Aaron T."
  source_reference TEXT,

  // Utilidade
  usefulness_rating FLOAT, -- Média de ratings de usuários
  times_referenced INTEGER DEFAULT 0, -- Quantas vezes foi citado em feedbacks

  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 ESTRATÉGIA DE POPULAÇÃ Ã€O - PRIORIDADES

### FASE 1: Fundação (1 semana)

**1.1 DSM-5-TR Estruturado**
- Popular `knowledge_disorders` com 20 transtornos mais comuns
- Focar em: Ansiedade (6), Humor (4), Trauma (3), Personalidade (4), Psicótico (3)
- Fonte: DSM-5-TR manual

**1.2 Diferenciais Críticos**
- Popular `knowledge_differential_pairs` com 30 pares mais confusos
- Exemplos:
  - TAG vs Pânico
  - Depressão Maior vs Distimia
  - TEPT vs Estresse Agudo vs TAG
  - Borderline vs Bipolar II
  - Esquizofrenia vs Transtorno Delirante

**1.3 Referências Base**
- Popular `knowledge_references` com livros essenciais:
  - Beck, J. (2011). Cognitive Therapy: Basics and Beyond
  - Beck, A.T. et al (1979). Cognitive Therapy of Depression
  - Clark & Beck (2010). Cognitive Therapy of Anxiety Disorders
  - Greenberger & Padesky (2015). Mind Over Mood
  - Leahy (2017). Cognitive Therapy Techniques
  - DSM-5-TR (2022)

### FASE 2: Conceituação (1 semana)

**2.1 Crenças Mapeadas**
- Popular `knowledge_beliefs` com crenças típicas por transtorno
- 10 crenças por transtorno (core + intermediate + automatic)
- Todas com fonte (Beck, Leahy, etc)

**2.2 Tríades Cognitivas**
- Popular `knowledge_cognitive_triads` para 20 transtornos
- Pensamentos → Emoções → Comportamentos
- Ciclos de manutenção

**2.3 Casos Modelo**
- Popular `knowledge_case_templates` com 30 casos gold standard
- 10 conceituação, 10 diagnóstico, 10 micro-momento
- Extrair de Greenberger & Padesky, Mind Over Mood

### FASE 3: Intervenção (1 semana)

**3.1 Técnicas TCC**
- Popular `knowledge_interventions` com 50 técnicas
- Protocolo passo a passo
- Quando usar / não usar
- Fonte: Leahy (2017)

**3.2 Protocolos Terapêuticos**
- Popular `knowledge_therapy_protocols` para 10 transtornos
- Fases (1-2-3-4-5)
- Baseado em Clark & Beck, Barlow, etc

### FASE 4: Refinamento (contínuo)

**4.1 Clinical Pearls**
- Adicionar insights conforme surgem
- Baseado em feedback de revisoras humanas

**4.2 Casos Reais Anonimizados**
- Adicionar casos aprovados por revisoras
- Enriquecer biblioteca

---

## 🤖 GPTs REVISADOS - INSTRUÇÕES COMPLETAS

Agora que mapeamos TUDO, as instruções dos GPTs serão muito mais poderosas.

**Próximo documento:** `GPT_INSTRUCTIONS_COMPLETE.md`
- GPT Gerador com acesso ao Knowledge Base
- GPT Supervisor Técnico (corretor ativo)
- GPT Supervisor Clínico (corretor ativo com fontes)

**Próximo passo sugerido:**
1. Popular Knowledge Base (DSM-5-TR + Beck + Greenberger)
2. Criar instruções dos 3 GPTs
3. Testar geração de 5 casos piloto
4. Revisar e iterar

---

## 📊 RESUMO EXECUTIVO

### ✅ O QUE ESTÁ BOM (Manter)

1. **Estrutura modular clara** - 4 módulos bem definidos
2. **Feedback em camadas** - Imediato → Raciocínio → Insight
3. **Learning points** - Padrões a reconhecer (ouro pedagógico!)
4. **Diversidade de formatos** - Diferencial, critério ausente, intervenção
5. **Métricas multidimensionais** - Rapport, insight, mudança, sintomas
6. **Economia de tokens pensada** - Cache cases, feedback curto

### ⚠️ GAPS CRÍTICOS (Resolver Urgente)

1. **ZERO casos de conceituação no banco** ❌
2. **Feedback 100% gerado por IA** (caro, inconsistente)
3. **Falta citação de fontes** (Beck, DSM-5, Leahy)
4. **Não há biblioteca de diferenciais**
5. **Jornada incompleta** (backend falta rotas)
6. **Não ensina COMO fazer** (assume conhecimento prévio)

### 🎯 SOLUÇÃO: Knowledge Base Unificado

**Antes:**
```
IA gera tudo do zero → Caro + Inconsistente + Sem fontes
```

**Depois:**
```
Banco tem fundação teórica → IA personaliza → Econômico + Consistente + Rastreável
```

**Resultado esperado:**
- 🔻 75% menos tokens
- ⬆️ Qualidade consistente
- 📚 Rastreabilidade completa (cita Beck p.X, DSM-5 p.Y)
- 💎 Feedback formativo de alto nível

---

**Próximos passos:**
1. ✅ Criar Knowledge Base (você aprova schema?)
2. ✅ Popular com fontes essenciais (Beck, DSM-5, Greenberger)
3. ✅ Criar instruções dos 3 GPTs
4. ✅ Gerar casos piloto
5. ✅ Revisoras testam
6. ✅ Iterar e refinar

**Posso começar agora criando os SQLs e instruções dos GPTs?** 🚀
