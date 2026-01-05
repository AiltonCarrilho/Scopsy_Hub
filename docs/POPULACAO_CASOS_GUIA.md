# 📚 GUIA DE POPULAÇÃO DE CASOS - SCOPSY LAB

**Data:** 04/01/2026
**Objetivo:** Popular banco com casos de alta qualidade usando scripts existentes
**Tempo:** 2-3 horas
**Custo:** ~$5-10 OpenAI

---

## 🎯 PROBLEMA A RESOLVER

### Status Atual do Banco

```sql
-- Verificar casos por categoria
SELECT
  category,
  COUNT(*) as total,
  COUNT(CASE WHEN created_by = 'diverse_population_script' THEN 1 END) as conceituacao
FROM cases
WHERE status = 'active'
GROUP BY category;
```

**Resultado esperado ANTES:**
```
category          | total | conceituacao
------------------+-------+-------------
micro_moment      | 278   | 0           ← Desafios OK
clinical_moment   | 0     | 0           ← Conceituação QUEBRADO!
```

**Resultado esperado DEPOIS:**
```
category          | total | conceituacao
------------------+-------+-------------
micro_moment      | 278   | 0
clinical_moment   | 50    | 50          ← Conceituação FUNCIONANDO!
```

---

## 📂 SCRIPTS DISPONÍVEIS

### Localização
```
D:\projetos.vscode\SCOPSY-CLAUDE-CODE\
├── populate-all-categories.js      ✅ RECOMENDADO (todas categorias)
├── populate-anxiety.js             ✅ Só ansiedade (rápido para testar)
├── populate-trauma-mood.js         ✅ Trauma + Humor
├── populate-cases.js               ⚠️  Genérico (não usar)
├── populate-quick.js               ⚠️  Poucos casos (não usar)
└── populate-micromoments.js        ⚠️  Micro-momentos (não é conceituação)
```

### Script Recomendado

**`populate-all-categories.js`**

**O que faz:**
- Gera casos de CONCEITUAÇÃO (não micro-momentos)
- Cobre 5 categorias: Psicótico, Trauma, Personalidade, Alimentar, Substância
- 3 níveis: basic, intermediate, advanced
- Vinhetas ricas (300-400 palavras)
- Inclui tríade cognitiva, crenças, formulação

**Transtornos cobertos:**
```javascript
Psicótico: 5 transtornos x 3 níveis = 15 casos
- Esquizofrenia Paranoide
- Transtorno Esquizoafetivo
- Transtorno Delirante
- Transtorno Psicótico Breve
- Esquizofrenia Desorganizada

Trauma: 5 transtornos x 3 níveis = 15 casos
- TEPT
- Estresse Agudo
- Transtorno de Adaptação
- Transtorno Dissociativo
- TEPT Complexo

Personalidade: 5 transtornos x 3 níveis = 15 casos
- Borderline
- Narcisista
- Antissocial
- Evitativa
- Dependente

Alimentar: 4 transtornos x 3 níveis = 12 casos
- Anorexia Nervosa
- Bulimia Nervosa
- Compulsão Alimentar
- Restritivo/Evitativo

Substância: 4 transtornos x 3 níveis = 12 casos
- Transtorno por Uso de Álcool
- Cannabis
- Cocaína
- Múltiplas Substâncias

TOTAL: ~70 casos gerados
```

---

## 🚀 PASSO A PASSO

### ETAPA 1: Preparação (5 min)

#### 1.1 Verificar Configuração

```bash
cd D:\projetos.vscode\SCOPSY-CLAUDE-CODE

# Verificar se .env existe e tem OpenAI key
cat .env | grep OPENAI_API_KEY
# Deve mostrar: OPENAI_API_KEY=sk-proj-...

# Verificar se Supabase está configurado
cat .env | grep SUPABASE_URL
# Deve mostrar: SUPABASE_URL=https://...
```

**Se faltar alguma variável:**
- Copiar de `.env.example`
- Preencher com suas chaves

#### 1.2 Verificar Dependências

```bash
# Instalar dependências (se ainda não fez)
npm install

# Verificar se OpenAI e Supabase estão instalados
npm list openai @supabase/supabase-js
```

---

### ETAPA 2: Executar População (10-15 min)

#### 2.1 Rodar Script Principal

```bash
# Rodar script de população
node populate-all-categories.js
```

**Output esperado:**
```
🎯 Populando casos de conceituação - Todas as categorias
════════════════════════════════════════════════════════

📚 CATEGORIA: Psicótico
────────────────────────────────────────────────────────
  ✨ Gerando: Esquizofrenia Paranoide (basic)...
  ✅ Salvo: ID abc-123 (387 palavras)

  ✨ Gerando: Esquizofrenia Paranoide (intermediate)...
  ✅ Salvo: ID def-456 (412 palavras)

  ✨ Gerando: Esquizofrenia Paranoide (advanced)...
  ✅ Salvo: ID ghi-789 (395 palavras)

  ... (continua para 5 transtornos x 3 níveis)

📚 CATEGORIA: Trauma
────────────────────────────────────────────────────────
  ... (15 casos)

📚 CATEGORIA: Personalidade
────────────────────────────────────────────────────────
  ... (15 casos)

📚 CATEGORIA: Alimentar
────────────────────────────────────────────────────────
  ... (12 casos)

📚 CATEGORIA: Substância
────────────────────────────────────────────────────────
  ... (12 casos)

════════════════════════════════════════════════════════
✅ POPULAÇÃO CONCLUÍDA!
   Total de casos gerados: 69
   Tempo: ~12 minutos
   Custo estimado: ~$8.50
════════════════════════════════════════════════════════
```

**Tempo real:** 10-15 minutos (depende da velocidade da OpenAI API)

#### 2.2 Se Der Erro

**Erro comum 1: Rate limit OpenAI**
```
Error: Rate limit exceeded. Please retry after 20 seconds.
```

**Solução:**
- Aguardar 20-30 segundos
- Rodar novamente
- Script é idempotente (não duplica casos)

**Erro comum 2: Timeout Supabase**
```
Error: Connection timeout
```

**Solução:**
- Verificar internet
- Verificar se Supabase está online (https://status.supabase.com/)
- Rodar novamente

**Erro comum 3: Sem créditos OpenAI**
```
Error: Insufficient quota
```

**Solução:**
- Adicionar créditos em https://platform.openai.com/account/billing
- Mínimo $5 recomendado

---

### ETAPA 3: Validação (30 min)

#### 3.1 Verificar no Supabase

**Abrir Supabase Dashboard:**
```
https://app.supabase.com/project/[seu-project-id]/editor
```

**Query de Validação:**
```sql
-- 1. Contar casos por categoria
SELECT
  category,
  COUNT(*) as total
FROM cases
WHERE created_by = 'diverse_population_script'
GROUP BY category;

-- Esperado: clinical_moment = 50-70

-- 2. Ver distribuição por nível
SELECT
  difficulty_level,
  COUNT(*) as total
FROM cases
WHERE created_by = 'diverse_population_script'
  AND category = 'clinical_moment'
GROUP BY difficulty_level;

-- Esperado:
-- basic: 20-25
-- intermediate: 20-25
-- advanced: 20-25

-- 3. Ver transtornos gerados
SELECT
  disorder,
  COUNT(*) as total
FROM cases
WHERE created_by = 'diverse_population_script'
GROUP BY disorder
ORDER BY total DESC
LIMIT 20;

-- 4. Ver exemplo de caso
SELECT
  disorder,
  difficulty_level,
  LEFT(vignette, 200) as vignette_preview,
  LENGTH(vignette) as word_count
FROM cases
WHERE created_by = 'diverse_population_script'
LIMIT 1;
```

#### 3.2 Testar no Frontend

**Abrir módulo de conceituação:**
```
http://localhost:3000/frontend/conceituacao.html
```

**OU (se em produção):**
```
https://seu-dominio.vercel.app/conceituacao.html
```

**Teste completo:**

1. **Clicar "Gerar Novo Caso"**
   - Deve carregar em 2-3 segundos
   - Vinheta deve aparecer (300-400 palavras)

2. **Ler caso completo**
   - Nome, idade, profissão fazem sentido?
   - História de vida é realista?
   - Sintomas são compatíveis com diagnóstico?

3. **Preencher conceituação**
   ```
   Tríade Cognitiva:
   - Pensamentos: [identificar pensamentos típicos]
   - Emoções: [identificar emoções]
   - Comportamentos: [identificar comportamentos]

   Crenças:
   - Central: [identificar crença central]
   - Intermediária: [identificar crença intermediária]
   - Automática: [identificar pensamentos automáticos]

   Formulação:
   - Vulnerabilidades: [histórico relevante]
   - Gatilhos: [situações que ativam]
   - Mantenedores: [o que mantém o problema]

   Intervenção:
   - Foco: [área principal de trabalho]
   - Técnicas: [técnicas TCC específicas]
   ```

4. **Enviar e verificar feedback**
   - Feedback aparece?
   - É específico (não genérico)?
   - Valida pontos fortes?
   - Sugere áreas para aprofundar?
   - XP foi atribuído? (+30 cognits)

**Repetir teste com 5 casos:**
- 1 caso de cada categoria
- 1 caso de cada nível (basic, intermediate, advanced)

---

### ETAPA 4: Ajustes (1-2 horas - se necessário)

#### 4.1 Se Casos Estão Muito Curtos

**Problema:** Vinhetas com menos de 300 palavras

**Solução:**
```javascript
// Editar populate-all-categories.js
// Linha ~77-100 (prompt)

// ANTES:
"1. VINHETA (300-400 palavras):"

// DEPOIS:
"1. VINHETA (350-400 palavras - MÍNIMO 350):"
```

**Deletar casos ruins:**
```sql
DELETE FROM cases
WHERE created_by = 'diverse_population_script'
  AND LENGTH(vignette) < 1500; -- menos de ~300 palavras
```

**Re-rodar script:**
```bash
node populate-all-categories.js
```

#### 4.2 Se Casos Estão Muito Genéricos

**Problema:** Vinhetas sem detalhes, crenças superficiais

**Solução:**
```javascript
// Editar populate-all-categories.js
// Adicionar ao prompt (linha ~85):

"REQUISITOS OBRIGATÓRIOS:
- Nome brasileiro completo (não só 'João')
- Profissão específica (não 'funcionário público')
- História de vida RICA (família, traumas, relacionamentos)
- Sintomas DETALHADOS (não só listar, descrever manifestação)
- Contexto atual (o que trouxe para terapia AGORA)
- Crenças ESPECÍFICAS (não 'sou ruim', mas 'sou incompetente no trabalho')
"
```

**Deletar casos genéricos:**
```sql
DELETE FROM cases
WHERE created_by = 'diverse_population_script'
  AND vignette LIKE '%João%' -- nome muito genérico
  AND vignette NOT LIKE '%família%'; -- falta contexto
```

**Re-rodar script.**

#### 4.3 Se Feedback Está Genérico

**Problema:** Feedback do GPT-4o é muito superficial

**Solução:** Editar `src/routes/case.js`, linha 656-700 (prompt de feedback)

```javascript
// ANTES:
"TOM: Validador e formativo. SEMPRE valide pontos fortes ANTES de sugerir melhorias."

// DEPOIS:
"TOM: Validador e formativo. SEMPRE valide pontos fortes ANTES de sugerir melhorias.

REGRAS DE FEEDBACK ESPECÍFICO:
- NÃO diga 'Você identificou bem'. Diga 'Você captou que [crença específica] se manifesta quando [situação]'
- NÃO diga 'Continue praticando'. Diga 'Para aprofundar, estude [autor] sobre [conceito], página [X]'
- SEMPRE cite Beck, Leahy ou Greenberger quando relevante
- SEMPRE dê exemplo concreto do que poderia ter incluído

EXEMPLO DE FEEDBACK BOM:
'Sua tríade cognitiva está clara: identificou que pensamentos de incompetência → ansiedade → evitação.
Excelente! Para aprofundar, você poderia explorar as CRENÇAS INTERMEDIÁRIAS que conectam a crença
central de incompetência aos pensamentos automáticos. Beck (2011, p.147) sugere usar a técnica da
seta descendente: \"E se isso for verdade, o que significa sobre você?\"'
"
```

**Testar novamente** com 2-3 casos.

---

## 📊 CRITÉRIOS DE QUALIDADE

### Vinheta (Caso Clínico)

**✅ BOM:**
```
"Ana Paula, 34 anos, arquiteta, casada há 8 anos com Ricardo.
Procura terapia relatando intensa preocupação há 12 meses,
principalmente sobre seu desempenho profissional e saúde dos pais.
Descreve pensamentos recorrentes de que 'algo terrível vai acontecer'
e que 'não será capaz de lidar'. Relata que sempre foi 'perfeccionista',
mas após promoção no trabalho (há 1 ano), a ansiedade intensificou.
Pais são idosos (mãe 68a, pai 72a) e morando longe...

[continua com história de vida, sintomas específicos,
gatilhos, manifestações somáticas, impacto funcional - 350-400 palavras]"
```

**❌ RUIM (genérico, curto):**
```
"João, 30 anos, tem ansiedade. Preocupa-se muito com várias coisas.
Sintomas incluem inquietação, fadiga e dificuldade para dormir.
Procurou terapia porque quer melhorar."
```

### Tríade Cognitiva

**✅ BOM (sugestões claras):**
```javascript
"cognitive_triad_suggestions": {
  "thoughts": [
    "Vou fracassar neste projeto e todos perceberão minha incompetência",
    "Preciso fazer tudo perfeitamente ou não tem valor",
    "Se não controlar tudo, algo terrível acontecerá"
  ],
  "emotions": [
    "Ansiedade intensa (8/10) em situações de avaliação",
    "Medo persistente de falhar",
    "Irritabilidade quando interrompida"
  ],
  "behaviors": [
    "Checa trabalho repetidamente (5-10x por tarefa)",
    "Evita delegar ('só eu faço direito')",
    "Dificuldade em tomar decisões (ruminação)"
  ]
}
```

**❌ RUIM (vago):**
```javascript
"cognitive_triad_suggestions": {
  "thoughts": ["Pensamentos negativos", "Preocupação"],
  "emotions": ["Ansiedade", "Medo"],
  "behaviors": ["Evitação", "Procrastinação"]
}
```

### Crenças

**✅ BOM (hierarquia clara):**
```javascript
"beliefs_suggestions": {
  "core": "Sou incompetente e não consigo lidar com responsabilidades",
  "intermediate": [
    "Se eu não fizer tudo perfeitamente, vou falhar",
    "Erros são inaceitáveis e mostram fraqueza",
    "Preciso estar sempre no controle para estar seguro"
  ],
  "automatic": [
    "Não vou conseguir",
    "Vou fracassar",
    "Todos vão perceber que sou uma fraude"
  ]
}
```

**❌ RUIM (não diferencia níveis):**
```javascript
"beliefs_suggestions": {
  "core": "Sou ruim",
  "intermediate": ["Não sou capaz"],
  "automatic": ["Não consigo"]
}
```

---

## 🔧 TROUBLESHOOTING

### Problema: Script trava no meio

**Sintomas:**
```
✅ Salvo: ID abc-123
✅ Salvo: ID def-456
[trava aqui por 2+ minutos]
```

**Causa:** Rate limit OpenAI ou timeout rede

**Solução 1: Adicionar retry**
```javascript
// Editar populate-all-categories.js
// Adicionar função retry (linha ~70)

async function generateWithRetry(prompt, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const completion = await openai.chat.completions.create({...});
      return completion;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`⚠️ Erro, tentando novamente (${i+1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // aguardar 5s
    }
  }
}
```

**Solução 2: Rodar em lotes menores**
```javascript
// Ao invés de rodar todas categorias, rodar 1 por vez:
node populate-anxiety.js      // só ansiedade
node populate-trauma-mood.js  // trauma + humor
// etc
```

### Problema: Casos duplicados

**Sintomas:**
```sql
SELECT disorder, COUNT(*)
FROM cases
WHERE created_by = 'diverse_population_script'
GROUP BY disorder
HAVING COUNT(*) > 3; -- mais de 3 do mesmo transtorno

-- Mostra: Esquizofrenia: 6 casos (deveria ser 3)
```

**Causa:** Script rodou 2x sem verificar duplicatas

**Solução: Deletar duplicatas**
```sql
-- Ver duplicatas
SELECT disorder, difficulty_level, COUNT(*)
FROM cases
WHERE created_by = 'diverse_population_script'
GROUP BY disorder, difficulty_level
HAVING COUNT(*) > 1;

-- Deletar casos mais recentes (manter mais antigos)
DELETE FROM cases
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY disorder, difficulty_level
      ORDER BY created_at DESC
    ) as rn
    FROM cases
    WHERE created_by = 'diverse_population_script'
  ) t WHERE rn > 1
);
```

### Problema: Nenhum caso está aparecendo no frontend

**Sintomas:**
- Script rodou com sucesso
- Supabase mostra casos
- Frontend retorna "Nenhum caso disponível"

**Diagnóstico:**
```sql
-- 1. Verificar se casos têm status correto
SELECT status, COUNT(*)
FROM cases
WHERE created_by = 'diverse_population_script'
GROUP BY status;

-- Deve mostrar: active = 50+

-- 2. Verificar campos obrigatórios
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN vignette IS NULL OR vignette = '' THEN 1 END) as sem_vignette,
  COUNT(CASE WHEN disorder IS NULL THEN 1 END) as sem_disorder,
  COUNT(CASE WHEN category IS NULL THEN 1 END) as sem_category
FROM cases
WHERE created_by = 'diverse_population_script';

-- Todos devem ser 0 (exceto total)
```

**Solução:**
```sql
-- Se tiver casos sem campos obrigatórios, deletar
DELETE FROM cases
WHERE created_by = 'diverse_population_script'
  AND (vignette IS NULL OR vignette = ''
       OR disorder IS NULL OR category IS NULL);

-- Re-rodar script
```

---

## ✅ CHECKLIST FINAL

Antes de considerar população completa:

**Quantidade:**
- [ ] ✅ 50+ casos de conceituação no banco
- [ ] ✅ Distribuição balanceada (15-20 por categoria)
- [ ] ✅ 3 níveis por transtorno (basic, intermediate, advanced)

**Qualidade (testar 5 casos):**
- [ ] ✅ Vinhetas realistas (300-400 palavras)
- [ ] ✅ Tríade cognitiva identificável
- [ ] ✅ Crenças são específicas (não genéricas)
- [ ] ✅ História de vida rica
- [ ] ✅ Sintomas compatíveis com DSM-5-TR

**Funcional (testar no frontend):**
- [ ] ✅ Casos carregam (<3s)
- [ ] ✅ Feedback é específico (não genérico)
- [ ] ✅ XP é atribuído (+30 cognits)
- [ ] ✅ Progresso é salvo
- [ ] ✅ Gamificação funciona

**Deploy:**
- [ ] ✅ Casos em produção (não só local)
- [ ] ✅ Testado em ambiente de produção
- [ ] ✅ Sem erros no console

---

## 🚀 PRÓXIMOS PASSOS

### Depois de Popular

1. **Commit e Deploy**
   ```bash
   git add .
   git commit -m "feat: Popular 50+ casos de conceituação"
   git push origin main
   ```

2. **Testar em Produção**
   - Abrir URL produção
   - Testar conceituação (3 casos)
   - Verificar feedback

3. **LANÇAR** 🎉

### Melhorias Futuras (Pós-Lançamento)

**Se feedback de usuários indicar:**

- **"Casos são repetitivos"** → Gerar mais 50 casos (variedade)
- **"Feedback é raso"** → Implementar Knowledge Base (depois)
- **"Falta categoria X"** → Adicionar Ansiedade, Humor, etc
- **"Muito difícil"** → Adicionar mais casos 'basic'
- **"Muito fácil"** → Adicionar mais casos 'advanced'

**Mas só DEPOIS de ter feedback real de usuários pagantes!**

---

**"Feito é melhor que perfeito."**

🚀 **Boa população!**
