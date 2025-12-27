# Configuração de Variáveis de Ambiente - Render

Este documento lista **TODAS** as variáveis de ambiente que precisam estar configuradas no **Render Dashboard** para o backend funcionar corretamente após as correções de login.

---

## ✅ Variáveis OBRIGATÓRIAS

Essas variáveis são **críticas** e o sistema NÃO funciona sem elas:

### 1. Node Environment
```bash
NODE_ENV=production
PORT=10000  # Porta padrão do Render (automático)
```

### 2. Supabase (Database)
```bash
SUPABASE_URL=https://vhwpohwklbguizaixitv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE**: Copiar do `.env.production` local (NÃO commitado!)

### 3. OpenAI API
```bash
OPENAI_API_KEY=sk-proj-v_3_mLIfF9iY-kA5JQuafCdJ3W27fT1D11K_8k_...
```

**💰 CUSTO**: Esta key tem billing ativo. Monitorar uso em platform.openai.com

### 4. JWT Authentication
```bash
JWT_SECRET=01u1MDdmOUWrIt/i4U1rqra9c3V0zCl5a/7mFrl5TsLqXKVy...
```

**🔒 SEGURANÇA**: Nunca compartilhar esta chave. Rotacionar periodicamente.

### 5. Frontend URL (CORS)
```bash
FRONTEND_URL=https://scopsy.com.br
```

**📝 NOTA**: Depois das correções, o frontend está no Vercel e faz proxy de `/api/*` para o Render.

### 6. Resend API (Emails) - ⚠️ FALTANDO!
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**CRÍTICO**: Sem esta variável, emails do Kiwify **NÃO SÃO ENVIADOS**!

**Como obter**:
1. Acesse: https://resend.com/
2. Faça login ou crie conta
3. Vá em: API Keys → Create API Key
4. Copie a chave que começa com `re_`
5. Adicione no Render Dashboard

**Domínio necessário**: Verificar domínio `scopsy.com.br` no Resend para enviar emails de `noreply@scopsy.com.br`

---

## 🟡 Variáveis OPCIONAIS (mas recomendadas)

### 7. Kiwify Webhook Secret
```bash
KIWIFY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxx
```

**NOTA**: Atualmente a validação de assinatura está **desabilitada** no código (`webhooks.js:38`).
Se Kiwify fornecer webhook secret, adicionar aqui e reabilitar validação.

### 8. Assistant IDs (OpenAI)
```bash
ORCHESTRATOR_ID=asst_n4KRyVMnbDGE0bQrJAyJspYw
CASE_ID=asst_gF2t61jT43Kgwx6mb6pDEty3
DIAGNOSTIC_ID=asst_UqKPTw0ui3JvOt8NuahMLkAc
JOURNEY_ID=asst_ydS6z2mQO82DtdBN4B1HSHP3
```

**NOTA**: Atualmente hardcoded em `openai-service.js`. Se quiser torná-los dinâmicos, descomentar e usar estas variáveis.

---

## 📋 Checklist de Configuração no Render

1. **Acessar Render Dashboard**:
   - https://dashboard.render.com/
   - Selecionar o serviço `scopsy-backend` (ou nome atual)

2. **Ir em Environment**:
   - Clicar em "Environment" na sidebar
   - Clicar em "Add Environment Variable"

3. **Adicionar cada variável acima**:
   - [ ] NODE_ENV=production
   - [ ] SUPABASE_URL=...
   - [ ] SUPABASE_ANON_KEY=...
   - [ ] SUPABASE_SERVICE_ROLE_KEY=...
   - [ ] OPENAI_API_KEY=...
   - [ ] JWT_SECRET=...
   - [ ] FRONTEND_URL=https://scopsy.com.br
   - [ ] **RESEND_API_KEY=...** ← ADICIONAR ESTA!

4. **Salvar e fazer Deploy**:
   - Clicar em "Save Changes"
   - Render vai fazer redeploy automático
   - Aguardar ~3-5 minutos

5. **Verificar Logs**:
   ```bash
   # No Render Dashboard → Logs, procurar por:
   ✅ CORS permitido: https://scopsy.com.br
   ✅ SUPABASE conectado
   ✅ OpenAI service inicializado
   ```

---

## ⚠️ ALERTA DE SEGURANÇA

O arquivo `.env.production` está **COMMITADO NO GIT**!

**Ação imediata necessária**:

1. **Rotacionar secrets expostos**:
   ```bash
   # Gerar novo JWT_SECRET:
   openssl rand -base64 64

   # Atualizar no Render Dashboard
   # Atualizar no .env.production local
   ```

2. **Remover do Git**:
   ```bash
   git rm --cached .env.production
   git commit -m "security: Remove exposed .env.production from repository"
   git push
   ```

3. **Adicionar ao .gitignore**:
   ```bash
   echo ".env.production" >> .gitignore
   git add .gitignore
   git commit -m "security: Add .env.production to gitignore"
   git push
   ```

4. **Considerar rotacionar**:
   - OpenAI API Key (se houver suspeita de uso indevido)
   - Supabase Service Role Key (gerar novo no dashboard Supabase)

---

## 🧪 Testar Após Configuração

### Teste 1: Health Check
```bash
curl https://lab.scopsy.com.br/health
# Esperado: {"status":"ok","timestamp":"..."}
```

### Teste 2: CORS
```bash
curl -H "Origin: https://scopsy.com.br" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://lab.scopsy.com.br/api/auth/login

# Esperado: Headers com Access-Control-Allow-Origin
```

### Teste 3: Login
```bash
# Criar usuário teste no Supabase primeiro, depois:
curl -X POST https://lab.scopsy.com.br/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"teste@scopsy.com.br","password":"senha123"}'

# Esperado: {"token":"...", "user":{...}}
```

### Teste 4: Webhook Kiwify
```bash
# Simular webhook Kiwify (ou usar Kiwify "Test Webhook"):
curl -X POST https://lab.scopsy.com.br/api/webhooks/kiwify \
     -H "Content-Type: application/json" \
     -d '{"event":"order.approved","customer":{"email":"novo@user.com","name":"Teste"}}'

# Verificar logs no Render:
# - Usuário criado
# - Email enviado (se RESEND_API_KEY configurado)
```

---

## 📞 Suporte

Se algo não funcionar após configuração:

1. **Verificar Logs do Render**:
   - Dashboard → Logs
   - Procurar por erros (linhas em vermelho)
   - Buscar por "CORS BLOQUEADO" ou "undefined" em variáveis

2. **Verificar se todas as variáveis estão setadas**:
   - Dashboard → Environment
   - Deve ter pelo menos 7-8 variáveis

3. **Testar localmente primeiro**:
   ```bash
   # No diretório do projeto:
   cp .env.example .env.local
   # Preencher com valores de produção
   npm run dev
   # Testar endpoints em localhost:3000
   ```

---

**Última atualização**: 25/12/2024
**Responsável**: Correções de Login e Integração Kiwify
