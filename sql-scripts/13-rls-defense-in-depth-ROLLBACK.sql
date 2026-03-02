-- ============================================================================
-- ROLLBACK: 13-rls-defense-in-depth.sql
-- Purpose: Completely disable RLS and remove all policies created by migration 13
-- Time: < 1 minute
-- Safe: No data affected, takes effect immediately
-- ============================================================================

BEGIN;

-- STEP 1: Disable RLS on all 9 tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_case_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE journey_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_missions DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop all policies created by migration 13
-- Data tables DENY policies
DROP POLICY IF EXISTS "user_progress_deny_anon" ON user_progress;
DROP POLICY IF EXISTS "user_progress_deny_authenticated" ON user_progress;
DROP POLICY IF EXISTS "user_stats_deny_anon" ON user_stats;
DROP POLICY IF EXISTS "user_stats_deny_authenticated" ON user_stats;
DROP POLICY IF EXISTS "user_case_interactions_deny_anon" ON user_case_interactions;
DROP POLICY IF EXISTS "user_case_interactions_deny_authenticated" ON user_case_interactions;
DROP POLICY IF EXISTS "user_achievements_deny_anon" ON user_achievements;
DROP POLICY IF EXISTS "user_achievements_deny_authenticated" ON user_achievements;
DROP POLICY IF EXISTS "journey_sessions_deny_anon" ON journey_sessions;
DROP POLICY IF EXISTS "journey_sessions_deny_authenticated" ON journey_sessions;
DROP POLICY IF EXISTS "sessions_deny_anon" ON sessions;
DROP POLICY IF EXISTS "sessions_deny_authenticated" ON sessions;
DROP POLICY IF EXISTS "user_activity_log_deny_anon" ON user_activity_log;
DROP POLICY IF EXISTS "user_activity_log_deny_authenticated" ON user_activity_log;
DROP POLICY IF EXISTS "user_daily_missions_deny_anon" ON user_daily_missions;
DROP POLICY IF EXISTS "user_daily_missions_deny_authenticated" ON user_daily_missions;

-- Users table policies
DROP POLICY IF EXISTS "users_anon_select" ON users;
DROP POLICY IF EXISTS "users_anon_insert" ON users;
DROP POLICY IF EXISTS "users_anon_deny_update" ON users;
DROP POLICY IF EXISTS "users_anon_deny_delete" ON users;
DROP POLICY IF EXISTS "users_authenticated_deny" ON users;

-- NOTE: Indexes are NOT dropped (they improve query performance regardless of RLS)

COMMIT;

-- Verification
SELECT
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'user_progress', 'user_stats',
    'user_case_interactions', 'user_achievements',
    'journey_sessions', 'sessions',
    'user_activity_log', 'user_daily_missions'
  )
ORDER BY tablename;
