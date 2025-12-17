-- ==============================================================================
-- MIGRATION 04: GAMIFICATION STREAKS
-- Adiciona colunas para controle de sequência (streaks) na tabela users
-- ==============================================================================

-- 1. Adicionar colunas de streak na tabela users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'current_streak') THEN
        ALTER TABLE users ADD COLUMN current_streak INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'longest_streak') THEN
        ALTER TABLE users ADD COLUMN longest_streak INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_activity_at') THEN
        ALTER TABLE users ADD COLUMN last_activity_at TIMESTAMP WITH TIME ZONE;
    END IF;
END
$$;

-- 2. Tabela de histórico de atividade diária (para análise futura e validação)
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    activity_type VARCHAR(50) NOT NULL, -- 'login', 'challenge', 'diagnostic', 'conceptualization'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida de atividade por data/usuário
CREATE INDEX IF NOT EXISTS idx_user_activity_date ON user_activity_log(user_id, activity_date);

-- Comentários
COMMENT ON COLUMN users.current_streak IS 'Sequência atual de dias consecutivos ativos';
COMMENT ON COLUMN users.longest_streak IS 'Maior sequência de dias já alcançada';
COMMENT ON COLUMN users.last_activity_at IS 'Data/hora da última atividade qualificada para streak';
