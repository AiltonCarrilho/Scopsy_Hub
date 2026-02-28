# CRÍTICO #2: Row Level Security (RLS) Implementation Guide

**Date:** 2026-02-28
**Status:** READY FOR EXECUTION
**Approach:** HYBRID (KISS + Granular)
**Risk Level:** LOW
**Execution Time:** ~15 minutes

---

## 📋 QUICK SUMMARY

This guide implements Row Level Security on Scopsy's database to prevent unauthorized data access.

**What happens:**
- ✅ Users can ONLY see their own data
- ✅ Each user is isolated from other users
- ✅ Backend (service_role) can still see all data
- ✅ All existing code continues to work

**What DOESN'T change:**
- ❌ No backend code changes needed
- ❌ No frontend changes needed
- ❌ No API changes

---

## 🎯 TABLES BEING PROTECTED

### Sensitive (Granular RLS - 4 policies each)
```
✓ user_progress          → User's learning progress
✓ sessions               → Login sessions
✓ user_badges            → Earned badges
✓ user_activity_log      → User activity log
✓ user_daily_missions    → Daily challenges
✓ plan_changes_audit     → Billing history (MOST SENSITIVE)
```

### Semi-Sensitive (KISS RLS - 1 policy for all)
```
✓ user_case_interactions → User interaction history
✓ user_achievements      → Achievements earned
✓ journey_sessions       → Therapy journey sessions
```

### Public (No RLS needed)
```
- cases                  → Clinical case library (shared)
- badges                 → Badge definitions (lookup)
- case_series            → Case series definitions (shared)
```

---

## ⚠️ BEFORE YOU START

### Prerequisites
- [ ] Access to Scopsy_Hub Supabase console
- [ ] Supabase API key with admin access
- [ ] Database connection working
- [ ] 15 minutes of uninterrupted time

### Backups
- [ ] Database backup created (if required by your policy)
- [ ] Rollback plan reviewed (see section below)

---

## 🚀 EXECUTION STEPS

### STEP 1: Review the SQL Script

**Location:** `sql-scripts/11-rls-hybrid-implementation.sql`

**What to do:**
```bash
# Open and review the script
cat sql-scripts/11-rls-hybrid-implementation.sql | head -100
```

**What to look for:**
- ✅ Comments explain each table
- ✅ Policies use `auth.uid()::BIGINT = user_id`
- ✅ All DROP POLICY statements are idempotent (safe to re-run)

---

### STEP 2: Apply RLS Implementation

**Option A: Via Supabase Console (Recommended for testing)**

1. Go to: https://app.supabase.com → Your Project → SQL Editor
2. Copy entire content of `11-rls-hybrid-implementation.sql`
3. Paste into SQL Editor
4. **Review the script one more time**
5. Click "Run"
6. Check for any errors

**Option B: Via psql CLI (For production)**

```bash
# Set database connection
export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres"

# Run the script
psql "$SUPABASE_DB_URL" -f sql-scripts/11-rls-hybrid-implementation.sql

# Expected output:
# CREATE POLICY
# CREATE POLICY
# ...
# (no errors should appear)
```

---

### STEP 3: Verify RLS is Enabled

Run the verification script:

**Location:** `sql-scripts/11-rls-test-validation.sql`

```bash
# Via Supabase Console:
# 1. Copy content of 11-rls-test-validation.sql
# 2. Paste in SQL Editor
# 3. Click "Run"
# 4. Review results

# Via psql:
psql "$SUPABASE_DB_URL" -f sql-scripts/11-rls-test-validation.sql
```

**Expected output:**
```
=== TEST 1: RLS Enabled ===
tablename                      | rls_status   | test_result
user_case_interactions         | ✓ ENABLED    | PASS
user_achievements              | ✓ ENABLED    | PASS
...
(9 rows)

=== TEST 2: Policies Exist ===
tablename                      | policy_count | test_result
user_case_interactions         | 1            | PASS - Policies exist
user_achievements              | 1            | PASS - Policies exist
user_progress                  | 4            | PASS - Policies exist
...
(9 rows)
```

---

### STEP 4: Test in Your Application

Test with real users:

1. **Open your app** (frontend)
2. **Login as User A**
3. **View your profile/progress** → Should see YOUR data only
4. **Try to access User B's data** → Should get empty results or error

**What could go wrong at this stage:**
- User A sees data from User B → RLS policy issue
- Can't see own data → RLS policy too restrictive
- App crashes → Backend code issue with RLS

---

## 🔄 ROLLBACK (If Something Goes Wrong)

### Quick Rollback - Disable RLS Entirely

**If policies are causing issues, quickly disable RLS:**

```sql
-- Disable RLS on all tables (NOT SAFE for production)
ALTER TABLE user_case_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE journey_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan_changes_audit DISABLE ROW LEVEL SECURITY;
```

**Then investigate the specific policy issue.**

### Full Rollback - Drop All Policies

```sql
-- Drop all RLS policies
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

-- Disable RLS
ALTER TABLE user_case_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE journey_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan_changes_audit DISABLE ROW LEVEL SECURITY;
```

---

## 🐛 TROUBLESHOOTING

### Problem: "User cannot see their own data"

**Cause:** RLS policy is too restrictive

**Solution:**
1. Check if `user_id` column exists in the table
2. Verify `auth.uid()` returns the correct user ID
3. Ensure no type mismatch (UUID vs BIGINT)

**Debug Query:**
```sql
-- Check user_id column type
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_progress'
  AND column_name = 'user_id';

-- Check auth.uid() type
SELECT auth.uid(), typeof(auth.uid()::BIGINT);
```

### Problem: "User can see other users' data"

**Cause:** RLS policy not working correctly

**Solution:**
1. Verify RLS is enabled: `SELECT rowsecurity FROM pg_tables WHERE tablename='user_progress'`
2. Check if policies exist: `SELECT * FROM pg_policies WHERE tablename='user_progress'`
3. Verify policy conditions are correct
4. Check if service_role is being used by frontend (it shouldn't be)

### Problem: "Policy X doesn't exist"

**Cause:** Policy creation failed

**Solution:**
1. Check for SQL errors in the creation script
2. Verify table exists
3. Re-run the creation script

### Problem: "Backend code fails with RLS"

**Cause:** Backend is using wrong role or missing user_id

**Solution:**
1. Ensure backend always includes `user_id` when inserting/updating
2. Ensure backend uses `authenticated` role, not `service_role` (unless intended)
3. Check that JWT tokens include correct user ID

---

## 📊 VERIFICATION QUERIES

### Query 1: Check RLS Status

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_case_interactions', 'user_achievements', 'journey_sessions',
    'user_progress', 'sessions', 'user_badges', 'user_activity_log',
    'user_daily_missions', 'plan_changes_audit'
  )
ORDER BY tablename;
```

**Expected:** All should show `rowsecurity = true`

### Query 2: Count Policies

```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_case_interactions', 'user_achievements', 'journey_sessions',
    'user_progress', 'sessions', 'user_badges', 'user_activity_log',
    'user_daily_missions', 'plan_changes_audit'
  )
GROUP BY tablename
ORDER BY tablename;
```

**Expected:** KISS tables = 1 policy, Granular tables = 4 policies

### Query 3: List All Policies

```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_case_interactions', 'user_achievements', 'journey_sessions',
    'user_progress', 'sessions', 'user_badges', 'user_activity_log',
    'user_daily_missions', 'plan_changes_audit'
  )
ORDER BY tablename, policyname;
```

---

## 📝 POST-IMPLEMENTATION CHECKLIST

- [ ] RLS script executed without errors
- [ ] Verification script shows all tables have RLS
- [ ] Manual testing shows users can only see own data
- [ ] Backend tests pass
- [ ] Frontend app works correctly
- [ ] No regression in existing features
- [ ] Monitored logs for any errors

---

## 📞 SUPPORT

If you encounter issues:

1. **Check:** `.planning/CRITICAL-RLS-ISSUES.md` (troubleshooting log)
2. **Review:** Database logs in Supabase Console → Logs
3. **Contact:** Backend team for code-related issues

---

## ✅ NEXT STEPS (After Successful Implementation)

1. **Document:** RLS policies in your team wiki
2. **Train:** Team members on RLS best practices
3. **Monitor:** Check logs for RLS-related errors
4. **Plan:** Review RLS configuration quarterly
5. **Proceed:** To CRÍTICO #3 (Kiwify Webhooks)

---

**Status:** Ready for execution
**Prepared by:** Claude Code
**Date:** 2026-02-28
