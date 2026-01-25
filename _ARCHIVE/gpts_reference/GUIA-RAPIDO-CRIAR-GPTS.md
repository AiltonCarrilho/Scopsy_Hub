# 🚀 GUIA RÁPIDO: Como Criar os 3 GPTs

## PASSO 1: Acessar ChatGPT Builder

1. Ir para <https://chat.openai.com>
2. Clicar em **"Explore GPTs"** (barra lateral esquerda)
3. Clicar em **"Create"**

---

## PASSO 2: Criar GPT 1 - GERADOR

### Nome

```
Scopsy - Gerador de Casos Clínicos
```

### Descrição

```
Especialista em criar casos clínicos de alta qualidade pedagógica para treinamento de psicólogos, baseados em evidências científicas (TCC).
```

### Instruções

**Copiar TODO o conteúdo de:** `gpt-1-gerador-instrucoes.md`

### Conversation Starters (sugestões)

```
1. "Gerar caso BASIC sobre Modelo Cognitivo"
2. "Gerar caso INTERMEDIATE sobre Reestruturação Cognitiva"
3. "Gerar caso ADVANCED sobre Dilema Ético"
```

### Knowledge (opcional por enquanto)

- Deixar vazio no piloto
- Depois adicionar PDFs de Beck, Leahy, etc.

### Capabilities

- ✅ Web Browsing: OFF
- ✅ DALL·E: OFF
- ✅ Code Interpreter: OFF

**Clicar em "Create" → Testar com 1 caso → Salvar**

---

## PASSO 3: Criar GPT 2 - REVISOR TÉCNICO

### Nome

```
Scopsy - Revisor Técnico
```

### Descrição

```
Revisor especializado em validar estrutura JSON, formato, referências e integridade técnica de casos clínicos.
```

### Instruções

**Copiar TODO o conteúdo de:** `gpt-2-revisor-tecnico-instrucoes.md`

### Conversation Starters

```
1. "Revisar este caso tecnicamente"
2. "Validar formato JSON"
```

### Capabilities

- ✅ Web Browsing: OFF
- ✅ DALL·E: OFF
- ✅ Code Interpreter: ON (para validar JSON)

**Clicar em "Create" → Testar → Salvar**

---

## PASSO 4: Criar GPT 3 - REVISOR CLÍNICO

### Nome

```
Scopsy - Revisor Clínico
```

### Descrição

```
Psicólogo clínico experiente revisando plausibilidade, realismo e valor pedagógico de casos para treinamento.
```

### Instruções

**Copiar TODO o conteúdo de:** `gpt-3-revisor-clinico-instrucoes.md`

### Conversation Starters

```
1. "Revisar este caso clinicamente"
2. "Avaliar valor pedagógico"
```

### Capabilities

- ✅ Web Browsing: OFF
- ✅ DALL·E: OFF
- ✅ Code Interpreter: OFF

**Clicar em "Create" → Testar → Salvar**

---

## TESTE DO PIPELINE COMPLETO (Manual)

### Exemplo de Uso

**1. Input para GPT 1 (Gerador):**

```
BLOCO: Modelo Cognitivo Básico (1.1)

COMPETÊNCIAS:
- Identificar tríade cognitiva (pensamentos sobre si, mundo, futuro)
- Diferenciar pensamento, emoção e comportamento

NÍVEL: basic

KNOWLEDGE BASE:
Beck (1976) descreve a tríade cognitiva como três padrões de pensamento negativos que caracterizam depressão:
1. Visão negativa de si ("Sou inadequado")
2. Visão negativa do mundo ("Ninguém se importa")
3. Visão negativa do futuro ("Nunca vai melhorar")

TEMA: Identificação da Tríade Cognitiva em Sessão

Gere um caso clínico seguindo o formato JSON Scopsy.
```

**2. Copiar output JSON → Passar para GPT 2 (Revisor Técnico):**

```
Revise este caso tecnicamente:

[COLAR JSON AQUI]
```

**3. Pegar JSON corrigido → Passar para GPT 3 (Revisor Clínico):**

```
Revise este caso clinicamente:

[COLAR JSON CORRIGIDO AQUI]
```

**4. JSON final aprovado → Converter para SQL:**

```sql
INSERT INTO cases (...) VALUES (...);
```

---

## CHECKLIST DE VALIDAÇÃO

Antes de usar em produção:

- [ ] GPT 1 criado e testado (gera JSON válido)
- [ ] GPT 2 criado e testado (corrige erros técnicos)
- [ ] GPT 3 criado e testado (aprova qualidade clínica)
- [ ] Pipeline manual testado end-to-end (1 caso completo)
- [ ] JSON final funcionou no Supabase
- [ ] Caso apareceu corretamente no Scopsy Lab

**Se todos ✅ → Pronto para escalar para Bloco 1.1 (8 casos)!**

---

## PRÓXIMO PASSO RECOMENDADO

**Criar os 3 GPTs hoje mesmo (30min)**

Testar com **1 caso piloto** do Bloco 1.1:

- Tema: "Identificação da Tríade Cognitiva em Depressão"
- Nível: BASIC

Se funcionar bem → Semana que vem produzir os 8 casos do Bloco 1.1.

**Bora começar?** 🚀
