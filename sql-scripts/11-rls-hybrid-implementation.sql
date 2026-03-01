-- ========================================
-- SCOPSY - ROW LEVEL SECURITY (RLS)
-- CRÍTICO #2: Isolamento de dados por usuário
-- ========================================
-- Ativa RLS em 9 tabelas críticas
-- Abordagem HYBRID: KISS + Granular
-- ========================================

-- 1. USER_PROGRESS - Isolamento total por user_id
-- Cada usuário só vê seu próprio progresso
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_progress_own ON user_progress
  FOR ALL
  USING (user_id = auth.uid()::BIGINT)
  WITH CHECK (user_id = auth.uid()::BIGINT);

-- 2. JOURNEY_SESSIONS - Isolamento total por user_id
-- Usuários só veem suas próprias sessões de jornada
ALTER TABLE journey_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_journey_own ON journey_sessions
  FOR ALL
  USING (user_id = auth.uid()::BIGINT)
  WITH CHECK (user_id = auth.uid()::BIGINT);

-- 3. USER_ACHIEVEMENTS - Isolamento total por user_id
-- Badges são privadas por usuário
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_achievements_own ON user_achievements
  FOR ALL
  USING (user_id = auth.uid()::BIGINT)
  WITH CHECK (user_id = auth.uid()::BIGINT);

-- 4. SESSIONS - Isolamento total por user_id
-- Cada sessão de treino pertence ao usuário
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_sessions_own ON sessions
  FOR ALL
  USING (user_id = auth.uid()::BIGINT)
  WITH CHECK (user_id = auth.uid()::BIGINT);

-- 5. CHAT_CONVERSATIONS - Isolamento por user_id
-- Conversas são privadas
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_conversations_own ON chat_conversations
  FOR ALL
  USING (user_id = auth.uid()::BIGINT)
  WITH CHECK (user_id = auth.uid()::BIGINT);

-- 6. CHAT_MESSAGES - Isolamento via conversation (indiret user_id)
-- Mensagens protegidas através da conversa pai
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_messages_own ON chat_messages
  FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM chat_conversations
      WHERE user_id = auth.uid()::BIGINT
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM chat_conversations
      WHERE user_id = auth.uid()::BIGINT
    )
  );

-- 7. USER_STATS - Isolamento por user_id
-- Estatísticas agregadas são privadas
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_stats_own ON user_stats
  FOR ALL
  USING (user_id = auth.uid()::BIGINT)
  WITH CHECK (user_id = auth.uid()::BIGINT);

-- 8. CASE_REVIEWS - Isolamento por user_id
-- Reviews de casos são privadas
ALTER TABLE case_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_case_reviews_own ON case_reviews
  FOR ALL
  USING (user_id = auth.uid()::BIGINT)
  WITH CHECK (user_id = auth.uid()::BIGINT);

-- 9. BILLING_HISTORY - Isolamento total por user_id
-- Dados de cobrança são super sensíveis
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_billing_own ON billing_history
  FOR ALL
  USING (user_id = auth.uid()::BIGINT)
  WITH CHECK (user_id = auth.uid()::BIGINT);

-- ========================================
-- VIEWS PÚBLICAS (sem RLS, ler somente)
-- ========================================

-- 10. CASES (pública) - Ninguém pode editar, todos leem
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_cases_readonly ON cases
  FOR SELECT
  USING (TRUE);

CREATE POLICY rls_cases_no_write ON cases
  FOR INSERT
  WITH CHECK (FALSE);

CREATE POLICY rls_cases_no_update ON cases
  FOR UPDATE
  WITH CHECK (FALSE);

CREATE POLICY rls_cases_no_delete ON cases
  FOR DELETE
  USING (FALSE);

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Usuários autenticados podem ler/escrever suas próprias linhas
GRANT SELECT, INSERT, UPDATE, DELETE ON user_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON journey_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_stats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON case_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON billing_history TO authenticated;

-- Casos são somente leitura para autenticados
GRANT SELECT ON cases TO authenticated;

-- ========================================
-- VERIFICAÇÃO PÓS-IMPLEMENTAÇÃO
-- ========================================

-- Executar após aplicar: SELECT * FROM pg_policies;
-- Esperado: 16 policies criadas (9 tabelas × múltiplas operações)

-- Verificar RLS ativado:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables
-- WHERE tablename IN (
--   'user_progress', 'journey_sessions', 'user_achievements',
--   'sessions', 'chat_conversations', 'chat_messages',
--   'user_stats', 'case_reviews', 'billing_history', 'cases'
-- )
-- ORDER BY tablename;

-- ========================================
-- NOTAS IMPORTANTES
-- ========================================
-- 1. auth.uid() retorna o UUID do usuário logado (Supabase Auth)
-- 2. Se user_id é BIGINT, cast para BIGINT: auth.uid()::BIGINT
-- 3. RLS automático: nenhuma linha sem auth pode ser acessada
-- 4. SELECT sem WHERE filtra por RLS automaticamente
-- 5. Testar com usuários diferentes para validar isolamento
-- ========================================
