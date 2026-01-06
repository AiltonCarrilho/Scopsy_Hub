# 🚀 WORKFLOW DE POPULAÇÃO: RADAR DIAGNÓSTICO

**Data:** 05/01/2026
**Objetivo:** Popular módulo Radar Diagnóstico com 150 casos validados usando pipeline de 3 GPTs

---

## 📊 DISTRIBUIÇÃO ESTRATÉGICA

### Total: 150 casos

**Por nível:** 50 basic / 50 intermediate / 50 advanced

**Por formato (dentro de cada nível):**
- Differential: 20 casos (40%)
- Criteria Absent: 15 casos (30%)
- Intervention: 15 casos (30%)

**Por categoria DSM:**
- Anxiety: 60 casos (40%)
- Mood: 45 casos (30%)
- Trauma: 30 casos (20%)
- Personality: 10 casos (7%)
- Psychotic: 5 casos (3%)

---

## 🔄 PIPELINE (3 GPTs)

```
1. SOLICITAÇÃO: "Gere 5 casos de TAG, nível basic, formato differential"
   ↓
2. GPT 1 GERADOR: Gera 5 casos completos
   ↓
3. GPT 2 REVISOR TÉCNICO: Valida estrutura/completude (aprova ~70%)
   ↓
4. GPT 3 REVISOR CLÍNICO: Valida precisão DSM (aprova ~85%)
   ↓
5. BANCO: status='active', quality_score=4.5-5.0
```

---

## 📝 INSTRUÇÕES PASSO A PASSO

### FASE 1: Criar os 3 GPTs

1. Ir para: https://chat.openai.com/gpts/editor

2. **GPT 1 - Gerador:**
   - Nome: `Scopsy - Gerador Radar Diagnóstico`
   - Copiar de: `GPT_1_GERADOR_RADAR_DIAGNOSTICO.md`

3. **GPT 2 - Revisor Técnico:**
   - Nome: `Scopsy - Revisor Técnico Diagnóstico`
   - Copiar de: `GPT_2_REVISOR_TECNICO_RADAR_DIAGNOSTICO.md`

4. **GPT 3 - Revisor Clínico:**
   - Nome: `Scopsy - Revisor Clínico Diagnóstico`
   - Copiar de: `GPT_3_REVISOR_CLINICO_RADAR_DIAGNOSTICO.md`

---

### FASE 2: Gerar Casos por Lote

#### LOTE EXEMPLO: TAG Basic Differential (5 casos)

**1. GPT 1:**
```
Gere 5 casos de TAG (Transtorno de Ansiedade Generalizada), nível basic, formato differential.

Requisitos basic:
- 1 opção claramente errada, 2 plausíveis, 1 correta
- Diferenciais: TAG vs Ajustamento vs Pânico vs Fobia Social (todos ansiedade)
- Critérios DSM óbvios
- Vinheta: 180-200 palavras

Retorne 5 JSONs completos.
```

**2. Para cada JSON → GPT 2:**
Colar JSON → Se APROVADO → GPT 3
Se REPROVADO → Anotar issues → Pedir GPT 1 corrigir

**3. Para cada JSON aprovado GPT 2 → GPT 3:**
Colar JSON → Se APROVADO → Salvar em `casos_aprovados/anxiety/tag_basic_differential_01.json`

**4. Repetir até ter 5 casos aprovados**

---

## 📋 MATRIZ COMPLETA DE POPULAÇÃO

### ANXIETY (60 casos)

**Basic (20 casos):**
- Differential: TAG(3), Pânico(2), Fobia Social(2), TOC(1)
- Criteria Absent: TAG(2), Pânico(2), Fobia Social(1), TOC(1)
- Intervention: TAG(2), Pânico(2), Fobia Social(1), TOC(1)

**Intermediate (20 casos):**
- Differential: TAG(3), Pânico(2), Fobia Social(2), TOC(1)
- Criteria Absent: TAG(2), Pânico(2), Fobia Social(1), TOC(1)
- Intervention: TAG(2), Pânico(2), Fobia Social(1), TOC(1)

**Advanced (20 casos):**
- Differential: TAG(3), Pânico(2), Fobia Social(2), TOC(1)
- Criteria Absent: TAG(2), Pânico(2), Fobia Social(1), TOC(1)
- Intervention: TAG(2), Pânico(2), Fobia Social(1), TOC(1)

### MOOD (45 casos)

**Basic (15 casos):**
- Differential: Depressão(4), Distimia(2)
- Criteria Absent: Depressão(3), Distimia(1)
- Intervention: Depressão(3), Distimia(2)

**Intermediate (15 casos):**
- Differential: Depressão(4), Distimia(1), Bipolar II(1)
- Criteria Absent: Depressão(3), Distimia(1), Bipolar II(1)
- Intervention: Depressão(3), Distimia(1), Bipolar II(1)

**Advanced (15 casos):**
- Differential: Depressão(3), Distimia(1), Bipolar II(2)
- Criteria Absent: Depressão(3), Bipolar II(2)
- Intervention: Depressão(3), Bipolar II(2)

### TRAUMA (30 casos)

**Basic (10 casos):**
- Differential: TEPT(3), Estresse Agudo(1)
- Criteria Absent: TEPT(2), Estresse Agudo(1)
- Intervention: TEPT(2), Estresse Agudo(1)

**Intermediate (10 casos):**
- Differential: TEPT(3), Estresse Agudo(1)
- Criteria Absent: TEPT(2), Estresse Agudo(1)
- Intervention: TEPT(2), Estresse Agudo(1)

**Advanced (10 casos):**
- Differential: TEPT Complexo(3), Dissociativo(1)
- Criteria Absent: TEPT(2), Dissociativo(1)
- Intervention: TEPT(2), Dissociativo(1)

### PERSONALITY (10 casos)

**Intermediate (5 casos):**
- Differential: Borderline(2), Evitativa(1)
- Criteria Absent: Borderline(1), Evitativa(1)

**Advanced (5 casos):**
- Differential: Borderline(2), Narcisista(1)
- Criteria Absent: Borderline(1)
- Intervention: Borderline(1)

### PSYCHOTIC (5 casos)

**Advanced (5 casos):**
- Differential: Esquizofrenia(2), Delirante(1)
- Criteria Absent: Esquizofrenia(1)
- Intervention: Esquizofrenia(1)

---

## ⏱️ ESTIMATIVA TEMPO E CUSTO

### Por Lote de 5 Casos

| Etapa | Tempo | Custo |
|-------|-------|-------|
| GPT 1 gera 5 | 10 min | ~$1.00 |
| GPT 2 valida 5 | 10 min | ~$0.40 |
| GPT 3 valida 3-4 | 15 min | ~$0.60 |
| Salvar JSONs | 5 min | - |
| **TOTAL** | **40 min** | **~$2.00** |

### Total para 150 Casos

- **Lotes:** 30 lotes (5 casos por lote)
- **Tempo:** ~20 horas (3-4 dias)
- **Custo:** ~$60 USD
- **Taxa aprovação:** 70% (gerar ~215 para aprovar 150)

---

## 📥 INSERÇÃO NO BANCO

**Script:** `insert-diagnostic-cases.js`

```javascript
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
      vignette: caseData.clinical_content.vignette,
      case_content: caseData,
      status: 'active',
      quality_score: 4.8,
      created_by: 'gpt_pipeline_diagnostic_v1'
    });

  if (error) throw error;
  console.log(`✅ ${path.basename(filePath)}`);
}

async function insertAllCases() {
  const categories = ['anxiety', 'mood', 'trauma', 'personality', 'psychotic'];

  for (const category of categories) {
    const dir = `./casos_aprovados/${category}`;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

    console.log(`\n📁 ${category}: ${files.length} casos`);

    for (const file of files) {
      await insertCase(path.join(dir, file));
    }
  }

  console.log('\n🎉 150 casos inseridos!');
}

insertAllCases().catch(console.error);
```

**Executar:**
```bash
node insert-diagnostic-cases.js
```

---

## ✅ CHECKLIST FINAL

### Preparação
- [ ] Criar 3 GPTs
- [ ] Testar pipeline com 5 casos piloto
- [ ] Criar pasta `casos_aprovados/` com subpastas

### Geração
- [ ] ANXIETY (60): basic(20) + intermediate(20) + advanced(20)
- [ ] MOOD (45): basic(15) + intermediate(15) + advanced(15)
- [ ] TRAUMA (30): basic(10) + intermediate(10) + advanced(10)
- [ ] PERSONALITY (10): intermediate(5) + advanced(5)
- [ ] PSYCHOTIC (5): advanced(5)

### Inserção
- [ ] Criar script `insert-diagnostic-cases.js`
- [ ] Testar com 1 caso
- [ ] Executar script completo
- [ ] Validar: `SELECT COUNT(*) FROM cases WHERE vignette IS NOT NULL AND LENGTH(vignette) <= 250` → 150

### Validação
- [ ] Testar frontend (gerar caso)
- [ ] Verificar latência (<500ms com cache)
- [ ] Celebrar! 🎉

---

## 🎯 RESULTADO ESPERADO

**ANTES:**
- Geração sob demanda (5-8s latência)
- Qualidade inconsistente (~60% bons)
- Custo: $0.03/caso em tempo real

**DEPOIS:**
- Cache-first (<500ms, 95% dos casos)
- Qualidade 85-95% (3 GPTs validaram)
- Custo: $0 (pré-gerado)

---

**Boa sorte! Com este workflow, você terá 150 casos DSM-5-TR de excelência, prontos para treinar diagnóstico clínico.** 🚀
