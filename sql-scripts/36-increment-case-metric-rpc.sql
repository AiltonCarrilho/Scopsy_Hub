-- ========================================
-- RPC: increment_case_metric
-- Incrementa times_correct ou times_incorrect em uma única query
-- Elimina o padrão N+1 (SELECT + UPDATE) para métricas de caso
-- ========================================

CREATE OR REPLACE FUNCTION increment_case_metric(p_case_id UUID, p_column TEXT)
RETURNS VOID AS $$
BEGIN
  IF p_column = 'times_correct' THEN
    UPDATE cases SET times_correct = COALESCE(times_correct, 0) + 1 WHERE id = p_case_id;
  ELSIF p_column = 'times_incorrect' THEN
    UPDATE cases SET times_incorrect = COALESCE(times_incorrect, 0) + 1 WHERE id = p_case_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir chamada pelo anon (já protegido por RLS na rota)
GRANT EXECUTE ON FUNCTION increment_case_metric(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION increment_case_metric(UUID, TEXT) TO authenticated;
