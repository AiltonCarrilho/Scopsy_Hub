# 📘 Guia de Operação: NotebookLM para Scopsy Lab

Este guia descreve o fluxo de trabalho detalhado para utilizar o **Google NotebookLM** como o "cérebro criativo" inicial do nosso pipeline. O objetivo é gerar rascunhos de casos clínicos de alta qualidade, embasados teoricamente na bibliografia que você fornecer.

## 🎯 Objetivo

Transformar referências bibliográficas (PDFs de Judith Beck, TCC, manuais) em **rascunhos de casos estruturados** que nosso script (`pipeline-generate.js`) consiga ler, processar e aprimorar.

---

## 🛠️ Configuração Inicial (Uma vez por Módulo)

1. Acesse [NotebookLM](https://notebooklm.google.com/).
2. Crie um **Novo Notebook** para o módulo que você está trabalhando (ex: "Scopsy - Módulo 1: Conceitualização").
3. **Adicione Fontes**:
    * Faça upload dos PDFs chave da biblografia daquele módulo (ex: *Terapia Cognitivo-Comportamental: Teoria e Prática - Judith Beck*).
    * Quanto melhor a fonte, mais fiel e rico será o caso gerado.

---

## 📝 O Prompt Mestre

Para cada lote de casos que você quiser gerar, use o prompt abaixo na caixa de chat do NotebookLM.

**⚠️ IMPORTANTE**: Copie e cole *exatamente* como está para garantir que nosso script entenda o formato.

```markdown
Você é um assistente sênior de psicologia clínica TCC.
Sua tarefa é criar 3 rascunhos de casos clínicos fictícios baseados nas fontes fornecidas.

FORMATO DE SAÍDA OBRIGATÓRIO:
Comece sua resposta com: "MODULO: [NOME_DO_MODULO]" (Use: CONCEITUALIZACAO, DESAFIOS, RADAR ou JORNADA).

Para cada caso, use o separador "### CASO".
Dentro de cada caso, siga esta estrutura:

### CASO
**Título Sugerido**: [Um título criativo]
**Perfil**: [Nome, Idade, Profissão]
**Demanda**: [Queixa principal resumida]

**História Clínica (Vignette)**:
[Escreva 3-4 parágrafos detalhados narrando a história do paciente, focando nos sintomas, pensamentos automáticos e comportamentos desadaptativos. O texto deve ser RICO e REALISTA, demonstrando claramente os conceitos teóricos do módulo.]

**Conceitos Chave**:
- [Liste 3 conceitos teóricos presentes no caso]

**Sugestão de Gabarito (Opcional)**:
[Breve nota sobre qual seria o diagnóstico ou crença central correta]
```

### Ajustes por Módulo

Ao usar o prompt acima, mude o `[NOME_DO_MODULO]` na sua instrução mental ou no chat para um destes:

* `CONCEITUALIZACAO` (Foco: Crenças, Trio Cognitivo)
* `DESAFIOS` (Foco: Impasses Terapêuticos)
* `RADAR` (Foco: Diagnóstico Diferencial)
* `JORNADA` (Foco: Evolução sessão a sessão)

---

## 💾 Salvando para o Pipeline (Passo a Passo)

1. **Copie a Resposta**: No NotebookLM, copie todo o texto gerado com os 3 casos.
2. **Crie o Arquivo**:
    * Vá para o VS Code.
    * Navegue até `content-pipeline/1-inputs/`.
    * Crie um novo arquivo `.md` (ex: `bloco1.1-rascunho.md`).
3. **Cole e Salve**: Cole o conteúdo.
    * *Verifique*: A primeira linha deve ser algo como `MODULO: CONCEITUALIZACAO`.
    * *Verifique*: Deve haver divisórias `### CASO` entre os casos.
4. **Pronto!**: O script `pipeline-generate.js` vai pegar esse arquivo na próxima execução.

---

## 💡 Dicas de Ouro

* **Iteração**: Se o NotebookLM gerar casos muito simples, responda no chat: *"Refaça os casos tornando-os mais complexos e sutis, focando em pacientes com resistência à mudança."*
* **Foco Específico**: Você pode pedir *"Gerar 3 casos de Luto Patológico focados em Evitação"* para preencher lacunas específicas da ementa.
* **Volume**: Gere blocos de 3 a 5 casos por vez para manter a qualidade alta.
