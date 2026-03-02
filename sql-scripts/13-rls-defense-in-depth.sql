-- ============================================================================
-- SCOPSY RLS - DEFENSE-IN-DEPTH STRATEGY
-- Migration: 13-rls-defense-in-depth.sql
-- Author: Dara (Data Engineer Agent) based on Aria's spec
-- Date: 2026-02-28
-- Spec: docs/CRITICO-2-CUSTOM-AUTH-RLS-SPEC.md (Option C)
-- ============================================================================
-- Architecture: Custom JWT + service_role_key (bypasses RLS)
-- Strategy: DENY anon/authenticated roles, service_role passes through
-- Purpose: Prevent data leaks via anon_key; service_role handles app queries
--
-- ROLLBACK: See section at bottom or run:
--   ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;
--   on all 9 tables
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Enable RLS on all 9 tables
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_case_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_missions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 1.5: Clean up old policies from superseded scripts (11 and 12)
-- These used auth.uid() or current_setting() which do not work with custom JWT
-- ============================================================================

-- From script 11 (auth.uid() based)
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
DROP POLICY IF EXISTS "user_activity_log_select" ON user_activity_log;
DROP POLICY IF EXISTS "user_activity_log_insert" ON user_activity_log;
DROP POLICY IF EXISTS "user_activity_log_update" ON user_activity_log;
DROP POLICY IF EXISTS "user_activity_log_delete" ON user_activity_log;
DROP POLICY IF EXISTS "user_daily_missions_select" ON user_daily_missions;
DROP POLICY IF EXISTS "user_daily_missions_insert" ON user_daily_missions;
DROP POLICY IF EXISTS "user_daily_missions_update" ON user_daily_missions;
DROP POLICY IF EXISTS "user_daily_missions_delete" ON user_daily_missions;
DROP POLICY IF EXISTS "user_badges_select" ON user_stats;
DROP POLICY IF EXISTS "user_badges_insert" ON user_stats;
DROP POLICY IF EXISTS "user_badges_update" ON user_stats;
DROP POLICY IF EXISTS "user_badges_delete" ON user_stats;

-- Drop the set_auth_context function from script 12 (no longer needed)
DROP FUNCTION IF EXISTS set_auth_context(BIGINT);

-- ============================================================================
-- STEP 2: DENY policies for data tables (anon + authenticated)
-- service_role bypasses automatically (PostgreSQL default)
-- ============================================================================

-- user_progress
DROP POLICY IF EXISTS "user_progress_deny_anon" ON user_progress;
CREATE POLICY "user_progress_deny_anon" ON user_progress FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "user_progress_deny_authenticated" ON user_progress;
CREATE POLICY "user_progress_deny_authenticated" ON user_progress FOR ALL TO authenticated USING (false);

-- user_stats
DROP POLICY IF EXISTS "user_stats_deny_anon" ON user_stats;
CREATE POLICY "user_stats_deny_anon" ON user_stats FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "user_stats_deny_authenticated" ON user_stats;
CREATE POLICY "user_stats_deny_authenticated" ON user_stats FOR ALL TO authenticated USING (false);

-- user_case_interactions
DROP POLICY IF EXISTS "user_case_interactions_deny_anon" ON user_case_interactions;
CREATE POLICY "user_case_interactions_deny_anon" ON user_case_interactions FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "user_case_interactions_deny_authenticated" ON user_case_interactions;
CREATE POLICY "user_case_interactions_deny_authenticated" ON user_case_interactions FOR ALL TO authenticated USING (false);

-- user_achievements
DROP POLICY IF EXISTS "user_achievements_deny_anon" ON user_achievements;
CREATE POLICY "user_achievements_deny_anon" ON user_achievements FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "user_achievements_deny_authenticated" ON user_achievements;
CREATE POLICY "user_achievements_deny_authenticated" ON user_achievements FOR ALL TO authenticated USING (false);

-- journey_sessions
DROP POLICY IF EXISTS "journey_sessions_deny_anon" ON journey_sessions;
CREATE POLICY "journey_sessions_deny_anon" ON journey_sessions FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "journey_sessions_deny_authenticated" ON journey_sessions;
CREATE POLICY "journey_sessions_deny_authenticated" ON journey_sessions FOR ALL TO authenticated USING (false);

-- sessions
DROP POLICY IF EXISTS "sessions_deny_anon" ON sessions;
CREATE POLICY "sessions_deny_anon" ON sessions FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "sessions_deny_authenticated" ON sessions;
CREATE POLICY "sessions_deny_authenticated" ON sessions FOR ALL TO authenticated USING (false);

-- user_activity_log
DROP POLICY IF EXISTS "user_activity_log_deny_anon" ON user_activity_log;
CREATE POLICY "user_activity_log_deny_anon" ON user_activity_log FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "user_activity_log_deny_authenticated" ON user_activity_log;
CREATE POLICY "user_activity_log_deny_authenticated" ON user_activity_log FOR ALL TO authenticated USING (false);

-- user_daily_missions
DROP POLICY IF EXISTS "user_daily_missions_deny_anon" ON user_daily_missions;
CREATE POLICY "user_daily_missions_deny_anon" ON user_daily_missions FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "user_daily_missions_deny_authenticated" ON user_daily_missions;
CREATE POLICY "user_daily_missions_deny_authenticated" ON user_daily_missions FOR ALL TO authenticated USING (false);

-- ============================================================================
-- STEP 3: USERS table special policies (anon_key used for auth flow)
-- ============================================================================

-- Drop any old policies first (idempotent)
DROP POLICY IF EXISTS "users_anon_select" ON users;
DROP POLICY IF EXISTS "users_anon_insert" ON users;
DROP POLICY IF EXISTS "users_anon_deny_update" ON users;
DROP POLICY IF EXISTS "users_anon_deny_delete" ON users;
DROP POLICY IF EXISTS "users_authenticated_deny" ON users;

-- Also drop policies from superseded scripts (11 and 12)
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "allow_read_own_data" ON users;
DROP POLICY IF EXISTS "allow_insert_own_data" ON users;
DROP POLICY IF EXISTS "allow_update_own_data" ON users;

-- Allow anon to SELECT (needed for login email lookup)
CREATE POLICY "users_anon_select"
ON users FOR SELECT TO anon USING (true);

-- Allow anon to INSERT (needed for signup)
CREATE POLICY "users_anon_insert"
ON users FOR INSERT TO anon WITH CHECK (true);

-- Deny anon UPDATE and DELETE
CREATE POLICY "users_anon_deny_update"
ON users FOR UPDATE TO anon USING (false);

CREATE POLICY "users_anon_deny_delete"
ON users FOR DELETE TO anon USING (false);

-- Deny authenticated role (not used by app)
CREATE POLICY "users_authenticated_deny"
ON users FOR ALL TO authenticated USING (false);

-- ============================================================================
-- STEP 4: Ensure indexes exist for user_id columns (performance)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_case_interactions_user_id ON user_case_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_sessions_user_id ON journey_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_missions_user_id ON user_daily_missions(user_id);

COMMIT;

-- ============================================================================
-- STEP 5: Verification (run after COMMIT)
-- ============================================================================

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

SELECT
  schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
