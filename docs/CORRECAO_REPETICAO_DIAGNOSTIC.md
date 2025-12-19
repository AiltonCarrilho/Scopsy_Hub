# 🔧 Correção: Sistema de Controle de Repetição - Radar Diagnóstico

**Data:** 2024-12-18
**Arquivo Modificado:** `src/routes/diagnostic.js`
**Linhas:** 31-111

---

## 🎯 Problema Identificado

### Antes da Correção:

O módulo **Radar Diagnóstico** (`/api/diagnostic/generate-case`) não rastreava quais casos cada usuário específico já havia visto.

```javascript
// ❌ PROBLEMA: Buscava apenas o caso MENOS usado GLOBALMENTE
const { data: cachedCase } = await supabase
  .from('cases')
  .select('*')
  .eq('status', 'active')
  .eq('difficulty_level', level)
  .eq('category', category)
  .order('times_used', { ascending: true }) // Menos usado GLOBALMENTE
  .limit(1)
  .maybeSingle();
```

**Consequência:**
- Um usuário poderia receber o **mesmo caso diagnóstico múltiplas vezes**
- Não havia aprendizado progressivo (repetição não estratégica)
- Experiência ruim para o usuário

---

## ✅ Solução Implementada

### Após a Correção:

Implementado **controle de repetição por usuário** seguindo o mesmo padrão que já funcionava nos **Desafios Clínicos**.

### Fluxo Corrigido:

```
1. Buscar casos já vistos pelo usuário
   ↓
2. Filtrar esses casos da query
   ↓
3. Escolher aleatoriamente entre os 3 MENOS usados
   ↓
4. Se não houver casos disponíveis → Gerar novo
```

### Código Implementado:

```javascript
// 1️⃣ BUSCAR CASOS QUE O USUÁRIO JÁ VIU
const { data: interactions } = await supabase
  .from('user_case_interactions')
  .select('case_id, created_at')
  .eq('user_id', userId)
  .not('case_id', 'is', null)
  .order('created_at', { ascending: false });

const seenCaseIds = interactions ? interactions.map(i => i.case_id) : [];

// 2️⃣ BUSCAR CASOS DISPONÍVEIS (que usuário NÃO viu)
let casesQuery = supabase
  .from('cases')
  .select('*')
  .eq('status', 'active')
  .eq('difficulty_level', level)
  .eq('category', category);

// Filtrar casos já vistos
if (seenCaseIds.length > 0) {
  casesQuery = casesQuery.not('id', 'in', `(${seenCaseIds.join(',')})`);
}

const { data: availableCases } = await casesQuery
  .order('times_used', { ascending: true })
  .limit(10);

// 3️⃣ ESCOLHER ALEATORIAMENTE ENTRE OS 3 MENOS USADOS
if (availableCases && availableCases.length > 0) {
  const topCases = availableCases.slice(0, Math.min(3, availableCases.length));
  cachedCase = topCases[Math.floor(Math.random() * topCases.length)];

  // Retornar caso selecionado
  return res.json({
    success: true,
    case: cachedCase.case_content,
    case_id: cachedCase.id,
    from_cache: true
  });
}

// 4️⃣ SE NÃO HÁ CASOS DISPONÍVEIS → Gerar novo
```

---

## 🎮 Comportamento Esperado

### Cenário 1: Primeiro Acesso
```
Usuário nunca usou o Radar Diagnóstico
→ Não tem casos vistos
→ Sistema escolhe entre os 3 casos MENOS usados globalmente
→ Variedade aleatória entre esses 3
```

### Cenário 2: Usuário Ativo
```
Usuário já viu 10 casos de ansiedade intermediária
→ Sistema busca casos de ansiedade/intermediária que NÃO estão nos 10 vistos
→ Escolhe aleatoriamente entre os 3 menos usados (que ele não viu)
→ Usuário NUNCA vê o mesmo caso duas vezes (até esgotar o banco)
```

### Cenário 3: Banco Esgotado
```
Usuário já viu TODOS os casos disponíveis
→ availableCases.length === 0
→ Sistema gera NOVO caso via OpenAI GPT-4o-mini
→ Salva no banco para outros usuários
```

---

## 📊 Logging Implementado

O sistema agora loga informações detalhadas para debug:

```javascript
console.log(`[Diagnostic] 👁️ Usuário já viu: ${seenCaseIds.length} casos diagnósticos`);
console.log(`[Diagnostic] 🚫 Filtrando ${seenCaseIds.length} IDs já vistos`);
console.log(`[Diagnostic] 📦 Casos disponíveis no cache: ${availableCases.length}`);
console.log(`[Diagnostic] ✅ Caso selecionado (id: ${cachedCase.id}, usado ${cachedCase.times_used}x)`);
```

**Como verificar se está funcionando:**

1. Inicie o backend: `npm run dev`
2. Acesse o Radar Diagnóstico no frontend
3. Gere 3 casos seguidos
4. Verifique o terminal:

```
[Diagnostic] 👁️ Usuário já viu: 0 casos diagnósticos
[Diagnostic] 📦 Casos disponíveis no cache: 25
[Diagnostic] ✅ Caso selecionado (id: abc-123, usado 3x)

[Diagnostic] 👁️ Usuário já viu: 1 casos diagnósticos
[Diagnostic] 🚫 Filtrando 1 IDs já vistos
[Diagnostic] 📦 Casos disponíveis no cache: 24
[Diagnostic] ✅ Caso selecionado (id: def-456, usado 2x)

[Diagnostic] 👁️ Usuário já viu: 2 casos diagnósticos
[Diagnostic] 🚫 Filtrando 2 IDs já vistos
[Diagnostic] 📦 Casos disponíveis no cache: 23
[Diagnostic] ✅ Caso selecionado (id: ghi-789, usado 1x)
```

---

## 🔄 Comparação com Outros Módulos

| Módulo | Controle de Repetição | Status |
|--------|----------------------|--------|
| **Desafios Clínicos** | ✅ Sim (por usuário) | OK |
| **Conceituação de Caso** | ✅ Sim (por usuário) | OK |
| **Radar Diagnóstico** | ✅ Sim (CORRIGIDO) | **FIXADO** |
| **Jornada Clínica** | N/A (sequencial) | OK |

---

## 🧪 Como Testar

### Teste Manual:

1. Login como usuário de teste
2. Acesse Radar Diagnóstico
3. Gere 5 casos consecutivos
4. **Expectativa:** Todos os 5 casos são DIFERENTES
5. Verifique IDs no console do backend

### Teste de Esgotamento (avançado):

```javascript
// Simular usuário que viu TODOS os casos
// Deve gerar novo caso via OpenAI

// No Supabase, marcar todos casos como vistos pelo user_id=X
// Então gerar novo caso
// Deve aparecer: "[Diagnostic] ⏳ Cache MISS - Gerando novo caso..."
```

---

## 📈 Impacto Esperado

### UX (Experiência do Usuário):
- ✅ Sem repetições indesejadas
- ✅ Aprendizado progressivo (sempre casos novos)
- ✅ Maior engajamento (variedade)

### Performance:
- ✅ Mesma performance (query adicional é rápida)
- ✅ Logs detalhados para debug
- ✅ Seleção aleatória entre os 3 menos usados (variedade)

### Escalabilidade:
- ✅ Quando banco tiver 100+ casos, usuário leva muito tempo para esgotar
- ✅ Sistema gera novos casos quando necessário
- ✅ Casos gerados são salvos para outros usuários

---

## 🔒 Garantias

1. **Usuário NÃO vê o mesmo caso duas vezes** (até esgotar banco)
2. **Sistema gera novos casos** quando necessário
3. **Variedade garantida** (escolha aleatória entre os 3 menos usados)
4. **Logs detalhados** para debug e monitoramento

---

## 🚀 Próximos Passos (Futuro)

### Repetição Estratégica (Spaced Repetition):

Atualmente, casos **NUNCA** se repetem. No futuro, pode-se implementar:

- Repetir casos após X dias (reforço espaçado)
- Repetir casos onde usuário errou (correção)
- Algoritmo de espaçamento (1 dia → 3 dias → 7 dias → 14 dias)

**Exemplo:**
```javascript
// FUTURO: Permitir repetição estratégica
const seenRecently = interactions.filter(i => {
  const daysSince = (Date.now() - new Date(i.created_at)) / (1000 * 60 * 60 * 24);
  return daysSince < 7; // Repetir apenas se passou 7+ dias
});
```

Por enquanto, **repetição ZERO** é o comportamento correto para MVP.

---

**Revisado por:** Claude Sonnet 4.5
**Testado em:** Desenvolvimento (localhost)
**Status:** ✅ Pronto para deploy
