# 🔍 AUDITORIA: Código Não Utilizado ou Mal Implementado

**Data:** 2025-01-11
**Versão:** 1.0
**Status:** 🚨 CRÍTICO - Múltiplos problemas identificados

---

## ❌ PROBLEMAS CRÍTICOS

### 1. Dashboard Retorna Dados Falsos
**Arquivo:** `src/routes/dashboard.js:8-16`
**Status:** 🔴 **NÃO FUNCIONA**

```javascript
// PROBLEMA: Sempre retorna zeros hardcoded
router.get('/stats', (req, res) => {
  res.json({
    cases_completed: 0,
    practice_hours: 0,
    accuracy: 0,
    streak_days: 0,
    xp_points: 0
  });
});
```

**Impacto:**
- ❌ Dashboard do usuário sempre mostra "0 casos completados"
- ❌ Gamificação não funciona (XP não aparece)
- ❌ Usuário não vê progresso real

**Solução:** Buscar dados reais de `user_progress` e `user_stats` do Supabase

---

### 2. Rate Limiting Não Implementado
**Arquivo:** `src/socket/chatHandler.js:158-173`
**Status:** 🟡 **PLACEHOLDER**

```javascript
async function checkRateLimit(userId, plan) {
  // TODO: Implementar com Redis ou Boost.space
  // Por ora, permitir sempre (implementar depois)

  const limits = {
    free: 20,      // 20 mensagens/dia
    basic: 100,    // 100 mensagens/dia
    pro: 500,      // 500 mensagens/dia
    premium: 9999  // Ilimitado
  };

  // Placeholder - sempre retorna true por ora
  return true;
}
```

**Impacto:**
- ❌ Usuários FREE podem usar ilimitado (vazamento de receita)
- ❌ Sem proteção contra spam/abuso
- ❌ Custos OpenAI podem explodir

**Solução:** Implementar contador no Supabase ou Redis

---

### 3. Last Login Não Atualiza
**Arquivo:** `src/routes/auth.js:159-161`
**Status:** 🟡 **TODO**

```javascript
// Atualizar last_login
// TODO: Implementar update quando precisar
```

**Impacto:**
- ❌ Métricas de retenção incorretas
- ❌ Não dá pra calcular DAU/MAU
- ❌ Impossível identificar usuários inativos

**Solução:** Adicionar `updateInBoostspace('users', userId, { last_login: now })`

---

### 4. updateUserStats Usa Função Errada
**Arquivo:** `src/services/openai-service.js:417-422`
**Status:** 🔴 **BUG - VAI FALHAR**

```javascript
// BUG: Usa saveToBoostspace (INSERT) em vez de updateInBoostspace (UPDATE)
await saveToBoostspace('user_stats', {
  id: stats[0].id,  // ❌ INSERT com ID causa erro duplicate key
  last_activity: new Date().toISOString(),
  updated_at: new Date().toISOString()
});
```

**Impacto:**
- 🔥 **ERRO:** Duplicate key violation ao atualizar stats
- ❌ last_activity nunca é atualizado
- ❌ Streak days quebrado

**Solução:** Trocar para `updateInBoostspace('user_stats', stats[0].id, data)`

---

### 5. Função generateId() Duplicada e Não Usada
**Arquivo:** `src/routes/auth.js:3-9`
**Status:** 🟢 **CÓDIGO MORTO**

```javascript
// Função duplicada! (aparece 2x)
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
function generateId() { // <- DUPLICADO
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
```

**Impacto:**
- ⚠️ Confusão no código
- ⚠️ Nunca é usada (Supabase gera UUIDs automaticamente)

**Solução:** **DELETAR** ambas as funções

---

## ✅ FUNCIONA (mas pode melhorar)

### 6. Cache de Respostas OpenAI
**Arquivo:** `src/services/openai-service.js:38-39, 109-161, 446-452`
**Status:** 🟢 **IMPLEMENTADO** (mas limitado)

```javascript
// Cache declarado
const responseCache = new Map();

// Cache funcionando em sendMessage()
const cacheKey = `${assistantType}:${message.toLowerCase().trim()}`;
if (responseCache.has(cacheKey)) {
  logger.info('Resposta em cache encontrada', { cacheKey });
  return responseCache.get(cacheKey);
}

// Salvar no cache
if (['start', 'menu', 'help'].includes(message.toLowerCase().trim())) {
  responseCache.set(cacheKey, result);
}

// Limpar cache a cada 1 hora
setInterval(clearCache, 60 * 60 * 1000);
```

**Status:** ✅ FUNCIONA

**Limitações:**
- Só cacheia 3 comandos (start, menu, help)
- Poderia cachear mais perguntas comuns
- Não tem TTL diferenciado

**Melhorias possíveis:**
- Expandir para "Como funciona?", "O que é TCC?", etc
- TTL configurável por tipo de mensagem
- Considerar usar Redis (mais robusto)

---

## 📊 RESUMO

| # | Problema | Severidade | Funciona? | Ação |
|---|----------|-----------|-----------|------|
| 1 | Dashboard zeros | 🔴 Alta | ❌ NÃO | IMPLEMENTAR |
| 2 | Rate limiting | 🔴 Alta | ❌ NÃO | IMPLEMENTAR |
| 3 | Last login | 🟡 Média | ❌ NÃO | IMPLEMENTAR |
| 4 | updateUserStats bug | 🔴 Alta | 🔥 QUEBRADO | CORRIGIR |
| 5 | generateId() duplicado | 🟢 Baixa | N/A | DELETAR |
| 6 | Cache OpenAI | 🟢 Baixa | ✅ SIM | EXPANDIR |

---

## 🎯 PRIORIDADE DE CORREÇÃO

### P0 - CRÍTICO (Implementar AGORA)
1. ✅ Corrigir `updateUserStats` (evita crashes)
2. ✅ Implementar dashboard real (gamificação depende disso)
3. ✅ Deletar `generateId()` (cleanup)

### P1 - ALTA (Implementar esta semana)
4. ⚠️ Rate limiting funcional (evita custos)
5. ⚠️ Update last_login (métricas)

### P2 - MÉDIA (Implementar depois)
6. 💡 Expandir cache OpenAI (otimização)

---

## 📝 NOTAS

- **Código escrito mas não usado** é comum em MVPs rápidos
- **TODOs acumulados** indicam pressa no desenvolvimento
- **Priorizar correções que afetam experiência do usuário**
- Testes automatizados evitariam esses bugs

---

**Próximo passo:** Implementar correções P0 (críticas)
