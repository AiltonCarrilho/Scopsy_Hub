-- ============================================
-- ADICIONAR COLUNA archived_at
-- ============================================
-- Esta migração adiciona a coluna archived_at para permitir
-- arquivar progressos antigos ao reiniciar jornadas

-- Adicionar coluna archived_at à tabela user_journey_progress
ALTER TABLE user_journey_progress
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- Criar índice para melhorar performance de queries que filtram por archived_at
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_archived_at
ON user_journey_progress(archived_at);

-- Comentário na coluna
COMMENT ON COLUMN user_journey_progress.archived_at IS
'Data em que o progresso foi arquivado (ao reiniciar jornada). NULL = progresso ativo';

-- Log de execução
DO $$
BEGIN
    RAISE NOTICE 'Coluna archived_at adicionada com sucesso!';
    RAISE NOTICE 'Índice criado para otimizar queries';
END $$;
