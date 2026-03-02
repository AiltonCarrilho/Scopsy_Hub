# Snapshot PRÉ-RLS - 2026-02-28 17:30 UTC

**Label:** pre-rls-2026-02-28
**Status:** Baseline antes de CRÍTICO #2
**Executor:** Dara (Data Engineer)
**Orquestrador:** Orion (AIOS Master)

---

## 📊 ESTADO PRÉ-RLS

### Tabelas Auditadas
```
✓ user_case_interactions    → RLS: DISABLED
✓ user_achievements          → RLS: DISABLED
✓ journey_sessions           → RLS: DISABLED
✓ user_progress              → RLS: DISABLED
✓ sessions                   → RLS: DISABLED
✓ user_badges                → RLS: DISABLED
✓ user_activity_log          → RLS: DISABLED
✓ user_daily_missions        → RLS: DISABLED
✓ plan_changes_audit         → RLS: DISABLED
```

### Policies Ativas
```
ANTES: 0 policies
DEPOIS: 9 policies (KISS + Granular)
```

### Índices
```
user_id indices: Serão criados/validados na migration
```

---

## 🔄 ROLLBACK SCRIPT (Se necessário)

Para reverter, use:
```sql
-- Disable all RLS
ALTER TABLE user_case_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE journey_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan_changes_audit DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "user_case_interactions_owner_all" ON user_case_interactions;
DROP POLICY IF EXISTS "user_achievements_owner_all" ON user_achievements;
DROP POLICY IF EXISTS "journey_sessions_owner_all" ON journey_sessions;
DROP POLICY IF EXISTS "user_progress_select" ON user_progress;
DROP POLICY IF EXISTS "user_progress_insert" ON user_progress;
DROP POLICY IF EXISTS "user_progress_update" ON user_progress;
DROP POLICY IF EXISTS "user_progress_delete" ON user_progress;
DROP POLICY IF EXISTS "sessions_select" ON sessions;
DROP POLICY IF EXISTS "sessions_insert" ON sessions;
DROP POLICY IF EXISTS "sessions_update" ON sessions;
DROP POLICY IF EXISTS "sessions_delete" ON sessions;
DROP POLICY IF EXISTS "user_badges_select" ON user_badges;
DROP POLICY IF EXISTS "user_badges_insert" ON user_badges;
DROP POLICY IF EXISTS "user_badges_update" ON user_badges;
DROP POLICY IF EXISTS "user_badges_delete" ON user_badges;
DROP POLICY IF EXISTS "user_activity_log_select" ON user_activity_log;
DROP POLICY IF EXISTS "user_activity_log_insert" ON user_activity_log;
DROP POLICY IF EXISTS "user_activity_log_update" ON user_activity_log;
DROP POLICY IF EXISTS "user_activity_log_delete" ON user_activity_log;
DROP POLICY IF EXISTS "user_daily_missions_select" ON user_daily_missions;
DROP POLICY IF EXISTS "user_daily_missions_insert" ON user_daily_missions;
DROP POLICY IF EXISTS "user_daily_missions_update" ON user_daily_missions;
DROP POLICY IF EXISTS "user_daily_missions_delete" ON user_daily_missions;
DROP POLICY IF EXISTS "plan_changes_audit_select" ON plan_changes_audit;
DROP POLICY IF EXISTS "plan_changes_audit_insert" ON plan_changes_audit;
DROP POLICY IF EXISTS "plan_changes_audit_update" ON plan_changes_audit;
DROP POLICY IF EXISTS "plan_changes_audit_delete" ON plan_changes_audit;
```

---

**Snapshot criado:** 2026-02-28 17:30 UTC
**Próximo:** Aplicar migration
