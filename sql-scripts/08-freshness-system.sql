-- =============================================
-- FASE 5: SISTEMA DE FRESCOR CLÍNICO
-- =============================================
-- Adiciona sistema de multiplicador de frescor
-- que incentiva prática regular sem punir pausas

-- Adicionar colunas de frescor
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS freshness_multiplier DECIMAL(3,2) DEFAULT 1.00,
ADD COLUMN IF NOT EXISTS last_practice_date DATE;

-- Comentários para documentação
COMMENT ON COLUMN users.freshness_multiplier IS 'Multiplicador de cognits baseado em atividade recente (0.40 a 1.00)';
COMMENT ON COLUMN users.last_practice_date IS 'Última data de prática (qualquer atividade que gere cognits)';

-- Índice para queries de frescor
CREATE INDEX IF NOT EXISTS idx_users_last_practice ON users(last_practice_date);

-- Atualizar usuários existentes com data de hoje (para não penalizar)
UPDATE users 
SET last_practice_date = CURRENT_DATE,
    freshness_multiplier = 1.00
WHERE last_practice_date IS NULL;
