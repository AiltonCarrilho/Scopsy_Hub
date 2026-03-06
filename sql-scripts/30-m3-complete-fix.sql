-- ============================================
-- MIGRATION 30: M3 Complete Fix
-- ============================================
-- Created: 2026-03-05
-- Agent: @data-engineer (Dara)
-- Purpose: Fix ALL M3 database issues in one idempotent script
--
-- ROOT CAUSE: Data imported into clinical_journeys.sessions (JSONB column)
--             but code queries journey_sessions TABLE with journey_id + session_number.
--             journey_sessions table was either empty or had wrong schema.
--
-- This script:
--   STEP 1: Diagnostic (read-only, outputs state)
--   STEP 2: Add missing columns to journey_sessions (idempotent)
--   STEP 3: Create user_journey_progress if missing (idempotent)
--   STEP 4: Create user_session_decisions if missing (idempotent)
--   STEP 5: Explode clinical_journeys.sessions JSONB into journey_sessions rows
--   STEP 6: Add UNIQUE constraints (idempotent)
--   STEP 7: RLS + Grants
--   STEP 8: Final validation
--
-- HOW TO USE:
--   1. Open Supabase SQL Editor (project vhwpohwklbguizaixitv)
--   2. Paste this ENTIRE script
--   3. Click "Run"
--   4. Review output -- all steps are wrapped in DO blocks with RAISE NOTICE
--
-- ROLLBACK: See bottom of file
-- ============================================

-- ============================================
-- STEP 1: DIAGNOSTIC (read-only)
-- ============================================

-- 1a: Check which M3 tables exist
SELECT 'DIAGNOSTIC: TABLE EXISTS' as step,
  table_name,
  CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'clinical_journeys',
    'journey_sessions',
    'user_journey_progress',
    'user_session_decisions'
  )
ORDER BY table_name;

-- 1b: Check journey_sessions current columns
SELECT 'DIAGNOSTIC: JOURNEY_SESSIONS SCHEMA' as step,
  column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'journey_sessions'
ORDER BY ordinal_position;

-- 1c: Count data in each table
SELECT 'DIAGNOSTIC: COUNTS' as step,
  (SELECT COUNT(*) FROM clinical_journeys) as clinical_journeys_count,
  (SELECT COUNT(*) FROM journey_sessions) as journey_sessions_count;

-- 1d: Check if clinical_journeys has sessions JSONB column
SELECT 'DIAGNOSTIC: CLINICAL_JOURNEYS.SESSIONS' as step,
  id,
  title,
  difficulty_level,
  CASE
    WHEN sessions IS NOT NULL AND sessions::text != '[]' AND sessions::text != 'null'
    THEN jsonb_array_length(sessions)
    ELSE 0
  END as sessions_count
FROM clinical_journeys
WHERE status = 'active'
ORDER BY title;


-- ============================================
-- STEP 2: Add missing columns to journey_sessions (idempotent)
-- ============================================
-- The original schema (script 03) has:
--   id, conversation_id, user_id, session_number, session_phase,
--   patient_improvement_score, therapist_feedback, techniques_used, etc.
-- The code (journey.js) needs:
--   journey_id, session_title, options, context, skill_id

-- Add sessions JSONB column to clinical_journeys if missing
ALTER TABLE clinical_journeys
ADD COLUMN IF NOT EXISTS sessions JSONB DEFAULT '[]'::jsonb;

ALTER TABLE journey_sessions
ADD COLUMN IF NOT EXISTS journey_id UUID REFERENCES clinical_journeys(id) ON DELETE CASCADE;

ALTER TABLE journey_sessions
ADD COLUMN IF NOT EXISTS session_title TEXT;

ALTER TABLE journey_sessions
ADD COLUMN IF NOT EXISTS session_description TEXT;

ALTER TABLE journey_sessions
ADD COLUMN IF NOT EXISTS context TEXT;

ALTER TABLE journey_sessions
ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'::jsonb;

ALTER TABLE journey_sessions
ADD COLUMN IF NOT EXISTS skill_id UUID;

ALTER TABLE journey_sessions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Make conversation_id and user_id nullable (original schema had them NOT NULL
-- but content-based sessions dont have these)
DO $$
BEGIN
  -- Make conversation_id nullable if it exists and is NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'journey_sessions'
    AND column_name = 'conversation_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE journey_sessions ALTER COLUMN conversation_id DROP NOT NULL;
    RAISE NOTICE 'STEP 2: Made conversation_id nullable';
  END IF;

  -- Make user_id nullable if it exists and is NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'journey_sessions'
    AND column_name = 'user_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE journey_sessions ALTER COLUMN user_id DROP NOT NULL;
    RAISE NOTICE 'STEP 2: Made user_id nullable';
  END IF;
END $$;

-- Index for journey_id
CREATE INDEX IF NOT EXISTS idx_journey_sessions_journey_id
ON journey_sessions(journey_id);


-- ============================================
-- STEP 3: Create user_journey_progress if missing
-- ============================================

CREATE TABLE IF NOT EXISTS user_journey_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES clinical_journeys(id) ON DELETE CASCADE,
  current_session INT NOT NULL DEFAULT 1,
  total_rapport INT DEFAULT 0,
  total_insight INT DEFAULT 0,
  total_behavioral_change INT DEFAULT 0,
  total_symptom_reduction INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  final_score INT,
  treatment_effectiveness TEXT CHECK (
    treatment_effectiveness IS NULL OR
    treatment_effectiveness IN ('poor', 'moderate', 'good', 'excellent')
  ),
  last_session_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, journey_id)
);

CREATE INDEX IF NOT EXISTS idx_user_journey_progress_user
ON user_journey_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_user_journey_progress_journey
ON user_journey_progress(journey_id);


-- ============================================
-- STEP 4: Create user_session_decisions if missing
-- ============================================

CREATE TABLE IF NOT EXISTS user_session_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES clinical_journeys(id),
  session_id UUID NOT NULL REFERENCES journey_sessions(id),
  option_chosen TEXT NOT NULL,
  is_optimal BOOLEAN DEFAULT FALSE,
  rapport_gained INT DEFAULT 0,
  insight_gained INT DEFAULT 0,
  behavioral_change_gained INT DEFAULT 0,
  symptom_reduction_gained INT DEFAULT 0,
  time_taken_seconds INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_user_session_decisions_user
ON user_session_decisions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_session_decisions_session
ON user_session_decisions(session_id);

CREATE INDEX IF NOT EXISTS idx_user_session_decisions_journey
ON user_session_decisions(journey_id);


-- ============================================
-- STEP 5: Explode clinical_journeys.sessions JSONB into journey_sessions rows
-- ============================================
-- This is the CRITICAL fix: data was imported into clinical_journeys.sessions
-- (JSONB array) but journey.js queries the journey_sessions TABLE.
-- We need to extract each session from the JSONB array and INSERT as a row.

DO $$
DECLARE
  v_journey RECORD;
  v_session JSONB;
  v_session_number INT;
  v_inserted INT := 0;
  v_skipped INT := 0;
  v_total_journeys INT := 0;
BEGIN
  RAISE NOTICE 'STEP 5: Starting JSONB -> journey_sessions explosion...';

  FOR v_journey IN
    SELECT id, title, sessions
    FROM clinical_journeys
    WHERE sessions IS NOT NULL
      AND sessions::text != '[]'
      AND sessions::text != 'null'
      AND jsonb_array_length(sessions) > 0
  LOOP
    v_total_journeys := v_total_journeys + 1;

    FOR v_session IN SELECT * FROM jsonb_array_elements(v_journey.sessions)
    LOOP
      v_session_number := (v_session->>'session_number')::INT;

      -- Skip if this (journey_id, session_number) already exists
      IF EXISTS (
        SELECT 1 FROM journey_sessions
        WHERE journey_id = v_journey.id
        AND session_number = v_session_number
      ) THEN
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;

      INSERT INTO journey_sessions (
        journey_id,
        session_number,
        session_title,
        session_phase,
        context,
        options
      ) VALUES (
        v_journey.id,
        v_session_number,
        v_session->'session_content'->>'narrative',
        v_session->>'session_phase',
        v_session->'session_content'->>'narrative',
        COALESCE(v_session->'options', '[]'::jsonb)
      );

      v_inserted := v_inserted + 1;
    END LOOP;

    RAISE NOTICE 'STEP 5: Processed journey "%" (id: %)', v_journey.title, v_journey.id;
  END LOOP;

  RAISE NOTICE 'STEP 5: COMPLETE. Journeys processed: %, Sessions inserted: %, Skipped (already exist): %',
    v_total_journeys, v_inserted, v_skipped;
END $$;

-- Also handle the case where session data has session_title at top level
-- (Some JSON files use session_title directly, not nested in session_content)
DO $$
BEGIN
  -- Update session_title from the JSONB session_title field if currently NULL
  UPDATE journey_sessions js
  SET session_title = sub.title
  FROM (
    SELECT
      cj.id as journey_id,
      (s.elem->>'session_number')::INT as session_number,
      COALESCE(
        s.elem->>'session_title',
        s.elem->'session_content'->>'narrative'
      ) as title
    FROM clinical_journeys cj,
    LATERAL jsonb_array_elements(cj.sessions) AS s(elem)
    WHERE cj.sessions IS NOT NULL
      AND cj.sessions::text != '[]'
  ) sub
  WHERE js.journey_id = sub.journey_id
    AND js.session_number = sub.session_number
    AND (js.session_title IS NULL OR js.session_title = '');

  RAISE NOTICE 'STEP 5b: Updated session_titles from JSONB';
END $$;

-- Also extract options properly from the JSONB structure
-- The JSON structure has options as an array with label, description, feedback, is_best
DO $$
BEGIN
  UPDATE journey_sessions js
  SET options = sub.opts
  FROM (
    SELECT
      cj.id as journey_id,
      (s.elem->>'session_number')::INT as session_number,
      s.elem->'options' as opts
    FROM clinical_journeys cj,
    LATERAL jsonb_array_elements(cj.sessions) AS s(elem)
    WHERE cj.sessions IS NOT NULL
      AND cj.sessions::text != '[]'
      AND s.elem->'options' IS NOT NULL
      AND jsonb_array_length(s.elem->'options') > 0
  ) sub
  WHERE js.journey_id = sub.journey_id
    AND js.session_number = sub.session_number
    AND (js.options IS NULL OR js.options = '[]'::jsonb);

  RAISE NOTICE 'STEP 5c: Updated options from JSONB';
END $$;


-- ============================================
-- STEP 6: Add UNIQUE constraints (idempotent)
-- ============================================

-- Clean duplicates first (keep newest)
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY journey_id, session_number
      ORDER BY created_at DESC NULLS LAST
    ) as rn
  FROM journey_sessions
  WHERE journey_id IS NOT NULL
)
DELETE FROM journey_sessions
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add UNIQUE constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'journey_sessions'::regclass
    AND conname = 'uq_journey_session_number'
  ) THEN
    ALTER TABLE journey_sessions
    ADD CONSTRAINT uq_journey_session_number UNIQUE (journey_id, session_number);
    RAISE NOTICE 'STEP 6: Added UNIQUE constraint uq_journey_session_number';
  ELSE
    RAISE NOTICE 'STEP 6: UNIQUE constraint uq_journey_session_number already exists';
  END IF;
END $$;


-- ============================================
-- STEP 7: RLS + Grants
-- ============================================

-- journey_sessions: readable by all (content table)
ALTER TABLE journey_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rls_journey_sessions_readonly" ON journey_sessions;
CREATE POLICY "rls_journey_sessions_readonly" ON journey_sessions
  FOR SELECT USING (true);

GRANT SELECT ON journey_sessions TO anon;
GRANT SELECT ON journey_sessions TO authenticated;
GRANT ALL PRIVILEGES ON journey_sessions TO service_role;

-- user_journey_progress: defense-in-depth (service_role only)
ALTER TABLE user_journey_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rls_user_journey_progress" ON user_journey_progress;
CREATE POLICY "rls_user_journey_progress" ON user_journey_progress
  FOR ALL TO authenticated
  USING (false);

GRANT SELECT, INSERT, UPDATE, DELETE ON user_journey_progress TO authenticated;
GRANT ALL PRIVILEGES ON user_journey_progress TO service_role;

-- user_session_decisions: defense-in-depth (service_role only)
ALTER TABLE user_session_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rls_user_session_decisions" ON user_session_decisions;
CREATE POLICY "rls_user_session_decisions" ON user_session_decisions
  FOR ALL TO authenticated
  USING (false);

GRANT SELECT, INSERT, UPDATE, DELETE ON user_session_decisions TO authenticated;
GRANT ALL PRIVILEGES ON user_session_decisions TO service_role;


-- ============================================
-- STEP 8: Final Validation
-- ============================================

-- 8a: Verify journey_sessions schema
SELECT 'VALIDATION: JOURNEY_SESSIONS SCHEMA' as step,
  column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'journey_sessions'
ORDER BY ordinal_position;

-- 8b: Count data
SELECT 'VALIDATION: DATA COUNTS' as step,
  (SELECT COUNT(*) FROM clinical_journeys WHERE status = 'active') as active_journeys,
  (SELECT COUNT(*) FROM journey_sessions WHERE journey_id IS NOT NULL) as content_sessions,
  (SELECT COUNT(DISTINCT journey_id) FROM journey_sessions WHERE journey_id IS NOT NULL) as journeys_with_sessions,
  (SELECT COUNT(*) FROM user_journey_progress) as user_progress_records,
  (SELECT COUNT(*) FROM user_session_decisions) as user_decisions;

-- 8c: Sessions distribution per journey
SELECT 'VALIDATION: SESSIONS PER JOURNEY' as step,
  cj.title,
  COUNT(js.id) as sessions_count,
  MIN(js.session_number) as min_session,
  MAX(js.session_number) as max_session
FROM clinical_journeys cj
LEFT JOIN journey_sessions js ON cj.id = js.journey_id
WHERE cj.status = 'active'
GROUP BY cj.id, cj.title
ORDER BY cj.title;

-- 8d: Check constraints
SELECT 'VALIDATION: CONSTRAINTS' as step,
  conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid IN ('journey_sessions'::regclass, 'user_journey_progress'::regclass)
  AND contype IN ('u', 'f');

-- 8e: Sample session with options (verify data quality)
SELECT 'VALIDATION: SAMPLE SESSION' as step,
  js.journey_id,
  js.session_number,
  LEFT(js.session_title, 80) as title_preview,
  js.session_phase,
  jsonb_array_length(js.options) as options_count
FROM journey_sessions js
WHERE js.journey_id IS NOT NULL
  AND js.options IS NOT NULL
  AND js.options::text != '[]'
LIMIT 5;

-- 8f: All M3 tables exist?
SELECT 'VALIDATION: TABLES EXIST' as step,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'clinical_journeys',
    'journey_sessions',
    'user_journey_progress',
    'user_session_decisions'
  )
ORDER BY table_name;


-- ============================================
-- ROLLBACK (if needed, run each line individually)
-- ============================================
-- WARNING: Only use if something goes wrong. This will lose user data.
--
-- -- Remove exploded sessions (keep legacy user-tracking rows)
-- DELETE FROM journey_sessions WHERE journey_id IS NOT NULL AND conversation_id IS NULL;
--
-- -- Drop new columns
-- ALTER TABLE journey_sessions DROP COLUMN IF EXISTS journey_id CASCADE;
-- ALTER TABLE journey_sessions DROP COLUMN IF EXISTS session_title;
-- ALTER TABLE journey_sessions DROP COLUMN IF EXISTS session_description;
-- ALTER TABLE journey_sessions DROP COLUMN IF EXISTS context;
-- ALTER TABLE journey_sessions DROP COLUMN IF EXISTS options;
-- ALTER TABLE journey_sessions DROP COLUMN IF EXISTS skill_id;
-- ALTER TABLE journey_sessions DROP COLUMN IF EXISTS updated_at;
-- ALTER TABLE journey_sessions DROP CONSTRAINT IF EXISTS uq_journey_session_number;
-- DROP INDEX IF EXISTS idx_journey_sessions_journey_id;
--
-- -- Drop new tables (CAUTION: loses all user progress data)
-- DROP TABLE IF EXISTS user_session_decisions CASCADE;
-- DROP TABLE IF EXISTS user_journey_progress CASCADE;
