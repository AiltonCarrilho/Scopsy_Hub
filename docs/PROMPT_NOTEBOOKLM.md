# 🧠 Guia de Prompt para NotebookLM

Este prompt foi desenhado para transformar a ementa e livros em "Cartas de Input" prontas para o pipeline de geração.

## 📋 Instruções de Uso

1. Vá ao [NotebookLM](https://notebooklm.google.com/).
2. **Upload**: Suba os PDFs chave da bibliografia do módulo.
3. **Contexto**: Cole o bloco da Ementa que você quer trabalhar (do arquivo `ementa - scopsy lab.md`).
4. **Prompt**: Cole o prompt abaixo na caixa de chat.

---

## 🚀 Prompt Mestre (Copie e Cole)

```markdown
ATUE COMO: Supervisor Clínico Sênior e Especialista em Design Instrucional para TCC.

CONTEXTO:
Estamos criando um banco de dados de casos clínicos para treinamento automatizado. Eu te darei os tópicos da ementa e você deve extrair o embasamento teórico dos livros (Sources) para criar "Cartas de Input". Estas cartas serão lidas posteriormente por uma IA geradora de casos.

SUA TAREFA:
Para cada tema listado na ementa que eu forneci acima, gere um BLOCO DE INPUT seguindo estritamente o template abaixo.

REGRAS CRÍTICAS:
1. "KNOWLEDGE BASE": Seja denso e técnico aqui. Extraia conceitos, definições exatas de Beck/Clark/Barlow, modelos e passagens relevantes das fontes. Isso é o "cérebro" do caso.
2. "COMPETÊNCIAS": Copie exatamente da ementa.
3. "TEMA": Descreva a situação clínica específica que deve ser simulada.
4. Mantenha o formato de código (code block) pois meu script lê exatamente assim.

TEMPLATE DE SAÍDA (Repita para cada caso):

### CASO [N]: [Título do Tema]

```text
BLOCO: [Nome do Bloco, ex: 1.1 Modelo Cognitivo]

COMPETÊNCIAS:
- [Listar da ementa]

NÍVEL: [basic/intermediate/advanced]

KNOWLEDGE BASE:
[Aqui você deve brilhar. Resuma a teoria específica para este caso baseado nas fontes. Explique o conceito chave, o mecanismo psicológico envolvido e como ele se manifesta clinicamente. Cite autores se possível. Mínimo 2 parágrafos.]

TEMA: [Descrição curta da cena clínica, ex: Paciente com depressão confundindo pensamento com fato durante relato de briga conjugal]
```

```

## 📥 O que fazer com a resposta?
1. Copie a saída do NotebookLM.
2. Crie um arquivo em `content-pipeline/1-inputs/`.
3. Cole o conteúdo.
4. Rode `node scripts/pipeline-generate.js`.
