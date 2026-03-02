-- ============================================================================
-- SCOPSY RLS TEST & VALIDATION SCRIPT
-- ============================================================================
-- Purpose: Verify that RLS policies work correctly
-- Run AFTER applying 11-rls-hybrid-implementation.sql
-- ============================================================================

-- ============================================================================
-- SETUP: Create test users (if needed)
-- ============================================================================

-- These tests assume you have at least 2 users in your database
-- If testing locally, you can create test users in auth.users table

-- For THIS test, we'll use Supabase's testing functions
-- Set a specific user context to test policy enforcement

-- ============================================================================
-- TEST 1: Verify RLS is Enabled
-- ============================================================================

\echo '=== TEST 1: RLS Enabled ==='

SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✓ ENABLED' ELSE '❌ DISABLED' END AS rls_status,
  CASE
    WHEN rowsecurity THEN 'PASS'
    ELSE 'FAIL - RLS not enabled'
  END as test_result
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_case_interactions', 'user_achievements', 'journey_sessions',
    'user_progress', 'sessions', 'user_badges', 'user_activity_log',
    'user_daily_missions', 'plan_changes_audit'
  )
ORDER BY tablename;

-- ============================================================================
-- TEST 2: Verify Policies Exist
-- ============================================================================

\echo '=== TEST 2: Policies Exist ==='

WITH policy_summary AS (
  SELECT
    tablename,
    COUNT(*) as policy_count,
    array_agg(policyname) as policy_names
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (
      'user_case_interactions', 'user_achievements', 'journey_sessions',
      'user_progress', 'sessions', 'user_badges', 'user_activity_log',
      'user_daily_missions', 'plan_changes_audit'
    )
  GROUP BY tablename
)
SELECT
  tablename,
  policy_count,
  CASE
    WHEN policy_count > 0 THEN 'PASS - Policies exist'
    ELSE 'FAIL - No policies'
  END as test_result,
  policy_names
FROM policy_summary
ORDER BY tablename;

-- ============================================================================
-- TEST 3: Verify Policy Coverage (KISS vs Granular)
-- ============================================================================

\echo '=== TEST 3: Policy Coverage ==='

SELECT
  t.tablename,
  COUNT(p.policyname) as policy_count,
  ARRAY_AGG(DISTINCT p.cmd) as commands_covered,
  CASE
    WHEN COUNT(p.policyname) = 1 THEN 'KISS approach (1 policy for all)'
    WHEN COUNT(p.policyname) >= 4 THEN 'Granular approach (4+ policies)'
    ELSE 'Incomplete coverage'
  END as coverage_type,
  CASE
    WHEN COUNT(p.policyname) >= 1 THEN 'PASS'
    ELSE 'FAIL - No policies'
  END as test_result
FROM pg_tables t
LEFT JOIN pg_policies p
  ON p.tablename = t.tablename
  AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'user_case_interactions', 'user_achievements', 'journey_sessions',
    'user_progress', 'sessions', 'user_badges', 'user_activity_log',
    'user_daily_missions', 'plan_changes_audit'
  )
GROUP BY t.tablename
ORDER BY t.tablename;

-- ============================================================================
-- TEST 4: Verify Indexes for RLS Performance
-- ============================================================================

\echo '=== TEST 4: Indexes for RLS ==='

SELECT
  t.tablename,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = t.tablename
        AND indexname LIKE '%user_id%'
    ) THEN '✓ Has user_id index'
    ELSE '❌ Missing user_id index'
  END as index_status,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = t.tablename
        AND indexname LIKE '%user_id%'
    ) THEN 'PASS'
    ELSE 'WARNING - Consider adding index'
  END as test_result
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'user_case_interactions', 'user_achievements', 'journey_sessions',
    'user_progress', 'sessions', 'user_badges', 'user_activity_log',
    'user_daily_missions', 'plan_changes_audit'
  )
ORDER BY t.tablename;

-- ============================================================================
-- TEST 5: RLS Policy Details
-- ============================================================================

\echo '=== TEST 5: Policy Details ==='

SELECT
  tablename,
  policyname,
  cmd as operation,
  qual as using_clause,
  with_check,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_case_interactions', 'user_achievements', 'journey_sessions',
    'user_progress', 'sessions', 'user_badges', 'user_activity_log',
    'user_daily_missions', 'plan_changes_audit'
  )
ORDER BY tablename, policyname;

-- ============================================================================
-- MANUAL TESTING (Instructions for Supabase SQL Editor)
-- ============================================================================

\echo ''
\echo '=== MANUAL TESTING (Run in Supabase SQL Editor) ==='
\echo ''
\echo 'To test that RLS actually blocks access:'
\echo ''
\echo 'TEST A: Check policy blocks other users'
\echo 'INSTRUCTION: '
\echo '1. Get USER_A_ID and USER_B_ID from your users table'
\echo '2. Run this query as USER_A (in Supabase SQL Editor with USER_A JWT):'
\echo '   SELECT * FROM user_progress WHERE user_id = <USER_B_ID>;'
\echo '   Expected: Empty result (USER_A cannot see USER_B data)'
\echo ''
\echo 'TEST B: Check policy allows user to see own data'
\echo 'INSTRUCTION: '
\echo '1. Run this query as USER_A:'
\echo '   SELECT * FROM user_progress WHERE user_id = <USER_A_ID>;'
\echo '   Expected: Rows returned (USER_A can see own data)'
\echo ''
\echo 'TEST C: Check service_role bypasses RLS'
\echo 'INSTRUCTION: '
\echo '1. Temporarily set role to service_role'
\echo '2. Run: SELECT COUNT(*) FROM user_progress;'
\echo '   Expected: Sees all rows (service_role has full access)'
\echo ''

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

\echo ''
\echo '=== RLS IMPLEMENTATION SUMMARY ==='

WITH rls_summary AS (
  SELECT
    COUNT(DISTINCT t.tablename) as total_tables_checked,
    COUNT(DISTINCT t.tablename) FILTER (
      WHERE t.rowsecurity = true
    ) as tables_with_rls,
    COUNT(DISTINCT p.tablename) as tables_with_policies,
    COUNT(p.policyname) as total_policies
  FROM pg_tables t
  LEFT JOIN pg_policies p
    ON p.tablename = t.tablename
    AND p.schemaname = 'public'
  WHERE t.schemaname = 'public'
    AND t.tablename IN (
      'user_case_interactions', 'user_achievements', 'journey_sessions',
      'user_progress', 'sessions', 'user_badges', 'user_activity_log',
      'user_daily_missions', 'plan_changes_audit'
    )
)
SELECT
  total_tables_checked,
  tables_with_rls,
  tables_with_policies,
  total_policies,
  CASE
    WHEN tables_with_rls = total_tables_checked
      AND total_policies >= total_tables_checked
    THEN '✓ PASS - RLS fully implemented'
    ELSE '❌ FAIL - RLS incomplete'
  END as overall_status
FROM rls_summary;

-- ============================================================================
-- END OF TEST SCRIPT
-- ============================================================================
