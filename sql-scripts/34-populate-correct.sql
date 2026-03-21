-- Migration 34: CORRECT - All NOT NULL columns filled
-- Schema: journey_id, session_number✓, session_title✓, session_phase, context✓, decision_prompt✓, options✓

BEGIN;

-- DEPRESSÃO (João) - 12 sessions
INSERT INTO journey_sessions (journey_id, session_number, session_title, session_phase, context, decision_prompt, options) VALUES
('550e8400-e29b-41d4-a716-446655440002', 1, 'Estabelecendo Aliança e Psicoeducação Inicial', 'initial', 'João, 38 anos, relata desmotivação persistente e falta de prazer em atividades. Foco: estabelecer aliança terapêutica.', 'Como você promove esperança realista?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440002', 2, 'Mapeando o Ciclo Depressivo', 'middle', 'João identifica queda gradual em atividades. Padrão: redução de atividade leva a pensamentos negativos e apatia.', 'Como você trabalha o ciclo?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440002', 3, 'Ativação Comportamental: Pequenos Passos', 'middle', 'João retomou futebol uma vez na semana. Humor melhorado, mas autocrítica sobre deveria fazer mais.', 'Como você valida progresso?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440002', 4, 'Identificando Crenças Centrais Depressivas', 'middle', 'João: pequeno erro = fracasso total. Crença central: meu valor = meu desempenho no trabalho.', 'Como você desafia essa crença?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440002', 5, 'Expandindo Valores e Reengajamento Social', 'middle', 'João passou tempo com amigos, iniciou projeto pessoal. Humor notavelmente melhor. Conectando com valores.', 'Como você consolida ganhos?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440002', 6, 'Consolidação e Prevenção de Recaída', 'advanced', 'João: 4 semanas de melhora. Medo de recaída. Sessão foca em identificar gatilhos e sinais de alerta precoce.', 'Como você cria plano robusto?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440002', 7, 'Navegando Recaída Leve', 'advanced', 'Uma semana de sintomas leves após stress. João reconhece padrão. Você normaliza como esperado, não fracasso.', 'Como você reativa ferramentas?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440002', 8, 'Aprofundando Autocompaixão', 'advanced', 'Sintomas leves melhoraram. Autocrítica mantém tensão. Foco em autocompaixão, mindfulness, aceitação de pensamentos.', 'Como você ensina observação sem luta?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440002', 9, 'Integração de Valores com Ação', 'advanced', 'João consistentemente melhor. Pergunta: como quero viver? Conecta valores com ações concretas e significativas.', 'Como você alinha valores com ação?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440002', 10, 'Sustentabilidade a Longo Prazo', 'advanced', 'João dorme bem. Preocupação surge mas não domina. Qualidade de vida retornou. Revisa trajectory completo.', 'Como você consolida ferramentas?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440002', 11, 'Reflexão sobre Jornada', 'termination', 'João: começou vazio, preso em autocrítica. Agora tem direção, relacionamentos reforçados, atividades significativas.', 'Como você facilita reflexão?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440002', 12, 'Encerramento e Manutenção Autônoma', 'termination', 'Sessão final. João sai com mapa de bem-estar, identificação de gatilhos, ferramentas TCC e plano de recaída.', 'Como você encerra empoderado?', '[]'::jsonb);

-- AGORAFOBIA (Maria) - 12 sessions
INSERT INTO journey_sessions (journey_id, session_number, session_title, session_phase, context, decision_prompt, options) VALUES
('550e8400-e29b-41d4-a716-446655440001', 1, 'Entendendo Agorafobia: Além do Medo', 'initial', 'Maria, 45 anos. 2 anos de evitação progressiva. Começou com medo de rodovia, agora evita sair de casa sozinha. Ataques de pânico.', 'Como você oferece esperança?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440001', 2, 'Mapeando Hierarquia de Medo', 'middle', 'Maria se move pela casa com ansiedade mínima. Medo aumenta: quintal (moderado), rua (alto), supermercado (muito alto), dirigir (extremo).', 'Como você cria hierarquia?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440001', 3, 'Primeira Exposição: Quebra da Evitação', 'middle', 'Maria: 5 minutos no quintal 3x na semana. Ansiedade 7/10 inicial, caiu para 3/10. Percebe habituação natural.', 'Como você celebra habituação?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440001', 4, 'Expandindo para Espaços Públicos', 'middle', 'Maria caminha até portão sozinha. Ansiedade habituou a 4-5/10. Próximo passo: 100 metros na rua, sem marido ao lado.', 'Como você reestrutura crenças?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440001', 5, 'Conquista Modulada: Do Bairro ao Shopping', 'middle', 'Maria caminha 500m sozinha, ansiedade 3-4/10. Confiança aumentando. Medo persistente: espaços fechados (shopping, cinema).', 'Como você planeja shopping?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440001', 6, 'Consolidação e Desafio Final: Direção', 'advanced', 'Maria: 20 minutos em shopping, ansiedade 2-3/10. Vida retornando: saiu com amigas. Agora enfrenta: dirigir sozinha em rodovia.', 'Como você planeja rodovia?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440001', 7, 'Manejo de Ansiedade Residual', 'advanced', 'Maria: dirigiu via principal 2 vezes, ansiedade alta mas habituando. Rodovia ainda terrifica. Relata: tenho pânico mas continuo.', 'Como você aprofunda aceitação?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440001', 8, 'Rodovia: Conquista do Medão Final', 'advanced', 'Maria dirigiu 15km em rodovia com marido no banco. Ansiedade subiu, habituou, voltou sozinha. Libertação restaurada.', 'Como você celebra transformação?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440001', 9, 'Retomada de Vida Social e Independência', 'advanced', 'Maria: fim de semana na praia dirigindo 2h sozinha. Saiu com amigas para café, cinema, shopping. Vida social ressurgiu.', 'Como você consolida ganhos?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440001', 10, 'Plano de Recaída: Vigilância e Ação', 'termination', 'Maria e terapeuta criam plano de recaída. Gatilhos: stress, isolamento, não dirigir por semanas. Sinais de alerta identificados.', 'Como você cria vigilância?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440001', 11, 'Reflexão: De Prisioneira a Livre', 'termination', 'Maria: começou severamente restrita (não saia de casa, marido fazia tudo). Agora dirige, sai, viaja. Vida recuperada.', 'Como você celebra liberdade?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440001', 12, 'Encerramento: Especialista em Liberdade', 'termination', 'Maria sai com ferramentas: hierarquia de exposição, manejo de sensações, plano de recaída, rede de suporte (marido, amigas).', 'Como você encerra jornada?', '[]'::jsonb);

-- TAG (Pedro) - 12 sessions
INSERT INTO journey_sessions (journey_id, session_number, session_title, session_phase, context, decision_prompt, options) VALUES
('550e8400-e29b-41d4-a716-446655440000', 1, 'Entendendo TAG: Preocupação Crônica', 'initial', 'Pedro, 42 anos. Preocupação constante com saúde, finanças, trabalho. Dorme mal, músculos tensionados. Preocupa-se com preocupação.', 'Como você oferece esperança?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440000', 2, 'Mapeando Correntes de Preocupação', 'middle', 'Pedro: diário de preocupações. Correntes: saúde (dor = infarto) → finanças (vou perder tudo) → trabalho (vou ser demitido).', 'Como você identifica padrões?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440000', 3, 'Desafiando Pensamentos: Catástrofe a Realidade', 'middle', 'Pedro não checou coração por 3 dias. Pânico subiu mas habituou. Introduz teste de hipótese em vez de apenas preocupar.', 'Como você treina teste?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440000', 4, 'Tolerância à Incerteza: Viver com Não Sei', 'middle', 'Pedro deixou de chamar amigos por tranquilidade. Ainda preocupa, menos. Crença: sem preocupação = desastre virá.', 'Como você desafia ilusão?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440000', 5, 'Mindfulness: Assistindo Preocupação Sem Luta', 'middle', 'Pedro deixou pensamentos negativos surgirem sem agir. Inicialmente difícil. Agora: surge preocupação, vê, passa naturalmente.', 'Como você aprofunda defusão?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440000', 6, 'Ação Alinhada com Valores', 'advanced', 'Pedro dorme melhor 6-7 horas. Preocupação surge mas não domina. O que é importante além de estar seguro? Relacionamento, saúde, crescimento.', 'Como você integra valores?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440000', 7, 'Consolidação de Ganhos', 'advanced', 'Pedro mantém exercício, tempo com esposa, aprendizado no trabalho. Preocupação 3-4/10 (antes 8/10). Qualidade de vida retornou.', 'Como você consolida ganhos?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440000', 8, 'Manejo de Recaída Leve em Stress', 'advanced', 'Stress profissional gerou aumento a 6/10. Pedro notou padrão rapidamente. Não suprimiu, aceitou enquanto agia normalmente.', 'Como você normaliza stress?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440000', 9, 'Integrando Aprendizados: TAG não é Identidade', 'advanced', 'Pedro: não sou mais o cara preocupado. Sou pessoa que às vezes preocupa excessivamente mas sabe lidar e agir. Transformação.', 'Como você facilita transformação?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440000', 10, 'Plano de Prevenção de Recaída', 'termination', 'Pedro e terapeuta criam plano de recaída. Gatilhos: stress, isolamento, parar exercício. Sinais: insônia, checklists mentais.', 'Como você cria vigilância?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440000', 11, 'Reflexão: Vida Reclamada de TAG', 'termination', 'Pedro: começou 8/10 preocupação, insônia, isolamento. Agora: bem, conectado, crescendo profissionalmente. Vida recuperada.', 'Como você celebra liberdade?', '[]'::jsonb),
('550e8400-e29b-41d4-a716-446655440000', 12, 'Encerramento: Especialista em Saúde Mental', 'termination', 'Pedro sai com ferramentas: teste de hipótese, tolerância a incerteza, mindfulness, valores e ação, plano de recaída.', 'Como você encerra autonomia?', '[]'::jsonb);

COMMIT;

-- Verify
SELECT 'FINAL SUCCESS' as result,
  (SELECT COUNT(*) FROM journey_sessions WHERE journey_id = '550e8400-e29b-41d4-a716-446655440002') as depressao,
  (SELECT COUNT(*) FROM journey_sessions WHERE journey_id = '550e8400-e29b-41d4-a716-446655440001') as agorafobia,
  (SELECT COUNT(*) FROM journey_sessions WHERE journey_id = '550e8400-e29b-41d4-a716-446655440000') as tag;
