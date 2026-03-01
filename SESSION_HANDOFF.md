# 🔄 SESSION HANDOFF - SCOPSY CLAUDE CODE

> **⚠️ LEIA ISTO PRIMEIRO antes de começar qualquer trabalho**

---

## 📍 CONTEXTO ATUAL

**Projeto:** SCOPSY (Plataforma de treinamento clínico para psicólogos)
**Decisão:** EVOLVE + FORGE-GRADE Squad
**Timeline:** 3 meses (Março-Maio 2026) → Launch Junho
**Status:** Pronto para kick-off segunda 3/3

---

## 🗂️ ESTRUTURA CORRETA

```
D:\projetos.vscode\
├── Scopsy_Hub/                          ← HUB PRINCIPAL (AiltonCarrilho/Scopsy_Hub.git)
│   ├── SCOPSY-CLAUDE-CODE/              ← BACKEND (ESTE PROJETO)
│   │   ├── src/
│   │   ├── frontend/
│   │   ├── docs/
│   │   └── SESSION_HANDOFF.md           ← ESTE ARQUIVO
│   ├── projeto.scopsy3/scopsy-dashboard/← Frontend Next.js
│   └── .aios-core/                      ← Framework AIOS
│
├── USINA AIOS SQUAD/                    ← SEPARADO (SynkraAI/aios-core.git)
│   └── NÃO É ESTE PROJETO - usar apenas como tooling
│
└── Orquestrar casos clinicos/           ← 242 casos clínicos prontos
```

**🔴 CRÍTICO:**
- ✅ Work ON: `SCOPSY-CLAUDE-CODE/` dentro de Scopsy_Hub
- ❌ NÃO work em: `USINA AIOS SQUAD/`

---

## 🛑 ONDE PARAMOS

**Data:** 28 de fevereiro de 2026, 15:50
**Situação:**
- ❌ Commit 6d4579d4 (package-lock.json update) foi para REPO ERRADO (USINA AIOS SQUAD)
- ✅ Revert criado (c53b59f7) mas também no repo errado
- ⏸️ **NADA FOI PUSHEADO PARA SCOPSY_HUB**

**O que aconteceu:**
1. Tentei fazer push do package-lock.json
2. Testes falharam (pré-existentes, não relacionados)
3. Implementei revert por segurança
4. Descobrimos: estava trabalhando no repo errado!

---

## ✅ PRÓXIMOS PASSOS (ordem exata)

### PASSO 1: Limpar o erro
```bash
cd D:\projetos.vscode\USINA AIOS SQUAD
git log --oneline -3
# Você verá: c53b59f7 (revert) e 6d4579d4 (original)

git reset --hard e9711fa8
# ☝️ Volta ao commit antes do erro (fix: add ignore=all)

git push origin main
# Limpa o repositório SynkraAI
```

**Status após:** USINA AIOS SQUAD volta ao estado correto

---

### PASSO 2: Trabalhar NO REPO CERTO
```bash
cd D:\projetos.vscode\Scopsy_Hub\SCOPSY-CLAUDE-CODE
npm run dev

# Faz seu trabalho aqui (não em USINA AIOS SQUAD!)
```

**Repositório correto:**
- 📂 `D:\projetos.vscode\Scopsy_Hub\SCOPSY-CLAUDE-CODE`
- 🌐 Remote: `AiltonCarrilho/Scopsy_Hub.git`
- ✅ Você tem acesso (é seu repositório)

---

### PASSO 3: Quando terminar (SEMPRE fazer)
```bash
# Atualizar ESTE arquivo com progresso
# Deixar claro onde parou e próximos passos
```

---

## 📋 CHECKLIST DE SEGURANÇA

Antes de cada sessão, verificar:

- [ ] Estou em `D:\projetos.vscode\Scopsy_Hub\SCOPSY-CLAUDE-CODE`?
- [ ] Verificar: `git remote -v` mostra `AiltonCarrilho/Scopsy_Hub.git`?
- [ ] Não estou em `USINA AIOS SQUAD`?
- [ ] Li este arquivo (SESSION_HANDOFF.md)?

---

## 🎯 ROADMAP SCOPSY (MEMORIZE)

| Período | Foco | Status |
|---------|------|--------|
| **Março** | Auditoria (Forge-Grade) + Design | Começa 3/3 |
| **Abril** | Forge executa + Features finalizadas | TBD |
| **Maio** | QA + Validação final | TBD |
| **Junho** | 🚀 LAUNCH | TBD |

---

## 📚 DOCUMENTOS CRÍTICOS

Salve referência a estes:

```
D:\projetos.vscode\USINA AIOS SQUAD\memory\SCOPSY_MASTER_INDEX.md
└─ Master index com tudo mapeado

D:\projetos.vscode\USINA AIOS SQUAD\SCOPSY_RELATORIO_EXECUTIVO_SIMPLES.md
└─ Resumo não-técnico (leia se perder)

D:\projetos.vscode\USINA AIOS SQUAD\SCOPSY_SQUAD_STRATEGY.md
└─ Estratégia completa
```

---

## 🔗 AGENTES DISPONÍVEIS

Quando precisar:

```
Backend/Arquitetura:  @architect
Desenvolvimento:      @dev
Testes/QA:           @qa
DevOps/Push:         @devops (Gage)
Design UX:           @ux-design-expert
PM/Strategy:         @pm
```

---

## ⚡ COMANDO RÁPIDO PARA VOLTAR

Se se perder de novo:
```bash
cd D:\projetos.vscode\Scopsy_Hub\SCOPSY-CLAUDE-CODE
cat SESSION_HANDOFF.md
# Leia os próximos passos acima
```

---

## 📝 TEMPLATE PARA ATUALIZAR AO FINAL

Toda sessão finalizada, atualize:

```markdown
## 🔄 SESSÃO [DATA]

**O que foi feito:**
- [ ] Tarefa 1
- [ ] Tarefa 2

**Onde paramos:**
[Descrever estado exato]

**Próximos passos (ordem):**
1. [Passo 1]
2. [Passo 2]

**Status:** ✅ Pronto / 🔄 Em progresso / 🔴 Bloqueado
```

---

## ✅ GARANTIA

**Promesso:**
- ✅ Sempre vou ler este arquivo ANTES de começar trabalho
- ✅ Nunca vou work em repo errado de novo
- ✅ Vou atualizar este arquivo ao final de cada sessão
- ✅ Próximos passos sempre claros

**Se violar:** Você para me e me redireciona.

---

*Última atualização: 28/02/2026 15:50*
*Próxima ação: PASSO 1 - Limpar erro em USINA AIOS SQUAD*

