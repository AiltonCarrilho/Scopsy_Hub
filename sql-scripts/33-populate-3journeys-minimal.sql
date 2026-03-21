-- Migration 33: Minimal - 3 journeys population (FINAL)
-- Aria's architectural solution: Remove narratives, use compact schema

BEGIN;

-- DEPRESSÃO (João) - 12 sessions
INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, decision_prompt, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 1, 'Estabelecendo Aliança e Psicoeducação Inicial', 'initial', 'Como você promove esperança realista no primeiro encontro?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 2, 'Mapeando o Ciclo Depressivo', 'middle', 'Como você ajuda o cliente a ver o ciclo comportamento-pensamento-emoção?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 3, 'Ativação Comportamental: Pequenos Passos', 'middle', 'Como você valida o progresso diante da autocrítica?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 4, 'Identificando Crenças Centrais Depressivas', 'middle', 'Como você desafia "Meu valor = meu desempenho"?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 5, 'Expandindo Valores e Reengajamento Social', 'middle', 'Como você consolida ganhos e mapeia valores?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 6, 'Consolidação e Prevenção de Recaída', 'advanced', 'Como você cria um plano de recaída efetivo?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 7, 'Navegando Recaída Leve', 'advanced', 'Como você normaliza e reativa ferramentas rapidamente?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 8, 'Aprofundando Autocompaixão', 'advanced', 'Como você introduz mindfulness e aceitação?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 9, 'Integração de Valores com Ação', 'advanced', 'Como você alinha valores com ação concreta?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 10, 'Sustentabilidade a Longo Prazo', 'advanced', 'Como você consolida ferramentas permanentes?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 11, 'Reflexão sobre Jornada', 'termination', 'Como você facilita reflexão sobre transformação?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 12, 'Encerramento e Manutenção Autônoma', 'termination', 'Como você encerra empoderado?', NOW(), NOW());

-- AGORAFOBIA (Maria) - 12 sessions
INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, decision_prompt, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 1, 'Entendendo Agorafobia: Além do Medo', 'initial', 'Como você oferece esperança para agorafobia?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 2, 'Mapeando Hierarquia de Medo', 'middle', 'Como você cria hierarquia de exposição graduada?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 3, 'Primeira Exposição: Quebra da Evitação', 'middle', 'Como você celebra a habituação observada?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 4, 'Expandindo para Espaços Públicos', 'middle', 'Como você reestrutura crenças catastróficas?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 5, 'Conquista Modulada: Do Bairro ao Shopping', 'middle', 'Como você planeja exposição ao shopping?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 6, 'Consolidação e Desafio Final: Direção', 'advanced', 'Como você planeja direção em rodovia?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 7, 'Manejo de Ansiedade Residual', 'advanced', 'Como você aprofunda aceitação psicológica?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 8, 'Rodovia: Conquista do Medão Final', 'advanced', 'Como você celebra essa transformação?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 9, 'Retomada de Vida Social e Independência', 'advanced', 'Como você consolida ganhos na vida real?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 10, 'Plano de Recaída: Vigilância e Ação', 'termination', 'Como você cria plano de recaída robusto?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 11, 'Reflexão: De Prisioneira a Livre', 'termination', 'Como você celebra a transformação?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 12, 'Encerramento: Especialista em Liberdade', 'termination', 'Como você encerra essa jornada?', NOW(), NOW());

-- TAG (Pedro) - 12 sessions
INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, decision_prompt, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 1, 'Entendendo TAG: Preocupação Crônica', 'initial', 'Como você oferece esperança inicial?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 2, 'Mapeando Correntes de Preocupação', 'middle', 'Como você identifica padrões de cadeia?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 3, 'Desafiando Pensamentos: Catástrofe a Realidade', 'middle', 'Como você treina teste de hipótese?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 4, 'Tolerância à Incerteza: Viver com Não Sei', 'middle', 'Como você desafia "sem preocupação = desastre"?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 5, 'Mindfulness: Assistindo Preocupação Sem Luta', 'middle', 'Como você aprofunda defusão cognitiva?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 6, 'Ação Alinhada com Valores', 'advanced', 'Como você integra valores com ação?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 7, 'Consolidação de Ganhos', 'advanced', 'Como você consolida transformação?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 8, 'Manejo de Recaída Leve em Stress', 'advanced', 'Como você normaliza aumento em stress?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 9, 'Integrando Aprendizados: TAG não é Identidade', 'advanced', 'Como você facilita transformação de identidade?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 10, 'Plano de Prevenção de Recaída', 'termination', 'Como você cria vigilância inteligente?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 11, 'Reflexão: Vida Reclamada de TAG', 'termination', 'Como você celebra liberdade?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 12, 'Encerramento: Especialista em Saúde Mental', 'termination', 'Como você encerra com autonomia?', NOW(), NOW());

COMMIT;

-- Verify Results
SELECT 'FINAL RESULT' as status,
  (SELECT COUNT(*) FROM journey_sessions WHERE journey_id = '550e8400-e29b-41d4-a716-446655440002') as depressao,
  (SELECT COUNT(*) FROM journey_sessions WHERE journey_id = '550e8400-e29b-41d4-a716-446655440001') as agorafobia,
  (SELECT COUNT(*) FROM journey_sessions WHERE journey_id = '550e8400-e29b-41d4-a716-446655440000') as tag;
