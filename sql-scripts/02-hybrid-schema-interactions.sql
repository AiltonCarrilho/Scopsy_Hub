-- ========================================
-- SCOPSY - HYBRID SCHEMA - INTERAÇÕES
-- Compatível com diagnostic_attempts + preparado para futuro
-- ========================================

CREATE TABLE IF NOT EXISTS user_case_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ✅ RELACIONAMENTOS
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,  -- ← NOVO: rastreia caso específico
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE SET NULL,
  session_id UUID,
  
  -- ✅ COMPATIBILIDADE com diagnostic_attempts
  presented_symptoms TEXT,  -- compatível com código atual
  correct_diagnosis TEXT,
  user_diagnosis TEXT,      -- resposta específica para diagnostic
  
  -- ✅ CAMPO GENÉRICO (para Case, Journey, Diagnostic)
  user_answer TEXT,         -- resposta genérica
  user_justification TEXT,  -- raciocínio do usuário
  
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INT CHECK (time_spent_seconds >= 0),
  
  -- ✅ METADADOS (igual seu schema atual)
  difficulty_level TEXT CHECK (difficulty_level IN ('basic', 'intermediate', 'advanced')),
  disorder_category TEXT,
  user_level TEXT,  -- nível do usuário naquele momento
  sequence_in_session INT,
  
  -- ✅ NOVOS campos opcionais (para futuro)
  hints_used INT DEFAULT 0,
  deepdive_requested BOOLEAN DEFAULT FALSE,
  
  user_rating INT CHECK (user_rating >= 1 AND user_rating <= 5),
  feedback_text TEXT,
  
  reported_issue BOOLEAN DEFAULT FALSE,
  issue_type TEXT,
  issue_description TEXT,
  
  -- ✅ ANALYTICS
  came_from_cache BOOLEAN DEFAULT FALSE,
  case_generation_time_ms INT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_interactions_user 
  ON user_case_interactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_interactions_case 
  ON user_case_interactions(case_id, is_correct);

CREATE INDEX IF NOT EXISTS idx_interactions_user_cases 
  ON user_case_interactions(user_id, case_id);

CREATE INDEX IF NOT EXISTS idx_interactions_session 
  ON user_case_interactions(session_id, sequence_in_session);

CREATE INDEX IF NOT EXISTS idx_interactions_reported 
  ON user_case_interactions(case_id, reported_issue) 
  WHERE reported_issue = TRUE;

-- Comentários
COMMENT ON TABLE user_case_interactions IS 'Histórico de interações com casos (todos módulos)';
COMMENT ON COLUMN user_case_interactions.case_id IS 'Referência ao caso específico (permite revisão espaçada)';
COMMENT ON COLUMN user_case_interactions.user_diagnosis IS 'Campo específico para Diagnostic Training';
COMMENT ON COLUMN user_case_interactions.user_answer IS 'Campo genérico para qualquer resposta';