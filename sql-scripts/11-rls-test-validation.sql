-- ========================================
-- SCOPSY - RLS TEST VALIDATION SUITE
-- Testa isolamento de dados por usuário
-- ========================================

-- ========================================
-- PRÉ-REQUISITOS
-- ========================================
-- Este script assume:
-- 1. RLS está ativado nas 9 tabelas (11-rls-hybrid-implementation.sql aplicado)
-- 2. Você tem 2 usuários de teste: user_id = 1 e user_id = 2
-- 3. Supabase JWT tokens para ambos os usuários

-- ========================================
-- SETUP: Inserir dados de teste (como ADMIN)
-- ========================================

-- Usuário 1 - progresso
INSERT INTO user_progress (user_id, assistant_type, total_cases, xp_points)
VALUES (1, 'case', 5, 100)
ON CONFLICT DO NOTHING;

-- Usuário 2 - progresso
INSERT INTO user_progress (user_id, assistant_type, total_cases, xp_points)
VALUES (2, 'case', 3, 50)
ON CONFLICT DO NOTHING;

-- Usuário 1 - achievements
INSERT INTO user_achievements (user_id, badge_type, badge_name, badge_tier)
VALUES (1, 'combo_5', 'Combo Master', 'gold')
ON CONFLICT DO NOTHING;

-- Usuário 2 - achievements (diferente)
INSERT INTO user_achievements (user_id, badge_type, badge_name, badge_tier)
VALUES (2, 'first_case', 'First Steps', 'bronze')
ON CONFLICT DO NOTHING;

-- ========================================
-- TESTE 1: Isolamento de USER_PROGRESS
-- ========================================
-- Esperado (como user_id=1): Vê 1 linha (sua própria)
-- Esperado (como user_id=2): Vê 1 linha (sua própria)
-- Esperado (anônimo): Erro ou 0 linhas

/*
-- Como User 1 (simular com JWT token de user_id=1)
SELECT id, user_id, total_cases, xp_points FROM user_progress;
-- RESULTADO ESPERADO: 1 linha com user_id=1

-- Como User 2 (simular com JWT token de user_id=2)
SELECT id, user_id, total_cases, xp_points FROM user_progress;
-- RESULTADO ESPERADO: 1 linha com user_id=2

-- Como anônimo (sem JWT)
SELECT id, user_id, total_cases, xp_points FROM user_progress;
-- RESULTADO ESPERADO: ERRO ou 0 linhas
*/

-- ========================================
-- TESTE 2: Isolamento de USER_ACHIEVEMENTS
-- ========================================
-- Verificar que cada usuário só vê seus próprios badges

/*
-- Como User 1
SELECT user_id, badge_name, badge_tier FROM user_achievements;
-- RESULTADO ESPERADO: 1 linha (badge 'Combo Master')

-- Como User 2
SELECT user_id, badge_name, badge_tier FROM user_achievements;
-- RESULTADO ESPERADO: 1 linha (badge 'First Steps')
*/

-- ========================================
-- TESTE 3: Proteção contra UPDATE não-autorizado
-- ========================================
-- User 2 tenta editar dados de User 1

/*
-- Como User 2, tentar atualizar progresso de User 1
UPDATE user_progress
SET xp_points = 9999
WHERE user_id = 1;
-- RESULTADO ESPERADO: 0 linhas atualizadas (RLS nega)

-- Como User 1, atualizar seu próprio progresso (deve funcionar)
UPDATE user_progress
SET xp_points = 200
WHERE user_id = 1;
-- RESULTADO ESPERADO: 1 linha atualizada
*/

-- ========================================
-- TESTE 4: Proteção contra DELETE não-autorizado
-- ========================================

/*
-- Como User 2, tentar deletar badge de User 1
DELETE FROM user_achievements
WHERE user_id = 1;
-- RESULTADO ESPERADO: 0 linhas deletadas (RLS nega)

-- Como User 1, deletar seu próprio badge (deve funcionar)
DELETE FROM user_achievements
WHERE user_id = 1 AND badge_type = 'combo_5';
-- RESULTADO ESPERADO: 1 linha deletada
*/

-- ========================================
-- TESTE 5: Isolamento de CHAT_MESSAGES (indireto)
-- ========================================

/*
-- Setup: Criar conversas de teste
INSERT INTO chat_conversations (user_id, assistant_type, thread_id)
VALUES
  (1, 'case', 'thread-user1-123'),
  (2, 'case', 'thread-user2-456');

-- Inserir mensagens
INSERT INTO chat_messages (conversation_id, role, content)
SELECT id, 'user', 'Minha mensagem'
FROM chat_conversations
WHERE user_id = 1;

-- Como User 1, ler suas mensagens
SELECT m.id, m.role, m.content
FROM chat_messages m
JOIN chat_conversations c ON m.conversation_id = c.id
WHERE c.user_id = 1;
-- RESULTADO ESPERADO: Vê suas mensagens

-- Como User 2, tentar ler mensagens de User 1
SELECT m.id, m.role, m.content
FROM chat_messages m
JOIN chat_conversations c ON m.conversation_id = c.id
WHERE c.user_id = 1;
-- RESULTADO ESPERADO: 0 linhas (RLS nega acesso)
*/

-- ========================================
-- TESTE 6: CASES é pública (read-only)
-- ========================================

/*
-- Setup: Inserir caso de teste como ADMIN
INSERT INTO cases (title, description, case_status)
VALUES ('Test Case', 'Descrição teste', 'published');

-- Como User 1, ler casos (deve funcionar)
SELECT id, title FROM cases LIMIT 1;
-- RESULTADO ESPERADO: Vê os casos

-- Como User 1, tentar inserir novo caso (deve falhar)
INSERT INTO cases (title, description, case_status)
VALUES ('Meu caso', 'Descrição', 'draft');
-- RESULTADO ESPERADO: ERRO (RLS nega INSERT)

-- Como User 1, tentar editar caso (deve falhar)
UPDATE cases SET title = 'Editado' WHERE id = 1;
-- RESULTADO ESPERADO: ERRO ou 0 linhas (RLS nega UPDATE)
*/

-- ========================================
-- TESTE 7: BILLING_HISTORY super isolado
-- ========================================

/*
-- Setup (como ADMIN)
INSERT INTO billing_history (user_id, event_type, amount, subscription_tier)
VALUES
  (1, 'purchase', 29.90, 'basic'),
  (2, 'purchase', 69.90, 'pro');

-- Como User 1
SELECT user_id, event_type, amount FROM billing_history;
-- RESULTADO ESPERADO: 1 linha (seu próprio pagamento)

-- Como User 2
SELECT user_id, event_type, amount FROM billing_history;
-- RESULTADO ESPERADO: 1 linha (seu próprio pagamento)
*/

-- ========================================
-- CHECKLIST DE VALIDAÇÃO
-- ========================================

-- ✓ Cada usuário vê APENAS suas próprias linhas
-- ✓ Usuários não conseguem ler dados de outros
-- ✓ Usuários não conseguem atualizar dados de outros
-- ✓ Usuários não conseguem deletar dados de outros
-- ✓ CASES é pública para leitura (somente)
-- ✓ Usuários anônimos (sem JWT) são bloqueados
-- ✓ Admin pode operar livremente (contornar RLS com ALTER ROLE)

-- ========================================
-- SCRIPT DE VALIDAÇÃO AUTOMÁTICA
-- ========================================

-- Verificar RLS status
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'user_progress',
  'journey_sessions',
  'user_achievements',
  'sessions',
  'chat_conversations',
  'chat_messages',
  'user_stats',
  'case_reviews',
  'billing_history',
  'cases'
)
ORDER BY tablename;

-- Esperado resultado:
-- tablename              | rls_enabled | policy_count
-- ----------------------+-------------+--------------
-- billing_history       | t           | 1
-- case_reviews          | t           | 1
-- cases                 | t           | 3
-- chat_conversations    | t           | 1
-- chat_messages         | t           | 1
-- journey_sessions      | t           | 1
-- sessions              | t           | 1
-- user_achievements     | t           | 1
-- user_progress         | t           | 1
-- user_stats            | t           | 1

-- ========================================
-- LIMPEZA (remover dados de teste)
-- ========================================

/*
DELETE FROM user_achievements WHERE user_id IN (1, 2);
DELETE FROM user_progress WHERE user_id IN (1, 2);
DELETE FROM chat_messages WHERE conversation_id IN (
  SELECT id FROM chat_conversations WHERE user_id IN (1, 2)
);
DELETE FROM chat_conversations WHERE user_id IN (1, 2);
DELETE FROM billing_history WHERE user_id IN (1, 2);
*/
