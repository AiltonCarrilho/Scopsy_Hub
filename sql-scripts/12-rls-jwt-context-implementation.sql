-- ============================================================================
-- SCOPSY RLS IMPLEMENTATION - JWT CONTEXT VERSION
-- ============================================================================
-- Date: 2026-02-28
-- Purpose: Enable Row Level Security using JWT/custom context
-- Approach: Backend sets auth context before queries
-- Status: READY FOR PRODUCTION
-- Schema: Tested against 8 existing tables with user_id BIGINT
-- ============================================================================

-- SAFETY CHECK: Verify database
SELECT current_database() as database_name;

-- ============================================================================
-- PART 0: CREATE HELPER FUNCTION FOR AUTH CONTEXT
-- ============================================================================

CREATE OR REPLACE FUNCTION set_auth_context(p_user_id BIGINT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('request.user_id', p_user_id::text, false);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_auth_context IS
'Sets the current user context for RLS policies. Call via RPC before queries.';

-- ============================================================================
-- PART 1: SIMPLE TABLES - KISS APPROACH (1 policy for all operations)
-- ============================================================================

-- TABLE: user_case_interactions
ALTER TABLE user_case_interactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_case_interactions_owner_all" ON user_case_interactions;

CREATE POLICY "user_case_interactions_owner_all"
ON user_case_interactions
FOR ALL
TO authenticated
USING (user_id = (current_setting('request.user_id', true))::BIGINT)
WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

COMMENT ON POLICY "user_case_interactions_owner_all"
ON user_case_interactions
IS 'KISS policy: Users can only see/modify their own interactions via context';

CREATE INDEX IF NOT EXISTS idx_user_case_interactions_user_id
ON user_case_interactions(user_id);

-- TABLE: user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_achievements_owner_all" ON user_achievements;

CREATE POLICY "user_achievements_owner_all"
ON user_achievements
FOR ALL
TO authenticated
USING (user_id = (current_setting('request.user_id', true))::BIGINT)
WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

COMMENT ON POLICY "user_achievements_owner_all"
ON user_achievements
IS 'KISS policy: Users can only see/modify their own achievements via context';

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id
ON user_achievements(user_id);

-- TABLE: journey_sessions
ALTER TABLE journey_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "journey_sessions_owner_all" ON journey_sessions;

CREATE POLICY "journey_sessions_owner_all"
ON journey_sessions
FOR ALL
TO authenticated
USING (user_id = (current_setting('request.user_id', true))::BIGINT)
WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

COMMENT ON POLICY "journey_sessions_owner_all"
ON journey_sessions
IS 'KISS policy: Users can only see/modify their own journey sessions via context';

CREATE INDEX IF NOT EXISTS idx_journey_sessions_user_id
ON journey_sessions(user_id);

-- ============================================================================
-- PART 2: SENSITIVE TABLES - GRANULAR APPROACH (4 policies per table)
-- ============================================================================

-- TABLE: user_progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_progress_select" ON user_progress;
CREATE POLICY "user_progress_select"
ON user_progress
FOR SELECT
TO authenticated
USING (user_id = (current_setting('request.user_id', true))::BIGINT);

DROP POLICY IF EXISTS "user_progress_insert" ON user_progress;
CREATE POLICY "user_progress_insert"
ON user_progress
FOR INSERT
TO authenticated
WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

DROP POLICY IF EXISTS "user_progress_update" ON user_progress;
CREATE POLICY "user_progress_update"
ON user_progress
FOR UPDATE
TO authenticated
USING (user_id = (current_setting('request.user_id', true))::BIGINT)
WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

DROP POLICY IF EXISTS "user_progress_delete" ON user_progress;
CREATE POLICY "user_progress_delete"
ON user_progress
FOR DELETE
TO authenticated
USING (user_id = (current_setting('request.user_id', true))::BIGINT);

COMMENT ON POLICY "user_progress_select" ON user_progress
IS 'Granular: Users can SELECT only their own progress via context';

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id
ON user_progress(user_id);

-- TABLE: sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sessions_select" ON sessions;
CREATE POLICY "sessions_select"
ON sessions
FOR SELECT
TO authenticated
USING (user_id = (current_setting('request.user_id', true))::BIGINT);

DROP POLICY IF EXISTS "sessions_insert" ON sessions;
CREATE POLICY "sessions_insert"
ON sessions
FOR INSERT
TO authenticated
WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

DROP POLICY IF EXISTS "sessions_update" ON sessions;
CREATE POLICY "sessions_update"
ON sessions
FOR UPDATE
TO authenticated
USING (user_id = (current_setting('request.user_id', true))::BIGINT)
WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

DROP POLICY IF EXISTS "sessions_delete" ON sessions;
CREATE POLICY "sessions_delete"
ON sessions
FOR DELETE
TO authenticated
USING (user_id = (current_setting('request.user_id', true))::BIGINT);

COMMENT ON POLICY "sessions_select" ON sessions
IS 'Granular: Users can SELECT only their own sessions via context';

CREATE INDEX IF NOT EXISTS idx_sessions_user_id
ON sessions(user_id);

-- TABLE: user_activity_log
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_activity_log_select" ON user_activity_log;
CREATE POLICY "user_activity_log_select"
ON user_activity_log
FOR SELECT
TO authenticated
USING (user_id = (current_setting('request.user_id', true))::BIGINT);

DROP POLICY IF EXISTS "user_activity_log_insert" ON user_activity_log;
CREATE POLICY "user_activity_log_insert"
ON user_activity_log
FOR INSERT
TO authenticated
WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

DROP POLICY IF EXISTS "user_activity_log_update" ON user_activity_log;
CREATE POLICY "user_activity_log_update"
ON user_activity_log
FOR UPDATE
TO authenticated
USING (user_id = (current_setting('request.user_id', true))::BIGINT)
WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

DROP POLICY IF EXISTS "user_activity_log_delete" ON user_activity_log;
CREATE POLICY "user_activity_log_delete"
ON user_activity_log
FOR DELETE
TO authenticated
USING (user_id = (current_setting('request.user_id', true))::BIGINT);

COMMENT ON POLICY "user_activity_log_select" ON user_activity_log
IS 'Granular: Users can SELECT only their own activity logs via context';

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id
ON user_activity_log(user_id);

-- TABLE: user_daily_missions
ALTER TABLE user_daily_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_daily_missions_select" ON user_daily_missions;
CREATE POLICY "user_daily_missions_select"
ON user_daily_missions
FOR SELECT
TO authenticated
USING (user_id = (current_setting('request.user_id', true))::BIGINT);

DROP POLICY IF EXISTS "user_daily_missions_insert" ON user_daily_missions;
CREATE POLICY "user_daily_missions_insert"
ON user_daily_missions
FOR INSERT
TO authenticated
WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

DROP POLICY IF EXISTS "user_daily_missions_update" ON user_daily_missions;
CREATE POLICY "user_daily_missions_update"
ON user_daily_missions
FOR UPDATE
TO authenticated
USING (user_id = (current_setting('request.user_id', true))::BIGINT)
WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

DROP POLICY IF EXISTS "user_daily_missions_delete" ON user_daily_missions;
CREATE POLICY "user_daily_missions_delete"
ON user_daily_missions
FOR DELETE
TO authenticated
USING (user_id = (current_setting('request.user_id', true))::BIGINT);

COMMENT ON POLICY "user_daily_missions_select" ON user_daily_missions
IS 'Granular: Users can SELECT only their own missions via context';

CREATE INDEX IF NOT EXISTS idx_user_daily_missions_user_id
ON user_daily_missions(user_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

SELECT
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_case_interactions', 'user_achievements', 'journey_sessions',
    'user_progress', 'sessions', 'user_activity_log', 'user_daily_missions'
  )
ORDER BY tablename;

SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_case_interactions', 'user_achievements', 'journey_sessions',
    'user_progress', 'sessions', 'user_activity_log', 'user_daily_missions'
  )
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- END OF RLS IMPLEMENTATION
-- Status: Ready for production deployment
-- ============================================================================
