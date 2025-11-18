# 🚀 SCOPSY QUICKSTART

Guia rápido para colocar o Scopsy rodando em **5 minutos**.

---

## ⚡ Setup Rápido

### **1. Instalar Dependências**

```bash
cd scopsy-foundation
npm install
```

Isso vai instalar:
- Express, Socket.io
- OpenAI SDK
- JWT, bcrypt
- Winston (logs)
- E outras 15 dependências

**Tempo:** ~2 minutos

---

### **2. Configurar Variáveis de Ambiente**

```bash
cp .env.example .env
nano .env  # ou use seu editor preferido
```

**Preencha OBRIGATORIAMENTE:**

```bash
OPENAI_API_KEY=sk-proj-SEU_KEY_AQUI
BOOST_SPACE_API_KEY=SUA_KEY_AQUI
BOOST_SPACE_SPACE_ID=SEU_SPACE_ID
JWT_SECRET=qualquer_string_aleatoria_min_32_chars
```

**Como pegar as keys:**

- **OpenAI:** https://platform.openai.com/api-keys
- **Boost.space:** https://app.boost.space → Settings → API
- **JWT_Secret:** `openssl rand -base64 32` (no terminal)

**Tempo:** ~1 minuto

---

### **3. Iniciar Servidor**

```bash
npm run dev
```

Você verá:

```
🚀 Scopsy Backend rodando na porta 3000
📊 Environment: development
🔗 Frontend URL: http://localhost:3001
✅ Socket.io handlers inicializados
```

**Tempo:** ~5 segundos

---

### **4. Testar API**

Em outro terminal:

```bash
curl http://localhost:3000/health
```

Resposta esperada:

```json
{
  "status": "OK",
  "timestamp": "2025-11-12T12:50:00.000Z",
  "uptime": 5.123
}
```

✅ **FUNCIONOU? PARABÉNS!** Backend está rodando!

---

## 🧪 Testar Chat (Opcional)

### Usando cURL com WebSocket não é prático, então vamos testar via código:

Crie arquivo `test-socket.js`:

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  auth: {
    token: 'seu-jwt-token-aqui' // Você vai precisar fazer signup primeiro
  }
});

socket.on('connect', () => {
  console.log('✅ Conectado!');
  
  socket.emit('send_message', {
    message: 'Quero treinar um caso de TAG',
    assistantType: 'case'
  });
});

socket.on('message_response', (data) => {
  console.log('📥 Resposta do assistente:');
  console.log(data.response);
  process.exit(0);
});

socket.on('error', (err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
```

Execute:

```bash
node test-socket.js
```

---

## 📋 Próximos Passos

Agora que o backend está rodando, siga o **FIRST_WEEK_COMMANDS.md** para começar a desenvolver com Claude Code!

### Ordem recomendada:

1. ✅ **Hoje** - Setup backend (você acabou de fazer!)
2. **Dia 2** - Implementar auth routes (signup, login)
3. **Dia 3** - Testar integração OpenAI
4. **Dia 4** - Criar frontend básico
5. **Dia 5** - Deploy beta no VPS

---

## 🐛 Problemas Comuns

### `npm install` falha

→ Use Node.js 20+: `node --version`  
→ Limpe cache: `npm cache clean --force`

### Servidor não inicia

→ Porta 3000 ocupada? Mude em `.env`: `PORT=3001`  
→ Verifique logs: `cat logs/combined.log`

### OpenAI API retorna erro

→ Valide key: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`  
→ Créditos suficientes? Veja: https://platform.openai.com/usage

### Boost.space não conecta

→ API key correta?  
→ Space ID correto?  
→ Teste manualmente: `curl https://api.boost.space/v2/spaces/$BOOST_SPACE_SPACE_ID -H "Authorization: Bearer $BOOST_SPACE_API_KEY"`

---

## ✅ Checklist Final

Antes de continuar para Claude Code:

- [ ] `npm install` concluído sem erros
- [ ] `.env` configurado com todas as keys
- [ ] `npm run dev` inicia servidor
- [ ] `GET /health` retorna `{"status": "OK"}`
- [ ] Logs aparecem no terminal sem erros críticos

**Tudo OK?** Vá para `FIRST_WEEK_COMMANDS.md`! 🚀

---

**Tempo total:** ~5 minutos  
**Próximo:** Começar com Claude Code  
**Dúvidas:** Veja `README.md` ou `CLAUDE.md`
