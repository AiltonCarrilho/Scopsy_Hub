# Guia de Redeploy Manual - Vercel

## 🚨 Problema Confirmado

A Vercel **NÃO** está fazendo deploy automático quando você faz push para o repositório.

**Evidência:**
```bash
# Código em produção (ERRADO):
curl -s https://app.scopsy.com.br/signup.html | grep API_URL
# Retorna: const API_URL = 'http://localhost:3000';

# Código no Git (CORRETO):
git show HEAD:frontend/signup.html | grep API_URL
# Retorna: // API_URL vem do config.js (window.API_URL)
```

## 📋 Soluções (Ordem de Prioridade)

### SOLUÇÃO 1: Redeploy Manual via Dashboard Vercel ⭐ RECOMENDADO

1. **Acessar Vercel Dashboard**
   - URL: https://vercel.com/dashboard
   - Login com sua conta (GitHub/GitLab/Email)

2. **Localizar Projeto Scopsy**
   - Procure por um projeto com nome `scopsy`, `scopsy-hub`, `scopsy-frontend` ou similar
   - Se não encontrar, vá para a aba "All Projects"

3. **Verificar Configurações do Projeto**
   - Clique no projeto
   - Vá em "Settings" → "Git"
   - **IMPORTANTE**: Verifique:
     ```
     ✅ Connected Repository: AiltonCarrilho/Scopsy_Hub
     ✅ Production Branch: main
     ✅ Auto Deploy: Enabled
     ```

4. **Forçar Redeploy**
   - Vá em "Deployments"
   - Clique nos 3 pontinhos "..." do último deployment
   - Selecione **"Redeploy"**
   - **CRÍTICO**: Desmarque "Use existing Build Cache" ❌
   - Clique em "Redeploy"

5. **Aguardar Deploy**
   - O deploy leva 1-3 minutos
   - Aguarde até ver "Ready" com checkmark verde ✅

6. **Verificar se Funcionou**
   ```bash
   # No terminal PowerShell:
   curl -s https://app.scopsy.com.br/signup.html | Select-String "localhost:3000"

   # Se NÃO retornar nada: ✅ FUNCIONOU!
   # Se retornar algo: ❌ Ainda não deployou
   ```

---

### SOLUÇÃO 2: Verificar Webhook do GitHub

Se o redeploy manual funcionou mas commits novos não triggerem deploy automático:

1. **Ir para Configurações Git**
   - Vercel Dashboard → Projeto → Settings → Git

2. **Verificar Webhook**
   - Deve haver uma seção "Deploy Hooks"
   - Clique em "Create Hook" se não existir
   - Nome: `github-auto-deploy`
   - Branch: `main`

3. **Verificar no GitHub**
   - GitHub → Seu repo → Settings → Webhooks
   - Deve haver um webhook com URL da Vercel
   - Status deve ser "✅ Active" com checkmark verde

4. **Testar Webhook**
   - Clique no webhook
   - "Recent Deliveries"
   - Deve mostrar entregas recentes com status 200

---

### SOLUÇÃO 3: Desconectar e Reconectar Repositório

Se SOLUÇÃO 1 e 2 falharam:

1. **Backup do Projeto**
   - Anotar todas as configurações em Settings

2. **Remover Projeto**
   - Settings → Advanced → "Delete Project"
   - ⚠️ CUIDADO: Isso remove o projeto da Vercel

3. **Criar Novo Projeto**
   - Dashboard → "Add New Project"
   - "Import Git Repository"
   - Selecionar `AiltonCarrilho/Scopsy_Hub`

4. **Configurar Deploy**
   ```
   Framework Preset: Other (ou None)
   Root Directory: ./
   Build Command: (deixar vazio)
   Output Directory: frontend
   Install Command: (deixar vazio)
   ```

5. **Configurar Domínio**
   - Settings → Domains
   - Adicionar `app.scopsy.com.br`

6. **Deploy**
   - Clicar em "Deploy"

---

### SOLUÇÃO 4: Usar Vercel CLI

Se preferir linha de comando:

#### Instalação
```bash
npm install -g vercel
```

#### Login
```bash
vercel login
```

#### Deploy Manual
```bash
cd D:\projetos.vscode\SCOPSY-CLAUDE-CODE
vercel --prod
```

#### Configuração no primeiro deploy
```
? Set up and deploy "D:\projetos.vscode\SCOPSY-CLAUDE-CODE"? Y
? Which scope? (selecione sua conta)
? Link to existing project? Y
? What's the name of your existing project? scopsy (ou nome do projeto)
? In which directory is your code located? ./
```

#### Deploy Subsequente
```bash
# Sempre que quiser fazer deploy:
vercel --prod

# Para limpar cache:
vercel --prod --force
```

---

## ✅ Verificação Pós-Deploy

Depois de fazer deploy por qualquer método acima, **SEMPRE verifique**:

### Teste 1: config.js existe?
```bash
curl -I https://app.scopsy.com.br/js/config.js
# Esperado: HTTP/1.1 200 OK
```

### Teste 2: config.js está correto?
```bash
curl -s https://app.scopsy.com.br/js/config.js | grep "app.scopsy.com.br"
# Deve retornar linha com: API_URL: 'https://app.scopsy.com.br'
```

### Teste 3: signup.html não tem hardcode?
```bash
curl -s https://app.scopsy.com.br/signup.html | grep "localhost:3000"
# Deve retornar NADA (vazio = sucesso)
```

### Teste 4: No navegador
1. Abrir https://app.scopsy.com.br/signup.html
2. Pressionar F12 (DevTools)
3. No Console, digitar:
   ```javascript
   console.log('API_URL:', window.API_URL);
   console.log('Environment:', window.SCOPSY_CONFIG.ENVIRONMENT);
   ```
4. Deve mostrar:
   ```
   API_URL: https://app.scopsy.com.br
   Environment: production
   ```

---

## 🐛 Troubleshooting

### Problema: "Project not found"
**Causa:** Você não tem projeto na Vercel ainda
**Solução:** Use SOLUÇÃO 3 (criar novo projeto)

### Problema: Deploy fica "Building" indefinidamente
**Causa:** Vercel tentando executar build que não existe
**Solução:**
1. Settings → General → Build & Development Settings
2. Build Command: (deixar vazio)
3. Salvar
4. Fazer redeploy

### Problema: 404 em todos os arquivos
**Causa:** `vercel.json` com rewrites incorretos
**Solução:**
1. Verificar se `vercel.json` está na raiz do repo
2. Confirmar conteúdo (ver abaixo)

**vercel.json correto:**
```json
{
  "headers": [...],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://scopsy-hub.onrender.com/api/:path*"
    },
    {
      "source": "/",
      "destination": "/frontend/index.html"
    },
    {
      "source": "/:path*",
      "destination": "/frontend/:path*"
    }
  ]
}
```

### Problema: Mudanças não aparecem mesmo após deploy
**Causa:** Cache do browser ou CDN
**Solução:**
```bash
# No navegador:
# 1. Ctrl + Shift + Delete (limpar cache)
# 2. Ou abrir aba anônima
# 3. Ou Ctrl + F5 (hard refresh)

# Forçar Vercel a limpar cache:
vercel --prod --force
```

---

## 📊 Logs Úteis

### Ver logs de deploy:
1. Vercel Dashboard → Projeto → Deployments
2. Clicar no deployment
3. Aba "Function Logs" ou "Build Logs"

### Ver erros em tempo real:
```bash
vercel logs
```

---

## 🎯 Próximos Passos Após Deploy Funcionar

1. **Configurar Deploy Automático**
   - Settings → Git → Auto Deploy: ON

2. **Configurar Notificações**
   - Settings → Notifications
   - Ativar "Failed Deployments"

3. **Configurar Preview Deployments**
   - Settings → Git → Deploy Preview Branches: OFF
   - (Economizar builds, só deploy de main)

4. **Configurar Environment Variables** (se necessário)
   - Settings → Environment Variables
   - Adicionar variáveis se o frontend precisar

---

## 📞 Suporte

Se nenhuma solução funcionou:

1. **Verificar Status da Vercel**
   - https://www.vercel-status.com/

2. **Suporte Vercel**
   - https://vercel.com/support

3. **Logs Detalhados**
   ```bash
   # Enviar para debug:
   vercel inspect URL_DO_DEPLOY
   ```

---

**Última atualização:** 26/12/2024
**Versão:** 1.0
**Prioridade:** 🔴 CRÍTICO - Produção quebrada
