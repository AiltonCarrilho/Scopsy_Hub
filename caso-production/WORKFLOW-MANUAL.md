# 📋 WORKFLOW: Produção Manual de 8 Casos

## 🔄 FLUXO PASSO A PASSO

### ETAPA 1: Gerar Caso 1

**1.1** Abrir [`inputs-prontos-modulo-1.md`](file:///d:/projetos.vscode/SCOPSY-CLAUDE-CODE/caso-production/inputs-prontos-modulo-1.md)

**1.2** Copiar TUDO do **CASO 1** (do "BLOCO:" até "Gere um caso")

**1.3** Colar no seu GPT Gerador (<https://chatgpt.com>)

**1.4** Aguardar JSON completo

**1.5** Copiar JSON → Salvar em:

```
d:\projetos.vscode\SCOPSY-CLAUDE-CODE\caso-production\output\raw\caso-1.1-01.json
```

---

### ETAPA 2: Repetir para Casos 2-8

Repetir ETAPA 1 para cada caso:

- Caso 2 → `caso-1.1-02.json`
- Caso 3 → `caso-1.1-03.json`
- ...
- Caso 8 → `caso-1.1-08.json`

**Tempo estimado:** ~20-25 minutos (8 casos × 2-3 min cada)

---

### ETAPA 3: Revisar Manualmente (Simplificado)

**Opção A - Revisão Rápida (Recomendado por enquanto):**

Abrir cada JSON e verificar:

- ✅ Tem `interleaving_metadata`?
- ✅ Tem `adaptive_difficulty`?
- ✅ Tem `metacognitive_prompts`?
- ✅ Diálogo parece natural?
- ✅ 4 opções plausíveis?

Se sim → Mover para:

```
caso-production\output\approved\caso-1.1-01.json
```

**Opção B - Pipeline Completo com GPT 2 e 3 (Depois):**

Criar GPT 2 e 3, passar cada JSON pelos 3 GPTs.
→ Mais rigoroso, mas mais trabalhoso.

**Por enquanto, Opção A é suficiente!**

---

### ETAPA 4: Converter para SQL

**4.1** Criar arquivo:

```
caso-production\output\sql\bloco-1.1.sql
```

**4.2** Para cada JSON aprovado, gerar INSERT:

```sql
-- CASO 1: Identificação da Tríade Cognitiva
INSERT INTO cases (
  case_title,
  disorder,
  difficulty_level,
  moment_type,
  case_content,
  vignette,
  status,
  created_by
) VALUES (
  'Lucas - Tríade Cognitiva',
  'Transtorno Depressivo Maior',
  'basic',
  'intervencao_crucial',
  '{...JSON COMPLETO AQUI...}'::jsonb,
  'Cliente descreve padrão negativo sobre si, mundo e futuro...',
  'active',
  'gpt_pipeline_v3'
);

-- CASO 2: ...
-- (repetir para os 8)
```

**Dica:** Use Find & Replace no VSCode:

- Buscar: `"`
- Substituir: `\"`
(Para escapar aspas no JSON dentro do SQL)

---

### ETAPA 5: Popular Supabase

**5.1** Abrir Supabase SQL Editor

```
https://supabase.com/dashboard/project/[seu-projeto]/sql/new
```

**5.2** Copiar TODO o conteúdo de `bloco-1.1.sql`

**5.3** Colar no editor

**5.4** Clicar **RUN**

**5.5** Verificar: "Success. 8 rows affected."

---

### ETAPA 6: Testar no Scopsy Lab

**6.1** Abrir Scopsy Lab local

```
http://localhost:3000/desafios.html
```

**6.2** Login

**6.3** Abrir "Desafios Clínicos"

**6.4** Verificar se casos aparecem

**6.5** Testar 1 caso completo

---

## ⚡ ALTERNATIVA SEMI-AUTOMATIZADA

Criar script Python que:

1. Lê inputs do arquivo
2. Chama API OpenAI com cada input
3. Salva JSONs automaticamente
4. Gera SQL automaticamente

**Quer que eu crie esse script?** Economiza ~15 minutos.

---

## 📊 COMPARAÇÃO

| Método | Tempo | Esforço | Controle |
|--------|-------|---------|----------|
| **Manual** | 25 min | Alto | Máximo |
| **Semi-auto** | 10 min | Baixo | Médio |
| **Full-auto** | 5 min | Zero | Mínimo |

**Recomendação:** Manual para os primeiros 8, depois automatizar.

---

## 🎯 CHECKLIST COMPLETO

### Antes de Começar

- [ ] GPT v3 criado e testado
- [ ] `inputs-prontos-modulo-1.md` aberto
- [ ] Pasta `caso-production/output/raw/` criada

### Durante Produção

- [ ] Caso 1 gerado e salvo
- [ ] Caso 2 gerado e salvo
- [ ] Caso 3 gerado e salvo
- [ ] Caso 4 gerado e salvo
- [ ] Caso 5 gerado e salvo
- [ ] Caso 6 gerado e salvo
- [ ] Caso 7 gerado e salvo
- [ ] Caso 8 gerado e salvo

### Revisão

- [ ] 8 JSONs revisados
- [ ] 8 JSONs movidos para `/approved/`

### SQL

- [ ] `bloco-1.1.sql` criado
- [ ] 8 INSERTs no arquivo
- [ ] Aspas escapadas corretamente

### Deploy

- [ ] SQL executado no Supabase
- [ ] 8 linhas inseridas com sucesso
- [ ] Casos aparecem no Scopsy Lab
- [ ] 1 caso testado end-to-end

---

## 🚀 COMEÇAR AGORA

**Passo imediato:**

1. Criar pasta: `d:\projetos.vscode\SCOPSY-CLAUDE-CODE\caso-production\output\raw\`
2. Abrir `inputs-prontos-modulo-1.md`
3. Copiar CASO 1 completo
4. Colar no GPT
5. Salvar JSON em `raw\caso-1.1-01.json`

**Próximo:** Repetir para CASO 2

**Bora começar?** 💪
