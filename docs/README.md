# 📚 DOCUMENTAÇÃO SCOPSY

Documentação técnica e estratégica organizada por categoria.

---

## 📁 ESTRUTURA DA PASTA DOCS

```
docs/
├── README.md                          # Este arquivo (índice geral)
├── SCOPSY_AGENTS_GUIDE.md             # Guia principal dos agentes OpenAI
│
├── gpts-desafios-clinicos/            # Módulo: Desafios Clínicos (Micro-momentos)
│   ├── GPT_1_GERADOR_INSTRUCOES.md
│   ├── GPT_2_REVISOR_TECNICO_INSTRUCOES.md
│   ├── GPT_3_REVISOR_CLINICO_INSTRUCOES.md
│   ├── GUIA_IMPLEMENTACAO_GPTS.md
│   ├── POPULACAO_CASOS_GUIA.md
│   ├── INSTRUCOES_GPTs_COMPLETAS.md
│   ├── SISTEMA_AUTOMACAO_COMPLETO.md
│   └── MELHORIAS_NEUROCIENCIA_DUOLINGO.md
│
├── gpts-conceitualizacao/             # Módulo: Conceituação de Casos TCC
│   ├── GPT_1_GERADOR_CONCEITUALIZACAO.md
│   ├── GPT_2_REVISOR_TECNICO_CONCEITUALIZACAO.md
│   ├── GPT_3_REVISOR_CLINICO_CONCEITUALIZACAO.md
│   ├── WORKFLOW_POPULACAO_CONCEITUALIZACAO.md
│   ├── AUDITORIA_CONCEITUALIZACAO_COMPLETA.md
│   └── CONCEITUALIZACAO_MELHORIAS_NEUROCIENCIA.md
│
├── auditorias/                        # Auditorias técnicas e correções
│   ├── AUDITORIA_COMPLETA_4_MODULOS.md
│   ├── RADAR_DIAGNOSTICO_V2_IMPLEMENTADO.md
│   ├── CORRECAO_COGNITS_ACURACIA.md
│   └── CORRECAO_REPETICAO_DIAGNOSTIC.md
│
├── planejamento/                      # Planos estratégicos e lançamento
│   ├── PLANO_LANCAMENTO_PRAGMATICO.md
│   └── DEPLOY_CHECKLIST.md
│
├── ux-features/                       # Features de UX e melhorias frontend
│   ├── DASHBOARD_UX_FEATURES.md
│   ├── GAMIFICATION_UX_IMPROVEMENTS.md
│   ├── CHAT_REACT_MIGRATION.md
│   └── CHAT_OPTIMIZATION_VALIDATION.md
│
└── seguranca/                         # Auditoria e proteções de segurança
    ├── SECURITY_AUDIT.md
    └── XSS_PROTECTION_GUIDE.md
```

---

## 🎯 GUIA RÁPIDO POR NECESSIDADE

### "Quero popular casos no módulo X"
- **Desafios Clínicos (Micro-momentos):** `gpts-desafios-clinicos/GUIA_IMPLEMENTACAO_GPTS.md`
- **Conceituação TCC:** `gpts-conceitualizacao/WORKFLOW_POPULACAO_CONCEITUALIZACAO.md`

### "Quero entender a arquitetura dos assistentes OpenAI"
- **Guia principal:** `SCOPSY_AGENTS_GUIDE.md` (root)
- **Desafios Clínicos:** `gpts-desafios-clinicos/SISTEMA_AUTOMACAO_COMPLETO.md`

### "Quero implementar melhorias de neurociência"
- **Desafios Clínicos:** `gpts-desafios-clinicos/MELHORIAS_NEUROCIENCIA_DUOLINGO.md`
- **Conceituação:** `gpts-conceitualizacao/CONCEITUALIZACAO_MELHORIAS_NEUROCIENCIA.md`

### "Quero auditar um módulo"
- **Visão geral:** `auditorias/AUDITORIA_COMPLETA_4_MODULOS.md`
- **Conceituação específica:** `gpts-conceitualizacao/AUDITORIA_CONCEITUALIZACAO_COMPLETA.md`

### "Quero lançar/deployar o sistema"
- **Plano de lançamento:** `planejamento/PLANO_LANCAMENTO_PRAGMATICO.md`
- **Checklist deploy:** `planejamento/DEPLOY_CHECKLIST.md`

### "Quero melhorar UX/gamificação"
- **Dashboard:** `ux-features/DASHBOARD_UX_FEATURES.md`
- **Gamificação:** `ux-features/GAMIFICATION_UX_IMPROVEMENTS.md`

### "Quero revisar segurança"
- **Auditoria geral:** `seguranca/SECURITY_AUDIT.md`
- **Proteção XSS:** `seguranca/XSS_PROTECTION_GUIDE.md`

---

## 📊 RESUMO POR CATEGORIA

### 🤖 GPTs - Desafios Clínicos (8 arquivos)
Pipeline completo de 3 GPTs para gerar casos de micro-momentos clínicos (ruptura, dilema, resistência, rapport). Inclui melhorias neurocientíficas implementadas (Interleaving, Adaptive Difficulty, Chunking).

**Status:** ✅ Implementado e funcional

### 🧠 GPTs - Conceituação (6 arquivos)
Pipeline de 3 GPTs para gerar casos de conceituação TCC (vinhetas 300-400 palavras + conceituação modelo). Inclui auditoria completa e melhorias neurocientíficas adaptadas.

**Status:** 🟡 Planejado (0 casos no banco, módulo quebrado)

### 🔍 Auditorias (4 arquivos)
Auditorias técnicas dos 4 módulos principais, correções de bugs críticos (repetição de casos, acurácia, radar diagnóstico v2).

**Status:** ✅ Concluídas

### 📋 Planejamento (2 arquivos)
Plano de lançamento pragmático MVP + checklist completo de deploy para produção.

**Status:** 🟢 Pronto para execução

### 🎨 UX/Features (4 arquivos)
Melhorias de dashboard, gamificação, migração React, otimização de chat.

**Status:** 🟡 Parcialmente implementado

### 🔐 Segurança (2 arquivos)
Auditoria de segurança completa + guia de proteção contra XSS.

**Status:** ✅ Auditado

---

## 🚀 PRÓXIMOS PASSOS RECOMENDADOS

1. **URGENTE:** Popular módulo Conceituação (0 casos)
   - Seguir: `gpts-conceitualizacao/WORKFLOW_POPULACAO_CONCEITUALIZACAO.md`
   - Tempo: 14h | Custo: ~$22 USD

2. **ALTA PRIORIDADE:** Implementar melhorias neurociência Conceituação
   - Seguir: `gpts-conceitualizacao/CONCEITUALIZACAO_MELHORIAS_NEUROCIENCIA.md`
   - Tempo: 8h (Fase 1)

3. **MÉDIA PRIORIDADE:** Finalizar UX/Gamificação
   - Seguir: `ux-features/GAMIFICATION_UX_IMPROVEMENTS.md`

4. **DEPLOY:** Executar checklist de lançamento
   - Seguir: `planejamento/DEPLOY_CHECKLIST.md`

---

## 📖 CONVENÇÕES

- **Arquivos em CAPS:** Documentação técnica principal
- **Arquivos GPT_X:** Prompts prontos para copiar no GPT Builder (≤8000 chars)
- **Arquivos WORKFLOW/GUIA:** Instruções passo a passo executáveis
- **Arquivos AUDITORIA:** Análises estratégicas profundas

---

**Última atualização:** 05/01/2026
**Mantenedor:** Ailton (Criador Scopsy)
