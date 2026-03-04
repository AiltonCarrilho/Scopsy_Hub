-- ============================================================================
-- RLS VALIDATION TEST SUITE - Post-deployment verification
-- ============================================================================
-- Run this AFTER applying the main RLS migration
-- These tests verify that RLS is properly configured and working
-- ============================================================================

-- ============================================================================
-- TEST 1: Verify RLS is ENABLED on all 13 tables
-- ============================================================================
-- Expected: All 12 rows with rowsecurity = true
-- If any shows false → RLS was not applied successfully
--
SELECT
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN '✓ ENABLED' ELSE '✗ DISABLED' END AS status
FROM pg_tables
WHERE tablename IN (
  'chat_conversations', 'sessions', 'user_achievements', 'user_activity_log',
  'user_case_interactions', 'user_daily_missions', 'user_progress',
  'user_journey_progress', 'user_session_decisions', 'user_skill_progress',
  'user_badges', 'user_stats'
)
ORDER BY tablename;

-- ============================================================================
-- TEST 2: Verify RLS POLICIES exist on all 13 tables
-- ============================================================================
-- Expected: 12 rows, one policy per table
-- Schema: pg_policies shows all active RLS policies
--
SELECT
  tablename,
  policyname,
  CASE WHEN policyname LIKE 'rls_%' THEN '✓ Correct naming' ELSE '? Check naming' END AS naming_status
FROM pg_policies
WHERE tablename IN (
  'chat_conversations', 'sessions', 'user_achievements', 'user_activity_log',
  'user_case_interactions', 'user_daily_missions', 'user_progress',
  'user_journey_progress', 'user_session_decisions', 'user_skill_progress',
  'user_badges', 'user_stats'
)
ORDER BY tablename;

-- ============================================================================
-- TEST 3: Verify GRANT permissions for authenticated role
-- ============================================================================
-- Expected: All 12 tables have SELECT, INSERT, UPDATE, DELETE for authenticated
-- This verifies authenticated users can perform DML operations
--
SELECT
  table_name,
  privilege_type,
  is_grantable,
  COUNT(*) AS count
FROM information_schema.table_privileges
WHERE table_name IN (
  'chat_conversations', 'sessions', 'user_achievements', 'user_activity_log',
  'user_case_interactions', 'user_daily_missions', 'user_progress',
  'user_journey_progress', 'user_session_decisions', 'user_skill_progress',
  'user_badges', 'user_stats'
)
AND grantee = 'authenticated'
GROUP BY table_name, privilege_type, is_grantable
ORDER BY table_name, privilege_type;

-- ============================================================================
-- TEST 4: Verify policy USING clause uses correct cast type
-- ============================================================================
-- Expected: See the data types used in policies (BIGINT, INTEGER, UUID)
-- This manual verification ensures type casts are correct
--
SELECT
  schemaname,
  tablename,
  policyname,
  CASE
    WHEN qual LIKE '%BIGINT%' THEN 'BIGINT'
    WHEN qual LIKE '%INTEGER%' THEN 'INTEGER'
    WHEN qual LIKE '%UUID%' THEN 'UUID'
    ELSE 'CHECK'
  END AS detected_type
FROM pg_policies
WHERE tablename IN (
  'chat_conversations', 'sessions', 'user_achievements', 'user_activity_log',
  'user_case_interactions', 'user_daily_missions', 'user_progress',
  'user_journey_progress', 'user_session_decisions', 'user_skill_progress',
  'user_badges', 'user_stats'
)
ORDER BY tablename;

-- ============================================================================
-- TEST 5: Count total RLS tables (should be 12)
-- ============================================================================
-- Expected: 12 rows
-- This is a quick summary count
--
SELECT
  COUNT(*) AS total_rls_tables,
  SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END) AS enabled_tables,
  CASE
    WHEN SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END) = 12 THEN '✓ COMPLETE'
    ELSE '✗ INCOMPLETE'
  END AS migration_status
FROM pg_tables
WHERE tablename IN (
  'chat_conversations', 'sessions', 'user_achievements', 'user_activity_log',
  'user_case_interactions', 'user_daily_missions', 'user_progress',
  'user_journey_progress', 'user_session_decisions', 'user_skill_progress',
  'user_badges', 'user_stats'
);

-- ============================================================================
-- SUMMARY: Expected Results
-- ============================================================================
-- If all 5 tests pass:
-- ✓ TEST 1: 12 tables with rowsecurity = true
-- ✓ TEST 2: 12 RLS policies named 'rls_*'
-- ✓ TEST 3: All 12 tables have SELECT, INSERT, UPDATE, DELETE for authenticated
-- ✓ TEST 4: Policy types match table column types (BIGINT/INTEGER/UUID)
-- ✓ TEST 5: Summary shows 12 enabled tables, migration_status = COMPLETE
--
-- If any test fails:
--  → Run rollback: sql-scripts/13-rls-rollback.sql
--  → Investigate schema (table column types might be wrong)
--  → Re-apply corrected migration
-- ============================================================================
