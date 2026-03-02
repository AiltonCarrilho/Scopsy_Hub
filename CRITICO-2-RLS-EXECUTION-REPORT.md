# CRITICO #2 - RLS Execution Report

**Agent:** Dara (Data Engineer)
**Date:** 2026-02-28
**Status:** PREPARED - AWAITING MANUAL EXECUTION
**Spec:** `docs/CRITICO-2-CUSTOM-AUTH-RLS-SPEC.md`

---

## 1. Artifacts Created

| # | File | Purpose |
|---|------|---------|
| 1 | `sql-scripts/13-rls-defense-in-depth.sql` | Main migration: Enable RLS + create DENY policies on 9 tables |
| 2 | `sql-scripts/13-rls-defense-in-depth-ROLLBACK.sql` | Emergency rollback: Disable RLS + drop all policies |
| 3 | `sql-scripts/13-rls-security-test.js` | Node.js test script for anon/service_role verification |

## 2. Migration Summary

### What the migration does:

1. **Enables RLS** on 9 tables: `users`, `user_progress`, `user_stats`, `user_case_interactions`, `user_achievements`, `journey_sessions`, `sessions`, `user_activity_log`, `user_daily_missions`

2. **Creates DENY policies** for `anon` and `authenticated` roles on 8 data tables (all except `users`). This blocks all access via `SUPABASE_ANON_KEY` to these tables.

3. **Creates special policies** on `users` table:
   - `anon` can SELECT (needed for login email lookup)
   - `anon` can INSERT (needed for signup)
   - `anon` CANNOT UPDATE or DELETE
   - `authenticated` denied all access

4. **Creates indexes** on `user_id` columns for query performance (IF NOT EXISTS, safe to rerun)

5. **service_role bypasses RLS** by PostgreSQL default -- no policy needed. All existing route code using `SUPABASE_SERVICE_ROLE_KEY` continues working unchanged.

### Policy count expected: 21 total
- 8 data tables x 2 policies each = 16 DENY policies
- `users` table: 5 policies (anon_select, anon_insert, anon_deny_update, anon_deny_delete, authenticated_deny)

### Backend changes required: NONE
All route files use `service_role_key` which bypasses RLS. Zero code changes needed.

---

## 3. Execution Instructions

### Option A: Supabase SQL Editor (RECOMMENDED)

1. Go to https://app.supabase.com
2. Select the Scopsy project
3. Navigate to SQL Editor
4. Copy the FULL contents of `sql-scripts/13-rls-defense-in-depth.sql`
5. Paste into the editor
6. **IMPORTANT:** The script uses `BEGIN;`/`COMMIT;` for transactional safety. Supabase SQL Editor may require you to remove these if it auto-wraps in a transaction. If you get an error about nested transactions, remove the `BEGIN;` and `COMMIT;` lines and run again.
7. Click "Run"
8. Verify the two SELECT statements at the bottom show:
   - 9 tables with `rls_status = ENABLED`
   - 21 policies listed

### Option B: Via psql CLI

```bash
cd "D:\projetos.vscode\Scopsy_Hub"
psql "$SUPABASE_DB_URL" -f sql-scripts/13-rls-defense-in-depth.sql
```

---

## 4. Post-Execution Validation

### Test 1: Verify RLS enabled (SQL Editor)

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'user_progress', 'user_stats',
    'user_case_interactions', 'user_achievements',
    'journey_sessions', 'sessions',
    'user_activity_log', 'user_daily_missions'
  )
ORDER BY tablename;
```

Expected: All 9 rows show `rowsecurity = true`

### Test 2: Verify policies exist (SQL Editor)

```sql
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Expected: 21 policies listed

### Test 3: Run security test script

```bash
cd "D:\projetos.vscode\Scopsy_Hub"
node sql-scripts/13-rls-security-test.js
```

Expected: All tests pass

### Test 4: Test application flow (manual)

```bash
# Test signup (anon_key -> INSERT into users)
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"rls-test@test.com","password":"test12345","name":"RLS Test"}'

# Test login (anon_key -> SELECT from users)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rls-test@test.com","password":"test12345"}'

# Test authenticated route (service_role_key -> bypasses RLS)
curl http://localhost:3000/api/dashboard/stats \
  -H "Authorization: Bearer {token_from_login}"
```

---

## 5. Rollback Procedure

If anything breaks:

1. Open Supabase SQL Editor
2. Copy contents of `sql-scripts/13-rls-defense-in-depth-ROLLBACK.sql`
3. Run it
4. Verify all 9 tables show `rowsecurity = false`

Time: under 1 minute. No data loss.

---

## 6. Execution Log

> Fill in after execution:

| Step | Time | Result | Notes |
|------|------|--------|-------|
| Execute SQL | | | |
| Test 1: RLS enabled | | | |
| Test 2: Policies exist | | | |
| Test 3: Security test | | | |
| Test 4: Application flow | | | |

**Final Status:** [ ] COMPLETED / [ ] ROLLBACK EXECUTED

---

## 7. Architecture Notes

This implementation follows **Option C: Dual-Client with Defense-in-Depth** from the spec:

- **Layer 1 (Primary):** Express JWT middleware validates identity
- **Layer 2 (Primary):** Application-level `.eq('user_id', userId)` filters
- **Layer 3 (Safety Net):** RLS blocks `anon_key` and `authenticated` role access

The `service_role_key` intentionally bypasses RLS. This is correct because:
1. It lives server-side only, never exposed to clients
2. Application code already filters by `user_id`
3. The primary threat is a leaked `anon_key`, which is now fully blocked from data tables

### Superseded files (no longer needed):
- `sql-scripts/11-rls-hybrid-implementation.sql` -- uses `auth.uid()` which returns NULL for custom JWT
- `sql-scripts/12-rls-jwt-context-implementation.sql` -- uses session variables which break with PgBouncer

---

-- Dara, arquitetando dados
