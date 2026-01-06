# 🚀 WORKFLOW DE POPULAÇÃO: MÓDULO CONCEITUAÇÃO

**Data:** 05/01/2026
**Objetivo:** Popular módulo de conceituação com 50 casos de alta qualidade usando pipeline de 3 GPTs

---

## 📊 DISTRIBUIÇÃO ESTRATÉGICA DE CASOS

### Total: 50 casos

Baseado em:
- Prevalência epidemiológica (DSM-5-TR)
- Currículo CFP (o que mais cai em provas)
- Progressão pedagógica (basic → intermediate → advanced)

```javascript
const DISTRIBUICAO_CASOS = {
  // ANSIEDADE: 20 casos (40%)
  anxiety: {
    total: 20,
    disorders: {
      tag: {                                    // TAG = 8 casos
        basic: 3,        // 1-2 crenças, sem comorbidade
        intermediate: 3, // 2-3 crenças, comorbidade leve (insônia)
        advanced: 2      // 3+ crenças, ambiguidade TAG vs Depressão
      },
      panico: {                                 // Pânico = 5 casos
        basic: 2,
        intermediate: 2,
        advanced: 1      // Com agorafobia complexa
      },
      fobia_social: {                           // Fobia Social = 4 casos
        basic: 2,
        intermediate: 1,
        advanced: 1      // Comorbidade com depressão
      },
      toc: {                                    // TOC = 3 casos
        basic: 0,        // TOC nunca é basic
        intermediate: 2,
        advanced: 1      // Ritual mental complexo
      }
    }
  },

  // HUMOR: 15 casos (30%)
  mood: {
    total: 15,
    disorders: {
      depressao_major: {                        // Depressão = 9 casos
        basic: 3,        // Episódio único, sem comorbidade
        intermediate: 4, // Recorrente, comorbidade ansiedade
        advanced: 2      // Com sintomas psicóticos atípicos
      },
      distimia: {                               // Distimia = 3 casos
        basic: 1,
        intermediate: 2,
        advanced: 0
      },
      bipolar_ii: {                             // Bipolar II = 3 casos
        basic: 0,        // Bipolar nunca é basic
        intermediate: 2,
        advanced: 1      // Ciclagem rápida
      }
    }
  },

  // TRAUMA: 8 casos (16%)
  trauma: {
    total: 8,
    disorders: {
      tept: {                                   // TEPT = 5 casos
        basic: 2,        // Trauma único, sintomas claros
        intermediate: 2, // Trauma complexo início
        advanced: 1      // TEPT complexo + dissociação
      },
      trauma_complexo: {                        // Trauma Complexo = 3 casos
        basic: 0,        // Sempre complexo
        intermediate: 1,
        advanced: 2      // Múltiplos traumas, desregulação
      }
    }
  },

  // PERSONALIDADE: 4 casos (8%)
  personality: {
    total: 4,
    disorders: {
      borderline: {                             // Borderline = 2 casos
        basic: 0,        // Personalidade nunca é basic
        intermediate: 0,
        advanced: 2      // Desregulação emocional intensa
      },
      evitativa: {                              // Evitativa = 2 casos
        basic: 0,
        intermediate: 1,
        advanced: 1      // Comorbidade com fobia social
      }
    }
  },

  // PSICÓTICO: 3 casos (6%)
  psychotic: {
    total: 3,
    disorders: {
      esquizofrenia: {                          // Esquizofrenia = 2 casos
        basic: 0,        // Psicose nunca é basic
        intermediate: 0,
        advanced: 2      // Sintomas residuais + TCC adaptada
      },
      delirante: {                              // Transtorno Delirante = 1 caso
        basic: 0,
        intermediate: 0,
        advanced: 1      // Delírio de perseguição
      }
    }
  }
};
```

---

## 🔄 PIPELINE DE GERAÇÃO (3 GPTs)

### Fluxo Completo

```
┌──────────────────────────────────────────────────────────────┐
│  1. SOLICITAÇÃO                                              │
│  "Gere 3 casos de TAG, nível intermediate"                  │
└───────────────────────┬──────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│  2. GPT 1: GERADOR                                           │
│  - Gera 3 casos completos (vinheta + conceituação)          │
│  - Output: 3 JSONs                                           │
│  - Tempo: ~10 min                                            │
└───────────────────────┬──────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│  3. GPT 2: REVISOR TÉCNICO (para cada caso)                 │
│  - Valida estrutura, completude, consistência               │
│  - Aprova ~70-80%                                            │
│  - Output: decision + feedback técnico                       │
│  - Tempo: ~5 min por caso                                    │
└───────────────────────┬──────────────────────────────────────┘
                        ↓
            ┌───────────┴───────────┐
            │                       │
       APROVADO                REPROVADO
            │                       │
            ↓                       ↓
┌───────────────────────┐  ┌────────────────────┐
│ 4. GPT 3: REVISOR     │  │ RETORNAR AO GPT 1  │
│    CLÍNICO            │  │ (corrigir issues)  │
│ - Valida precisão     │  └────────────────────┘
│   teórica             │
│ - Aprova ~80-90%      │
│ - Output: decision +  │
│   quality_score       │
│ - Tempo: ~8 min/caso  │
└──────────┬────────────┘
           │
      APROVADO (90+ pontos)
           ↓
┌──────────────────────────────────────────────────────────────┐
│  5. BANCO DE DADOS (Supabase)                                │
│  - INSERT INTO cases (vinheta, case_content, status, etc)    │
│  - status = 'active'                                          │
│  - quality_score = 4.5-5.0                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 📝 INSTRUÇÕES PASSO A PASSO

### FASE 1: Criar os 3 GPTs

1. **Ir para:** https://chat.openai.com/gpts/editor
2. **Criar GPT 1 - Gerador:**
   - Nome: `Scopsy - Gerador de Casos TCC`
   - Descrição: `Gera casos clínicos de conceituação TCC com vinhetas narrativas e conceituação modelo estruturada`
   - **Custom Instructions:** Copiar TODO o conteúdo de `GPT_1_GERADOR_CONCEITUALIZACAO.md` (seção "INSTRUÇÕES PARA O GPT BUILDER")
   - **Capabilities:** Desabilitar Web Browsing, Code Interpreter, DALL-E
   - **Salvar** e copiar link

3. **Criar GPT 2 - Revisor Técnico:**
   - Nome: `Scopsy - Revisor Técnico TCC`
   - Descrição: `Valida estrutura, completude e consistência de casos clínicos TCC`
   - **Custom Instructions:** Copiar de `GPT_2_REVISOR_TECNICO_CONCEITUALIZACAO.md`
   - **Salvar** e copiar link

4. **Criar GPT 3 - Revisor Clínico:**
   - Nome: `Scopsy - Revisor Clínico TCC`
   - Descrição: `Valida precisão teórica e qualidade pedagógica de casos TCC`
   - **Custom Instructions:** Copiar de `GPT_3_REVISOR_CLINICO_CONCEITUALIZACAO.md`
   - **Salvar** e copiar link

---

### FASE 2: Gerar Casos (Batch por Categoria)

**Exemplo:** Gerar 8 casos de TAG

#### LOTE 1: TAG Basic (3 casos)

1. **Abrir GPT 1** (Gerador)
2. **Prompt:**
   ```
   Gere 3 casos de TAG (Transtorno de Ansiedade Generalizada), nível BASIC.

   Requisitos BASIC:
   - 1-2 crenças centrais
   - História desenvolvimental linear (ex: pai crítico)
   - Sem comorbidade
   - Sintomas claros de TAG (preocupação ≥6 meses, múltiplas áreas)
   - Vinheta: 300-400 palavras

   Retorne 3 JSONs completos.
   ```

3. **GPT 1 retorna:** 3 JSONs

4. **Para cada JSON:**
   - Abrir **GPT 2** (Revisor Técnico)
   - Colar JSON completo
   - GPT 2 retorna: `{"decision": "APROVADO", "score": 95, ...}`

   - Se APROVADO:
     - Abrir **GPT 3** (Revisor Clínico)
     - Colar JSON completo
     - GPT 3 retorna: `{"decision": "APROVADO", "score": 92, ...}`

   - Se ambos APROVARAM:
     - **Salvar JSON em arquivo:** `casos_aprovados/tag_basic_01.json`

5. **Repetir até ter 3 casos aprovados**

---

#### LOTE 2: TAG Intermediate (3 casos)

**Prompt para GPT 1:**
```
Gere 3 casos de TAG, nível INTERMEDIATE.

Requisitos INTERMEDIATE:
- 2-3 crenças centrais
- Comorbidade leve (ex: insônia crônica, sintomas depressivos leves)
- Múltiplos mantenedores (cognitivos + comportamentais + interpessoais)
- História desenvolvimental com 2+ experiências formativas
- Vinheta: 300-400 palavras

Retorne 3 JSONs completos.
```

**Validar com GPT 2 e GPT 3** como acima.

---

#### LOTE 3: TAG Advanced (2 casos)

**Prompt para GPT 1:**
```
Gere 2 casos de TAG, nível ADVANCED.

Requisitos ADVANCED:
- 3+ crenças centrais
- AMBIGUIDADE DIAGNÓSTICA: sintomas overlapping TAG vs Depressão
- Na conceituação modelo, EXPLIQUE por que TAG é diagnóstico correto (não Depressão)
- Marcadores diferenciais: preocupação é NÚCLEO (vs anedonia em Depressão)
- Comorbidade complexa (ex: depressão secundária + insônia)
- Vinheta: 350-400 palavras

Retorne 2 JSONs completos.
```

**Validar com GPT 2 e GPT 3.**

---

### FASE 3: Consolidar e Inserir no Banco

1. **Organizar arquivos:**
   ```
   casos_aprovados/
   ├── anxiety/
   │   ├── tag_basic_01.json
   │   ├── tag_basic_02.json
   │   ├── tag_basic_03.json
   │   ├── tag_intermediate_01.json
   │   ├── ... (total 20 casos anxiety)
   ├── mood/
   │   ├── depressao_basic_01.json
   │   ├── ... (total 15 casos mood)
   ├── trauma/
   │   ├── tept_basic_01.json
   │   ├── ... (total 8 casos trauma)
   ├── personality/
   │   ├── borderline_advanced_01.json
   │   ├── ... (total 4 casos)
   └── psychotic/
       ├── esquizofrenia_advanced_01.json
       └── ... (total 3 casos)
   ```

2. **Criar script de inserção:**
   ```javascript
   // insert-conceptualization-cases.js
   const { supabase } = require('./src/services/supabase');
   const fs = require('fs');
   const path = require('path');

   async function insertCase(filePath) {
     const caseData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

     const { data, error } = await supabase
       .from('cases')
       .insert({
         disorder: caseData.metadata.disorder,
         difficulty_level: caseData.metadata.difficulty_level,
         category: caseData.metadata.category,
         vignette: caseData.vignette.text,
         case_content: caseData,
         status: 'active',
         quality_score: 4.8,  // Casos aprovados por 3 GPTs
         created_by: 'gpt_pipeline_v1'
       });

     if (error) throw error;
     console.log(`✅ Inserido: ${path.basename(filePath)}`);
   }

   async function insertAllCases() {
     const categories = ['anxiety', 'mood', 'trauma', 'personality', 'psychotic'];

     for (const category of categories) {
       const dir = `./casos_aprovados/${category}`;
       const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

       console.log(`\n📁 Categoria: ${category} (${files.length} casos)`);

       for (const file of files) {
         await insertCase(path.join(dir, file));
       }
     }

     console.log('\n🎉 Todos os casos inseridos com sucesso!');
   }

   insertAllCases().catch(console.error);
   ```

3. **Executar:**
   ```bash
   node insert-conceptualization-cases.js
   ```

---

## ⏱️ ESTIMATIVA DE TEMPO E CUSTO

### Por Lote de 3 Casos

| Etapa | Tempo | Custo OpenAI |
|-------|-------|--------------|
| GPT 1 gera 3 casos | 10 min | ~$0.60 |
| GPT 2 valida 3 casos | 15 min | ~$0.30 |
| GPT 3 valida 2-3 casos aprovados | 20 min | ~$0.40 |
| Salvar JSONs | 5 min | - |
| **TOTAL POR LOTE** | **50 min** | **~$1.30** |

### Total para 50 Casos

- **Lotes necessários:** ~17 lotes (3 casos por lote)
- **Tempo total:** ~14 horas (pode fazer em 2-3 dias)
- **Custo OpenAI:** ~$22 USD
- **Taxa de aprovação esperada:** 70% (gerar ~70 casos para aprovar 50)

---

## 📋 CHECKLIST DE EXECUÇÃO

### Preparação
- [ ] Criar 3 GPTs (Gerador, Revisor Técnico, Revisor Clínico)
- [ ] Testar pipeline com 1 caso piloto (TAG basic)
- [ ] Validar que JSON aprovado tem todos os campos
- [ ] Criar pasta `casos_aprovados/` com subpastas por categoria

### Geração (por categoria)
- [ ] **ANXIETY (20 casos):**
  - [ ] TAG basic (3)
  - [ ] TAG intermediate (3)
  - [ ] TAG advanced (2)
  - [ ] Pânico basic (2)
  - [ ] Pânico intermediate (2)
  - [ ] Pânico advanced (1)
  - [ ] Fobia Social basic (2)
  - [ ] Fobia Social intermediate (1)
  - [ ] Fobia Social advanced (1)
  - [ ] TOC intermediate (2)
  - [ ] TOC advanced (1)

- [ ] **MOOD (15 casos):**
  - [ ] Depressão basic (3)
  - [ ] Depressão intermediate (4)
  - [ ] Depressão advanced (2)
  - [ ] Distimia basic (1)
  - [ ] Distimia intermediate (2)
  - [ ] Bipolar II intermediate (2)
  - [ ] Bipolar II advanced (1)

- [ ] **TRAUMA (8 casos):**
  - [ ] TEPT basic (2)
  - [ ] TEPT intermediate (2)
  - [ ] TEPT advanced (1)
  - [ ] Trauma Complexo intermediate (1)
  - [ ] Trauma Complexo advanced (2)

- [ ] **PERSONALITY (4 casos):**
  - [ ] Borderline advanced (2)
  - [ ] Evitativa intermediate (1)
  - [ ] Evitativa advanced (1)

- [ ] **PSYCHOTIC (3 casos):**
  - [ ] Esquizofrenia advanced (2)
  - [ ] Delirante advanced (1)

### Inserção
- [ ] Criar script `insert-conceptualization-cases.js`
- [ ] Testar com 1 caso (verificar no Supabase)
- [ ] Executar script completo
- [ ] Validar no banco: `SELECT COUNT(*) FROM cases WHERE vignette IS NOT NULL` → deve retornar 50

### Validação Final
- [ ] Testar no frontend (gerar caso)
- [ ] Submeter conceituação de teste
- [ ] Verificar feedback formativo
- [ ] Celebrar! 🎉

---

## 🎯 DICAS DE EFICIÊNCIA

1. **Paralelizar:** Gerar múltiplos lotes simultaneamente (abrir várias abas)
2. **Salvar prompts:** Criar templates para cada nível (basic/intermediate/advanced)
3. **Automatizar validação:** Se GPT 2 reprovar, não enviar para GPT 3
4. **Revisar em batch:** Validar 5 casos de uma vez, depois inserir todos
5. **Priorizar categorias comuns:** Fazer anxiety e mood primeiro (65% dos casos)

---

## 🚨 PROBLEMAS COMUNS E SOLUÇÕES

### GPT 1 gera vinheta com <300 palavras
- **Solução:** Reprovar no GPT 2, pedir GPT 1 adicionar detalhes sobre história desenvolvimental ou impacto funcional

### GPT 2 reprova por inconsistência vinheta ↔ conceituação
- **Solução:** Pedir GPT 1 ajustar conceituação para bater com vinheta (ou vice-versa)

### GPT 3 reprova por categoria de crença incorreta
- **Solução:** Pedir GPT 1 corrigir categoria (ex: "Sou inadequado" → Desamparo, não Desamor)

### JSON malformado ao colar no banco
- **Solução:** Validar JSON em https://jsonlint.com/ antes de salvar

---

## 📚 REFERÊNCIAS

- Beck, J. S. (2011). *Cognitive Behavior Therapy: Basics and Beyond* (2nd ed.). Guilford Press.
- Clark, D. A., & Beck, A. T. (2010). *Cognitive Therapy of Anxiety Disorders*. Guilford Press.
- Greenberger, D., & Padesky, C. A. (1995). *Mind Over Mood*. Guilford Press.
- Persons, J. B. (2008). *The Case Formulation Approach to CBT*. Guilford Press.

---

**Boa sorte na população! 🚀**

Com este workflow, você terá 50 casos de conceituação TCC de qualidade excepcional, validados por 3 camadas de revisão, prontos para ensinar psicólogos a formular casos clinicamente.
