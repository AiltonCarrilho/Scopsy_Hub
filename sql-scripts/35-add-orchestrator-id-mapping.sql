-- ============================================
-- ADD ORCHESTRATOR ID MAPPING
-- ============================================
-- Purpose: Map UUID journey IDs to numeric Orchestrator IDs (009-013)
-- Created: 2026-03-07
-- Author: Dex (Dev)

-- Add column
ALTER TABLE clinical_journeys
ADD COLUMN orchestrator_id TEXT UNIQUE;

-- Populate mapping (based on insertion order)
UPDATE clinical_journeys
SET orchestrator_id = '009'
WHERE id = '550e8400-e29b-41d4-a716-446655440000'::uuid;

UPDATE clinical_journeys
SET orchestrator_id = '010'
WHERE id = '550e8400-e29b-41d4-a716-446655440001'::uuid;

UPDATE clinical_journeys
SET orchestrator_id = '011'
WHERE id = '550e8400-e29b-41d4-a716-446655440002'::uuid;

UPDATE clinical_journeys
SET orchestrator_id = '012'
WHERE id = '550e8400-e29b-41d4-a716-446655440003'::uuid;

UPDATE clinical_journeys
SET orchestrator_id = '013'
WHERE id = '550e8400-e29b-41d4-a716-446655440004'::uuid;

-- Verify
SELECT id, title, orchestrator_id FROM clinical_journeys WHERE orchestrator_id IS NOT NULL ORDER BY orchestrator_id;
