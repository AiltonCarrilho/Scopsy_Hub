-- ========================================
-- KIWIFY INTEGRATION - Schema Migration
-- ========================================
-- Adiciona campos necessarios para integracao Kiwify
-- Data: 19/12/2024
-- Versao: 1.0

-- ========================================
-- 1. ADICIONAR COLUNAS A TABELA USERS
-- ========================================

-- Campos Kiwify
ALTER TABLE users
ADD COLUMN IF NOT EXISTS kiwify_customer_id TEXT,
ADD COLUMN IF NOT EXISTS kiwify_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_ended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_next_billing TIMESTAMP WITH TIME ZONE;

-- ========================================
-- 2. COMENTARIOS PARA DOCUMENTACAO
-- ========================================

COMMENT ON COLUMN users.kiwify_customer_id IS 'ID do pedido Kiwify (order_id) - usado para identificar cliente';
COMMENT ON COLUMN users.kiwify_subscription_id IS 'ID da assinatura recorrente Kiwify (subscription_id)';
COMMENT ON COLUMN users.subscription_started_at IS 'Data/hora em que assinatura Premium foi iniciada';
COMMENT ON COLUMN users.subscription_ended_at IS 'Data/hora em que assinatura foi cancelada/reembolsada';
COMMENT ON COLUMN users.subscription_next_billing IS 'Data/hora da proxima cobranca (renovacao)';

-- ========================================
-- 3. INDICES PARA PERFORMANCE
-- ========================================

-- Indice para busca rapida por subscription_id (usado nos webhooks)
CREATE INDEX IF NOT EXISTS idx_users_kiwify_subscription
ON users(kiwify_subscription_id)
WHERE kiwify_subscription_id IS NOT NULL;

-- Indice para busca rapida por customer_id (usado nos webhooks de reembolso)
CREATE INDEX IF NOT EXISTS idx_users_kiwify_customer
ON users(kiwify_customer_id)
WHERE kiwify_customer_id IS NOT NULL;

-- Indice para busca por status de assinatura
CREATE INDEX IF NOT EXISTS idx_users_subscription_status
ON users(subscription_status)
WHERE subscription_status IS NOT NULL;

-- ========================================
-- 4. VALIDACOES E CONSTRAINTS
-- ========================================

-- Garantir que subscription_ended_at seja sempre posterior a subscription_started_at
ALTER TABLE users
DROP CONSTRAINT IF EXISTS check_subscription_dates;

ALTER TABLE users
ADD CONSTRAINT check_subscription_dates
CHECK (
  subscription_ended_at IS NULL OR
  subscription_started_at IS NULL OR
  subscription_ended_at >= subscription_started_at
);

-- ========================================
-- 5. ATUALIZAR PLANOS EXISTENTES (MIGRACAO)
-- ========================================

-- Converter planos antigos do Stripe (se houver) para estrutura Kiwify
-- Caso voce tenha algum usuario com plan='basic', 'pro', etc, converter todos para 'premium'

UPDATE users
SET plan = 'premium'
WHERE plan IN ('basic', 'pro') AND subscription_status = 'active';

-- Usuarios com plano diferente de 'free' e 'premium' -> converter para free
UPDATE users
SET plan = 'free', subscription_status = 'canceled'
WHERE plan NOT IN ('free', 'premium');

-- ========================================
-- 6. VERIFICACAO POS-MIGRACAO
-- ========================================

-- Verificar quantos usuarios existem por plano
SELECT
  plan,
  subscription_status,
  COUNT(*) as total_users
FROM users
GROUP BY plan, subscription_status
ORDER BY plan, subscription_status;

-- Verificar usuarios com dados Kiwify
SELECT
  COUNT(*) as users_with_kiwify,
  COUNT(DISTINCT kiwify_customer_id) as unique_customers,
  COUNT(DISTINCT kiwify_subscription_id) as unique_subscriptions
FROM users
WHERE kiwify_customer_id IS NOT NULL;

-- ========================================
-- 7. TRIGGER PARA AUDITORIA (OPCIONAL)
-- ========================================

-- Criar tabela de auditoria de mudancas de plano
CREATE TABLE IF NOT EXISTS plan_changes_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  old_plan TEXT,
  new_plan TEXT,
  old_status TEXT,
  new_status TEXT,
  changed_by TEXT, -- 'webhook_kiwify', 'admin', 'user'
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB -- Dados adicionais (order_id, subscription_id, etc)
);

-- Indice para buscar historico de um usuario
CREATE INDEX IF NOT EXISTS idx_plan_changes_user
ON plan_changes_audit(user_id, changed_at DESC);

-- Trigger para registrar mudancas de plano automaticamente
CREATE OR REPLACE FUNCTION log_plan_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.plan IS DISTINCT FROM NEW.plan) OR (OLD.subscription_status IS DISTINCT FROM NEW.subscription_status) THEN
    INSERT INTO plan_changes_audit (
      user_id,
      old_plan,
      new_plan,
      old_status,
      new_status,
      changed_by,
      metadata
    ) VALUES (
      NEW.id,
      OLD.plan,
      NEW.plan,
      OLD.subscription_status,
      NEW.subscription_status,
      COALESCE(current_setting('app.changed_by', true), 'system'),
      jsonb_build_object(
        'kiwify_customer_id', NEW.kiwify_customer_id,
        'kiwify_subscription_id', NEW.kiwify_subscription_id,
        'subscription_started_at', NEW.subscription_started_at,
        'subscription_ended_at', NEW.subscription_ended_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ativar trigger
DROP TRIGGER IF EXISTS trigger_log_plan_change ON users;
CREATE TRIGGER trigger_log_plan_change
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_plan_change();

-- ========================================
-- 8. FUNCAO HELPER PARA VERIFICAR TRIAL EXPIRADO
-- ========================================

CREATE OR REPLACE FUNCTION is_trial_expired(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT plan, trial_ends_at INTO user_record
  FROM users
  WHERE id = user_id;

  -- Se nao e free, nao esta em trial
  IF user_record.plan != 'free' THEN
    RETURN FALSE;
  END IF;

  -- Se trial_ends_at e NULL, trial ainda nao comecou ou e free sem trial
  IF user_record.trial_ends_at IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verificar se ja expirou
  RETURN user_record.trial_ends_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 9. VIEW UTIL: USUARIOS COM ASSINATURA ATIVA
-- ========================================

CREATE OR REPLACE VIEW active_premium_users AS
SELECT
  u.id,
  u.email,
  u.name,
  u.plan,
  u.subscription_status,
  u.subscription_started_at,
  u.subscription_next_billing,
  u.kiwify_subscription_id,
  u.created_at,
  EXTRACT(DAY FROM (NOW() - u.subscription_started_at)) as days_subscribed,
  CASE
    WHEN u.subscription_next_billing IS NOT NULL AND u.subscription_next_billing < NOW() + INTERVAL '7 days'
    THEN TRUE
    ELSE FALSE
  END as renewal_soon
FROM users u
WHERE u.plan = 'premium' AND u.subscription_status = 'active';

-- ========================================
-- FIM DA MIGRACAO
-- ========================================

-- Exibir resumo
SELECT '--- Migracao Kiwify concluida com sucesso! ---' as status;
