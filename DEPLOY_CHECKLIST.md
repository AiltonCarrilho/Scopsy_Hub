# 🚀 Checklist de Deploy - Scopsy Backend

## 📋 Pré-Deploy (Antes de enviar ao servidor)

### 1. Variáveis de Ambiente
- [ ] Copiar `.env.production` para o servidor
- [ ] **CRÍTICO:** Gerar novo `JWT_SECRET` para produção:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
  ```
- [ ] Configurar `FRONTEND_URL=https://scopsy.com.br`
- [ ] Verificar `OPENAI_API_KEY` (usar chave de produção, não dev)
- [ ] Configurar Stripe **Live Keys** (não test keys!)
- [ ] Configurar `STRIPE_WEBHOOK_SECRET` de produção

### 2. Segurança CORS
- [x] ✅ CORS configurado para bloquear localhost em produção
- [x] ✅ Apenas HTTPS em produção (`scopsy.com.br`)
- [ ] Verificar que `NODE_ENV=production` no servidor

### 3. Código
- [ ] Commit e push de todas as mudanças
- [ ] Testar localmente com `NODE_ENV=production npm start`
- [ ] Verificar que não há `console.log()` sensíveis
- [ ] Confirmar que `.env.production` NÃO foi commitado

---

## 🖥️ No Servidor (VPS Hostinger)

### 4. Preparar Ambiente
```bash
# SSH no servidor
ssh usuario@scopsy.com.br

# Ir para o diretório do projeto
cd /var/www/scopsy-backend  # ou onde está instalado

# Parar serviço (PM2)
pm2 stop scopsy-backend
```

### 5. Atualizar Código
```bash
# Backup do .env atual (importante!)
cp .env.production .env.production.backup

# Pull do GitHub
git pull origin main

# Instalar dependências (se mudaram)
npm ci --production  # Não instala devDependencies
```

### 6. Configurar Variáveis
```bash
# Editar .env.production no servidor
nano .env.production

# Verificar que contém:
# - NODE_ENV=production
# - Todas as keys de produção
# - FRONTEND_URL correto
# - JWT_SECRET único (NÃO copiar do .env.local!)
```

### 7. Testar Antes de Subir
```bash
# Teste rápido (deve iniciar sem erros)
NODE_ENV=production node src/server.js

# Se aparecer "🚀 Servidor rodando na porta 3000", está OK
# Ctrl+C para parar
```

### 8. Iniciar com PM2
```bash
# Iniciar/Reiniciar
pm2 restart scopsy-backend

# Ou se é primeira vez:
pm2 start src/server.js --name scopsy-backend --env production

# Verificar status
pm2 status

# Ver logs em tempo real
pm2 logs scopsy-backend

# Salvar configuração PM2
pm2 save
pm2 startup  # Configurar auto-start no boot
```

---

## ✅ Verificações Pós-Deploy

### 9. Health Check
```bash
# Do servidor ou da sua máquina
curl https://scopsy.com.br/health

# Deve retornar:
# {"status":"OK","timestamp":"...","uptime":...}
```

### 10. Testar CORS
```bash
# Testar que localhost está BLOQUEADO
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS https://scopsy.com.br/api/auth/login

# Deve retornar erro ou não ter headers CORS

# Testar que domínio oficial FUNCIONA
curl -H "Origin: https://scopsy.com.br" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS https://scopsy.com.br/api/auth/login

# Deve retornar Access-Control-Allow-Origin: https://scopsy.com.br
```

### 11. Testar Endpoints Críticos
- [ ] `GET /health` → 200 OK
- [ ] `POST /api/auth/login` → Aceita credenciais
- [ ] `POST /api/auth/signup` → Cria usuário
- [ ] `GET /api/dashboard/stats` → Requer auth
- [ ] WebSocket conecta (Socket.io)

### 12. Monitoramento
```bash
# Ver logs em tempo real
pm2 logs scopsy-backend --lines 100

# Verificar uso de memória/CPU
pm2 monit

# Verificar que não há erros
tail -f /var/www/scopsy-backend/logs/error.log
```

---

## 🔐 Segurança Final

### 13. Checklist de Segurança
- [ ] `NODE_ENV=production` setado
- [ ] CORS bloqueia localhost
- [ ] Apenas HTTPS permitido (não HTTP)
- [ ] JWT_SECRET diferente do desenvolvimento
- [ ] Stripe usando Live Keys (não Test)
- [ ] Rate limiters ativos
- [ ] Helmet.js ativo
- [ ] `.env.production` com permissões corretas: `chmod 600 .env.production`

### 14. Nginx (se usar)
```nginx
# Verificar configuração SSL
sudo nginx -t

# Recarregar se mudou
sudo systemctl reload nginx

# Verificar que redireciona HTTP → HTTPS
curl -I http://scopsy.com.br  # Deve dar 301 redirect
```

---

## 🆘 Troubleshooting

### Se der erro CORS após deploy:
1. Verificar `NODE_ENV=production` no servidor
2. Verificar logs: `pm2 logs scopsy-backend`
3. Confirmar que frontend está usando `https://scopsy.com.br`

### Se não conectar:
1. Verificar firewall: `sudo ufw status`
2. Porta 3000 aberta? `sudo netstat -tulpn | grep 3000`
3. Nginx está fazendo proxy? `sudo nginx -t`

### Se OpenAI falhar:
1. Verificar `OPENAI_API_KEY` correto
2. Verificar saldo da conta OpenAI
3. Ver logs: `tail -f logs/error.log`

---

## 📊 Métricas Pós-Deploy

Monitorar primeiras 24h:
- [ ] Uptime > 99%
- [ ] Tempo de resposta `/health` < 100ms
- [ ] Sem erros 5xx nos logs
- [ ] CORS bloqueando corretamente
- [ ] Socket.io conectando normalmente

---

## 🔄 Rollback (Se algo der errado)

```bash
# Voltar para versão anterior
git log --oneline  # Ver commits
git checkout <commit-anterior>
pm2 restart scopsy-backend

# Ou restaurar .env backup
cp .env.production.backup .env.production
pm2 restart scopsy-backend
```

---

**Última atualização:** 2025-12-19
**Versão:** 1.0
**Autor:** Claude Code + Ailton
