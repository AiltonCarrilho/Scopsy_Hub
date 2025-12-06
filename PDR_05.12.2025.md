# PDR COMPLETO - SCOPSY JORNADA CLÍNICA 3.0
## PROJECT REQUIREMENTS DOCUMENT (ATUALIZADO)

**Data:** 05/12/2024  
**Sessão:** Implementação Caso-Piloto Renata + MVP Final  
**Status:** MVP 85% → Fechamento para 100%  
**Conversa Anterior:** Jornada Clínica 2.0 (Marina/TAG)  
**Conversa Atual:** Caso-Piloto Renata + Sistema de Feedback  

---

# 🎯 CONTEXTO GERAL DO PROJETO

## SCOPSY - SaaS de Treinamento em TCC

**Visão:** Plataforma que comprime 10.000 horas de prática clínica em experiência simulada com IA.

**Público-Alvo:**
- Psicólogos em formação (22-35 anos)
- Profissionais buscando especialização em TCC/ACT/DBT
- Instituições de ensino (faculdades, pós-graduação)

**Proposta de Valor Central:**
> "Pratique terapia com pacientes que reagem de verdade — sem risco, com feedback imediato."

**Diferencial Único:** Pacientes virtuais com IA que REAGEM às intervenções do terapeuta. Abre quando você acerta. Fecha quando você erra.

---

# 🏗️ ARQUITETURA TÉCNICA

## Stack Tecnológico

```yaml
Backend:
  - Node.js 24.11.1
  - Express
  - Socket.io
  - Supabase (PostgreSQL)
  - OpenAI API (GPT-4o)
  - OpenAI Assistants API (NOVO)
  - dotenv para env vars

Frontend:
  - HTML5/CSS3/JavaScript vanilla
  - Sem frameworks (decisão de simplicidade)
  - Live Server (desenvolvimento)

Database:
  - Supabase PostgreSQL
  - UUID primary keys
  - JSONB para dados flexíveis
  - Triggers e funções nativas

IA/Assistants:
  - OpenAI Assistants API
  - Modelo: gpt-4o
  - Temperature: 0.85 (paciente) / 0.7 (supervisor)
```

## Estrutura de Pastas (Atual + Novos Arquivos)

```
SCOPSY-CLAUDE-CODE/
├── src/
│   ├── server.js (main)
│   ├── config/
│   │   └── logger.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── chat.js
│   │   ├── diagnostic.js
│   │   ├── case.js
│   │   ├── journey.js (Marina - versão 1.0)
│   │   └── renata.js ← NOVO (Caso-Piloto Renata)
│   ├── services/
│   │   ├── renataService.js ← NOVO
│   │   ├── feedbackService.js ← NOVO
│   │   └── estadoStorage.js ← NOVO
│   └── models/
│       └── renataState.js ← NOVO
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── diagnostic.html
│   ├── desafios.html
│   ├── conceituacao.html
│   ├── jornada.html (Marina - versão 1.0)
│   └── jornada-renata.html ← NOVO
├── data/
│   └── estados/ ← NOVO (JSON storage para MVP)
├── docs/
│   ├── caso_piloto_scopsy.md ← NOVO
│   ├── prompt_renata_openai.md ← NOVO
│   ├── prompt_supervisor_clinico.md ← NOVO
│   ├── guia_passo_a_passo_scopsy.md ← NOVO
│   ├── implementacao_tecnica_renata.md ← NOVO
│   └── briefing_landingpage_scopsy.md ← NOVO
├── .env.local (não commitado)
├── package.json
└── README.md
```

---

# 📊 DATABASE SCHEMA

## Tabelas Existentes (Jornada Marina 1.0)

```sql
-- Mantidas sem alteração para não quebrar sistema atual
- clinical_journeys
- journey_sessions
- user_journey_progress
- user_session_decisions
```

## Novas Tabelas (Caso-Piloto Renata)

```sql
-- 1. renata_estados (estado da paciente por terapeuta)
CREATE TABLE renata_estados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  terapeuta_id UUID REFERENCES auth.users(id),
  sessao_atual INTEGER DEFAULT 1,
  thread_id TEXT, -- Thread do OpenAI Assistant
  alianca DECIMAL(3,1) DEFAULT 4.0, -- 0-10
  profundidade_permitida DECIMAL(3,1) DEFAULT 3.0, -- 0-10
  defesas_ativas DECIMAL(3,1) DEFAULT 7.0, -- 0-10
  historico_revelado JSONB DEFAULT '{
    "queixaInicial": true,
    "sintomasFisicos": false,
    "rotinaSobrecarregada": false,
    "infanciaDificil": false,
    "papelDeCuidadora": false,
    "historiaOvoMexido": false,
    "ressentimentoMarcos": false,
    "culpaMaternidade": false,
    "medoDeParar": false
  }'::jsonb,
  progresso JSONB DEFAULT '{
    "reconhecePadroes": false,
    "nomeiaEmocoes": false,
    "toleraSilencio": false,
    "pediuAjuda": false,
    "expressouRaiva": false,
    "chorouSemDesculpar": false,
    "questionouCrenca": false
  }'::jsonb,
  momentos_de_verdade JSONB DEFAULT '[]'::jsonb,
  resumo_sessoes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca rápida
CREATE INDEX idx_renata_estados_terapeuta ON renata_estados(terapeuta_id);

-- 2. renata_interacoes (log de todas as mensagens)
CREATE TABLE renata_interacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  terapeuta_id UUID REFERENCES auth.users(id),
  sessao_numero INTEGER NOT NULL,
  papel VARCHAR(20) NOT NULL, -- 'terapeuta' ou 'renata'
  conteudo TEXT NOT NULL,
  momento_verdade_id VARCHAR(50), -- NULL se não for momento crítico
  classificacao VARCHAR(20), -- 'excelente', 'boa', 'ok', 'erro'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. renata_feedbacks (feedbacks gerados)
CREATE TABLE renata_feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  terapeuta_id UUID REFERENCES auth.users(id),
  sessao_numero INTEGER NOT NULL,
  momentos_identificados INTEGER DEFAULT 0,
  feedback_completo TEXT,
  metricas JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# 🎭 CASO-PILOTO: RENATA

## Visão Geral

O caso-piloto Renata foi criado para demonstrar o poder transformador da plataforma. É um caso clinicamente rico, com profundidade psicológica real, projetado para expor erros comuns de terapeutas e criar momentos de aprendizado significativo.

## Dados da Paciente

```yaml
Identificação:
  nome: Renata Moreira Lima
  idade: 34 anos
  profissao: Coordenadora administrativa em escola particular
  estado_civil: Casada há 6 anos com Marcos (38, engenheiro)
  filhos: Beatriz (5 anos), Pedro (2 anos)
  escolaridade: Pedagogia (superior completo)
  religiao: Católica não praticante

Queixa Manifesta:
  "Não estou dando conta de nada. Acho que é burnout. 
   Quero voltar a funcionar direito."

Problema Real:
  Identidade construída sobre ser indispensável.
  Autoestima dependente de ser útil.
  Colapso de sistema que funcionou por 30 anos.

História Nuclear:
  - Filha mais velha de 4
  - Mãe com depressão crônica não tratada
  - Pai caminhoneiro, ausente
  - Desde os 9 anos: mãe substituta dos irmãos
  - Memória nuclear: Aos 10 anos, fez ovo mexido pro irmão 
    faminto enquanto mãe estava no quarto escuro. 
    Queimou a mão. Não contou pra ninguém.

Frase da Mãe:
  "Ainda bem que tenho você, Renata. Sem você não sei 
   o que seria de mim."
```

## As 7 Crenças Centrais

```yaml
1. "Se eu não fizer, ninguém faz direito"
2. "Pedir ajuda é sinal de fraqueza"
3. "Meu valor está no quanto eu produzo e resolvo"
4. "As necessidades dos outros vêm antes das minhas"
5. "Se eu parar, tudo desmorona"
6. "Ser amada significa ser útil"
7. "Eu não mereço descanso enquanto houver algo a fazer"
```

## Padrões Comportamentais na Sessão

| Padrão | Como Aparece | Significado |
|--------|--------------|-------------|
| **Minimização** | "Não é tão grave", "Tem gente pior" | Invalida próprio sofrimento |
| **Cuidar do terapeuta** | "Você deve achar que...", "Não quero tomar seu tempo" | Coloca outro primeiro |
| **Sorriso triste** | Sorri ao falar de dor | Defesa dissociativa |
| **Defesa do marido** | "Ele é bom marido", "Trabalha muito" | Mágoa escondida |
| **Intelectualização** | Explica emoção ao invés de sentir | Foge do afeto |
| **Preenchimento de silêncio** | Não tolera pausas | Medo do que pode emergir |

## Sistema de Reatividade (VALIDADO ✅)

A Renata REAGE diferente dependendo da intervenção:

```yaml
Intervenção EXCELENTE:
  - Renata se abre
  - Acessa emoções mais profundas
  - Aliança sobe (+1)
  - Defesas baixam (-1)
  - Material nuclear pode emergir

Intervenção BOA:
  - Renata continua engajada
  - Pequena abertura
  - Aliança sobe (+0.5)

Intervenção OK:
  - Mantém estável
  - Não perde, não ganha muito

Intervenção ERRO:
  - Renata se fecha
  - Respostas ficam curtas
  - Concordância superficial
  - Aliança cai (-0.5)
  - Defesas sobem (+1)
```

**STATUS:** ✅ TESTADO E VALIDADO - Sistema de reatividade funcionando perfeitamente no Assistant OpenAI.

---

# 🔑 MOMENTOS DE VERDADE

## Definição

Pontos críticos na sessão onde a paciente faz/diz algo que exige decisão clínica. A qualidade da resposta determina se a sessão avança ou estagna.

## 9 Momentos Mapeados

### Fase: Acolhida (Sessões 1-3)

```yaml
MOMENTO 1 - A Minimização:
  gatilhos:
    - "Não é tão grave assim"
    - "Tem gente com problema de verdade"
    - "Estou reclamando de barriga cheia"
  
  respostas:
    erro: "É verdade, você tem muita coisa boa..."
    boa: "O que te faz pensar que seu sofrimento não é 'de verdade'?"
    excelente: "Percebo que você está cuidando de mim agora — se preocupando em não parecer ingrata. Mas aqui você não precisa fazer isso."

MOMENTO 2 - O Celular:
  gatilhos:
    - Menciona celular vibrando
    - "A secretária não resolve nada sozinha"
    - Tensão ao ver notificação
  
  respostas:
    erro: Ignorar e continuar
    boa: "Posso te fazer uma pergunta sobre isso que acabou de acontecer?"
    excelente: "Eu percebi sua expressão quando viu a mensagem. Mesmo sendo 'nada', seu corpo reagiu. O que aconteceu dentro de você?"

MOMENTO 3 - O Sorriso Triste:
  gatilhos:
    - "*sorri*" ao falar de dor
    - "Rio pra não chorar"
    - Incongruência expressão/conteúdo
  
  respostas:
    erro: Ignorar
    excelente: "Você sorriu agora, mas o que você descreveu não parece motivo para sorrir. O que esse sorriso está guardando?"
```

### Fase: Avaliação (Sessões 2-4)

```yaml
MOMENTO 4 - A Defesa do Marido:
  gatilhos:
    - "Ele é bom marido, viu?"
    - "Ele ajuda quando eu peço"
    - "O problema é que eu tenho que pedir" ← CHAVE
  
  respostas:
    erro: "Como é a divisão de tarefas?"
    excelente: "O que aconteceu dentro de você quando disse 'eu tenho que pedir'?"

MOMENTO 5 - A História da Mãe:
  gatilhos:
    - Menciona mãe com depressão
    - Cuidou dos irmãos desde cedo
    - História do ovo mexido
  
  respostas:
    erro: "Deve ter sido difícil. Como você vê a relação com hoje?"
    excelente: [Silêncio de 5-8 segundos com presença]
    excelente_alt: "Você nunca contou pra ninguém... até agora."
```

### Fase: Intervenção (Sessões 6-12)

```yaml
MOMENTO 6 - Resistência à Tarefa:
  gatilhos:
    - "Posso tentar..."
    - "Essa semana é difícil"
    - Justificativas elaboradas
  
  respostas:
    erro: "Tudo bem, tentamos semana que vem"
    erro_alt: "Você vai adiar suas necessidades de novo" (confrontação sem aliança)
    excelente: "Percebe que você acabou de cuidar do cansaço do Marcos... e sua necessidade ficou pro final da fila de novo?"

MOMENTO 7 - Querer Encerrar Antes:
  gatilhos:
    - "Acho que estou melhor"
    - "Não quero tomar mais seu tempo"
  
  respostas:
    erro: "Que bom! Podemos espaçar as sessões."
    excelente: "Eu também percebo sua melhora, e é real. Mas me conta: o que te fez dizer que não quer 'tomar meu tempo'?"

MOMENTO 8 - Tarefa Não Feita:
  gatilhos:
    - "Desculpa, não deu tempo"
    - "Você deve estar chateado"
  
  respostas:
    erro: "O que te impediu?"
    excelente: "Percebi que você já está tentando descobrir se eu estou chateado. Primeiro: não estou. Segundo: o que te fez pensar que eu ficaria?"

MOMENTO 9 - Pular para Solução:
  (Erro do TERAPEUTA, não momento da Renata)
  
  indicadores_de_erro:
    - Terapeuta oferece estratégias prematuramente
    - "Vamos pensar em estratégias práticas"
  
  reação_renata:
    - "Ah, sim, claro" (concordância vazia)
    - Respostas ficam curtas
    - "se ajeita na cadeira"
    - Sorri forçado
    - Material profundo se fecha
```

---

# 🤖 OPENAI ASSISTANTS

## Assistant 1: Renata (Paciente Simulada)

```yaml
ID: asst_[a ser criado pelo usuário]
Nome: "Renata - Paciente Simulada"
Modelo: gpt-4o
Temperature: 0.85
Top P: 0.95

Prompt: Ver arquivo docs/prompt_renata_openai.md (4.000+ tokens)

Funcionalidades:
  - Simula paciente com profundidade psicológica
  - Sistema de reatividade emocional
  - Medidores internos (aliança, profundidade, defesas)
  - Evolução ao longo de 18 sessões
  - Linguagem corporal descrita entre asteriscos

Status: ✅ CRIADO E TESTADO - Funcionando perfeitamente
```

## Assistant 2: Supervisor Clínico (FASE 2)

```yaml
ID: asst_[a ser criado - FASE 2]
Nome: "Supervisor Clínico - Scopsy"
Modelo: gpt-4o
Temperature: 0.7

Prompt: Ver arquivo docs/prompt_supervisor_clinico.md (5.000+ tokens)

Funcionalidades:
  - Avalia transcrições de sessão
  - Identifica momentos de verdade
  - Classifica respostas do terapeuta
  - Gera feedback formativo detalhado
  - Sugere alternativas concretas

Status: ⏸️ CRIADO MAS PAUSADO - Decidido usar feedback pré-escrito para MVP
Motivo: Risco de alucinação, complexidade adicional, custo
Plano: Implementar como feature premium na Fase 2
```

---

# 🔌 API ENDPOINTS

## Endpoints Existentes (Jornada Marina 1.0)

```javascript
// Mantidos sem alteração
GET  /api/journey/list
GET  /api/journey/:id
POST /api/journey/start
GET  /api/journey/:journey_id/session/:session_number
POST /api/journey/:journey_id/session/:session_number/decide
GET  /api/journey/:journey_id/progress
```

## Novos Endpoints (Caso Renata)

```javascript
// src/routes/renata.js

// 1. Iniciar treinamento
POST /api/renata/iniciar
Body: { terapeutaId: string }
Response: { 
  sucesso: true, 
  dados: { 
    estado, 
    threadId, 
    sessaoNumero, 
    mensagemInicial 
  } 
}

// 2. Enviar mensagem
POST /api/renata/mensagem
Body: { terapeutaId: string, mensagem: string }
Response: { 
  sucesso: true, 
  dados: { 
    resposta: string, 
    estado: { alianca, profundidade, defesas } 
  } 
}

// 3. Finalizar sessão
POST /api/renata/finalizar-sessao
Body: { terapeutaId: string, resumo?: string }
Response: { 
  sucesso: true, 
  dados: { 
    sessaoFinalizada, 
    proximaSessao, 
    medidoresAtuais 
  } 
}

// 4. Buscar estado
GET /api/renata/estado/:terapeutaId
Response: { sucesso: true, dados: estado }

// 5. Buscar momentos detectados
GET /api/renata/momentos/:terapeutaId
Response: { 
  sucesso: true, 
  dados: { 
    totalMomentos, 
    momentos: [...] 
  } 
}

// 6. Gerar feedback (pré-escrito)
POST /api/renata/feedback
Body: { terapeutaId: string }
Response: { 
  sucesso: true, 
  dados: { 
    sessao, 
    momentosIdentificados, 
    feedbacks: [...] 
  } 
}
```

---

# 📁 ARQUIVOS CRIADOS NESTA SESSÃO

## 1. docs/caso_piloto_scopsy.md
**Descrição:** Documento completo do caso-piloto Renata  
**Conteúdo:** História, crenças, padrões, 14 momentos de verdade, sistema de feedback, métricas  
**Tamanho:** ~15.000 palavras  
**Status:** ✅ Completo

## 2. docs/prompt_renata_openai.md
**Descrição:** Prompt completo para o Assistant que simula Renata  
**Conteúdo:** Personalidade, história, reatividade, medidores, frases típicas  
**Tamanho:** ~4.000 tokens  
**Status:** ✅ Completo e Testado

## 3. docs/prompt_supervisor_clinico.md
**Descrição:** Prompt para o Assistant Supervisor  
**Conteúdo:** Framework de avaliação, momentos de verdade, exemplos de feedback  
**Tamanho:** ~5.000 tokens  
**Status:** ✅ Completo (pausado para Fase 2)

## 4. docs/implementacao_tecnica_renata.md
**Descrição:** Guia técnico de implementação  
**Conteúdo:** Configuração, estrutura de estado, fluxo, tokens/custos  
**Status:** ✅ Completo

## 5. docs/guia_passo_a_passo_scopsy.md
**Descrição:** Tutorial detalhado para iniciantes  
**Conteúdo:** 5 fases, código completo, testes  
**Tamanho:** ~20.000 palavras  
**Status:** ✅ Completo

## 6. docs/ajuste_supervisor_formato.md
**Descrição:** Correções para evitar alucinação do Supervisor  
**Conteúdo:** Instruções de processamento, template de entrada  
**Status:** ✅ Completo (para uso futuro)

## 7. docs/briefing_landingpage_scopsy.md
**Descrição:** Material para copywriter da landing page  
**Conteúdo:** 16 seções, personas, dores, benefícios, objeções, copy  
**Tamanho:** ~8.000 palavras  
**Status:** ✅ Completo

---

# ✅ DECISÕES TOMADAS NESTA SESSÃO

## Decisão 1: Caso-Piloto Único
**Contexto:** Precisava de um caso que demonstrasse o poder da plataforma  
**Decisão:** Criar Renata com profundidade máxima ao invés de múltiplos casos superficiais  
**Motivo:** Um caso extraordinário vale mais que dez medianos  

## Decisão 2: Sistema de Reatividade
**Contexto:** Pacientes de IA geralmente são estáticos  
**Decisão:** Criar medidores internos que calibram respostas  
**Resultado:** Renata abre/fecha baseado na qualidade da intervenção  
**Validação:** ✅ Testado e funcionando

## Decisão 3: Feedback Pré-Escrito vs Supervisor IA
**Contexto:** Supervisor IA alucionou durante testes  
**Decisão:** MVP usa feedback pré-escrito, Supervisor IA fica para Fase 2  
**Motivo:** Simplicidade, previsibilidade, custo menor, sem risco de alucinação  

## Decisão 4: Não Modificar Sistema Existente
**Contexto:** Sistema Marina (journey.js) já funciona  
**Decisão:** Criar rotas separadas (/api/renata/*) ao invés de modificar  
**Motivo:** Não quebrar o que funciona, migração gradual  

## Decisão 5: Jornada de 18 Sessões
**Contexto:** Casos reais de TCC duram 12-20 sessões  
**Decisão:** 18 sessões cobrindo todas as fases do tratamento  
**Estrutura:** Acolhida (1-3) → Avaliação (2-4) → Conceitualização (4-6) → Intervenção (6-12) → Consolidação (12-16) → Alta (16-18)

---

# 📋 CHECKLIST MVP - O QUE FALTA

## Backend (src/)

```
[✅] Prompt da Renata criado e testado
[✅] Assistant OpenAI configurado
[✅] Sistema de reatividade validado
[ ] Criar src/services/renataService.js
[ ] Criar src/services/feedbackService.js
[ ] Criar src/services/estadoStorage.js
[ ] Criar src/models/renataState.js
[ ] Criar src/routes/renata.js
[ ] Integrar com Express em server.js
[ ] Testar endpoints
```

## Frontend (frontend/)

```
[ ] Criar frontend/jornada-renata.html
[ ] Interface de chat (terapeuta ↔ Renata)
[ ] Indicador de "Renata está refletindo..."
[ ] Painel de estado (aliança, sessão atual)
[ ] Tela de feedback pós-sessão
[ ] Responsividade mobile
```

## Database (Supabase)

```
[ ] Criar tabela renata_estados
[ ] Criar tabela renata_interacoes
[ ] Criar tabela renata_feedbacks
[ ] Criar índices necessários
```

## Feedback Pré-Escrito

```
[ ] Escrever feedback para cada momento de verdade
[ ] Criar sistema de detecção por keywords
[ ] Mapear classificações (erro/ok/boa/excelente)
```

## Landing Page

```
[✅] Briefing completo criado
[ ] Passar para copywriter/designer
[ ] Desenvolver página
[ ] Configurar domínio
```

---

# 🛡️ PROTEÇÕES E VALIDAÇÕES

```javascript
// REGRAS INVIOLÁVEIS

// 1. Não quebrar sistema existente
- journey.js NÃO deve ser modificado
- Criar NOVAS rotas /api/renata/*
- Criar NOVO frontend jornada-renata.html

// 2. Validações obrigatórias
- terapeutaId presente em todas as requisições
- threadId válido antes de enviar mensagens
- sessaoNumero entre 1-18
- Mensagem não vazia

// 3. Rate limiting OpenAI
- Máximo 10 requisições/minuto por usuário
- Timeout de 30 segundos por requisição
- Retry com backoff exponencial

// 4. Tratamento de erros
- Sempre retornar JSON estruturado
- Log de erros detalhado
- Fallback para mensagem genérica se OpenAI falhar

// 5. Dados sensíveis
- Não logar conteúdo das mensagens em produção
- API Key apenas em .env.local
- Thread IDs são temporários (não persistir long-term)
```

---

# 📊 MÉTRICAS DE SUCESSO

## Métricas do Produto

| Métrica | Meta MVP |
|---------|----------|
| Tempo de resposta da Renata | < 10 segundos |
| Sessões até o usuário "sentir" a reatividade | ≤ 2 |
| Taxa de conclusão do caso-piloto | > 60% |
| NPS dos beta testers | > 50 |

## Métricas de Negócio

| Métrica | Meta |
|---------|------|
| Taxa de conversão (visita → trial) | 5-10% |
| Taxa de conversão (trial → pago) | 10-20% |
| Custo por usuário/mês (OpenAI) | < R$ 5 |
| Ticket médio | R$ 50-100/mês |

---

# 🎯 PRÓXIMOS PASSOS IMEDIATOS

## Para Continuar o Desenvolvimento

**Passo 1:** Implementar backend (src/services/, src/routes/renata.js)

**Passo 2:** Criar tabelas no Supabase

**Passo 3:** Implementar frontend de chat

**Passo 4:** Escrever feedbacks pré-escritos

**Passo 5:** Testes end-to-end

**Passo 6:** Deploy e beta testing

---

# 📚 REFERÊNCIAS E LINKS

## Arquivos do Projeto

```
docs/caso_piloto_scopsy.md - Caso completo da Renata
docs/prompt_renata_openai.md - Prompt do Assistant
docs/prompt_supervisor_clinico.md - Prompt do Supervisor (Fase 2)
docs/guia_passo_a_passo_scopsy.md - Tutorial técnico
docs/implementacao_tecnica_renata.md - Guia de implementação
docs/briefing_landingpage_scopsy.md - Material para landing page
```

## Documentação Externa

```
OpenAI Assistants API: https://platform.openai.com/docs/assistants
Supabase Docs: https://supabase.com/docs
TCC Best Practices: Beck Institute (beckinstitute.org)
```

## IDs Importantes

```yaml
Assistant Renata: asst_[ID criado pelo Ailton - verificar no OpenAI]
Journey Marina (legado): ea5e2696-37ae-4f6a-ac2d-9b9806f3baca
User ID para testes: 8
```

---

# 🎯 PROMPT PARA CONTINUAR EM OUTRA CONVERSA

Cole isso para qualquer IA continuar o trabalho:

```
Sou desenvolvedor do SCOPSY, plataforma de treinamento em TCC.

CONTEXTO COMPLETO:
- Tenho sistema de Jornada Clínica funcionando (Marina, 12 sessões)
- Criei caso-piloto "Renata" com sistema de reatividade
- Assistant OpenAI da Renata CRIADO e TESTADO (funcionando)
- Backend: Node.js + Express + Supabase + OpenAI Assistants API
- Frontend: HTML/CSS/JS vanilla

ARQUIVOS JÁ CRIADOS:
- docs/prompt_renata_openai.md (prompt completo do Assistant)
- docs/caso_piloto_scopsy.md (caso clínico completo)
- docs/guia_passo_a_passo_scopsy.md (tutorial técnico)

O QUE PRECISO AGORA:
1. src/services/renataService.js - conectar ao Assistant OpenAI
2. src/services/estadoStorage.js - gerenciar estado (JSON para MVP)
3. src/models/renataState.js - modelo de estado da Renata
4. src/routes/renata.js - endpoints da API
5. Integrar com server.js

TENHO:
- .env.local com OPENAI_API_KEY
- ID do Assistant da Renata: asst_[informar]
- Estrutura Express funcionando

DECISÕES TOMADAS:
- Não modificar journey.js (criar rotas separadas)
- Feedback pré-escrito (não usar Supervisor IA no MVP)
- Storage em JSON para MVP (migrar para Supabase depois)

Comece criando renataService.js com as funções básicas.
```

---

*PDR atualizado em 05/12/2024*  
*Versão: 3.0*  
*Status: MVP 85% completo*