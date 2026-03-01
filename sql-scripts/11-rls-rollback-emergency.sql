-- ============================================================================
-- EMERGENCY ROLLBACK: Disable all RLS implementations
-- ============================================================================
--
-- Purpose: Revert all RLS changes made in Phase 1 Security Hardening
-- If execution time > 1min or you see "permission denied" errors, run this
--
-- Timeline: < 5 minutes for complete rollback
-- Risk: LOW (only disables security, no data deletion)
--
-- ============================================================================

-- Step 1: Disable Row Level Security on all 9 tables
-- ============================================================================
ALTER TABLE billing_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_case_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all READ RLS policies from each table
-- ============================================================================
DROP POLICY IF EXISTS "billing_history_rls_select_own" ON billing_history;
DROP POLICY IF EXISTS "chat_conversations_rls_select_own" ON chat_conversations;
DROP POLICY IF EXISTS "chat_messages_rls_select_own" ON chat_messages;
DROP POLICY IF EXISTS "sessions_rls_select_own" ON sessions;
DROP POLICY IF EXISTS "user_achievements_rls_select_own" ON user_achievements;
DROP POLICY IF EXISTS "user_progress_rls_select_own" ON user_progress;
DROP POLICY IF EXISTS "user_case_interactions_rls_select_own" ON user_case_interactions;
DROP POLICY IF EXISTS "user_daily_missions_rls_select_own" ON user_daily_missions;
DROP POLICY IF EXISTS "user_activity_log_rls_select_own" ON user_activity_log;

-- Step 3: Drop all WRITE RLS policies (INSERT, UPDATE, DELETE)
-- ============================================================================
DROP POLICY IF EXISTS "billing_history_rls_insert_own" ON billing_history;
DROP POLICY IF EXISTS "billing_history_rls_update_own" ON billing_history;
DROP POLICY IF EXISTS "billing_history_rls_delete_own" ON billing_history;

DROP POLICY IF EXISTS "chat_conversations_rls_insert_own" ON chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_rls_update_own" ON chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_rls_delete_own" ON chat_conversations;

DROP POLICY IF EXISTS "chat_messages_rls_insert_own" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_rls_update_own" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_rls_delete_own" ON chat_messages;

DROP POLICY IF EXISTS "sessions_rls_insert_own" ON sessions;
DROP POLICY IF EXISTS "sessions_rls_update_own" ON sessions;
DROP POLICY IF EXISTS "sessions_rls_delete_own" ON sessions;

DROP POLICY IF EXISTS "user_achievements_rls_insert_own" ON user_achievements;
DROP POLICY IF EXISTS "user_achievements_rls_update_own" ON user_achievements;
DROP POLICY IF EXISTS "user_achievements_rls_delete_own" ON user_achievements;

DROP POLICY IF EXISTS "user_progress_rls_insert_own" ON user_progress;
DROP POLICY IF EXISTS "user_progress_rls_update_own" ON user_progress;
DROP POLICY IF EXISTS "user_progress_rls_delete_own" ON user_progress;

DROP POLICY IF EXISTS "user_case_interactions_rls_insert_own" ON user_case_interactions;
DROP POLICY IF EXISTS "user_case_interactions_rls_update_own" ON user_case_interactions;
DROP POLICY IF EXISTS "user_case_interactions_rls_delete_own" ON user_case_interactions;

DROP POLICY IF EXISTS "user_daily_missions_rls_insert_own" ON user_daily_missions;
DROP POLICY IF EXISTS "user_daily_missions_rls_update_own" ON user_daily_missions;
DROP POLICY IF EXISTS "user_daily_missions_rls_delete_own" ON user_daily_missions;

DROP POLICY IF EXISTS "user_activity_log_rls_insert_own" ON user_activity_log;
DROP POLICY IF EXISTS "user_activity_log_rls_update_own" ON user_activity_log;
DROP POLICY IF EXISTS "user_activity_log_rls_delete_own" ON user_activity_log;

-- Step 4: Reset authentication context
-- ============================================================================
-- This clears any user_id set by set_auth_context() middleware
SELECT set_config('request.user_id', NULL, false);

-- Step 5: Verification queries (run after rollback to confirm success)
-- ============================================================================
-- These should all return: "t" (true) meaning RLS is disabled
SELECT
  tablename,
  CASE WHEN rowsecurity = false THEN 't' ELSE 'f' END as rls_disabled
FROM pg_tables
WHERE tablename IN (
  'billing_history', 'chat_conversations', 'chat_messages',
  'sessions', 'user_achievements', 'user_progress',
  'user_case_interactions', 'user_daily_missions', 'user_activity_log'
)
ORDER BY tablename;

-- If all show 't', RLS has been successfully disabled
-- If any show 'f', check that no queries returned errors above

-- ============================================================================
-- END ROLLBACK SCRIPT
-- ============================================================================
