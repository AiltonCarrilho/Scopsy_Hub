# 📅 FIRST WEEK COMMANDS - Claude Code

Comandos exatos para usar com Claude Code durante a primeira semana.

**Importante:** Sempre coloque o arquivo `CLAUDE.md` na raiz antes de começar!

---

## 🗓️ DIA 1: SEGUNDA-FEIRA (Setup & Planning)

### **Sessão 1: Architecture Review (30 min)**

```
Olá! Vou continuar o projeto Scopsy.

CONTEXTO:
- Projeto: SaaS treinamento TCC para psicólogos com IA
- Fase atual: Implementation (backend)
- Último trabalho: Estrutura base criada
- Objetivo hoje: Validar arquitetura e começar auth

Por favor, leia o arquivo CLAUDE.md na raiz para entender 
o contexto completo.

TAREFA:
@system-architect valide a arquitetura do OpenAI service 
em src/services/openai-service.js

Considere especialmente:
1. Roteamento inteligente entre os 5 assistentes
2. Gestão de tokens (target: < R$ 2/user/mês)
3. Polling strategy (timeout 60s ok?)
4. Cache de respostas comuns

Se encontrar problemas críticos, sugira alternativas.
```

---

### **Sessão 2: Criar Auth Middleware (45 min)**

```
@auth-architect

Crie middleware de autenticação JWT completo.

Arquivo: src/middleware/auth.js

Requisitos:
1. Função verifyToken(token) que retorna {userId, plan}
2. Função generateToken(userId, plan) 
3. Função generateRefreshToken(userId)
4. Middleware authenticateRequest(req, res, next)
5. Tratamento de erros (token expirado, inválido, etc)

Use:
- jsonwebtoken library
- Variáveis .env: JWT_SECRET, JWT_EXPIRES_IN
- Logger para logs estruturados

Siga convenções do CLAUDE.md.
```

---

## 🗓️ DIA 2: TERÇA-FEIRA (Auth Routes)

### **Sessão 1: Testes Auth (TDD) (45 min)**

```
@test-automator

Escreva testes completos para rotas de autenticação.

Arquivo: tests/routes/auth.test.js

Cenários:

POST /api/auth/signup
- ✅ Sucesso: email válido, senha forte → 201 + token
- ❌ Email duplicado → 409
- ❌ Senha fraca (< 8 chars) → 400
- ❌ Email inválido → 400

POST /api/auth/login
- ✅ Sucesso: credenciais corretas → 200 + token
- ❌ Email não existe → 401
- ❌ Senha incorreta → 401
- ❌ Rate limit (5 tentativas) → 429

GET /api/auth/me
- ✅ Com token válido → 200 + user data
- ❌ Sem token → 401
- ❌ Token expirado → 401

Use Jest + supertest.
NÃO implemente as rotas ainda, apenas testes.
```

---

### **Sessão 2: Implementar Auth Routes (1h)**

```
@backend-architect

Implemente rotas de autenticação para passar nos 
testes escritos anteriormente.

Arquivo: src/routes/auth.js

Rotas:
- POST /signup → Criar usuário, hash senha bcrypt, retornar JWT
- POST /login → Validar credenciais, retornar JWT
- GET /me → Retornar dados user autenticado
- POST /logout → Invalidar token (opcional por ora)

Integração:
- Salvar usuário no Boost.space (collection users)
- Usar service src/services/boostspace.js (criar se não existe)
- bcrypt rounds: 12
- Validação com Joi

Execute os testes e corrija até todos passarem:
npm test tests/routes/auth.test.js
```

---

## 🗓️ DIA 3: QUARTA-FEIRA (OpenAI Integration)

### **Sessão 1: Service Boost.space (45 min)**

```
@database-architect

Crie service de integração com Boost.space REST API.

Arquivo: src/services/boostspace.js

Funções necessárias:

/**
 * Salvar dados em collection
 */
async function saveToBoostspace(collection, data)

/**
 * Buscar dados de collection
 */
async function getFromBoostspace(collection, filters)

/**
 * Atualizar dados
 */
async function updateInBoostspace(collection, id, data)

/**
 * Deletar registro
 */
async function deleteFromBoostspace(collection, id)

Use:
- axios para HTTP requests
- Variáveis .env: BOOST_SPACE_API_KEY, BOOST_SPACE_API_URL
- Tratamento robusto de erros
- Logger

Endpoint Boost.space: POST https://api.boost.space/v2/spaces/{spaceId}/collections/{collection}/records
```

---

### **Sessão 2: Testar OpenAI Service (1h)**

```
@openai-architect

Valide e teste o OpenAI service criado.

Tarefas:
1. Revisar src/services/openai-service.js
2. Criar testes unitários básicos (mock OpenAI API)
3. Teste manual com assistente Case:
   - Criar thread
   - Enviar "START"
   - Verificar resposta
   - Conferir tokens usados

Comando teste manual:
node -e "
const {sendMessage, getOrCreateThread} = require('./src/services/openai-service');
(async () => {
  const thread = await getOrCreateThread('test-user', 'case');
  const response = await sendMessage(thread, 'case', 'START', 'test-user');
  console.log(response);
})();
"

Ajuste bugs se necessário.
```

---

## 🗓️ DIA 4: QUINTA-FEIRA (WebSocket + Frontend)

### **Sessão 1: Testar WebSocket (30 min)**

```
@socketio-specialist

Valide o socket handler em src/socket/chatHandler.js

Tarefas:
1. Revisar código
2. Criar script de teste manual
3. Simular envio de mensagem
4. Verificar eventos (typing, response, error)

Crie: tests/manual/test-socket.js

Script deve:
- Conectar com token JWT fake (só para teste)
- Emitir 'send_message'
- Escutar todos eventos
- Logar resultados

Execute e valide fluxo completo.
```

---

### **Sessão 2: Frontend Básico (1h 30min)**

```
@frontend-developer

Crie landing page HTML básica.

Arquivo: public/index.html

Requisitos:
1. Header com logo Scopsy
2. Hero section:
   - Título: "Treine TCC como nunca antes"
   - Subtítulo explicando os 4 assistentes
   - CTA: "Começar Gratuitamente"
3. Seção cards dos 4 assistentes visíveis:
   - Case, Diagnostic, Journey, Orchestrator
   - Com ícone, título, descrição curta
4. Footer simples

Design:
- Cores: Roxo #667eea (primária)
- Responsivo mobile-first
- Sem framework (Vanilla CSS)

Arquivo CSS: public/css/main.css

Mantenha simples e funcional. Foco em validação, 
não em perfeição visual.
```

---

## 🗓️ DIA 5: SEXTA-FEIRA (Deploy Beta)

### **Sessão 1: Dashboard HTML Básico (1h)**

```
@dashboard-specialist

Crie dashboard.html básico (pós-login).

Arquivo: public/dashboard.html

Estrutura:
1. Sidebar com navegação
2. Header com nome usuário + logout
3. 4 stats cards (casos, tempo, acurácia, streak)
4. Grid com 4 cards de assistentes
5. Botão "Começar" em cada card

JavaScript: public/js/dashboard.js
- Fetch stats de GET /api/dashboard/stats
- Renderizar cards dinamicamente
- Ao clicar "Começar", redirecionar para /chat.html?assistant=case

CSS: Reutilizar public/css/main.css + adicionar específicos

Use Socket.io client preparado para próxima etapa.
```

---

### **Sessão 2: Deploy VPS (1h)**

```
@deployment-engineer

Configure deploy inicial no VPS Hostinger.

Setup:
1. SSH no VPS
2. Instalar Node.js 20:
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
3. Clonar/copiar projeto
4. npm install --production
5. Configurar .env (production)
6. PM2:
   npm install -g pm2
   pm2 start src/server.js --name scopsy
   pm2 save
   pm2 startup
7. Nginx basic config:
   - Reverse proxy porta 3000
   - SSL Let's Encrypt (certbot)

Teste:
curl https://scopsy.com.br/health

Se retornar {"status":"OK"}, deploy concluído! 🚀
```

---

## ✅ CHECKLIST FIM DA SEMANA 1

- [ ] Backend rodando localmente
- [ ] Testes auth passando
- [ ] OpenAI service funcionando
- [ ] WebSocket conectando
- [ ] Landing page acessível
- [ ] Dashboard básico renderizando
- [ ] Deploy beta no VPS

**Completo?** Semana 2: Frontend completo + Stripe! 🎉

---

## 💡 DICAS GERAIS

### Antes de cada sessão:
1. Leia CLAUDE.md
2. Especifique o @agente
3. Dê contexto claro
4. Defina requisitos específicos

### Durante a sessão:
- Peça explicações de decisões
- Teste imediatamente
- Commit após cada feature funcionando

### Depois da sessão:
- Documente aprendizados
- Atualize README se necessário
- Prepare contexto para próxima sessão

---

## 🆘 Se Travar

**Problema:** Claude gera código que não funciona

```
O código gerado tem erro no arquivo X linha Y:
[cole o erro]

Por favor, identifique a causa e corrija.
```

**Problema:** Não sei como continuar

```
Estou travado na tarefa X. 

O que já fiz:
- [lista]

O que não está funcionando:
- [descrição]

Pode sugerir próximos passos ou abordagem alternativa?
```

---

**Tempo estimado semana 1:** 15-20h  
**Resultado esperado:** Beta funcional rodando! 🚀
