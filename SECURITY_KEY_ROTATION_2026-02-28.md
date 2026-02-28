# 🔐 SEGURANÇA: Revogação de Chaves Comprometidas

**Data:** 2026-02-28
**Status:** ⚠️ AÇÃO IMEDIATA REQUERIDA
**Razão:** Secrets expostos no histórico Git (agora removidos)

---

## 📋 Chaves Comprometidas

As seguintes credenciais foram expostas no Git e **PRECISAM SER REVOGADAS IMEDIATAMENTE**:

| Serviço | Chave | Status |
|---------|-------|--------|
| **OpenAI** | `OPENAI_API_KEY` | ❌ **REVOGAR** |
| **Supabase** | `SUPABASE_SERVICE_ROLE_KEY` | ❌ **REVOGAR** |
| **Supabase** | `SUPABASE_ANON_KEY` | ❌ **REVOGAR** |
| **Supabase** | `SUPABASE_URL` | ⚠️ Regenerar policies |
| **Boost.space** | `BOOST_SPACE_API_KEY` | ❌ **REVOGAR** |
| **Vercel** | `VERCEL_OIDC_TOKEN` | ❌ **REVOGAR** |
| **JWT_SECRET** | (antigo) | ❌ **REVOGAR** |

---

## ✅ O que já foi feito

- ✅ Histórico Git limpo com `git filter-repo`
- ✅ Arquivos `.env`, `.env.local`, `.env.production` deletados
- ✅ `.gitignore` já contém entradas para esses arquivos
- ✅ Novo JWT_SECRET gerado: `LI6HWAeMEu0KY3JiNWmUxkKcehbuHt1sNazqV0SeBZU=`

---

## 🔴 AÇÕES OBRIGATÓRIAS (Execute agora!)

### 1️⃣ **OpenAI API Key Rotation**

**Localização:** https://platform.openai.com/account/api-keys

```
1. Acesse https://platform.openai.com/account/api-keys
2. Encontre a chave comprometida (antiga)
3. Clique em "Delete" (ícone de lixeira)
4. Clique em "Create new secret key"
5. Copie a nova chave
6. Salve em local seguro (password manager)
7. Configure em Render ou ambiente de produção
```

**Variável:** `OPENAI_API_KEY`
**Urgência:** 🔴 CRÍTICA

---

### 2️⃣ **Supabase Keys Rotation**

**Localização:** https://app.supabase.com → [Project] → Settings → API

```
1. Acesse seu projeto Supabase
2. Vá em Settings → API
3. Seção "Project API Keys":
   - ANON_KEY (public) → Clique em "Rotate"
   - SERVICE_ROLE_KEY (secret) → Clique em "Rotate"
   - URL mantém igual
4. Copie as novas chaves
5. Salve em local seguro
6. Configure em Render ou ambiente de produção
```

**Variáveis:**
- `SUPABASE_URL` (não muda)
- `SUPABASE_ANON_KEY` (novo)
- `SUPABASE_SERVICE_ROLE_KEY` (novo)

**Urgência:** 🔴 CRÍTICA (estas chaves controlam acesso ao banco)

---

### 3️⃣ **Vercel OIDC Token Rotation**

**Localização:** https://vercel.com → Settings → Tokens

```
1. Acesse https://vercel.com/account/tokens
2. Encontre "VERCEL_OIDC_TOKEN"
3. Clique em "Delete"
4. Crie novo token se necessário
5. Copie e configure em Render
```

**Variável:** `VERCEL_OIDC_TOKEN`
**Urgência:** 🟠 ALTA (usado em CI/CD)

---

### 4️⃣ **Boost.space API Key Rotation**

**Localização:** Painel da conta Boost.space

```
1. Acesse https://app.boost.space/ (seu painel)
2. Procure Settings → API Keys
3. Revogue a chave comprometida
4. Gere nova chave
5. Copie e configure em Render
```

**Variável:** `BOOST_SPACE_API_KEY`
**Urgência:** 🟠 ALTA (banco de dados alternativo)

---

### 5️⃣ **JWT_SECRET Rotation (Já Gerado!)**

**Novo JWT_SECRET:**
```
LI6HWAeMEu0KY3JiNWmUxkKcehbuHt1sNazqV0SeBZU=
```

**Configure em:**
- Render Environment → `JWT_SECRET`
- Desenvolvimento local → `.env.local` (NÃO comitar!)

**Urgência:** 🟠 ALTA (controla sessões de usuários)

---

## 📌 Onde Configurar as Novas Chaves

### **Render Dashboard** (Produção)
```
https://dashboard.render.com → scopsy-backend → Environment
```

Variáveis a atualizar:
- `OPENAI_API_KEY` (nova)
- `SUPABASE_ANON_KEY` (nova)
- `SUPABASE_SERVICE_ROLE_KEY` (nova)
- `BOOST_SPACE_API_KEY` (nova)
- `VERCEL_OIDC_TOKEN` (nova)
- `JWT_SECRET` (nova - copiar acima)

**Após atualizar:** Manual Deploy → Aguardar 3-5 minutos

### **Desenvolvimento Local**
```bash
# Criar .env.local (NÃO COMMITAR!)
cd SCOPSY-CLAUDE-CODE
cat > .env.local << 'EOF'
NODE_ENV=development
PORT=3000
OPENAI_API_KEY=sk-proj-[sua-nova-chave]
SUPABASE_URL=https://[seu-projeto].supabase.co
SUPABASE_ANON_KEY=[nova-chave-anon]
SUPABASE_SERVICE_ROLE_KEY=[nova-chave-service-role]
BOOST_SPACE_API_KEY=[nova-chave-boost]
JWT_SECRET=LI6HWAeMEu0KY3JiNWmUxkKcehbuHt1sNazqV0SeBZU=
VERCEL_OIDC_TOKEN=[novo-token]
FRONTEND_URL=http://127.0.0.1:5500
EOF
```

**⚠️ IMPORTANTE:** `.env.local` está em `.gitignore` — NÃO será commitado

---

## ✅ Checklist de Conclusão

- [ ] OpenAI API Key revogada e nova configurada
- [ ] Supabase ANON_KEY revogada e nova configurada
- [ ] Supabase SERVICE_ROLE_KEY revogada e nova configurada
- [ ] Vercel OIDC Token revogado e novo configurado
- [ ] Boost.space API Key revogada e nova configurada
- [ ] JWT_SECRET atualizado em Render
- [ ] Render environment variables atualizadas
- [ ] Manual Deploy executado no Render
- [ ] Teste: Login em produção funciona?
- [ ] Teste: Chat em produção funciona?
- [ ] Desenvolvedor local criou `.env.local` com novas chaves
- [ ] Teste: `npm run dev` executa sem erros?

---

## 🔍 Verificação Pós-Rotação

### Produção (Render)
```bash
# 1. Testar login
curl -X POST https://app.scopsy.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "..."}'

# 2. Testar chat
curl -X POST https://app.scopsy.com.br/api/chat/send \
  -H "Authorization: Bearer [seu-token]" \
  -d '{"message": "Hello"}'

# 3. Verificar logs em Render
# Dashboard → scopsy-backend → Logs
```

### Desenvolvimento
```bash
npm run dev
# Verificar se conecta ao Supabase e OpenAI sem erros
```

---

## 🚨 Se Algo der Errado

### "Invalid API Key from OpenAI"
- Verifique se copiou a nova chave corretamente
- Confirme em https://platform.openai.com/account/api-keys que a nova chave está ativa
- Aguarde 1-2 minutos para propagação

### "Invalid Supabase Keys"
- Confirme em https://app.supabase.com → Settings → API que as chaves foram rotacionadas
- Verifique se RLS está habilitado nas tabelas

### "Login não funciona"
- Verificar se JWT_SECRET foi atualizado em Render
- Todos os usuários serão desconectados (esperado - novo JWT_SECRET)
- Instruir usuários a fazer login novamente

---

## 📝 Documentação para Equipe

**Comunicado para usuários:**
```
Realizamos uma atualização de segurança em nossas credenciais.
Você pode precisar fazer login novamente.
Isso é normal e seguro.

Se tiver problemas, contate suporte.
```

---

## 🔐 Próximas Ações (Após Rotação)

Após completar a rotação de chaves, o próximo item crítico é:

**CRÍTICO #3:** Tornar webhook Kiwify obrigatório (fraude financeira)
- Arquivo: `src/routes/webhooks.js` linhas 67-75
- Previne: Qualquer pessoa conceder plano PRO/PREMIUM grátis

---

**Status:** ⏳ Aguardando execução manual das revogações
**Próximo Check:** Após completar checklist acima

