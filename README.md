# 🧠 Scopsy - Treinamento Inteligente para Psicólogos

[![Status](https://img.shields.io/badge/status-MVP-green)](https://github.com)
[![Node](https://img.shields.io/badge/node-v20+-blue)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-Private-red)](LICENSE)

> Plataforma SaaS de treinamento em psicoterapia cognitivo-comportamental (TCC/ACT/DBT) powered by OpenAI Assistants API + Boost.space.

---

## 🎯 Sobre o Projeto

**Scopsy** é uma plataforma de treinamento especializada que ajuda psicólogos a desenvolverem habilidades clínicas através de:

- 🎯 **Treino de Olhar Clínico** - Casos simulados com feedback formativo
- 🎲 **Diagnostic Training** - Prática diagnóstica DSM-5-TR
- 🗺️ **Clinical Journey** - Acompanhamento longitudinal (12 sessões)

### Stack Tecnológico

```
Backend:    Node.js 20+ + Express
Database:   Boost.space (no-code)
Frontend:   HTML5 + CSS3 + Vanilla JavaScript
AI:         OpenAI Assistants API (5 assistentes)
Auth:       JWT (stateless)
Real-time:  Socket.io
Payment:    Stripe
```

---

## 🚀 Quick Start (5 minutos)

### Backend

```bash
# 1. Clone/extraia o projeto
cd SCOPSY-CLAUDE-CODE

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas keys

# 4. Inicie o servidor
npm run dev
```

Servidor rodará em `http://localhost:3000`

---

### Frontend

```bash
# 1. Abrir VSCode na pasta frontend
cd frontend

# 2. Instalar Live Server (extensão VSCode)
# Extensions → "Live Server" by Ritwick Dey

# 3. Botão direito em index.html → "Open with Live Server"
```

Frontend rodará em `http://127.0.0.1:5500/frontend/`

---

## 📋 Pré-requisitos

- **Node.js 20+** ([Download](https://nodejs.org))
- **npm 9+**
- **Contas configuradas:**
  - OpenAI Platform (API key)
  - Boost.space (API key + Space ID)
  - Stripe (para pagamentos - opcional no MVP)

---

## 🏗️ Estrutura do Projeto

```
SCOPSY-CLAUDE-CODE/
├── frontend/              # Frontend (HTML + CSS + JS)
│   ├── index.html         # Landing page
│   ├── login.html         # Autenticação
│   ├── signup.html        # Cadastro
│   ├── dashboard.html     # Dashboard protegido
│   ├── chat.html          # Interface de chat
│   ├── css/
│   │   ├── style.css      # Estilos globais
│   │   └── chat.css       # Estilos do chat
│   ├── js/
│   │   ├── auth.js        # Funções de autenticação
│   │   ├── dashboard.js   # Lógica do dashboard
│   │   └── chat.js        # Chat real-time
│   └── img/
│       └── Logo_Scopsy.png
│
├── src/                   # Backend Node.js
│   ├── server.js          # Entry point
│   ├── config/            # Configurações (logger, env)
│   ├── routes/            # Express routes
│   ├── services/          # Business logic (OpenAI, Boost.space)
│   ├── middleware/        # Auth, rate limiting, error handler
│   ├── socket/            # WebSocket handlers (Socket.io)
│   └── utils/             # Helpers
│
├── docs/                  # Documentação
│   ├── 00-CONTEXTO-MASTER-SCOPSY.md
│   ├── 01-CHECKLIST-IMPLEMENTACAO.md
│   ├── 02-PROMPT-SYNC-INTER-MODELO.md
│   ├── 03-ROADMAP-TECNICO-COMPLETO.md
│   ├── CLAUDE.md          # Contexto para Claude Code
│   └── SCOPSY_AGENTS_GUIDE.md
│
├── tests/                 # Testes automatizados
├── scripts/               # Scripts de deploy
├── logs/                  # Logs da aplicação
├── .env.example           # Template variáveis ambiente
├── .gitignore
├── package.json
└── README.md              # Este arquivo
```

---

## 🔑 Variáveis de Ambiente (.env.local)

Copie `.env.example` para `.env.local` e preencha:

### Obrigatórias

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-...           # OpenAI API key

# Boost.space (Database)
BOOST_SPACE_API_KEY=...              # Boost.space API key
BOOST_SPACE_SPACE_ID=...             # Seu Space ID

# Auth
JWT_SECRET=...                       # Min 32 caracteres aleatórios
JWT_EXPIRES_IN=24h

# Server
NODE_ENV=development
PORT=3000
```

### Opcionais (tem defaults)

```bash
FRONTEND_URL=http://127.0.0.1:5500
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

### Geração de JWT_SECRET

```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**⚠️ IMPORTANTE:** Nunca commite `.env.local` no Git!

---

## 🤖 Assistentes OpenAI (IDs)

Os 5 assistentes já estão configurados no código:

| Assistente       | ID                              | Função                              | Visível ao Usuário                           |
| ---------------- | ------------------------------- | ----------------------------------- | -------------------------------------------- |
| **Orchestrator** | `asst_n4KRyVMnbDGE0bQrJAyJspYw` | Hub central + gerador de conteúdo   | ❌ Não (backend)                             |
| **Case**         | `asst_gF2t61jT43Kgwx6mb6pDEty3` | Casos clínicos pontuais             | ✅ Sim                                       |
| **Diagnostic**   | `asst_UqKPTw0ui3JvOt8NuahMLkAc` | Treino DSM-5-TR                     | ✅ Sim                                       |
| **Journey**      | `asst_ydS6z2mQO82DtdBN4B1HSHP3` | Jornadas longitudinais (12 sessões) | ✅ Sim                                       |
| **Generator**    | `asst_rG9kO0tUDTmSa1xzMnIEhRmU` | Gerador de documentos               | ❌ Descontinuado (integrado no Orchestrator) |

> **Nota:** Generator foi integrado ao Orchestrator na v4.0 para otimização de custos.

---

## 📡 API Endpoints

### Authentication

```http
POST /api/auth/signup     # Criar conta
POST /api/auth/login      # Login
GET  /api/auth/me         # Dados usuário autenticado
POST /api/auth/logout     # Logout
```

### Dashboard

```http
GET /api/dashboard/stats  # Estatísticas usuário
```

### Health Check

```http
GET /health               # Status do servidor
```

**Exemplo de uso:**

```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","password":"senha123"}'
```

---

## 🔌 WebSocket (Socket.io)

### Cliente → Servidor

```javascript
// Conectar
const socket = io("http://localhost:3000", {
  auth: {
    token: localStorage.getItem("token"),
  },
});

// Enviar mensagem
socket.emit("send_message", {
  message: "Quero treinar um caso de TAG",
  assistantType: "case", // 'case', 'diagnostic', 'journey'
  conversationId: "123", // opcional (continuar conversa)
});
```

### Servidor → Cliente

```javascript
// Confirmação de recebimento
socket.on("message_received", (data) => {
  console.log("Status:", data.status);
});

// Assistente processando
socket.on("assistant_typing", (data) => {
  console.log("Assistente está digitando...");
});

// Resposta do assistente
socket.on("message_response", (data) => {
  console.log("Resposta:", data.response);
  console.log("Tokens usados:", data.tokensUsed);
  console.log("Conversa ID:", data.conversationId);
});

// Erros
socket.on("error", (data) => {
  console.error("Erro:", data.message);
});
```

---

## 📊 Database Schema (Boost.space)

### Collections

#### **users**

```
- id (auto)
- email (unique)
- password_hash
- name
- plan (free, basic, pro, premium)
- created_at
```

#### **conversations**

```
- id (auto)
- user_id (FK → users)
- assistant_type (case, diagnostic, journey)
- thread_id (OpenAI thread ID)
- status (active, completed, archived)
- created_at
```

#### **messages**

```
- id (auto)
- conversation_id (FK → conversations)
- role (user, assistant)
- content (text)
- tokens_used (integer)
- created_at
```

---

## 🧪 Testes

```bash
# Rodar todos os testes
npm test

# Testes em watch mode
npm run test:watch

# Coverage
npm test -- --coverage

# Testar manualmente
npm run dev
# Em outro terminal:
curl http://localhost:3000/health
```

---

## 🚢 Deploy (VPS)

### Setup Inicial

```bash
# 1. SSH no servidor
ssh user@seu-vps.com

# 2. Clone o projeto
git clone https://github.com/seu-usuario/scopsy.git
cd scopsy

# 3. Instale dependências
npm install --production

# 4. Configure .env (use variáveis de produção)
nano .env.local

# 5. Build frontend (se necessário)
# (Não é necessário no MVP, HTML puro)

# 6. Inicie com PM2
npm install -g pm2
pm2 start src/server.js --name scopsy
pm2 save
pm2 startup
```

### Configurar Nginx (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name scopsy.com.br;

    # Frontend
    location / {
        root /var/www/scopsy/frontend;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 📊 Monitoramento

### Logs

```bash
# Development
tail -f logs/combined.log

# Production (PM2)
pm2 logs scopsy

# Filtrar erros
pm2 logs scopsy --err

# Logs em tempo real
pm2 logs scopsy --lines 100
```

### Métricas

```bash
# Status do servidor
curl http://localhost:3000/health

# PM2 Dashboard
pm2 monit

# PM2 Web UI (opcional)
pm2 install pm2-server-monit
```

---

## 🐛 Troubleshooting

### Backend

#### Erro: "OPENAI_API_KEY não definida"

```bash
# Solução: Configure .env.local
echo "OPENAI_API_KEY=sk-proj-sua-key" >> .env.local
```

#### Erro: "Connection refused" no Boost.space

```bash
# Verificar configuração
echo $BOOST_SPACE_API_KEY
echo $BOOST_SPACE_SPACE_ID

# Testar API manualmente
curl -H "Authorization: Bearer $BOOST_SPACE_API_KEY" \
  https://api.boost.space/spaces/$BOOST_SPACE_SPACE_ID
```

#### WebSocket não conecta

```bash
# Verificar CORS
# .env.local deve ter:
FRONTEND_URL=http://127.0.0.1:5500

# Verificar no código (src/server.js):
# cors({ origin: process.env.FRONTEND_URL })
```

---

### Frontend

#### Erro 404: CSS/JS não carrega

```html
<!-- Usar paths RELATIVOS (sem /) -->
✅ <link rel="stylesheet" href="css/style.css" /> ❌
<link rel="stylesheet" href="/css/style.css" />
```

#### Botão "Sair" não funciona

```javascript
// Verificar se dashboard.js carregou
console.log(typeof logout); // deve retornar "function"

// Testar logout manualmente
localStorage.clear();
window.location.href = "index.html";
```

#### Live Server não inicia

```
1. VSCode → Extensions
2. Instalar "Live Server" (Ritwick Dey)
3. Recarregar VSCode
4. Botão direito em index.html → "Open with Live Server"
```

---

## 🗺️ Roadmap

### ✅ Fase 1: MVP (Concluída)

- [x] Backend Node.js + Express
- [x] Autenticação JWT
- [x] 3 assistentes visíveis (Case, Diagnostic, Journey)
- [x] Chat real-time (Socket.io)
- [x] Dashboard protegido
- [x] Integração Boost.space

### 🔜 Fase 2: Gamificação (Em Progresso)

- [ ] Sistema de badges
- [ ] Dashboard stats reais
- [ ] Progresso por assistente

### 📅 Fase 3: Monetização

- [ ] Stripe integration
- [ ] Planos pagos (Basic, Pro, Premium)
- [ ] Rate limiting por plano
- [ ] Painel administrativo

### 📅 Fase 4: Features Avançadas

- [ ] PWA (Progressive Web App)
- [ ] Dark mode
- [ ] Exportar conversas (PDF)
- [ ] Notificações push

---

## 📚 Documentação Adicional

- **[CLAUDE.md](./docs/CLAUDE.md)** - Contexto completo para Claude Code
- **[00-CONTEXTO-MASTER-SCOPSY.md](./docs/00-CONTEXTO-MASTER-SCOPSY.md)** - Fonte única da verdade
- **[01-CHECKLIST-IMPLEMENTACAO.md](./docs/01-CHECKLIST-IMPLEMENTACAO.md)** - Guia de implementação
- **[SCOPSY_AGENTS_GUIDE.md](./docs/SCOPSY_AGENTS_GUIDE.md)** - Guia de agentes
- **[API.md](./docs/API.md)** - Documentação completa da API (se existir)

---

## 🤝 Contribuindo

Este é um repositório **privado**. Acesso restrito ao time de desenvolvimento.

### Workflow

```bash
# 1. Criar branch
git checkout -b feature/nome-da-feature

# 2. Fazer mudanças
git add .
git commit -m "feat: descrição da feature"

# 3. Push
git push origin feature/nome-da-feature

# 4. Abrir Pull Request no GitHub
```

### Padrões de Commit

```
feat: nova funcionalidade
fix: correção de bug
docs: alteração em documentação
refactor: refatoração de código
test: adição/correção de testes
chore: tarefas gerais (build, configs)
```

---

## 📝 Licença

**MIT** © 2025 Ailton

---

## 📞 Contato

**Desenvolvedor:** Ailton  
**Email:** <suporte@scopsy.com.br>
**Website:** [scopsy.com.br](https://scopsy.com.br)

---

## ⚠️ Segurança

Se você encontrar uma vulnerabilidade de segurança, **NÃO** abra uma issue pública.

Entre em contato diretamente: <suporte@scopsy.com.br>

---

## 🆘 Suporte

- **Email:** <suporte@scopsy.com.br>
- **Issues:** [GitHub Issues](https://github.com/seu-usuario/scopsy/issues)
- **Documentação:** `/docs`

---

**Versão:** 4.0 (MVP)  
**Última atualização:** 17/11/2025
