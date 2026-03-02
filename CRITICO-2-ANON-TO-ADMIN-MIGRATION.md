# CRITICO-2: Migration from ANON_KEY to SERVICE_ROLE_KEY

**Data:** 2026-02-28
**Motivo:** Com RLS DENY ALL para anon ativado, operacoes server-side de escrita (e leitura) falhavam silenciosamente porque usavam SUPABASE_ANON_KEY.

## Problema

3 caminhos de codigo usavam o client Supabase com ANON_KEY para operacoes de escrita que agora sao bloqueadas por RLS:

1. **`src/routes/auth.js`** (linha 170) -- `updateInBoostspace('users', ...)` para atualizar `last_login`
2. **`src/services/streakService.js`** -- `getFromBoostspace` + `updateInBoostspace` para ler e atualizar streaks
3. **`src/services/badgeService.js`** -- acesso direto ao client `supabase` para SELECT, INSERT em `users`, `user_badges`, `badges`, `user_activity_log`

Todos esses caminhos passavam por `src/services/database.js` e `src/services/supabase.js`, que so exportavam um client com ANON_KEY.

## Solucao Implementada

### Arquivo 1: `src/services/supabase.js`
- **Adicionado:** Leitura de `SUPABASE_SERVICE_ROLE_KEY` do environment
- **Adicionado:** Criacao de `supabaseAdmin` client com SERVICE_ROLE_KEY
- **Fallback:** Se SERVICE_ROLE_KEY nao estiver definida, `supabaseAdmin` aponta para o client anon (evita quebra em dev)
- **Exportado:** `{ supabase, supabaseAdmin }`

### Arquivo 2: `src/services/database.js`
- **Importacao:** Agora importa `{ supabase, supabaseAdmin }` de `./supabase`
- **`saveToBoostspace`:** Trocado de `supabase` para `supabaseAdmin` (INSERT)
- **`getFromBoostspace`:** Trocado de `supabase` para `supabaseAdmin` (SELECT) -- server-side reads tambem precisam bypass RLS
- **`updateInBoostspace`:** Trocado de `supabase` para `supabaseAdmin` (UPDATE)
- **`deleteFromBoostspace`:** Trocado de `supabase` para `supabaseAdmin` (DELETE)
- **Exportacao:** Adicionado `supabase` e `supabaseAdmin` aos exports

### Arquivo 3: `src/services/badgeService.js`
- **Importacao:** Trocado `supabase` por `supabaseAdmin: supabase` (alias) -- todas as queries diretas agora usam admin client
- Nenhuma outra mudanca no arquivo; o alias garante que todo `supabase.from(...)` existente use o admin client

### Arquivo 4: `src/routes/auth.js`
- **Nenhuma mudanca necessaria** -- ja usava `updateInBoostspace()` que agora usa admin internamente

### Arquivo 5: `src/services/streakService.js`
- **Nenhuma mudanca necessaria** -- ja usava `getFromBoostspace()` e `updateInBoostspace()` que agora usam admin internamente

## Justificativa

Todo codigo em `src/services/` e `src/routes/` e server-side. Nao ha motivo para operacoes server-side passarem por RLS -- RLS existe para proteger acesso direto do client (browser). O padrao de usar SERVICE_ROLE_KEY no server ja era usado em:

- `src/routes/account.js`
- `src/routes/chat.js`
- `src/routes/dashboard.js`
- `src/routes/case.js`
- `src/routes/diagnostic.js`
- `src/routes/journey.js`
- `src/routes/skills.js`
- `src/routes/webhooks.js`
- `src/socket/chatHandler.js`

Todos esses arquivos ja criavam seu proprio `createClient(URL, SERVICE_ROLE_KEY)`. A diferenca e que `database.js` (usado por auth, streak e badge) nao tinha sido migrado.

## Requisito de Environment

O arquivo `.env.local` DEVE conter:

```
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Essa key ja deve existir no environment de producao, pois os outros arquivos listados acima ja a utilizam.

## Status

- [x] Arquivos modificados
- [x] Logica preservada (sem mudancas de comportamento alem do client)
- [x] Fallback seguro se SERVICE_ROLE_KEY ausente
- [ ] Pronto para QA -- validar que login, streaks e badges funcionam com RLS ativo
