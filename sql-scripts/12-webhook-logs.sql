-- =============================================
-- P0.3: KIWIFY WEBHOOK LOGGING & RETRY SYSTEM
-- =============================================
-- Tabela para rastrear todos os webhooks recebidos
-- Permite retry automático e troubleshooting manual
--
-- Referência Story: P0.3-kiwify-webhooks.md

-- =============================================
-- 1. CRIAR TABELA webhook_logs
-- =============================================
CREATE TABLE IF NOT EXISTS webhook_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Identificação do webhook
  event_type TEXT NOT NULL,           -- "checkout.completed", "subscription.renewed", etc
  event_id TEXT,                      -- ID único do evento da Kiwify

  -- Payload e metadados
  payload JSONB NOT NULL,             -- Corpo completo do webhook
  signature TEXT,                     -- HMAC-SHA256 recebida
  signature_valid BOOLEAN,            -- Se assinatura foi validada

  -- Processamento
  status TEXT DEFAULT 'pending',      -- pending, success, failed, retrying
  error_message TEXT,                 -- Mensagem de erro se falhou

  -- Retry logic
  attempt_count INT DEFAULT 1,        -- Quantas vezes foi tentado
  next_retry_at TIMESTAMP,            -- Próxima tentativa (exponential backoff)
  last_retry_at TIMESTAMP,            -- Última tentativa

  -- Associação com usuário/pedido
  customer_email TEXT,                -- Email do cliente (para debugging)
  order_id TEXT,                      -- ID do pedido (se aplicável)
  subscription_id TEXT,               -- ID da assinatura (se aplicável)

  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP              -- Quando foi processado com sucesso
);

-- =============================================
-- 2. ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices para queries frequentes
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_next_retry ON webhook_logs(next_retry_at)
  WHERE status IN ('pending', 'retrying');

-- Índice para encontrar webhooks de um cliente
CREATE INDEX IF NOT EXISTS idx_webhook_logs_customer_email ON webhook_logs(customer_email);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_order_id ON webhook_logs(order_id);

-- =============================================
-- 3. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =============================================

COMMENT ON TABLE webhook_logs IS
  'Log completo de todos os webhooks recebidos da Kiwify. Permite retry automático e troubleshooting.';

COMMENT ON COLUMN webhook_logs.event_type IS
  'Tipo de evento: checkout.completed, subscription.renewed, subscription.canceled, order.refunded, etc';

COMMENT ON COLUMN webhook_logs.payload IS
  'Corpo completo do webhook em JSON para auditoria e replay se necessário';

COMMENT ON COLUMN webhook_logs.signature IS
  'Assinatura HMAC-SHA256 recebida no header x-kiwify-signature';

COMMENT ON COLUMN webhook_logs.signature_valid IS
  'true se assinatura foi validada corretamente, false se rejeitado por segurança';

COMMENT ON COLUMN webhook_logs.status IS
  'Estado do processamento: pending (não processado), retrying (retentando), success (ok), failed (erro permanente)';

COMMENT ON COLUMN webhook_logs.attempt_count IS
  'Número de tentativas (incluindo a atual). Max 5 tentativas com exponential backoff.';

COMMENT ON COLUMN webhook_logs.next_retry_at IS
  'Timestamp quando próxima retry deve acontecer. Calculo: now + (2 ^ attempt_count) minutos';

-- =============================================
-- 4. ROW-LEVEL SECURITY (RLS)
-- =============================================
-- webhook_logs NÃO deve ter RLS porque:
-- - É tabela de sistema/auditoria
-- - Service role precisa acessar para reprocessar
-- - Usuários normais não devem acessar

ALTER TABLE webhook_logs DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. GRANT PERMISSIONS
-- =============================================
-- Permitir service_role (usado por webhooks) acesso completo
GRANT ALL PRIVILEGES ON TABLE webhook_logs TO service_role;
GRANT ALL PRIVILEGES ON SEQUENCE webhook_logs_id_seq TO service_role;

-- =============================================
-- 6. VIEW PARA MONITORING
-- =============================================

-- Vista para monitorar webhooks falhados que precisam retry
CREATE OR REPLACE VIEW webhook_logs_pending_retry AS
SELECT
  id,
  event_type,
  event_id,
  customer_email,
  order_id,
  subscription_id,
  status,
  attempt_count,
  next_retry_at,
  error_message,
  created_at
FROM webhook_logs
WHERE status IN ('pending', 'retrying')
  AND next_retry_at <= NOW()
  AND attempt_count < 5
ORDER BY next_retry_at ASC;

COMMENT ON VIEW webhook_logs_pending_retry IS
  'Webhooks prontos para retry. Use esta view para monitorar falhas.';

-- Vista para análise de erros
CREATE OR REPLACE VIEW webhook_logs_recent_errors AS
SELECT
  id,
  event_type,
  customer_email,
  status,
  attempt_count,
  error_message,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 AS minutes_ago
FROM webhook_logs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

COMMENT ON VIEW webhook_logs_recent_errors IS
  'Webhooks que falharam nas últimas 24 horas. Use para debugging.';

-- =============================================
-- 7. PROCEDURE PARA RETRY AUTOMÁTICO
-- =============================================

CREATE OR REPLACE FUNCTION retry_pending_webhooks()
RETURNS TABLE(
  webhook_id BIGINT,
  event_type TEXT,
  new_status TEXT
) LANGUAGE plpgsql AS $$
BEGIN
  -- Marcar todos os webhooks prontos para retry como "retrying"
  UPDATE webhook_logs
  SET status = 'retrying',
      last_retry_at = NOW(),
      updated_at = NOW()
  WHERE status IN ('pending', 'retrying')
    AND next_retry_at <= NOW()
    AND attempt_count < 5
  RETURNING id, event_type, status INTO webhook_id, event_type, new_status;
END;
$$;

COMMENT ON FUNCTION retry_pending_webhooks() IS
  'Marca webhooks prontos para retry. Execute periodicamente com cron job.';

-- =============================================
-- INSTRUÇÕES DE USO
-- =============================================
-- 1. Aplicar esta migration:
--    cat sql-scripts/12-webhook-logs.sql | psql $DATABASE_URL
--
-- 2. No código Node.js:
--    - Sempre inserir webhook em webhook_logs (mesmo se sucesso)
--    - Se erro, marcar como 'failed' com próxima retry
--    - Se sucesso, marcar como 'success' com processed_at
--
-- 3. Setup cron job para retry automático (via pg_cron ou external):
--    SELECT cron.schedule('retry-webhooks', '*/5 * * * *',
--      'SELECT retry_pending_webhooks()');
--
-- 4. Monitorar:
--    SELECT * FROM webhook_logs_pending_retry;  -- Próximos para retry
--    SELECT * FROM webhook_logs_recent_errors;  -- Últimos 24h de erros
--
-- 5. Manual retry (quando corrigido o erro):
--    UPDATE webhook_logs
--    SET status = 'retrying', next_retry_at = NOW()
--    WHERE id = <webhook_id>;
