# 🔍 SCOPSY - ELEVATION AUDIT PLAN

**Objetivo:** Elevar código SCOPSY para produção via Forge-Grade Squad
**Timeline:** 8 semanas (Março-Maio 2026)
**Decisão:** EVOLVE + FORGE-GRADE (zero risco)
**Kick-off:** Segunda 3 de março

---

## 🎯 ESCOPO DA AUDITORIA

### Backend (Node.js + Express)
```
D:\projetos.vscode\SCOPSY-CLAUDE-CODE\src\
├── routes/              (Express endpoints)
├── services/            (Business logic)
│   ├── openai-service.js    (Integração OpenAI)
│   ├── database.js          (Supabase client)
│   └── supabase.js          (queries)
├── middleware/          (Auth JWT, error handler)
├── socket/              (Socket.io real-time)
├── config/              (Logger, env vars)
└── server.js            (Entry point)
```

**Questões críticas:**
- ✅ JWT refresh token existe?
- ✅ CORS está restritivo?
- ✅ Rate limiting implementado?
- ✅ Error handling consistente?
- ✅ OpenAI service segmentado (460 linhas)?
- ✅ Logging estruturado?

### Frontend (Vanilla JS + Next.js)
```
D:\projetos.vscode\SCOPSY-CLAUDE-CODE\frontend\
└── (Vanilla JS legado)

D:\projetos.vscode\projeto.scopsy3\scopsy-dashboard\
├── app/                 (Next.js App Router)
├── components/          (React components)
├── styles/              (Tailwind CSS)
```

**Questões críticas:**
- ✅ State management modularizado?
- ✅ Auth token handling seguro?
- ✅ XSS protection?
- ✅ Performance (bundle size)?

### Database (Supabase PostgreSQL)
**Questões críticas:**
- ✅ Índices otimizados?
- ✅ RLS policies configuradas?
- ✅ N+1 queries detectadas?
- ✅ Migration strategy?

### Architecture
**Questões críticas:**
- ✅ Separação de responsabilidades?
- ✅ Dependency injection?
- ✅ Error boundaries?
- ✅ Testing strategy?

---

## 📋 AGENTES FORGE-GRADE

| # | Agente | Especialidade | Tempo Est. |
|---|--------|---------------|-----------|
| 1 | @auditor | Mapeia tudo, diagnóstico | 1 semana |
| 2 | @security-analyst | OWASP Top 10 | 1-2 semanas |
| 3 | @db-architect | Schema, índices | 1-2 semanas |
| 4 | @api-designer | REST contracts | 1-2 semanas |
| 5 | @backend-hardener | Camadas, error handling | 2-3 semanas |
| 6 | @frontend-integrator | Modularização, estado | 2-3 semanas |
| 7 | @quality-director | Síntese + roadmap final | 1 semana |

---

## 🔄 FLUXO (8 SEMANAS)

### SEMANA 1-2: AUDITORIA (Leitura only)

**@auditor:**
- [ ] Lê backend completo
- [ ] Lê frontend completo
- [ ] Lê database schema
- [ ] Lê testes existentes
- [ ] Entrega: **ELEVATION-ROADMAP.md**

**Output esperado:**
```
Prioridade 1 (Críticos):
├─ JWT refresh token faltando
├─ SQL injection risk em queries
└─ Rate limiting missing

Prioridade 2 (Importantes):
├─ OpenAI service refactor (460 → 150 linhas)
├─ Frontend modularização
└─ Error handling inconsistent

Prioridade 3 (Nice-to-have):
├─ TypeScript migration
├─ Test coverage
└─ Performance optimizations
```

### SEMANA 3-8: EXECUÇÃO

**Paralelo com seu trabalho (design + gamificação):**

```
W3:  Prioridade 1 (Security)          → @security-analyst
     └─ Feedback & aprovação

W4:  Prioridade 2 (Database)          → @db-architect
     └─ Feedback & aprovação

W5:  Prioridade 3 (Backend arquitetura) → @backend-hardener
     └─ Feedback & aprovação

W6:  Prioridade 4 (API contracts)     → @api-designer
     └─ Feedback & aprovação

W7:  Prioridade 5 (Frontend)          → @frontend-integrator
     └─ Feedback & aprovação

W8:  Síntese + validação             → @quality-director
     └─ Relatório final + roadmap
```

### SEMANA 9: VALIDAÇÃO

- [ ] Quality score: 60 → 75+ (production-ready)
- [ ] Tudo testado
- [ ] Documentação atualizada
- [ ] Pronto para June launch

---

## ✅ CHECKLIST PRÉ-AUDITORIA

Antes de chamar @auditor, verificar:

- [ ] Backend está rodando sem erros: `npm run dev`
- [ ] Testes passam: `npm test`
- [ ] Lint passa: `npm run lint`
- [ ] Documentação atualizada em `docs/`
- [ ] `.env.example` tem todas as variáveis
- [ ] Git está clean (sem uncommitted changes)

---

## 🎯 PRÓXIMA AÇÃO

**Quando kick-off segunda (3/3):**
```bash
@auditor *help

"Preciso elevar SCOPSY para produção.
 Foco em segurança + arquitetura.
 Pronto em 8 semanas.
 Comece leitura completa do código."
```

---

**Criado:** 28/02/2026 16:10
**Status:** ✅ Pronto para auditoria
**Próxima ação:** Chamar @auditor segunda

