-- ==============================================================================
-- MASTER MIGRATION: GAMIFICATION COMPLETE (Streaks, Missions, Badges)
-- Nome solicitado: Badges & User Stats Validation
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STREAKS & ACTIVITY LOG (Fase 3)
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longest_streak INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    activity_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_activity_date ON user_activity_log(user_id, activity_date);

-- 2. DAILY MISSIONS (Fase 3.2)
CREATE TABLE IF NOT EXISTS user_daily_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mission_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    target INT NOT NULL DEFAULT 1,
    progress INT NOT NULL DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    reward_cognits INT NOT NULL DEFAULT 10,
    reference_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. BADGES SYSTEM (Fase 4)
CREATE TABLE IF NOT EXISTS badges (
    slug VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon_url VARCHAR(255),
    category VARCHAR(50) DEFAULT 'achievement',
    xp_bonus INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_slug VARCHAR(50) NOT NULL REFERENCES badges(slug) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_seen BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, badge_slug)
);

-- Seed Badges
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
