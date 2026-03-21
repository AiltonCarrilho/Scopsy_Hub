-- Migration 31: Simple populate 3 journeys
-- No RAISE NOTICE, pure SQL only

BEGIN;

-- Depressão (João) - 12 sessions
INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 1, 'Estabelecendo Aliança e Psicoeducação Inicial sobre Depressão', 'initial', 'João, 38 anos, analista de sistemas, chega relatando desmotivação persistente, falta de prazer em atividades, e sensação de estar "parado" há 3 meses apesar de sucesso profissional aparente. Apresenta crenças centrais: "Eu falho em ser bom o suficiente", "Meu valor está no que produzo". O foco inicial é estabelecer aliança terapêutica e psicoeducação sobre depressão (DSM-5-TR: Episódio Moderado de Transtorno Depressivo Recorrente). Objetivos: recuperar interesse, reduzir autocrítica, desenvolver estratégias para períodos de baixa energia.', '[{"option_letter":"A","intervention":"Psicoeducação baseada em evidências sobre depressão maior e modelo cognitivo-comportamental","approach":"Validação + esperança realista","is_optimal":true,"impact":{"rapport":8,"insight":7,"behavioral_change":6,"symptom_reduction":0}}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 2, 'Mapeando o Ciclo Depressivo: Comportamento, Pensamento e Emoção', 'middle', 'João traz registros de atividades do último semestre. Você identifica uma queda gradual em atividades que antes o traziam prazer (esportes, tempo com amigos). Ele relata pensamentos catastróficos frequentes: "Nunca vou melhorar", "Sou um fracasso". A sessão foca em psicoeducação sobre o ciclo da depressão: redução de atividade → mais pensamentos negativos → apatia aumentada.', '[{"option_letter":"A","intervention":"Colaborativamente identificar UMA atividade pequena para retomar esta semana (ativação comportamental graduada)","approach":"Abordagem colaborativa de pequenos passos","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 3, 'Ativação Comportamental: Pequenos Passos, Grande Impacto', 'middle', 'João relata que retomou futebol com amigos uma vez na semana anterior. Humor ligeiramente melhorado, mas também crítica: "Deveria estar fazendo mais." Você valida o progresso e reenquadra a autocrítica como parte do transtorno, não como verdade.', '[{"option_letter":"A","intervention":"Validar progresso, discutir autocrítica como sintoma depressivo","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 4, 'Identificando e Desafiando Crenças Centrais Depressivas', 'middle', 'João traz um padrão de pensamentos: quando comete um pequeno erro no trabalho, sente que é "um fracasso total". Você mapeia a crença central: "Meu valor = meu desempenho".', '[{"option_letter":"A","intervention":"Colaborativamente explorar origem e testar com experimentos","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 5, 'Expandindo Valores e Reengajamento Social', 'middle', 'João compartilha que passou mais tempo com amigos e até iniciou um projeto pessoal (programação, hobby antigo). Humor notavelmente melhor.', '[{"option_letter":"A","intervention":"Celebrar progresso, mapear valores em 4 áreas de vida","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 6, 'Consolidação e Plano de Prevenção de Recaída', 'advanced', 'João relata 4 semanas consecutivas de melhora. Energia está retornando, mas expressa medo: "E se voltar?" Sessão foca em prevenção de recaída.', '[{"option_letter":"A","intervention":"Criar plano de prevenção identificando gatilhos e sinais de alerta","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 7, 'Navegando Recaída Leve: Fortalecendo Resiliência', 'advanced', 'Uma semana de sintomas leves reaparece (apatia, pensamentos críticos) após período estressante no trabalho. João fica ansioso, mas consegue reconhecer o padrão.', '[{"option_letter":"A","intervention":"Normalizar como esperado, reativar ferramentas imediatamente","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 8, 'Aprofundando Autocompaixão: Aceitação vs. Luta contra Pensamentos', 'advanced', 'Sintomas leves já melhoraram com ativação rápida. Foco muda para autocompaixão: João percebe que sua autocrítica ("Deveria estar 100% melhor") mantém tensão.', '[{"option_letter":"A","intervention":"Introduzir aceitação psicológica e distancing de pensamentos via mindfulness","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 9, 'Integração de Valores com Ação: Vida Significativa além da Depressão', 'advanced', 'João agora está consistentemente melhor. Energizado. Discussão passa para: "Como quero viver minha vida?" Conecta valores identificados com ações concretas.', '[{"option_letter":"A","intervention":"Mapear valores profundos e co-criar plano de vida significativa","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 10, 'Sustentabilidade a Longo Prazo: Conhecimento Adquirido', 'advanced', 'João compartilha planos concretos: encontro em família planejado, projeto iniciado, primeira reunião de voluntariado agendada. Humor estável, autocrítica reduzida.', '[{"option_letter":"A","intervention":"Revisar trajectory, consolidar ferramentas, discutir monitoramento contínuo","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 11, 'Reflexão sobre Jornada: Do Vazio ao Propósito', 'termination', 'Sessão reflexiva. João fala sobre transformação: começou sentindo-se vazio, sem propósito, preso em autocrítica. Agora tem direção, relacionamentos reforçados, atividades significativas.', '[{"option_letter":"A","intervention":"Facilitar reflexão profunda sobre jornada e integrar aprendizados","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 12, 'Encerramento e Manutenção Autônoma de Bem-Estar', 'termination', 'Sessão final. João chegará independente, levando consigo mapa de bem-estar, identificação de gatilhos, ferramentas TCC. Você revisa: "Você é agora especialista em sua própria saúde mental."', '[{"option_letter":"A","intervention":"Consolidar autonomia, revisar ferramentas portáteis, celebrar e deixar porta aberta","is_optimal":true}]'::jsonb, NOW(), NOW());

-- Agorafobia (Maria) - 12 sessions
INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 1, 'Entendendo Agorafobia: Além do Medo de Sair de Casa', 'initial', 'Maria, 45 anos, relata 2 anos progressivos de evitação: começou com medo de dirigir em rodovias, agora evita sair de casa sozinha. Descreve ataques de pânico em espaços abertos ou "sem saída fácil".', '[{"option_letter":"A","intervention":"Psicoeducação colaborativa sobre agorafobia como transtorno de ansiedade","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 2, 'Mapeando Hierarquia de Medo: Da Sala para o Mundo', 'middle', 'Maria consegue se mover pela casa com ansiedade mínima. Medo sobe ao sair para quintal (moderado), sair da rua (alto), ir ao supermercado (muito alto), dirigir (extremo).', '[{"option_letter":"A","intervention":"Colaborativamente criar hierarquia graduada de exposição","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 3, 'Primeira Exposição: Quebra da Evitação', 'middle', 'Maria conseguiu ficar no quintal 5 minutos 3 vezes na semana. Ansiedade subiu para 7/10 inicialmente, caiu para 3/10 ao final. Percebe habituação natural.', '[{"option_letter":"A","intervention":"Celebrar, explicar habituação, aumentar meta graduadamente","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 4, 'Expandindo para Espaços Públicos: Rua e Vizinhança', 'middle', 'Maria conseguiu caminhar até o portão várias vezes, sozinha. Ansiedade habituou (4-5/10). Próximo passo: caminhar 100 metros na rua, sozinha.', '[{"option_letter":"A","intervention":"Reestruturar crença catastrófica e planejar rua com marido a distância","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 5, 'Conquista Modulada: Do Bairro ao Shopping', 'middle', 'Maria agora consegue caminhar 500 metros sozinha, com ansiedade habituando (3-4/10). Confiança aumentando. Medo persistente: espaços fechados (shopping, cinema).', '[{"option_letter":"A","intervention":"Planejar exposição gradual em shopping começando perto de saída","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 6, 'Consolidação e Desafio do Passo Mais Alto: Direção', 'advanced', 'Maria passou 20 minutos em shopping, ansiedade habituou significativamente (2-3/10). Vida começou a retornar: saiu com amigas para café, algo impensável 6 meses atrás.', '[{"option_letter":"A","intervention":"Planejar dirección faseada com exposição interoceptiva","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 7, 'Manejo de Ansiedade Residual e Aprofundamento de Aceitação', 'advanced', 'Maria conseguiu dirigir em via principal 2 vezes, com ansiedade alta inicialmente, mas habituando. Rodovia ainda é terrorizante. Ela relata: "Ainda tenho pânico, mas agora continuo fazendo o que preciso fazer."', '[{"option_letter":"A","intervention":"Reforçar que valor de ação é mais importante que ausência de sintomas","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 8, 'Rodovia: Conquista do Medão Final', 'advanced', 'Maria dirigiu em rodovia por 15 km com marido no banco de passageiro. Ansiedade subiu, habituou, conseguiu voltar para casa sozinha. Descreveu sentimento de "libertação" e "confiança restaurada".', '[{"option_letter":"A","intervention":"Celebrar magnitude da conquista, consolidar ganhos, planejar atividades futuras","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 9, 'Retomada de Vida Social e Independência', 'advanced', 'Maria fez fim de semana em praia com marido, dirigindo 2 horas sozinha. Saiu com amigas para café, cinema, shopping sem pânico significativo. Vida social ressurgiu.', '[{"option_letter":"A","intervention":"Celebrar retomada de vida normal, enfatizar continuidade de exposição como manutenção","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 10, 'Plano de Recaída: Vigilância e Ação Rápida', 'termination', 'Maria e terapeuta criam plano de recaída. Gatilhos identificados: períodos de alto stress, isolamento, não dirigir por semanas. Sinais de alerta precoce: evitar sair "por motivos pequenos".', '[{"option_letter":"A","intervention":"Colaborativamente criar plano de recaída detalhado com gatilhos e sinais de alerta","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 11, 'Reflexão sobre Transformação: De Prisioneira a Livre', 'termination', 'Sessão reflexiva. Maria reconhece jornada: começou severamente restrita (não conseguia deixar casa, marido tinha que fazer compras), agora dirige, sai, viaja.', '[{"option_letter":"A","intervention":"Facilitar reflexão profunda sobre transformação, celebrar empoderamento","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 12, 'Encerramento: Especialista em Sua Própria Liberdade', 'termination', 'Sessão final. Maria deixa terapia com ferramentas portáteis: hierarquia de exposição, manejo de sensações físicas, plano de recaída, rede de suporte (marido, amigas).', '[{"option_letter":"A","intervention":"Consolidar autonomia, revisar ferramentas portáteis, celebrar empoderamento","is_optimal":true}]'::jsonb, NOW(), NOW());

-- TAG (Pedro) - 12 sessions
INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 1, 'Entendendo TAG: Preocupação Crônica Além do Controle', 'initial', 'Pedro, 42 anos, relata preocupação constante com saúde, finanças, desempenho no trabalho. Dorme mal, músculos tensionados. Preocupa-se com preocupação em si ("Vou pirar com essas preocupações").', '[{"option_letter":"A","intervention":"Psicoeducação colaborativa sobre TAG como transtorno de preocupação excessiva","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 2, 'Mapeando Correntes de Preocupação: Identificando Padrões', 'middle', 'Pedro traz diário de preocupações. Identifica correntes: saúde ("dor no peito = infarto") → financeiro ("vou perder tudo") → trabalho ("vou ser demitido").', '[{"option_letter":"A","intervention":"Mapear correntes colaborativamente, distinguir problemas reais de hipotéticos","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 3, 'Desafiando Pensamentos: De Catástrofe a Realidade', 'middle', 'Pedro relata que conseguiu "não checar" seu coração por 3 dias após sentir palpitação. Inicialmente o pânico subiu, mas depois habituou.', '[{"option_letter":"A","intervention":"Treinar teste de hipótese para preocupações: qual evidência apoiaria a catástrofe","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 4, 'Tolerância à Incerteza: Aprender a Viver com Não Sei', 'middle', 'Pedro compartilha avanço: deixou de chamar amigos pedindo tranquilidade sobre saúde. Ainda preocupa, mas menos. Crença emerge: "Se não me preocupo, algo ruim vai acontecer."', '[{"option_letter":"A","intervention":"Explorar ilusão que preocupação previne desastres; treinar tolerância ao não sei","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 5, 'Mindfulness e Observação: Assistindo a Preocupação Sem Luta', 'middle', 'Pedro praticou deixar pensamentos negativos surgirem sem agir (não checar, não chamar médico, não procrastinar trabalho). Inicialmente difícil, agora habituado.', '[{"option_letter":"A","intervention":"Aprofundar mindfulness e cognitive defusion: ensinar observação de pensamentos sem ação","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 6, 'Ação Alinhada com Valores: Vivendo Além da Preocupação', 'advanced', 'Pedro dorme melhor (6-7 horas). Preocupação ainda surge, mas não domina. Foco muda para ACT: o que é importante para Pedro além de estar "seguro"?', '[{"option_letter":"A","intervention":"Mapear valores profundos, planejar ações concretas mesmo com preocupação presente","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 7, 'Consolidação de Ganhos: Preocupação Controlada, Vida Ativa', 'advanced', 'Pedro conseguiu manter exercício regular, passou tempo com esposa, aprendeu bases de novo software no trabalho. Preocupação entre 3-4/10 (iniciou 8/10).', '[{"option_letter":"A","intervention":"Celebrar transformação real; revisar ferramentas de manutenção","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 8, 'Manejo de Recaída Leve: Preocupação Aumentada no Contexto de Stress', 'advanced', 'Período de stress no trabalho (reestruturação) gerou aumento de preocupação (6/10). Pedro notou rapidamente o padrão. Sessão reativa ferramentas.', '[{"option_letter":"A","intervention":"Normalizar aumento sob stress como esperado; validar que conseguiu agir apesar de preocupação","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 9, 'Integrando Aprendizados: TAG não é Identidade, é Condição Tratável', 'advanced', 'Pedro compartilha insight: "Não sou mais o cara preocupado. Sou uma pessoa que às vezes preocupa excessivamente, mas sabe lidar."', '[{"option_letter":"A","intervention":"Celebrar transformação de identidade; consolidar que TAG é condição, não essência","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 10, 'Plano de Prevenção de Recaída: Vigilância Inteligente', 'termination', 'Pedro e terapeuta criam plano de recaída. Gatilhos: stress profissional, isolamento social, parar exercício. Sinais de alerta: volta de insônia, checklists mentais.', '[{"option_letter":"A","intervention":"Criar plano detalhado de recaída com gatilhos, sinais, e ações; enfatizar ação rápida","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 11, 'Reflexão Profunda: Vida Reclamada de TAG', 'termination', 'Sessão reflexiva. Pedro relembra: começou com preocupação incontrolável (8/10), insônia, isolamento. Agora dorme bem, conectado com esposa, crescendo no trabalho.', '[{"option_letter":"A","intervention":"Facilitar reflexão profunda sobre transformação; celebrar empoderamento e autonomia conquistados","is_optimal":true}]'::jsonb, NOW(), NOW());

INSERT INTO journey_sessions (id, journey_id, session_number, session_title, session_phase, context, options, created_at, updated_at) VALUES
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 12, 'Encerramento: Especialista em Sua Própria Saúde Mental', 'termination', 'Sessão final. Pedro deixa com ferramentas portáteis: teste de hipótese, tolerância a incerteza, mindfulness, valores e ação alinhada, plano de recaída.', '[{"option_letter":"A","intervention":"Consolidar autonomia, revisar ferramentas portáteis, celebrar especialidade conquistada","is_optimal":true}]'::jsonb, NOW(), NOW());

COMMIT;

-- Verify
SELECT
  COUNT(*) as total_sessions,
  (SELECT COUNT(*) FROM journey_sessions WHERE journey_id = '550e8400-e29b-41d4-a716-446655440002') as depressao,
  (SELECT COUNT(*) FROM journey_sessions WHERE journey_id = '550e8400-e29b-41d4-a716-446655440001') as agorafobia,
  (SELECT COUNT(*) FROM journey_sessions WHERE journey_id = '550e8400-e29b-41d4-a716-446655440000') as tag
FROM journey_sessions
WHERE journey_id IN ('550e8400-e29b-41d4-a716-446655440002','550e8400-e29b-41d4-a716-446655440001','550e8400-e29b-41d4-a716-446655440000');
