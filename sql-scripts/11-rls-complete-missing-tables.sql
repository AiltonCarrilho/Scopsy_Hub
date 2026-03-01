-- ========================================
-- SCOPSY - RLS COMPLETION
-- Proteger 3 tabelas faltantes: billing + chat
-- Usando padrão CUSTOM context (consistente)
-- ========================================

-- ========================================
-- TABELA 1: BILLING_HISTORY
-- ========================================
-- Sensibilidade: CRÍTICA (PII + pagamentos)
-- Isolamento: user_id = current_setting('request.user_id')

ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_history_all" ON billing_history;

CREATE POLICY "billing_history_all" ON billing_history
  FOR ALL TO authenticated
  USING (user_id = (current_setting('request.user_id', true))::BIGINT)
  WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON billing_history(user_id);

-- ========================================
-- TABELA 2: CHAT_CONVERSATIONS
-- ========================================
-- Sensibilidade: ALTA (conversas privadas)
-- Isolamento: user_id = current_setting('request.user_id')

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_conversations_all" ON chat_conversations;

CREATE POLICY "chat_conversations_all" ON chat_conversations
  FOR ALL TO authenticated
  USING (user_id = (current_setting('request.user_id', true))::BIGINT)
  WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);

-- ========================================
-- TABELA 3: CHAT_MESSAGES
-- ========================================
-- Sensibilidade: ALTA (conteúdo de mensagens)
-- Isolamento: VIA FOREIGN KEY (conversation_id → user_id)
-- Nota: Pode usar user_id direto se existir, ou via JOINs

-- OPÇÃO A: Se chat_messages tem user_id direto
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_all" ON chat_messages;

CREATE POLICY "chat_messages_all" ON chat_messages
  FOR ALL TO authenticated
  USING (user_id = (current_setting('request.user_id', true))::BIGINT)
  WITH CHECK (user_id = (current_setting('request.user_id', true))::BIGINT);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

-- OPÇÃO B (alternativa): Se chat_messages NÃO tem user_id direto
-- Usar subquery via conversation_id (comentado)
/*
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_owner" ON chat_messages;

CREATE POLICY "chat_messages_owner" ON chat_messages
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
*/

-- ========================================
-- VERIFICAÇÃO PÓS-IMPLEMENTAÇÃO
-- ========================================

-- Executar este comando para validar:
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
  'user_case_interactions',
  'user_daily_missions',
  'user_progress',
  'user_activity_log'
)
ORDER BY tablename;

-- RESULTADO ESPERADO:
-- tablename              | rls_status | policies_count
-- ─────────────────────────────────────────────────────
-- billing_history        | ENABLED    | 1
-- chat_conversations     | ENABLED    | 1
-- chat_messages          | ENABLED    | 1
-- sessions               | ENABLED    | 1
-- user_achievements      | ENABLED    | 1
-- user_case_interactions | ENABLED    | 1
-- user_daily_missions    | ENABLED    | 1
-- user_progress          | ENABLED    | 1
-- user_activity_log      | ENABLED    | 1

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Garantir que usuários autenticados têm permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON billing_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO authenticated;

-- ========================================
-- TESTES RÁPIDOS (executar após deploy)
-- ========================================

/*
-- TESTE 1: Simular set_auth_context para user_id = 1
SELECT set_auth_context(1);
SELECT * FROM billing_history;
-- Esperado: Vê APENAS linhas com user_id = 1

-- TESTE 2: Mudar contexto para user_id = 2
SELECT set_auth_context(2);
SELECT * FROM billing_history;
-- Esperado: Vê APENAS linhas com user_id = 2

-- TESTE 3: Chat conversation isolado
SELECT set_auth_context(1);
SELECT * FROM chat_conversations;
-- Esperado: Vê APENAS conversas do user_id = 1

-- TESTE 4: Chat messages isolado
SELECT set_auth_context(1);
SELECT * FROM chat_messages;
-- Esperado: Vê APENAS mensagens de suas conversas
*/

-- ========================================
-- LIMPEZA E RESET
-- ========================================

-- Reset do contexto (admin cleanup)
-- SELECT set_config('request.user_id', NULL, false);
