# 🚀 ROADMAP DE MELHORIAS CRÍTICAS - SCOPSY

**Data:** 29/12/2025
**Status:** Pós-correção de repetição de casos
**Objetivo:** Preparar sistema para escala (1.000 → 10.000 → 100.000 usuários)

---

## 📊 CONTEXTO ATUAL

### ✅ Correções Já Implementadas

1. **Anti-repetição de casos** (29/12/2025)
   - `src/routes/case.js`: Registra visualização ao gerar caso
   - `src/routes/diagnostic.js`: Mesma lógica aplicada
   - **Impacto:** Casos não repetem mais, mesmo sem responder

### 🔍 Estado do Sistema

**Arquitetura:** Híbrido (cache-first + on-demand fallback)
**Casos estimados no banco:** ~350-450 casos
**Custo OpenAI atual:** ~R$165/mês (100 users)
**Custo OpenAI em escala:** ~R$6.300/mês (10k users) - ⚠️ **Insustentável sem otimizações**

### 📈 Scorecard de Preparação para Escala

| Aspecto | Nota | Status |
|---------|------|--------|
| Arquitetura cache-first | 9/10 | ✅ Excelente |
| Otimização de custos on-demand | 7/10 | ⚠️ Bom |
| Qualidade dos prompts | 8/10 | ✅ Muito bom |
| **Sistema de qualidade** | **2/10** | 🔴 **CRÍTICO** |
| **População de casos** | **4/10** | 🔴 **Insuficiente** |
| **Custo de feedback** | **3/10** | 🔴 **Insustentável** |
| Deduplicação | 1/10 | 🔴 Inexistente |
| Disaster recovery | 2/10 | 🔴 Inexistente |
| **GERAL** | **5.5/10** | ⚠️ **Requer melhorias** |

---

## 🔥 MELHORIAS CRÍTICAS (URGENTE)

### 1. Sistema de Review de Qualidade 🚨

**PROBLEMA:**
```javascript
// src/routes/case.js linha 335
quality_score: 4.0,  // FIXO! Sem critério
status: 'active'     // Vai direto para produção SEM validação
```

- ❌ Casos gerados on-demand vão **direto para produção**
- ❌ Nenhum review humano
- ❌ Nenhuma validação automática (DSM-5-TR? Opções plausíveis?)
- ❌ Usuários não podem reportar casos ruins

**RISCO:**
> Caso com erro clínico grave pode ser servido a **milhares de usuários**
> Reputação destruída + risco legal (orientação clínica errada)

#### Solução Parte 1: Validação Automática Básica

**Arquivo:** `src/routes/case.js` (após geração on-demand, linha ~320)

```javascript
// 🆕 VALIDAÇÃO AUTOMÁTICA
function validateGeneratedCase(caseData) {
  const errors = [];

  // 1. JSON bem formado?
  if (!caseData || typeof caseData !== 'object') {
    errors.push('Caso não é um objeto JSON válido');
    return { valid: false, errors };
  }

  // 2. Tem campos obrigatórios?
  const requiredFields = ['context', 'critical_moment', 'options', 'expert_choice'];
  requiredFields.forEach(field => {
    if (!caseData[field]) {
      errors.push(`Campo obrigatório ausente: ${field}`);
    }
  });

  // 3. Opções são array de 4 elementos?
  if (!Array.isArray(caseData.options) || caseData.options.length !== 4) {
    errors.push('Deve ter exatamente 4 opções');
  }

  // 4. expert_choice está nas opções?
  if (caseData.options && !caseData.options.includes(caseData.expert_choice)) {
    errors.push('Resposta correta não está nas opções');
  }

  // 5. Diálogo tem mínimo de palavras?
  const dialogue = caseData.critical_moment?.dialogue || '';
  const wordCount = dialogue.split(/\s+/).length;
  if (wordCount < 20) {
    errors.push(`Diálogo muito curto (${wordCount} palavras, mínimo 20)`);
  }

  // 6. Opções têm tamanho mínimo?
  if (caseData.options) {
    caseData.options.forEach((opt, idx) => {
      if (!opt || opt.length < 5) {
        errors.push(`Opção ${idx + 1} muito curta`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

// Usar após gerar caso:
const validation = validateGeneratedCase(generatedCase);

if (!validation.valid) {
  console.error('[Case] ❌ Caso gerado falhou validação:', validation.errors);

  // Marcar como needs_review
  status = 'needs_review';
  quality_score = 2.0;  // Baixo

  // Logar para admin revisar
  await supabase
    .from('case_validation_errors')
    .insert({
      case_content: generatedCase,
      errors: validation.errors,
      created_at: new Date().toISOString()
    });
} else {
  console.log('[Case] ✅ Validação básica passou');
  status = 'pending_review';  // Ainda precisa review humano
  quality_score = 3.5;
}
```

#### Solução Parte 2: Status Workflow

**Migration SQL:** `sql-scripts/03-quality-workflow.sql`

```sql
-- Adicionar novos status à coluna (se não existir)
ALTER TABLE cases
ADD CONSTRAINT valid_status
CHECK (status IN ('active', 'pending_review', 'needs_review', 'rejected'));

-- Tabela de erros de validação
CREATE TABLE IF NOT EXISTS case_validation_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_content JSONB NOT NULL,
  errors TEXT[] NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by TEXT
);

-- Índice para buscar casos pendentes
CREATE INDEX IF NOT EXISTS idx_cases_pending_review
ON cases(status) WHERE status = 'pending_review';
```

#### Solução Parte 3: Interface de Review (Admin)

**Arquivo novo:** `frontend/admin-review.html`

```html
<!DOCTYPE html>
<html>
<head>
  <title>Scopsy - Review de Casos</title>
  <link rel="stylesheet" href="css/main.css">
</head>
<body>
  <div class="admin-container">
    <h1>📋 Casos Pendentes de Revisão</h1>

    <div id="pending-cases"></div>

    <script src="js/admin-review.js"></script>
  </div>
</body>
</html>
```

**Arquivo novo:** `frontend/js/admin-review.js`

```javascript
const API_URL = window.API_URL;

// Buscar casos pendentes
async function loadPendingCases() {
  const token = localStorage.getItem('adminToken');

  const response = await fetch(`${API_URL}/api/admin/pending-cases`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const { cases } = await response.json();
  renderCases(cases);
}

function renderCases(cases) {
  const container = document.getElementById('pending-cases');

  container.innerHTML = cases.map(c => `
    <div class="case-card">
      <h3>${c.disorder} - ${c.difficulty_level}</h3>
      <pre>${JSON.stringify(c.case_content, null, 2)}</pre>

      <div class="actions">
        <button onclick="approveCase('${c.id}')">✅ Aprovar</button>
        <button onclick="rejectCase('${c.id}')">❌ Rejeitar</button>
        <button onclick="requestChanges('${c.id}')">⚠️ Solicitar Mudanças</button>
      </div>
    </div>
  `).join('');
}

async function approveCase(caseId) {
  const token = localStorage.getItem('adminToken');

  await fetch(`${API_URL}/api/admin/approve-case/${caseId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  alert('Caso aprovado!');
  loadPendingCases();
}

// Carregar ao iniciar
loadPendingCases();
```

**Backend:** `src/routes/admin.js` (novo arquivo)

```javascript
const express = require('express');
const router = express.Router();
const { authenticateRequest } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware para verificar se é admin
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  next();
}

// GET /api/admin/pending-cases
router.get('/pending-cases', authenticateRequest, requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false });

  res.json({ success: true, cases: data });
});

// POST /api/admin/approve-case/:id
router.post('/approve-case/:id', authenticateRequest, requireAdmin, async (req, res) => {
  const { id } = req.params;

  await supabase
    .from('cases')
    .update({
      status: 'active',
      quality_score: 4.5,
      reviewed_by: req.user.userId,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', id);

  res.json({ success: true });
});

// POST /api/admin/reject-case/:id
router.post('/reject-case/:id', authenticateRequest, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  await supabase
    .from('cases')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      reviewed_by: req.user.userId,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', id);

  res.json({ success: true });
});

module.exports = router;
```

**Registrar rota:** `src/server.js`

```javascript
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);
```

#### Checklist de Implementação

- [ ] Criar função `validateGeneratedCase()`
- [ ] Adicionar status workflow (pending_review, needs_review, rejected)
- [ ] Criar tabela `case_validation_errors` (migration SQL)
- [ ] Modificar geração on-demand para usar status='pending_review'
- [ ] Criar interface admin de review (`frontend/admin-review.html`)
- [ ] Criar rotas admin (`src/routes/admin.js`)
- [ ] Adicionar campo `role` em `users` table (admin vs user)
- [ ] Testar fluxo completo (gerar → validar → revisar → aprovar)

**Tempo estimado:** 2-3 dias
**Impacto:** 🔥🔥🔥 **CRÍTICO** - Evita desastre de reputação

---

### 2. Aumentar População de Casos 📚

**PROBLEMA:**
- ~350-450 casos totais no banco
- Suficiente para apenas ~12-15 usuários sem repetição
- Usuário 16+ começa a esgotar banco → geração on-demand (sem validação!)

**META:** **2.000 casos** (suficiente para 60-70 usuários confortáveis)

#### Solução: Executar Scripts + Criar Novos

**Passo 1: Verificar Estado Atual do Banco**

```bash
cd D:\projetos.vscode\SCOPSY-CLAUDE-CODE

# Criar script de contagem
cat > count-cases.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function countCases() {
  // Total por status
  const { data: byStatus } = await supabase
    .from('cases')
    .select('status')
    .then(({ data }) => {
      const counts = {};
      data.forEach(c => {
        counts[c.status] = (counts[c.status] || 0) + 1;
      });
      return { data: counts };
    });

  console.log('\n📊 Casos por Status:');
  console.log(byStatus);

  // Total por categoria
  const { data: byCategory } = await supabase
    .from('cases')
    .select('category, difficulty_level')
    .eq('status', 'active');

  const catCounts = {};
  byCategory.forEach(c => {
    const key = `${c.category || 'unknown'} - ${c.difficulty_level}`;
    catCounts[key] = (catCounts[key] || 0) + 1;
  });

  console.log('\n📊 Casos Ativos por Categoria:');
  Object.entries(catCounts).sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });

  // Total por criador
  const { data: byCreator } = await supabase
    .from('cases')
    .select('created_by')
    .eq('status', 'active');

  const creatorCounts = {};
  byCreator.forEach(c => {
    const creator = c.created_by || 'unknown';
    creatorCounts[creator] = (creatorCounts[creator] || 0) + 1;
  });

  console.log('\n📊 Casos por Criador:');
  Object.entries(creatorCounts).sort((a, b) => b[1] - a[1])
    .forEach(([creator, count]) => {
      console.log(`  ${creator}: ${count}`);
    });

  process.exit(0);
}

countCases();
EOF

# Executar
node count-cases.js
```

**Passo 2: Executar Scripts Existentes**

```bash
# Verificar quais scripts já existem
ls populate-*.js

# Executar scripts que ainda não rodaram (verificar output do count-cases.js)
node populate-anxiety.js          # 15 casos (ansiedade)
node populate-trauma-mood.js      # 30 casos (trauma + mood)
node populate-all-categories.js   # ~66 casos (múltiplas categorias)
node populate-cases.js            # ~140 casos (diagnóstico geral)
node populate-micromoments.js     # ~28 casos (micro-momentos)
node populate-quick.js            # 30 casos (resistência técnica)
```

**Passo 3: Criar Scripts Adicionais para Chegar em 2000**

**Script:** `populate-additional-1000.js`

```javascript
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Categorias expandidas
const categories = [
  'anxiety', 'mood', 'trauma', 'personality', 'psychotic',
  'eating', 'substance', 'somatic', 'dissociative', 'sleep',
  'neurodevelopmental', 'sexual', 'impulse_control'
];

const levels = ['basic', 'intermediate', 'advanced'];

async function generateBatch() {
  let totalGenerated = 0;

  for (const category of categories) {
    for (const level of levels) {
      console.log(`\n🔄 Gerando casos: ${category} - ${level}`);

      // Gerar 25 casos por categoria/nível = 13 categorias × 3 níveis × 25 = 975 casos
      for (let i = 0; i < 25; i++) {
        try {
          const caseData = await generateCase(category, level);

          await supabase
            .from('cases')
            .insert({
              disorder: caseData.disorder,
              difficulty_level: level,
              case_content: caseData,
              category: category,
              created_by: 'batch_population_script',
              status: 'pending_review',  // ✅ Requer review
              quality_score: 3.5,
              created_at: new Date().toISOString()
            });

          totalGenerated++;
          console.log(`  ✅ ${totalGenerated}/975 casos gerados`);

          // Rate limit: esperar 1s entre gerações
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`  ❌ Erro:`, error.message);
        }
      }
    }
  }

  console.log(`\n🎉 TOTAL GERADO: ${totalGenerated} casos`);
  console.log('⚠️ STATUS: pending_review (requer aprovação humana)');
}

async function generateCase(category, level) {
  // ... (usar mesmo prompt dos scripts existentes)
}

generateBatch();
```

**Executar:**
```bash
# CUIDADO: Vai gerar ~975 casos (custo OpenAI ~$1.50)
node populate-additional-1000.js
```

#### Solução Alternativa: Revisão Manual de Casos Existentes

Se não quiser gerar novos casos agora:

1. **Revisar casos `pending_review`** (interface admin)
2. **Aprovar casos de qualidade** → status='active'
3. **Rejeitar casos ruins** → status='rejected'
4. **Meta:** Ter pelo menos 1000 casos ativos antes de marketing agressivo

#### Checklist

- [ ] Executar `count-cases.js` para ver estado atual
- [ ] Executar scripts existentes que ainda não rodaram
- [ ] Criar e executar `populate-additional-1000.js`
- [ ] **OU** Revisar casos pending_review via interface admin
- [ ] Verificar: atingiu meta de 2000 casos ativos?

**Tempo estimado:** 1 dia (execução) + 2-3 dias (review manual)
**Custo:** ~$2-3 OpenAI (geração em massa)
**Impacto:** 🔥🔥 **ALTO** - Reduz dependência de geração on-demand

---

### 3. Otimizar Custo de Feedback Conceituação 💸

**PROBLEMA:**
```javascript
// src/routes/case.js linha 549
model: "gpt-4o"  // CARO! (33x mais caro que gpt-4o-mini)
```

**Custo em escala (10k usuários):**
- Feedback conceituação: **R$5.400/mês** (85% do custo OpenAI!)
- Total: **R$9.825/mês**
- Break-even: **330 assinantes** (margem apertada)

#### Solução 1: Cache de Feedbacks Similares

**Conceito:** Se conceituação do usuário é similar a uma já avaliada, retornar feedback cacheado.

**Implementação:** `src/routes/case.js` (antes de chamar OpenAI)

```javascript
const crypto = require('crypto');

// Função para calcular hash da conceituação
function hashConceptualization(vignette_id, userConceptualization) {
  // Normalizar texto (lowercase, remover pontuação excessiva)
  const normalized = userConceptualization
    .toLowerCase()
    .replace(/[.,!?;]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Hash: vignette + conceituação normalizada
  const hash = crypto
    .createHash('sha256')
    .update(`${vignette_id}:${normalized}`)
    .digest('hex')
    .substring(0, 16);

  return hash;
}

// ANTES de chamar OpenAI (linha ~549):
const conceptHash = hashConceptualization(
  req.body.case_id,
  req.body.user_conceptualization
);

console.log('[Case] 🔍 Hash da conceituação:', conceptHash);

// Buscar feedback cacheado
const { data: cachedFeedback } = await supabase
  .from('conceptualization_feedback_cache')
  .select('*')
  .eq('concept_hash', conceptHash)
  .eq('vignette_id', req.body.case_id)
  .maybeSingle();

if (cachedFeedback) {
  console.log('[Case] ✅ Feedback em cache! (economia: ~R$0.09)');

  return res.json({
    success: true,
    feedback: cachedFeedback.feedback_content,
    from_cache: true
  });
}

console.log('[Case] ⚠️ Cache miss, gerando feedback...');

// ... (chamar OpenAI normalmente)

// APÓS gerar feedback, salvar no cache:
await supabase
  .from('conceptualization_feedback_cache')
  .insert({
    vignette_id: req.body.case_id,
    concept_hash: conceptHash,
    feedback_content: generatedFeedback,
    created_at: new Date().toISOString()
  });
```

**Migration SQL:** `sql-scripts/04-feedback-cache.sql`

```sql
CREATE TABLE IF NOT EXISTS conceptualization_feedback_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vignette_id UUID NOT NULL,
  concept_hash VARCHAR(16) NOT NULL,
  feedback_content JSONB NOT NULL,
  times_reused INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(vignette_id, concept_hash)
);

CREATE INDEX idx_concept_hash ON conceptualization_feedback_cache(concept_hash, vignette_id);
```

**Economia esperada:** 60-70% (conceitualizações similares são comuns)

#### Solução 2: Downgrade para gpt-4o-mini em Casos Basic

```javascript
// src/routes/case.js linha ~545
const difficulty = req.body.case_data?.difficulty_level || 'intermediate';

// Usar gpt-4o-mini para basic, gpt-4o para intermediate/advanced
const model = difficulty === 'basic' ? 'gpt-4o-mini' : 'gpt-4o';

console.log(`[Case] 🤖 Modelo selecionado: ${model} (nível: ${difficulty})`);

const completion = await openai.chat.completions.create({
  model: model,
  // ... resto do código
});
```

**Economia esperada:** 33% em casos basic (se 33% dos casos são basic)

#### Solução 3: Rate Limiting por Plano

**Tabela:** `user_feedback_limits`

```sql
CREATE TABLE IF NOT EXISTS user_feedback_limits (
  user_id BIGINT PRIMARY KEY,
  conceptualizations_today INT DEFAULT 0,
  last_reset DATE DEFAULT CURRENT_DATE
);
```

**Middleware:** `src/middleware/feedbackRateLimit.js`

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LIMITS = {
  free: 1,     // 1 conceituação/dia
  basic: 3,    // 3 conceitualizações/dia
  pro: 10,     // 10 conceitualizações/dia
  premium: 999 // Ilimitado
};

async function checkFeedbackLimit(req, res, next) {
  const userId = req.user.userId;
  const userPlan = req.user.plan || 'free';

  // Buscar limite do usuário
  let { data: limit } = await supabase
    .from('user_feedback_limits')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  // Resetar se mudou de dia
  const today = new Date().toISOString().split('T')[0];
  if (!limit || limit.last_reset !== today) {
    await supabase
      .from('user_feedback_limits')
      .upsert({
        user_id: userId,
        conceptualizations_today: 0,
        last_reset: today
      });

    limit = { conceptualizations_today: 0 };
  }

  // Verificar limite
  const maxAllowed = LIMITS[userPlan];

  if (limit.conceptualizations_today >= maxAllowed) {
    return res.status(429).json({
      error: 'Limite de conceitualizações atingido',
      message: `Seu plano ${userPlan} permite ${maxAllowed} conceitualizações/dia. Upgrade para aumentar o limite.`,
      limit: maxAllowed,
      used: limit.conceptualizations_today
    });
  }

  // Incrementar contador
  await supabase
    .from('user_feedback_limits')
    .update({ conceptualizations_today: limit.conceptualizations_today + 1 })
    .eq('user_id', userId);

  next();
}

module.exports = { checkFeedbackLimit };
```

**Usar:** `src/routes/case.js`

```javascript
const { checkFeedbackLimit } = require('../middleware/feedbackRateLimit');

router.post('/conceptualize', authenticateRequest, checkFeedbackLimit, async (req, res) => {
  // ... resto do código
});
```

#### Projeção de Economia Combinada

**Sem otimizações:**
- 10k users × 2 conceitualizações/dia × R$0.09 = **R$5.400/mês**

**Com otimizações:**
- 60% cache hit = 40% chamadas OpenAI
- 33% casos basic com gpt-4o-mini (economia 33x)
- Rate limiting reduz uso médio em 30%
- **Custo final:** R$5.400 × 40% × 70% × 0.7 = **~R$1.050/mês** (-81%)

#### Checklist

- [ ] Criar tabela `conceptualization_feedback_cache`
- [ ] Implementar função `hashConceptualization()`
- [ ] Modificar `/conceptualize` para buscar cache primeiro
- [ ] Salvar feedbacks gerados no cache
- [ ] Implementar downgrade para gpt-4o-mini em casos basic
- [ ] Criar tabela `user_feedback_limits`
- [ ] Implementar middleware `checkFeedbackLimit`
- [ ] Aplicar middleware na rota `/conceptualize`
- [ ] Testar: Usuário free consegue apenas 1 conceituação/dia?

**Tempo estimado:** 1 dia
**Impacto:** 🔥🔥 **ALTO** - Reduz custo em 81% (R$5.400 → R$1.050)

---

## ⚠️ MELHORIAS IMPORTANTES (Antes de 1000+ users)

### 4. Feedback Loop (Reportar Casos Ruins) 📢

**PROBLEMA:** Usuários não podem reportar casos com erros clínicos.

#### Solução: Endpoint de Report

**Backend:** `src/routes/case.js`

```javascript
router.post('/report-quality', authenticateRequest, async (req, res) => {
  const { case_id, issue, severity, description } = req.body;
  const userId = req.user.userId;

  // Validar severidade
  if (!['low', 'medium', 'critical'].includes(severity)) {
    return res.status(400).json({ error: 'Severidade inválida' });
  }

  // Salvar report
  await supabase
    .from('case_quality_reports')
    .insert({
      case_id,
      user_id: userId,
      issue,  // 'incorrect_diagnosis', 'confusing_options', 'offensive_content', 'other'
      severity,
      description,
      created_at: new Date().toISOString()
    });

  // Se 3+ reports "critical", desativar caso automaticamente
  const { data: criticalReports } = await supabase
    .from('case_quality_reports')
    .select('id')
    .eq('case_id', case_id)
    .eq('severity', 'critical');

  if (criticalReports.length >= 3) {
    await supabase
      .from('cases')
      .update({
        status: 'needs_review',
        quality_score: 1.0
      })
      .eq('id', case_id);

    console.log(`[Case] 🚨 Caso ${case_id} desativado (3+ reports críticos)`);
  }

  res.json({ success: true, message: 'Report registrado com sucesso' });
});
```

**Migration SQL:**

```sql
CREATE TABLE IF NOT EXISTS case_quality_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL,
  user_id BIGINT NOT NULL,
  issue TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'critical')),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_case_reports ON case_quality_reports(case_id, severity);
```

**Frontend:** Adicionar botão em `desafios.html` e `diagnostic.html`

```html
<button onclick="reportCase()" class="btn-report">
  ⚠️ Reportar Problema
</button>

<script>
function reportCase() {
  const caseId = currentCase.case_id;

  const issue = prompt('Qual o problema?\n1. Diagnóstico incorreto\n2. Opções confusas\n3. Conteúdo ofensivo\n4. Outro');
  const severity = prompt('Gravidade?\nlow, medium, critical');
  const description = prompt('Descreva o problema (opcional):');

  fetch(`${API_URL}/api/case/report-quality`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      case_id: caseId,
      issue: issue || 'other',
      severity: severity || 'medium',
      description
    })
  })
  .then(() => alert('Obrigado pelo feedback!'));
}
</script>
```

#### Checklist

- [ ] Criar tabela `case_quality_reports`
- [ ] Implementar endpoint `POST /api/case/report-quality`
- [ ] Lógica: 3+ reports críticos → desativar caso
- [ ] Adicionar botão "Reportar Problema" no frontend
- [ ] Criar dashboard admin para ver reports
- [ ] Testar: Report critical desativa caso?

**Tempo estimado:** 4 horas
**Impacto:** ⚠️ **Médio** - Melhora qualidade contínua

---

### 5. Deduplicação de Casos 🔄

**PROBLEMA:** Mesma combinação (categoria + nível) pode gerar casos duplicados.

#### Solução: Hash de Conteúdo + Lock de Geração

**Implementação:** `src/routes/case.js`

```javascript
const crypto = require('crypto');

// Map para locks de geração
const generationLocks = new Map();

// Função para gerar hash do conteúdo
function hashCaseContent(caseContent) {
  const normalized = JSON.stringify(caseContent)
    .toLowerCase()
    .replace(/\s+/g, ' ');

  return crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex')
    .substring(0, 16);
}

// ANTES de gerar caso (linha ~257):
const lockKey = `${moment_type}:${level}`;

// Verificar se já tem geração em andamento
if (generationLocks.has(lockKey)) {
  console.log('[Case] ⏳ Aguardando geração em andamento...');

  // Aguardar até 10s
  const startTime = Date.now();
  while (generationLocks.has(lockKey) && Date.now() - startTime < 10000) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Tentar buscar novamente no cache
  // ... (repetir query do cache)

  if (foundInCache) {
    return res.json({ ... });
  }
}

// Criar lock
generationLocks.set(lockKey, true);

try {
  // ... gerar caso normalmente

  // APÓS gerar, calcular hash
  const contentHash = hashCaseContent(generatedCase);

  // Verificar se caso similar já existe
  const { data: existingCase } = await supabase
    .from('cases')
    .select('id')
    .eq('content_hash', contentHash)
    .maybeSingle();

  if (existingCase) {
    console.log('[Case] ⚠️ Caso duplicado detectado, regerando...');
    // Tentar gerar novamente com temperatura mais alta
    // ... (lógica de retry)
  }

  // Salvar com hash
  await supabase
    .from('cases')
    .insert({
      // ... campos normais
      content_hash: contentHash,  // 🆕 Para deduplicação
      created_by: 'micro_moment_on_demand'
    });

} finally {
  // Remover lock
  generationLocks.delete(lockKey);
}
```

**Migration SQL:**

```sql
ALTER TABLE cases
ADD COLUMN content_hash VARCHAR(16);

CREATE UNIQUE INDEX idx_content_hash ON cases(content_hash)
WHERE content_hash IS NOT NULL;
```

#### Checklist

- [ ] Adicionar coluna `content_hash` na tabela cases
- [ ] Implementar função `hashCaseContent()`
- [ ] Implementar sistema de locks (Map)
- [ ] Verificar duplicatas antes de salvar
- [ ] Lógica de retry se duplicata detectada
- [ ] Testar: 2 users simultâneos não geram caso duplicado?

**Tempo estimado:** 6 horas
**Impacto:** ⚠️ **Médio** - Melhora qualidade e reduz desperdício

---

### 6. Fallback Robusto (Se OpenAI Falhar) 🛡️

**PROBLEMA:** Se OpenAI cair + cache esvaziar = site quebra.

#### Solução: Backup Estático de Casos

**Migration SQL:**

```sql
CREATE TABLE IF NOT EXISTS backup_static_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  difficulty_level TEXT NOT NULL,
  moment_type TEXT,
  case_content JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Popular com 50 casos genéricos de alta qualidade
-- (executar script manual de população)
```

**Implementação:** `src/routes/case.js`

```javascript
// CATCH do erro OpenAI (linha ~370):
} catch (error) {
  console.error('[Case] ❌ Erro OpenAI:', error.message);

  // FALLBACK: Buscar caso estático do backup
  const { data: backupCase } = await supabase
    .from('backup_static_cases')
    .select('*')
    .eq('category', category || 'anxiety')
    .eq('difficulty_level', level)
    .limit(1)
    .maybeSingle();

  if (backupCase) {
    console.log('[Case] ✅ Usando caso de backup (OpenAI falhou)');

    return res.json({
      success: true,
      case: backupCase.case_content,
      case_id: backupCase.id,
      from_backup: true,
      warning: 'OpenAI temporariamente indisponível. Este é um caso de backup.'
    });
  }

  // Se nem backup tem, erro
  return res.status(503).json({
    error: 'Serviço temporariamente indisponível',
    message: 'Não foi possível gerar novo caso. Tente novamente em alguns minutos.'
  });
}
```

#### Checklist

- [ ] Criar tabela `backup_static_cases`
- [ ] Popular com 50 casos de alta qualidade (manual)
- [ ] Modificar catch de erro OpenAI para usar backup
- [ ] Testar: Desligar OpenAI (API key inválida) → retorna backup?

**Tempo estimado:** 3 horas
**Impacto:** ⚠️ **Médio** - Evita downtime completo

---

## 💡 OTIMIZAÇÕES (Antes de 10k+ users)

### 7. Redis Cache Layer (L1 Cache)

**PROBLEMA:** Toda requisição vai ao Supabase (latência ~50-100ms).

#### Solução: Cache em memória com Redis

```bash
npm install ioredis
```

**Arquivo:** `src/services/cache.js`

```javascript
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function getCached(key) {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

async function setCached(key, value, ttl = 60) {
  await redis.setex(key, ttl, JSON.stringify(value));
}

module.exports = { getCached, setCached };
```

**Usar:** `src/routes/case.js`

```javascript
const { getCached, setCached } = require('../services/cache');

// ANTES de query Supabase:
const cacheKey = `case:${moment_type}:${level}:${userId}`;
const cached = await getCached(cacheKey);

if (cached) {
  console.log('[Case] ✅ Cache L1 hit (Redis)');
  return res.json(cached);
}

// ... buscar do Supabase

// Salvar no cache L1
await setCached(cacheKey, responseData, 60);  // TTL: 60s
```

**Economia:** Reduz carga Supabase em 70-80%

#### Checklist

- [ ] Instalar ioredis
- [ ] Criar `src/services/cache.js`
- [ ] Adicionar REDIS_URL ao .env
- [ ] Modificar rotas para usar cache L1
- [ ] Deploy Redis (Upstash free tier)
- [ ] Testar: Latência reduzida?

**Tempo estimado:** 4 horas
**Impacto:** 💡 **Médio** - Melhora latência em 50ms+

---

### 8. A/B Testing de Casos 🧪

**PROBLEMA:** Não sabemos se casos novos são de qualidade sem testar com usuários.

#### Solução: Sistema de A/B Testing

```sql
CREATE TABLE IF NOT EXISTS case_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL,
  variant TEXT CHECK (variant IN ('A', 'B')),
  impressions INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  incorrect_answers INT DEFAULT 0,
  avg_time_spent DECIMAL,
  confidence_score DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Lógica:** Casos novos (status='pending_review') são servidos para 10% dos usuários (variant B). Se accuracy > 60% após 50 tentativas, promover para 'active'.

#### Checklist

- [ ] Criar tabela `case_ab_tests`
- [ ] Modificar seleção de casos (10% recebe variant B)
- [ ] Calcular métricas após cada resposta
- [ ] Auto-promover casos bons (accuracy > 60%)
- [ ] Dashboard de A/B tests para admin

**Tempo estimado:** 1 dia
**Impacto:** 💡 **Baixo** - Melhora qualidade gradualmente

---

## 📅 CRONOGRAMA SUGERIDO

### Semana 1 (URGENTE)
- [ ] **Dia 1-2:** Sistema de Review de Qualidade (validação + workflow + interface admin)
- [ ] **Dia 3:** Aumentar População de Casos (executar scripts + criar novos)
- [ ] **Dia 4-5:** Otimizar Custo de Feedback (cache + downgrade + rate limit)

### Semana 2 (IMPORTANTE)
- [ ] **Dia 1:** Feedback Loop (reportar casos ruins)
- [ ] **Dia 2:** Deduplicação de Casos
- [ ] **Dia 3:** Fallback Robusto
- [ ] **Dia 4-5:** Testes e refinamentos

### Semana 3 (OTIMIZAÇÃO)
- [ ] **Dia 1-2:** Redis Cache Layer
- [ ] **Dia 3-4:** A/B Testing de Casos
- [ ] **Dia 5:** Monitoramento e dashboards

---

## 🎯 METAS DE SUCESSO

Após implementar melhorias críticas, o sistema deve ter:

| Métrica | Atual | Meta |
|---------|-------|------|
| Casos ativos no banco | ~350 | **2.000+** |
| Casos pending_review | 0 | **0** (todos revisados) |
| Taxa de cache hit | ~70% | **90%+** |
| Custo OpenAI (10k users) | R$6.300 | **R$1.500** |
| Break-even (assinantes) | 330 | **50** |
| Quality score médio | 4.0 (fixo) | **4.5+** (real) |
| Casos reportados como ruins | N/A | **<2%** |
| Uptime se OpenAI cair | 0% | **90%+** (backup) |

---

## 📞 PRÓXIMOS PASSOS

1. ✅ **Priorizar:** Escolher 3 melhorias mais críticas para esta semana
2. 📋 **Criar issues:** GitHub issues para cada melhoria
3. 🔨 **Implementar:** Seguir checklist de cada seção
4. 🧪 **Testar:** Validar cada melhoria antes de merge
5. 🚀 **Deploy:** Subir para produção gradualmente (canary deployment)

---

**Última atualização:** 29/12/2025
**Próxima revisão:** Após implementar melhorias críticas (semana 1-2)
**Contato:** ailton@scopsy.com.br
