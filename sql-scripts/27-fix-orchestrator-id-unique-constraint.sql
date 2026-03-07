-- Quick Task 003 (Fixed): Remove UNIQUE constraint from orchestrator_id
-- Problem: Cannot mark 12 journeys with same value 'UNAVAILABLE' due to UNIQUE constraint
-- Solution: Drop the constraint, allow multiple rows with same orchestrator_id

-- Step 1: Drop the UNIQUE constraint (safe - if not exists, no error)
BEGIN;
  ALTER TABLE clinical_journeys
  DROP CONSTRAINT clinical_journeys_orchestrator_id_key;
COMMIT;

-- Step 2: Now update all NULL orchestrator_id to 'UNAVAILABLE'
UPDATE clinical_journeys
SET orchestrator_id = 'UNAVAILABLE'
WHERE orchestrator_id IS NULL;

-- Step 3: Verify 12 were updated
SELECT COUNT(*) AS unavailable_count
FROM clinical_journeys
WHERE orchestrator_id = 'UNAVAILABLE';

-- Step 4: Verify 3 active journeys untouched
SELECT id, title, orchestrator_id
FROM clinical_journeys
WHERE orchestrator_id IN ('009', '010', '011')
ORDER BY orchestrator_id;

-- Step 5: Verify zero NULL remain
SELECT COUNT(*) AS null_count
FROM clinical_journeys
WHERE orchestrator_id IS NULL;

-- Step 6: Full snapshot
SELECT
  id,
  title,
  orchestrator_id,
  CASE
    WHEN orchestrator_id IN ('009', '010', '011') THEN 'ACTIVE'
    WHEN orchestrator_id = 'UNAVAILABLE'          THEN 'UNAVAILABLE'
    ELSE                                               'UNEXPECTED'
  END AS status
FROM clinical_journeys
ORDER BY orchestrator_id;
