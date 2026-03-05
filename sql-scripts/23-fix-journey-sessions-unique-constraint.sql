-- ============================================
-- FIX: Add UNIQUE constraint to journey_sessions
-- ============================================
-- Created: 2026-03-04
-- Agent: @data-engineer (Dara)
-- Purpose: Prevent duplicate (journey_id, session_number) rows
--          which cause Supabase .single() to fail with PGRST116
-- Prerequisites: Run 22-audit-journey-sessions-integrity.sql FIRST
--                to confirm duplicates exist and no unique constraint

-- ============================================
-- STEP 1: Find and remove duplicates (keep newest)
-- ============================================
-- This CTE deletes all but the most recently created row
-- for each (journey_id, session_number) pair

WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY journey_id, session_number
      ORDER BY created_at DESC
    ) as rn
  FROM journey_sessions
)
DELETE FROM journey_sessions
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Report what remains
SELECT journey_id, COUNT(*) as sessions_count
FROM journey_sessions
GROUP BY journey_id
ORDER BY sessions_count DESC;

-- ============================================
-- STEP 2: Add UNIQUE constraint
-- ============================================
-- This prevents future duplicates
ALTER TABLE journey_sessions
  ADD CONSTRAINT uq_journey_session_number
  UNIQUE (journey_id, session_number);

-- ============================================
-- STEP 3: Add UNIQUE constraint to user_journey_progress too
-- (journey.js line 198 uses .single() on user_id + journey_id)
-- ============================================
-- First, clean duplicates in user_journey_progress
WITH progress_duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, journey_id
      ORDER BY created_at DESC
    ) as rn
  FROM user_journey_progress
)
DELETE FROM user_journey_progress
WHERE id IN (
  SELECT id FROM progress_duplicates WHERE rn > 1
);

-- Add unique constraint
ALTER TABLE user_journey_progress
  ADD CONSTRAINT uq_user_journey_progress
  UNIQUE (user_id, journey_id);

-- ============================================
-- STEP 4: Verify constraints exist
-- ============================================
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid IN ('journey_sessions'::regclass, 'user_journey_progress'::regclass)
  AND contype = 'u';

-- ============================================
-- ROLLBACK (if needed)
-- ============================================
-- ALTER TABLE journey_sessions DROP CONSTRAINT IF EXISTS uq_journey_session_number;
-- ALTER TABLE user_journey_progress DROP CONSTRAINT IF EXISTS uq_user_journey_progress;
