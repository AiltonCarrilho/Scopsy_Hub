-- ============================================
-- MIGRATION: Fix RLS journey tables for ANON
-- ============================================
-- Problem: clinical_journeys and journey_sessions restricted to authenticated role only
--          But frontend uses anon client (no auth yet)
--          Broke: jornada.html module
--
-- Root Cause: GRANT SELECT ON clinical_journeys TO authenticated (missing anon)
--             GRANT SELECT ON journey_sessions TO authenticated (missing anon)
--
-- Solution: Add GRANT SELECT ON both tables TO anon
--
-- Impact: ZERO - both tables are read-only shared content
--         RLS policies unchanged
--         Write operations (INSERT/UPDATE/DELETE) still restricted

-- Fix: Grant SELECT to anon role (read-only)
GRANT SELECT ON clinical_journeys TO anon;
GRANT SELECT ON journey_sessions TO anon;

-- Verify
SELECT 
  tablename,
  string_agg(grantee || ':' || privilege_type, ', ' ORDER BY grantee) as permissions
FROM information_schema.table_privileges 
WHERE tablename IN ('clinical_journeys', 'journey_sessions')
AND table_schema = 'public'
GROUP BY tablename
ORDER BY tablename;
