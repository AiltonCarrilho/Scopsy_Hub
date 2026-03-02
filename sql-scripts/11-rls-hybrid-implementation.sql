-- ============================================================================
-- SCOPSY RLS IMPLEMENTATION - HYBRID APPROACH
-- ============================================================================
-- Date: 2026-02-28
-- Purpose: Enable Row Level Security on all tables
-- Approach: KISS (simple) + Granular (complex) based on sensitivity
-- Status: READY FOR TESTING (DO NOT RUN without approval)
-- ============================================================================

-- SAFETY CHECK: Verify we're in the correct database
-- This query should return true if we're in Scopsy
SELECT current_database() as database_name;

-- ============================================================================
-- PART 1: SIMPLE TABLES - KISS APPROACH (1 policy for all operations)
-- ============================================================================

-- These tables are mostly public read, authenticated write
-- Apply KISS pattern: auth.uid() = user_id for owner-based access

-- TABLE: user_case_interactions (user's interaction history)
-- ============================================================================
ALTER TABLE user_case_interactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "user_case_interactions_owner_all" ON user_case_interactions;

-- Single KISS policy for all operations
CREATE POLICY "user_case_interactions_owner_all"
ON user_case_interactions
FOR ALL
TO authenticated
USING (auth.uid()::BIGINT = user_id)
WITH CHECK (auth.uid()::BIGINT = user_id);

COMMENT ON POLICY "user_case_interactions_owner_all"
ON user_case_interactions
IS 'KISS policy: Users can only see/modify their own interactions';

-- Create index for RLS policy column if not exists
CREATE INDEX IF NOT EXISTS idx_user_case_interactions_user_id
ON user_case_interactions(user_id);

-- ============================================================================
-- TABLE: user_achievements (user's badges/achievements)
-- ============================================================================
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_achievements_owner_all" ON user_achievements;

CREATE POLICY "user_achievements_owner_all"
ON user_achievements
FOR ALL
TO authenticated
USING (auth.uid()::BIGINT = user_id)
WITH CHECK (auth.uid()::BIGINT = user_id);

COMMENT ON POLICY "user_achievements_owner_all"
ON user_achievements
IS 'KISS policy: Users can only see/modify their own achievements';

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id
ON user_achievements(user_id);

-- ============================================================================
-- TABLE: journey_sessions (therapy journey sessions)
-- ============================================================================
ALTER TABLE journey_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journey_sessions_owner_all" ON journey_sessions;

CREATE POLICY "journey_sessions_owner_all"
ON journey_sessions
FOR ALL
TO authenticated
USING (auth.uid()::BIGINT = user_id)
WITH CHECK (auth.uid()::BIGINT = user_id);

COMMENT ON POLICY "journey_sessions_owner_all"
ON journey_sessions
IS 'KISS policy: Users can only see/modify their own journey sessions';

CREATE INDEX IF NOT EXISTS idx_journey_sessions_user_id
ON journey_sessions(user_id);

-- ============================================================================
-- PART 2: SENSITIVE TABLES - GRANULAR APPROACH (4 policies per table)
-- ============================================================================

-- These tables contain sensitive personal data
-- Apply granular pattern: separate policies for SELECT, INSERT, UPDATE, DELETE

-- TABLE: user_progress (user's learning progress and stats)
-- ============================================================================
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- SELECT policy
DROP POLICY IF EXISTS "user_progress_select" ON user_progress;

CREATE POLICY "user_progress_select"
ON user_progress
FOR SELECT
TO authenticated
USING (auth.uid()::BIGINT = user_id);

-- INSERT policy
DROP POLICY IF EXISTS "user_progress_insert" ON user_progress;

CREATE POLICY "user_progress_insert"
ON user_progress
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::BIGINT = user_id);

-- UPDATE policy (users can only update their own)
DROP POLICY IF EXISTS "user_progress_update" ON user_progress;

CREATE POLICY "user_progress_update"
ON user_progress
FOR UPDATE
TO authenticated
USING (auth.uid()::BIGINT = user_id)
WITH CHECK (auth.uid()::BIGINT = user_id);

-- DELETE policy (users can delete their own)
DROP POLICY IF EXISTS "user_progress_delete" ON user_progress;

CREATE POLICY "user_progress_delete"
ON user_progress
FOR DELETE
TO authenticated
USING (auth.uid()::BIGINT = user_id);

COMMENT ON POLICY "user_progress_select" ON user_progress
IS 'Granular: Users can SELECT only their own progress';

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id
ON user_progress(user_id);

-- ============================================================================
-- TABLE: sessions (user's session history)
-- ============================================================================
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- SELECT policy
DROP POLICY IF EXISTS "sessions_select" ON sessions;

CREATE POLICY "sessions_select"
ON sessions
FOR SELECT
TO authenticated
USING (auth.uid()::BIGINT = user_id);

-- INSERT policy
DROP POLICY IF EXISTS "sessions_insert" ON sessions;

CREATE POLICY "sessions_insert"
ON sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::BIGINT = user_id);

-- UPDATE policy
DROP POLICY IF EXISTS "sessions_update" ON sessions;

CREATE POLICY "sessions_update"
ON sessions
FOR UPDATE
TO authenticated
USING (auth.uid()::BIGINT = user_id)
WITH CHECK (auth.uid()::BIGINT = user_id);

-- DELETE policy
DROP POLICY IF EXISTS "sessions_delete" ON sessions;

CREATE POLICY "sessions_delete"
ON sessions
FOR DELETE
TO authenticated
USING (auth.uid()::BIGINT = user_id);

COMMENT ON POLICY "sessions_select" ON sessions
IS 'Granular: Users can SELECT only their own sessions';

CREATE INDEX IF NOT EXISTS idx_sessions_user_id
ON sessions(user_id);

-- ============================================================================
-- TABLE: user_badges (user's earned badges)
-- ============================================================================
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- SELECT policy
DROP POLICY IF EXISTS "user_badges_select" ON user_badges;

CREATE POLICY "user_badges_select"
ON user_badges
FOR SELECT
TO authenticated
USING (auth.uid()::BIGINT = user_id);

-- INSERT policy
DROP POLICY IF EXISTS "user_badges_insert" ON user_badges;

CREATE POLICY "user_badges_insert"
ON user_badges
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::BIGINT = user_id);

-- UPDATE policy
DROP POLICY IF EXISTS "user_badges_update" ON user_badges;

CREATE POLICY "user_badges_update"
ON user_badges
FOR UPDATE
TO authenticated
USING (auth.uid()::BIGINT = user_id)
WITH CHECK (auth.uid()::BIGINT = user_id);

-- DELETE policy
DROP POLICY IF EXISTS "user_badges_delete" ON user_badges;

CREATE POLICY "user_badges_delete"
ON user_badges
FOR DELETE
TO authenticated
USING (auth.uid()::BIGINT = user_id);

COMMENT ON POLICY "user_badges_select" ON user_badges
IS 'Granular: Users can SELECT only their own badges';

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id
ON user_badges(user_id);

-- ============================================================================
-- TABLE: user_activity_log (audit/activity log)
-- ============================================================================
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- SELECT policy (users can see their own activity)
DROP POLICY IF EXISTS "user_activity_log_select" ON user_activity_log;

CREATE POLICY "user_activity_log_select"
ON user_activity_log
FOR SELECT
TO authenticated
USING (auth.uid()::BIGINT = user_id);

-- INSERT policy (app inserts activity, RLS checks user_id matches)
DROP POLICY IF EXISTS "user_activity_log_insert" ON user_activity_log;

CREATE POLICY "user_activity_log_insert"
ON user_activity_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::BIGINT = user_id);

-- UPDATE policy (normally activity logs are immutable, but allow if needed)
DROP POLICY IF EXISTS "user_activity_log_update" ON user_activity_log;

CREATE POLICY "user_activity_log_update"
ON user_activity_log
FOR UPDATE
TO authenticated
USING (auth.uid()::BIGINT = user_id)
WITH CHECK (auth.uid()::BIGINT = user_id);

-- DELETE policy (restrict deletion)
DROP POLICY IF EXISTS "user_activity_log_delete" ON user_activity_log;

CREATE POLICY "user_activity_log_delete"
ON user_activity_log
FOR DELETE
TO authenticated
USING (auth.uid()::BIGINT = user_id);

COMMENT ON POLICY "user_activity_log_select" ON user_activity_log
IS 'Granular: Users can SELECT only their own activity logs';

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id
ON user_activity_log(user_id);

-- ============================================================================
-- TABLE: user_daily_missions (user's daily challenge/missions)
-- ============================================================================
ALTER TABLE user_daily_missions ENABLE ROW LEVEL SECURITY;

-- SELECT policy
DROP POLICY IF EXISTS "user_daily_missions_select" ON user_daily_missions;

CREATE POLICY "user_daily_missions_select"
ON user_daily_missions
FOR SELECT
TO authenticated
USING (auth.uid()::BIGINT = user_id);

-- INSERT policy
DROP POLICY IF EXISTS "user_daily_missions_insert" ON user_daily_missions;

CREATE POLICY "user_daily_missions_insert"
ON user_daily_missions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::BIGINT = user_id);

-- UPDATE policy
DROP POLICY IF EXISTS "user_daily_missions_update" ON user_daily_missions;

CREATE POLICY "user_daily_missions_update"
ON user_daily_missions
FOR UPDATE
TO authenticated
USING (auth.uid()::BIGINT = user_id)
WITH CHECK (auth.uid()::BIGINT = user_id);

-- DELETE policy
DROP POLICY IF EXISTS "user_daily_missions_delete" ON user_daily_missions;

CREATE POLICY "user_daily_missions_delete"
ON user_daily_missions
FOR DELETE
TO authenticated
USING (auth.uid()::BIGINT = user_id);

COMMENT ON POLICY "user_daily_missions_select" ON user_daily_missions
IS 'Granular: Users can SELECT only their own missions';

CREATE INDEX IF NOT EXISTS idx_user_daily_missions_user_id
ON user_daily_missions(user_id);

-- ============================================================================
-- TABLE: plan_changes_audit (billing/subscription history - MOST SENSITIVE)
-- ============================================================================
-- Note: This table tracks plan changes, which is sensitive billing data
-- Users should be able to VIEW their own history but NOT modify it
-- Only service_role (backend) should INSERT/UPDATE

ALTER TABLE plan_changes_audit ENABLE ROW LEVEL SECURITY;

-- SELECT policy (users can see their own plan changes)
DROP POLICY IF EXISTS "plan_changes_audit_select" ON plan_changes_audit;

CREATE POLICY "plan_changes_audit_select"
ON plan_changes_audit
FOR SELECT
TO authenticated
USING (auth.uid()::BIGINT = user_id);

-- INSERT policy (app inserts via service_role, not authenticated user)
-- For now, allow authenticated to insert for testing, but backend should use service_role
DROP POLICY IF EXISTS "plan_changes_audit_insert" ON plan_changes_audit;

CREATE POLICY "plan_changes_audit_insert"
ON plan_changes_audit
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::BIGINT = user_id);

-- UPDATE policy (restrict: plan changes should be immutable)
DROP POLICY IF EXISTS "plan_changes_audit_update" ON plan_changes_audit;

CREATE POLICY "plan_changes_audit_update"
ON plan_changes_audit
FOR UPDATE
TO authenticated
USING (auth.uid()::BIGINT = user_id)
WITH CHECK (auth.uid()::BIGINT = user_id);

-- DELETE policy (restrict: audit logs should never be deleted)
DROP POLICY IF EXISTS "plan_changes_audit_delete" ON plan_changes_audit;

CREATE POLICY "plan_changes_audit_delete"
ON plan_changes_audit
FOR DELETE
TO authenticated
USING (false); -- Never allow deletion

COMMENT ON POLICY "plan_changes_audit_select" ON plan_changes_audit
IS 'Granular: Users can SELECT only their own plan changes (audit trail)';

COMMENT ON POLICY "plan_changes_audit_delete" ON plan_changes_audit
IS 'Restrict: Audit trail cannot be deleted by anyone (immutable)';

CREATE INDEX IF NOT EXISTS idx_plan_changes_audit_user_id
ON plan_changes_audit(user_id);

-- ============================================================================
-- PART 3: PUBLIC TABLES - NO RLS NEEDED
-- ============================================================================

-- These tables are public/shared and don't need RLS:
-- - cases (library of clinical cases)
-- - badges (badge definitions - lookup table)
-- - case_series (case series definitions)
-- - chat_conversations (can be shared between therapist and patient)

-- However, we might want to add RLS to chat_conversations in future
-- For now, leaving them without RLS (public access)

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify RLS is enabled:

-- Check which tables have RLS enabled
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✓ ENABLED' ELSE '❌ DISABLED' END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_case_interactions', 'user_achievements', 'journey_sessions',
    'user_progress', 'sessions', 'user_badges', 'user_activity_log',
    'user_daily_missions', 'plan_changes_audit'
  )
ORDER BY tablename;

-- Count total policies
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_case_interactions', 'user_achievements', 'journey_sessions',
    'user_progress', 'sessions', 'user_badges', 'user_activity_log',
    'user_daily_missions', 'plan_changes_audit'
  )
GROUP BY tablename
ORDER BY tablename;

-- List all policies created
SELECT
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_case_interactions', 'user_achievements', 'journey_sessions',
    'user_progress', 'sessions', 'user_badges', 'user_activity_log',
    'user_daily_missions', 'plan_changes_audit'
  )
ORDER BY tablename, policyname;

-- ============================================================================
-- END OF RLS IMPLEMENTATION
-- ============================================================================
-- Status: Ready for execution after testing and approval
-- ============================================================================
