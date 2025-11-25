-- ========================================
-- SCOPSY - HYBRID SCHEMA - FUNÇÕES ÚTEIS
-- ========================================

-- Função: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_cases_updated_at ON cases;
CREATE TRIGGER update_cases_updated_at 
  BEFORE UPDATE ON cases
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at 
  BEFORE UPDATE ON user_progress
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_conversations_updated_at ON chat_conversations;
CREATE TRIGGER update_chat_conversations_updated_at 
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Função: Calcular XP
CREATE OR REPLACE FUNCTION calculate_xp(
  p_user_id BIGINT,
  p_activity_type TEXT,
  p_is_correct BOOLEAN DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
  xp_gained INT := 0;
BEGIN
  CASE p_activity_type
    WHEN 'case_completed' THEN xp_gained := 50;
    WHEN 'diagnostic_correct' THEN xp_gained := 30;
    WHEN 'diagnostic_incorrect' THEN xp_gained := 10;
    WHEN 'journey_session' THEN xp_gained := 40;
    WHEN 'streak_bonus' THEN xp_gained := 20;
    ELSE xp_gained := 5;
  END CASE;
  
  RETURN xp_gained;
END;
$$ LANGUAGE plpgsql;

-- Função: Avaliar qualidade de caso (PREPARADA, mas não ativa ainda)
CREATE OR REPLACE FUNCTION evaluate_case_quality(p_case_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  v_metrics RECORD;
  v_quality_score DECIMAL(3,2);
  v_new_status TEXT;
BEGIN
  -- Coleta métricas
  SELECT 
    COUNT(*) as total_uses,
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0) as accuracy,
    AVG(time_spent_seconds) as avg_time,
    SUM(CASE WHEN reported_issue THEN 1 ELSE 0 END) as issues
  INTO v_metrics
  FROM user_case_interactions
  WHERE case_id = p_case_id;
  
  -- Precisa de pelo menos 5 usos
  IF v_metrics.total_uses < 5 THEN
    RETURN 'insufficient_data';
  END IF;
  
  -- Calcula score de qualidade
  v_quality_score := 0;
  
  -- Taxa de acerto ideal (50-70%)
  IF v_metrics.accuracy BETWEEN 0.50 AND 0.70 THEN
    v_quality_score := v_quality_score + 2.0;
  ELSIF v_metrics.accuracy BETWEEN 0.40 AND 0.80 THEN
    v_quality_score := v_quality_score + 1.5;
  ELSE
    v_quality_score := v_quality_score + 0.5;
  END IF;
  
  -- Tempo razoável (60-180 segundos)
  IF v_metrics.avg_time BETWEEN 60 AND 180 THEN
    v_quality_score := v_quality_score + 1.5;
  ELSIF v_metrics.avg_time BETWEEN 30 AND 300 THEN
    v_quality_score := v_quality_score + 1.0;
  ELSE
    v_quality_score := v_quality_score + 0.5;
  END IF;
  
  -- Sem problemas reportados
  IF v_metrics.issues = 0 THEN
    v_quality_score := v_quality_score + 1.0;
  END IF;
  
  -- Determina status
  IF v_quality_score >= 3.5 AND v_metrics.issues = 0 THEN
    v_new_status := 'active';
  ELSIF v_quality_score < 3.5 OR v_metrics.issues > 1 THEN
    v_new_status := 'bad';
  ELSE
    v_new_status := 'needs_review';
  END IF;
  
  -- Atualiza caso
  UPDATE cases
  SET 
    status = v_new_status,
    quality_score = v_quality_score,
    times_correct = v_metrics.total_uses * COALESCE(v_metrics.accuracy, 0),
    times_incorrect = v_metrics.total_uses * (1 - COALESCE(v_metrics.accuracy, 0)),
    avg_time_seconds = v_metrics.avg_time,
    reported_issues = v_metrics.issues,
    updated_at = NOW()
  WHERE id = p_case_id;
  
  RETURN v_new_status;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION evaluate_case_quality IS 'Avalia qualidade de caso após 5+ usos (não é chamada automaticamente no MVP)';