-- ============================================
-- MIGRATION: Add orchestrator_id to clinical_journeys
-- ============================================
-- Created: 2026-03-07
-- Purpose: Map journey UUIDs to numeric IDs used in JSON filenames
-- Context: journey.js line 550 queries orchestrator_id to construct:
--          journey-{orchestrator_id}-sessions-{range}-intermediate.json
--
-- JSON files available in data/journeys/:
--   journey-009-sessions-*.json  → TAG Pedro (basic)
--   journey-010-sessions-*.json  → Agorafobia Maria (intermediate)
--   journey-011-sessions-*.json  → Depressao Joao (advanced)
--
-- Mapping convention:
--   UUID in clinical_journeys.id  →  orchestrator_id  →  JSON filename prefix

-- ============================================
-- STEP 1: Add column (safe - nullable, no data loss)
-- ============================================
ALTER TABLE clinical_journeys
  ADD COLUMN IF NOT EXISTS orchestrator_id TEXT;

-- ============================================
-- STEP 2: Populate mappings for the 3 known journeys
-- ============================================
UPDATE clinical_journeys
SET orchestrator_id = '009'
WHERE id = '550e8400-e29b-41d4-a716-446655440000'::uuid;

UPDATE clinical_journeys
SET orchestrator_id = '010'
WHERE id = '550e8400-e29b-41d4-a716-446655440001'::uuid;

UPDATE clinical_journeys
SET orchestrator_id = '011'
WHERE id = '550e8400-e29b-41d4-a716-446655440002'::uuid;

-- ============================================
-- STEP 3: Validate - all 3 journeys must have orchestrator_id
-- ============================================
SELECT
  id,
  title,
  difficulty_level,
  orchestrator_id,
  CASE
    WHEN orchestrator_id IS NOT NULL THEN 'OK MAPPED'
    ELSE 'MISSING orchestrator_id'
  END as status
FROM clinical_journeys
ORDER BY orchestrator_id;

-- Expected output:
-- 550e8400-...-440000 | Jornada TAG - Pedro...      | basic        | 009 | OK MAPPED
-- 550e8400-...-440001 | Jornada Agorafobia - Maria.. | intermediate | 010 | OK MAPPED
-- 550e8400-...-440002 | Jornada Depressao - Joao...  | advanced     | 011 | OK MAPPED
