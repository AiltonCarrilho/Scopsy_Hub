-- ==============================================================================
-- MIGRATION 06: BADGES SYSTEM
-- Cria tabelas para medalhas e conquistas
-- ==============================================================================

-- 1. Definições de Medalhas
CREATE TABLE IF NOT EXISTS badges (
    slug VARCHAR(50) PRIMARY KEY, -- Ex: 'streak-7', 'first-diagnosis'
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon_url VARCHAR(255), -- Pode ser URL ou nome de asset local (ex: 'badge-fire')
    category VARCHAR(50) DEFAULT 'achievement', -- 'streak', 'learning', 'social'
    xp_bonus INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Medalhas do Usuário
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_slug VARCHAR(50) NOT NULL REFERENCES badges(slug) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_seen BOOLEAN DEFAULT FALSE, -- Para notificação "Nova Medalha!"
    UNIQUE(user_id, badge_slug) -- Só pode ganhar uma vez cada medalha
);

-- 3. Inserir Badges Iniciais (Seed)
INSERT INTO badges (slug, name, description, icon_url, category, xp_bonus) VALUES
('pioneer', 'Pioneiro', 'Criou a conta na fase Beta do Scopsy.', 'badge-flag', 'achievement', 100),
('first-login', 'Primeiros Passos', 'Realizou o primeiro login na plataforma.', 'badge-footprint', 'achievement', 50),
('streak-3', 'Aquecimento', 'Manteve uma sequência de 3 dias de atividades.', 'badge-fire-3', 'streak', 100),
('streak-7', 'Em Chamas', 'Manteve uma sequência de 7 dias de atividades.', 'badge-fire-7', 'streak', 300),
('streak-30', 'Imparável', 'Manteve uma sequência de 30 dias. Incrível!', 'badge-fire-30', 'streak', 1000),
('analyst-novice', 'Analista Iniciante', 'Analisou 5 Casos Clínicos.', 'badge-magnifier-bronze', 'learning', 150),
('analyst-expert', 'Analista Expert', 'Analisou 50 Casos Clínicos.', 'badge-magnifier-gold', 'learning', 1000),
('sharp-eye', 'Olho Clínico', 'Acertou 10 Diagnósticos de primeira.', 'badge-eye', 'learning', 500)
ON CONFLICT (slug) DO NOTHING;
