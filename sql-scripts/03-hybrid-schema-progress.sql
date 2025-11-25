-- ========================================
-- SCOPSY - HYBRID SCHEMA - PROGRESSO E GAMIFICAÇÃO
-- Exatamente como seu plano original
-- ========================================

-- USER_PROGRESS (igual seu schema)
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assistant_type TEXT NOT NULL CHECK (assistant_type IN ('case', 'diagnostic', 'journey')),
  
  -- Métricas gerais
  total_cases INT DEFAULT 0,
  total_sessions INT DEFAULT 0,
  total_time_minutes INT DEFAULT 0,
  
  -- Acurácia
  correct_diagnoses INT DEFAULT 0,
  total_diagnoses INT DEFAULT 0,
  accuracy_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_diagnoses > 0 THEN (correct_diagnoses::DECIMAL / total_diagnoses * 100)
      ELSE 0 
    END
  ) STORED,
  
  -- Gamificação
  xp_points INT DEFAULT 0,
  level INT DEFAULT 1,
  streak_days INT DEFAULT 0,
  last_activity_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, assistant_type)
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_level ON user_progress(level DESC);

-- JOURNEY_SESSIONS (igual seu schema)
CREATE TABLE IF NOT EXISTS journey_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  session_number INT NOT NULL CHECK (session_number BETWEEN 1 AND 12),
  session_phase TEXT CHECK (session_phase IN (
    'psychoeducation',
    'formulation', 
    'intervention',
    'exposure',
    'relapse_prevention',
    'termination'
  )),
  
  patient_improvement_score INT CHECK (patient_improvement_score BETWEEN 0 AND 100),
  patient_symptoms_change TEXT,
  
  therapist_performance_score INT CHECK (therapist_performance_score BETWEEN 0 AND 100),
  therapist_feedback TEXT,
  
  techniques_used TEXT[],
  
  session_duration_minutes INT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journey_conversation ON journey_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_journey_user ON journey_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_number ON journey_sessions(session_number);

-- USER_ACHIEVEMENTS (igual seu schema)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_tier TEXT CHECK (badge_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, badge_type)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_earned ON user_achievements(earned_at DESC);

-- SESSIONS (igual seu schema)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(id),
  
  selected_level TEXT,
  selected_category TEXT,
  session_mode TEXT,
  
  target_cases INT,
  
  cases_completed INT DEFAULT 0,
  cases_correct INT DEFAULT 0,
  final_streak INT DEFAULT 0,
  
  xp_earned INT DEFAULT 0,
  achievements_unlocked JSONB DEFAULT '[]'::jsonb,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  total_duration_seconds INT,
  
  completed BOOLEAN DEFAULT FALSE,
  abandoned BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(user_id, completed, started_at DESC) 
  WHERE completed = FALSE;