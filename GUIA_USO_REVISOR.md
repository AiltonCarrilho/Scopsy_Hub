# 📖 GUIA DE USO - SISTEMA DE REVISÃO DE CASOS

**Versão:** 1.0
**Data:** 31/12/2024

---

## 🎯 VISÃO GERAL

Sistema automático de revisão de qualidade clínica para casos gerados por IA.

**Componentes:**
1. `case-review-service.js` - Serviço de revisão (usa GPT-4o)
2. `review-existing-cases.js` - Script para revisar casos em batch
3. `case_reviews` - Tabela no Supabase para armazenar resultados

---

## 📦 INSTALAÇÃO

### 1. Criar Tabela no Supabase

```bash
# Executar SQL no Supabase SQL Editor:
cat sql-scripts/case_reviews_table.sql
```

Ou acessar: https://supabase.com → SQL Editor → Colar conteúdo do arquivo

---

### 2. Verificar Variáveis de Ambiente

Certifique-se que `.env` contém:

```bash
OPENAI_API_KEY=sk-proj-...  # Chave OpenAI válida
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...  # Role key (não anon)
```

---

## 🚀 USO BÁSICO

### Revisar Casos Existentes (Batch)

```bash
# Revisar todos os micro-momentos (Desafios)
node scripts/review-existing-cases.js --module=micromoment

# Revisar diagnósticos
node scripts/review-existing-cases.js --module=diagnostic

# Revisar TODOS os módulos
node scripts/review-existing-cases.js --module=all

# Revisar + salvar no banco
node scripts/review-existing-cases.js --module=all --save=true

# Revisar apenas 50 casos (teste)
node scripts/review-existing-cases.js --module=micromoment --limit=50
```

**Saída:**
- `review-results.json` - Resultados completos em JSON
- `review-report.html` - Relatório visual (abrir no navegador)
- Console com estatísticas em tempo real

---

### Usar no Código (Integrado)

```javascript
const { reviewCase } = require('./services/case-review-service');

// Revisar um caso antes de salvar
const caseData = {
  id: 'uuid-do-caso',
  context: { ... },
  critical_moment: { ... },
  options: [...],
  expert_choice: 'B',
  expert_reasoning: { ... }
};

const review = await reviewCase(caseData, 'micromoment');

if (review.aprovado && !review.requer_revisao_humana) {
  // ✅ Caso OK - Salvar em produção
  await saveToProduction(caseData);
} else if (review.requer_revisao_humana) {
  // ⚠️ Enviar para fila de revisão humana
  await addToHumanQueue(caseData, review);
} else {
  // ❌ Reprovar - Não usar
  console.log('Caso reprovado:', review.problemas_criticos);
}
```

---

## 📊 INTERPRETANDO RESULTADOS

### Classificações

| Score | Classificação | Ação Recomendada |
|-------|--------------|------------------|
| 85-100 | **EXPERT** | ✅ Aprovar para produção |
| 70-84 | **ADEQUADA** | ✅ Aprovar (log para análise) |
| 50-69 | **QUESTIONÁVEL** | ⚠️ Enviar para revisão humana |
| 0-49 | **INADEQUADA** | ❌ Reprovar (não usar) |

---

### Exemplo de Resultado

```json
{
  "aprovado": false,
  "score_total": 65,
  "classificacao": "QUESTIONAVEL",
  "scores_detalhados": {
    "timing": 25,
    "resistencia": 15,
    "alianca": 18,
    "economia": 7
  },
  "problemas_criticos": [
    "Validação nível 0 (invalidante) com resistência alta"
  ],
  "problemas_moderados": [
    "Timing pode gerar resistência em clientes ambivalentes"
  ],
  "sugestao_correcao": {
    "expert_choice_recomendada": "C",
    "justificativa": "Opção C valida (nível 3) + restitui agência",
    "principio_clinico": "Colaboração empírica > persuasão"
  },
  "requer_revisao_humana": true,
  "acao": "REVISAO_HUMANA"
}
```

---

## 🔍 CONSULTAS ÚTEIS (Supabase SQL)

### Ver fila de revisão humana

```sql
SELECT * FROM human_review_queue
LIMIT 20;
```

### Estatísticas por módulo

```sql
SELECT * FROM quality_stats_by_module;
```

### Casos críticos (score < 50)

```sql
SELECT * FROM critical_cases;
```

### Top 10 problemas mais comuns

```sql
SELECT
  unnest(problemas_criticos) as problema,
  COUNT(*) as ocorrencias
FROM case_reviews
WHERE array_length(problemas_criticos, 1) > 0
GROUP BY problema
ORDER BY ocorrencias DESC
LIMIT 10;
```

---

## 💰 CUSTO ESTIMADO

**Por caso:**
- Input: ~800 tokens
- Output: ~400 tokens
- Custo GPT-4o: **~$0.006/caso**

**Para 521 casos (banco atual):**
- Custo total: **~$3.13**
- Tempo: ~10 minutos (paralelo com batches)

**Para 1.000 casos:**
- Custo total: **~$6.00**
- Tempo: ~20 minutos

---

## 🎯 WORKFLOW RECOMENDADO

### 1. Revisão Inicial (Uma Vez)

```bash
# Revisar todos os 521 casos existentes
node scripts/review-existing-cases.js --module=all --save=true

# Gera:
# - review-results.json (dados completos)
# - review-report.html (visualização)
# - Salva no banco (tabela case_reviews)
```

### 2. Analisar Relatório

Abrir `review-report.html` no navegador.

**Procurar por:**
- Casos com score < 50 (INADEQUADOS)
- Casos que requerem revisão humana
- Problemas mais comuns

### 3. Revisão Humana (Supervisoras)

**Casos prioritários:**
1. Score < 50 (críticos)
2. `requer_revisao_humana = true`
3. Score 50-69 (questionáveis)

**Interface (futuro):**
```
📋 FILA DE REVISÃO (48 casos)

┌─────────────────────────────────────────┐
│ CASO #4521 - TAG Resistência           │
│ Score: 65/100 (QUESTIONÁVEL)           │
│                                         │
│ ⚠️ Problemas:                          │
│ • Validação superficial                │
│ • Timing pode gerar resistência        │
│                                         │
│ 💡 Sugestão GPT: Trocar B → C         │
│                                         │
│ [VER COMPLETO] [APROVAR] [REPROVAR]    │
└─────────────────────────────────────────┘
```

### 4. Novos Casos (Integração Contínua)

Adicionar na rota de geração (`src/routes/case.js`):

```javascript
// Após gerar caso novo
const newCase = await generateCase(...);

// Revisar automaticamente
const review = await reviewCase(newCase, 'micromoment');

if (review.aprovado) {
  // Salvar em produção
  await supabase.from('cases').insert(newCase);
} else {
  // Log ou enviar para revisão
  console.warn('Caso reprovado:', review.problemas_criticos);
}
```

---

## 🔧 TROUBLESHOOTING

### Erro: "Invalid API key"

```bash
# Verificar chave no .env
echo $OPENAI_API_KEY

# Testar chave
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Erro: "Table case_reviews does not exist"

```bash
# Executar SQL de criação da tabela
cat sql-scripts/case_reviews_table.sql | pbcopy
# Colar no Supabase SQL Editor
```

### Script muito lento

```bash
# Reduzir batch size
node scripts/review-existing-cases.js --batch=5

# Ou limitar quantidade
node scripts/review-existing-cases.js --limit=10
```

### Rate limit OpenAI

Se receber erro 429 (too many requests):

```javascript
// Aumentar delay entre batches em case-review-service.js:
await sleep(2000);  // 2 segundos ao invés de 1
```

---

## 📈 MÉTRICAS ESPERADAS

Após revisar os 521 casos existentes, espera-se:

| Métrica | Valor Esperado |
|---------|----------------|
| **Score médio** | 70-80 |
| **Taxa aprovação** | 60-75% |
| **Revisão humana** | 15-25% |
| **Reprovação** | 5-10% |
| **Expert (≥85)** | 20-30% |

Se números estiverem **muito diferentes**:
- Score médio < 60 → Casos têm problemas sérios
- Taxa aprovação < 50% → Revisar prompts de geração
- Reprovação > 20% → Sistema de geração precisa ajustes

---

## 🎓 PRÓXIMOS PASSOS

### Fase 1 (Concluída) ✅
- [x] Serviço de revisão criado
- [x] Script batch implementado
- [x] Schema SQL pronto

### Fase 2 (Próxima)
- [ ] Interface web para supervisoras
- [ ] Dashboard de métricas em tempo real
- [ ] Integração automática na geração

### Fase 3 (Futuro)
- [ ] Sistema aprende com revisões humanas
- [ ] Auto-calibração de thresholds
- [ ] Feedback loop para melhorar geração

---

## 📞 SUPORTE

**Problemas?**
1. Verificar logs: `console.log` no terminal
2. Verificar arquivo: `review-results.json`
3. Consultar documentação: `ARQUITETURA_REVISAO_CASOS.md`

---

**FIM DO GUIA**
