# CHECKPOINT: RLS Fix para Desafios Clínicos - 2026-03-04

**Data:** 2026-03-04 20:15 UTC
**Branch:** main
**Commit:** 1a69804 (fix(RLS): use supabaseAdmin for shared cases table)
**Status:** ❌ IMPLEMENTAÇÃO FALHOU - INVESTIGAÇÃO NECESSÁRIA

---

## 📋 RESUMO EXECUTIVO

O módulo "Desafios Clínicos" (M1) não estava trazendo casos do banco de dados. Após investigação profunda com 3 especialistas (@analyst, @architect, @data-engineer), identificamos que:

1. **96 casos existem no Supabase** (confirmado por @analyst)
2. **A causa não era falta de dados, mas mismatch arquitetural** (confirmado por @architect)
3. **O problema raiz era permissão RLS** (confirmado por @data-engineer)

---

## 🔍 INVESTIGAÇÃO REALIZADA

### @analyst (Alex) - Inventário de Casos
- ✅ M1 (Desafios): 96 casos no Supabase (meta: 100)
- ✅ M2 (Conceituação): 50 casos
- ✅ M3 (Diagnóstico): 51 casos
- ✅ M4 (Jornada): 12 jornadas + 144 sessões
- **Total:** 242+ casos clínicos prontos
- **Conclusão:** Dados existem, problema não é falta de dados

### @architect (Aria) - Análise Arquitetural
- ❌ Frontend (Next.js) chama: `GET /api/cases` (REST)
- ❌ Backend (Express) oferece: `POST /api/case/generate` (RPC)
- ✅ M3 (Diagnóstico) funciona porque tem endpoint separado
- **Conclusão:** API ROUTE MISMATCH entre frontend e backend

### @data-engineer (Dara) - Auditoria RLS
- ✅ Tabela `cases` tem policy: `rls_cases_readonly USING (TRUE)` (permitiria SELECT)
- ❌ MAS: Não há `GRANT SELECT ON cases TO anon`
- ❌ Cliente supabase (ANON_KEY) conecta como role `anon`
- ❌ `set_auth_context()` RPC só seta variável, não muda role
- **Resultado:** Role `anon` não tem permissão SELECT na tabela
- **Conclusão:** RLS PERMISSION PROBLEM

---

## 💡 SOLUÇÃO IMPLEMENTADA

**Opção 3 (Hybrid) - Recomendada:**
- Use `supabaseAdmin` para `cases` table (conteúdo compartilhado)
- Use `supabase` (RLS) para `user_case_interactions` (dados de usuário)

**Arquivos modificados:**
1. `src/routes/case.js`:
   - Linha 9-11: Importação de `supabaseAdmin`
   - 7 queries de `cases` → `supabaseAdmin`
   - `user_case_interactions` mantém `supabase` (RLS)

2. `src/routes/diagnostic.js`:
   - Linha 9-11: Importação de `supabaseAdmin`
   - 4 queries de `cases` → `supabaseAdmin`
   - `user_case_interactions` mantém `supabase` (RLS)

**Commit:**
```
1a69804 fix(RLS): use supabaseAdmin for shared cases table
- 2 files changed, 27 insertions(+), 9 deletions(-)
```

**Testes:**
- 126 tests passing (sem regressão)
- 19 tests failing (mesmos de antes - coverage issues)

---

## ❌ O QUE DEU ERRADO

**Ao testar em produção:**
- ❌ Desafios ainda não traz casos
- ❌ Erro específico não foi reportado pelo usuário
- ❌ Backend pode estar falhando silenciosamente

**Possíveis causas:**
1. `supabaseAdmin` é NULL (SERVICE_ROLE_KEY não setado em .env.local)
2. Erro silencioso no backend (queries falhando mas código continua)
3. `.env.local` ainda tem credenciais inválidas
4. Erro de compilação/sintaxe não detectado
5. Outro bloqueio não identificado na investigação

---

## 📊 ESTADO ATUAL

### Credenciais
- SUPABASE_URL: ✅ `https://vhwpohwklbguizaixitv.supabase.co` (produção)
- SUPABASE_ANON_KEY: ✅ `sb_publicable_iQphaGupQm1KsEv4ZewyGA_GBJ0n-7W` (em .env.local)
- SUPABASE_SERVICE_ROLE_KEY: ❌ **NÃO CONFIGURADO** em .env.local (CRÍTICO!)
- OPENAI_API_KEY: ✅ `sk-proj-Dq...` (em .env.local)

### Código
- case.js: ✅ Modificado para usar `supabaseAdmin`
- diagnostic.js: ✅ Modificado para usar `supabaseAdmin`
- supabase.js: ✅ Exporta ambos `supabase` e `supabaseAdmin`

### Teste
- npm test: ✅ Passes (126), Fails (19)
- Backend: ❓ Não foi testado em produção

---

## 🚨 BLOQUEADORES IDENTIFICADOS

### 1. SERVICE_ROLE_KEY Ausente
Se `SUPABASE_SERVICE_ROLE_KEY` não estiver em `.env.local`:
```javascript
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(...SERVICE_ROLE_KEY)
  : null;  // ← Retorna NULL!
```

Quando código tenta usar `supabaseAdmin.from('cases')`:
```
Error: Cannot read property 'from' of null
```

**Ação necessária:** Adicionar `SUPABASE_SERVICE_ROLE_KEY` ao `.env.local`

### 2. Erro Silencioso no Backend
Se `supabaseAdmin` for null, o código não falha imediatamente:
```javascript
const { data: cases } = await supabaseAdmin?.from('cases')...
// data = undefined
// Código continua sem erro explícito
// Frontend recebe resposta vazia
```

**Ação necessária:** Adicionar validação explícita

---

## 🔧 PRÓXIMOS PASSOS (para próxima conversa)

### FASE 1: Diagnosticar Erro Exato
1. ✅ Ver qual é o erro específico ao executar `/api/case/generate`
2. ✅ Verificar se `supabaseAdmin` é null
3. ✅ Checar logs do backend
4. ✅ Validar `.env.local` tem `SUPABASE_SERVICE_ROLE_KEY`

### FASE 2: Resolver Bloqueador
Se `SERVICE_ROLE_KEY` estiver ausente:
1. Copiar chave do `.env.production` ou GitHub
2. Adicionar a `.env.local`
3. Reiniciar backend
4. Testar `/api/case/generate` manualmente

### FASE 3: Validação
1. ✅ Testar desafios.html → "Novo Momento Crítico" → deve trazer caso
2. ✅ Testar diagnostic.html (M3)
3. ✅ Testar conceituacao.html (M2)
4. ✅ Verificar que RLS ainda funciona (user_case_interactions isolada)

### FASE 4: Fallback (se Hybrid não funcionar)
Se mesmo com `supabaseAdmin` não funcionar:
- Investigar se há bloqueio GRANT no Supabase
- Considerar adicionar: `GRANT SELECT ON cases TO anon`
- Considerar Opção 2: reverter para `supabaseAdmin` globalmente

---

## 📁 ARQUIVOS DE REFERÊNCIA

**Investigação completa:**
- Relatório @analyst: RESUMIDO neste checkpoint
- Relatório @architect: RESUMIDO neste checkpoint
- Relatório @data-engineer: RESUMIDO neste checkpoint

**Código:**
- Implementação: Commit 1a69804
- RLS schema: sql-scripts/11-rls-hybrid-implementation.sql
- Frontend: frontend/js/desafios.js (linha 361)

**Estado do projeto:**
- Branch: main
- Últimos commits antes desta fix: P0.3 Kiwify webhooks
- Design System: 36+ componentes (paralelo)

---

## 🎯 CHECKLIST PARA RETOMADA

Quando retomar em próxima conversa:

- [ ] Executar backend em dev
- [ ] Chamar POST /api/case/generate manualmente (curl ou Postman)
- [ ] Capturar erro exato
- [ ] Verificar `.env.local` tem SERVICE_ROLE_KEY
- [ ] Validar supabaseAdmin não é null
- [ ] Se falhar: chamar @data-engineer novamente com erro específico

---

**Checkpoint criado por:** Orion (AIOS Master)
**Próxima ação:** Diagnóstico do erro específico ao executar endpoint
**Estimativa:** 30-45 min para resolução completa

