-- ============================================
-- ROLLBACK: Populate 3 Missing Journeys
-- ============================================
-- Created: 2026-03-06
-- Purpose: Remove 36 inserted sessions from 3 journeys
--
-- Emergency procedure if migration 30 fails or needs reversal
-- This script is idempotent (safe to run multiple times)
--
-- ============================================

BEGIN;

-- Delete all sessions for the 3 journeys populated by migration 30
DELETE FROM journey_sessions
WHERE journey_id IN (
  '550e8400-e29b-41d4-a716-446655440002',  -- Depressão (João)
  '550e8400-e29b-41d4-a716-446655440001',  -- Agorafobia (Maria)
  '550e8400-e29b-41d4-a716-446655440000'   -- TAG (Pedro)
);

-- Verify deletion
SELECT 'ROLLBACK VERIFICATION' as step,
  (SELECT COUNT(*) FROM journey_sessions WHERE journey_id = '550e8400-e29b-41d4-a716-446655440002') as depressao_remaining,
  (SELECT COUNT(*) FROM journey_sessions WHERE journey_id = '550e8400-e29b-41d4-a716-446655440001') as agorafobia_remaining,
  (SELECT COUNT(*) FROM journey_sessions WHERE journey_id = '550e8400-e29b-41d4-a716-446655440000') as tag_remaining;

COMMIT;

-- ============================================
-- SUCCESS
-- ============================================
-- All 36 sessions have been removed
-- If you need to re-apply, run migration 30 again
