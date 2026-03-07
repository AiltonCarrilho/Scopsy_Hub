-- Quick Task 003: Mark 12 journeys without JSON files as UNAVAILABLE
-- Depends on: 23-add-orchestrator-id-to-clinical-journeys.sql (Quick Task 002)
-- Safe: only touches rows where orchestrator_id IS NULL
-- Preserves: '009', '010', '011' (rows with actual JSON content)

-- Step 1: UPDATE all NULL rows to 'UNAVAILABLE'
UPDATE clinical_journeys
SET orchestrator_id = 'UNAVAILABLE'
WHERE orchestrator_id IS NULL;

-- Step 2: Verify exactly 12 rows were updated
-- Expected: count = 12
SELECT COUNT(*) AS unavailable_count
FROM clinical_journeys
WHERE orchestrator_id = 'UNAVAILABLE';

-- Step 3: Verify the 3 mapped journeys are untouched
-- Expected: 3 rows with numeric IDs
SELECT id, title, orchestrator_id
FROM clinical_journeys
WHERE orchestrator_id IN ('009', '010', '011')
ORDER BY orchestrator_id;

-- Step 4: Confirm zero NULL rows remain
-- Expected: null_count = 0
SELECT COUNT(*) AS null_count
FROM clinical_journeys
WHERE orchestrator_id IS NULL;

-- Step 5: Full state snapshot (all 15 journeys)
SELECT
  id,
  title,
  orchestrator_id,
  CASE
    WHEN orchestrator_id IN ('009', '010', '011') THEN 'ACTIVE - has JSON content'
    WHEN orchestrator_id = 'UNAVAILABLE'          THEN 'UNAVAILABLE - no content yet'
    ELSE                                               'UNEXPECTED - check manually'
  END AS status
FROM clinical_journeys
ORDER BY
  CASE WHEN orchestrator_id = 'UNAVAILABLE' THEN 1 ELSE 0 END,
  orchestrator_id;
