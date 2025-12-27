-- ================================================
-- Script para Ativar Premium Manualmente
-- Email: ailtoncarrilhopsi@gmail.com
-- ================================================

-- 1. VERIFICAR USUÁRIO ATUAL
SELECT
  id,
  email,
  name,
  plan,
  subscription_status,
  trial_ends_at,
  created_at,
  updated_at
FROM users
WHERE email = 'ailtoncarrilhopsi@gmail.com';

-- 2. ATUALIZAR PARA PREMIUM
UPDATE users
SET
  plan = 'premium',
  subscription_status = 'active',
  subscription_started_at = NOW(),
  trial_ends_at = NULL,
  updated_at = NOW()
WHERE email = 'ailtoncarrilhopsi@gmail.com';

-- 3. VERIFICAR ATUALIZAÇÃO
SELECT
  id,
  email,
  name,
  plan,
  subscription_status,
  subscription_started_at,
  updated_at
FROM users
WHERE email = 'ailtoncarrilhopsi@gmail.com';
