-- ============================================================================
-- SCOPSY - RLS OPTIMIZATION
-- Remove RLS from public exercise tables (not user data)
-- Keep RLS on private user progress tables
-- ============================================================================
-- DROPPED RLS (exercícios são públicos/ficticios):
-- 1. clinical_journeys ❌
-- 2. cases ❌
-- 3. sessions ❌
--
-- KEEP RLS (dados privados do usuário):
-- ✅ user_journey_progress
-- ✅ user_session_decisions  
-- ✅ user_progress
-- ✅ chat_conversations
-- ✅ chat_messages
-- ============================================================================

-- Table 1: clinical_journeys (PUBLIC - exercícios fictícios)
ALTER TABLE clinical_journeys DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_clinical_journeys" ON clinical_journeys;
DROP POLICY IF EXISTS "rls_clinical_journeys_select" ON clinical_journeys;
DROP POLICY IF EXISTS "rls_clinical_journeys_insert" ON clinical_journeys;

-- Table 2: cases (PUBLIC - exercícios fictícios)
ALTER TABLE cases DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_cases" ON cases;
DROP POLICY IF EXISTS "rls_cases_select" ON cases;
DROP POLICY IF EXISTS "rls_cases_insert" ON cases;

-- Table 3: sessions (PUBLIC - conteúdo do exercício)
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_sessions" ON sessions;
DROP POLICY IF EXISTS "rls_sessions_select" ON sessions;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Verify RLS status on remaining tables
SELECT tablename, 
       (SELECT count(*) FROM pg_policies WHERE pg_policies.tablename = information_schema.tables.table_name) as policy_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND tablename IN (
  'clinical_journeys', 'cases', 'sessions',
  'user_journey_progress', 'user_session_decisions', 'user_progress',
  'chat_conversations', 'chat_messages'
)
ORDER BY tablename;

-- ============================================================================
-- PERFORMANCE IMPACT
-- ============================================================================
-- Expected: clinical_journeys, cases, sessions queries 30-50% faster
-- Reason: No RLS policy evaluation on every row
-- ============================================================================
