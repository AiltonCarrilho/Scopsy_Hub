-- AUDITORIA: Verificar tipos de user_id REAIS em producao

-- 1. Verificar plan_changes_audit
SELECT
  'plan_changes_audit' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'plan_changes_audit'
  AND column_name = 'user_id';

-- 2. Verificar user_activity_log
SELECT
  'user_activity_log' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_activity_log'
  AND column_name = 'user_id';

-- 3. Verificar todas as tabelas com user_id (sumario)
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE column_name = 'user_id'
  AND table_schema = 'public'
ORDER BY table_name;

-- 4. Contar registros em tabelas problemáticas
SELECT
  'plan_changes_audit' as table_name,
  COUNT(*) as row_count
FROM plan_changes_audit
UNION ALL
SELECT
  'user_activity_log' as table_name,
  COUNT(*) as row_count
FROM user_activity_log;
