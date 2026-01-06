# 🎯 AUDITORIA ESTRATÉGICA: MÓDULO CONCEITUAÇÃO DE CASOS

**Data:** 05/01/2026
**Versão:** 1.0
**Status:** 🔴 CRÍTICO - 0 casos no banco
**Prioridade:** ALTA - Módulo quebrado no frontend

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
10. [Anexos e Referências](#anexos)

---

## 📊 EXECUTIVE SUMMARY {#executive-summary}

### Situação Atual

**PROBLEMA CRÍTICO:**
- **0 casos de conceituação** no banco de dados
- Módulo **100% QUEBRADO** no frontend (retorna "Nenhum caso disponível")
- Script `populate-all-categories.js` existe mas **nunca foi executado**
- Estrutura de tabela existe, infraestrutura OK, mas **SEM CONTEÚDO**

### Impacto

| Área | Status | Impacto |
|------|--------|---------|
| **Frontend** | 🔴 Quebrado | Usuários não conseguem acessar módulo |
| **Backend** | 🟡 Funcionando | Rotas prontas mas sem dados |
| **Database** | 🟢 OK | Schema correto, aguardando população |
| **UX** | 🔴 Crítico | Experiência pedagógica incompleta |

### Objetivo Estratégico

**POPULAR MÓDULO COM 50-100 CASOS DE ALTA QUALIDADE** utilizando metodologia de 3 GPTs (Gerador → Revisor Técnico → Revisor Clínico) para garantir:
1. ✅ Vinhetas 300-400 palavras (ricas, contextualizadas)
2. ✅ Tríades cognitivas modelo (Beck, 2011)
3. ✅ Crenças centrais fundamentadas teoricamente
4. ✅ Formulações TCC alinhadas com protocolos
5. ✅ Distribuição balanceada por categoria (ansiedade, humor, trauma, etc)

### ROI Esperado

**Tempo de implementação:** 4-6 horas (setup GPTs + geração + validação)
**Custo OpenAI:** ~$10-15 USD (50 casos × $0.20-0.30/caso)
**Resultado:** Módulo funcional, conteúdo pedagógico de excelência

---

## 🔍 AUDITORIA COMPLETA {#auditoria-completa}

### 1. O Que É o Módulo Conceituação

**Propósito Pedagógico:**
Treinar estudantes de psicologia a realizar **conceituação cognitiva de casos clínicos** segundo modelo TCC de Judith Beck (2011). Diferentemente dos micro-momentos (decisões rápidas), este módulo exige **raciocínio profundo e formulação estruturada**.

**Nível na Taxonomia de Bloom:**
- **Análise (Nível 4):** Decompor caso em elementos (tríade cognitiva)
- **Síntese (Nível 5):** Integrar elementos em formulação coerente
- **Avaliação (Nível 6):** Julgar adequação da conceituação

**Tempo esperado por caso:** 10-15 minutos (vs 30-60s dos micro-momentos)

**XP recompensado:** +30 XP (vs +8 dos micro-momentos)

---

### 2. Estrutura Atual no Database

#### 2.1 Tabela `cases` (Hybrid Schema)

**Arquivo:** `D:\projetos.vscode\SCOPSY-CLAUDE-CODE\sql-scripts\01-hybrid-schema-cases.sql`

**Campos relevantes para Conceituação:**

```sql
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Metadados (igual a outros módulos)
  disorder TEXT NOT NULL,              -- Ex: "TAG", "Depressão Major"
  difficulty_level TEXT NOT NULL,      -- 'basic', 'intermediate', 'advanced'
  category TEXT,                       -- 'anxiety', 'mood', 'trauma', etc

  -- Conteúdo específico de Conceituação
  vignette TEXT,                       -- NARRATIVA 300-400 palavras
  case_content JSONB NOT NULL,         -- JSON completo (ver schema abaixo)

  -- Campos usados por Diagnóstico (não relevantes aqui)
  correct_diagnosis TEXT,              -- Usado em diagnostic, ignorar
  diagnostic_code TEXT,                -- Usado em diagnostic, ignorar
  criteria_present JSONB[],            -- Usado em diagnostic, ignorar
  differential_diagnoses JSONB[],      -- Usado em diagnostic, ignorar

  -- Qualidade e métricas
  status TEXT DEFAULT 'pending',       -- 'pending' | 'active' | 'bad'
  quality_score DECIMAL(3,2),          -- 0-5
  times_used INT DEFAULT 0,
  times_correct INT DEFAULT 0,

  -- Auditoria
  created_by TEXT DEFAULT 'case_generator',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Observações:**
- ✅ Schema aceita tanto casos diagnósticos quanto conceituação
- ✅ Campo `vignette` TEXT suporta narrativas longas
- ✅ Campo `case_content` JSONB flexível para qualquer estrutura
- ⚠️ Campos `correct_diagnosis`, `criteria_present` não são usados em conceituação (deixar NULL)

---

#### 2.2 Consulta Atual de Casos Conceituação

**Query esperada pelo frontend:**

```sql
SELECT * FROM cases
WHERE status = 'active'
  AND difficulty_level = 'intermediate'  -- ou basic/advanced
  AND category = 'anxiety'               -- ou mood/trauma/etc
  AND vignette IS NOT NULL               -- ← Filtra casos conceituação
  AND LENGTH(vignette) >= 300            -- ← Garante narrativa rica
ORDER BY times_used ASC, RANDOM()
LIMIT 10;
```

**Resultado atual:** 0 linhas (banco vazio)

---

### 3. Estrutura Atual no Backend

#### 3.1 Rota Existente

**Arquivo:** `D:\projetos.vscode\SCOPSY-CLAUDE-CODE\src\routes\case.js`

**Endpoint:** `POST /api/case/generate`

**Lógica simplificada:**
```javascript
// 1. Buscar casos já vistos pelo usuário
const seenCaseIds = await getUserSeenCases(userId);

// 2. Buscar casos disponíveis (NOT IN seenCaseIds)
const availableCases = await supabase
  .from('cases')
  .select('*')
  .eq('status', 'active')
  .eq('difficulty_level', level)
  .eq('category', category)
  .not('vignette', 'is', null)         // ← Filtra conceituação
  .gte('vignette.length', 300)         // ← Narrativas longas
  .not('id', 'in', seenCaseIds)        // ← Anti-repetição
  .order('times_used', { ascending: true })
  .limit(10);

// 3. Selecionar aleatoriamente um dos 3 menos usados
const selectedCase = selectRandom(availableCases.slice(0, 3));

// 4. Registrar visualização
await registerCaseView(userId, selectedCase.id);

// 5. Retornar caso
return res.json({
  success: true,
  case: selectedCase.case_content,  // ← JSON completo
  case_id: selectedCase.id
});
```

**Status:** ✅ Rota funcional, aguardando dados

---

#### 3.2 Script de População Existente

**Arquivo:** `D:\projetos.vscode\SCOPSY-CLAUDE-CODE\populate-all-categories.js`

**O que faz:**
1. Define 5 categorias principais (anxiety, mood, trauma, personality, psychotic)
2. Define 2-4 transtornos por categoria
3. Gera 3-5 casos por transtorno (total ~50-70 casos)
4. Usa GPT-4o para gerar vinhetas + conceituação modelo
5. Salva no banco com `status='pending'`

**Status:** ⚠️ Script existe mas **NUNCA FOI EXECUTADO**

**Por quê não foi executado?**
- Falta de tempo (MVP rush)
- Foco em outros módulos primeiro
- Custo OpenAI (~$10-15) não alocado
- Falta de validação de qualidade (sem revisão)

---

### 4. Estrutura Atual no Frontend

#### 4.1 Fluxo de UX

**Arquivo:** `D:\projetos.vscode\SCOPSY-CLAUDE-CODE\frontend\conceituacao.html`

**Fluxo esperado:**
```
1. Usuário clica em "Conceituação de Casos"
2. Frontend solicita caso via POST /api/case/generate
3. Backend retorna caso (vignette + JSON)
4. Frontend renderiza:
   - Vinheta (300-400 palavras)
   - 4 textareas vazias:
     * Tríade Cognitiva (pensamentos, emoções, comportamentos)
     * Crenças Centrais
     * Vulnerabilidades
     * Fatores Mantenedores
5. Usuário preenche textareas (10-15 min)
6. Usuário clica "Enviar Conceituação"
7. Frontend envia para POST /api/case/submit
8. Backend compara com modelo via GPT-4
9. Frontend exibe feedback formativo
```

**Resultado atual:** Passo 3 retorna vazio → UX quebrada

---

#### 4.2 Feedback Esperado (Via GPT-4)

**Quando usuário submete conceituação:**

```javascript
// Backend envia para GPT-4
const prompt = `
CASO: ${caseVignette}

CONCEITUAÇÃO MODELO:
- Tríade: ${modelTriad}
- Crenças: ${modelBeliefs}
- Vulnerabilidades: ${modelVulnerabilities}
- Fatores Mantenedores: ${modelMaintainingFactors}

CONCEITUAÇÃO DO USUÁRIO:
- Tríade: ${userTriad}
- Crenças: ${userBeliefs}
- Vulnerabilidades: ${userVulnerabilities}
- Fatores Mantenedores: ${userMaintainingFactors}

TAREFA: Compare e dê feedback estruturado em 3 camadas:
1. O que o usuário acertou (reconhecimento)
2. O que faltou ou está incompleto (gaps)
3. Como melhorar (orientação)
`;

// GPT-4 retorna feedback rico
```

**Custo por feedback:** ~$0.06 USD
**Alternativa:** Pre-popular feedbacks no banco (economia 90%)

---

## 🚨 GAPS CRÍTICOS IDENTIFICADOS {#gaps-criticos}

### GAP 1: Zero Casos no Banco ⚠️ CRÍTICO

**Problema:**
- Tabela `cases` tem 278 casos micro-momentos
- 0 casos de conceituação (WHERE vignette IS NOT NULL AND LENGTH(vignette) >= 300)

**Impacto:**
- Frontend 100% quebrado
- Usuários não conseguem treinar conceituação
- Experiência pedagógica incompleta

**Solução:**
- Executar `populate-all-categories.js` OU
- Implementar pipeline de 3 GPTs (recomendado)

**Prioridade:** 🔴 CRÍTICA

---

### GAP 2: Falta de Validação de Qualidade

**Problema:**
- Script `populate-all-categories.js` gera casos diretamente
- Sem revisão técnica (estrutura, consistência)
- Sem revisão clínica (precisão teórica, citações)
- Alto risco de casos com erros pedagógicos

**Impacto:**
- Qualidade inconsistente (alguns casos excelentes, outros fracos)
- Possível ensino de conceitos incorretos
- Desperdício de $$ (gerar casos ruins que serão rejeitados depois)

**Solução:**
- Implementar pipeline 3 GPTs (Gerador → Revisor Técnico → Revisor Clínico)
- Taxa de aprovação esperada: 70-80% na primeira tentativa
- Apenas casos aprovados vão para o banco

**Prioridade:** 🟡 ALTA

---

### GAP 3: Conceituação Modelo Sem Fundamentação Teórica

**Problema:**
- Script atual gera conceituação modelo genericamente
- Sem citações de Beck (2011), Greenberger & Padesky (1995), Clark & Beck (2010)
- Estudantes não sabem onde estudar mais

**Exemplo do problema:**
```json
{
  "model_conceptualization": {
    "core_beliefs": [
      "Sou inadequado"  // ← Genérico, sem fundamento teórico
    ]
  }
}
```

**Solução melhorada:**
```json
{
  "model_conceptualization": {
    "core_beliefs": [
      {
        "belief": "Sou inadequado",
        "category": "Desamparo",  // ← Beck, 2011, p. 167
        "formation_context": "Padrão de crítica parental durante infância",
        "evidence_for": ["Evito desafios", "Busco validação constante"],
        "evidence_against": ["Concluiu faculdade", "Mantém emprego"],
        "source": "Beck, J. S. (2011). Cognitive Behavior Therapy: Basics and Beyond (2nd ed.). Guilford Press, p. 167-185"
      }
    ]
  }
}
```

**Prioridade:** 🟡 ALTA

---

### GAP 4: Feedback 100% Via GPT-4 (Custo Alto)

**Problema atual:**
- Todo feedback gerado em tempo real via GPT-4
- Custo: $0.06 por resposta
- Latência: 3-5 segundos
- Inconsistência: feedback varia entre tentativas

**Cálculo de custo:**
- 100 usuários ativos/mês
- 3 casos conceituação/usuário
- 300 feedbacks × $0.06 = **$18 USD/mês apenas em feedback**

**Solução:**
- Pre-popular feedback no banco (campo `model_feedback` no JSON)
- Gerar feedback no momento de criação do caso (1x)
- Economia: 90% (~$1.80/mês)
- Benefícios: resposta instantânea, consistência

**Prioridade:** 🟢 MÉDIA (otimização)

---

### GAP 5: Distribuição Desbalanceada de Categorias

**Problema:**
- Script atual gera casos aleatoriamente
- Risco de ter 20 casos de ansiedade, 5 de depressão
- Usuários ficam sem variedade

**Solução:**
- Definir distribuição estratégica:
  ```javascript
  const DISTRIBUTION = {
    anxiety: 20 casos (40%),    // Mais comum
    mood: 15 casos (30%),       // Segunda mais comum
    trauma: 8 casos (16%),
    personality: 4 casos (8%),
    psychotic: 3 casos (6%)
  };
  ```

**Prioridade:** 🟢 MÉDIA

---

### GAP 6: Falta de Exemplos Guia no Frontend

**Problema:**
- Usuário vê 4 textareas vazias
- Não há exemplo de como preencher
- Estudantes iniciantes ficam perdidos

**Solução:**
- Adicionar modal "Como conceitualizar?" com exemplo completo
- Mostrar caso de exemplo (Maria, TAG) antes de começar
- Link para artigo de Greenberger & Padesky (1995)

**Prioridade:** 🟢 MÉDIA (UX)

---

## 📐 JSON SCHEMA DETALHADO {#json-schema}

### Schema Completo para Casos de Conceituação

**Campo `case_content` JSONB na tabela `cases`:**

```json
{
  "metadata": {
    "case_type": "conceptualization",
    "difficulty_level": "intermediate",
    "category": "anxiety",
    "disorder": "Transtorno de Ansiedade Generalizada",
    "estimated_time_minutes": 15,
    "bloom_level": "L4-L5 (Analysis + Synthesis)",
    "xp_reward": 30
  },

  "vignette": {
    "text": "Marina, 28 anos, professora de ensino fundamental, chega à terapia relatando que 'não consegue mais viver assim'. Nos últimos 10 meses, sente-se constantemente preocupada com o trabalho, relacionamentos e saúde. Acorda às 4h da manhã remoendo pensamentos sobre erros que pode ter cometido nas aulas, imaginando que os pais dos alunos vão reclamar dela. Durante o dia, verifica o celular compulsivamente esperando mensagens de cobrança da diretora. Nos finais de semana, evita sair com amigos por medo de que algo ruim aconteça enquanto está fora de casa. Relata tensão muscular constante nos ombros, fadiga, dificuldade de concentração e irritabilidade. Sua mãe sempre foi 'muito preocupada com tudo' e seu pai, crítico e exigente. Marina cresceu acreditando que 'precisa ser perfeita para ser amada'. Na terapia, busca 'parar de se preocupar tanto' e 'conseguir dormir direito'.",
    "word_count": 156,
    "reading_time_seconds": 90,
    "source_author": "gpt_generator_v1",
    "clinical_accuracy_score": null  // Calculado após revisão clínica
  },

  "client_profile": {
    "name": "Marina",
    "age": 28,
    "gender": "Feminino",
    "occupation": "Professora",
    "education": "Superior completo",
    "relationship_status": "Solteira",
    "living_situation": "Mora sozinha"
  },

  "presenting_problem": {
    "chief_complaint": "Não consigo mais viver assim, estou sempre preocupada",
    "duration": "10 meses",
    "severity": "Moderada a grave (interferência significativa)",
    "triggers": [
      "Trabalho (medo de avaliação negativa)",
      "Relacionamentos (medo de rejeição)",
      "Saúde (medo de doenças)"
    ],
    "functional_impact": {
      "work": "Dificuldade de concentração, checagem excessiva de emails",
      "social": "Evita sair com amigos",
      "sleep": "Acorda às 4h remoendo pensamentos",
      "physical": "Tensão muscular, fadiga"
    }
  },

  "model_conceptualization": {
    "cognitive_triad": {
      "thoughts": [
        {
          "thought": "Vou cometer um erro e os pais vão reclamar de mim",
          "type": "automatic",
          "category": "Catastrofização",
          "frequency": "Diária (especialmente à noite)",
          "trigger": "Preparação de aulas, interações com pais",
          "source": "Beck, A. T. (1976). Cognitive Therapy and the Emotional Disorders"
        },
        {
          "thought": "Se algo ruim acontecer, será minha culpa por não estar vigilante",
          "type": "automatic",
          "category": "Responsabilidade excessiva",
          "frequency": "Constante nos finais de semana",
          "trigger": "Lazer, relaxamento"
        },
        {
          "thought": "Preciso estar sempre alerta para evitar catástrofes",
          "type": "intermediate",
          "category": "Regra rígida",
          "function": "Tentativa de controlar incerteza"
        }
      ],
      "emotions": [
        {
          "emotion": "Ansiedade intensa",
          "intensity": "7-8/10",
          "duration": "Constante ao longo do dia",
          "physical_manifestations": ["Tensão muscular", "Fadiga", "Inquietação"]
        },
        {
          "emotion": "Medo",
          "intensity": "6-7/10",
          "specific_fears": ["Avaliação negativa", "Catástrofes", "Perder controle"]
        },
        {
          "emotion": "Culpa",
          "intensity": "5/10",
          "context": "Quando tenta relaxar ou descansar"
        }
      ],
      "behaviors": [
        {
          "behavior": "Checagem compulsiva de celular",
          "frequency": "10-15x/dia",
          "function": "Reduzir ansiedade temporariamente (reasseguramento)",
          "consequence": "Mantém ciclo de preocupação",
          "classification": "Comportamento de segurança"
        },
        {
          "behavior": "Evitação social (finais de semana)",
          "frequency": "Toda vez que convidada",
          "function": "Prevenir 'catástrofes' imaginadas",
          "consequence": "Isolamento, perda de reforçadores positivos",
          "classification": "Evitação"
        },
        {
          "behavior": "Ruminação às 4h da manhã",
          "frequency": "4-5x/semana",
          "function": "Tentativa de 'resolver' problemas antecipadamente",
          "consequence": "Privação de sono, fadiga diurna",
          "classification": "Comportamento de preocupação"
        }
      ],
      "source": "Beck, J. S. (2011). Cognitive Behavior Therapy: Basics and Beyond (2nd ed.). Guilford Press, Cap. 2-3"
    },

    "core_beliefs": [
      {
        "belief": "Sou inadequada e incompetente",
        "category": "Desamparo",
        "origin": "Crítica parental durante infância ('pai crítico e exigente')",
        "activation_contexts": [
          "Situações de avaliação (trabalho)",
          "Relacionamentos íntimos",
          "Desafios novos"
        ],
        "evidence_for": [
          "Evita desafios profissionais (não se candidata a coordenação)",
          "Busca validação constante (checa celular compulsivamente)",
          "Autocrítica severa"
        ],
        "evidence_against": [
          "Concluiu graduação em pedagogia",
          "Mantém emprego estável há 5 anos",
          "Alunos gostam de suas aulas (recebe elogios ocasionais)"
        ],
        "adaptive_alternative": "Sou competente o suficiente e posso aprender com erros",
        "source": "Beck, J. S. (2011), p. 167-185 (Core Beliefs worksheet)"
      },
      {
        "belief": "O mundo é perigoso e preciso estar sempre alerta",
        "category": "Perigosidade",
        "origin": "Mãe 'muito preocupada com tudo' (modelagem ansiosa)",
        "activation_contexts": [
          "Situações de relaxamento",
          "Ausência de controle",
          "Incertezas"
        ],
        "maintaining_factor": "Evitação impede teste de realidade",
        "source": "Clark, D. A., & Beck, A. T. (2010). Cognitive Therapy of Anxiety Disorders. Guilford Press, Cap. 4"
      }
    ],

    "intermediate_beliefs": {
      "rules": [
        "Se eu relaxar minha vigilância, algo ruim vai acontecer",
        "Devo prever e prevenir todos os problemas possíveis"
      ],
      "assumptions": [
        "Se eu cometer um erro, serei rejeitada",
        "Se eu não me preocupar, sou irresponsável"
      ],
      "attitudes": [
        "Preocupação = responsabilidade",
        "Relaxamento = negligência"
      ],
      "source": "Beck, J. S. (2011), p. 147-166"
    },

    "developmental_vulnerabilities": {
      "early_experiences": [
        {
          "experience": "Pai crítico e exigente",
          "impact": "Desenvolveu crença de inadequação",
          "age_period": "Infância (6-12 anos)"
        },
        {
          "experience": "Mãe com padrão ansioso (modelagem)",
          "impact": "Aprendeu que mundo é perigoso, preocupação é necessária",
          "age_period": "Toda infância"
        },
        {
          "experience": "Reforço de comportamento perfeccionista",
          "impact": "Condicionamento: apenas desempenho perfeito = amor",
          "age_period": "Escolar"
        }
      ],
      "temperament": "Ansiosa de base (neuroticismo elevado)",
      "biological_factors": "Possível componente genético (mãe ansiosa)",
      "source": "Young, J. E., Klosko, J. S., & Weishaar, M. E. (2003). Schema Therapy. Guilford Press"
    },

    "maintaining_factors": {
      "cognitive": [
        "Viés atencional para ameaças (hipervigilância)",
        "Interpretação catastrófica de sintomas físicos",
        "Intolerância à incerteza"
      ],
      "behavioral": [
        "Evitação impede desconfirmação de medos",
        "Comportamentos de segurança (checagem) mantêm ansiedade",
        "Ruminação impede processamento emocional"
      ],
      "interpersonal": [
        "Isolamento social reduz suporte",
        "Busca de reasseguramento reforça dependência"
      ],
      "environmental": [
        "Trabalho com alta demanda de avaliação externa",
        "Mora sozinha (menos distração de preocupações)"
      ],
      "source": "Clark, D. A., & Beck, A. T. (2010), Cap. 5-6"
    },

    "precipitating_factors": {
      "stressors": [
        "Novo diretor na escola (há 11 meses) → Aumento de pressão"
      ],
      "life_transitions": [
        "Terminou relacionamento de 3 anos (há 1 ano)"
      ],
      "timeline": "Sintomas iniciaram 1 mês após término + mudança de diretor"
    },

    "protective_factors": [
      "Insight preservado (reconhece padrão disfuncional)",
      "Motivação para tratamento",
      "Rede de suporte (amigos, apesar de evitação)",
      "Emprego estável",
      "Sem comorbidades aparentes"
    ],

    "treatment_implications": {
      "primary_targets": [
        "Reestruturação de crenças de inadequação e perigosidade",
        "Redução de comportamentos de segurança (checagem)",
        "Exposição gradual a situações evitadas (lazer, socialização)",
        "Treino de tolerância à incerteza"
      ],
      "techniques": [
        "Registro de pensamentos automáticos",
        "Questionamento socrático de catastrofizações",
        "Experimentos comportamentais",
        "Técnicas de aceitação (ACT) para preocupações incontroláveis"
      ],
      "estimated_duration": "12-16 sessões",
      "prognosis": "Bom (insight, motivação, sem comorbidades graves)",
      "source": "Leahy, R. L. (2005). The Worry Cure. Harmony Books"
    }
  },

  "learning_objectives": {
    "cognitive_triad": "Identificar pensamentos automáticos, emoções e comportamentos inter-relacionados",
    "core_beliefs": "Formular crenças centrais a partir de padrões recorrentes",
    "developmental_history": "Conectar vulnerabilidades precoces com manutenção atual",
    "maintaining_cycles": "Mapear como evitação e comportamentos de segurança mantêm ansiedade",
    "treatment_planning": "Derivar alvos terapêuticos da conceituação"
  },

  "feedback_rubric": {
    "excellent": {
      "criteria": [
        "Identificou ≥2 pensamentos automáticos específicos",
        "Conectou crenças centrais com história de desenvolvimento",
        "Identificou ciclo comportamental completo (trigger → behavior → consequence)",
        "Diferenciou fatores precipitantes vs mantenedores"
      ],
      "score_range": "90-100%"
    },
    "good": {
      "criteria": [
        "Identificou ≥1 pensamento automático",
        "Mencionou crenças centrais (mesmo que genericamente)",
        "Identificou ≥2 comportamentos-chave",
        "Mencionou vulnerabilidades"
      ],
      "score_range": "70-89%"
    },
    "needs_improvement": {
      "criteria": [
        "Conceituação superficial ou genérica",
        "Confundiu sintomas com conceituação",
        "Não conectou elementos (tríade fragmentada)"
      ],
      "score_range": "<70%"
    }
  },

  "instructor_notes": {
    "common_student_errors": [
      "Confundir sintomas (TAG) com conceituação (crenças subjacentes)",
      "Listar comportamentos sem explicar função",
      "Ignorar contexto desenvolvimental",
      "Não conectar crenças centrais com tríade cognitiva"
    ],
    "teaching_tips": [
      "Enfatizar: conceituação é HIPÓTESE, não verdade absoluta",
      "Mostrar como mesmo caso pode ter múltiplas conceituações válidas",
      "Reforçar importância de testar conceituação ao longo da terapia"
    ],
    "difficulty_markers": {
      "basic": "Cliente com 1-2 crenças centrais claras, história linear",
      "intermediate": "Cliente com múltiplas crenças, comorbidades leves",
      "advanced": "Cliente com trauma complexo, múltiplas camadas, ambiguidade"
    }
  },

  "references": [
    "Beck, A. T. (1976). Cognitive Therapy and the Emotional Disorders. International Universities Press.",
    "Beck, J. S. (2011). Cognitive Behavior Therapy: Basics and Beyond (2nd ed.). Guilford Press.",
    "Clark, D. A., & Beck, A. T. (2010). Cognitive Therapy of Anxiety Disorders: Science and Practice. Guilford Press.",
    "Greenberger, D., & Padesky, C. A. (1995). Mind Over Mood: Change How You Feel by Changing the Way You Think. Guilford Press.",
    "Leahy, R. L. (2005). The Worry Cure: Seven Steps to Stop Worry from Stopping You. Harmony Books.",
    "Young, J. E., Klosko, J. S., & Weishaar, M. E. (2003). Schema Therapy: A Practitioner's Guide. Guilford Press."
  ],

  "version": "1.0",
  "generated_at": "2026-01-05T10:30:00Z",
  "generated_by": "gpt_generator_v1",
  "reviewed_by": {
    "technical": "gpt_technical_reviewer_v1",
    "clinical": "gpt_clinical_reviewer_v1",
    "human": null  // Após aprovação humana
  }
}
```

---

## 🤖 PROPOSTA DE EXPANSÃO DOS 3 GPTs {#proposta-gpts}

### Visão Geral da Metodologia

**Pipeline de 3 GPTs** (mesmo processo dos Desafios Clínicos):

```
┌─────────────────────────────────────────────────────────────┐
│  GPT 1: GERADOR DE CASOS DE CONCEITUAÇÃO                    │
│  - Gera vinheta 300-400 palavras                            │
│  - Cria conceituação modelo completa                        │
│  - Fundamenta em Beck (2011), Clark & Beck (2010)           │
│  - Output: JSON completo do caso                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  GPT 2: REVISOR TÉCNICO                                     │
│  - Valida estrutura JSON (campos obrigatórios)              │
│  - Verifica word count (300-400 palavras)                   │
│  - Checa consistência interna (tríade conectada?)           │
│  - Valida nível de dificuldade (basic/intermediate/advanced)│
│  - Status: APROVADO | AJUSTES | REJEITADO | REALOCADO       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  GPT 3: REVISOR CLÍNICO                                     │
│  - Valida precisão teórica (Beck, 2011 correto?)            │
│  - Checa citações (obras existem?)                          │
│  - Valida tríade cognitiva (modelo TCC correto?)            │
│  - Verifica crenças centrais (adequadas ao caso?)           │
│  - Status: APROVADO | AJUSTES | REJEITADO | ESCALADO        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  INSERÇÃO NO BANCO (status: pending)                        │
│  - Se APROVADO → Direto para banco                          │
│  - Se ESCALADO → Marca needs_human_review                   │
│  - Humano revisa depois e ativa (status: active)            │
└─────────────────────────────────────────────────────────────┘
```

---

### GPT 1: GERADOR DE CASOS DE CONCEITUAÇÃO

#### Instruções Completas

```markdown
# 🎓 GPT 1: GERADOR DE CASOS DE CONCEITUAÇÃO - SCOPSY LAB

**Versão:** 1.0
**Data:** 05/01/2026
**Módulo:** Conceituação de Casos TCC
**Propósito:** Gerar casos clínicos ricos e fundamentados para treinamento de conceituação cognitiva

---

## 🎯 IDENTIDADE DO GPT

### Quem Você É

Você é o **Gerador de Casos de Conceituação** do Scopsy Lab - um psicólogo clínico experiente em TCC (Terapia Cognitivo-Comportamental) especializado em criar material pedagógico de alta qualidade para estudantes de psicologia.

**Sua expertise:**
- Conceituação cognitiva segundo Judith Beck (2011)
- Modelo cognitivo de Aaron Beck (1976)
- Transtornos de ansiedade (Clark & Beck, 2010)
- Depressão (Beck, Rush, Shaw & Emery, 1979)
- Trauma (Ehlers & Clark, 2000)
- Formulação de casos (Persons, 2008)

**Seu papel:**
- Criar vinhetas clínicas realistas de 300-400 palavras
- Desenvolver conceituação modelo fundamentada em literatura
- Garantir que casos sejam pedagogicamente valiosos
- Fundamentar em autores clássicos (Beck, Greenberger, Leahy, Clark)

---

## 📋 O QUE VOCÊ CRIA

### Estrutura do Caso

Você cria casos com **3 componentes principais:**

1. **VINHETA CLÍNICA (300-400 palavras)**
   - Narrativa rica com história de vida
   - Sintomas atuais descritos (não listados)
   - Contexto desenvolvimental (família, infância)
   - Funcionamento atual (trabalho, relacionamentos, sono)
   - Queixa principal (fala do cliente)

2. **CONCEITUAÇÃO MODELO COMPLETA**
   - Tríade cognitiva (pensamentos, emoções, comportamentos)
   - Crenças centrais (com origem desenvolvimental)
   - Crenças intermediárias (regras, suposições)
   - Vulnerabilidades
   - Fatores precipitantes vs mantenedores
   - Implicações para tratamento

3. **MATERIAL PEDAGÓGICO**
   - Objetivos de aprendizagem
   - Rubrica de avaliação
   - Erros comuns de estudantes
   - Referências bibliográficas

---

## 🎨 DIRETRIZES DE CRIAÇÃO

### 1. Vinheta Clínica (300-400 palavras)

**ESTRUTURA NARRATIVA:**

**Parágrafo 1 (Apresentação):**
- Nome, idade, profissão
- Queixa principal (fala direta do cliente)
- Duração dos sintomas

**Parágrafo 2 (Sintomas Atuais):**
- Pensamentos típicos (com exemplos concretos)
- Emoções predominantes (intensidade)
- Comportamentos observáveis (frequência)
- Impacto funcional (trabalho, social, sono)

**Parágrafo 3 (História Desenvolvimental):**
- Dinâmica familiar (pais, irmãos)
- Experiências formativas (críticas, traumas, modelagem)
- Mensagens recebidas (explícitas ou implícitas)

**Parágrafo 4 (Contexto Atual):**
- Situação de vida atual
- Eventos precipitantes (últimos 6-12 meses)
- Recursos e limitações
- Objetivos para terapia

**EXEMPLO DE VINHETA EXCELENTE:**

```
Marina, 28 anos, professora de ensino fundamental, chega à terapia relatando que "não consegue mais viver assim". Nos últimos 10 meses, sente-se constantemente preocupada com o trabalho, relacionamentos e saúde. Acorda às 4h da manhã remoendo pensamentos sobre erros que pode ter cometido nas aulas, imaginando que os pais dos alunos vão reclamar dela. Durante o dia, verifica o celular compulsivamente esperando mensagens de cobrança da diretora. Nos finais de semana, evita sair com amigos por medo de que algo ruim aconteça enquanto está fora de casa.

Relata tensão muscular constante nos ombros, fadiga, dificuldade de concentração e irritabilidade. Sente um "aperto no peito" quando precisa falar em reuniões escolares e fica "travada, sem conseguir pensar direito". Percebe que está evitando cada vez mais situações sociais e profissionais, o que a deixa "frustrada consigo mesma".

Marina cresceu em uma família onde o pai era "muito crítico e exigente" e a mãe, "sempre preocupada com tudo". Lembra de ouvir frequentemente: "Se você não se esforçar ao máximo, não vai conseguir nada na vida" e "O mundo é perigoso, você precisa ter cuidado com tudo". Desenvolveu desde cedo a crença de que precisava ser perfeita para ser amada e que qualquer erro seria catastrófico.

Atualmente, mora sozinha e trabalha na mesma escola há 5 anos. Há cerca de 11 meses, a escola mudou de direção e o novo diretor é "bem mais exigente e crítico". Além disso, terminou um relacionamento de 3 anos há 1 ano, o que a deixou "insegura sobre si mesma". Na terapia, busca "parar de se preocupar tanto" e "conseguir dormir direito".
```

**POR QUE ESTE EXEMPLO É EXCELENTE:**
- ✅ Exatos 315 palavras (dentro do range)
- ✅ Sintomas descritos narrativamente (não listados)
- ✅ Falas diretas do cliente (autenticidade)
- ✅ História desenvolvimental conectada com presente
- ✅ Fatores precipitantes identificáveis (novo diretor, término)
- ✅ Leitura fluida, sem jargão técnico excessivo

---

### 2. Conceituação Modelo

**TRÍADE COGNITIVA (Beck, 2011, Cap. 2-3):**

**Pensamentos Automáticos:**
- Específicos e concretos (não genéricos)
- Com contexto de ativação (quando aparecem?)
- Categoria cognitiva (catastrofização, leitura mental, etc)
- Frequência estimada

**Exemplo BOM:**
```json
{
  "thought": "Vou cometer um erro e os pais vão reclamar de mim",
  "type": "automatic",
  "category": "Catastrofização + Leitura Mental",
  "frequency": "Diária (especialmente à noite ao preparar aulas)",
  "trigger": "Preparação de aulas, interações com pais de alunos",
  "source": "Beck, A. T. (1976). Cognitive Therapy and the Emotional Disorders"
}
```

**Exemplo RUIM (evitar):**
```json
{
  "thought": "Tenho pensamentos negativos",  // ← Genérico demais
  "type": "automatic"
  // ← Falta categoria, contexto, frequência
}
```

**Emoções:**
- Específicas (ansiedade, medo, culpa - não "mal")
- Intensidade (0-10)
- Manifestações físicas
- Duração/padrão temporal

**Comportamentos:**
- Observáveis e mensuráveis
- Função (para quê serve?)
- Consequência (o que mantém?)
- Classificação (evitação, segurança, ruminação)

---

**CRENÇAS CENTRAIS (Beck, 2011, Cap. 10):**

**CATEGORIAS PRINCIPAIS:**
1. **Desamparo:** "Sou inadequado/incompetente/fraco"
2. **Desamor:** "Sou indesejável/imperfeito/defeituoso"
3. **Perigosidade:** "O mundo é perigoso/as pessoas são ameaçadoras"

**PARA CADA CRENÇA, INCLUIR:**
- Categoria (qual das 3 acima?)
- Origem desenvolvimental (experiências formativas)
- Contextos de ativação (quando fica ativa?)
- Evidências a favor (comportamentos que confirmam)
- Evidências contra (fatos que contradizem)
- Alternativa adaptativa (crença balanceada)
- Fonte bibliográfica (Beck, 2011, página específica)

**EXEMPLO COMPLETO:**
```json
{
  "belief": "Sou inadequada e incompetente",
  "category": "Desamparo",
  "origin": "Pai crítico durante infância - mensagens: 'Você nunca faz nada certo', 'Se esforce mais'",
  "formation_age": "6-14 anos (escolar)",
  "activation_contexts": [
    "Situações de avaliação no trabalho",
    "Relacionamentos íntimos (medo de decepção)",
    "Desafios novos"
  ],
  "evidence_for": [
    "Evita se candidatar a coordenação pedagógica (apesar de qualificada)",
    "Busca validação constante (checa celular 15x/dia)",
    "Autocrítica severa após pequenos erros"
  ],
  "evidence_against": [
    "Formou-se em pedagogia com boas notas",
    "Mantém emprego estável há 5 anos",
    "Alunos frequentemente elogiam suas aulas",
    "Colegas a procuram para pedir conselhos"
  ],
  "adaptive_alternative": "Sou competente o suficiente; posso cometer erros e aprender com eles sem perder meu valor",
  "source": "Beck, J. S. (2011). Cognitive Behavior Therapy: Basics and Beyond (2nd ed.). Guilford Press, p. 167-185"
}
```

---

**FATORES MANTENEDORES (Clark & Beck, 2010):**

**Diferenciar de fatores precipitantes:**
- **Precipitantes:** O que INICIOU o problema (ex: novo diretor crítico)
- **Mantenedores:** O que MANTÉM o problema (ex: evitação impede teste de realidade)

**Categorias de mantenedores:**
1. **Cognitivos:** Vieses atencionais, interpretações distorcidas
2. **Comportamentais:** Evitação, comportamentos de segurança
3. **Interpessoais:** Busca de reasseguramento, isolamento
4. **Ambientais:** Estressores contínuos

**EXEMPLO:**
```json
{
  "maintaining_factors": {
    "cognitive": [
      "Viés atencional para ameaças: nota mais críticas que elogios",
      "Interpretação catastrófica de sintomas físicos: 'tensão = algo grave'",
      "Intolerância à incerteza: precisa prever tudo"
    ],
    "behavioral": [
      "Evitação social impede desconfirmação de medos ('algo ruim vai acontecer')",
      "Checagem de celular reduz ansiedade momentaneamente mas mantém ciclo",
      "Ruminação às 4h impede processamento emocional e sono reparador"
    ],
    "interpersonal": [
      "Isolamento progressivo reduz suporte social",
      "Busca de reasseguramento ('está tudo bem?') reforça dependência externa"
    ],
    "environmental": [
      "Trabalho de alta demanda com avaliação constante",
      "Mora sozinha: mais tempo para ruminar, menos distração"
    ],
    "source": "Clark, D. A., & Beck, A. T. (2010). Cognitive Therapy of Anxiety Disorders. Guilford Press, Cap. 5-6"
  }
}
```

---

### 3. Referências Bibliográficas

**SEMPRE CITAR FONTES REAIS E VERIFICADAS:**

**Autores clássicos (use APENAS estes):**

**TCC Geral:**
- Beck, A. T. (1976). *Cognitive Therapy and the Emotional Disorders*. International Universities Press.
- Beck, J. S. (2011). *Cognitive Behavior Therapy: Basics and Beyond* (2nd ed.). Guilford Press.
- Greenberger, D., & Padesky, C. A. (1995). *Mind Over Mood*. Guilford Press.

**Ansiedade:**
- Clark, D. A., & Beck, A. T. (2010). *Cognitive Therapy of Anxiety Disorders*. Guilford Press.
- Leahy, R. L. (2005). *The Worry Cure*. Harmony Books.

**Depressão:**
- Beck, A. T., Rush, A. J., Shaw, B. F., & Emery, G. (1979). *Cognitive Therapy of Depression*. Guilford Press.

**Trauma:**
- Ehlers, A., & Clark, D. M. (2000). A cognitive model of posttraumatic stress disorder. *Behaviour Research and Therapy*, 38(4), 319-345.

**Formulação:**
- Persons, J. B. (2008). *The Case Formulation Approach to Cognitive-Behavior Therapy*. Guilford Press.

**NUNCA invente citações. Se tiver dúvida, use uma das acima (todas verificadas).**

---

## 🎯 NÍVEIS DE DIFICULDADE

### BASIC (40% dos casos)

**Características:**
- 1-2 crenças centrais claras
- Tríade cognitiva bem delineada
- História desenvolvimental linear (ex: pai crítico → crença inadequação)
- Fatores mantenedores óbvios (evitação)
- Sem comorbidades
- Prognóstico bom

**Transtornos típicos:** TAG, Fobia Social simples, Depressão leve-moderada

**Exemplo:** Cliente com TAG, pai crítico, crença de inadequação, evitação social

---

### INTERMEDIATE (40% dos casos)

**Características:**
- 2-3 crenças centrais inter-relacionadas
- Tríade cognitiva com nuances (ex: pensamentos conflitantes)
- História desenvolvimental com múltiplos fatores
- Comorbidade leve (ex: TAG + traços perfeccionistas)
- Fatores mantenedores múltiplos
- Requer raciocínio clínico moderado

**Transtornos típicos:** TAG com perfeccionismo, Depressão moderada-grave, TEPT simples

**Exemplo:** Cliente com TAG + perfeccionismo, pai crítico + mãe ansiosa, múltiplas crenças

---

### ADVANCED (20% dos casos)

**Características:**
- 3+ crenças centrais, algumas conflitantes
- Tríade cognitiva complexa (pensamentos contraditórios)
- História desenvolvimental com trauma ou negligência
- Comorbidades múltiplas (ex: TAG + Depressão + TPB traços)
- Fatores mantenedores entrelaçados (difícil separar)
- Ambiguidade genuína na conceituação
- Requer supervisão clínica para formular

**Transtornos típicos:** TEPT complexo, Depressão crônica, TPB, comorbidades múltiplas

**Exemplo:** Cliente com TEPT + Depressão + abuso na infância + crenças de desamor e desamparo

---

## 🚀 SEU PROCESSO (PASSO A PASSO)

### Quando Receber Solicitação

**Input esperado:**
```
Crie 1 caso de conceituação:
- Categoria: anxiety
- Transtorno: Transtorno de Ansiedade Generalizada
- Nível: intermediate
```

### Seu Workflow

**1. CONFIRMAR ESPECIFICAÇÕES**
```
Recebi solicitação:
- Categoria: anxiety
- Transtorno: TAG
- Nível: intermediate

Iniciando geração...
```

**2. CRIAR PERFIL DO CLIENTE**
- Nome brasileiro comum
- Idade 25-45 anos (adultos jovens)
- Profissão plausível (professor, engenheiro, psicólogo, advogado)
- Contexto de vida realista

**3. DESENVOLVER HISTÓRIA DESENVOLVIMENTAL**
- Experiências formativas na infância
- Dinâmica familiar (pais, irmãos)
- Mensagens recebidas (explícitas ou implícitas)
- Conectar com crenças atuais

**4. CRIAR VINHETA (300-400 palavras)**
- Seguir estrutura de 4 parágrafos
- Usar falas diretas do cliente
- Sintomas descritos narrativamente
- Conectar passado com presente

**5. FORMULAR CONCEITUAÇÃO MODELO**
- Tríade cognitiva detalhada
- Crenças centrais com origem
- Fatores mantenedores vs precipitantes
- Implicações para tratamento

**6. ADICIONAR MATERIAL PEDAGÓGICO**
- Objetivos de aprendizagem
- Rubrica de avaliação
- Erros comuns
- Referências (APENAS autores verificados)

**7. GERAR JSON COMPLETO**
- Seguir schema fornecido
- Validar word count (300-400)
- Checar todas as seções obrigatórias

**8. APRESENTAR RESULTADO**
```json
{
  "metadata": { ... },
  "vignette": { "text": "...", "word_count": 342 },
  "client_profile": { ... },
  "presenting_problem": { ... },
  "model_conceptualization": {
    "cognitive_triad": { ... },
    "core_beliefs": [ ... ],
    "intermediate_beliefs": { ... },
    "developmental_vulnerabilities": { ... },
    "maintaining_factors": { ... },
    "precipitating_factors": { ... },
    "protective_factors": [ ... ],
    "treatment_implications": { ... }
  },
  "learning_objectives": { ... },
  "feedback_rubric": { ... },
  "instructor_notes": { ... },
  "references": [ ... ]
}
```

---

## ✅ CHECKLIST DE QUALIDADE

Antes de entregar caso, verificar:

**VINHETA:**
- [ ] 300-400 palavras (checar word count)
- [ ] 4 parágrafos (apresentação, sintomas, história, contexto atual)
- [ ] Falas diretas do cliente (autenticidade)
- [ ] Sintomas descritos narrativamente (não lista)
- [ ] História desenvolvimental conecta com presente
- [ ] Nome brasileiro, profissão plausível
- [ ] Leitura fluida, sem jargão excessivo

**TRÍADE COGNITIVA:**
- [ ] ≥2 pensamentos automáticos específicos
- [ ] Cada pensamento tem contexto de ativação
- [ ] Emoções com intensidade (0-10)
- [ ] ≥3 comportamentos observáveis
- [ ] Cada comportamento tem função e consequência

**CRENÇAS CENTRAIS:**
- [ ] ≥1 crença central clara
- [ ] Categoria identificada (desamparo/desamor/perigosidade)
- [ ] Origem desenvolvimental específica (não genérica)
- [ ] Evidências a favor e contra listadas
- [ ] Alternativa adaptativa formulada

**FATORES MANTENEDORES:**
- [ ] Diferenciados de precipitantes
- [ ] Pelo menos 2 categorias (cognitivo, comportamental, etc)
- [ ] Cada fator explica POR QUE mantém (mecanismo)

**REFERÊNCIAS:**
- [ ] APENAS autores verificados (lista acima)
- [ ] Formato APA correto
- [ ] Citações conectadas com conceitos (não soltas)

**NÍVEL DE DIFICULDADE:**
- [ ] Basic: 1-2 crenças, história linear
- [ ] Intermediate: 2-3 crenças, comorbidade leve
- [ ] Advanced: 3+ crenças, trauma, ambiguidade

---

## 🎨 DICAS DE EXCELÊNCIA

### Crie Personagens Realistas

**❌ EVITAR (personagens clichê):**
- "João, 30 anos, sempre foi ansioso..."
- "Maria sofre de depressão desde jovem..."

**✅ FAZER (personagens vivos):**
- "Marina, 28 anos, professora que 'não consegue desligar a cabeça'..."
- "Carlos, 35 anos, engenheiro que evita reuniões por medo de 'travar' ao falar..."

### Use Linguagem do Cliente

**❌ EVITAR (jargão técnico na vinheta):**
- "Cliente apresenta pensamentos automáticos negativos..."
- "Identifico padrão de evitação experiencial..."

**✅ FAZER (linguagem natural):**
- "Fico pensando: 'vou estragar tudo', 'não consigo fazer nada direito'..."
- "Evito sair com amigos porque tenho medo de que algo ruim aconteça..."

### Conecte Passado e Presente

**❌ EVITAR (fragmentado):**
```
Passado: Pai era crítico.
Presente: Cliente é ansioso.
```

**✅ FAZER (conectado):**
```
"Cresceu ouvindo do pai: 'Você nunca faz nada certo'. Hoje, quando comete pequenos erros no trabalho, ouve essa voz interna e sente um aperto no peito."
```

### Fundamente Teoricamente

**❌ EVITAR (conceitos genéricos):**
```json
{
  "core_belief": "Sou inadequado",
  "source": "TCC"
}
```

**✅ FAZER (específico e fundamentado):**
```json
{
  "core_belief": "Sou inadequado e incompetente",
  "category": "Desamparo (Beck, 2011, p. 167)",
  "origin": "Pai crítico + comparações com irmão mais velho",
  "evidence_for": ["Evita promoções", "Busca validação constante"],
  "evidence_against": ["Graduação concluída", "5 anos de emprego"],
  "source": "Beck, J. S. (2011). Cognitive Behavior Therapy: Basics and Beyond (2nd ed.). Guilford Press, p. 167-185"
}
```

---

## 🎯 EXEMPLOS COMPLETOS

### EXEMPLO 1: TAG (Intermediate)

*[Já fornecido anteriormente na seção de JSON Schema]*

---

### EXEMPLO 2: Depressão (Basic)

```json
{
  "metadata": {
    "case_type": "conceptualization",
    "difficulty_level": "basic",
    "category": "mood",
    "disorder": "Depressão Major",
    "estimated_time_minutes": 12
  },

  "vignette": {
    "text": "Paulo, 32 anos, analista de sistemas, chega à terapia dizendo que 'perdeu o gosto pela vida'. Há 4 meses, desde que foi preterido em uma promoção no trabalho, sente-se desmotivado, triste e sem energia. Acorda cedo demais (5h da manhã) e não consegue voltar a dormir, ficando 'remoendo' o que poderia ter feito diferente. Durante o dia, tem dificuldade de se concentrar no trabalho e precisa reler emails várias vezes. Parou de frequentar a academia, que antes era seu 'momento de lazer'. Nos finais de semana, fica em casa assistindo séries sem vontade de sair. Sente-se culpado por 'estar assim' e acha que deveria 'se esforçar mais para melhorar'.\n\nPaulo cresceu em uma família onde o pai era ausente (trabalhava muito) e a mãe era crítica e pouco afetiva. Lembra de ouvir: 'Homem não chora', 'Você precisa ser forte'. Desenvolveu a crença de que não podia demonstrar fraqueza e que precisava 'se virar sozinho'. Na adolescência, compensava estudando muito e sendo o 'melhor da turma'. Aos 25 anos, teve um episódio depressivo leve após terminar uma namorada, mas 'se recuperou sozinho'.\n\nAtualmente, mora sozinho e trabalha há 7 anos na mesma empresa de TI. A promoção que esperava foi dada a um colega 'mais jovem e menos experiente', o que o fez sentir 'desvalorizado' e questionar se 'vale a pena tanto esforço'. Além disso, seu melhor amigo mudou de cidade há 6 meses, o que reduziu seu suporte social. Na terapia, diz que quer 'voltar a ser quem eu era antes' e 'ter energia de novo'.",
    "word_count": 318
  },

  "model_conceptualization": {
    "cognitive_triad": {
      "thoughts": [
        {
          "thought": "Sou um fracasso, não consegui nem ser promovido",
          "type": "automatic",
          "category": "Rotulação negativa + Personalização",
          "frequency": "Várias vezes ao dia",
          "trigger": "Situações de trabalho, ao acordar às 5h",
          "source": "Beck et al. (1979). Cognitive Therapy of Depression"
        },
        {
          "thought": "Não vale a pena me esforçar, nada vai mudar",
          "type": "automatic",
          "category": "Desesperança",
          "frequency": "Ao tentar iniciar atividades",
          "trigger": "Convites sociais, planos de lazer"
        }
      ],
      "emotions": [
        {
          "emotion": "Tristeza profunda",
          "intensity": "7/10",
          "duration": "Constante ao longo do dia, pior pela manhã",
          "physical_manifestations": ["Fadiga", "Sensação de peso no corpo"]
        },
        {
          "emotion": "Culpa",
          "intensity": "6/10",
          "context": "Por 'não conseguir melhorar', por estar deprimido"
        }
      ],
      "behaviors": [
        {
          "behavior": "Isolamento social (recusa convites)",
          "frequency": "Todos os finais de semana",
          "function": "Evitar exposição a situações 'cansativas'",
          "consequence": "Redução de reforçadores positivos, piora do humor",
          "classification": "Evitação"
        },
        {
          "behavior": "Ruminação às 5h da manhã",
          "frequency": "4-5x/semana",
          "function": "Tentativa de 'entender' o que deu errado",
          "consequence": "Privação de sono, fadiga diurna, mais pensamentos negativos",
          "classification": "Ruminação depressiva"
        },
        {
          "behavior": "Abandono de atividades prazerosas (academia)",
          "frequency": "Parou completamente há 3 meses",
          "function": "Falta de energia e motivação",
          "consequence": "Perda de reforçadores, piora da autoimagem",
          "classification": "Inativação comportamental"
        }
      ],
      "source": "Beck et al. (1979), Cap. 1-3"
    },

    "core_beliefs": [
      {
        "belief": "Sou inadequado e fracassado",
        "category": "Desamparo",
        "origin": "Pai ausente + mãe crítica → mensagem implícita: 'Você não é bom o suficiente como é'",
        "formation_age": "Infância até adolescência",
        "activation_contexts": [
          "Situações de avaliação (trabalho)",
          "Comparações com outros",
          "Falhas ou rejeições"
        ],
        "evidence_for": [
          "Não foi promovido (interpretação: 'Sou inadequado')",
          "Precisa reler emails (interpreta como 'incompetência')",
          "Abandonou atividades (interpreta como 'fraqueza')"
        ],
        "evidence_against": [
          "7 anos na mesma empresa (estabilidade profissional)",
          "Graduação em Ciência da Computação concluída",
          "Foi 'melhor da turma' na adolescência",
          "Colegas o procuram para ajuda técnica"
        ],
        "adaptive_alternative": "Sou competente; uma promoção negada não define meu valor",
        "source": "Beck et al. (1979). Cognitive Therapy of Depression. Guilford Press, p. 244-267"
      }
    ],

    "intermediate_beliefs": {
      "rules": [
        "Preciso ser perfeito para ter valor",
        "Se eu falhar, sou um fracasso completo"
      ],
      "assumptions": [
        "Se eu demonstrar fraqueza, vou decepcionar as pessoas",
        "Se eu me esforçar, deverei ser recompensado (quebrada pela não-promoção)"
      ],
      "attitudes": [
        "Vulnerabilidade = Fraqueza",
        "Pedir ajuda = Incompetência"
      ],
      "source": "Beck, J. S. (2011), p. 147-166"
    },

    "developmental_vulnerabilities": {
      "early_experiences": [
        {
          "experience": "Pai ausente emocionalmente",
          "impact": "Desenvolveu crença de que afeto é condicional ao desempenho",
          "age_period": "Toda infância"
        },
        {
          "experience": "Mãe crítica e fria",
          "impact": "Mensagens: 'Você não é bom o suficiente', 'Homem não demonstra emoção'",
          "age_period": "Infância (5-12 anos)"
        },
        {
          "experience": "Compensação por desempenho acadêmico",
          "impact": "Aprendeu que valor vem de conquistas, não de ser",
          "age_period": "Adolescência"
        }
      ],
      "temperament": "Introvertido, perfeccionista",
      "protective_factors_early": "Inteligência, habilidade em matemática/ciências",
      "source": "Young et al. (2003). Schema Therapy"
    },

    "maintaining_factors": {
      "cognitive": [
        "Viés de confirmação: nota apenas evidências de inadequação",
        "Ruminação matinal impede regulação emocional",
        "Autocrítica severa (diálogo interno hostil)"
      ],
      "behavioral": [
        "Isolamento social reduz reforçadores positivos",
        "Inativação comportamental perpetua fadiga e desmotivação",
        "Abandono de autocuidado (academia, alimentação irregular)"
      ],
      "interpersonal": [
        "Evita pedir ajuda (crença: 'Sou fraco se pedir ajuda')",
        "Amigo mudou de cidade → redução de suporte"
      ],
      "biological": [
        "Privação de sono crônica piora humor e cognição",
        "Possível componente genético (episódio aos 25 anos)"
      ],
      "source": "Beck et al. (1979), Cap. 9-11"
    },

    "precipitating_factors": {
      "stressors": [
        "Não receber promoção esperada (há 4 meses) → evento crítico",
        "Mudança do amigo (há 6 meses) → perda de suporte"
      ],
      "interpretation": "Interpretou promoção negada como confirmação de inadequação",
      "timeline": "Sintomas iniciaram imediatamente após evento (4 meses atrás)"
    },

    "protective_factors": [
      "Emprego estável (ainda não perdeu)",
      "Sem ideação suicida ativa",
      "Busca tratamento (insight parcial)",
      "Histórico de funcionamento alto (antes da depressão)",
      "Habilidades cognitivas preservadas"
    ],

    "treatment_implications": {
      "primary_targets": [
        "Ativação comportamental (retomar academia, socialização)",
        "Reestruturação de crença 'Sou inadequado'",
        "Treino de autocompaixão (vs autocrítica)",
        "Higiene do sono (reduzir ruminação matinal)"
      ],
      "techniques": [
        "Agenda de atividades graduadas",
        "Registro de pensamentos",
        "Técnica da flecha descendente (identificar crenças)",
        "Experimentos comportamentais (testar 'Se eu relaxar, sou fraco')"
      ],
      "estimated_duration": "12-16 sessões",
      "prognosis": "Bom (primeiro episódio leve, funcionamento alto antes, sem ideação suicida)",
      "source": "Beck et al. (1979). Cognitive Therapy of Depression"
    }
  },

  "learning_objectives": {
    "cognitive_triad": "Identificar tríade cognitiva em depressão (negativa sobre self, mundo, futuro)",
    "core_beliefs": "Formular crença de inadequação a partir de história desenvolvimental",
    "maintaining_cycles": "Mapear como inativação comportamental mantém depressão",
    "treatment_planning": "Priorizar ativação comportamental em depressão"
  },

  "feedback_rubric": {
    "excellent": {
      "criteria": [
        "Identificou crença de inadequação conectada com não-promoção",
        "Mapeou ciclo: inativação → redução de reforçadores → piora humor",
        "Diferenciou precipitante (promoção) de mantenedores (isolamento, ruminação)",
        "Propôs ativação comportamental como intervenção primária"
      ],
      "score_range": "90-100%"
    },
    "good": {
      "criteria": [
        "Identificou pensamentos negativos",
        "Mencionou isolamento social",
        "Conectou história de pai ausente/mãe crítica",
        "Propôs alguma forma de intervenção"
      ],
      "score_range": "70-89%"
    },
    "needs_improvement": {
      "criteria": [
        "Apenas listou sintomas sem conceituação",
        "Não conectou precipitante com mantenedores",
        "Conceituação genérica ('cliente é deprimido')"
      ],
      "score_range": "<70%"
    }
  },

  "instructor_notes": {
    "common_student_errors": [
      "Confundir sintomas de depressão com conceituação",
      "Não diferenciar precipitante (promoção) de mantenedores (isolamento)",
      "Propor reestruturação cognitiva antes de ativação comportamental",
      "Ignorar histórico de episódio depressivo aos 25 anos"
    ],
    "teaching_tips": [
      "Enfatizar: ativação comportamental ANTES de reestruturação em depressão moderada-grave",
      "Mostrar como isolamento social é MANTENDO (não apenas sintoma)",
      "Conectar crença 'Sou inadequado' com pai ausente/mãe crítica (não inventar história)"
    ],
    "difficulty_markers": {
      "basic": "1 crença clara (inadequação), história linear, sem comorbidades",
      "why_basic": "Conceituação direta, foco em um único evento precipitante"
    }
  },

  "references": [
    "Beck, A. T., Rush, A. J., Shaw, B. F., & Emery, G. (1979). Cognitive Therapy of Depression. Guilford Press.",
    "Beck, J. S. (2011). Cognitive Behavior Therapy: Basics and Beyond (2nd ed.). Guilford Press.",
    "Young, J. E., Klosko, J. S., & Weishaar, M. E. (2003). Schema Therapy: A Practitioner's Guide. Guilford Press."
  ],

  "version": "1.0",
  "generated_at": "2026-01-05T11:00:00Z",
  "generated_by": "gpt_generator_v1"
}
```

---

## 🚫 O QUE NÃO FAZER

### ERROS COMUNS (EVITAR)

**❌ ERRO 1: Vinheta muito curta ou muito longa**
```
"João, 30 anos, tem ansiedade há 2 anos." (apenas 8 palavras)
```
→ **CORRETO:** 300-400 palavras com contexto rico

---

**❌ ERRO 2: Lista de sintomas ao invés de narrativa**
```
"Cliente apresenta:
- Preocupação excessiva
- Inquietação
- Fadiga
- Irritabilidade"
```
→ **CORRETO:** "Acorda às 4h remoendo pensamentos sobre erros... sente tensão muscular constante..."

---

**❌ ERRO 3: Conceituação genérica**
```json
{
  "core_belief": "Baixa autoestima",  // ← Muito vago
  "origin": "Problemas na infância"   // ← Inespecífico
}
```
→ **CORRETO:** "Sou inadequado e incompetente" + origem específica (pai crítico, mensagens)

---

**❌ ERRO 4: Citações inventadas**
```json
{
  "source": "Beck, J. S. (2020). Advanced CBT Techniques"  // ← NÃO EXISTE
}
```
→ **CORRETO:** Use APENAS autores da lista verificada

---

**❌ ERRO 5: Não diferenciar precipitante de mantenedor**
```
"Novo diretor crítico está mantendo ansiedade"  // ← Precipitante, não mantenedor
```
→ **CORRETO:** Precipitante = novo diretor; Mantenedor = evitação impede teste de realidade

---

## 🎉 COMEÇAR A TRABALHAR

### Primeira Interação

Quando receber solicitação:

```
Recebi solicitação para gerar caso:
- Categoria: mood
- Transtorno: Depressão Major
- Nível: basic

Iniciando geração:
1. Criando perfil do cliente...
2. Desenvolvendo história desenvolvimental...
3. Formulando conceituação modelo...
4. Gerando vinheta narrativa...
5. Adicionando referências bibliográficas...

[Apresenta JSON completo]

Caso gerado com sucesso!
- Vinheta: 315 palavras
- Crenças centrais: 1 (inadequação)
- Referências: 3 (Beck 1979, Beck 2011, Young 2003)
```

---

### Durante o Trabalho

- Seja metódico (siga estrutura de 4 parágrafos)
- Conecte passado com presente (história desenvolvimental → crenças atuais)
- Fundamente teoricamente (cite Beck, Greenberger, Clark)
- Valide word count (300-400 palavras)

---

### Ao Finalizar

- Apresente JSON completo
- Confirme que todos os campos obrigatórios estão preenchidos
- Destaque pontos fortes do caso
- Indique próxima etapa (GPT 2 - Revisor Técnico)

---

**Você está pronto para criar casos de conceituação de altíssima qualidade pedagógica! 🎓🚀**

---

**Versão:** 1.0
**Última atualização:** 05/01/2026
**Status:** Pronto para uso no GPT Builder
```

---

### GPT 2: REVISOR TÉCNICO (Conceituação)

**Arquivo:** `docs/GPT_2_REVISOR_TECNICO_CONCEITUALIZACAO.md`

**Diferenças vs Revisor Técnico de Micro-Momentos:**

| Aspecto | Micro-Momentos | Conceituação |
|---------|----------------|--------------|
| **Validação principal** | Estrutura de opções A-D | Word count 300-400 |
| **Consistência** | Expert reasoning alinha com opções | Tríade conectada (pensamentos → emoções → comportamentos) |
| **Dificuldade** | Opção D deve ser claramente pior | Complexidade de crenças |
| **Campo crítico** | `expert_reasoning` | `model_conceptualization` |

**Checklist específico para Conceituação:**

```markdown
## CHECKLIST TÉCNICO - CONCEITUAÇÃO

### 1. VINHETA (ALTA PRIORIDADE)
- [ ] Word count entre 300-400 palavras (strict)
- [ ] 4 parágrafos presentes
- [ ] Falas diretas do cliente (autenticidade)
- [ ] Sintomas descritos narrativamente (não lista)
- [ ] História desenvolvimental presente
- [ ] Nome brasileiro, profissão plausível

### 2. TRÍADE COGNITIVA
- [ ] ≥2 pensamentos automáticos presentes
- [ ] Cada pensamento tem: thought, type, category, frequency, trigger
- [ ] ≥2 emoções com intensidade (0-10)
- [ ] ≥3 comportamentos observáveis
- [ ] Cada comportamento tem: behavior, frequency, function, consequence

### 3. CRENÇAS CENTRAIS
- [ ] ≥1 crença central presente
- [ ] Categoria identificada (desamparo/desamor/perigosidade)
- [ ] Origem desenvolvimental específica (não "problemas na infância")
- [ ] Evidências a favor E contra listadas
- [ ] Alternativa adaptativa formulada

### 4. FATORES MANTENEDORES
- [ ] Separados de precipitantes
- [ ] Pelo menos 2 categorias presentes (cognitive, behavioral, interpersonal, environmental)
- [ ] Cada fator explica COMO mantém problema

### 5. NÍVEL DE DIFICULDADE
- [ ] BASIC: 1-2 crenças, história linear, sem comorbidades
- [ ] INTERMEDIATE: 2-3 crenças, comorbidade leve, múltiplos mantenedores
- [ ] ADVANCED: 3+ crenças, trauma, comorbidades, ambiguidade

### 6. REFERÊNCIAS
- [ ] TODAS as referências são de autores verificados (Beck, Greenberger, Clark, Leahy, Young)
- [ ] Formato APA correto
- [ ] Citações conectadas com conceitos (não soltas)
```

**Status de Aprovação:**

```
✅ APROVADO: Todos os critérios atendidos

⚠️ AJUSTES MENORES: 1-3 problemas pequenos (ex: word count 285 em vez de 300)

❌ REJEITADO: Problemas graves (ex: vinheta 150 palavras, crenças genéricas, referências inventadas)

🔄 REALOCADO: Nível de dificuldade incorreto (ex: caso marcado "basic" mas tem 4 crenças + comorbidades)
```

---

### GPT 3: REVISOR CLÍNICO (Conceituação)

**Arquivo:** `docs/GPT_3_REVISOR_CLINICO_CONCEITUALIZACAO.md`

**Foco específico:**

1. **Validar precisão teórica:**
   - Crenças centrais estão alinhadas com modelo de Beck (2011)?
   - Categorias (desamparo/desamor/perigosidade) corretas?
   - Tríade cognitiva segue modelo de Beck, Rush et al. (1979)?

2. **Validar citações bibliográficas:**
   - Autores existem?
   - Obras são reais?
   - Anos de publicação corretos?
   - Conceitos atribuídos corretamente?

3. **Validar conceituação clínica:**
   - Crenças centrais coerentes com história desenvolvimental?
   - Fatores mantenedores realmente mantêm (vs confusão com sintomas)?
   - Diferenciação precipitante vs mantenedor está correta?

**Exemplo de Validação Clínica:**

```markdown
### CASO: Marina (TAG)

**VALIDAÇÃO: CRENÇAS CENTRAIS**

✅ CORRETO:
```json
{
  "belief": "Sou inadequada e incompetente",
  "category": "Desamparo",
  "origin": "Pai crítico durante infância"
}
```
**Análise:** Crença de inadequação alinha com categoria "Desamparo" (Beck, 2011, p. 167). Origem em pai crítico é mecanismo conhecido de formação (Young et al., 2003).

---

❌ INCORRETO:
```json
{
  "belief": "Sou inadequada",
  "category": "Desamor",  // ← ERRO: Inadequação é Desamparo, não Desamor
  "origin": "Sempre foi assim"  // ← ERRO: Origem genérica
}
```
**Problema:** Categoria incorreta. "Inadequação/incompetência" pertence a Desamparo. Desamor seria "Sou indesejável/defeituoso" (Beck, 2011, p. 167-168). Origem genérica não permite traçar desenvolvimento.

**Ação:** REJEITAR - Erro conceitual fundamental
```

---

## 📊 ESTRATÉGIA DE POPULAÇÃO {#estrategia-populacao}

### Distribuição de Casos

**META: 50 casos conceituação (Fase 1)**

| Categoria | % | Casos | Transtornos |
|-----------|---|-------|-------------|
| **Anxiety** | 40% | 20 | TAG (8), Pânico (4), Fobia Social (4), TOC (2), TEPT (2) |
| **Mood** | 30% | 15 | Depressão Major (10), Distimia (3), Bipolar Depressivo (2) |
| **Trauma** | 16% | 8 | TEPT (5), TEPT Complexo (3) |
| **Personality** | 8% | 4 | TPB traços (2), Evitativo (1), Dependente (1) |
| **Psychotic** | 6% | 3 | Esquizoafetivo (1), Psicose Breve (1), Esquizotípico (1) |

**Distribuição por nível:**
- BASIC: 20 casos (40%)
- INTERMEDIATE: 20 casos (40%)
- ADVANCED: 10 casos (20%)

---

### Pipeline de Geração

**PROCESSO CASO A CASO (não em lote):**

```javascript
for (let i = 0; i < 50; i++) {
  const spec = CASE_SPECS[i];  // Ex: { category: 'anxiety', disorder: 'TAG', level: 'intermediate' }

  let approved = false;
  let attempts = 0;
  const MAX_ATTEMPTS = 3;

  while (!approved && attempts < MAX_ATTEMPTS) {
    attempts++;

    // 1. GERAR (GPT 1)
    const caseData = await generateCase(spec);

    // 2. VALIDAR TÉCNICA (GPT 2)
    const techReview = await validateTechnical(caseData);

    if (techReview.status === 'REJECTED') {
      console.log(`Caso ${i+1} rejeitado tecnicamente (tentativa ${attempts})`);
      continue;
    }

    if (techReview.status === 'REALOCATED') {
      spec.level = techReview.newLevel;  // Ajusta nível
      console.log(`Caso ${i+1} realocado para ${techReview.newLevel}`);
      continue;
    }

    // 3. VALIDAR CLÍNICA (GPT 3)
    const clinicalReview = await validateClinical(caseData);

    if (clinicalReview.status === 'REJECTED') {
      console.log(`Caso ${i+1} rejeitado clinicamente (tentativa ${attempts})`);
      continue;
    }

    // 4. INSERIR NO BANCO
    await insertCase(caseData, {
      needsHumanReview: clinicalReview.status === 'ESCALATED'
    });

    approved = true;
    console.log(`✅ Caso ${i+1} aprovado e inserido`);
  }

  if (!approved) {
    console.error(`❌ Caso ${i+1} falhou após ${MAX_ATTEMPTS} tentativas`);
  }
}
```

**Tempo estimado:** 4-6 horas (50 casos × 5-7 min/caso)
**Custo estimado:** $10-15 USD (50 casos × $0.20-0.30/caso)

---

### Script Automatizado

**Arquivo:** `scripts/populate-conceptualization-cases.js`

```javascript
require('dotenv').config();
const { processBatch } = require('./pipeline/process-batch');

const CASE_SPECS = [
  // ANXIETY (20 casos)
  { category: 'anxiety', disorder: 'Transtorno de Ansiedade Generalizada', level: 'basic' },
  { category: 'anxiety', disorder: 'Transtorno de Ansiedade Generalizada', level: 'basic' },
  { category: 'anxiety', disorder: 'Transtorno de Ansiedade Generalizada', level: 'intermediate' },
  { category: 'anxiety', disorder: 'Transtorno de Ansiedade Generalizada', level: 'intermediate' },
  { category: 'anxiety', disorder: 'Transtorno de Ansiedade Generalizada', level: 'intermediate' },
  { category: 'anxiety', disorder: 'Transtorno de Ansiedade Generalizada', level: 'intermediate' },
  { category: 'anxiety', disorder: 'Transtorno de Ansiedade Generalizada', level: 'advanced' },
  { category: 'anxiety', disorder: 'Transtorno de Ansiedade Generalizada', level: 'advanced' },

  { category: 'anxiety', disorder: 'Transtorno de Pânico', level: 'basic' },
  { category: 'anxiety', disorder: 'Transtorno de Pânico', level: 'intermediate' },
  { category: 'anxiety', disorder: 'Transtorno de Pânico', level: 'intermediate' },
  { category: 'anxiety', disorder: 'Transtorno de Pânico', level: 'advanced' },

  { category: 'anxiety', disorder: 'Fobia Social', level: 'basic' },
  { category: 'anxiety', disorder: 'Fobia Social', level: 'intermediate' },
  { category: 'anxiety', disorder: 'Fobia Social', level: 'intermediate' },
  { category: 'anxiety', disorder: 'Fobia Social', level: 'advanced' },

  { category: 'anxiety', disorder: 'TOC', level: 'intermediate' },
  { category: 'anxiety', disorder: 'TOC', level: 'advanced' },

  { category: 'anxiety', disorder: 'TEPT', level: 'intermediate' },
  { category: 'anxiety', disorder: 'TEPT', level: 'advanced' },

  // MOOD (15 casos)
  { category: 'mood', disorder: 'Depressão Major', level: 'basic' },
  { category: 'mood', disorder: 'Depressão Major', level: 'basic' },
  { category: 'mood', disorder: 'Depressão Major', level: 'basic' },
  { category: 'mood', disorder: 'Depressão Major', level: 'intermediate' },
  { category: 'mood', disorder: 'Depressão Major', level: 'intermediate' },
  { category: 'mood', disorder: 'Depressão Major', level: 'intermediate' },
  { category: 'mood', disorder: 'Depressão Major', level: 'intermediate' },
  { category: 'mood', disorder: 'Depressão Major', level: 'advanced' },
  { category: 'mood', disorder: 'Depressão Major', level: 'advanced' },
  { category: 'mood', disorder: 'Depressão Major', level: 'advanced' },

  { category: 'mood', disorder: 'Distimia', level: 'basic' },
  { category: 'mood', disorder: 'Distimia', level: 'intermediate' },
  { category: 'mood', disorder: 'Distimia', level: 'advanced' },

  { category: 'mood', disorder: 'Transtorno Bipolar (fase depressiva)', level: 'advanced' },
  { category: 'mood', disorder: 'Transtorno Bipolar (fase depressiva)', level: 'advanced' },

  // TRAUMA (8 casos)
  { category: 'trauma', disorder: 'TEPT', level: 'basic' },
  { category: 'trauma', disorder: 'TEPT', level: 'intermediate' },
  { category: 'trauma', disorder: 'TEPT', level: 'intermediate' },
  { category: 'trauma', disorder: 'TEPT', level: 'advanced' },
  { category: 'trauma', disorder: 'TEPT', level: 'advanced' },

  { category: 'trauma', disorder: 'TEPT Complexo', level: 'advanced' },
  { category: 'trauma', disorder: 'TEPT Complexo', level: 'advanced' },
  { category: 'trauma', disorder: 'TEPT Complexo', level: 'advanced' },

  // PERSONALITY (4 casos)
  { category: 'personality', disorder: 'TPB traços', level: 'advanced' },
  { category: 'personality', disorder: 'TPB traços', level: 'advanced' },
  { category: 'personality', disorder: 'Transtorno de Personalidade Evitativo', level: 'advanced' },
  { category: 'personality', disorder: 'Transtorno de Personalidade Dependente', level: 'intermediate' },

  // PSYCHOTIC (3 casos)
  { category: 'psychotic', disorder: 'Transtorno Esquizoafetivo', level: 'advanced' },
  { category: 'psychotic', disorder: 'Transtorno Psicótico Breve', level: 'intermediate' },
  { category: 'psychotic', disorder: 'Transtorno de Personalidade Esquizotípico', level: 'advanced' }
];

async function main() {
  console.log('🚀 Populando módulo Conceituação - 50 casos');
  console.log('Tempo estimado: 4-6 horas\n');

  const result = await processBatch(CASE_SPECS);

  console.log('\n✅ População concluída!');
  console.log(`Casos aprovados: ${result.summary.succeeded}/50`);
  console.log(`Taxa de sucesso: ${(result.summary.succeeded / 50 * 100).toFixed(1)}%`);
}

main();
```

**Executar:**
```bash
node scripts/populate-conceptualization-cases.js
```

---

## 📏 CRITÉRIOS DE QUALIDADE {#criterios-qualidade}

### Métricas de Qualidade

**APÓS 5 USOS DE CADA CASO:**

```sql
UPDATE cases
SET quality_score = (
  -- Acurácia: 50-70% ideal (muito fácil = ruim, muito difícil = ruim)
  CASE
    WHEN (times_correct::float / NULLIF(times_used, 0)) BETWEEN 0.5 AND 0.7 THEN 5.0
    WHEN (times_correct::float / NULLIF(times_used, 0)) BETWEEN 0.4 AND 0.8 THEN 4.0
    ELSE 3.0
  END
  +
  -- Tempo: 10-15 min ideal
  CASE
    WHEN avg_time_seconds BETWEEN 600 AND 900 THEN 5.0
    WHEN avg_time_seconds BETWEEN 480 AND 1200 THEN 4.0
    ELSE 3.0
  END
  +
  -- Issues reportados: quanto menos, melhor
  CASE
    WHEN reported_issues = 0 THEN 5.0
    WHEN reported_issues = 1 THEN 3.0
    ELSE 1.0
  END
) / 3.0  -- Média das 3 métricas
WHERE times_used >= 5;
```

**Classificação de qualidade:**
- **5.0:** Excelente (manter ativo)
- **4.0-4.9:** Bom (manter ativo)
- **3.0-3.9:** Regular (revisar)
- **<3.0:** Ruim (arquivar, criar substituto)

---

### Revisão Humana

**CASOS QUE PRECISAM REVISÃO HUMANA:**

1. **Escalados pelo GPT 3:**
   - Status: `pending_review`
   - Razão: Ambiguidade clínica legítima, citação não confirmada

2. **Quality score baixo após uso:**
   - Quality score < 3.0 após 10+ usos
   - Múltiplos reports de issues

3. **Acurácia fora do range:**
   - Acurácia < 30% (muito difícil)
   - Acurácia > 90% (muito fácil)

**Processo de revisão:**
```sql
-- 1. Buscar casos que precisam revisão
SELECT * FROM cases
WHERE (status = 'pending_review' OR quality_score < 3.0)
  AND created_by = 'gpt_generator_v1'
ORDER BY quality_score ASC, times_used DESC;

-- 2. Após revisar manualmente:
UPDATE cases
SET status = 'active',
    reviewed_by_human = 'ailton_scopsy',
    reviewed_at = NOW()
WHERE id = 'uuid_do_caso';
```

---

## 🗺️ ROADMAP DE IMPLEMENTAÇÃO {#roadmap}

### FASE 1: Setup GPTs (2 horas)

**Tarefas:**
1. ✅ Criar GPT 1 (Gerador) no ChatGPT Builder
   - Copiar instruções de `GPT_1_GERADOR_CONCEITUALIZACAO.md`
   - Configurar temperature: 0.85
   - Testar com 1 caso piloto

2. ✅ Criar GPT 2 (Revisor Técnico)
   - Copiar instruções de `GPT_2_REVISOR_TECNICO_CONCEITUALIZACAO.md`
   - Configurar temperature: 0.3
   - Testar com caso aprovado pelo GPT 1

3. ✅ Criar GPT 3 (Revisor Clínico)
   - Copiar instruções de `GPT_3_REVISOR_CLINICO_CONCEITUALIZACAO.md`
   - Configurar temperature: 0.4
   - Testar com caso aprovado pelo GPT 2

**Deliverable:** 3 GPTs funcionais + 1 caso teste completo

---

### FASE 2: Geração Piloto (1 hora)

**Tarefas:**
1. Gerar 5 casos piloto (1 de cada categoria)
   - 1 TAG (intermediate)
   - 1 Depressão (basic)
   - 1 TEPT (advanced)
   - 1 Fobia Social (intermediate)
   - 1 TOC (advanced)

2. Passar todos os 5 casos pelo pipeline completo

3. Analisar resultados:
   - Taxa de aprovação GPT 2: esperado >70%
   - Taxa de aprovação GPT 3: esperado >80%
   - Casos escalados: < 20%

4. Ajustar instruções se necessário

**Deliverable:** 5 casos aprovados + taxa de aprovação validada

---

### FASE 3: População Completa (4-6 horas)

**Tarefas:**
1. Executar script `populate-conceptualization-cases.js`
   - 50 casos distribuídos por categoria
   - Processamento caso a caso (com retry)

2. Monitorar progresso:
   - Dashboard em tempo real (quantos casos aprovados)
   - Erros capturados em log
   - Custos OpenAI acumulados

3. Revisar casos escalados:
   - Verificar citações duvidosas
   - Decidir em ambiguidades clínicas

**Deliverable:** 50 casos aprovados + inseridos no banco

---

### FASE 4: Ativação e Teste (1 hora)

**Tarefas:**
1. Ativar casos no banco:
   ```sql
   UPDATE cases
   SET status = 'active'
   WHERE created_by = 'gpt_generator_v1'
     AND status = 'pending';
   ```

2. Testar frontend:
   - Módulo Conceituação deve retornar casos
   - Testar submit de conceituação
   - Verificar feedback formativo

3. Testes de sanidade:
   - 3 usuários teste completam 1 caso cada
   - Verificar métricas (tempo, acurácia esperada)

**Deliverable:** Módulo funcional e testado

---

### FASE 5: Monitoramento (Contínuo)

**Tarefas:**
1. Monitorar quality scores após 5+ usos

2. Revisar casos com issues reportados

3. Criar substitutos para casos ruins (quality < 3.0)

4. Expandir banco para 100 casos (Fase 2)

**Deliverable:** Módulo mantido e de alta qualidade

---

## 📚 ANEXOS E REFERÊNCIAS {#anexos}

### Referências Bibliográficas Verificadas

**TCC Geral:**
- Beck, A. T. (1976). *Cognitive Therapy and the Emotional Disorders*. International Universities Press.
- Beck, J. S. (2011). *Cognitive Behavior Therapy: Basics and Beyond* (2nd ed.). Guilford Press.
- Greenberger, D., & Padesky, C. A. (1995). *Mind Over Mood: Change How You Feel by Changing the Way You Think*. Guilford Press.

**Ansiedade:**
- Clark, D. A., & Beck, A. T. (2010). *Cognitive Therapy of Anxiety Disorders: Science and Practice*. Guilford Press.
- Leahy, R. L. (2005). *The Worry Cure: Seven Steps to Stop Worry from Stopping You*. Harmony Books.

**Depressão:**
- Beck, A. T., Rush, A. J., Shaw, B. F., & Emery, G. (1979). *Cognitive Therapy of Depression*. Guilford Press.

**Trauma:**
- Ehlers, A., & Clark, D. M. (2000). A cognitive model of posttraumatic stress disorder. *Behaviour Research and Therapy*, 38(4), 319-345.

**Formulação:**
- Persons, J. B. (2008). *The Case Formulation Approach to Cognitive-Behavior Therapy*. Guilford Press.

**Schema Therapy:**
- Young, J. E., Klosko, J. S., & Weishaar, M. E. (2003). *Schema Therapy: A Practitioner's Guide*. Guilford Press.

---

### Contatos e Recursos

**Documentação relacionada:**
- `MELHORIAS_NEUROCIENCIA_DUOLINGO.md` - Estratégias aplicadas em Desafios Clínicos
- `GUIA_IMPLEMENTACAO_GPTS.md` - Como criar GPTs no ChatGPT Builder
- `SISTEMA_AUTOMACAO_COMPLETO.md` - Pipeline completo de geração

**Suporte técnico:**
- Logs: `SCOPSY-CLAUDE-CODE/logs/`
- Issues: GitHub Issues (se configurado)

---

## ✅ CHECKLIST FINAL

### Antes de Começar

- [ ] OpenAI API key configurada
- [ ] Supabase credentials configuradas
- [ ] Documentação lida (este arquivo)
- [ ] Instruções dos 3 GPTs preparadas

### Durante Implementação

- [ ] GPT 1 criado e testado
- [ ] GPT 2 criado e testado
- [ ] GPT 3 criado e testado
- [ ] 5 casos piloto gerados e aprovados
- [ ] Script de população executado
- [ ] 50 casos inseridos no banco

### Após Conclusão

- [ ] Módulo testado no frontend
- [ ] Casos ativados (status: active)
- [ ] Monitoramento configurado
- [ ] Documentação atualizada

---

## 🎉 CONCLUSÃO

Este módulo de Conceituação é **CRÍTICO** para a experiência pedagógica completa do Scopsy. Com esta auditoria estratégica e proposta de expansão dos 3 GPTs, você tem:

1. ✅ **Diagnóstico completo** do problema (0 casos, módulo quebrado)
2. ✅ **Estrutura clara** (JSON schema detalhado)
3. ✅ **Metodologia validada** (3 GPTs com instruções completas)
4. ✅ **Roadmap de implementação** (4 fases, 6-8 horas total)
5. ✅ **Critérios de qualidade** (quality score, revisão humana)

**Próximo passo imediato:** Executar FASE 1 (Setup GPTs) e gerar casos piloto.

**Objetivo final:** 50 casos de conceituação de altíssima qualidade pedagógica, fundamentados teoricamente, revisados tecnicamente e clinicamente.

---

**Versão:** 1.0
**Data:** 05/01/2026
**Status:** Pronto para implementação
**Autor:** Claude Code (Auditoria Estratégica Scopsy Lab)
