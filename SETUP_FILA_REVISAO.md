# 🚀 SETUP - FILA DE REVISÃO HUMANA

**Data:** 31/12/2024
**Status:** Sistema de revisão completo - 519 casos analisados

---

## 📊 RESUMO DA REVISÃO AUTOMÁTICA

| Módulo | Total | Expert | Adequada | Questionável | Inadequada |
|--------|-------|--------|----------|--------------|------------|
| **Micro-momentos** | 156 | 111 (71%) | 0 | 43 (28%) | 2 (1%) |
| **Diagnósticos** | 83 | 0 | 14 (17%) | 69 (83%) | 0 |
| **Conceitualizações** | 280 | 0 | 22 (8%) | 205 (73%) | 53 (19%) |
| **TOTAL** | **519** | **111** | **36** | **317** | **55** |

**Taxa de aprovação geral:** 21.4%
**Casos que precisam revisão humana:** 372 (questionáveis + inadequados com requer_revisao_humana)

---

## 🛠️ PASSO 1: Criar Tabela no Supabase

### 1.1 Acessar Supabase SQL Editor

1. Abrir https://supabase.com/dashboard
2. Selecionar projeto **scopsy**
3. Menu lateral: **SQL Editor**
4. Clicar em **New Query**

### 1.2 Executar SQL

Copiar TODO o conteúdo de `sql-scripts/case_reviews_table.sql` e executar.

**Ou copiar daqui:**

```sql
-- COPIAR TODO O CONTEÚDO DO ARQUIVO case_reviews_table.sql
-- Inclui:
-- - Tabela case_reviews
-- - 5 índices
-- - 3 views (human_review_queue, quality_stats_by_module, critical_cases)
```

### 1.3 Verificar criação

```sql
-- Verificar se tabela foi criada
SELECT COUNT(*) FROM case_reviews;

-- Verificar views
SELECT * FROM human_review_queue LIMIT 1;
SELECT * FROM quality_stats_by_module;
```

**Resultado esperado:** Tabela vazia (0 rows)

---

## 📥 PASSO 2: Popular Tabela com Resultados

### 2.1 Script de importação

Execute no terminal:

```bash
node scripts/import-reviews-to-db.js
```

**O que faz:**
- Lê `review-results.json`
- Insere 519 registros em `case_reviews`
- Valida dados antes de inserir
- Mostra progresso em tempo real

### 2.2 Verificar importação

```sql
-- Ver total importado
SELECT COUNT(*) FROM case_reviews;
-- Deve retornar: 519

-- Ver distribuição por classificação
SELECT classificacao, COUNT(*)
FROM case_reviews
GROUP BY classificacao
ORDER BY COUNT(*) DESC;

-- Ver fila de revisão humana
SELECT COUNT(*) FROM human_review_queue;
-- Deve retornar: 372 (casos questionáveis + inadequados)
```

---

## 🔍 PASSO 3: Queries Úteis

### 3.1 Fila de Revisão Humana (Priorizada)

```sql
-- Top 20 casos mais urgentes (scores mais baixos)
SELECT
  cr.id,
  c.disorder,
  cr.module_type,
  cr.score_total,
  cr.classificacao,
  cr.problemas_criticos,
  cr.reviewed_at
FROM human_review_queue cr
JOIN cases c ON c.id = cr.case_id
ORDER BY cr.score_total ASC
LIMIT 20;
```

### 3.2 Casos Inadequados (Críticos)

```sql
-- 55 casos com problemas graves
SELECT * FROM critical_cases;
```

### 3.3 Estatísticas por Módulo

```sql
-- Resumo de qualidade por tipo
SELECT * FROM quality_stats_by_module;
```

### 3.4 Micro-momentos EXPERT (Prontos para Produção)

```sql
-- 111 casos aprovados para uso imediato
SELECT
  c.id,
  c.disorder,
  c.moment_type,
  cr.score_total,
  cr.reviewed_at
FROM case_reviews cr
JOIN cases c ON c.id = cr.case_id
WHERE cr.module_type = 'micromoment'
  AND cr.classificacao = 'EXPERT'
ORDER BY cr.score_total DESC;
```

### 3.5 Casos Reprovados que Precisam Correção

```sql
-- Casos que devem ser corrigidos ou removidos
SELECT
  c.id,
  c.disorder,
  cr.module_type,
  cr.score_total,
  cr.problemas_criticos,
  cr.sugestao_correcao->>'justificativa' as sugestao
FROM case_reviews cr
JOIN cases c ON c.id = cr.case_id
WHERE cr.aprovado = false
  AND cr.score_total < 50
ORDER BY cr.score_total ASC;
```

---

## 👥 PASSO 4: Workflow de Revisão Humana

### 4.1 Para Supervisoras

**Acesso à fila:**

```sql
-- Pegar próximo caso da fila
SELECT
  cr.id as review_id,
  c.id as case_id,
  c.disorder,
  c.case_content,
  cr.score_total,
  cr.problemas_criticos,
  cr.sugestao_correcao
FROM human_review_queue cr
JOIN cases c ON c.id = cr.case_id
WHERE cr.human_reviewed_at IS NULL
ORDER BY cr.score_total ASC
LIMIT 1;
```

**Registrar decisão:**

```sql
-- Após revisar, marcar como concluído
UPDATE case_reviews
SET
  human_reviewed_at = NOW(),
  human_reviewer_id = 1,  -- ID da supervisora
  human_decision = 'CONCORDO',  -- ou 'DISCORDO' ou 'MODIFICADO'
  human_notes = 'Caso realmente tem problema X, corrigido manualmente'
WHERE id = 'review_id_aqui';
```

### 4.2 Interface Web (Futuro)

**Mockup da interface:**

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 FILA DE REVISÃO HUMANA                    [372 pendentes]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 📋 CASO #47fb423e                                           │
│ Módulo: Conceptualization | Score: 0/100 (INADEQUADA)      │
│                                                              │
│ 👤 Cliente: João, 29 anos                                   │
│ 🏥 Diagnóstico: Transtorno Esquizoafetivo                   │
│                                                              │
│ ❌ PROBLEMAS IDENTIFICADOS:                                 │
│  • Falta situação específica desencadeante                  │
│  • Confusão entre crenças centrais e pensamentos automáticos│
│  • Relação pensamentos-emoções não explícita                │
│                                                              │
│ 💡 SUGESTÃO DO REVISOR:                                     │
│  Incluir situação específica, diferenciar crenças de        │
│  pensamentos automáticos, explicitar relação causal.        │
│                                                              │
│ [VER CASO COMPLETO] [APROVAR] [REPROVAR] [MODIFICAR]       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 PASSO 5: Métricas e Acompanhamento

### 5.1 Dashboard SQL

```sql
-- KPIs principais
SELECT
  -- Total de casos
  (SELECT COUNT(*) FROM case_reviews) as total_casos,

  -- Taxa de aprovação
  ROUND(
    (SELECT COUNT(*)::float FROM case_reviews WHERE aprovado = true) /
    (SELECT COUNT(*) FROM case_reviews) * 100,
    1
  ) as taxa_aprovacao_pct,

  -- Fila de revisão pendente
  (SELECT COUNT(*) FROM human_review_queue) as fila_pendente,

  -- Já revisados por humanos
  (SELECT COUNT(*) FROM case_reviews WHERE human_reviewed_at IS NOT NULL) as humanos_revisados,

  -- Score médio
  ROUND((SELECT AVG(score_total) FROM case_reviews), 1) as score_medio;
```

### 5.2 Progresso de Revisão

```sql
-- Acompanhar progresso das supervisoras
SELECT
  DATE(human_reviewed_at) as data,
  COUNT(*) as casos_revisados,
  AVG(score_total) as score_medio
FROM case_reviews
WHERE human_reviewed_at IS NOT NULL
GROUP BY DATE(human_reviewed_at)
ORDER BY data DESC;
```

---

## 🎯 PRÓXIMAS AÇÕES RECOMENDADAS

### Curto Prazo (Esta Semana)

1. ✅ **Executar SQL no Supabase** (5 min)
2. ✅ **Importar resultados** (2 min)
3. ✅ **Validar dados** com queries (5 min)
4. 📋 **Revisar 111 micro-momentos EXPERT** (podem ir direto para produção)
5. 🚨 **Revisar 53 conceptualizações inadequadas** (problemas graves)

### Médio Prazo (Próximas 2 Semanas)

1. 🔄 **Processar fila de 317 questionáveis** (10-15 casos/dia)
2. 📊 **Analisar padrões** de problemas mais comuns
3. 🔧 **Ajustar prompts de geração** baseado nos feedbacks
4. 📈 **Gerar relatório semanal** de qualidade

### Longo Prazo (Próximo Mês)

1. 🖥️ **Criar interface web** para revisão humana
2. 🤖 **Feedback loop:** usar revisões humanas para calibrar revisor
3. 📚 **Documentar boas práticas** baseado em casos expert
4. 🎓 **Training:** usar casos inadequados como material de estudo

---

## 💰 CUSTO DO SISTEMA

### Revisão Inicial (Uma Vez)
- **519 casos com gpt-4o-mini:** ~$0.52
- **Tempo:** 7 minutos
- **ROI:** 98.5% economia vs revisão manual (estimado 40h humanas → 7 min automatizadas)

### Manutenção (Mensal)
- **Novos casos:** ~50 casos/mês × $0.001 = **$0.05/mês**
- **Re-revisões:** ~20 casos/mês × $0.001 = **$0.02/mês**
- **Total mensal:** **< $0.10/mês**

**Economia anual:** ~$5.000 (vs 500h humanas × $10/h)

---

## 📞 SUPORTE

**Problemas?**
- Verificar logs: `review-results.json`
- Consultar documentação: `GUIA_USO_REVISOR.md`
- Verificar tabela: `SELECT * FROM case_reviews LIMIT 10;`

---

**FIM DO SETUP**

✅ Sistema de revisão automática: **COMPLETO**
✅ Fila de revisão humana: **PRONTA PARA USO**
✅ Queries úteis: **DOCUMENTADAS**

**Próximo passo:** Executar PASSO 1 no Supabase! 🚀
