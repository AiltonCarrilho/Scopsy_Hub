# ✅ CHECKLIST - PRÓXIMOS PASSOS

**Sistema de Revisão:** COMPLETO ✅
**Data:** 31/12/2024

---

## 🚀 AÇÕES IMEDIATAS (15 min)

### [ ] 1. Criar Tabela no Supabase (5 min)

1. Abrir https://supabase.com/dashboard
2. Selecionar projeto scopsy
3. Menu: **SQL Editor** → **New Query**
4. Copiar TODO o conteúdo de `sql-scripts/case_reviews_table.sql`
5. Clicar **RUN**
6. Verificar: `SELECT COUNT(*) FROM case_reviews;` → deve retornar 0

---

### [ ] 2. Importar Resultados (2 min)

```bash
cd SCOPSY-CLAUDE-CODE
node scripts/import-reviews-to-db.js
```

**Resultado esperado:**
```
✅ Inseridos com sucesso: 519
📊 Total de registros na tabela: 519
```

---

### [ ] 3. Validar Importação (3 min)

**No Supabase SQL Editor:**

```sql
-- 1. Verificar total
SELECT COUNT(*) FROM case_reviews;
-- Esperado: 519

-- 2. Ver distribuição
SELECT classificacao, COUNT(*)
FROM case_reviews
GROUP BY classificacao;
-- Esperado: EXPERT=111, ADEQUADA=36, QUESTIONAVEL=317, INADEQUADA=55

-- 3. Ver fila de revisão
SELECT COUNT(*) FROM human_review_queue;
-- Esperado: 372

-- 4. Ver primeiros 5 casos da fila
SELECT
  c.disorder,
  cr.module_type,
  cr.score_total,
  cr.problemas_criticos
FROM human_review_queue cr
JOIN cases c ON c.id = cr.case_id
LIMIT 5;
```

---

### [ ] 4. Abrir Relatório HTML (2 min)

```bash
# Windows
start review-report.html

# Mac/Linux
open review-report.html
```

Verificar:
- [ ] Total: 519 casos
- [ ] Gráficos de distribuição
- [ ] Lista de casos que requerem atenção

---

### [ ] 5. Revisar Casos Expert (3 min)

**Query para micro-momentos prontos:**

```sql
-- 111 casos EXPERT - PRONTOS PARA PRODUÇÃO
SELECT
  c.id,
  c.disorder,
  c.moment_type,
  cr.score_total,
  c.case_content->>'critical_moment' as momento_critico
FROM case_reviews cr
JOIN cases c ON c.id = cr.case_id
WHERE cr.module_type = 'micromoment'
  AND cr.classificacao = 'EXPERT'
ORDER BY cr.score_total DESC
LIMIT 10;
```

✅ **Estes 111 casos podem ir para produção AGORA!**

---

## 📋 ESTA SEMANA (5-10h)

### [ ] 6. Revisar Conceitualizações Inadequadas (3h)

**53 casos críticos que precisam atenção:**

```sql
-- Casos INADEQUADOS para corrigir
SELECT
  c.id,
  c.disorder,
  cr.score_total,
  cr.problemas_criticos,
  cr.review_data->'sugestoes' as sugestoes
FROM case_reviews cr
JOIN cases c ON c.id = cr.case_id
WHERE cr.module_type = 'conceptualization'
  AND cr.classificacao = 'INADEQUADA'
ORDER BY cr.score_total ASC;
```

**Para cada caso:**
- [ ] Abrir caso completo no banco
- [ ] Verificar problemas identificados
- [ ] Decidir: Corrigir ou Remover?
- [ ] Marcar como revisado:
  ```sql
  UPDATE case_reviews
  SET
    human_reviewed_at = NOW(),
    human_decision = 'CONCORDO',  -- ou DISCORDO/MODIFICADO
    human_notes = 'Caso corrigido...'
  WHERE case_id = 'uuid-aqui';
  ```

---

### [ ] 7. Triagem dos Questionáveis (2h)

**317 casos para priorizar:**

```sql
-- Top 20 mais urgentes (score mais baixo)
SELECT
  c.id,
  c.disorder,
  cr.module_type,
  cr.score_total,
  cr.problemas_criticos
FROM human_review_queue cr
JOIN cases c ON c.id = cr.case_id
ORDER BY cr.score_total ASC
LIMIT 20;
```

**Criar planilha de triagem:**
| Case ID | Módulo | Score | Prioridade | Status |
|---------|--------|-------|------------|--------|
| abc123 | conceptualization | 50 | ALTA | Pendente |
| def456 | diagnostic | 52 | MÉDIA | Pendente |

---

### [ ] 8. Exportar Casos Expert para Produção (1h)

```sql
-- Exportar IDs dos casos aprovados
COPY (
  SELECT case_id
  FROM case_reviews
  WHERE aprovado = true
) TO '/tmp/casos_aprovados.csv' CSV HEADER;
```

**Ou criar view:**

```sql
CREATE VIEW casos_producao AS
SELECT c.*
FROM cases c
JOIN case_reviews cr ON cr.case_id = c.id
WHERE cr.aprovado = true;
```

---

## 🔄 PRÓXIMAS 2 SEMANAS (10-15 casos/dia)

### [ ] 9. Processar Fila Diariamente

**Rotina diária (30 min/dia):**

1. **Pegar próximo caso:**
   ```sql
   SELECT * FROM human_review_queue
   WHERE human_reviewed_at IS NULL
   ORDER BY score_total ASC
   LIMIT 1;
   ```

2. **Revisar caso** (20 min)
   - Verificar problemas identificados
   - Validar sugestões do GPT
   - Decidir ação

3. **Marcar como revisado** (2 min)
   ```sql
   UPDATE case_reviews SET
     human_reviewed_at = NOW(),
     human_reviewer_id = 1,
     human_decision = 'CONCORDO',
     human_notes = '...'
   WHERE case_id = '...';
   ```

4. **Atualizar planilha** (5 min)

**Meta:** 10-15 casos/dia × 14 dias = **140-210 casos** revisados

---

### [ ] 10. Gerar Relatório Semanal

**Fim de cada semana:**

```sql
-- Progresso semanal
SELECT
  DATE(human_reviewed_at) as data,
  COUNT(*) as casos_revisados,
  AVG(score_total) as score_medio
FROM case_reviews
WHERE human_reviewed_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(human_reviewed_at)
ORDER BY data;
```

**Compartilhar com equipe:**
- Casos revisados esta semana
- Problemas mais comuns identificados
- Taxa de concordância com GPT
- Casos modificados e por quê

---

## 🚀 PRÓXIMO MÊS

### [ ] 11. Interface Web para Supervisoras

**Specs básicas:**
- [ ] Login com autenticação
- [ ] Fila de casos ordenada por prioridade
- [ ] Visualização de caso completo
- [ ] Botões: Aprovar / Reprovar / Modificar
- [ ] Campo para notas
- [ ] Dashboard com métricas

**Stack sugerido:**
- Next.js + Supabase Auth
- Tailwind CSS
- Supabase client para queries

---

### [ ] 12. Feedback Loop

**Usar revisões humanas para calibrar:**

```sql
-- Casos onde humano discordou
SELECT
  cr.case_id,
  cr.score_total as gpt_score,
  cr.problemas_criticos,
  cr.human_decision,
  cr.human_notes
FROM case_reviews cr
WHERE cr.human_decision = 'DISCORDO';
```

**Análise:**
- O que o GPT identificou errado?
- Padrões de falso positivo/negativo?
- Ajustar prompts do revisor?
- Ajustar thresholds de aprovação?

---

### [ ] 13. Dashboard de Métricas

**KPIs a monitorar:**

```sql
CREATE VIEW dashboard_kpis AS
SELECT
  -- Total de casos
  (SELECT COUNT(*) FROM case_reviews) as total_casos,

  -- Taxa de aprovação
  ROUND(
    (SELECT COUNT(*)::float FROM case_reviews WHERE aprovado = true) /
    (SELECT COUNT(*) FROM case_reviews) * 100,
    1
  ) as taxa_aprovacao_pct,

  -- Fila pendente
  (SELECT COUNT(*) FROM human_review_queue WHERE human_reviewed_at IS NULL) as fila_pendente,

  -- Revisados por humanos
  (SELECT COUNT(*) FROM case_reviews WHERE human_reviewed_at IS NOT NULL) as humanos_revisados,

  -- Score médio
  ROUND((SELECT AVG(score_total) FROM case_reviews), 1) as score_medio,

  -- Taxa de concordância humano-GPT
  ROUND(
    (SELECT COUNT(*)::float FROM case_reviews WHERE human_decision = 'CONCORDO') /
    NULLIF((SELECT COUNT(*) FROM case_reviews WHERE human_decision IS NOT NULL), 0) * 100,
    1
  ) as taxa_concordancia_pct;
```

---

### [ ] 14. Melhorias nos Prompts de Geração

**Baseado em problemas comuns:**

| Problema Identificado | Frequência | Ação no Prompt |
|-----------------------|------------|----------------|
| Validação insuficiente | 3x | Adicionar: "Sempre validar emoção antes de propor técnica" |
| Confusão crenças/pensamentos | 10x | Adicionar exemplos diferenciando |
| Falta situação específica | 15x | Tornar campo obrigatório |

---

## 📊 MÉTRICAS DE SUCESSO

### Esta Semana
- [ ] Tabela criada e populada: 519 casos ✅
- [ ] 111 casos expert identificados ✅
- [ ] 53 inadequados triados
- [ ] 20 casos revisados manualmente

### Este Mês
- [ ] 150+ casos revisados por humanos
- [ ] Taxa de concordância > 80%
- [ ] Interface web em desenvolvimento
- [ ] Relatórios semanais automatizados

### Próximos 3 Meses
- [ ] Toda fila processada (372 casos)
- [ ] Interface web em produção
- [ ] Feedback loop implementado
- [ ] Sistema auto-calibrado

---

## 🎯 CONTATO RÁPIDO

**Arquivos Importantes:**
- 📖 `RESUMO_EXECUTIVO_SISTEMA_REVISAO.md` - Visão completa
- 📖 `SETUP_FILA_REVISAO.md` - Guia detalhado
- 📖 `GUIA_USO_REVISOR.md` - Manual de uso

**Scripts:**
```bash
# Revisar novos casos
node scripts/review-existing-cases.js --module=all --save=true

# Importar para banco
node scripts/import-reviews-to-db.js
```

**Queries Essenciais:**
```sql
-- Ver fila
SELECT * FROM human_review_queue;

-- Estatísticas
SELECT * FROM quality_stats_by_module;

-- Casos críticos
SELECT * FROM critical_cases;
```

---

## ✅ CHECKLIST RÁPIDO

```
[ ] 1. SQL no Supabase (5 min)
[ ] 2. Importar resultados (2 min)
[ ] 3. Validar queries (3 min)
[ ] 4. Abrir relatório HTML (2 min)
[ ] 5. Revisar casos expert (3 min)
```

**Total:** 15 minutos para sistema completo! 🚀

---

**Status:** ✅ PRONTO PARA USO
**Próximo passo:** Executar item #1 do checklist!
