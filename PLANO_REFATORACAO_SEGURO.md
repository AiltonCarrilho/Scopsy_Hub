# 🔧 PLANO DE REFATORAÇÃO SEGURO - SCOPSY

**Objetivo:** Código limpo, sem gambiarras, sem quebrar produção SaaS
**Princípio:** Mudanças incrementais com backup/rollback
**Data:** 29/12/2025

---

## ⚠️ REGRAS DE OURO

1. **NUNCA modificar produção direto** - Sempre testar local primeiro
2. **SEMPRE fazer backup antes** - SQL dump + código Git
3. **UMA mudança por vez** - Não misturar múltiplas alterações
4. **Validar após cada passo** - Testes automatizados + manuais
5. **Rollback preparado** - Saber reverter se der errado

---

## 🎯 FASES DA REFATORAÇÃO

### FASE 0: Correção de Dados (URGENTE)

**Status:** 🔴 CRÍTICO (fazer ANTES de qualquer refatoração)

**Problema Identificado:**
- 435 casos com `moment_type='clinical_moment'` (INVÁLIDO)
- Deveria ser NULL para conceitualizações
- Causa: Scripts de população

**Solução:**
```bash
# 1. Dry-run (teste sem modificar)
node fix-data-inconsistency.js --dry-run

# 2. Backup automático
# (script já cria backup-cases-before-fix.json)

# 3. Executar correção
node fix-data-inconsistency.js

# 4. Verificar
node diagnose-empty-cache.js
```

**Validação:**
- [ ] Conceitualizações têm `moment_type=NULL`
- [ ] Desafios têm `moment_type IN ('resistencia_tecnica', ...)`
- [ ] Query de teste retorna casos corretos

**Rollback:**
```javascript
// Se der errado:
const backup = require('./backup-cases-before-fix.json');
for (const caso of backup) {
  await supabase.from('cases').update({ moment_type: caso.moment_type }).eq('id', caso.id);
}
```

**Tempo:** 30 minutos
**Risco:** ⚠️ Médio (modifica dados, mas tem backup)

---

### FASE 1: Organização de Código (sem mudança funcional)

**Status:** 🟡 Preparação

#### 1.1 - Adicionar Campo `module_type`

**Objetivo:** Simplificar queries futuras

**Migration SQL:**
```sql
-- sql-scripts/11-add-module-type.sql
ALTER TABLE cases ADD COLUMN IF NOT EXISTS module_type TEXT;

CREATE INDEX IF NOT EXISTS idx_cases_module_type
  ON cases(module_type, difficulty_level, status);

COMMENT ON COLUMN cases.module_type IS 'Módulo: desafios, conceituacao, diagnostico, series';
```

**Script de População:**
```javascript
// populate-module-type.js
const { createClient } = require('@supabase/supabase-js');

async function populate() {
  // 1. Desafios
  await supabase
    .from('cases')
    .update({ module_type: 'desafios' })
    .not('moment_type', 'is', null)
    .is('moment_type', 'not.eq', 'clinical_moment');  // Após fix

  // 2. Conceitualizações
  await supabase
    .from('cases')
    .update({ module_type: 'conceituacao' })
    .eq('category', 'clinical_moment');

  // 3. Diagnóstico
  await supabase
    .from('cases')
    .update({ module_type: 'diagnostico' })
    .in('category', ['anxiety', 'mood', 'trauma', 'psychotic', 'personality', 'eating', 'substance']);

  // 4. Séries
  await supabase
    .from('cases')
    .update({ module_type: 'series' })
    .not('series_id', 'is', null);
}
```

**Validação:**
```javascript
// test-module-type.js
const { data } = await supabase.from('cases').select('module_type');
const counts = {};
data.forEach(c => counts[c.module_type] = (counts[c.module_type] || 0) + 1);
console.log('Por módulo:', counts);
// Esperado:
// { desafios: ~90, conceituacao: ~435, diagnostico: ~83, null: 0 }
```

**Rollback:**
```sql
ALTER TABLE cases DROP COLUMN module_type;
```

**Tempo:** 1 hora
**Risco:** 🟢 Baixo (apenas adiciona campo, não muda lógica)

---

#### 1.2 - Separar Rotas por Módulo

**Objetivo:** Código mais claro e manutenível

**Estrutura Atual:**
```
src/routes/
├── case.js          (mistura Desafios + Conceitualizações)
├── diagnostic.js    (OK)
├── chat.js          (OK)
└── journey.js       (OK)
```

**Estrutura Nova:**
```
src/routes/
├── desafios.js      (apenas micro-momentos)
├── conceituacao.js  (apenas conceitualizações)
├── diagnostic.js    (OK - sem mudança)
├── chat.js          (OK - sem mudança)
└── journey.js       (OK - sem mudança)
```

**Passo a Passo:**

```bash
# 1. Criar novos arquivos (cópias)
cp src/routes/case.js src/routes/desafios.js
cp src/routes/case.js src/routes/conceituacao.js

# 2. Limpar cada arquivo (remover código não usado)
# desafios.js: remover código de conceituação
# conceituacao.js: remover código de desafios

# 3. Registrar rotas no server.js
# src/server.js
app.use('/api/desafios', require('./routes/desafios'));
app.use('/api/conceituacao', require('./routes/conceituacao'));

# 4. Manter /api/case como alias (compatibilidade)
app.use('/api/case', require('./routes/case'));  // Redireciona internamente

# 5. Testar endpoints antigos ainda funcionam
curl http://localhost:3000/api/case/generate
curl http://localhost:3000/api/desafios/generate  # Novo

# 6. Se tudo OK, remover src/routes/case.js (após 1 semana)
```

**Validação:**
- [ ] `/api/desafios/generate` funciona
- [ ] `/api/conceituacao/conceptualize` funciona
- [ ] `/api/case/*` ainda funciona (compatibilidade)
- [ ] Frontend não quebrou

**Rollback:**
```bash
git revert HEAD
npm restart
```

**Tempo:** 2-3 horas
**Risco:** 🟡 Médio (mudança de estrutura, mas mantém compatibilidade)

---

#### 1.3 - Extrair Prompts para Arquivos Separados

**Objetivo:** Prompts versionados e reutilizáveis

**Estrutura:**
```
src/prompts/
├── desafios-prompts.js
├── conceituacao-prompts.js
└── diagnostico-prompts.js
```

**Exemplo:**
```javascript
// src/prompts/desafios-prompts.js
const MOMENT_TYPES = {
  resistencia_tecnica: {
    name: 'Resistência a Técnicas',
    description: 'Cliente questiona ou resiste à técnica proposta'
  },
  ruptura_alianca: {
    name: 'Ruptura na Aliança',
    description: 'Momento de tensão na relação terapêutica'
  },
  // ... outros
};

const SYSTEM_PROMPT = (momentType, level) => `
Você é um gerador de casos clínicos para treino de psicólogos.

OBJETIVO: Criar um micro-momento clínico de ${MOMENT_TYPES[momentType].name}

NÍVEL: ${level}

FORMATO: JSON com estrutura...
`;

module.exports = { MOMENT_TYPES, SYSTEM_PROMPT };
```

**Uso:**
```javascript
// src/routes/desafios.js
const { SYSTEM_PROMPT } = require('../prompts/desafios-prompts');

const completion = await openai.chat.completions.create({
  messages: [
    { role: 'system', content: SYSTEM_PROMPT(momentType, level) },
    // ...
  ]
});
```

**Validação:**
- [ ] Prompts geram casos idênticos
- [ ] Testes passam

**Rollback:**
```bash
git revert HEAD
```

**Tempo:** 2 horas
**Risco:** 🟢 Baixo (apenas reorganização, lógica idêntica)

---

### FASE 2: Limpeza de Código Não Usado

**Status:** 🟡 Seguro após Fase 1

#### 2.1 - Remover Assistants OpenAI Não Usados

**Análise:**
```javascript
// src/services/openai-service.js
const ASSISTANTS = {
  orchestrator: 'asst_...',  // ❌ Usado? NÃO (apenas chat)
  case: 'asst_...',          // ❌ Usado? NÃO
  diagnostic: 'asst_...',    // ❌ Usado? NÃO
  journey: 'asst_...',       // ❌ Usado? NÃO
  generator: 'asst_...'      // ❌ Usado? NÃO
};
```

**Ação:**

**Opção A: Remover completamente (RECOMENDADO)**
```bash
# 1. Verificar uso real
grep -r "ASSISTANTS\[" src/

# 2. Se apenas chat.js usa, mover para lá
# src/routes/chat.js
const CHAT_ASSISTANT_ID = 'asst_n4KRyVMnbDGE0bQrJAyJspYw';

# 3. Remover openai-service.js
# OU refatorar para apenas funções de chat
```

**Opção B: Manter para uso futuro**
```javascript
// src/services/openai-service.js
// Renomear para chat-assistants.js
// Documentar que apenas chat usa
```

**Validação:**
- [ ] Chat conversacional funciona
- [ ] Desafios funcionam (não quebrou)
- [ ] Diagnóstico funciona

**Rollback:**
```bash
git revert HEAD
```

**Tempo:** 1 hora
**Risco:** 🟢 Baixo (código não usado)

---

#### 2.2 - Remover Boost.space (se migrou)

**Verificar se ainda usa:**
```bash
grep -r "boost" src/
grep -r "Boost" src/
```

**Se NÃO usa mais:**
```bash
rm src/services/database.js  # OU renomear para database-legacy.js
npm uninstall boost-space-sdk  # Se existir
```

**Se AINDA USA:**
- Manter
- Documentar qual parte usa

**Validação:**
- [ ] Sistema funciona sem erros

**Tempo:** 30 minutos
**Risco:** 🟡 Médio (verificar dependências)

---

### FASE 3: Testes Automatizados (Garantia)

**Objetivo:** Evitar regressões futuras

**Estrutura:**
```
tests/
├── unit/
│   ├── prompts.test.js
│   └── module-type.test.js
├── integration/
│   ├── desafios.test.js
│   ├── conceituacao.test.js
│   └── diagnostico.test.js
└── e2e/
    └── user-flow.test.js
```

**Exemplo:**
```javascript
// tests/integration/desafios.test.js
describe('Desafios Clínicos', () => {
  test('Deve retornar caso do banco (não gerar)', async () => {
    const response = await request(app)
      .post('/api/desafios/generate')
      .send({ level: 'intermediate', moment_type: 'resistencia_tecnica' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.body.from_cache).toBe(true);  // ← Do banco!
    expect(response.body.case).toBeDefined();
  });

  test('Não deve repetir caso visto', async () => {
    // Gerar caso 1
    const res1 = await request(app).post('/api/desafios/generate').send(...);
    const caseId1 = res1.body.case_id;

    // Gerar caso 2
    const res2 = await request(app).post('/api/desafios/generate').send(...);
    const caseId2 = res2.body.case_id;

    expect(caseId1).not.toBe(caseId2);  // ← Diferentes!
  });
});
```

**Setup:**
```bash
npm install --save-dev jest supertest
```

**Validação:**
- [ ] Todos os testes passam
- [ ] Cobertura >70%

**Tempo:** 1 dia
**Risco:** 🟢 Baixo (só adiciona testes)

---

## 📅 CRONOGRAMA RECOMENDADO

### Semana 1 (URGENTE)

**Segunda:**
- [ ] FASE 0: Corrigir dados inconsistentes
- [ ] Validar: sistema funciona normal

**Terça:**
- [ ] FASE 1.1: Adicionar `module_type`
- [ ] Popular `module_type`
- [ ] Validar

**Quarta:**
- [ ] FASE 1.2: Separar rotas
- [ ] Criar `/api/desafios` e `/api/conceituacao`
- [ ] Validar compatibilidade

**Quinta:**
- [ ] FASE 1.3: Extrair prompts
- [ ] Validar geração idêntica

**Sexta:**
- [ ] FASE 2: Limpeza
- [ ] Remover código não usado
- [ ] Deploy + Validação produção

### Semana 2 (Consolidação)

**Segunda-Quarta:**
- [ ] FASE 3: Testes automatizados
- [ ] Cobertura >70%

**Quinta-Sexta:**
- [ ] Documentação atualizada
- [ ] Monitoramento de métricas

---

## 🧪 VALIDAÇÃO CONTÍNUA

Após CADA mudança, executar:

```bash
# 1. Testes automatizados
npm test

# 2. Diagnóstico
node diagnose-empty-cache.js

# 3. Teste manual
# - Login
# - Gerar caso em Desafios
# - Verificar não repete
# - Gerar caso em Diagnóstico
# - Verificar não repete

# 4. Verificar logs
pm2 logs scopsy --lines 50

# 5. Verificar métricas
# - Latência <200ms?
# - Erros <1%?
# - Cache hit >80%?
```

---

## 🔄 PROCEDIMENTO DE ROLLBACK

**Se algo der errado:**

```bash
# 1. Identificar commit problemático
git log --oneline -10

# 2. Reverter
git revert <commit-hash>

# 3. Deploy imediato
git push origin main

# 4. Restart
pm2 restart scopsy

# 5. Restaurar dados (se necessário)
node restore-from-backup.js backup-cases-before-fix.json

# 6. Validar
curl https://scopsy.com.br/api/health
```

---

## 📊 MÉTRICAS DE SUCESSO

| Métrica | Antes | Meta Após Refatoração |
|---------|-------|----------------------|
| **Linhas de código** | ~3000 | ~2000 (-33%) |
| **Arquivos duplicados** | case.js mistura tudo | Separado por módulo |
| **Código não usado** | ~40% | 0% |
| **Queries complexas** | Múltiplos filtros | `module_type` direto |
| **Latência média** | ~150ms | <100ms |
| **Tempo de manutenção** | Alto (confuso) | Baixo (claro) |
| **Onboarding dev novo** | 2 semanas | 3 dias |

---

## ✅ CHECKLIST FINAL

### Antes de Começar:
- [ ] Backup completo do banco (SQL dump)
- [ ] Git commit com estado atual
- [ ] Ambiente de staging configurado
- [ ] Plano de rollback testado

### Durante:
- [ ] Uma mudança por vez
- [ ] Testes após cada mudança
- [ ] Commit descritivo
- [ ] Validação manual

### Depois:
- [ ] Todos os testes passam
- [ ] Produção validada (smoke tests)
- [ ] Métricas normais
- [ ] Documentação atualizada

---

## 📞 CONTATOS DE EMERGÊNCIA

**Se algo quebrar em produção:**
1. Reverter último commit
2. Restart servidor
3. Notificar usuários (se downtime >5min)
4. Investigar causa raiz
5. Planejar fix com mais cuidado

---

**Última atualização:** 29/12/2025
**Responsável:** Ailton + Claude Code
**Status:** ✅ Pronto para executar

---

## 🎯 PRÓXIMO PASSO IMEDIATO

**EXECUTAR AGORA:**

```bash
# 1. Corrigir dados
node fix-data-inconsistency.js --dry-run  # Teste
node fix-data-inconsistency.js            # Real

# 2. Validar
node diagnose-empty-cache.js

# 3. Testar no navegador
# Abrir Desafios Clínicos
# Clicar "Novo Momento" 3x
# Verificar: casos diferentes!
```

**Após validar que funciona, seguir para FASE 1.**
