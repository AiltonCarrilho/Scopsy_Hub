-- ========================================
-- SCOPSY - HYBRID SCHEMA - VIEWS
-- ========================================

-- View: Dashboard do usuário
CREATE OR REPLACE VIEW user_dashboard AS
SELECT 
  u.id AS user_id,
  u.name,
  u.email,
  u.plan,
  
  -- Progresso Case
  up_case.total_cases,
  up_case.xp_points AS case_xp,
  up_case.level AS case_level,
  
  -- Progresso Diagnostic
  up_diag.total_diagnoses,
  up_diag.accuracy_rate,
  up_diag.xp_points AS diagnostic_xp,
  
  -- Progresso Journey
  up_journey.total_sessions AS journey_sessions,
  up_journey.xp_points AS journey_xp,
  
  -- Total
  COALESCE(up_case.xp_points, 0) + 
  COALESCE(up_diag.xp_points, 0) + 
  COALESCE(up_journey.xp_points, 0) AS total_xp,
  
  -- Achievements
  (SELECT COUNT(*) FROM user_achievements WHERE user_id = u.id) AS total_badges
  
FROM users u
LEFT JOIN user_progress up_case ON u.id = up_case.user_id AND up_case.assistant_type = 'case'
LEFT JOIN user_progress up_diag ON u.id = up_diag.user_id AND up_diag.assistant_type = 'diagnostic'
LEFT JOIN user_progress up_journey ON u.id = up_journey.user_id AND up_journey.assistant_type = 'journey';

-- View: Stats por categoria
CREATE OR REPLACE VIEW diagnostic_stats_by_category AS
SELECT 
  user_id,
  disorder_category,
  COUNT(*) AS total_attempts,
  SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct_attempts,
  ROUND(AVG(CASE WHEN is_correct THEN 100 ELSE 0 END), 2) AS accuracy_rate,
  AVG(time_spent_seconds) AS avg_time_seconds
FROM user_case_interactions
WHERE disorder_category IS NOT NULL
GROUP BY user_id, disorder_category;

-- View: Qualidade dos casos
CREATE OR REPLACE VIEW case_quality_summary AS
SELECT 
  c.id,
  c.disorder,
  c.difficulty_level,
  c.status,
  c.quality_score,
  c.times_used,
  c.times_correct,
  c.times_incorrect,
  CASE 
    WHEN c.times_used > 0 
    THEN ROUND(c.times_correct::DECIMAL / c.times_used, 2)
    ELSE NULL 
  END AS accuracy_rate,
  c.avg_time_seconds,
  c.reported_issues,
  c.created_at,
  c.updated_at,
  CASE 
    WHEN c.times_used >= 10 AND c.quality_score >= 4.5 THEN 'excelente'
    WHEN c.times_used >= 5 AND c.quality_score >= 4.0 THEN 'bom'
    WHEN c.times_used >= 5 AND c.quality_score >= 3.5 THEN 'adequado'
    WHEN c.times_used >= 5 AND c.quality_score < 3.5 THEN 'ruim'
    ELSE 'em_validacao'
  END AS quality_category
FROM cases c;