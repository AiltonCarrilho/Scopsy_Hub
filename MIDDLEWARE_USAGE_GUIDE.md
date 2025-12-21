# 🔐 Guia de Uso dos Middlewares de Segurança

**Criado:** 2024-12-19
**Status:** ✅ Implementado e pronto para uso

---

## 📦 Middlewares Disponíveis

### 1. **checkPlan.js** - Controle de Acesso por Plano

**Localização:** `src/middleware/checkPlan.js`

**Funções:**
```javascript
const { requirePremium, requirePro, blockFree } = require('../middleware/checkPlan');
```

---

### 2. **rateLimiter.js** - Rate Limiting

**Localização:** `src/middleware/rateLimiter.js`

**Limiters:**
```javascript
const {
  apiLimiter,        // 100 req/15min
  openaiLimiter,     // 5 req/min (CARO!)
  authLimiter,       // 10 req/15min (anti brute-force)
  paymentLimiter     // 20 req/hour
} = require('../middleware/rateLimiter');
```

---

## 🚀 Como Usar - Exemplos Práticos

### Exemplo 1: Rota Premium (conceituação avançada)

```javascript
// src/routes/case.js
const { authenticateRequest } = require('../middleware/auth');
const { requirePremium } = require('../middleware/checkPlan');

// ✅ Apenas usuários Premium/Pro podem gerar casos avançados
router.post('/generate',
  authenticateRequest,  // Verifica JWT
  requirePremium,        // ⭐ Bloqueia se não for Premium
  async (req, res) => {
    // Lógica da rota
  }
);
```

---

### Exemplo 2: Funcionalidade Pro (supervisão)

```javascript
const { requirePro } = require('../middleware/checkPlan');

// ✅ Apenas Pro/Premium
router.post('/supervision/request',
  authenticateRequest,
  requirePro,  // ⭐ Requer Pro ou Premium
  async (req, res) => {
    // ...
  }
);
```

---

### Exemplo 3: Bloquear Trial Expirado

```javascript
const { blockFree } = require('../middleware/checkPlan');

// ✅ Bloqueia usuários Free (trial expirado)
router.get('/analytics',
  authenticateRequest,
  blockFree,  // ⭐ Free não pode acessar
  async (req, res) => {
    // Analytics disponível apenas para pagantes
  }
);
```

---

### Exemplo 4: Rate Limiting por Endpoint

```javascript
const { openaiLimiter } = require('../middleware/rateLimiter');

// ✅ Máximo 5 gerações por minuto
router.post('/generate-case',
  authenticateRequest,
  openaiLimiter,  // ⭐ Protege contra abuso (custo OpenAI)
  async (req, res) => {
    // ...
  }
);
```

---

### Exemplo 5: Múltiplos Middlewares

```javascript
const { requirePremium } = require('../middleware/checkPlan');
const { openaiLimiter } = require('../middleware/rateLimiter');

// ✅ Premium + Rate Limit
router.post('/generate-advanced',
  authenticateRequest,   // 1. Autentica
  openaiLimiter,         // 2. Rate limit (5/min)
  requirePremium,        // 3. Valida plano
  async (req, res) => {
    // Rota super protegida!
  }
);
```

---

## 🎯 Recomendações de Aplicação

### Rotas que DEVEM ter `requirePremium`:

```javascript
// ✅ Features Premium
/api/case/generate (conceituação avançada)
/api/case/analyze (análise profunda)
/api/diagnostic/unlimited (sem limite)
/api/gamification/* (badges, XP)
/api/freshness/status (sistema de vigor)
/api/journey/create (jornadas longas)
/api/missions/advanced (missões complexas)
```

### Rotas que DEVEM ter `openaiLimiter`:

```javascript
// ✅ Chamadas OpenAI (CARAS!)
/api/case/generate
/api/case/analyze
/api/case/conceptualize
/api/diagnostic/generate-case
/api/journey/session
/api/chat/message
```

### Rotas que DEVEM ter `authLimiter`:

```javascript
// ✅ Autenticação (anti brute-force)
/api/auth/login
/api/auth/signup
/api/auth/reset-password
/api/auth/verify-code
```

---

## 📊 Respostas dos Middlewares

### `requirePremium` - Status 403

```json
{
  "success": false,
  "error": "Funcionalidade Premium",
  "message": "Assine Premium para acessar esta funcionalidade",
  "upgrade_url": "/pricing"
}
```

### Rate Limiter - Status 429

```json
{
  "success": false,
  "error": "Muitas requisições",
  "message": "Você excedeu o limite de requisições. Tente novamente em 15 minutos.",
  "retry_after": 900
}
```

---

## 🔍 Logs Gerados

Os middlewares geram logs estruturados para auditoria:

```javascript
// checkPlan.js
logger.info('Premium feature access attempt', {
  userId: req.user?.userId,
  plan: 'free',
  endpoint: '/api/case/generate'
});

logger.warn('Premium access denied', {
  userId: '123',
  plan: 'free',
  endpoint: '/api/case/generate'
});

// rateLimiter.js
logger.warn('Rate limit exceeded', {
  ip: '192.168.1.1',
  endpoint: '/api/diagnostic/generate-case',
  user: '123'
});
```

---

## ⚠️ IMPORTANTE: Ordem dos Middlewares

**Ordem correta:**
```javascript
router.post('/endpoint',
  authenticateRequest,  // 1️⃣ SEMPRE PRIMEIRO (extrai userId)
  openaiLimiter,        // 2️⃣ Rate limit (usa userId se disponível)
  requirePremium,       // 3️⃣ Valida plano (precisa do userId)
  async (req, res) => {
    // 4️⃣ Lógica da rota
  }
);
```

**❌ Ordem ERRADA:**
```javascript
router.post('/endpoint',
  requirePremium,       // ❌ ERRO! userId ainda não existe
  authenticateRequest,  // JWT ainda não foi validado
  async (req, res) => {
    // Vai quebrar!
  }
);
```

---

## 🧪 Testando Middlewares

### Testar checkPlan:

```bash
# Com token de usuário Free
curl -X POST http://localhost:3000/api/case/generate \
  -H "Authorization: Bearer TOKEN_FREE_USER"

# Deve retornar 403 se a rota tiver requirePremium
```

### Testar Rate Limit:

```bash
# Fazer 6 requisições em menos de 1 minuto
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/diagnostic/generate-case \
    -H "Authorization: Bearer TOKEN"
done

# A 6ª deve retornar 429 (openaiLimiter = 5/min)
```

---

## 🚀 Status de Implementação

✅ **Implementado:**
- [x] Middleware checkPlan.js criado
- [x] Middleware rateLimiter.js criado
- [x] express-rate-limit instalado
- [x] Rate limiters aplicados em server.js
- [x] CORS configurado corretamente

⏳ **Próximos Passos:**
- [ ] Aplicar `requirePremium` nas rotas premium específicas
- [ ] Testar todos os rate limiters
- [ ] Configurar alertas de rate limit no monitoramento
- [ ] Documentar rotas premium na API docs

---

## 📚 Referências

- `src/middleware/checkPlan.js` - Controle de plano
- `src/middleware/rateLimiter.js` - Rate limiting
- `src/server.js` - Aplicação dos middlewares
- `DEPLOY_SECURITY_AUDIT.md` - Auditoria de segurança

---

**Última atualização:** 2024-12-19
**Autor:** Security Implementation Sprint
