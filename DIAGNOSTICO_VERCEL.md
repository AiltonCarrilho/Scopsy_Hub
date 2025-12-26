# Diagnóstico Vercel - Scopsy Frontend

## 🔍 Problema Identificado

**Sintoma:** Frontend em produção (https://app.scopsy.com.br) está usando `localhost:3000` em vez de `https://app.scopsy.com.br`

**Causa Raiz:** A Vercel está servindo versão desatualizada do código

## 📊 Verificações Realizadas

### ✅ Código Local (Correto)
- `frontend/js/config.js` existe e está correto
- `frontend/signup.html` carrega config.js corretamente
- Código commitado e pushed para `origin/main`
- `vercel.json` configurado com rewrites corretos

### ❌ Produção (Incorreto)
- `https://app.scopsy.com.br/js/config.js` retorna **404**
- `https://app.scopsy.com.br/signup.html` contém código hardcoded antigo:
  ```javascript
  const API_URL = 'http://localhost:3000'; // VERSÃO ANTIGA
  ```

## 🎯 Possíveis Causas

### 1. Vercel Deploy Desatualizado
A Vercel pode não ter deployado a versão mais recente do repositório.

**Solução:**
1. Acessar https://vercel.com/dashboard
2. Encontrar projeto `scopsy` ou similar
3. Ir em "Deployments"
4. Verificar se o último deploy corresponde ao commit `d628fd7`
5. Se não, fazer "Redeploy" manual

### 2. Cache Agressivo da Vercel
A Vercel pode estar servindo arquivos do cache.

**Solução:**
```bash
# Adicionar headers de cache ao vercel.json
```

### 3. Vercel não Detectou Mudanças
Commits podem não ter triggerado rebuild.

**Solução:**
- Fazer commit vazio para forçar rebuild:
```bash
git commit --allow-empty -m "chore: Forçar redeploy Vercel"
git push origin main
```

### 4. Configuração Vercel Incorreta
O `vercel.json` pode precisar de configurações adicionais.

## 🔧 Soluções Propostas

### Solução 1: Forçar Redeploy via Dashboard
1. Login em https://vercel.com
2. Selecionar projeto Scopsy
3. "Deployments" → Último deploy → "Redeploy"
4. **Importante:** Desmarcar "Use existing Build Cache"

### Solução 2: Atualizar vercel.json com Headers
Adicionar configuração de cache:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/js/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
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

### Solução 3: Adicionar vercel.json Build Config
Garantir que a Vercel sabe que é um site estático:

```json
{
  "buildCommand": null,
  "outputDirectory": "frontend",
  "headers": [...],
  "rewrites": [...]
}
```

### Solução 4: Commit Vazio para Trigger
```bash
git commit --allow-empty -m "chore: Force Vercel redeploy - fix config.js 404"
git push origin main
```

## ✅ Checklist de Verificação

Após aplicar soluções, verificar:

- [ ] `https://app.scopsy.com.br/js/config.js` retorna 200 (não 404)
- [ ] Conteúdo do config.js mostra `API_URL: 'https://app.scopsy.com.br'`
- [ ] `https://app.scopsy.com.br/signup.html` não tem hardcode de localhost
- [ ] Console do navegador (F12) mostra:
  ```javascript
  window.API_URL === 'https://app.scopsy.com.br' // true
  window.SCOPSY_CONFIG.ENVIRONMENT === 'production' // true
  ```
- [ ] Requisições de signup vão para `https://app.scopsy.com.br/api/auth/signup`

## 🚀 Ação Imediata Recomendada

**PRIORIDADE 1:**
1. Acessar Vercel Dashboard
2. Verificar último deploy
3. Fazer "Redeploy" sem cache
4. Aguardar 2-3 minutos
5. Testar `https://app.scopsy.com.br/js/config.js`

**PRIORIDADE 2 (se P1 falhar):**
1. Atualizar `vercel.json` com headers
2. Commit + push
3. Aguardar deploy automático

**PRIORIDADE 3 (se P2 falhar):**
1. Desconectar projeto da Vercel
2. Reconectar
3. Configurar novamente

## 📝 Logs Úteis

### Comando para testar config.js em produção:
```bash
curl -I https://app.scopsy.com.br/js/config.js
```

Resposta esperada:
```
HTTP/2 200
content-type: application/javascript
```

Resposta atual:
```
HTTP/2 404
```

### Comando para verificar signup.html:
```bash
curl https://app.scopsy.com.br/signup.html | grep -o "API_URL.*localhost"
```

Se retornar algo: código antigo ainda está online
Se não retornar nada: código novo foi deployado ✅

## 🔗 Links Úteis

- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Docs - Rewrites: https://vercel.com/docs/projects/project-configuration#rewrites
- Vercel Docs - Headers: https://vercel.com/docs/projects/project-configuration#headers
- Vercel Docs - Caching: https://vercel.com/docs/edge-network/caching

## 📅 Status

**Data:** 26/12/2024
**Último Commit Verificado:** d628fd7
**Branch:** main
**Status Código Local:** ✅ Correto
**Status Produção:** ❌ Desatualizado
**Próxima Ação:** Forçar redeploy via Dashboard Vercel
