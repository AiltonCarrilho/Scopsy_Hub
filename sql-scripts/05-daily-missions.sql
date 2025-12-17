-- ==============================================================================
-- MIGRATION 05: DAILY MISSIONS
-- Cria tabela para gerenciar missões diárias dos usuários
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- Necessário para uuid_generate_v4()

CREATE TABLE IF NOT EXISTS user_daily_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Mais moderno e nativo
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
    mission_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    target INT NOT NULL DEFAULT 1,
    progress INT NOT NULL DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    reward_cognits INT NOT NULL DEFAULT 10,
    reference_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice único para evitar duplicidade de mesma missão no mesmo dia (opcional, mas bom pra performance de busca)
-- CREATE UNIQUE INDEX idx_daily_missions_user_date_type ON user_daily_missions(user_id, reference_date, mission_type);
-- Comentei pois pode ter 2 missões do mesmo tipo (ex: Complete 1 desafio, Complete 5 desafios)

-- Índice para busca rápida de missões do dia
CREATE INDEX IF NOT EXISTS idx_missions_user_date ON user_daily_missions(user_id, reference_date);

COMMENT ON TABLE user_daily_missions IS 'Armazena as missões diárias geradas para cada usuário';
