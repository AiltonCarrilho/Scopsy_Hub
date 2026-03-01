-- ========================================
-- SCOPSY - ROW LEVEL SECURITY (RLS)
-- CRÍTICO #2: Isolamento de dados por usuário
-- UNIFIED DEPLOYMENT - CUSTOM Context Pattern
-- ========================================
-- Ativa RLS em 9 tabelas críticas com padrão CUSTOM context
-- Todas as tabelas usam: current_setting('request.user_id')
-- Abordagem: Consistência + Idempotência + Performance
-- ========================================
-- TABELAS ALVO (9 total):
-- 1. billing_history
-- 2. chat_conversations
-- 3. chat_messages (com fallback via conversation_id se necessário)
-- 4. sessions
-- 5. user_achievements
-- 6. user_progress
-- 7. user_case_interactions
-- 8. user_daily_missions
-- 9. user_activity_log
-- ========================================

-- ========================================
-- BLOCO 1: BILLING_HISTORY
-- ========================================
-- Sensibilidade: CRÍTICA (PII + pagamentos)
-- Isolamento: user_id = current_setting('request.user_id')

ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_history_rls_own" ON billing_history;

CREATE POLICY "billing_history_rls_own" ON billing_history
  FOR ALL TO authenticated
  USING (user_id = (current_setting('request.user_id', true))::BIGINT)
  WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON billing_history(user_id);

-- ========================================
-- BLOCO 2: CHAT_CONVERSATIONS
-- ========================================
-- Sensibilidade: ALTA (conversas privadas)
-- Isolamento: user_id = current_setting('request.user_id')

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_conversations_rls_own" ON chat_conversations;

CREATE POLICY "chat_conversations_rls_own" ON chat_conversations
  FOR ALL TO authenticated
  USING (user_id = (current_setting('request.user_id', true))::BIGINT)
  WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);

-- ========================================
-- BLOCO 3: CHAT_MESSAGES
-- ========================================
-- Sensibilidade: ALTA (conteúdo de mensagens)
-- Isolamento: VIA conversation_id (subquery) - padrão seguro

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_rls_own" ON chat_messages;

CREATE POLICY "chat_messages_rls_own" ON chat_messages
  FOR ALL TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM chat_conversations
      WHERE user_id = (current_setting('request.user_id', true))::BIGINT
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM chat_conversations
      WHERE user_id = (current_setting('request.user_id', true))::BIGINT
    )
  );

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);

-- ========================================
-- BLOCO 4: SESSIONS
-- ========================================
-- Sensibilidade: ALTA (dados de sessão de treinamento)
-- Isolamento: user_id = current_setting('request.user_id')

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sessions_rls_own" ON sessions;

CREATE POLICY "sessions_rls_own" ON sessions
  FOR ALL TO authenticated
  USING (user_id = (current_setting('request.user_id', true))::BIGINT)
  WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- ========================================
-- BLOCO 5: USER_ACHIEVEMENTS
-- ========================================
-- Sensibilidade: MÉDIA (badges e conquistas)
-- Isolamento: user_id = current_setting('request.user_id')

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_achievements_rls_own" ON user_achievements;

CREATE POLICY "user_achievements_rls_own" ON user_achievements
  FOR ALL TO authenticated
  USING (user_id = (current_setting('request.user_id', true))::BIGINT)
  WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- ========================================
-- BLOCO 6: USER_PROGRESS
-- ========================================
-- Sensibilidade: ALTA (progresso de aprendizado)
-- Isolamento: user_id = current_setting('request.user_id')

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_progress_rls_own" ON user_progress;

CREATE POLICY "user_progress_rls_own" ON user_progress
  FOR ALL TO authenticated
  USING (user_id = (current_setting('request.user_id', true))::BIGINT)
  WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

-- ========================================
-- BLOCO 7: USER_CASE_INTERACTIONS
-- ========================================
-- Sensibilidade: ALTA (interações com casos clínicos)
-- Isolamento: user_id = current_setting('request.user_id')

ALTER TABLE user_case_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_case_interactions_rls_own" ON user_case_interactions;

CREATE POLICY "user_case_interactions_rls_own" ON user_case_interactions
  FOR ALL TO authenticated
  USING (user_id = (current_setting('request.user_id', true))::BIGINT)
  WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

CREATE INDEX IF NOT EXISTS idx_user_case_interactions_user_id ON user_case_interactions(user_id);

-- ========================================
-- BLOCO 8: USER_DAILY_MISSIONS
-- ========================================
-- Sensibilidade: MÉDIA (missões diárias)
-- Isolamento: user_id = current_setting('request.user_id')

ALTER TABLE user_daily_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_daily_missions_rls_own" ON user_daily_missions;

CREATE POLICY "user_daily_missions_rls_own" ON user_daily_missions
  FOR ALL TO authenticated
  USING (user_id = (current_setting('request.user_id', true))::BIGINT)
  WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

CREATE INDEX IF NOT EXISTS idx_user_daily_missions_user_id ON user_daily_missions(user_id);

-- ========================================
-- BLOCO 9: USER_ACTIVITY_LOG
-- ========================================
-- Sensibilidade: ALTA (logs de atividade do usuário)
-- Isolamento: user_id = current_setting('request.user_id')

ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_activity_log_rls_own" ON user_activity_log;

CREATE POLICY "user_activity_log_rls_own" ON user_activity_log
  FOR ALL TO authenticated
  USING (user_id = (current_setting('request.user_id', true))::BIGINT)
  WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);

-- ========================================
-- GRANT PERMISSIONS
-- ========================================
-- Garantir que usuários autenticados têm permissões necessárias

GRANT SELECT, INSERT, UPDATE, DELETE ON billing_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_case_interactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_daily_missions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_activity_log TO authenticated;

-- ========================================
-- VERIFICAÇÃO PÓS-IMPLEMENTAÇÃO
-- ========================================
-- Execute this query to validate all 9 tables have RLS enabled:

SELECT
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status,
  (SELECT count(*) FROM pg_policies WHERE tablename = pg_tables.tablename) as policies_count
FROM pg_tables
WHERE tablename IN (
  'billing_history',
  'chat_conversations',
  'chat_messages',
  'sessions',
  'user_achievements',
  'user_progress',
  'user_case_interactions',
  'user_daily_missions',
  'user_activity_log'
)
ORDER BY tablename;

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- tablename                | rls_status | policies_count
-- ───────────────────────────────────────────────────────
-- billing_history          | ENABLED    | 1
-- chat_conversations       | ENABLED    | 1
-- chat_messages            | ENABLED    | 1
-- sessions                 | ENABLED    | 1
-- user_achievements        | ENABLED    | 1
-- user_progress            | ENABLED    | 1
-- user_case_interactions   | ENABLED    | 1
-- user_daily_missions      | ENABLED    | 1
-- user_activity_log        | ENABLED    | 1
-- ========================================

-- ========================================
-- ÍNDICES CRIADOS (para performance)
-- ========================================
-- Execute para verificar índices:
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN (
  'billing_history',
  'chat_conversations',
  'chat_messages',
  'sessions',
  'user_achievements',
  'user_progress',
  'user_case_interactions',
  'user_daily_missions',
  'user_activity_log'
)
AND indexname LIKE 'idx_%user_id%'
ORDER BY tablename, indexname;

-- ========================================
-- TESTES RÁPIDOS (executar após deploy)
-- ========================================
-- Use os comandos abaixo para validar isolamento:

/*
-- TESTE 1: Simular set_auth_context para user_id = 1
SELECT set_auth_context(1);
SELECT count(*) FROM billing_history;
-- Esperado: Vê APENAS linhas com user_id = 1

-- TESTE 2: Mudar contexto para user_id = 2
SELECT set_auth_context(2);
SELECT count(*) FROM billing_history;
-- Esperado: Vê APENAS linhas com user_id = 2

-- TESTE 3: Chat conversation isolado
SELECT set_auth_context(1);
SELECT count(*) FROM chat_conversations;
-- Esperado: Vê APENAS conversas do user_id = 1

-- TESTE 4: Chat messages isolado
SELECT set_auth_context(1);
SELECT count(*) FROM chat_messages;
-- Esperado: Vê APENAS mensagens de suas conversas

-- TESTE 5: Sem contexto (sem acesso)
SELECT set_config('request.user_id', NULL, false);
SELECT count(*) FROM billing_history;
-- Esperado: 0 (nenhum acesso sem contexto)
*/

-- ========================================
-- NOTAS IMPORTANTES
-- ========================================
-- 1. current_setting('request.user_id', true) obtém o user_id do JWT context
-- 2. CAST para BIGINT é necessário pois user_id é BIGINT nas tabelas
-- 3. RLS automático: nenhuma linha sem permissão pode ser acessada
-- 4. SELECT sem WHERE filtra por RLS automaticamente
-- 5. Testar com usuários diferentes para validar isolamento completo
-- 6. Performance: índices em user_id permitem query plans eficientes
-- 7. Chat_messages usa subquery via conversation_id (padrão seguro)
-- 8. Rollback disponível em 11-rls-rollback-emergency.sql
-- ========================================
