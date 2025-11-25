-- ========================================
-- SCOPSY - HYBRID SCHEMA - TABELA CASES
-- Compatível com plano atual + preparado para futuro
-- ========================================

-- Criar tabela cases (híbrida)
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ✅ COMPATIBILIDADE com case_library (você pode usar igual antes)
  case_title TEXT,
  disorder TEXT NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('basic', 'intermediate', 'advanced')),
  case_content JSONB NOT NULL,  -- JSON completo como antes
  
  -- ✅ NOVOS campos estruturados (opcionais agora, úteis depois)
  level TEXT CHECK (level IN ('iniciante', 'intermediário', 'avançado')),
  category TEXT,  -- 'ansiedade', 'humor', 'trauma', etc
  
  vignette TEXT,  -- texto da vinheta
  correct_diagnosis TEXT,
  diagnostic_code TEXT,
  
  criteria_present JSONB DEFAULT '[]'::jsonb,
  differential_diagnoses JSONB DEFAULT '[]'::jsonb,
  educational_focus TEXT,
  
  -- ✅ VALIDAÇÃO automática (ativa depois, não atrapalha agora)
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'bad', 'needs_review', 'archived')),
  quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 5),
  
  -- ✅ MÉTRICAS de uso
  times_used INT DEFAULT 0,
  times_correct INT DEFAULT 0,
  times_incorrect INT DEFAULT 0,
  avg_time_seconds DECIMAL(6,2),
  
  reported_issues INT DEFAULT 0,
  
  -- ✅ METADADOS
  created_by TEXT DEFAULT 'case_generator',
  is_seed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cases_active_selection 
  ON cases(status, difficulty_level, disorder, quality_score DESC, times_used ASC) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_cases_last_used 
  ON cases(updated_at ASC NULLS FIRST) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_cases_pending 
  ON cases(times_used, created_at) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_cases_disorder 
  ON cases(disorder, difficulty_level) 
  WHERE status = 'active';

-- Comentários explicativos
COMMENT ON TABLE cases IS 'Biblioteca de casos clínicos com validação automática de qualidade';
COMMENT ON COLUMN cases.case_content IS 'JSON completo do caso (compatibilidade com código legado)';
COMMENT ON COLUMN cases.status IS 'pending=aguardando validação, active=validado, bad=rejeitado';
COMMENT ON COLUMN cases.quality_score IS 'Score 0-5 calculado após 5+ usos';