# 🚀 Smart Content Pipeline - Guia de Uso

Este pipeline permite gerar casos de alta qualidade a partir de pesquisas profundas (NotebookLM, Papers, etc), com uma etapa de revisão humana antes do deploy.

## Estrutura de Pastas

```
content-pipeline/
  ├── 1-inputs/       <-- COLOQUE SEUS TEXTOS/MARKDOWNS AQUI
  ├── 2-drafts/       <-- RASCUNHOS GERADOS (Aguardando IA)
  │    └── rejected/  <-- REJEITADOS PELA IA
  ├── 3-review/       <-- APROVADOS PELA IA (Para você revisar)
  ├── 4-approved/     <-- MOVA OS BONS PARA CÁ (Para deploy)
  └── 5-archived/     <-- Backups automáticos
```

## Passo a Passo

### 1. Pesquisa & Input

1. Use o NotebookLM ou qualquer fonte para gerar um resumo rico sobre o tema clínico.
2. Salve como arquivo `.md` ou `.txt` dentro de `content-pipeline/1-inputs/`.
3. **IMPORTANTE:** Adicione uma primeira linha indicando o MÓDULO desejado:
   - `MODULO: CONCEITUALIZACAO` (Padrão)
   - `MODULO: DESAFIOS` (Para micro-momentos)
   - `MODULO: RADAR` (Para diagnóstico diferencial)
   - `MODULO: JORNADA` (Para séries longitudinais)

**Exemplo de Conteúdo do Arquivo:**

```markdown
MODULO: DESAFIOS
BLOCO: Resistência Terapêutica

### CASO 1
Paciente desafia o terapeuta...
```

### 2. Geração (Fábrica)

Rode o script para transformar textos em rascunhos de casos:

```bash
node scripts/pipeline-generate.js
```

O script vai salvar os rascunhos JSON na pasta `content-pipeline/2-drafts/`.

### 3. Peer Review IA (Auditoria)

Agora invoque o "Supervisor Científico" para validar os rascunhos:

```bash
node scripts/pipeline-review.js
```

O auditor vai:

- Ler os rascunhos em `2-drafts`.
- Dar uma nota (0-10) baseada em precisão teórica e segurança.
- **Se nota >= 8:** Aprova e move para `3-review` (Para você ver).
- **Se nota < 8:** Rejeita e move para `2-drafts/rejected` (Com feedback).

### 4. Revisão Final (Humana)

1. Vá até a pasta `content-pipeline/3-review/`.
2. Abra os arquivos aprovados pela IA.
3. Se estiver de acordo, mova para `4-approved/`.

### 5. Deploy (Supabase)

Rode o script para enviar os aprovados finais para o banco:

```bash
node scripts/pipeline-deploy.js

- Ler os arquivos da pasta `4-approved`.
- Inserir na tabela `cases` do Supabase.
- Mover os arquivos para `5-archived`.
