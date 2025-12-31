-- ═══════════════════════════════════════════════════════════════════════
-- TABELA: case_reviews
-- Armazena resultados de revisões automáticas de casos clínicos
-- Data: 2024-12-31
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS case_reviews (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,

  -- Tipo e classificação
  module_type TEXT NOT NULL,  -- 'micromoment' | 'diagnostic' | 'conceptualization'
  classificacao TEXT NOT NULL,  -- 'EXPERT' | 'ADEQUADA' | 'QUESTIONAVEL' | 'INADEQUADA'

  -- Scores
  score_total INTEGER NOT NULL CHECK (score_total >= 0 AND score_total <= 100),

  -- Resultado
  aprovado BOOLEAN NOT NULL DEFAULT false,
  requer_revisao_humana BOOLEAN NOT NULL DEFAULT false,
  acao_recomendada TEXT NOT NULL,  -- 'APROVAR' | 'APROVAR_COM_LOG' | 'REVISAO_HUMANA' | 'REPROVAR'

  -- Problemas identificados
  problemas_criticos TEXT[] DEFAULT '{}',
  problemas_moderados TEXT[] DEFAULT '{}',

  -- Sugestão de correção
  sugestao_correcao JSONB,

  -- Dados completos da revisão (JSON)
  review_data JSONB NOT NULL,

  -- Metadados
  reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reviewed_by TEXT DEFAULT 'gpt-4o',
  tokens_used INTEGER,

  -- Revisão humana (se aplicável)
  human_reviewed_at TIMESTAMP WITH TIME ZONE,
  human_reviewer_id BIGINT,
  human_decision TEXT,  -- 'CONCORDO' | 'DISCORDO' | 'MODIFICADO'
  human_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(case_id)  -- Um caso só pode ter uma revisão ativa
);

-- ═══════════════════════════════════════════════════════════════════════
-- ÍNDICES
-- ═══════════════════════════════════════════════════════════════════════

-- Busca rápida por classificação
CREATE INDEX idx_case_reviews_classificacao ON case_reviews(classificacao);

-- Fila de revisão humana
CREATE INDEX idx_case_reviews_human_queue ON case_reviews(requer_revisao_humana, human_reviewed_at)
WHERE requer_revisao_humana = true AND human_reviewed_at IS NULL;

-- Casos aprovados
CREATE INDEX idx_case_reviews_aprovados ON case_reviews(aprovado, score_total);

-- Busca por módulo
CREATE INDEX idx_case_reviews_module ON case_reviews(module_type, classificacao);

-- ═══════════════════════════════════════════════════════════════════════
-- VIEWS ÚTEIS
-- ═══════════════════════════════════════════════════════════════════════

-- Fila de revisão humana (casos que precisam de atenção)
CREATE OR REPLACE VIEW human_review_queue AS
SELECT
  cr.id,
  cr.case_id,
  c.disorder,
  cr.module_type,
  cr.score_total,
  cr.classificacao,
  cr.problemas_criticos,
  cr.sugestao_correcao,
  cr.reviewed_at
FROM case_reviews cr
JOIN cases c ON c.id = cr.case_id
WHERE cr.requer_revisao_humana = true
  AND cr.human_reviewed_at IS NULL
ORDER BY cr.score_total ASC, cr.reviewed_at ASC;

-- Estatísticas de qualidade por módulo
CREATE OR REPLACE VIEW quality_stats_by_module AS
SELECT
  module_type,
  COUNT(*) as total_cases,
  AVG(score_total) as avg_score,
  MIN(score_total) as min_score,
  MAX(score_total) as max_score,
  COUNT(*) FILTER (WHERE aprovado = true) as aprovados,
  COUNT(*) FILTER (WHERE requer_revisao_humana = true) as revisao_humana,
  COUNT(*) FILTER (WHERE classificacao = 'EXPERT') as expert,
  COUNT(*) FILTER (WHERE classificacao = 'ADEQUADA') as adequada,
  COUNT(*) FILTER (WHERE classificacao = 'QUESTIONAVEL') as questionavel,
  COUNT(*) FILTER (WHERE classificacao = 'INADEQUADA') as inadequada
FROM case_reviews
GROUP BY module_type;

-- Casos críticos (score baixo)
CREATE OR REPLACE VIEW critical_cases AS
SELECT
  cr.case_id,
  c.disorder,
  c.moment_type,
  cr.score_total,
  cr.problemas_criticos,
  cr.sugestao_correcao->>'justificativa' as sugestao,
  cr.reviewed_at
FROM case_reviews cr
JOIN cases c ON c.id = cr.case_id
WHERE cr.score_total < 50
ORDER BY cr.score_total ASC;

-- ═══════════════════════════════════════════════════════════════════════
-- FUNÇÕES
-- ═══════════════════════════════════════════════════════════════════════

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_case_reviews_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER case_reviews_updated_at
  BEFORE UPDATE ON case_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_case_reviews_timestamp();

-- ═══════════════════════════════════════════════════════════════════════
-- COMENTÁRIOS
-- ═══════════════════════════════════════════════════════════════════════

COMMENT ON TABLE case_reviews IS 'Armazena resultados de revisões automáticas (GPT) e humanas de casos clínicos';
COMMENT ON COLUMN case_reviews.score_total IS 'Score de 0-100 atribuído pelo revisor GPT';
COMMENT ON COLUMN case_reviews.requer_revisao_humana IS 'true se caso precisa ser revisado por supervisora';
COMMENT ON COLUMN case_reviews.review_data IS 'JSON completo com todos os detalhes da revisão';
COMMENT ON COLUMN case_reviews.sugestao_correcao IS 'Sugestões de como corrigir problemas identificados';
