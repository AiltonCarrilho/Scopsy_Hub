# Auditoria de Segurança e Limpeza de Código
**Data:** 2026-02-22
**Executada por:** Orion (aios-master) via auditoria automatizada
**Status:** Parcialmente corrigida — itens pendentes para próximo agente

---

## Correções Já Aplicadas

| Arquivo | O que foi corrigido |
|---------|-------------------|
| `src/routes/chat.js` | `SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_ANON_KEY` |
| `src/routes/chat.js` | Validação UUID para `conversationId` antes de consultar banco |
| `src/routes/chat.js` | Rota `/feedback` agora verifica se a mensagem pertence ao usuário logado |
| `src/middleware/rateLimiter.js` | `apiLimiter`: removido condicional por ambiente, fixado em 100 req/15min |
| `src/middleware/rateLimiter.js` | `openaiLimiter`: removido condicional por ambiente, fixado em 10 req/min |
| `src/server.js` | `allowedOrigins` unificado (era duplicado para socket.io e express) |
| `src/server.js` | Lista de 40+ origens dev reduzida para 8 essenciais |
| `src/server.js` | Removido bypass de `!origin` em produção (era "mobile app" sem fundamento) |

---

## Pendências Críticas (não resolvidas)

### CRÍTICO #1 — Secrets expostos no Git
Arquivos `.env`, `.env.local` e `.env.production` foram commitados com credenciais reais.

**Credenciais comprometidas:**
- `OPENAI_API_KEY` (key de produção)
- `SUPABASE_SERVICE_ROLE_KEY` (acesso total ao banco, bypass de RLS)
- `SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `BOOST_SPACE_API_KEY`
- `VERCEL_OIDC_TOKEN`
- `JWT_SECRET` (que era uma OpenAI key — reutilização de credencial)

**Ação obrigatória:**
```bash
# 1. Revogar TODAS as keys nos painéis:
#    - OpenAI: https://platform.openai.com/api-keys
#    - Supabase: https://app.supabase.com → Settings → API
#    - Vercel: https://vercel.com → Settings → Tokens
#    - Boost.space: painel da conta

# 2. Gerar novo JWT_SECRET (não reutilizar API key):
openssl rand -base64 32

# 3. Remover arquivos do histórico Git:
git filter-repo --path .env --path .env.local --path .env.production --invert-paths

# 4. Confirmar que .gitignore cobre todos:
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore

# 5. Force-push após limpeza do histórico
```

---

### CRÍTICO #2 — SUPABASE_ANON_KEY em chat.js requer RLS ativo
O `chat.js` foi corrigido para usar `SUPABASE_ANON_KEY`, mas isso só funciona se RLS estiver habilitado nas tabelas.

**Executar no Supabase SQL Editor:**
```sql
-- Habilitar RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Usuário só vê suas próprias conversas
CREATE POLICY "users_own_conversations"
  ON chat_conversations FOR ALL
  USING (auth.uid()::text = user_id::text);

-- Usuário só vê mensagens de suas conversas
CREATE POLICY "users_own_messages"
  ON chat_messages FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE user_id::text = auth.uid()::text
    )
  );
```

**Atenção:** Verificar se as outras tabelas que usam `SERVICE_ROLE_KEY` em outros arquivos também precisam de RLS.

---

## Pendências de Segurança (HIGH)

### H1 — `/api/chat` sem openaiLimiter
A rota de chat chama OpenAI mas só tem `apiLimiter` (100 req/15min). Um usuário pode gerar custo alto sem restrição.

**Arquivo:** `src/server.js`
**Linha:** `app.use('/api/chat', apiLimiter, chatRoutes);`
**Correção:**
```javascript
app.use('/api/chat', apiLimiter, openaiLimiter, chatRoutes);
```

### H2 — JWT sem blacklist (logout não invalida token)
O logout apenas orienta o client a deletar o token. Token permanece válido por 24h mesmo após logout.

**Arquivo:** `src/routes/auth.js` linha ~259
**Correção sugerida:** Implementar tabela `token_blacklist` no Supabase:
```sql
CREATE TABLE token_blacklist (
  token_jti TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL
);
-- Limpar tokens expirados via cron
DELETE FROM token_blacklist WHERE expires_at < NOW();
```
```javascript
// No logout:
async function revokeToken(token) {
  const decoded = jwt.decode(token);
  await supabase
    .from('token_blacklist')
    .insert({ token_jti: decoded.jti, expires_at: new Date(decoded.exp * 1000) });
}

// No middleware de auth, verificar blacklist antes de aceitar token
```

### H3 — console.error em database.js
Arquivo usa `console.error` direto em vez de Winston logger.

**Arquivo:** `src/services/database.js` linhas 29-31, 73-75
**Correção:** Substituir `console.error(...)` por `logger.error('mensagem', { error: error.message })`

---

## Arquivos para Deletar (limpeza)

### Deletar sem risco

| Caminho | Motivo |
|---------|--------|
| `src/routes/chat.js.backup` | Backup da versão anterior do chat |
| `frontend/index.html.backup` | Backup do frontend legado |
| `frontend/teste.js` | Arquivo com apenas "c" — lixo de desenvolvimento |
| `limpeza/` (pasta inteira) | Pasta de refatorações históricas, sem uso ativo |

**Comando:**
```bash
rm src/routes/chat.js.backup
rm frontend/index.html.backup
rm frontend/teste.js
rm -rf limpeza/
```

### Deletar após confirmar

| Caminho | Motivo | Verificar antes |
|---------|--------|-----------------|
| `src/services/case-review-service.js` | Criado em 31/12, nenhuma rota importa este arquivo | Confirmar que nenhuma rota futura o usará |
| `scopsy-jornada-clinica/` (pasta) | Codebase paralela nunca integrada ao server.js | Confirmar se havia plano de integração |

---

## 19 Scripts Soltos na Raiz

Não fazem parte da aplicação. Não deletar — mover para `scripts/`.

**Organização sugerida:**

```
scripts/
├── debug/
│   ├── check-cases.js
│   ├── debug-env.js
│   ├── debug-journey-progress.js
│   ├── debug-journeys.js
│   ├── debug-psychotic-case.js
│   └── investigate-corrupted-cases.js
├── migrations/
│   ├── create-schema-journey.js
│   └── run-migration-archived-at.js
├── maintenance/
│   ├── fix-null-cases.js
│   └── reset-and-populate-series.js
└── test-manual/
    ├── test-case-generation.js
    ├── test-claude-api.js
    ├── test-diagnostic-api.js
    ├── test-key.js
    ├── test-key-api.js
    ├── test-prod-endpoints.js
    ├── test-query.js
    ├── test-render-path.js
    ├── frontend/reset-my-journey.js
    └── frontend/test-webhook-manual.js
```

---

## Inconsistências a Investigar

### I1 — case.js usa OpenAI mas server.js diz que não usa

**server.js comentário (linha ~223):**
```javascript
// /api/case não usa OpenAI desde 12/02 (geração on-demand removida) — apenas apiLimiter + planLimiter
```

**Mas `src/routes/case.js` linha 797:**
```javascript
const feedbackCompletion = await openai.chat.completions.create({ ... });
```

**Ação:** Verificar se esse trecho está dentro de uma condição desativada ou se realmente chama OpenAI. Se ativo, adicionar `openaiLimiter` na rota. Se inativo, remover o código morto.

### I2 — Dois arquivos de acesso ao banco

| Arquivo | Função |
|---------|--------|
| `src/services/supabase.js` | Expõe apenas o cliente Supabase |
| `src/services/database.js` | Wrapper com funções (`saveToBoostspace`, `getFromBoostspace`, etc.) |

São complementares, não duplicados diretos. Mas o nome `database.js` sugere que é o único acesso ao banco, enquanto `supabase.js` é importado diretamente em 166 lugares. Considerar renomear `database.js` para `boost-space-service.js` para deixar claro o propósito.

---

## Testes com Falha

**9 testes falhando em:** `tests/integration/dashboard.test.js`

Não foram investigados nesta sessão. Prioridade: MÉDIA.

```bash
# Rodar para ver os erros:
cd SCOPSY-CLAUDE-CODE
npm test -- --testPathPattern=dashboard.test.js
```

---

## Achados Adicionais (identificados pós-auditoria inicial)

### CRÍTICO #3 — Webhook sem validação obrigatória (fraude financeira)

**Arquivo:** `src/routes/webhooks.js` linhas 67-75

```javascript
if (process.env.KIWIFY_WEBHOOK_SECRET) {
  // valida token apenas SE a variável estiver configurada
} else {
  logger.warn('validacao desabilitada'); // passa direto!
}
```

Se `KIWIFY_WEBHOOK_SECRET` não estiver no ambiente, qualquer pessoa pode POST em `/api/webhooks` simulando um pagamento e conceder plano PRO/PREMIUM a si mesmo gratuitamente.

**Correção:**
```javascript
// Validação obrigatória — bloquear se secret não estiver configurado
if (!process.env.KIWIFY_WEBHOOK_SECRET) {
  logger.error('[WEBHOOK] KIWIFY_WEBHOOK_SECRET não configurado — endpoint bloqueado');
  return res.status(503).json({ error: 'Webhook não configurado' });
}
if (!validateKiwifyToken(event.token, process.env.KIWIFY_WEBHOOK_SECRET)) {
  logger.error('[WEBHOOK] Rejeitado: token inválido');
  return res.status(401).json({ error: 'Invalid token' });
}
```

---

### CRÍTICO #4 — SERVICE_ROLE_KEY em 7 outros arquivos (além do chat.js já corrigido)

Corrigimos `chat.js` mas o problema existe em mais 7 arquivos:

| Arquivo | Linha | Justificativa no código |
|---------|-------|------------------------|
| `src/socket/chatHandler.js` | 13 | Nenhuma |
| `src/routes/case.js` | 12 | Nenhuma |
| `src/routes/account.js` | 16 | Nenhuma |
| `src/routes/skills.js` | 9 | Nenhuma |
| `src/routes/dashboard.js` | 14 | Nenhuma |
| `src/routes/diagnostic.js` | 12 | Nenhuma |
| `src/routes/journey.js` | 9 | Nenhuma |
| `src/routes/webhooks.js` | 23 | Comentário: "bypass RLS" — pode ser intencional |

**Ação:** Avaliar cada arquivo. Webhooks pode ser legítimo (precisa gravar sem contexto de auth). Os demais devem migrar para `SUPABASE_ANON_KEY` + RLS, como foi feito no `chat.js`.

---

### ALTO #6 — `details: error.message` expondo internos em produção

9 ocorrências em 4 arquivos retornam detalhes de erros internos ao cliente:

```javascript
res.status(500).json({
  error: 'Erro ao processar',
  details: error.message  // ← vaza mensagens internas, nomes de tabelas, queries
});
```

**Arquivos afetados:** `src/routes/auth.js`, `src/routes/chat.js`, `src/middleware/errorHandler.js`, `src/socket/chatHandler.js`

**⚠️ Nota QA (revisão 2026-02-22):** As correções desta sessão NÃO resolveram este item em `chat.js`. A rota `/feedback` (linha 367) ainda expõe `details: error.message`. Varrer o arquivo inteiro antes de fechar.

**Correção:**
```javascript
res.status(500).json({
  error: 'Erro ao processar mensagem',
  // Nunca expor details em produção
  ...(process.env.NODE_ENV !== 'production' && { details: error.message })
});
```

---

### ALTO #7 — Global error handler em `server.js` vaza `error.message` (identificado em QA)

**Arquivo:** `src/server.js` linha 210

```javascript
app.use((err, req, res, next) => {
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message  // ← handler de última instância — expõe TODOS os erros não tratados
  });
});
```

Este handler recebe qualquer erro que escape das rotas. Não estava no levantamento inicial.

**Correção:**
```javascript
app.use((err, req, res, next) => {
  logger.error('Erro não tratado:', { message: err.message, stack: err.stack });
  res.status(500).json({
    error: 'Erro interno do servidor',
    ...(process.env.NODE_ENV !== 'production' && { message: err.message })
  });
});
```

---

## Checklist para o Próximo Agente

- [ ] Revogar todas as API keys expostas no Git
- [ ] Tornar validação do webhook Kiwify obrigatória (`webhooks.js` linhas 67-75)
- [ ] Avaliar SERVICE_ROLE_KEY nos 7 arquivos restantes — migrar para ANON_KEY + RLS onde possível
- [ ] Remover `details: error.message` das respostas de erro em produção — varrer **todos** os arquivos, incluindo `chat.js` (não corrigido nesta sessão) e `server.js` global handler (ALTO #7)
- [ ] Mover `UUID_REGEX` para nível de módulo em `chat.js` (linha 57)
- [ ] Executar `git filter-repo` para remover secrets do histórico
- [ ] Habilitar RLS no Supabase para `chat_conversations` e `chat_messages`
- [ ] Adicionar `openaiLimiter` na rota `/api/chat` em `server.js`
- [ ] Investigar `case.js:797` — OpenAI ativo ou código morto?
- [ ] Implementar JWT blacklist em `auth.js`
- [ ] Substituir `console.error` por `logger.error` em `database.js`
- [ ] Deletar arquivos de backup confirmados
- [ ] Mover 19 scripts para `scripts/`
- [ ] Decidir sobre `scopsy-jornada-clinica/` — integrar ou deletar
- [ ] Investigar e corrigir 9 testes falhando em `dashboard.test.js`
- [ ] Renomear `database.js` → `boost-space-service.js` para clareza
