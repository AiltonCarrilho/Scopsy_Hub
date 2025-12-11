-- Migração: Tabela de Rate Limiting
-- Data: 2025-01-11
-- Descrição: Controlar mensagens por dia por usuário

CREATE TABLE IF NOT EXISTS user_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  plan TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Índice composto para busca rápida
  UNIQUE(user_id, date)
);

-- Índice para buscar por data (cleanup de registros antigos)
CREATE INDEX idx_user_rate_limits_date ON user_rate_limits(date);

-- Índice para buscar por usuário
CREATE INDEX idx_user_rate_limits_user_id ON user_rate_limits(user_id);

-- Comentários
COMMENT ON TABLE user_rate_limits IS 'Controle de rate limiting por usuário e data';
COMMENT ON COLUMN user_rate_limits.message_count IS 'Número de mensagens enviadas no dia';
COMMENT ON COLUMN user_rate_limits.plan IS 'Plano do usuário no momento (free, basic, pro, premium)';

-- Function para cleanup automático (registros > 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM user_rate_limits
  WHERE date < CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- (Opcional) Executar cleanup via cron job no Supabase
-- SELECT cron.schedule('cleanup-rate-limits', '0 2 * * *', 'SELECT cleanup_old_rate_limits()');
