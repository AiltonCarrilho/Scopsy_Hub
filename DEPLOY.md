# 🚀 Guia de Deploy - Scopsy

Este guia detalha o processo de deploy do Scopsy usando **Vercel** (frontend) e **Render** (backend).

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- Conta no [Render](https://render.com)
- Repositório Git configurado (GitHub, GitLab ou Bitbucket)
- Domínio scopsy.com.br configurado

## 🎯 Arquitetura de Deploy

```
www.scopsy.com.br/lab  →  Vercel (Frontend Next.js)
        ↓
    Backend API
        ↓
seu-backend.onrender.com  →  Render (Backend Express.js + Socket.io)
```

---

## 1️⃣ Deploy do Backend no Render

### Passo 1: Preparar o Repositório

Certifique-se de que os arquivos estão commitados:

```bash
cd SCOPSY-CLAUDE-CODE
git add .
git commit -m "chore: prepare backend for Render deployment"
git push origin main
```

### Passo 2: Criar Web Service no Render

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório Git
4. Configure:
   - **Name:** `scopsy-backend`
   - **Region:** `Oregon (US West)` ou `Frankfurt (Europe)` (mais próximo do Brasil)
   - **Branch:** `main`
   - **Root Directory:** `SCOPSY-CLAUDE-CODE` (se monorepo)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

### Passo 3: Configurar Variáveis de Ambiente

No dashboard do Render, vá em **Environment** e adicione:

#### Obrigatórias:
```bash
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_anon_key_aqui
OPENAI_API_KEY=sk-proj-sua-chave-aqui

# Assistant IDs (obtidos do OpenAI Platform)
ORCHESTRATOR_ID=asst_n4KRyVMnbDGE0bQrJAyJspYw
CASE_ID=asst_gF2t61jT43Kgwx6mb6pDEty3
DIAGNOSTIC_ID=asst_UqKPTw0ui3JvOt8NuahMLkAc
JOURNEY_ID=asst_ydS6z2mQO82DtdBN4B1HSHP3

# Frontend URL (ajustar depois do deploy do Vercel)
FRONTEND_URL=https://www.scopsy.com.br/lab
```

#### Opcionais (com valores padrão):
```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
TOKEN_LIMIT_FREE=1000
TOKEN_LIMIT_BASIC=5000
TOKEN_LIMIT_PRO=20000
TOKEN_LIMIT_PREMIUM=100000
```

### Passo 4: Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o build (leva ~2-5 minutos)
3. Anote a URL gerada: `https://scopsy-backend.onrender.com`

### Passo 5: Testar Backend

```bash
curl https://scopsy-backend.onrender.com/health
```

**Resposta esperada:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-XX...",
  "uptime": 123.45
}
```

---

## 2️⃣ Deploy do Frontend no Vercel

### Passo 1: Preparar o Repositório

```bash
cd projeto.scopsy3/scopsy-dashboard
git add .
git commit -m "chore: prepare frontend for Vercel deployment"
git push origin main
```

### Passo 2: Importar Projeto no Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Clique em **"Import Git Repository"**
3. Selecione seu repositório
4. Configure:
   - **Project Name:** `scopsy-dashboard`
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `projeto.scopsy3/scopsy-dashboard` (se monorepo)
   - **Build Command:** `npm run build` (padrão)
   - **Output Directory:** `.next` (padrão)

### Passo 3: Configurar Variáveis de Ambiente

No dashboard do Vercel, vá em **Settings → Environment Variables**:

```bash
# URL do backend (usar a URL do Render)
NEXT_PUBLIC_API_URL=https://scopsy-backend.onrender.com
```

### Passo 4: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (~1-3 minutos)
3. Anote a URL de preview: `https://scopsy-dashboard-xxx.vercel.app`

### Passo 5: Testar Frontend

Acesse a URL e verifique se:
- ✅ A página carrega sem erros
- ✅ Os assets (CSS, JS) estão sendo servidos
- ✅ As rotas funcionam (ex: `/lab/dashboard`)

---

## 3️⃣ Configurar Domínio Personalizado

### Opção A: Domínio Principal no Vercel

Se você quer que `www.scopsy.com.br` aponte para o Vercel:

1. No Vercel, vá em **Settings → Domains**
2. Adicione: `www.scopsy.com.br/lab`
3. Configure DNS no seu provedor (Registro.br, Hostinger, etc):

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Opção B: Subpath com Proxy (se domínio principal está em outro lugar)

Se `www.scopsy.com.br` já aponta para outro servidor (ex: VPS Hostinger), você precisa configurar um proxy reverso no Nginx:

```nginx
# /etc/nginx/sites-available/scopsy.com.br

server {
    listen 80;
    listen 443 ssl;
    server_name www.scopsy.com.br scopsy.com.br;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/scopsy.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/scopsy.com.br/privkey.pem;

    # Proxy para o subpath /lab
    location /lab {
        proxy_pass https://scopsy-dashboard-xxx.vercel.app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Outras rotas (se houver)
    location / {
        root /var/www/scopsy;
        index index.html;
    }
}
```

Reinicie o Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4️⃣ Atualizar URL do Backend no Frontend

Depois do deploy do backend no Render, atualize a variável de ambiente no Vercel:

1. Vá em **Vercel Dashboard → Settings → Environment Variables**
2. Edite `NEXT_PUBLIC_API_URL` para: `https://scopsy-backend.onrender.com`
3. Force um redeploy: **Deployments → ... → Redeploy**

---

## 5️⃣ Verificações Finais

### Backend (Render)

✅ **Health check:**
```bash
curl https://scopsy-backend.onrender.com/health
```

✅ **CORS configurado:**
- Variável `FRONTEND_URL` apontando para `https://www.scopsy.com.br/lab`
- CORS aceita requisições do frontend

✅ **Socket.io funcionando:**
- Teste enviando uma mensagem via frontend
- Verifique logs no Render: **Logs → View Logs**

### Frontend (Vercel)

✅ **Página carrega:**
```
https://www.scopsy.com.br/lab
```

✅ **Assets servidos corretamente:**
- CSS, JS, imagens aparecem
- Console do navegador sem erros 404

✅ **API conectada:**
- Teste login/signup
- Teste envio de mensagem no chat
- Verifique Network tab no DevTools

---

## 6️⃣ Troubleshooting

### Problema: Frontend não conecta com backend

**Causa:** CORS bloqueando requisições

**Solução:**
1. Verifique se `FRONTEND_URL` no Render está correto
2. Verifique se domínio está na lista CORS do `server.js:26`
3. Reinicie o serviço no Render

### Problema: Socket.io não conecta

**Causa:** WebSocket bloqueado ou configuração incorreta

**Solução:**
1. Certifique-se de que Render está usando **Web Service** (não Background Worker)
2. Verifique se porta 10000 está configurada
3. Teste WebSocket com ferramenta: [websocket.org/echo.html](https://websocket.org/echo.html)

### Problema: Cold start lento (Render Free)

**Causa:** Plano Free do Render desliga serviço após 15min de inatividade

**Soluções:**
- Upgrade para plano pago (a partir de $7/mês)
- Usar um cron job para fazer ping a cada 10min:
  ```bash
  */10 * * * * curl https://scopsy-backend.onrender.com/health
  ```

### Problema: Build falha no Vercel

**Causa:** Erros de TypeScript ou dependências faltando

**Solução:**
1. Rode localmente: `npm run build`
2. Corrija erros antes de fazer push
3. Verifique logs de build no Vercel Dashboard

---

## 7️⃣ Monitoramento e Logs

### Render (Backend)

- **Logs em tempo real:** Dashboard → Logs
- **Métricas:** Dashboard → Metrics (CPU, RAM, requests)
- **Alertas:** Configure em Settings → Notifications

### Vercel (Frontend)

- **Analytics:** Dashboard → Analytics (pageviews, performance)
- **Logs:** Dashboard → Deployments → View Function Logs
- **Error tracking:** Integre com [Sentry](https://sentry.io) (opcional)

---

## 8️⃣ CI/CD Automático

Ambos Vercel e Render fazem **deploy automático** quando você faz push:

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

**Vercel:** Deploy automático em ~1-2min
**Render:** Deploy automático em ~3-5min

---

## 9️⃣ Custos Estimados

### Plano Free (para começar)

| Serviço | Plano | Custo | Limites |
|---------|-------|-------|---------|
| **Vercel** | Hobby | R$ 0 | 100GB bandwidth/mês |
| **Render** | Free | R$ 0 | Cold starts após 15min |
| **Supabase** | Free | R$ 0 | 500MB DB, 2GB bandwidth |
| **OpenAI** | Pay-as-you-go | ~R$ 100/mês | Depende de uso (~50k tokens/dia) |
| **Total** | | **~R$ 100/mês** | |

### Plano Escalado (produção)

| Serviço | Plano | Custo | Benefícios |
|---------|-------|-------|------------|
| **Vercel** | Pro | $20/mês (~R$ 100) | Analytics, mais bandwidth |
| **Render** | Starter | $7/mês (~R$ 35) | Sem cold starts, SSL automático |
| **Supabase** | Pro | $25/mês (~R$ 125) | 8GB DB, backups diários |
| **OpenAI** | Pay-as-you-go | ~R$ 300/mês | ~150k tokens/dia |
| **Total** | | **~R$ 560/mês** | |

---

## 🎉 Pronto!

Seu Scopsy está no ar em:
- **Frontend:** https://www.scopsy.com.br/lab
- **Backend:** https://scopsy-backend.onrender.com

**Próximos passos:**
1. Configure monitoramento (Sentry, LogRocket)
2. Configure backups automáticos (Supabase)
3. Adicione testes E2E (Playwright)
4. Configure alertas de downtime (UptimeRobot)

---

**Última atualização:** 2024-01-XX
**Mantenedor:** Ailton (Criador Scopsy)
