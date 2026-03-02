# INSTRUÇÕES DE APLICAÇÃO - RLS MIGRATION

**Migration:** 11-rls-hybrid-implementation.sql
**Data:** 2026-02-28
**Executor:** Dara (Data Engineer)
**Tempo estimado:** 5 minutos

---

## ⚠️ PRÉ-REQUISITOS

- [ ] Acesso ao Supabase Console (seu projeto)
- [ ] Database connection ativa
- [ ] Backup/snapshot validado (✅ Concluído)
- [ ] Leitura desta instrução

---

## 🚀 OPÇÃO A: Via Supabase Console (RECOMENDADO)

**Passo 1:** Ir para Supabase Dashboard
```
URL: https://app.supabase.com
Projeto: Scopsy_Hub
Seção: SQL Editor
```

**Passo 2:** Copiar conteúdo completo
```bash
cat ../11-rls-hybrid-implementation.sql
```

**Passo 3:** Colar no SQL Editor
- [ ] Paste conteúdo inteiro
- [ ] **REVISE antes de executar** (veja linha 11: comentários explicativos)
- [ ] Clique em "Run"

**Passo 4:** Aguardar conclusão
- [ ] Procure por mensagens de erro (se houver, procure "ERROR")
- [ ] Procure por "CREATE POLICY" (deve ver ~30 policies criadas)

**Resultado esperado:**
```
CREATE POLICY
CREATE POLICY
CREATE POLICY
...
(sem erros)
```

---

## 🚀 OPÇÃO B: Via CLI psql

**Pré-requisito:** psql instalado + SUPABASE_DB_URL configurada

```bash
# Set database URL
export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres"

# Run migration
psql "$SUPABASE_DB_URL" -f ../11-rls-hybrid-implementation.sql

# Expected output:
# SELECT 1
# ALTER TABLE
# DROP POLICY
# CREATE POLICY
# ...
```

---

## ✅ VALIDAÇÃO PÓS-APLICAÇÃO

**IMEDIATAMENTE após aplicar:**

1. **Verificar RLS está ativado:**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_case_interactions', 'user_progress', 'user_badges', 'sessions', 'user_achievements', 'journey_sessions', 'user_activity_log', 'user_daily_missions', 'plan_changes_audit');
```

**Esperado:** Todos com `rowsecurity = true`

2. **Contar policies:**
```sql
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_case_interactions', 'user_progress', 'user_badges', 'sessions', 'user_achievements', 'journey_sessions', 'user_activity_log', 'user_daily_missions', 'plan_changes_audit');
```

**Esperado:** 30+ policies

---

## 🚨 SE ALGO DER ERRADO

**Erro: "Policy já existe"**
- Normal! SQL usa `DROP POLICY IF EXISTS`
- Safe to re-run

**Erro: "Table não existe"**
- Verifique se está no banco Scopsy correto
- Execute: `SELECT * FROM information_schema.tables WHERE table_schema='public' LIMIT 5;`

**Erro: "Permission denied"**
- Verifique role/user permissions
- Use service_role temporariamente se necessário

**FALLBACK: Rollback rápido**
```bash
# Via Supabase Console, cole o script de rollback do snapshot
# Location: ../.snapshots/snapshot-pre-rls-2026-02-28.md (seção ROLLBACK SCRIPT)
```

---

## ✅ CHECKLIST PRÉ-EXECUÇÃO

- [ ] Snapshot criado ✅
- [ ] Arquivo SQL revisado ✅
- [ ] Acesso ao banco confirmado
- [ ] Ninguém mais alterando banco
- [ ] Pronto para 5 min downtime (mínimo)

---

**Próximo:** Etapa 3 (Verificação com testes)
