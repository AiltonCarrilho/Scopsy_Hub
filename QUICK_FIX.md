# 🚨 FIX RÁPIDO - Deploy Vercel

## Problema
Frontend em produção usa `localhost:3000` em vez de `https://app.scopsy.com.br`

## Causa
Vercel não deployou código atualizado

## Solução Rápida (2 minutos)

### 1. Acessar Vercel
https://vercel.com/dashboard

### 2. Encontrar Projeto
Nome: `scopsy` ou `scopsy-hub`

### 3. Redeploy
```
1. Clicar no projeto
2. Aba "Deployments"
3. Último deploy → "..." → "Redeploy"
4. ❌ DESMARCAR "Use existing Build Cache"
5. Confirmar "Redeploy"
```

### 4. Aguardar
2-3 minutos até ver ✅ "Ready"

### 5. Testar
```bash
curl -s https://app.scopsy.com.br/signup.html | grep "localhost:3000"
```

**Se não retornar nada:** ✅ FUNCIONOU!

---

## Alternativa: Vercel CLI

```bash
npm install -g vercel
vercel login
cd D:\projetos.vscode\SCOPSY-CLAUDE-CODE
vercel --prod --force
```

---

## Ajuda Detalhada
Ver arquivo: `VERCEL_REDEPLOY_GUIDE.md`
