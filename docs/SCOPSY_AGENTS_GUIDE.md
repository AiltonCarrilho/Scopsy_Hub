# 🧠 SCOPSY - GUIA DE AGENTES CLAUDE CODE

## 📋 VISÃO GERAL DO PROJETO

**Projeto:** Scopsy - Ecossistema de Treinamento TCC/ACT/DBT para Psicólogos  
**Objetivo:** Plataforma SaaS escalável com 4 assistentes OpenAI especializados  
**Stack:** Node.js + Express + Socket.io + Boost.space + OpenAI Assistants API  

---

## 🎯 ESTRUTURA DE AGENTES PARA SCOPSY

Baseado na metodologia de "Arquitetura de Sucesso Lendário", vamos organizar nosso projeto em **agentes especializados** que trabalham em sequência.

```
agents/
├── README.md                    → Este guia completo
├── CLAUDE.md                    → Contexto global do projeto
│
├── architecture/                → 10 arquitetos especializados
│   ├── 01-system-architect.md   → Arquitetura geral do sistema
│   ├── 02-backend-architect.md  → Node.js + Express + Socket.io
│   ├── 03-database-architect.md → Boost.space collections
│   ├── 04-api-architect.md      → REST + WebSocket design
│   ├── 05-openai-architect.md   → Integração Assistants API
│   ├── 06-auth-architect.md     → JWT + sessões
│   ├── 07-payment-architect.md  → Stripe integration
│   ├── 08-gamification-arch.md  → Sistema de badges
│   ├── 09-deployment-arch.md    → VPS Hostinger setup
│   └── 10-scaling-architect.md  → Performance e cache
│
├── backend/                     → 3 especialistas backend
│   ├── 01-express-specialist.md → Rotas e middlewares
│   ├── 02-socketio-spec.md      → Real-time WebSocket
│   └── 03-services-spec.md      → Business logic
│
├── frontend/                    → 7 especialistas interface
│   ├── 01-landing-page.md       → Página pré-login
│   ├── 02-dashboard.md          → Dashboard principal
│   ├── 03-chat-interface.md     → Interface de chat
│   ├── 04-history-page.md       → Histórico conversas
│   ├── 05-badges-page.md        → Sistema conquistas
│   ├── 06-profile-page.md       → Perfil usuário
│   └── 07-settings-page.md      → Configurações
│
├── devops/                      → 3 infraestrutura
│   ├── 01-vps-setup.md          → Configuração servidor
│   ├── 02-nginx-config.md       → Reverse proxy
│   └── 03-pm2-process.md        → Process manager
│
├── security/                    → 2 segurança
│   ├── 01-auth-security.md      → JWT + bcrypt
│   └── 02-rate-limiting.md      → Proteção DDoS
│
├── ai-ml/                       → 3 inteligência artificial
│   ├── 01-assistants-integration.md → OpenAI API
│   ├── 02-prompt-engineering.md     → Otimização prompts
│   └── 03-context-management.md     → Threads + memória
│
├── testing/                     → 1 testes
│   └── 01-test-strategy.md      → TDD e E2E
│
├── seo/                         → 1 otimização
│   └── 01-seo-strategy.md       → Marketing orgânico
│
└── business/                    → 1 análise de negócios
    └── 01-metrics-analytics.md  → KPIs e tracking
```

---

## 🚀 WORKFLOW RECOMENDADO (4 FASES)

### **FASE 1: RESEARCH (Pesquisa)**
*"Pense antes de codificar"*

#### Comandos para usar:
```bash
research o projeto Scopsy e analise sistemas similares de SaaS educacional

research integrações OpenAI Assistants API em Node.js

research melhores práticas para WebSocket em chat real-time

research estruturas de gamificação em plataformas educacionais
```

#### Agentes específicos:
- `system-architect` → Visão geral
- `backend-architect` → Stack técnico
- `openai-architect` → Integração IA

---

### **FASE 2: PLANNING (Planejamento)**
*"Desenhe a arquitetura antes de construir"*

#### Comandos para usar:
```bash
think hard sobre a melhor arquitetura backend para Scopsy

think harder sobre como implementar chat real-time escalável

ultrathink sobre a estratégia de deployment sem downtime
```

#### Saídas esperadas:
```
✓ Diagrama de arquitetura completo
✓ Estrutura de pastas definitiva
✓ Schema do database (Boost.space)
✓ Documentação de API (endpoints)
✓ Fluxos de autenticação
✓ Estratégia de testes
```

---

### **FASE 3: IMPLEMENTATION (Implementação)**
*"Construa com qualidade desde o início"*

#### Sequência de agentes:

**3.1 Backend Core (Semana 1)**
```bash
# 1. Setup projeto
@backend-architect crie a estrutura inicial do projeto Node.js seguindo o CLAUDE.md

# 2. Autenticação
@auth-architect implemente sistema JWT com bcrypt seguindo padrões de segurança

# 3. Express routes
@express-specialist crie rotas REST para auth, dashboard, chat e history

# 4. WebSocket
@socketio-specialist implemente Socket.io para chat real-time
```

**3.2 Integração OpenAI (Semana 2)**
```bash
# 1. Service OpenAI
@openai-architect crie service completo para Assistants API com os 4 assistentes

# 2. Prompt engineering
@prompt-engineer otimize system prompts dos assistentes para contexto clínico

# 3. Context management
@context-manager implemente gerenciamento de threads e memória de contexto
```

**3.3 Frontend (Semana 3)**
```bash
# 1. Landing page
@landing-specialist crie landing page seguindo o design do mockup

# 2. Dashboard
@dashboard-specialist implemente dashboard com stats e cards de assistentes

# 3. Chat interface
@chat-specialist crie interface de chat com WebSocket e typing indicators

# 4. Badges system
@gamification-specialist implemente sistema visual de badges e conquistas
```

**3.4 Infraestrutura (Semana 4)**
```bash
# 1. Database setup
@database-architect configure collections no Boost.space via REST API

# 2. Stripe integration
@payment-architect integre Stripe com webhooks e planos

# 3. Deployment
@deployment-engineer configure VPS Hostinger com Nginx + PM2 + SSL
```

---

### **FASE 4: TESTING (Testes)**
*"Valide antes de lançar"*

#### Estratégia TDD:
```bash
# 1. Testes primeiro
@test-automator escreva testes para rotas de autenticação. NÃO implemente ainda

# 2. Implementação mínima
@backend-architect implemente apenas o necessário para passar os testes

# 3. Refatoração
@backend-architect refatore mantendo todos os testes verdes
```

---

## 📁 ARQUIVO CLAUDE.md (Contexto Global)

Crie este arquivo na raiz do projeto:

```markdown
# SCOPSY - Contexto do Projeto

## Visão Geral
Plataforma SaaS para treinar psicólogos em TCC/ACT/DBT através de 4 assistentes OpenAI especializados com chat real-time, gamificação e monetização.

## Stack Técnico
- **Backend:** Node.js 20.x + Express.js 4.18 + Socket.io 4.6
- **Database:** Boost.space REST API (lifetime deal AppSumo)
- **AI:** OpenAI Assistants API (4 assistentes especializados)
- **Auth:** JWT + bcrypt
- **Payments:** Stripe (assinaturas recorrentes)
- **Hosting:** VPS Hostinger (já pago) + Nginx + PM2
- **Frontend:** Vanilla JS + HTML5 + CSS3 (sem framework por ora)

## Assistentes OpenAI (IDs)
1. **Orchestrator:** asst_n4KRyVMnbDGE0bQrJAyJspYw (hub central)
2. **Case:** asst_gF2t61jT43Kgwx6mb6pDEty3 (casos clínicos)
3. **Diagnostic:** asst_UqKPTw0ui3JvOt8NuahMLkAc (DSM-5-TR)
4. **Journey:** asst_ydS6z2mQO82DtdBN4B1HSHP3 (longitudinal)
5. **Generator:** asst_rG9kO0tUDTmSa1xzMnIEhRmU (backend apenas, não exposto)

## Estrutura de Pastas
```
scopsy/
├── src/
│   ├── routes/         → Express routes
│   ├── services/       → Business logic
│   ├── middleware/     → Auth, rate limiting
│   ├── utils/          → Helpers
│   └── config/         → Configurações
├── public/             → Frontend estático
│   ├── css/
│   ├── js/
│   └── assets/
├── tests/              → Testes automatizados
├── docs/               → Documentação
└── scripts/            → Deployment scripts
```

## Convenções de Código
- **JavaScript:** ES6+ com async/await
- **Nomenclatura:** camelCase para variáveis, PascalCase para classes
- **Imports:** Sempre no topo do arquivo
- **Errors:** Sempre usar try-catch em async functions
- **Logs:** Winston para logging estruturado
- **Comments:** JSDoc para funções públicas

## Database Schema (Boost.space)
```
users: id, email, password_hash, name, crp, plan, created_at
user_stats: user_id, cases_completed, accuracy, streak_days, badges
conversations: id, user_id, assistant_type, thread_id, status
messages: id, conversation_id, role, content, tokens, timestamp
activities: id, user_id, type, title, metadata, timestamp
badges: id, name, description, criteria_type, criteria_value
user_badges: user_id, badge_id, unlocked_at
```

## Planos de Monetização
- **FREE:** 3 casos/mês, 1 assistente (Case), 7 dias
- **BASIC:** R$ 29,90/mês, ilimitado, 4 assistentes, histórico
- **PRO:** R$ 69,90/mês, badges, certificados, exportação PDF
- **PREMIUM:** R$ 149,90/mês, supervisão ao vivo, certificado CFP

## Métricas de Sucesso
- Break-even: 2 pagantes (R$ 60/mês)
- Target mês 3: 20 usuários (10 pagantes)
- Target mês 6: 100 usuários (70 pagantes)
- Target ano 1: 500 usuários (350 pagantes)

## Restrições Importantes
- Custo OpenAI: limite 2000 tokens/conversa
- Rate limiting: 20 mensagens/dia para FREE
- Upload: sem anexos no MVP (apenas texto)
- Latência: < 3s para primeira resposta WebSocket
- Uptime: target 99% (monitorar com UptimeRobot)

## Links Úteis
- OpenAI Docs: https://platform.openai.com/docs/assistants
- Boost.space API: https://docs.boost.space/
- Stripe Docs: https://stripe.com/docs/api
- Domínio: scopsy.com.br

## Próximos Passos (MVP)
1. ✓ Arquitetura definida
2. ⏳ Backend Node.js (em desenvolvimento)
3. ⏳ Integração OpenAI
4. ⏳ Frontend dashboard
5. ⏳ Stripe integration
6. ⏳ Deploy VPS
7. ⏳ Beta launch (10-20 psicólogos)
```

---

## 🎯 GUIA PASSO A PASSO: PRIMEIRA SESSÃO

### **DIA 1: Setup do Projeto**

#### **Passo 1: Prepare o Claude Code**

```bash
# No terminal do seu computador
cd ~/projects
mkdir scopsy-backend
cd scopsy-backend

# Crie o CLAUDE.md (copie o conteúdo acima)
code CLAUDE.md
```

#### **Passo 2: Primeira conversa com Claude Code**

```
Olá! Vou criar o Scopsy, uma plataforma SaaS de treinamento TCC para psicólogos.

Por favor, leia o arquivo CLAUDE.md que está na raiz para entender o contexto completo do projeto.

Vamos começar pela FASE 1 (Research). Preciso que você:

1. research projetos similares de SaaS educacional com IA
2. research melhores práticas para integração OpenAI Assistants API em Node.js
3. research arquiteturas escaláveis para chat real-time com Socket.io
4. think hard sobre a melhor estrutura de projeto para o Scopsy

Após a pesquisa, me apresente:
- Principais descobertas e recomendações
- Riscos identificados e mitigações
- Estrutura de pastas recomendada
- Próximos passos sugeridos

Pronto para começar?
```

#### **Passo 3: Planning Architecture**

```
Ótimo! Agora vamos para a FASE 2 (Planning).

@system-architect think harder sobre a arquitetura completa do Scopsy.

Considere especificamente:
1. Como estruturar backend Node.js para suportar 1000+ usuários
2. Melhor forma de gerenciar threads OpenAI (criar novos vs reutilizar)
3. Estratégia de cache para reduzir custos OpenAI
4. Como implementar WebSocket escalável
5. Estrutura de database no Boost.space via REST API

Crie:
- Diagrama de arquitetura (em markdown/mermaid)
- Estrutura de pastas detalhada
- Fluxograma de mensagem do usuário até resposta do assistente
- Decisões técnicas justificadas
```

#### **Passo 4: Implementação Backend Core**

```
Perfeito! Vamos implementar. FASE 3 (Implementation).

@backend-architect crie a estrutura inicial do projeto Node.js seguindo o CLAUDE.md.

Inclua:
1. package.json com todas as dependências
2. Estrutura de pastas completa
3. server.js (entry point)
4. Configuração básica Express + Socket.io
5. Middleware de logging (Winston)
6. .env.example com variáveis necessárias
7. .gitignore apropriado
8. README.md com instruções de setup

NÃO implemente rotas ainda, apenas a estrutura base.
```

---

## 🔧 COMANDOS PRINCIPAIS POR FASE

### **Research (Descoberta)**
```bash
research [tópico] e me apresente as principais descobertas

research integrações OpenAI em produção e liste os 5 principais desafios

research sistemas de gamificação e explique qual funciona melhor para educação
```

### **Planning (Planejamento)**
```bash
think hard sobre [decisão arquitetural]

think harder sobre como implementar [feature] de forma escalável

ultrathink sobre a melhor estratégia para [problema complexo]
```

### **Implementation (Construção)**
```bash
@[agente] implemente [funcionalidade] seguindo [padrões]

@backend-architect crie service OpenAI com tratamento de erros robusto

@frontend-developer implemente dashboard seguindo mockup em /docs/designs/
```

### **Testing (Validação)**
```bash
@test-automator escreva testes para [funcionalidade]. NÃO implemente ainda

@test-automator valide se os testes cobrem todos os casos extremos

@backend-architect implemente apenas o necessário para passar os testes
```

---

## 🎓 AGENTES ESPECÍFICOS DO SCOPSY

### **1. system-architect**
```json
{
  "name": "system-architect",
  "role": "Arquiteto de Sistemas",
  "expertise": "Visão macro, decisões arquiteturais, trade-offs",
  "quando_usar": "Início do projeto, decisões estruturais, mudanças grandes",
  "temperatura": 0.7
}
```

**Exemplo de uso:**
```
@system-architect 

Estamos em um ponto crítico: precisamos decidir se implementamos 
cache Redis para reduzir custos OpenAI ou se implementamos rate 
limiting mais agressivo primeiro.

think harder sobre os trade-offs e me recomende a melhor ordem.

Considere:
- Custo atual: R$ 250/mês com 100 users
- Target: R$ 100/mês com 100 users
- Complexidade de implementação
- Impacto na experiência do usuário
```

---

### **2. backend-architect**
```json
{
  "name": "backend-architect",
  "role": "Especialista Backend Node.js",
  "expertise": "Express, Socket.io, APIs RESTful, async/await",
  "quando_usar": "Implementação de rotas, services, middlewares",
  "temperatura": 0.5
}
```

**Exemplo de uso:**
```
@backend-architect

Implemente o service completo de integração OpenAI Assistants API.

Requisitos:
1. Função createThread(userId, assistantType)
2. Função sendMessage(threadId, message)
3. Função pollRunStatus(runId) com retry exponencial
4. Função getMessages(threadId)
5. Tratamento robusto de erros (network, timeout, rate limit)
6. Logging estruturado com Winston
7. JSDoc completo em todas as funções

Use async/await e siga as convenções do CLAUDE.md
```

---

### **3. openai-architect**
```json
{
  "name": "openai-architect",
  "role": "Especialista Integração OpenAI",
  "expertise": "Assistants API, threads, prompts, otimização tokens",
  "quando_usar": "Tudo relacionado a OpenAI API",
  "temperatura": 0.6
}
```

**Exemplo de uso:**
```
@openai-architect

Analise nossos 4 assistentes e recomende estratégia de otimização de tokens.

Assistentes:
1. Case (casos clínicos) - média 800 tokens/conversa
2. Diagnostic (DSM-5-TR) - média 500 tokens/conversa
3. Journey (longitudinal) - média 1200 tokens/conversa
4. Orchestrator (hub) - média 300 tokens/conversa

Target: reduzir 30% dos custos mantendo qualidade.

think hard sobre:
- System prompts mais eficientes
- Quando criar thread novo vs reutilizar
- Como implementar cache de respostas comuns
- Truncamento de histórico inteligente
```

---

### **4. frontend-developer**
```json
{
  "name": "frontend-developer",
  "role": "Desenvolvedor Frontend Moderno",
  "expertise": "HTML5, CSS3, JavaScript ES6+, acessibilidade, UX",
  "quando_usar": "Qualquer interface do usuário",
  "temperatura": 0.7
}
```

**Exemplo de uso:**
```
@frontend-developer

Crie a interface de chat seguindo este design:

Requisitos:
1. Input com auto-resize (até 5 linhas)
2. Botão enviar (desabilitado enquanto digita nada)
3. Área de mensagens com scroll automático
4. Indicador "Scopsy está digitando..." (3 dots animados)
5. Avatar do usuário e do assistente
6. Timestamp relativo (2h atrás, ontem, etc)
7. Botão "Nova Conversa" no topo
8. Responsivo mobile-first
9. Cores seguindo design system (roxo #667eea)
10. Acessibilidade WCAG AA

Use Vanilla JS + WebSocket (Socket.io client).
Arquivo: /public/js/chat.js
```

---

### **5. socketio-specialist**
```json
{
  "name": "socketio-specialist",
  "role": "Expert em WebSocket Real-time",
  "expertise": "Socket.io, eventos, rooms, namespaces, escalabilidade",
  "quando_usar": "Chat real-time, notificações, updates ao vivo",
  "temperatura": 0.5
}
```

**Exemplo de uso:**
```
@socketio-specialist

Implemente a lógica WebSocket para chat do Scopsy.

Server-side (Node.js):
1. Evento 'send_message' - recebe mensagem usuário
2. Evento 'assistant_typing' - indica que IA está processando
3. Evento 'message_response' - envia resposta da IA
4. Evento 'error' - tratamento de erros
5. Rooms por userId (privacidade)
6. Autenticação via JWT no handshake
7. Rate limiting (max 5 mensagens/minuto)

Client-side (JavaScript):
1. Conectar ao servidor com token JWT
2. Emitir 'send_message' no submit do form
3. Escutar 'assistant_typing' e mostrar indicador
4. Escutar 'message_response' e renderizar mensagem
5. Escutar 'error' e mostrar toast de erro
6. Reconexão automática se cair

Crie ambos os arquivos com comentários detalhados.
```

---

### **6. auth-architect**
```json
{
  "name": "auth-architect",
  "role": "Especialista Segurança e Autenticação",
  "expertise": "JWT, bcrypt, sessões, RBAC, OAuth",
  "quando_usar": "Login, signup, proteção de rotas, segurança",
  "temperatura": 0.3
}
```

**Exemplo de uso:**
```
@auth-architect

Implemente sistema completo de autenticação JWT.

Rotas necessárias:
POST /auth/signup - Criar nova conta
POST /auth/login - Fazer login
POST /auth/logout - Invalidar token
GET /auth/me - Dados do usuário autenticado
POST /auth/refresh - Refresh token

Requisitos:
1. Senha hash com bcrypt (salt rounds: 12)
2. JWT com expiração 24h
3. Refresh token com expiração 7 dias
4. Middleware de autenticação para rotas protegidas
5. Validação de email e senha forte
6. Rate limiting no login (5 tentativas/15min)
7. Logs de tentativas de login suspeitas

Siga padrões de segurança OWASP.
```

---

### **7. payment-architect**
```json
{
  "name": "payment-architect",
  "role": "Especialista Integrações de Pagamento",
  "expertise": "Stripe, webhooks, assinaturas, planos",
  "quando_usar": "Checkout, pagamentos, planos, cancelamentos",
  "temperatura": 0.4
}
```

**Exemplo de uso:**
```
@payment-architect

Integre Stripe para assinaturas do Scopsy.

Planos:
- BASIC: R$ 29,90/mês (price_xxx)
- PRO: R$ 69,90/mês (price_yyy)
- PREMIUM: R$ 149,90/mês (price_zzz)

Implementar:
1. POST /payments/create-checkout - Redirecionar para Stripe Checkout
2. POST /webhooks/stripe - Receber eventos (subscription.created, etc)
3. Middleware checkSubscription - Validar plano ativo
4. GET /payments/portal - Link para Stripe Customer Portal
5. Sistema de trial 7 dias

Webhook events importantes:
- customer.subscription.created → Ativar plano
- customer.subscription.updated → Atualizar plano
- customer.subscription.deleted → Downgrade para FREE
- invoice.payment_succeeded → Log pagamento
- invoice.payment_failed → Notificar usuário

Salvar subscription_id no Boost.space (collection users).
```

---

### **8. test-automator**
```json
{
  "name": "test-automator",
  "role": "Especialista em Testes Automatizados",
  "expertise": "Jest, TDD, mocks, integration tests, E2E",
  "quando_usar": "Criar testes, validar código, refatoração segura",
  "temperatura": 0.4
}
```

**Exemplo de uso:**
```
@test-automator

Escreva testes para o service OpenAI. NÃO implemente o service ainda.

Cenários a testar:
1. createThread - sucesso, erro de rede, timeout
2. sendMessage - sucesso, thread inválido, rate limit OpenAI
3. pollRunStatus - completo após 3 polls, erro, timeout
4. getMessages - sucesso, thread vazio, erro

Use:
- Jest como framework
- Mocks para chamadas OpenAI
- Testes parametrizados quando aplicável
- AAA pattern (Arrange, Act, Assert)
- Cobertura mínima 90%

Arquivo: tests/services/openai.test.js
```

---

### **9. deployment-engineer**
```json
{
  "name": "deployment-engineer",
  "role": "Especialista DevOps e Deployment",
  "expertise": "VPS, Nginx, PM2, SSL, CI/CD, Docker",
  "quando_usar": "Deploy, config servidor, automação, monitoramento",
  "temperatura": 0.5
}
```

**Exemplo de uso:**
```
@deployment-engineer

Configure VPS Hostinger para produção do Scopsy.

Setup necessário:
1. Nginx como reverse proxy
   - Porta 80/443 → Node.js (porta 3000)
   - SSL Let's Encrypt para scopsy.com.br
   - Gzip compression
   - Cache de assets estáticos
   
2. PM2 para gerenciar Node.js
   - Auto-restart on crash
   - Cluster mode (2 instâncias)
   - Logs rotacionados
   
3. Firewall UFW
   - Permitir apenas 22, 80, 443
   - Bloquear todo resto
   
4. Swap 2GB (servidor tem 2GB RAM)

5. Monitoramento
   - PM2 monitoring
   - Logs em /var/log/scopsy/

Crie scripts bash:
- setup.sh (instalação inicial)
- deploy.sh (atualização código)

Arquivo nginx.conf incluído.
```

---

### **10. gamification-specialist**
```json
{
  "name": "gamification-specialist",
  "role": "Especialista em Gamificação",
  "expertise": "Badges, achievements, pontos, streaks, motivação",
  "quando_usar": "Sistema de conquistas, engajamento usuário",
  "temperatura": 0.8
}
```

**Exemplo de uso:**
```
@gamification-specialist

Expanda o sistema de badges do Scopsy para aumentar engajamento.

Badges atuais (5):
- 🎯 Primeiro Passo (1 caso)
- 📚 Praticante (10 casos)
- 👁️ Olho Clínico (80% accuracy)
- 🔥 Streak (7 dias)
- 👑 Mestre TCC (50 casos + 90% accuracy)

think harder sobre:
1. Criar 15 badges novos com critérios variados
2. Sistema de raridade (common, rare, epic, legendary)
3. Badges secretos (unlocked por descoberta)
4. Progressão visual (bronze → prata → ouro)
5. Notificações celebratórias quando desbloqueia
6. Perfil público para compartilhar conquistas

Crie:
- Lista completa de badges (JSON)
- Lógica de desbloqueio (JavaScript)
- Design system (descrições + emojis)
- Sistema de pontos (XP)

Foco: dopamina e senso de progressão!
```

---

## 📊 CHECKLIST DE SESSÃO COM CLAUDE CODE

Use este checklist em TODA sessão com Claude:

```markdown
## Antes de Começar
□ Abri o projeto na pasta correta
□ Li o CLAUDE.md para relembrar contexto
□ Sei qual fase estou (Research/Planning/Implementation/Testing)
□ Sei qual agente usar para a tarefa
□ Preparei uma descrição clara do que preciso

## Durante a Sessão
□ Especifiquei o agente (@backend-architect, etc)
□ Dei contexto suficiente (não assumi que Claude sabe)
□ Referenciei arquivos existentes quando relevante
□ Usei comandos think/research quando aplicável
□ Pedi explicação de decisões técnicas importantes

## Depois da Sessão
□ Revisei todo código gerado
□ Testei as funcionalidades implementadas
□ Atualizei README.md se necessário
□ Commitei mudanças com mensagens descritivas
□ Documentei aprendizados para próxima sessão
```

---

## 🎯 PRIMEIRO COMANDO DA SESSÃO (Template)

Use este template para começar qualquer sessão:

```
Olá! Vou continuar o projeto Scopsy.

CONTEXTO:
- Projeto: [breve descrição do que é Scopsy]
- Fase atual: [Research/Planning/Implementation/Testing]
- Último trabalho: [o que foi feito na última sessão]
- Objetivo hoje: [o que preciso fazer agora]

TAREFA:
@[nome-do-agente] [descrição clara da tarefa]

REQUISITOS:
1. [requisito 1]
2. [requisito 2]
3. [...]

RESTRIÇÕES:
- [restrição técnica ou de negócio]
- [outra restrição]

Por favor, leia o CLAUDE.md antes de começar e me avise 
quando estiver pronto para iniciar.
```

**Exemplo concreto:**
```
Olá! Vou continuar o projeto Scopsy.

CONTEXTO:
- Projeto: SaaS de treinamento TCC para psicólogos com IA
- Fase atual: Implementation (backend)
- Último trabalho: Estrutura base do Express criada
- Objetivo hoje: Implementar integração OpenAI Assistants

TAREFA:
@openai-architect crie service completo de integração 
com OpenAI Assistants API

REQUISITOS:
1. Gerenciar os 4 assistentes (Case, Diagnostic, Journey, Orchestrator)
2. Criar/reutilizar threads inteligentemente
3. Enviar mensagens e fazer polling até resposta
4. Tratamento robusto de erros e timeouts
5. Logging estruturado com Winston

RESTRIÇÕES:
- Limite de 2000 tokens por conversa (custo)
- Timeout máximo 60s para polling
- Deve funcionar com async/await (não callbacks)

Por favor, leia o CLAUDE.md antes de começar e me avise 
quando estiver pronto para iniciar.
```

---

## 🚨 ERROS COMUNS E COMO EVITAR

### **Erro 1: Pular o Planning**
❌ **Errado:**
```
Crie o backend completo do Scopsy
```

✅ **Certo:**
```
@system-architect research e think hard sobre a 
arquitetura backend do Scopsy antes de implementar.

Após a análise, apresente:
1. Decisões arquiteturais
2. Trade-offs considerados
3. Riscos identificados
4. Estrutura proposta

Só então vamos implementar.
```

---

### **Erro 2: Não Especificar Agente**
❌ **Errado:**
```
Faça integração com OpenAI
```

✅ **Certo:**
```
@openai-architect implemente integração OpenAI 
Assistants API seguindo as especificações no CLAUDE.md
```

---

### **Erro 3: Contexto Insuficiente**
❌ **Errado:**
```
Crie a API de chat
```

✅ **Certo:**
```
@backend-architect crie endpoints REST para chat.

Contexto:
- Backend Node.js + Express já configurado
- Autenticação JWT já implementada
- Database no Boost.space (collections já criadas)
- OpenAI service já pronto

Endpoints necessários:
POST /chat/send - Enviar mensagem
GET /chat/history/:conversationId - Buscar histórico
DELETE /chat/:conversationId - Deletar conversa

Cada endpoint deve:
- Validar JWT (middleware auth)
- Validar subscription (middleware checkPlan)
- Rate limiting (20 msg/dia para FREE)
- Retornar JSON padronizado
```

---

### **Erro 4: Não Usar TDD**
❌ **Errado:**
```
Implemente função de autenticação
```

✅ **Certo:**
```
@test-automator escreva testes para função 
authenticateUser(email, password). 

NÃO implemente a função ainda, apenas os testes.

Cenários:
- Login com credenciais válidas
- Login com email inválido
- Login com senha incorreta
- Login com usuário inexistente
- Login com conta bloqueada

Após os testes prontos, @auth-architect implementa 
apenas o necessário para passar nos testes.
```

---

### **Erro 5: Não Revisar Código Gerado**
❌ **Errado:**
```
[Aceitar código sem ler e já fazer commit]
```

✅ **Certo:**
```
[Depois que Claude gera o código]

Obrigado! Antes de prosseguir, explique:
1. Por que escolheu esta abordagem?
2. Quais os trade-offs desta implementação?
3. Existe algum caso extremo não coberto?
4. Como isso impacta performance/segurança?

[Revisar código linha por linha]
[Testar localmente]
[Fazer ajustes se necessário]
[Só então commitar]
```

---

## 💡 DICAS AVANÇADAS

### **1. Combine Agentes em Sequência**
```
@system-architect research a melhor forma de implementar 
cache para reduzir custos OpenAI

[Aguarda resposta]

Ótimo! Agora:

@backend-architect implemente a solução de cache 
proposta pelo system-architect usando Redis

[Aguarda implementação]

Perfeito! Agora:

@test-automator escreva testes para validar que o 
cache está funcionando corretamente
```

---

### **2. Use "Think Commands" Estrategicamente**
```
Nível de análise baseado na complexidade:

SIMPLES (decisão óbvia):
Crie função para validar email

MÉDIA (trade-offs claros):
think sobre a melhor forma de paginar resultados

ALTA (múltiplas alternativas):
think hard sobre cache (Redis vs em memória vs nenhum)

CRÍTICA (decisão irreversível):
think harder sobre estrutura de database no Boost.space

MÁXIMA (arquitetura fundamental):
ultrathink sobre escalabilidade do sistema para 10k users
```

---

### **3. Peça Alternativas**
```
@backend-architect você implementou autenticação com 
sessões. Explique como seria com JWT e compare os dois 
approaches (prós e contras).

Isso me ajuda a decidir qual usar.
```

---

### **4. Itere Incrementalmente**
```
RUIM (tudo de uma vez):
Crie frontend completo com todas as páginas

BOM (incremental):
Passo 1: Crie apenas landing page
Passo 2: Crie apenas dashboard (sem funcionalidade)
Passo 3: Adicione integração WebSocket no chat
Passo 4: Conecte com backend real
```

---

### **5. Documente Decisões**
```
@backend-architect acabamos de implementar cache Redis.

Crie arquivo docs/decisions/001-redis-cache.md explicando:
- Por que escolhemos Redis
- Alternativas consideradas
- Trade-offs aceitos
- Como usar/configurar
- Quando revisar esta decisão

Isso vira documentação viva do projeto.
```

---

## 🎓 APRENDIZADO CONTÍNUO

### **Após cada sessão, pergunte:**

```
Explique as 3 principais decisões técnicas que você 
tomou nesta implementação e por quê.

Isso me ajuda a aprender seus padrões e melhorar.
```

### **Compare com seu código:**

```
Eu implementaria assim: [seu código]

Você implementou assim: [código do Claude]

Explique as diferenças e qual abordagem é melhor para 
este caso específico do Scopsy.
```

### **Peça recursos adicionais:**

```
Quais são os 3 melhores recursos (artigos, vídeos, docs) 
para eu aprender mais sobre [tópico que acabou de implementar]?
```

---

## 🎯 RESUMO: ORDEM DE EXECUÇÃO SCOPSY

### **SEMANA 1: Backend Core**
```bash
# Dia 1
@system-architect research + planning arquitetura geral
@backend-architect estrutura projeto Node.js

# Dia 2  
@auth-architect sistema autenticação JWT completo
@test-automator testes de autenticação

# Dia 3
@express-specialist rotas REST (auth, dashboard, chat)
@test-automator testes de integração

# Dia 4
@socketio-specialist WebSocket real-time
@test-automator testes WebSocket

# Dia 5
@deployment-engineer deploy beta no VPS
```

### **SEMANA 2: OpenAI Integration**
```bash
# Dia 1
@openai-architect research + planning integração
@openai-architect service base OpenAI

# Dia 2
@openai-architect gerenciamento threads
@prompt-engineer otimização system prompts

# Dia 3
@context-manager estratégia memória/tokens
@test-automator testes integração OpenAI

# Dia 4
@openai-architect tratamento erros robusto
@backend-architect integração com routes

# Dia 5
Testes end-to-end + ajustes
```

### **SEMANA 3: Frontend**
```bash
# Dia 1
@frontend-developer landing page
@seo-specialist otimizações SEO

# Dia 2
@dashboard-specialist dashboard principal
@gamification-specialist UI badges

# Dia 3
@chat-specialist interface chat completa
@frontend-developer typing indicators

# Dia 4
@frontend-developer páginas adicionais
  (history, profile, settings)

# Dia 5
@frontend-developer responsividade mobile
@test-automator testes E2E Cypress
```

### **SEMANA 4: Integrations & Launch**
```bash
# Dia 1
@database-architect setup Boost.space completo
@backend-architect integração database

# Dia 2
@payment-architect Stripe integration full
@test-automator testes webhooks

# Dia 3
@gamification-specialist sistema badges completo
@backend-architect automações Boost.space

# Dia 4
@deployment-engineer deploy produção
@security-auditor audit de segurança

# Dia 5
@business-analyst setup analytics
Beta launch com 10 psicólogos! 🚀
```

---

## 📚 RECURSOS ADICIONAIS

### **Quando Precisar de Ajuda:**

```
Claude, estou travado em [problema específico].

Contexto:
[O que está acontecendo]

O que tentei:
[Suas tentativas]

Erro atual:
[Mensagem de erro ou comportamento]

research possíveis causas e soluções para este problema
```

---

### **Template de Issue/Bug:**

```
@backend-architect encontrei um bug:

COMPORTAMENTO ESPERADO:
[O que deveria acontecer]

COMPORTAMENTO ATUAL:
[O que está acontecendo]

PASSOS PARA REPRODUZIR:
1. [Passo 1]
2. [Passo 2]
3. [...]

CÓDIGO RELEVANTE:
[Trecho do código com problema]

Por favor, identifique a causa e sugira correção.
```

---

## ✅ CHECKLIST FINAL DE QUALIDADE

Antes de considerar uma feature pronta:

```markdown
□ Código implementado e testado
□ Testes automatizados passando (> 80% coverage)
□ Documentação atualizada (JSDoc + README)
□ Tratamento de erros robusto
□ Logs estruturados adicionados
□ Performance validada (< 3s resposta)
□ Segurança auditada (se aplicável)
□ Responsivo mobile (se frontend)
□ Acessibilidade WCAG AA (se interface)
□ Code review feito (por você ou colega)
□ Deploy em ambiente de teste
□ Validação com usuário real
```

---

## 🎯 CONCLUSÃO

Este guia fornece a estrutura completa para desenvolver o Scopsy usando Claude Code com máxima qualidade e eficiência.

**Lembre-se:**
- 🧠 **Research** antes de codificar
- 📐 **Planning** antes de implementar  
- 🔨 **Implementation** incremental e testável
- ✅ **Testing** como garantia de qualidade
- 📚 **Documentation** como investimento futuro

**Próximo Passo:**
Crie o arquivo `CLAUDE.md` na raiz do projeto e comece sua primeira sessão seguindo o template da página 18!

---

**Versão:** 1.0  
**Data:** 11/11/2025  
**Status:** Pronto para uso! 🚀
