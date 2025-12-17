-- ==============================================================================
-- MIGRATION 07: STRIPE FIX
-- Adiciona coluna para ID do cliente Stripe (para Portal de Assinatura)
-- ==============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive';

-- Índice para busca rápida (opcional)
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
