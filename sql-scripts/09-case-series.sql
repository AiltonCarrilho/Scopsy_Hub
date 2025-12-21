-- ============================================
-- SÉRIES DE CASOS (Modelo Judith Beck)
-- Permite explorar nuances do mesmo cliente em diferentes momentos
-- ============================================

-- 1. Criar tabela de séries
CREATE TABLE IF NOT EXISTS case_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  series_name TEXT NOT NULL, -- Ex: "Marcos - TAG: Do Acolhimento à Alta"
  series_slug TEXT UNIQUE NOT NULL, -- Ex: "marcos_tag_001"

  -- Cliente
  client_name TEXT NOT NULL, -- Ex: "Marcos Silva"
  client_age INT, -- Ex: 35
  client_gender TEXT, -- Ex: "masculino"

  -- Diagnóstico
  disorder TEXT NOT NULL, -- Ex: "Transtorno de Ansiedade Generalizada"
  disorder_category TEXT, -- Ex: "anxiety"

  -- Estrutura
  total_episodes INT NOT NULL DEFAULT 3, -- Quantos episódios tem a série
  difficulty_level TEXT DEFAULT 'intermediate', -- basic, intermediate, advanced

  -- Descrição
  description TEXT, -- "Acompanhe Marcos ao longo de 8 sessões de TCC para TAG..."
  learning_goals TEXT, -- "Observar evolução da aliança, aplicação de técnicas..."

  -- Metadados
  status TEXT DEFAULT 'active', -- active, draft, archived
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'system'
);

-- 2. Modificar tabela cases para vincular a séries
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES case_series(id) ON DELETE SET NULL;

ALTER TABLE cases
ADD COLUMN IF NOT EXISTS episode_number INT;

ALTER TABLE cases
ADD COLUMN IF NOT EXISTS episode_title TEXT; -- Ex: "Sessão 2: Primeira Resistência"

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_case_series_status ON case_series(status);
CREATE INDEX IF NOT EXISTS idx_case_series_category ON case_series(disorder_category);
CREATE INDEX IF NOT EXISTS idx_case_series_difficulty ON case_series(difficulty_level);

CREATE INDEX IF NOT EXISTS idx_cases_series_id ON cases(series_id);
CREATE INDEX IF NOT EXISTS idx_cases_episode_number ON cases(series_id, episode_number);

-- 4. Criar view para facilitar consultas
CREATE OR REPLACE VIEW v_case_series_with_episodes AS
SELECT
  cs.id as series_id,
  cs.series_name,
  cs.series_slug,
  cs.client_name,
  cs.client_age,
  cs.disorder,
  cs.disorder_category,
  cs.total_episodes,
  cs.difficulty_level,
  cs.description,
  cs.learning_goals,
  cs.status,
  COUNT(c.id) as episodes_created,
  json_agg(
    json_build_object(
      'episode_number', c.episode_number,
      'episode_title', c.episode_title,
      'case_id', c.id,
      'moment_type', c.moment_type,
      'times_used', c.times_used
    ) ORDER BY c.episode_number
  ) FILTER (WHERE c.id IS NOT NULL) as episodes
FROM case_series cs
LEFT JOIN cases c ON c.series_id = cs.id AND c.status = 'active'
WHERE cs.status = 'active'
GROUP BY cs.id;

-- 5. Comentários para documentação
COMMENT ON TABLE case_series IS 'Séries de casos clínicos que permitem acompanhar evolução do mesmo cliente';
COMMENT ON COLUMN case_series.series_slug IS 'Identificador único amigável para URLs';
COMMENT ON COLUMN case_series.total_episodes IS 'Número planejado de episódios na série';
COMMENT ON COLUMN case_series.learning_goals IS 'Objetivos pedagógicos da série';

COMMENT ON COLUMN cases.series_id IS 'Vínculo com série (NULL = caso avulso)';
COMMENT ON COLUMN cases.episode_number IS 'Ordem do episódio na série (1, 2, 3...)';
COMMENT ON COLUMN cases.episode_title IS 'Título descritivo do episódio';

-- ============================================
-- FIM DO SCRIPT
-- ============================================
