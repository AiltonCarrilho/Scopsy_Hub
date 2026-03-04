-- ============================================================================
-- RLS CONSOLIDATION: Remove Legacy Policies (Keep only rls_*)
-- ============================================================================
-- Phase: P0.1 - Simplify security layer
-- Date: 2026-03-04
-- Action: Drop 15 legacy policies, keep 12 new (rls_*) policies
--
-- Safety: Idempotent (IF EXISTS), no data deleted, only policy removal
-- Rollback: All policies can be recreated from git history
-- Impact: Same user isolation, cleaner architecture
-- ============================================================================

-- STEP 1: BEFORE - Count policies (for verification)
-- SELECT COUNT(*) FROM pg_policies WHERE tablename IN (...)
-- Expected: 26 total (12 rls_ + 14 legacy)

-- ============================================================================
-- STEP 2: DROP LEGACY POLICIES (15 total)
-- ============================================================================

-- sessions: Remove sessions_all (keep rls_sessions)
DROP POLICY IF EXISTS "sessions_all" ON sessions;

-- user_achievements: Remove user_achievements_all (keep rls_user_achievements)
DROP POLICY IF EXISTS "user_achievements_all" ON user_achievements;

-- user_activity_log: Remove user_activity_log_all (keep rls_user_activity_log)
DROP POLICY IF EXISTS "user_activity_log_all" ON user_activity_log;

-- user_case_interactions: Remove 2 policies (keep rls_user_case_interactions)
DROP POLICY IF EXISTS "user_case_interactions_all" ON user_case_interactions;
DROP POLICY IF EXISTS "Service role can access interactions" ON user_case_interactions;

-- user_daily_missions: Remove user_daily_missions_all (keep rls_user_daily_missions)
DROP POLICY IF EXISTS "user_daily_missions_all" ON user_daily_missions;

-- user_progress: Remove 2 policies (keep rls_user_progress)
DROP POLICY IF EXISTS "user_progress_all" ON user_progress;
DROP POLICY IF EXISTS "Service role can access user_progress" ON user_progress;

-- user_badges: Remove 5 legacy policies (keep rls_user_badges)
DROP POLICY IF EXISTS "Sistema pode inserir badges" ON user_badges;
DROP POLICY IF EXISTS "Usuários veem apenas seus badges" ON user_badges;
DROP POLICY IF EXISTS "Sistema pode atualizar badges" ON user_badges;
DROP POLICY IF EXISTS "Service role can access user_badges" ON user_badges;
DROP POLICY IF EXISTS "Todos podem ler badges" ON user_badges;

-- user_stats: Remove 4 legacy policies (keep rls_user_stats)
DROP POLICY IF EXISTS "Sistema pode atualizar stats" ON user_stats;
DROP POLICY IF EXISTS "Usuários veem apenas suas stats" ON user_stats;
DROP POLICY IF EXISTS "Service role can access user_stats" ON user_stats;
DROP POLICY IF EXISTS "Anyone can read badges" ON user_stats;

-- ============================================================================
-- STEP 3: VERIFY CONSOLIDATION
-- ============================================================================
-- Run this query to confirm consolidation was successful:
--
-- SELECT
--   tablename,
--   COUNT(*) as policy_count,
--   STRING_AGG(policyname, ', ' ORDER BY policyname) as policies
-- FROM pg_policies
-- WHERE tablename IN (
--   'chat_conversations', 'sessions', 'user_achievements', 'user_activity_log',
--   'user_case_interactions', 'user_daily_missions', 'user_progress',
--   'user_journey_progress', 'user_session_decisions', 'user_skill_progress',
--   'user_badges', 'user_stats'
-- )
-- GROUP BY tablename
-- ORDER BY tablename;
--
-- Expected result: 12 rows, each with exactly 1 policy named "rls_*"
--
-- Example output:
--   chat_conversations       | 1 | rls_chat_conversations
--   sessions                 | 1 | rls_sessions
--   user_achievements        | 1 | rls_user_achievements
--   user_activity_log        | 1 | rls_user_activity_log
--   user_case_interactions   | 1 | rls_user_case_interactions
--   user_daily_missions      | 1 | rls_user_daily_missions
--   user_journey_progress    | 1 | rls_user_journey_progress
--   user_progress            | 1 | rls_user_progress
--   user_session_decisions   | 1 | rls_user_session_decisions
--   user_skill_progress      | 1 | rls_user_skill_progress
--   user_badges              | 1 | rls_user_badges
--   user_stats               | 1 | rls_user_stats
--
-- If any shows policy_count > 1 → consolidation failed, do NOT proceed
-- If any shows policy_count = 0 → ERROR (policies were deleted incorrectly)
-- ============================================================================

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- BEFORE:
--   - 26 total policies across 12 tables
--   - 12 rls_* (new, correct pattern)
--   - 14 legacy (old, mixed patterns)
--   - 6 service role bypass policies
--
-- AFTER:
--   - 12 total policies across 12 tables
--   - 12 rls_* (one per table, consistent)
--   - 0 legacy
--   - Cleaner architecture, same security
--
-- IMPACT:
--   - User isolation: UNCHANGED (rls_* policies provide same isolation)
--   - Service role bypass: REMOVED (was in legacy, not in rls_*)
--   - Code clarity: IMPROVED (1 pattern instead of 3)
--
-- ============================================================================
