# 🧪 COMO TESTAR LOCAL

## Passo 1: Abrir Terminal no Projeto

```bash
cd D:\projetos.vscode\SCOPSY-CLAUDE-CODE
```

## Passo 2: Iniciar Servidor Local

```bash
npm run dev
```

**Resultado esperado:**
```
[nodemon] starting `node src/server.js`
✅ Servidor rodando em http://localhost:3000
```

## Passo 3: Abrir no Navegador

Abrir no navegador:
```
http://localhost:3000/frontend/dashboard.html
```

**OU:**
```
http://localhost:3000/frontend/desafios.html
http://localhost:3000/frontend/conceituacao.html
http://localhost:3000/frontend/diagnostic.html
```

## Passo 4: Fazer Login

- Usar suas credenciais normais
- Backend conecta no MESMO banco (Supabase)
- Dados são os mesmos de produção

## Passo 5: Testar Mudanças

1. Abrir Desafios Clínicos
2. Clicar "Novo Momento"
3. **Verificar:** Mostra "🔍 Carregando..." (não "Gerando...")
4. Caso aparece rápido (~1-2s)
5. Não repete casos

## Para Parar o Servidor Local

No terminal: `Ctrl + C`

---

# 🚀 COMO FAZER DEPLOY PARA PRODUÇÃO

**IMPORTANTE:** Só fazer deploy DEPOIS de testar local!

## Opção A: Deploy Automático (Git)

```bash
# 1. Commit das mudanças
git add frontend/js/desafios.js frontend/js/conceituacao.js frontend/js/diagnostic.js
git commit -m "fix: Corrigir mensagens de loading (Carregando vs Gerando)"

# 2. Push para repositório
git push origin main

# 3. No servidor (SSH):
cd /caminho/para/scopsy
git pull origin main
pm2 restart scopsy
```

## Opção B: Deploy Manual (FTP/SFTP)

1. Abrir FileZilla (ou outro cliente FTP)
2. Conectar no servidor VPS Hostinger
3. Navegar para: `/var/www/scopsy/frontend/js/`
4. Upload dos 3 arquivos:
   - `desafios.js`
   - `conceituacao.js`
   - `diagnostic.js`
5. Reiniciar servidor: `pm2 restart scopsy`

## Opção C: Deploy via Script (se configurado)

```bash
npm run deploy
# OU
./scripts/deploy.sh
```

---

# 🔍 VERIFICAR SE ESTÁ EM PRODUÇÃO

Após deploy, abrir **Console do Navegador** (F12) em app.scopsy.com.br:

```javascript
// Limpar cache do navegador
Ctrl + F5

// Verificar se código mudou:
// 1. Abrir Network tab
// 2. Recarregar página
// 3. Procurar por "desafios.js"
// 4. Ver conteúdo do arquivo - deve ter "Carregando" em vez de "Gerando"
```

---

# ⚠️ IMPORTANTE

**SEMPRE testar LOCAL primeiro antes de fazer deploy!**

Fluxo correto:
```
1. Fazer mudanças no código local
2. ↓
3. Testar em localhost:3000
4. ↓
5. Validar que funciona
6. ↓
7. Fazer deploy para app.scopsy.com.br
8. ↓
9. Testar em produção
```
