# 🛡️ Guia de Configuração: Keep-Alive Supabase

Este guia explica como manter seu projeto Supabase (plano gratuito) sempre ativo, evitando a pausa automática após 7 dias de inatividade.

## 📋 Problema

O Supabase pausa automaticamente projetos no plano gratuito após **7 dias sem atividade**. Quando isso acontece, você precisa entrar no dashboard e reativar manualmente.

## ✅ Solução Implementada

Foi criado um endpoint `/api/health` que:
1. Mantém o servidor Render acordado
2. Faz uma query simples no Supabase (`SELECT 1`)
3. Retorna status completo do sistema

## 🔧 Endpoints Disponíveis

| Endpoint | Descrição | Uso Recomendado |
|----------|-----------|-----------------|
| `GET /api/health` | Health check completo com ping no Supabase | **Monitoramento principal** |
| `GET /api/health/ping` | Resposta ultraleve | Verificação rápida |
| `GET /api/health/supabase` | Testa apenas conexão Supabase | Debug |

## 🚀 Configuração do UptimeRobot (Gratuito)

### Passo 1: Criar conta
1. Acesse [UptimeRobot.com](https://uptimerobot.com)
2. Clique em "Register for FREE"
3. Confirme seu email

### Passo 2: Adicionar Monitor

1. No dashboard, clique em **"+ Add New Monitor"**

2. Configure assim:
   ```
   Monitor Type: HTTP(s)
   Friendly Name: Scopsy Hub - Keep Alive
   URL: https://scopsy-hub.onrender.com/api/health
   Monitoring Interval: 5 minutes
   ```

3. Ative as notificações se quiser ser alertado quando o servidor cair

4. Clique em **"Create Monitor"**

### Passo 3: Verificar
- Após alguns minutos, o status deve mostrar "Up"
- O painel mostra histórico de uptime

## 📊 Resposta do Endpoint

```json
{
  "status": "OK",
  "timestamp": "2026-01-13T18:53:12.000Z",
  "uptime": 86400,
  "services": {
    "render": {
      "status": "healthy",
      "uptime": "1440 minutes"
    },
    "supabase": {
      "status": "healthy",
      "latency": "45ms"
    }
  },
  "latency": "52ms",
  "version": "1.0.0",
  "environment": "production"
}
```

## 🔄 Alternativas ao UptimeRobot

### Cron-Job.org (Gratuito)
1. Acesse [cron-job.org](https://cron-job.org)
2. Crie um cron job para chamar a URL a cada 5 minutos

### BetterStack (Gratuito até 10 monitores)
1. Acesse [betterstack.com/uptime](https://betterstack.com/uptime)
2. Similar ao UptimeRobot

### Freshping (Gratuito até 50 monitores)
1. Acesse [freshworks.com/website-monitoring](https://www.freshworks.com/website-monitoring/)

## ⚡ Deploy

Após modificar o código:

```powershell
# Commit das mudanças
git add .
git commit -m "feat: add health check with Supabase keep-alive"
git push origin main
```

O Render vai detectar automaticamente e fazer o deploy.

## 🔍 Testar Localmente

```powershell
# Iniciar servidor local
npm start

# Em outro terminal, testar o endpoint
curl http://localhost:3000/api/health
```

## ✅ Checklist

- [ ] Código do health check implementado
- [ ] Deploy feito no Render
- [ ] Monitor configurado no UptimeRobot
- [ ] Status "Up" confirmado no UptimeRobot
- [ ] Reativar projeto Supabase (se necessário)

## 🆘 Reativar Projeto Pausado

Se o Supabase já pausou seu projeto:

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto (aparecerá como "Paused")
3. Clique em **"Restore Project"** ou **"Resume"**
4. Aguarde alguns minutos para o banco voltar

---

💡 **Dica**: Com o monitoramento configurado, você nunca mais terá que se preocupar com pausas!
