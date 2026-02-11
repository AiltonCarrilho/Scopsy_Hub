# 🗺️ Mapa de Operação: Scopsy Lab

Este arquivo serve como **Central de Comando** para a produção de conteúdo.

## 📂 Estrutura de Pastas

* `00-GUIA-NOTEBOOKLM.md` 📘 **COMECE AQUI**: Guia passo-a-passo para criar o conteúdo inicial.
* `1-inputs/` 📥 **Entrada**: Onde você salva os casos gerados pelo NotebookLM (`.md`).
* `2-drafts/` 📝 **Rascunhos AI**: Onde o script salva os JSONs iniciais (e onde ficam os `rejected`).
* `3-review/` 🧐 **Revisão AI**: Casos aprovados pelo "Supervisor AI" aguardando você.
* `4-approved/` ✅ **Aprovados**: Casos finais prontos para ir ao ar.
* `5-archived/` 📦 **Arquivo**: Inputs antigos processados.

## 🚀 Comandos Rápidos

### 1. Gerar (Input -> Draft -> Review)

Rode este comando para processar novos arquivos da pasta `1-inputs`:

```bash
node scripts/pipeline-generate.js
```

### 2. Revisar (Draft -> Review)

*O script acima já tenta fazer a revisão AI automaticamente se configurado, mas se precisar rodar isolado:*

```bash
node scripts/pipeline-review.js
```

### 3. Deploy (Approved -> Supabase)

Rode este comando para enviar os casos aprovados para o banco de dados:

```bash
node scripts/pipeline-deploy.js
```

## 📊 Status Atual

Para ver o log de execução, cheque a pasta `logs/`.
