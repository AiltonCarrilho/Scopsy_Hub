
# SCOPSY - Contexto do Projeto

## 🎯 Visão Geral
Plataforma SaaS educacional para treinar psicólogos em TCC/ACT/DBT através de 4 assistentes OpenAI especializados, com chat real-time, sistema de gamificação e monetização por assinaturas.

## 🏗️ Stack Técnico

### Backend
- **Runtime:** Node.js 20.x LTS
- **Framework:** Express.js 4.18
- **Real-time:** Socket.io 4.6
- **Auth:** JWT (jsonwebtoken) + bcrypt
- **Logging:** Winston
- **Validation:** Joi

### Database
- **Provider:** Boost.space (AppSumo lifetime deal)
- **Tipo:** REST API (não SQL tradicional)
- **Limite:** 50.000 operações/mês
- **Acesso:** HTTP requests via fetch/axios

### AI & ML
- **Provider:** OpenAI Assistants API
- **Model:** GPT-4 Turbo
- **4 Assistentes:**
  1. **Orchestrator** (asst_n4KRyVMnbDGE0bQrJAyJspYw) - Hub central
  2. **Case** (asst_gF2t61jT43Kgwx6mb6pDEty3) - Casos clínicos
  3. **Diagnostic** (asst_UqKPTw0ui3JvOt8NuahMLkAc) - DSM-5-TR training
  4. **Journey** (asst_ydS6z2mQO82DtdBN4B1HSHP3) - Follow-up longitudinal
- **Generator** (asst_rG9kO0tUDTmSa1xzMnIEhRmU) - Backend apenas, não exposto

### Pagamentos
- **Provider:** Stripe
- **Modelo:** Assinaturas recorrentes
- **Webhooks:** Gerenciar lifecycle subscriptions

### Infraestrutura
- **Hosting:** VPS Hostinger (já pago)
- **Web Server:** Nginx (reverse proxy)
- **Process Manager:** PM2 (cluster mode)
- **SSL:** Let's Encrypt (certbot)
- **Domain:** scopsy.com.br

### Frontend
- **Abordagem:** Vanilla JS + HTML5 + CSS3
- **Por quê?** Simplicidade MVP, sem overhead de framework
- **Futuro:** Migrar para React quando escalar
- **Bundler:** Nenhum por ora (direto no navegador)

## 📁 Estrutura do Projeto

```
scopsy/
├── src/
│   ├── server.js              → Entry point
│   ├── config/
│   │   ├── env.js             → Variáveis ambiente
│   │   ├── logger.js          → Winston config
│   │   └── database.js        → Boost.space client
│   ├── routes/
│   │   ├── auth.js            → POST /auth/signup, /login
│   │   ├── chat.js            → POST /chat/send, GET /chat/history
│   │   ├── dashboard.js       → GET /dashboard/stats
│   │   ├── payments.js        → POST /payments/checkout
│   │   └── webhooks.js        → POST /webhooks/stripe
│   ├── services/
│   │   ├── openai.js          → Integração Assistants API
│   │   ├── boostspace.js      → CRUD Boost.space
│   │   ├── badges.js          → Lógica gamificação
│   │   └── stripe.js          → Pagamentos
│   ├── middleware/
│   │   ├── auth.js            → JWT validation
│   │   ├── rateLimiter.js     → DDoS protection
│   │   ├── checkPlan.js       → Subscription validation
│   │   └── errorHandler.js    → Global error handler
│   ├── utils/
│   │   ├── validators.js      → Input validation
│   │   ├── helpers.js         → Funções auxiliares
│   │   └── constants.js       → Constantes do sistema
│   └── socket/
│       └── chatHandler.js     → WebSocket events
├── public/
│   ├── index.html             → Landing page
│   ├── dashboard.html         → Dashboard principal
│   ├── chat.html              → Interface chat
│   ├── css/
│   │   ├── main.css           → Estilos globais
│   │   ├── dashboard.css      → Dashboard específico
│   │   └── chat.css           → Chat específico
│   ├── js/
│   │   ├── auth.js            → Login/signup
│   │   ├── dashboard.js       → Dashboard logic
│   │   ├── chat.js            → Chat + WebSocket
│   │   └── utils.js           → Helpers frontend
│   └── assets/
│       ├── images/
│       └── icons/
├── tests/
│   ├── unit/                  → Testes unitários
│   ├── integration/           → Testes integração
│   └── e2e/                   → Testes ponta a ponta
├── docs/
│   ├── api.md                 → Documentação API
│   ├── architecture.md        → Diagramas sistema
│   └── deployment.md          → Guia deploy
├── scripts/
│   ├── setup.sh               → Instalação inicial VPS
│   └── deploy.sh              → Atualização código
├── .env.example               → Template variáveis
├── .gitignore
├── package.json
├── README.md
└── CLAUDE.md                  → Este arquivo
```

## 🗄️ Database Schema (Boost.space Collections)

### users
```javascript
{
  id: String,                    // UUID
  email: String (unique),        // Email validado
  password_hash: String,         // bcrypt hash
  name: String,                  // Nome completo
  crp: String (optional),        // CRP do psicólogo
  plan: Enum,                    // 'free', 'basic', 'pro', 'premium'
  stripe_customer_id: String,    // Stripe Customer ID
  subscription_status: String,   // 'active', 'canceled', 'past_due'
  trial_ends_at: DateTime,       // Data fim trial
  created_at: DateTime,
  updated_at: DateTime,
  last_login: DateTime
}
```

### user_stats
```javascript
{
  id: String,
  user_id: String (FK → users),
  cases_completed: Integer,      // Total casos finalizados
  practice_hours: Float,         // Horas de prática
  accuracy: Float,               // % precisão diagnóstica
  streak_days: Integer,          // Dias consecutivos
  last_activity: DateTime,       // Última atividade
  badges: Array[String],         // IDs badges desbloqueados
  xp_points: Integer,            // Pontos de experiência
  updated_at: DateTime
}
```

### conversations
```javascript
{
  id: String,
  user_id: String (FK → users),
  assistant_type: Enum,          // 'case', 'diagnostic', 'journey', 'orchestrator'
  assistant_id: String,          // OpenAI Assistant ID
  thread_id: String,             // OpenAI Thread ID
  title: String,                 // Título da conversa
  status: Enum,                  // 'active', 'archived', 'deleted'
  created_at: DateTime,
  updated_at: DateTime
}
```

### messages
```javascript
{
  id: String,
  conversation_id: String (FK → conversations),
  role: Enum,                    // 'user', 'assistant'
  content: Text,                 // Mensagem texto
  tokens_used: Integer,          // Tokens consumidos
  timestamp: DateTime
}
```

### activities
```javascript
{
  id: String,
  user_id: String (FK → users),
  type: Enum,                    // 'case_completed', 'badge_unlocked', etc
  title: String,                 // Título da atividade
  description: String,           // Descrição curta
  assistant_type: String,        // Qual assistente envolvido
  metadata: JSON,                // Dados adicionais
  timestamp: DateTime
}
```

### badges
```javascript
{
  id: String,
  name: String,                  // Nome do badge
  description: String,           // Descrição conquista
  icon: String,                  // Emoji ou URL ícone
  criteria_type: String,         // 'cases', 'accuracy', 'streak', etc
  criteria_value: Integer,       // Valor threshold
  rarity: Enum,                  // 'common', 'rare', 'epic', 'legendary'
  xp_reward: Integer,            // XP ao desbloquear
  created_at: DateTime
}
```

### user_badges
```javascript
{
  id: String,
  user_id: String (FK → users),
  badge_id: String (FK → badges),
  unlocked_at: DateTime,
  is_new: Boolean                // Se ainda não viu notificação
}
```

## 🎮 Sistema de Gamificação

### Badges Iniciais (15)

**COMMON (5)**
- 🎯 Primeiro Passo - Completou 1 caso (5 XP)
- 📚 Praticante Dedicado - Completou 10 casos (10 XP)
- 🧠 Curioso - Explorou 3 assistentes diferentes (10 XP)
- 💬 Conversador - Enviou 50 mensagens (15 XP)
- 📖 Estudioso - 5h de prática (20 XP)

**RARE (5)**
- 👁️ Olho Clínico - 80% precisão diagnóstica (50 XP)
- 🔥 Sequência de Fogo - 7 dias consecutivos (50 XP)
- 🎓 Expert Teórico - 30 insights registrados (75 XP)
- 💯 Perfeccionista - 95% precisão em 5 casos (100 XP)
- ⏰ Madrugador - 5 casos antes das 8h (40 XP)

**EPIC (3)**
- 👑 Mestre TCC - 50 casos + 90% precisão (200 XP)
- 🏆 Centurião - 100 casos completados (250 XP)
- 🌟 Consistente - 30 dias de sequência (300 XP)

**LEGENDARY (2)**
- 💎 Lenda Viva - 500 casos + 95% precisão (1000 XP)
- 🎖️ Supervisor - Ajudou 10 colegas (500 XP)

### Sistema XP
- Caso simples completado: +10 XP
- Caso complexo completado: +25 XP
- Diagnóstico correto: +5 XP
- Insight registrado: +15 XP
- Dia de streak: +5 XP
- Badge desbloqueado: variável

## 💳 Planos de Monetização

### FREE (Isca)
- **Preço:** R$ 0
- **Duração:** Trial 7 dias, depois limitado
- **Limites:**
  - 3 casos/mês
  - 1 assistente (apenas Case)
  - Sem histórico completo (últimas 5 conversas)
  - Sem badges
  - Suporte: Email (48h resposta)

### BASIC (70% dos pagantes esperados)
- **Preço:** R$ 29,90/mês
- **Stripe Price ID:** price_xxx (criar no Stripe)
- **Features:**
  - Casos ilimitados
  - 4 assistentes (exceto Generator)
  - Histórico completo
  - Sistema de progresso
  - Rate limit: 100 mensagens/dia
  - Suporte: Email (24h resposta)

### PRO (25% dos pagantes esperados)
- **Preço:** R$ 69,90/mês
- **Stripe Price ID:** price_yyy
- **Features:**
  - Tudo do Basic +
  - Badges e conquistas
  - Certificado de conclusão
  - Exportar conversas PDF
  - Trilhas personalizadas
  - Rate limit: 500 mensagens/dia
  - Suporte: Email prioritário (12h)

### PREMIUM (5% dos pagantes esperados)
- **Preço:** R$ 149,90/mês
- **Stripe Price ID:** price_zzz
- **Features:**
  - Tudo do Pro +
  - Certificado oficial (validado CFP - futuro)
  - Supervisão mensal ao vivo (1h)
  - Análises avançadas de progresso
  - API access (criar casos customizados)
  - Rate limit: ilimitado
  - Suporte: Chat direto (4h)

### B2B (Futuro)
- **Clínicas-Escola/Universidades**
- R$ 499/mês (até 50 alunos)
- R$ 899/mês (até 150 alunos)
- Contratos anuais
- Relatórios agregados

## 🔐 Convenções de Código

### JavaScript/Node.js
```javascript
// Nomenclatura
const variableName = 'camelCase';
class ClassName {}
const CONSTANT_NAME = 'UPPER_SNAKE_CASE';

// Async/Await (sempre)
async function fetchData() {
  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    logger.error('Error:', error);
    throw error;
  }
}

// Arrow functions para callbacks
array.map(item => item.value);

// Destructuring quando possível
const { name, email } = user;

// Template literals
const message = `Hello, ${name}!`;

// JSDoc para funções públicas
/**
 * Envia mensagem para assistente OpenAI
 * @param {string} userId - ID do usuário
 * @param {string} message - Mensagem texto
 * @param {string} assistantType - Tipo assistente
 * @returns {Promise<Object>} Resposta do assistente
 */
async function sendMessage(userId, message, assistantType) {
  // implementação
}
```

### Error Handling
```javascript
// Sempre usar try-catch em async
async function riskyOperation() {
  try {
    await doSomething();
  } catch (error) {
    // Log estruturado
    logger.error('Operation failed', {
      error: error.message,
      stack: error.stack,
      userId: req.userId
    });
    
    // Re-throw ou retornar erro tratado
    throw new AppError('Operation failed', 500);
  }
}

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
```

### Logging com Winston
```javascript
// Níveis: error, warn, info, debug
logger.info('User logged in', { userId, email });
logger.error('Payment failed', { userId, error: err.message });
logger.debug('OpenAI request', { threadId, assistantType });

// Evitar logs excessivos em produção
if (process.env.NODE_ENV !== 'production') {
  logger.debug('Detailed debug info');
}
```

### Frontend (Vanilla JS)
```javascript
// Event listeners com arrow functions
button.addEventListener('click', () => {
  handleClick();
});

// Fetch com async/await
async function loadData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    renderData(data);
  } catch (error) {
    showError('Failed to load data');
  }
}

// DOM manipulation moderna
const element = document.querySelector('.class');
element.classList.add('active');
element.textContent = 'New text';

// Template literals para HTML
const html = `
  <div class="card">
    <h3>${title}</h3>
    <p>${description}</p>
  </div>
`;
```

## ⚡ Performance & Otimizações

### OpenAI
- **Limite tokens:** 2000 tokens/conversa (controle custo)
- **Reutilizar threads:** Não criar thread novo a cada mensagem
- **Cache respostas:** Perguntas frequentes (ex: "Como funciona?")
- **Truncar histórico:** Manter últimas 10 mensagens apenas

### WebSocket
- **Rooms:** Usuário só recebe mensagens do seu room
- **Rate limiting:** 5 mensagens/minuto (evitar spam)
- **Heartbeat:** Ping/pong a cada 30s (detectar desconexão)
- **Reconnection:** Auto-reconnect com backoff exponencial

### Database (Boost.space)
- **Batch operations:** Agrupar múltiplos updates quando possível
- **Índices:** Já configurados no Boost.space (não controlável)
- **Cache:** Usar Redis para dados frequentes (futuro)
- **Pagination:** Sempre paginar listas (50 items/página)

### Frontend
- **Lazy loading:** Carregar páginas sob demanda
- **Debounce:** Input de busca com 300ms debounce
- **Service Worker:** Cache assets estáticos (futuro)
- **Minificação:** Minificar CSS/JS em produção

## 🔒 Segurança

### Autenticação
- **JWT:** Expiração 24h
- **Refresh Token:** Expiração 7 dias
- **Password:** Min 8 chars, bcrypt rounds 12
- **Rate limiting:** 5 tentativas login/15min

### API
- **CORS:** Apenas domínio scopsy.com.br
- **Helmet.js:** Headers segurança
- **Input validation:** Joi em todas as rotas
- **SQL Injection:** N/A (Boost.space é NoSQL-like)
- **XSS:** Sanitizar inputs (DOMPurify no frontend)

### Secrets
```bash
# .env (NUNCA commitar)
NODE_ENV=production
PORT=3000
JWT_SECRET=random_256bit_key_here
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
BOOST_SPACE_API_KEY=...
BOOST_SPACE_SPACE_ID=...
```

## 📊 Métricas & KPIs

### Negócio
- **Break-even:** 2 pagantes (R$ 60/mês)
- **MRR Target M3:** R$ 600 (20 users, 10 pagantes)
- **MRR Target M6:** R$ 2.100 (100 users, 70 pagantes)
- **MRR Target M12:** R$ 10.500 (500 users, 350 pagantes)
- **Churn Target:** < 8%/mês

### Produto
- **DAU/MAU:** > 40% (engajamento)
- **Mensagens/usuário:** > 20/mês
- **Sessão média:** > 15 min
- **Conversão Free → Paid:** > 15%
- **NPS:** > 40

### Técnico
- **Uptime:** > 99%
- **Latência API:** < 200ms (p95)
- **Latência WebSocket:** < 3s primeira resposta
- **OpenAI Cost/user:** < R$ 5/mês
- **Error rate:** < 1%

## 🚀 Deployment

### Ambiente Desenvolvimento
```bash
npm install
cp .env.example .env
# Editar .env com suas keys
npm run dev  # Inicia com nodemon
```

### Ambiente Produção (VPS)
```bash
# Setup inicial (uma vez)
./scripts/setup.sh

# Deploy/atualização
./scripts/deploy.sh
```

### CI/CD (Futuro)
- GitHub Actions para testes
- Deploy automático após merge main
- Rollback automático se falhar health check

## 🔗 Links Importantes

### Documentação
- OpenAI Assistants: https://platform.openai.com/docs/assistants
- Boost.space API: https://docs.boost.space/
- Stripe API: https://stripe.com/docs/api
- Socket.io: https://socket.io/docs/v4/

### Dashboard/Admin
- OpenAI Platform: https://platform.openai.com/
- Stripe Dashboard: https://dashboard.stripe.com/
- Boost.space Console: https://app.boost.space/

### Monitoramento (Futuro)
- UptimeRobot: uptime monitoring
- Sentry: error tracking
- LogRocket: session replay
- Plausible: analytics privado

## 📞 Próximos Passos

### Sprint 1 (Semana 1) - Backend Core
- [ ] Setup projeto Node.js
- [ ] Autenticação JWT
- [ ] Rotas REST básicas
- [ ] WebSocket chat
- [ ] Deploy beta VPS

### Sprint 2 (Semana 2) - OpenAI
- [ ] Service OpenAI completo
- [ ] Integração 4 assistentes
- [ ] Gerenciamento threads
- [ ] Otimização prompts
- [ ] Testes integração

### Sprint 3 (Semana 3) - Frontend
- [ ] Landing page
- [ ] Dashboard principal
- [ ] Interface chat
- [ ] Sistema badges (UI)
- [ ] Responsivo mobile

### Sprint 4 (Semana 4) - Launch
- [ ] Boost.space setup
- [ ] Stripe integration
- [ ] Sistema badges (backend)
- [ ] Deploy produção
- [ ] Beta 10-20 users

## 🎯 Filosofia do Projeto

### Princípios
1. **Simplicidade primeiro** - MVP funcional > feature completo
2. **Validação rápida** - 4 semanas para beta, não 4 meses
3. **Custo zero** - Usar recursos já pagos (VPS, Boost.space)
4. **Qualidade clínica** - Feedback estruturado, não genérico
5. **Escalabilidade** - Arquitetura pensada para 1000+ users

### O Que NÃO Fazer
- ❌ Adicionar features não validadas
- ❌ Otimizar prematuramente
- ❌ Usar frameworks complexos sem necessidade
- ❌ Gastar em infraestrutura antes de validar
- ❌ Copiar competitors sem adaptar ao contexto

### Quando Escalar
- ✅ > 100 usuários ativos → Considerar Redis cache
- ✅ > 500 usuários → Migrar frontend para React
- ✅ > 1000 usuários → Database dedicado (PostgreSQL)
- ✅ Custos OpenAI > R$ 3k/mês → Implementar GPT-4 mini em casos simples

---

**Última atualização:** 11/11/2025  
**Versão:** 1.0  
**Mantenedor:** Ailton (Criador Scopsy)

---

## 💡 Notas para Claude Code

**Ao trabalhar neste projeto:**
1. Sempre leia este arquivo antes de começar
2. Siga rigorosamente as convenções de código
3. Use os agentes apropriados (consulte SCOPSY_AGENTS_GUIDE.md)
4. Implemente testes antes do código (TDD)
5. Documente decisões importantes
6. Priorize simplicidade e clareza
7. Considere sempre o custo ($) das decisões

**Contexto especial:**
- Criador não é programador full-time (psicólogo empreendedor)
- Budget limitado (infraestrutura já paga)
- Validação de mercado é prioridade
- Código deve ser mantível por não-expert

**Se em dúvida:**
- Pergunte antes de implementar
- Proponha alternativas mais simples
- Explique trade-offs das decisões
- Documente o "por quê", não só o "como"
