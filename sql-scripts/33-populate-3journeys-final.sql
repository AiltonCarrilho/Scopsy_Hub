-- Migration 33 FINAL: 3 journeys - ALL required columns filled

BEGIN;

-- DEPRESSÃO (João) - 12 sessions
INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, decision_prompt, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 1, 'Estabelecendo Aliança e Psicoeducação Inicial', 'initial', 'João relata desmotivação persistente. Foco: estabelecer aliança terapêutica e psicoeducação sobre depressão.', 'Como você promove esperança realista?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 2, 'Mapeando o Ciclo Depressivo', 'middle', 'João identifica queda gradual em atividades prazerosas. Padrão claro: redução de atividade → pensamentos negativos → apatia.', 'Como você trabalha esse ciclo?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 3, 'Ativação Comportamental: Pequenos Passos', 'middle', 'João retomou futebol uma vez na semana. Humor melhorado, mas autocrítica: deveria fazer mais.', 'Como você valida o progresso?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 4, 'Identificando Crenças Centrais Depressivas', 'middle', 'João: pequeno erro no trabalho = fracasso total. Crença central: meu valor = meu desempenho.', 'Como você desafia essa crença?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 5, 'Expandindo Valores e Reengajamento Social', 'middle', 'João passou mais tempo com amigos, iniciou projeto pessoal. Humor notavelmente melhor.', 'Como você consolida esses ganhos?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 6, 'Consolidação e Prevenção de Recaída', 'advanced', 'João: 4 semanas de melhora. Medo: e se voltar? Sessão foca em prevenção: identificar gatilhos e sinais de alerta.', 'Como você cria um plano robusto?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 7, 'Navegando Recaída Leve', 'advanced', 'Uma semana de sintomas leves reaparece após stress. João reconhece o padrão. Você normaliza como esperado, não fracasso.', 'Como você reativa ferramentas rapidamente?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 8, 'Aprofundando Autocompaixão', 'advanced', 'Sintomas leves já melhoraram. Foco muda para autocompaixão: autocrítica mantém tensão. Introduz mindfulness e aceitação.', 'Como você ensina observação sem julgamento?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 9, 'Integração de Valores com Ação', 'advanced', 'João: consistentemente melhor. Conversa: como quero viver? Conecta valores com ações concretas.', 'Como você alinha valores com ação?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 10, 'Sustentabilidade a Longo Prazo', 'advanced', 'João dorme melhor. Preocupação surge mas não domina. Qualidade de vida retornou. Revisa trajectory completo.', 'Como você consolida ferramentas permanentes?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 11, 'Reflexão sobre Jornada', 'termination', 'João: começou vazio, sem propósito, preso em autocrítica. Agora tem direção, relacionamentos, atividades significativas.', 'Como você facilita essa reflexão?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 12, 'Encerramento e Manutenção Autônoma', 'termination', 'Sessão final. João sai com mapa de bem-estar, gatilhos identificados, ferramentas TCC e plano de recaída.', 'Como você encerra empoderado?', NOW(), NOW());

-- AGORAFOBIA (Maria) - 12 sessions
INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, decision_prompt, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 1, 'Entendendo Agorafobia: Além do Medo', 'initial', 'Maria: 2 anos de evitação progressiva. Começou com medo de rodovia, agora evita sair sozinha. Ataques de pânico em espaços abertos ou sem saída fácil.', 'Como você oferece esperança?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 2, 'Mapeando Hierarquia de Medo', 'middle', 'Maria se move pela casa com ansiedade mínima. Medo: quintal (moderado) → rua (alto) → supermercado (muito alto) → dirigir (extremo).', 'Como você cria hierarquia graduada?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 3, 'Primeira Exposição: Quebra da Evitação', 'middle', 'Maria: 5 minutos no quintal, 3x na semana. Ansiedade 7/10 → 3/10. Percebe habituação natural.', 'Como você celebra a habituação?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 4, 'Expandindo para Espaços Públicos', 'middle', 'Maria caminha até portão sozinha. Ansiedade habituou 4-5/10. Próximo: 100m na rua, sem marido ao lado.', 'Como você reestrutura crenças catastróficas?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 5, 'Conquista Modulada: Do Bairro ao Shopping', 'middle', 'Maria caminha 500m sozinha, ansiedade 3-4/10. Confiança aumentando. Medo: espaços fechados (shopping, cinema).', 'Como você planeja exposição ao shopping?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 6, 'Consolidação e Desafio Final: Direção', 'advanced', 'Maria: 20min em shopping, ansiedade 2-3/10. Vida retornando: saiu com amigas. Agora: dirigir sozinha em rodovia.', 'Como você planeja exposição à rodovia?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 7, 'Manejo de Ansiedade Residual', 'advanced', 'Maria: via principal 2x, ansiedade alta mas habituando. Rodovia ainda terrifica. Relata: ainda tenho pânico mas continuo.', 'Como você aprofunda aceitação psicológica?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 8, 'Rodovia: Conquista do Medão Final', 'advanced', 'Maria: 15km em rodovia com marido no banco. Ansiedade subiu, habituou, voltou sozinha. Libertação restaurada.', 'Como você celebra essa transformação?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 9, 'Retomada de Vida Social e Independência', 'advanced', 'Maria: fim de semana na praia, dirigiu 2h sozinha. Saiu com amigas para café, cinema, shopping. Vida social ressurgiu.', 'Como você consolida esses ganhos?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 10, 'Plano de Recaída: Vigilância e Ação', 'termination', 'Maria e terapeuta criam plano. Gatilhos: stress, isolamento, não dirigir por semanas. Sinais: evitar por motivos pequenos.', 'Como você cria vigilância eficaz?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 11, 'Reflexão: De Prisioneira a Livre', 'termination', 'Maria: começou severamente restrita (não saia de casa). Agora dirige, sai, viaja. Agorafobia não mais prisioneira.', 'Como você celebra a transformação?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 12, 'Encerramento: Especialista em Liberdade', 'termination', 'Maria sai com ferramentas: hierarquia de exposição, sensações físicas, plano de recaída, rede de suporte.', 'Como você encerra essa jornada?', NOW(), NOW());

-- TAG (Pedro) - 12 sessions
INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, decision_prompt, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 1, 'Entendendo TAG: Preocupação Crônica', 'initial', 'Pedro: preocupação constante com saúde, finanças, trabalho. Dorme mal, músculos tensionados. Preocupa-se com preocupação ("vou pirar").', 'Como você oferece esperança inicial?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 2, 'Mapeando Correntes de Preocupação', 'middle', 'Pedro: diário de preocupações. Correntes: saúde (dor = infarto) → financeiro (vou perder tudo) → trabalho (vou ser demitido).', 'Como você identifica padrões?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 3, 'Desafiando Pensamentos: Catástrofe a Realidade', 'middle', 'Pedro: não checou coração por 3 dias. Pânico subiu mas habituou. Introduz teste de hipótese em vez de preocupar.', 'Como você treina esse teste?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 4, 'Tolerância à Incerteza: Viver com Não Sei', 'middle', 'Pedro: deixou de chamar amigos por tranquilidade. Ainda preocupa, menos. Crença: sem preocupação = desastre.', 'Como você desafia essa ilusão?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 5, 'Mindfulness: Assistindo Preocupação Sem Luta', 'middle', 'Pedro: deixou pensamentos negativos surgirem sem agir. Inicialmente difícil. Agora: surge, vê, passa.', 'Como você aprofunda defusão cognitiva?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 6, 'Ação Alinhada com Valores', 'advanced', 'Pedro dorme melhor 6-7h. Preocupação surge mas não domina. O que é importante além de estar seguro? Relacionamento, saúde, crescimento.', 'Como você integra valores com ação?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 7, 'Consolidação de Ganhos', 'advanced', 'Pedro: mantém exercício, tempo com esposa, aprendizado no trabalho. Preocupação 3-4/10 (antes 8/10). Qualidade de vida retornou.', 'Como você consolida esses ganhos?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 8, 'Manejo de Recaída Leve em Stress', 'advanced', 'Stress profissional gerou aumento (6/10). Pedro notou padrão rapidamente. Não suprimiu, aceitou enquanto agia.', 'Como você normaliza aumento sob stress?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 9, 'Integrando Aprendizados: TAG não é Identidade', 'advanced', 'Pedro: não sou mais o cara preocupado. Sou pessoa que às vezes preocupa excessivamente mas sabe lidar. Transformação de identidade.', 'Como você facilita essa transformação?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 10, 'Plano de Prevenção de Recaída', 'termination', 'Pedro e terapeuta criam plano. Gatilhos: stress, isolamento, parar exercício. Sinais: insônia, checklists mentais.', 'Como você cria vigilância inteligente?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 11, 'Reflexão: Vida Reclamada de TAG', 'termination', 'Pedro: começou 8/10 preocupação, insônia, isolamento. Agora: bem, conectado, crescendo. Vida recuperada.', 'Como você celebra essa liberdade?', NOW(), NOW()),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 12, 'Encerramento: Especialista em Saúde Mental', 'termination', 'Pedro sai com ferramentas: teste de hipótese, tolerância a incerteza, mindfulness, valores e ação, plano de recaída.', 'Como você encerra com autonomia?', NOW(), NOW());

COMMIT;

-- Final Count
SELECT
  'SUCCESS' as status,
  (SELECT COUNT(*) FROM journey_sessions WHERE journey_id = '550e8400-e29b-41d4-a716-446655440002') as depressao,
  (SELECT COUNT(*) FROM journey_sessions WHERE journey_id = '550e8400-e29b-41d4-a716-446655440001') as agorafobia,
  (SELECT COUNT(*) FROM journey_sessions WHERE journey_id = '550e8400-e29b-41d4-a716-446655440000') as tag,
  (SELECT COUNT(*) FROM journey_sessions WHERE journey_id IN ('550e8400-e29b-41d4-a716-446655440002','550e8400-e29b-41d4-a716-446655440001','550e8400-e29b-41d4-a716-446655440000')) as total;
