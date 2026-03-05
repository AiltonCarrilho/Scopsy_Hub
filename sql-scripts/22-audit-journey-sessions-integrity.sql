-- ============================================
-- AUDIT: journey_sessions Data Integrity
-- ============================================
-- Created: 2026-03-04
-- Purpose: Diagnose why .single() fails on journey_sessions queries
-- Agent: @data-engineer (Dara)
-- Context: journey.js lines 181-186, 257-262 use .single() with
--          .eq('journey_id', journey_id).eq('session_number', N)
--          which FAILS if 0 or 2+ rows match

-- ============================================
-- TEST 1: CHECK FOR DUPLICATES (journey_id + session_number)
-- This is the PRIMARY suspect for .single() failure
-- ============================================
SELECT
  'TEST 1: DUPLICATES' as test,
  journey_id,
  session_number,
  COUNT(*) as count
FROM journey_sessions
GROUP BY journey_id, session_number
HAVING COUNT(*) > 1
ORDER BY journey_id, session_number
LIMIT 100;

-- ============================================
-- TEST 2: ORPHANED RECORDS (journey_id not in clinical_journeys)
-- ============================================
SELECT
  'TEST 2: ORPHANS' as test,
  js.journey_id,
  COUNT(*) as orphaned_sessions
FROM journey_sessions js
LEFT JOIN clinical_journeys cj ON js.journey_id = cj.id
WHERE cj.id IS NULL
GROUP BY js.journey_id;

-- ============================================
-- TEST 3: SESSION NUMBER GAPS (should be 1-12 per journey)
-- ============================================
SELECT
  'TEST 3: GAPS' as test,
  journey_id,
  MIN(session_number) as min_session,
  MAX(session_number) as max_session,
  COUNT(*) as total_sessions,
  ARRAY_AGG(session_number ORDER BY session_number) as sessions_present
FROM journey_sessions
GROUP BY journey_id
HAVING COUNT(*) != 12 OR MIN(session_number) != 1 OR MAX(session_number) != 12;

-- ============================================
-- TEST 4: NULL VALUES IN MANDATORY COLUMNS
-- ============================================
SELECT
  'TEST 4: NULLS' as test,
  SUM(CASE WHEN journey_id IS NULL THEN 1 ELSE 0 END) as null_journey_id,
  SUM(CASE WHEN session_number IS NULL THEN 1 ELSE 0 END) as null_session_number,
  SUM(CASE WHEN session_title IS NULL THEN 1 ELSE 0 END) as null_session_title,
  SUM(CASE WHEN options IS NULL THEN 1 ELSE 0 END) as null_options,
  COUNT(*) as total_rows
FROM journey_sessions;

-- ============================================
-- TEST 5: SPECIFIC JOURNEY (ea5e2696-37ae-4f6a-ac2d-9b9806f3baca)
-- This is the LEGACY "Marina" journey that is reportedly failing
-- ============================================
SELECT
  'TEST 5: SPECIFIC JOURNEY' as test,
  session_number,
  COUNT(*) as count,
  id as session_id,
  session_title,
  created_at
FROM journey_sessions
WHERE journey_id = 'ea5e2696-37ae-4f6a-ac2d-9b9806f3baca'::uuid
GROUP BY session_number, id, session_title, created_at
ORDER BY session_number;

-- ============================================
-- TEST 6: CHECK TABLE SCHEMA (confirm journey_id column exists)
-- ============================================
SELECT
  'TEST 6: SCHEMA' as test,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'journey_sessions'
ORDER BY ordinal_position;

-- ============================================
-- TEST 7: CHECK EXISTING CONSTRAINTS AND INDEXES
-- ============================================
SELECT
  'TEST 7: CONSTRAINTS' as test,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'journey_sessions'::regclass;

-- ============================================
-- TEST 8: CHECK INDEXES
-- ============================================
SELECT
  'TEST 8: INDEXES' as test,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'journey_sessions';

-- ============================================
-- TEST 9: TOTAL ROW COUNT AND JOURNEY DISTRIBUTION
-- ============================================
SELECT
  'TEST 9: DISTRIBUTION' as test,
  journey_id,
  COUNT(*) as sessions_count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM journey_sessions
GROUP BY journey_id
ORDER BY COUNT(*) DESC;

-- ============================================
-- TEST 10: user_journey_progress DUPLICATES (secondary .single() failure)
-- journey.js line 198 uses .single() on user_journey_progress
-- ============================================
SELECT
  'TEST 10: PROGRESS DUPLICATES' as test,
  user_id,
  journey_id,
  COUNT(*) as count
FROM user_journey_progress
GROUP BY user_id, journey_id
HAVING COUNT(*) > 1
LIMIT 50;

-- ============================================
-- SUMMARY
-- ============================================
-- After running all tests, check:
-- 1. TEST 1 non-empty = DUPLICATES causing .single() to fail (PGRST116)
-- 2. TEST 2 non-empty = Orphaned records (won't cause .single() but data integrity issue)
-- 3. TEST 5 with count > 1 per session = SPECIFIC journey has duplicates
-- 4. TEST 7 missing UNIQUE(journey_id, session_number) = ROOT CAUSE (no constraint preventing duplicates)
-- 5. TEST 10 non-empty = user_journey_progress also has duplicates (.single() on line 198)
