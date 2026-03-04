-- ============================================
-- MIGRATION: Fix RLS cases table for ANON
-- ============================================
-- Problem: Cases table restricted to authenticated role only
--          But frontend uses anon client (no auth yet)
--          Broke: desafios.html, diagnostic.html, conceituacao.html
--
-- Root Cause: GRANT SELECT ON cases TO authenticated (missing anon)
-- Solution: Add GRANT SELECT ON cases TO anon
--
-- Impact: ZERO - cases is read-only shared content
--         RLS policies unchanged (rls_cases_readonly applies)
--         Any role trying to INSERT/UPDATE/DELETE still blocked

-- Fix: Grant SELECT to anon role (read-only)
GRANT SELECT ON cases TO anon;

-- Verify
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'cases' 
ORDER BY grantee, privilege_type;
