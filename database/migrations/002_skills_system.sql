-- ============================================
-- MIGRAÇÃO: SISTEMA DE HABILIDADES NUCLEARES
-- Data: 2025-12-10
-- Descrição: Adiciona as 15 Habilidades Nucleares da TCC
-- ============================================

-- 1️⃣ CRIAR TABELA DE HABILIDADES
CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  module TEXT NOT NULL, -- 'fundamentos', 'formulacao', 'intervencao', 'consolidacao', 'metacompetencias'
  phase INTEGER NOT NULL, -- 1-4 (fases da jornada)
  description TEXT,
  why_essential TEXT,
  observable_indicators TEXT,
  order_in_module INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2️⃣ INSERIR AS 15 HABILIDADES NUCLEARES

-- 🌿 FASE 1 — ACOLHIMENTO E ALIANÇA TERAPÊUTICA (Skills 1-3)
INSERT INTO skills (id, name, module, phase, description, why_essential, observable_indicators, order_in_module) VALUES
(1, 'Acolhimento empático e escuta ativa', 'fundamentos', 1,
 'Criar vínculo, segurança e estrutura através de presença genuína, olhar, pausa respeitosa e eco emocional.',
 'A primeira sessão define se o paciente confia o suficiente para trabalhar. Sem aliança, não há técnica que funcione.',
 'Presença genuína, olhar, pausa respeitosa, eco emocional (ex: "parece que tem sido muito pesado para você").',
 1),

(2, 'Validação emocional e normalização', 'fundamentos', 1,
 'Diminuir vergonha, culpa e resistência reconhecendo e legitimando emoções sem minimizá-las.',
 'Base para o processamento emocional posterior. Paciente precisa sentir-se compreendido antes de mudar.',
 'O terapeuta reconhece e legitima emoções sem minimizá-las. Normaliza reações emocionais adequadamente.',
 2),

(3, 'Contratação e psicoeducação inicial (aliança de trabalho)', 'fundamentos', 1,
 'Explicar o modelo cognitivo, estrutura do tratamento e papéis de cada um.',
 'Reduz ambiguidade sobre o que é terapia. Cria aliança de trabalho e expectativas realistas.',
 'O paciente entende o que esperar da terapia, o papel de cada um, e como a TCC funciona.',
 3),

-- 🔍 FASE 2 — AVALIAÇÃO E FORMULAÇÃO COGNITIVA (Skills 4-6)
(4, 'Identificação de pensamentos automáticos e emoções associadas', 'formulacao', 2,
 'Ensinar o paciente a perceber e nomear pensamentos automáticos e suas emoções correspondentes.',
 'É o núcleo diagnóstico da TCC. Sem identificar pensamentos automáticos, não se sabe onde intervir.',
 'O terapeuta nomeia o pensamento e a emoção com precisão. Usa exemplos concretos recentes.',
 1),

(5, 'Exploração e questionamento socrático', 'formulacao', 2,
 'Fazer perguntas abertas e progressivas que ampliam consciência sem impor conclusões.',
 'Ensina o paciente a pensar sobre o próprio pensar. É a essência da reestruturação cognitiva.',
 'Perguntas abertas que exploram evidências, alternativas e consequências. Paciente descobre, não recebe respostas prontas.',
 2),

(6, 'Formulação de caso colaborativa', 'formulacao', 2,
 'Unir história, crenças, emoções e comportamentos em um mapa compartilhado que dá direção terapêutica.',
 'Transforma dados desconexos em narrativa coerente. Orienta escolha de intervenções.',
 'Terapeuta resume padrões, conecta presente e história, e o paciente confirma o sentido.',
 3),

-- ⚙️ FASE 3 — INTERVENÇÃO E MODIFICAÇÃO COGNITIVA/COMPORTAMENTAL (Skills 7-10)
(7, 'Reestruturação cognitiva (debate colaborativo)', 'intervencao', 3,
 'Guiar o paciente a gerar alternativas cognitivas mais adaptativas sem impor pensamentos.',
 'Ensina flexibilidade cognitiva e reduz distorções.Core da TCC clássica.',
 'O terapeuta guia o paciente a gerar alternativas, não as impõe. Usa perguntas, não afirmações.',
 1),

(8, 'Experimentos comportamentais e tarefas de casa', 'intervencao', 3,
 'Planejar experimentos práticos que testem crenças e transfiram mudança para o mundo real.',
 'É o maior preditor de resultado positivo em TCC. Aprendizagem experiencial supera insight verbal.',
 'Planeja experimentos claros, revisa resultados com curiosidade, ajusta com base no que aconteceu.',
 2),

(9, 'Confronto empático e limites terapêuticos', 'intervencao', 3,
 'Enfrentar padrões de evitação ou comportamentos contraproducentes sem quebrar vínculo.',
 'Alguns padrões precisam ser nomeados diretamente. Confronto sem empatia rompe aliança.',
 'Usa tom compassivo, timing adequado, e contextualiza o confronto no cuidado pelo paciente.',
 3),

(10, 'Uso de metáforas e linguagem experiencial', 'intervencao', 3,
 'Facilitar insight e memorização através de metáforas personalizadas e exemplos concretos.',
 'Conceitos abstratos viram compreensíveis. Metáforas grudadas são lembradas entre sessões.',
 'As metáforas refletem a realidade do paciente, não são genéricas. Paciente referencia depois.',
 4),

-- 🌱 FASE 4 — CONSOLIDAÇÃO, PREVENÇÃO DE RECAÍDA E ENCERRAMENTO (Skills 11-14)
(11, 'Revisão de progresso e reforço de autoeficácia', 'consolidacao', 4,
 'Resgatar conquistas, nomear aprendizados e reforçar a capacidade do paciente de mudar.',
 'Consolida mudança e dá sentido à jornada. Previne desvalorização do próprio progresso.',
 'O terapeuta resgata conquistas específicas, conecta a esforços do paciente, reforça autoeficácia.',
 1),

(12, 'Treino de autocompaixão e aceitação', 'consolidacao', 4,
 'Introduzir compaixão por si mesmo de modo prático, reduzindo autojulgamento.',
 'Reduz autojulgamento severo que mantém ciclos de sofrimento. Previne recaídas emocionais.',
 'Treina falar consigo mesmo como falaria com amigo. Normaliza imperfeição humana.',
 2),

(13, 'Prevenção de recaída e plano de manutenção', 'consolidacao', 4,
 'Planejar sinais de alerta, estratégias pessoais e quando buscar ajuda novamente.',
 'Mantém ganhos após alta. Recaída é natural, mas pode ser gerenciada.',
 'Planeja com o paciente: sinais de alerta, estratégias testadas, quando retornar à terapia.',
 3),

(14, 'Trabalho de encerramento (luto terapêutico saudável)', 'consolidacao', 4,
 'Fechar o ciclo terapêutico, nomear o fim, acolher emoções e simbolizar conquista.',
 'Fecha o ciclo, reforça autonomia, permite elaboração da separação terapêutica.',
 'O terapeuta nomeia o fim, acolhe as emoções associadas, celebra a jornada.',
 4),

-- 💎 FASE TRANSVERSAL — METACOMPETÊNCIAS DO TERAPEUTA (Skill 15)
(15, 'Presença terapêutica e autorregulação do terapeuta', 'metacompetencias', 1,
 'Manter mente aberta, corpo presente e emoção estável. Base invisível que sustenta todas as técnicas.',
 'Sem presença e autorregulação emocional, toda técnica perde potência. É a base de tudo.',
 'Terapeuta está presente (não distraído), regula próprias emoções, tolera silêncio e ambiguidade.',
 1);

-- 3️⃣ CRIAR TABELA DE PROGRESSO POR HABILIDADE
CREATE TABLE IF NOT EXISTS user_skill_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  skill_id INTEGER NOT NULL REFERENCES skills(id),
  times_practiced INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMP,
  avg_performance DECIMAL(3,2) DEFAULT 0.00, -- 0.00 a 1.00
  mastery_level TEXT DEFAULT 'novice', -- 'novice', 'developing', 'competent', 'proficient', 'expert'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- 4️⃣ ADICIONAR COLUNA skill_id NA TABELA journey_sessions
ALTER TABLE journey_sessions
ADD COLUMN IF NOT EXISTS skill_id INTEGER REFERENCES skills(id);

-- 5️⃣ CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_skills_module ON skills(module);
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_user ON user_skill_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_skill ON user_skill_progress(skill_id);
CREATE INDEX IF NOT EXISTS idx_journey_sessions_skill ON journey_sessions(skill_id);

-- 6️⃣ COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE skills IS 'As 15 Habilidades Nucleares da TCC Clínica organizadas em 5 módulos';
COMMENT ON TABLE user_skill_progress IS 'Tracking de progresso do usuário em cada habilidade específica';
COMMENT ON COLUMN journey_sessions.skill_id IS 'Habilidade principal treinada nesta sessão';
COMMENT ON COLUMN user_skill_progress.mastery_level IS 'Níveis: novice < developing < competent < proficient < expert';

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================
