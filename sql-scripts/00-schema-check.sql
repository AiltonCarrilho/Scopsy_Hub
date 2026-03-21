-- Schema check: What are the ACTUAL constraints on journey_sessions?

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'journey_sessions'
ORDER BY ordinal_position;
