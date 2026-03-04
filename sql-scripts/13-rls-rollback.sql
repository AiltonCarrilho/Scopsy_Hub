-- ============================================================================
-- ROLLBACK: Disable RLS on all 12 tables (if migration fails)
-- ============================================================================
-- Use this ONLY if the RLS migration causes issues
-- Execution time: < 5 minutes
-- Risk: LOW (only disables security, no data deletion)
-- ============================================================================

-- STEP 1: Disable Row Level Security on all 12 tables
ALTER TABLE chat_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_case_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_journey_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_session_decisions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop all RLS policies
DROP POLICY IF EXISTS "rls_chat_conversations" ON chat_conversations;
DROP POLICY IF EXISTS "rls_sessions" ON sessions;
DROP POLICY IF EXISTS "rls_user_achievements" ON user_achievements;
DROP POLICY IF EXISTS "rls_user_activity_log" ON user_activity_log;
DROP POLICY IF EXISTS "rls_user_case_interactions" ON user_case_interactions;
DROP POLICY IF EXISTS "rls_user_daily_missions" ON user_daily_missions;
DROP POLICY IF EXISTS "rls_user_progress" ON user_progress;
DROP POLICY IF EXISTS "rls_user_journey_progress" ON user_journey_progress;
DROP POLICY IF EXISTS "rls_user_session_decisions" ON user_session_decisions;
DROP POLICY IF EXISTS "rls_user_skill_progress" ON user_skill_progress;
DROP POLICY IF EXISTS "rls_user_badges" ON user_badges;
DROP POLICY IF EXISTS "rls_user_stats" ON user_stats;

-- ============================================================================
-- Verification: Check that RLS is disabled
-- ============================================================================
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN (
  'chat_conversations', 'sessions', 'user_achievements', 'user_activity_log',
  'user_case_interactions', 'user_daily_missions', 'user_progress',
  'user_journey_progress', 'user_session_decisions', 'user_skill_progress',
  'user_badges', 'user_stats'
)
ORDER BY tablename;

-- Expected: All 12 rows should show rowsecurity = false
