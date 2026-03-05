-- ============================================
-- CREATE TABLE: clinical_journeys
-- Jornadas Clínicas Longitudinais (12 sessões)
-- ============================================
-- Created: 2026-03-04
-- Purpose: Armazenar jornadas terapêuticas estruturadas
-- Reference: /Orquestrar casos clinicos/outputs/modulo-3/blueprints/

CREATE TABLE IF NOT EXISTS clinical_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  title TEXT NOT NULL,
  disorder_category TEXT NOT NULL,
  primary_diagnosis TEXT NOT NULL,
  comorbidities TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Dificuldade
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('basic', 'intermediate', 'advanced')),

  -- Perfil do Cliente (JSONB para flexibilidade)
  client_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Estrutura esperada:
  -- {
  --   "name": "Nome",
  --   "age": 32,
  --   "occupation": "Profissão",
  --   "background": "Histórico",
  --   "core_beliefs": ["crença 1", "crença 2"],
  --   "main_complaint": "Queixa principal",
  --   "treatment_goals": ["objetivo 1", "objetivo 2"]
  -- }

  -- Estrutura da Jornada (JSONB)
  journey_structure JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Estrutura esperada:
  -- {
  --   "total_sessions": 12,
  --   "therapy_approach": "TCC",
  --   "expected_trajectory": "Descrição da evolução esperada",
  --   "challenge_points": [3, 6, 9]
  -- }

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),

  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Índices para busca rápida
  UNIQUE(title)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_clinical_journeys_status ON clinical_journeys(status);
CREATE INDEX idx_clinical_journeys_disorder ON clinical_journeys(disorder_category);
CREATE INDEX idx_clinical_journeys_difficulty ON clinical_journeys(difficulty_level);
CREATE INDEX idx_clinical_journeys_created ON clinical_journeys(created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================
-- Habilitar RLS
ALTER TABLE clinical_journeys ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer um (anon + authenticated) pode LER jornadas ativas
CREATE POLICY "rls_clinical_journeys_readonly" ON clinical_journeys
  FOR SELECT
  USING (status = 'active');

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
-- Anon role pode ler (RLS vai garantir apenas active)
GRANT SELECT ON clinical_journeys TO anon;

-- Authenticated pode ler
GRANT SELECT ON clinical_journeys TO authenticated;

-- Service role pode fazer tudo (admin)
GRANT ALL PRIVILEGES ON clinical_journeys TO service_role;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- Se chegou aqui: ✅ Tabela criada com sucesso
-- Próximo passo: Importar dados via 18-import-clinical-journeys-data.sql
