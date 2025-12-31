# 🔍 RELATÓRIO: Análise de Casos Problemáticos

**Data:** 31/12/2024
**Total analisado:** 254 casos inadequados
**Autor:** Sistema de Revisão GPT-4o-mini

---

## 📊 RESUMO EXECUTIVO

### Classificação dos Casos

| Categoria | Quantidade | % do Total | Ação Recomendada |
|-----------|------------|------------|------------------|
| 🗑️ **DELETAR** | **248** | **97.6%** | Remover do banco (irrecuperáveis) |
| ⚠️ **CORRIGIR URGENTE** | **0** | **0%** | - |
| 🔧 **CORRIGIR MÉDIO** | **0** | **0%** | - |
| 👁️ **REVISAR MANUAL** | **6** | **2.4%** | Análise humana necessária |

### Casos Críticos (Score < 20)

- **Total:** 252 casos (99.2% dos problemáticos)
- **Score médio:** 0/100
- **Todos têm múltiplos problemas graves**

---

## 🚨 TOP 5 PROBLEMAS IDENTIFICADOS

### 1. Falta de Contexto da Sessão
- **Frequência:** 142 casos (56%)
- **Impacto:** CRÍTICO
- **Problema:** Casos não têm informações sobre o cliente ou contexto da sessão

### 2. Sem Opções de Resposta
- **Frequência:** 51 casos (20%)
- **Impacto:** CRÍTICO
- **Problema:** Array `options` vazio ou ausente

### 3. Sem Justificativa Expert
- **Frequência:** 36 casos (14%)
- **Impacto:** CRÍTICO
- **Problema:** Campo `expert_justification` vazio

### 4. Sem Diálogo/Observações
- **Frequência:** 27 casos (11%)
- **Impacto:** CRÍTICO
- **Problema:** Falta diálogo e observações não-verbais

### 5. Resposta Expert Indefinida
- **Frequência:** 21 casos (8%)
- **Impacto:** CRÍTICO
- **Problema:** `expert_choice` está como `undefined` ou `null`

---

## 💡 ANÁLISE DE COMBINAÇÕES DE PROBLEMAS

**Todos os 254 casos têm múltiplos problemas simultâneos.**

Exemplos de combinações comuns:
- Sem contexto + Sem opções + Sem justificativa
- Sem diálogo + Sem observações + Sem opções
- Sem contexto + Sem justificativa + Resposta undefined

**Conclusão:** Estes casos não foram gerados corretamente ou tiveram falha na importação.

---

## 🎯 RECOMENDAÇÕES DE AÇÃO

### OPÇÃO A: Deleção em Massa (RECOMENDADO) ⭐

**Razões:**
1. **97.6% são irrecuperáveis** - Esforço de correção > Custo de recriar
2. **Todos têm score 0** - Não há valor pedagógico
3. **Problemas estruturais graves** - Falta dados essenciais
4. **Contamina métricas** - Distorce análises de qualidade

**Como executar:**
```bash
# 1. Fazer backup primeiro
node scripts/backup-cases.js

# 2. Executar SQL (está no arquivo sql-delete-irrecuperaveis.sql)
# Abrir Supabase SQL Editor e executar o conteúdo do arquivo

# 3. Validar deleção
node scripts/validate-deletion.js
```

**Impacto:**
- Remove 248 casos (de 436 micromoments)
- Sobram 188 micromoments (125 expert + 54 questionable + 9 adequado)
- Taxa de aprovação sobe de 29% para 66%

### OPÇÃO B: Revisão Manual dos 6 Casos

**6 casos precisam análise humana** (não se enquadram em critérios automáticos)

IDs para revisar manualmente:
```
1. [Score 5] ID: xxxxx
2. [Score 8] ID: xxxxx
3. [Score 10] ID: xxxxx
4. [Score 12] ID: xxxxx
5. [Score 15] ID: xxxxx
6. [Score 18] ID: xxxxx
```

**Como revisar:**
1. Abrir `casos-para-revisar-manual.csv`
2. Para cada caso, decidir: DELETAR ou CORRIGIR
3. Se corrigir, listar campos que precisam ser preenchidos

---

## 📂 ARQUIVOS GERADOS

### 1. `analise-casos-problematicos-2025-12-31.json` (289 KB)
Relatório completo em JSON com:
- Ranking de problemas
- IDs de todos os casos por categoria
- Sugestões de correção detalhadas

### 2. `casos-para-deletar.csv` (80 KB)
Planilha com 248 casos irrecuperáveis:
- Case ID
- Score
- Problemas identificados
- Motivo da deleção

### 3. `casos-para-corrigir-urgente.csv` (48 bytes)
Vazio (nenhum caso nesta categoria)

### 4. `sql-delete-irrecuperaveis.sql` (21 KB)
Script SQL pronto para executar no Supabase:
- DELETE dos 248 casos irrecuperáveis
- DELETE das reviews correspondentes
- Com lista completa de IDs

---

## ⚠️ IMPORTANTE: BACKUP ANTES DE DELETAR

**NUNCA execute a deleção sem backup!**

### Como fazer backup:

```bash
# 1. Exportar casos que serão deletados
node scripts/export-cases-to-backup.js

# 2. Ou fazer snapshot no Supabase:
# Dashboard > Database > Backups > Create Backup
```

### Como reverter (se necessário):

```bash
# Se fez backup local
node scripts/restore-from-backup.js backup-cases-2025-12-31.json

# Se usou snapshot Supabase
# Dashboard > Database > Backups > Restore
```

---

## 📈 IMPACTO NAS MÉTRICAS

### Antes da Deleção

| Métrica | Valor |
|---------|-------|
| Total micromoments | 436 |
| Expert (29%) | 125 |
| Adequada (1%) | 3 |
| Questionável (12%) | 54 |
| Inadequada (58%) | **254** |
| Score médio | 33.2/100 |
| Taxa aprovação | 29.4% |

### Depois da Deleção (Projeção)

| Métrica | Valor |
|---------|-------|
| Total micromoments | **188** ↓ 57% |
| Expert (66%) | 125 |
| Adequada (2%) | 3 |
| Questionável (29%) | 54 |
| Inadequada (3%) | **6** ↓ 98% |
| Score médio | **~72/100** ↑ 117% |
| Taxa aprovação | **66%** ↑ 124% |

---

## 🚀 PRÓXIMOS PASSOS

### Imediato (Hoje)

- [ ] Revisar este relatório
- [ ] Decidir: OPÇÃO A (deletar) ou OPÇÃO B (revisar manual)
- [ ] Fazer BACKUP no Supabase

### Curto Prazo (Esta Semana)

- [ ] Executar deleção (se aprovado)
- [ ] Re-rodar estatísticas do sistema
- [ ] Atualizar dashboards
- [ ] Gerar novo relatório pós-limpeza

### Médio Prazo (Próximo Mês)

- [ ] Investigar origem desses casos vazios
- [ ] Implementar validação de schema antes de salvar casos
- [ ] Criar script de health check diário
- [ ] Adicionar testes de integridade de dados

---

## 🔍 ANÁLISE DE CAUSA RAIZ

### Por que esses casos foram gerados?

**Hipóteses:**

1. **Geração via GPT falhou parcialmente**
   - Modelo retornou JSON incompleto
   - Timeout durante geração
   - Parsing error não tratado

2. **Migração de dados com problemas**
   - Campos não mapeados corretamente
   - Estrutura antiga incompatível
   - Perda de dados durante transformação

3. **Casos de teste/debug não removidos**
   - Protótipos salvos no production
   - Testes de desenvolvimento persistidos
   - Fixtures de teste mescladas

**Recomendação:** Após limpeza, implementar validação de schema rigorosa.

---

## 📞 SUPORTE

**Dúvidas ou problemas?**

1. Revisar `analise-casos-problematicos-2025-12-31.json`
2. Verificar logs em `logs/case-review-service.log`
3. Consultar documentação em `docs/CASE_REVIEW_SYSTEM.md`

---

## ✅ CONCLUSÃO

**Recomendação Final: DELETAR OS 248 CASOS**

**Justificativa:**
- 97.6% são irrecuperáveis
- Score 0 indica ausência total de valor
- Esforço de correção > Benefício
- Contamina métricas e análises
- Sistema fica mais limpo e confiável

**Impacto Positivo:**
- Taxa de aprovação sobe de 29% → 66%
- Score médio sobe de 33 → 72
- Database 57% menor (mais eficiente)
- Métricas mais realistas

**Próximo Comando:**
```bash
# Revisar SQL antes de executar
cat sql-delete-irrecuperaveis.sql

# Executar no Supabase SQL Editor
# (copiar e colar o conteúdo)
```

---

**Relatório gerado automaticamente em:** 31/12/2024 18:14 BRT
**Ferramenta:** scripts/analyze-problematic-cases.js
**Modelo revisor:** GPT-4o-mini
