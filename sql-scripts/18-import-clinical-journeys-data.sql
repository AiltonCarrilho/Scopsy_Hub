-- ============================================
-- IMPORT CLINICAL JOURNEYS DATA
-- De: /Orquestrar casos clinicos/outputs/modulo-3/blueprints/
-- ============================================
-- Este script importa as 19 jornadas disponíveis
-- Execute APÓS 17-create-clinical-journeys-table.sql

-- ============================================
-- 1. JORNADA TAG - PEDRO (básico)
-- ============================================
INSERT INTO clinical_journeys (
  id, title, disorder_category, primary_diagnosis,
  difficulty_level, client_profile, journey_structure, status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Jornada TAG - Pedro: Preocupação com Saúde e Desempenho',
  'anxiety',
  'Transtorno de Ansiedade Generalizada (F41.1)',
  'basic',
  '{
    "name": "Pedro Henrique Alves",
    "age": 32,
    "occupation": "Analista de sistemas",
    "background": "Casado, dois filhos. Trabalha em empresa de tecnologia há 8 anos. Sem histórico de transtornos mentais prévios.",
    "core_beliefs": ["Preciso controlar tudo para evitar desastres", "Qualquer sintoma físico indica algo grave"],
    "main_complaint": "Preocupação excessiva com saúde e desempenho no trabalho, dificuldade em relaxar, sono agitado",
    "treatment_goals": ["Reduzir preocupações diárias", "Melhorar qualidade do sono", "Aumentar confiança no desempenho profissional"]
  }'::jsonb,
  '{
    "total_sessions": 12,
    "therapy_approach": "TCC",
    "expected_trajectory": "Evolução estável e progressiva, com redução gradual de preocupações e aumento de estratégias de enfrentamento. Sem rupturas significativas.",
    "challenge_points": [3, 6, 9]
  }'::jsonb,
  'active'
) ON CONFLICT (title) DO NOTHING;

-- ============================================
-- 2. JORNADA AGORAFOBIA - MARIA (intermediária)
-- ============================================
INSERT INTO clinical_journeys (
  id, title, disorder_category, primary_diagnosis,
  difficulty_level, client_profile, journey_structure, status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'Jornada Agorafobia - Maria: Medo de Sair de Casa',
  'anxiety',
  'Transtorno de Pânico com Agorafobia (F40.01)',
  'intermediate',
  '{
    "name": "Maria da Silva Santos",
    "age": 45,
    "occupation": "Professora",
    "background": "Divorciada, dois filhos adolescentes. Evento precipitante: crise de pânico 6 meses atrás em supermercado.",
    "core_beliefs": ["Vou desmaiar se sair de casa", "Não posso estar longe de um hospital", "Perdi o controle do meu corpo"],
    "main_complaint": "Agorafobia severa, evita transporte público, precisa sempre de acompanhante, interfere no trabalho",
    "treatment_goals": ["Retomar vida normal", "Usar transporte público sozinha", "Reduzir dependência de acompanhante"]
  }'::jsonb,
  '{
    "total_sessions": 12,
    "therapy_approach": "TCC + Exposição Gradual",
    "expected_trajectory": "Progresso com pequenas recaídas entre sessões 4-5. Estabilização a partir da sessão 7. Êxito significativo a partir da sessão 10.",
    "challenge_points": [4, 7, 10]
  }'::jsonb,
  'active'
) ON CONFLICT (title) DO NOTHING;

-- ============================================
-- 3. JORNADA DEPRESSÃO - JOÃO (avançada)
-- ============================================
INSERT INTO clinical_journeys (
  id, title, disorder_category, primary_diagnosis,
  difficulty_level, client_profile, journey_structure, status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  'Jornada Depressão - João: Perda de Sentido de Vida',
  'mood',
  'Transtorno Depressivo Maior (F32.2)',
  'advanced',
  '{
    "name": "João Roberto Costa",
    "age": 52,
    "occupation": "Executivo",
    "background": "Divorciado há 2 anos. Perda de emprego há 6 meses. Isolamento social progressivo.",
    "core_beliefs": ["Nunca vou melhorar", "Sou um fracasso", "Não mereço felicidade"],
    "main_complaint": "Depressão severa com ideação suicida passiva, perda de prazer em atividades, fadiga extrema",
    "treatment_goals": ["Reduzir sintomas depressivos", "Aumentar esperança e significado", "Retomar atividades prazerosas"]
  }'::jsonb,
  '{
    "total_sessions": 12,
    "therapy_approach": "TCC + Ativação Comportamental",
    "expected_trajectory": "Lenta melhora inicial. Salto significativo sessão 5-6. Possível regressão temporária sessão 8. Recuperação continuada até sessão 12.",
    "challenge_points": [2, 6, 9]
  }'::jsonb,
  'active'
) ON CONFLICT (title) DO NOTHING;

-- ============================================
-- PLACEHOLDER PARA JORNADAS 4-19
-- ============================================
-- Nota: As jornadas 4-19 podem ser inseridas manualmente
-- via importação dos blueprints em /Orquestrar casos clinicos/outputs/modulo-3/blueprints/
-- Para este script inicial, temos 3 jornadas de exemplo (básico, intermediário, avançado)

-- ============================================
-- VALIDAÇÃO
-- ============================================
-- Verificar quantas jornadas foram inseridas
SELECT COUNT(*) as total_jornadas_importadas FROM clinical_journeys;

-- Verificar detalhes
SELECT id, title, difficulty_level, status, created_at
FROM clinical_journeys
ORDER BY created_at DESC;
