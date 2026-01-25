# 📖 GUIA: Como Criar Inputs para Geração de Casos

## 🎯 Objetivo

Transformar blocos da ementa em inputs prontos para o GPT Gerador.

---

## 📋 TEMPLATE BASE

```
BLOCO: [Nome do Bloco da Ementa]

COMPETÊNCIAS:
- [Competência 1 da ementa]
- [Competência 2 da ementa]
- [Competência 3 da ementa]

NÍVEL: [basic|intermediate|advanced]

KNOWLEDGE BASE:
[2-4 parágrafos resumindo teoria científica relevante]

TEMA: [Situação clínica específica para este caso]

Gere um caso clínico seguindo o formato JSON Scopsy.
```

---

## 📝 PASSO A PASSO

### PASSO 1: Consultar a Ementa

Abrir `ementa - scopsy lab.md` e localizar o bloco.

**Exemplo:**

```
### 📘 Bloco 1.2: Identificação de Pensamentos Automáticos

Casos: 10 | Dificuldade: Nível 2 | Pré-req: 1.1 (85%+)

Competências:
* Identificar pensamentos automáticos em situações clínicas
* Diferenciar PA de interpretações terapêuticas
* Reconhecer "hot thoughts" (pensamentos quentes)
* Timing adequado para investigar PAs

Temas dos Casos:
1. Identificação de PA em Sessão (mudança de afeto)
2. Diferenciação PA vs. Emoção
...

Referências Principais:
* Burns, D. D. (1980). Feeling Good
* Greenberg, L. S. (2002). Emotion-Focused Therapy
```

---

### PASSO 2: Determinar o NÍVEL

**Regra de bolso:**

**BASIC:**

- Nível 1-2 da ementa
- Blocos iniciais (1.1, 2.1)
- "Reconhecer", "Identificar"
- 1 princípio clínico claro

**INTERMEDIATE:**

- Nível 2-3 da ementa
- Blocos médios (1.3, 2.3)
- "Aplicar", "Diferenciar"
- 2-3 princípios em jogo

**ADVANCED:**

- Nível 3-5 da ementa
- Blocos avançados (3.4, 5.5)
- "Avaliar", "Decidir entre"
- Múltiplos princípios conflitantes

---

### PASSO 3: Extrair COMPETÊNCIAS

Copiar **diretamente da ementa**, adaptando se necessário.

**Ementa diz:**

```
* Identificar pensamentos automáticos em situações clínicas
* Diferenciar PA de interpretações terapêuticas
```

**Input fica:**

```
COMPETÊNCIAS:
- Identificar pensamentos automáticos durante mudanças de afeto
- Diferenciar PA genuíno de interpretação do terapeuta
```

**Dica:** Seja específico. "Identificar PA" é vago. "Identificar PA durante mudança de afeto" é claro.

---

### PASSO 4: Criar KNOWLEDGE BASE

**Onde buscar:**

1. **Referências da ementa** (sempre listar primeiro)
2. **NotebookLM** (se tiver PDFs dos livros)
3. **Resumo próprio** baseado em conhecimento
4. **Busca rápida** em artigos científicos

**Estrutura ideal:**

```
KNOWLEDGE BASE:
[Autor (ano)] propôs/descreve [conceito principal]:

[Explicação do conceito em 2-3 frases]

[Exemplo concreto ou aplicação clínica]

[Nuance importante ou erro comum]

[Se aplicável: Referência a técnica específica]
```

**Exemplo real:**

```
KNOWLEDGE BASE:
Burns (1980) identificou "hot thoughts" - pensamentos automáticos com alta carga emocional que aparecem em momentos de mudança afetiva súbita na sessão.

Características dos hot thoughts:
- Surgem quando emoção aumenta visivelmente
- Cliente pode não verbalizar espontaneamente
- São mais centrais que PAs periféricos
- Investigá-los tem maior impacto terapêutico

Técnica: Quando notar mudança de afeto (voz embargada, lágrimas, olhar desviado), perguntar "O que passou pela sua cabeça agora mesmo?"

Erro comum: Terapeuta continua falando em vez de pausar e investigar o hot thought no momento em que aparece.
```

---

### PASSO 5: Definir TEMA específico

**Não:**

- "Identificação de PA" (muito genérico)

**Sim:**

- "PA em sessão após mudança de afeto súbita"
- "Diferenciar PA de racionalização intelectual"
- "Hot thought revelado após silêncio prolongado"

**Fórmula:**
[Conceito] + [Situação clínica concreta] + [Se relevante: desafio específico]

**Exemplos:**

```
TEMA: Cliente relata PA mas terapeuta suspeita ser racionalização posterior, não pensamento no momento

TEMA: Identificar hot thought após cliente desviar olhar e descrever "nada em especial"

TEMA: Timing para investigar PA - cliente em alta emoção vs esperar acalmar
```

---

## 🎯 EXEMPLOS COMPLETOS

### Exemplo BASIC

```
BLOCO: Registro de Pensamentos Disfuncionais (2.3)

COMPETÊNCIAS:
- Ensinar cliente a usar RPD de 3 colunas
- Identificar momento apropriado para introduzir RPD
- Fazer psicoeducação clara sobre o que é pensamento

NÍVEL: basic

KNOWLEDGE BASE:
Beck & Beck (2011) - Registro de Pensamentos Disfuncionais (RPD) é ferramenta fundamental de automonitoramento em TCC.

Versão inicial: 3 colunas
1. Situação (O que estava acontecendo?)
2. Pensamento (O que passou pela cabeça?)
3. Emoção (O que sentiu? Intensidade 0-100)

Introduzir após:
- Cliente entender conceito de pensamento automático
- Ter praticado identificação verbal em sessão
- Idealmente sessão 2-4

Psicoeducação deve incluir:
- "Pensamento" = frase específica que passou na cabeça
- NÃO é resumo do que aconteceu
- NÃO é emoção ("me senti fracassado" → pensamento é "sou fracassado", emoção é vergonha)

TEMA: Introdução do RPD após cliente ter identificado PA em sessão

Gere um caso clínico seguindo o formato JSON Scopsy.
```

---

### Exemplo INTERMEDIATE

```
BLOCO: Reestruturação Cognitiva (3.2)

COMPETÊNCIAS:
- Examinar evidências a favor e contra pensamento
- Gerar pensamento alternativo BALANCEADO (não poliana)
- Diferenciar reestruturação de pensamento positivo forçado

NÍVEL: intermediate

KNOWLEDGE BASE:
Beck (2011) - Reestruturação cognitiva não é sobre "pensar positivo", mas sobre pensar de forma BALANCEADA e REALISTA.

Processo:
1. Identificar pensamento específico
2. Evidências A FAVOR do pensamento (validar que tem base)
3. Evidências CONTRA o pensamento
4. Pensamento alternativo que integra ambos

Pensamento alternativo RUIM:
- "Tudo vai dar certo!" (poliana, nega dificuldades reais)

Pensamento alternativo BOM:
- "Pode ser difícil E eu já passei por coisas difíceis antes" (balanceado)

Armadilha: Terapeuta pula para alternativa antes de examinar evidências. Cliente sente que não foi ouvido, resiste.

Leahy (2003) - Usar questionamento socrático, não debate:
- "O que te faz pensar isso?" (evidências a favor)
- "Há algo que vai contra essa ideia?" (evidências contra)
- "Como você poderia ver isso de outra forma?" (alternativa)

TEMA: Cliente com pensamento "Sou um fracasso total" - terapeuta faz reestruturação completa

Gere um caso clínico seguindo o formato JSON Scopsy.
```

---

### Exemplo ADVANCED

```
BLOCO: TCC para TEPT - Exposure Prolongada (5.5)

COMPETÊNCIAS:
- Decidir entre exposição imaginária vs in vivo
- Manejar intensidade emocional durante exposição
- Distinguir quando continuar vs quando pausar
- Evitar retraumatização

NÍVEL: advanced

KNOWLEDGE BASE:
Foa & Rothbaum (2007) - Exposição Prolongada (EP) para TEPT requer:

1. Recordação repetida do trauma (45-60 min)
2. SUDS começa alto (70-90) e deve CAIR durante sessão (habituação)
3. Não encerrar no pico emocional (risco de sensibilização)

Dilema clínico frequente:
- Cliente em SUDS 90, chorando intensamente
- Faltam 10 min de sessão
- Continuar (completar habituação) ou pausar (evitar retraumatização)?

Regra de Foa: Se SUDS está CAINDO (80→70), continuar até pelo menos 50.
Se SUDS está SUBINDO ou estável no pico, pausar e fazer grounding.

Diferencial crucial:
- **Processamento emocional:** SUDS alto mas estável/caindo, cliente engajado, fala coerente
- **Dissociação:** SUDS alto subindo, cliente "ausente", fala fragmentada

Se dissociação: PAUSAR, grounding, não forçar.

Ehlers & Clark (2000) - Nem todo TEPT precisa EP. Se trauma não tem memória clara (abuso crônico infância), Imagery Rescripting pode ser melhor.

TEMA: Dilema durante exposição - cliente em alta emoção, terapeuta deve decidir continuar ou pausar

Gere um caso clínico seguindo o formato JSON Scopsy.
```

---

## ✅ CHECKLIST FINAL

Antes de usar input, verificar:

- [ ] BLOCO corresponde à ementa
- [ ] COMPETÊNCIAS específicas (não genéricas)
- [ ] NÍVEL adequado à complexidade
- [ ] KNOWLEDGE BASE tem:
  - [ ] Autor(es) + ano citados
  - [ ] Conceito explicado
  - [ ] Aplicação prática
  - [ ] Nuance/erro comum
- [ ] TEMA é situação concreta (não abstrata)
- [ ] Termina com "Gere um caso clínico seguindo o formato JSON Scopsy."

---

## 🚀 TEMPLATE VAZIO PARA COPIAR

```
BLOCO: 

COMPETÊNCIAS:
- 
- 
- 

NÍVEL: 

KNOWLEDGE BASE:




TEMA: 

Gere um caso clínico seguindo o formato JSON Scopsy.
```

---

## 💡 DICAS RÁPIDAS

**Knowledge Base muito curta:**
→ GPT vai inventar teoria (ruim!)

**Knowledge Base muito longa:**
→ Pode ficar confuso, focar no essencial

**Sweet spot:** 3-5 parágrafos, 150-300 palavras

**Sempre incluir:**

1. Quem disse (Autor ano)
2. O que disse (conceito)
3. Como usar (aplicação)
4. Cuidado com (erro comum)

---

**Agora você consegue criar inputs para qualquer bloco da ementa!** 🎯

Quer que eu crie mais exemplos ou tá claro assim?
