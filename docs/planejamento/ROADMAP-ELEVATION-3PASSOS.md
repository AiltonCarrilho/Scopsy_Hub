# Scopsy Lab — Roadmap de Elevação em 3 Passos

> Plano de execução multi-sessão: Gemini executa → Claude revisa e planeja próximo passo.
> Cada passo é uma conversa independente com contexto transferido via handoff.

---

## Visão Geral

```
PASSO 1: Estabilizar (forge-grade)     → Produção segura
PASSO 2: Otimizar Custo (context-eng)  → $0.06 → $0.02/conversa
PASSO 3: Crescer (onboarding squad)    → Reduzir churn, converter Free → Paid
```

**Modelo de trabalho:** Gemini executa análise/implementação → Claude revisa output, identifica gaps, planeja próxima iteração.

---

## PASSO 1: Estabilizar com Forge-Grade

### Objetivo
Auditar e elevar o Scopsy Lab para padrão de produção antes de escalar usuários.

### Prompt para Gemini — Sessão 1.1 (Auditoria)

```
Você é um auditor de software sênior. Analise o projeto Scopsy Lab
(backend Node.js/Express) e produza um relatório de auditoria completo.

Projeto: D:/projetos.vscode/SCOPSY-CLAUDE-CODE/

Analise estas 7 dimensões:

1. SEGURANCA
   - Revise middleware/auth.js (JWT validation)
   - Verifique se há secrets hardcoded em qualquer arquivo
   - Analise RLS policies no Supabase (sql-scripts/11-*.sql)
   - Verifique rate limiting (express-rate-limit config)
   - Cheque helmet.js configuration
   - Procure por SQL injection, XSS, CSRF vulnerabilities

2. DATABASE
   - Analise schema completo (sql-scripts/*.sql)
   - Verifique índices (performance)
   - Analise RLS policies (segurança row-level)
   - Cheque se há queries N+1 nos services
   - Verifique conexão pool configuration

3. API DESIGN
   - Analise todas as routes (src/routes/*.js) — são 17 arquivos
   - Verifique consistência de error handling
   - Cheque validação de input (Joi schemas)
   - Analise response formats (padronização)
   - Verifique autenticação em TODAS as rotas sensíveis

4. ERROR HANDLING
   - Analise middleware de error handling
   - Verifique try/catch em TODOS os services
   - Cheque logging (Winston) — está completo?
   - Procure por erros silenciosos (catch vazio)

5. PERFORMANCE
   - Analise openai-service.js (polling, timeouts, retries)
   - Verifique thread-manager.js (lifecycle, cleanup)
   - Cheque token-counter.js (tracking de custos)
   - Analise Socket.io config (memory leaks, reconnection)

6. TESTING
   - Rode: cd SCOPSY-CLAUDE-CODE && npm test
   - Analise cobertura atual
   - Identifique áreas críticas sem testes
   - Priorize: auth, chat, gamification

7. DEPLOYMENT READINESS
   - Verifique .env.example vs variáveis reais necessárias
   - Analise package.json scripts
   - Cheque se há health check endpoint
   - Verifique CORS configuration

OUTPUT ESPERADO:
Produza um arquivo AUDIT-GEMINI-PASSO1.md com:
- Score por dimensão (1-10)
- Issues encontrados (CRITICAL / HIGH / MEDIUM / LOW)
- Quick fixes (podem ser feitos agora)
- Requires planning (precisam de design antes)

Salve em: SCOPSY-CLAUDE-CODE/docs/auditorias/AUDIT-GEMINI-PASSO1.md
```

### Prompt para Claude — Revisão 1.1

```
Revise o relatório AUDIT-GEMINI-PASSO1.md produzido pelo Gemini.

1. Valide cada finding contra o código real
2. Identifique falsos positivos (Gemini pode ter alucinado)
3. Repriorize issues se necessário
4. Crie plano de correção para os top 5 issues CRITICAL/HIGH
5. Gere prompt para Gemini executar as correções (Sessão 1.2)

Salve revisão em: docs/auditorias/AUDIT-CLAUDE-REVIEW-P1.md
```

### Sessão 1.2 — Gemini executa correções (gerado pelo Claude após revisão)
> Prompt será gerado dinamicamente com base nos findings reais.

### Critério de conclusão do Passo 1
- [ ] Zero issues CRITICAL
- [ ] Todos HIGH com plano de mitigação
- [ ] Testes passando (`npm test`)
- [ ] Security headers validados
- [ ] RLS policies cobrindo todas as tabelas

---

## PASSO 2: Otimizar Custos com Context Engineering

### Objetivo
Reduzir custo por conversa de $0.06 para $0.02 (meta: 67% de redução).

### Pré-requisito
Passo 1 concluído (produção estável).

### Prompt para Gemini — Sessão 2.1 (Análise de Tokens)

```
Você é um especialista em otimização de custos de LLM. Analise o uso
de tokens do Scopsy Lab e produza um relatório de otimização.

Projeto: D:/projetos.vscode/SCOPSY-CLAUDE-CODE/

Analise estes arquivos críticos:

1. src/services/openai-service.js
   - Como threads são criadas e reutilizadas?
   - Qual o tamanho médio de context window por conversa?
   - Há truncamento de histórico? Quando? Como?
   - Polling strategy: é eficiente?

2. src/services/thread-manager.js
   - Lifecycle de threads: criação, reuso, cleanup
   - Threads órfãs (criadas mas nunca usadas)?

3. src/services/constants.js
   - Token limits por assistant: são adequados?
   - orchestrator=1200, case=1000, diagnostic=600, journey=1200, generator=1500

4. src/services/token-counter.js
   - Como tokens são contados?
   - Há tracking de custo real vs estimado?

5. System prompts dos assistants (IDs no constants.js)
   - Não temos acesso aos prompts via código, mas analise
     como as mensagens são enviadas (context, instructions)

ANALISE E PROPONHA:

A. CACHE DE RESPOSTAS
   - Quais perguntas são frequentes? ("Como funciona?", "START", saudações)
   - Propor estratégia de cache (in-memory ou Redis)
   - Estimar economia: X% das mensagens podem ser cacheadas

B. COMPRESSÃO DE CONTEXTO
   - Histórico de thread está sendo truncado corretamente?
   - Propor sliding window otimizado
   - Avaliar se mensagens de sistema podem ser comprimidas

C. MODEL ROUTING
   - Quais mensagens podem usar GPT-4o-mini em vez de GPT-4 Turbo?
   - Saudações, comandos simples, navegação → mini
   - Análise clínica complexa → turbo
   - Propor router com regras

D. PROMPT OPTIMIZATION
   - Instruções do assistant podem ser mais concisas?
   - Há redundância entre orchestrator e assistants especializados?

OUTPUT ESPERADO:
Produza COST-OPTIMIZATION-GEMINI-P2.md com:
- Custo atual estimado por tipo de conversa
- Economia projetada por estratégia (A, B, C, D)
- Implementação priorizada (quick wins primeiro)
- Código de exemplo para cache e router

Salve em: SCOPSY-CLAUDE-CODE/docs/planejamento/COST-OPTIMIZATION-GEMINI-P2.md
```

### Prompt para Claude — Revisão 2.1

```
Revise COST-OPTIMIZATION-GEMINI-P2.md.

1. Valide estimativas de economia contra uso real de tokens
2. Verifique se propostas de cache não quebram UX
3. Valide model routing: GPT-4o-mini aguenta análise clínica básica?
4. Priorize: qual estratégia implementar primeiro?
5. Gere prompt para Gemini implementar top 2 estratégias (Sessão 2.2)

Salve em: docs/planejamento/COST-OPTIMIZATION-CLAUDE-REVIEW-P2.md
```

### Sessão 2.2 — Gemini implementa otimizações
> Prompt gerado dinamicamente pelo Claude.

### Critério de conclusão do Passo 2
- [ ] Cache implementado para mensagens frequentes
- [ ] Token tracking com dashboard de custos
- [ ] Model routing para mensagens simples (se viável)
- [ ] Custo/conversa medido e documentado
- [ ] Target: < $0.03/conversa (meta intermediária)

---

## PASSO 3: Crescer com Onboarding Squad Customizado

### Objetivo
Criar e deployar squad de onboarding usando Nirvana Squad Creator.

### Pré-requisitos
- Passo 1 concluído (produção estável)
- Passo 2 concluído (custos otimizados)
- PostHog ou similar integrado (analytics)
- Pelo menos 20 usuários ativos
- Stripe/Kiwify funcional com webhooks

### Prompt para Gemini — Sessão 3.1 (Analytics Setup)

```
Configure PostHog (free tier) no Scopsy Lab para tracking de eventos
de onboarding e ativação.

1. Instalar PostHog JS SDK no frontend
2. Configurar eventos-chave:
   - user_signed_up (com plano)
   - first_login
   - first_case_started
   - first_case_completed (com score)
   - first_feedback_received
   - streak_started
   - badge_earned (com badge_slug)
   - plan_upgraded (de → para)
   - session_started (duração)

3. Configurar funil de ativação:
   signup → first_login → first_case → feedback → second_case

4. Configurar cohort:
   - "activated" = completou 1o caso
   - "engaged" = streak >= 3
   - "at_risk" = 3+ dias sem login
   - "churned" = 14+ dias sem login

Projeto: D:/projetos.vscode/SCOPSY-CLAUDE-CODE/
Frontend legado: frontend/ (Vanilla JS)
Frontend novo: D:/projetos.vscode/projeto.scopsy3/scopsy-dashboard/ (Next.js)

Integrar em AMBOS os frontends.

Salve guia em: docs/planejamento/POSTHOG-SETUP-GEMINI-P3.md
```

### Prompt para Claude — Revisão 3.1

```
Revise POSTHOG-SETUP-GEMINI-P3.md.

1. Valide que CRP (dado sensível) NÃO está sendo enviado ao PostHog
2. Verifique que eventos cobrem o funil completo
3. Valide implementação nos dois frontends
4. Após aprovação: usar ONBOARDING-SQUAD-SPEC.md com /nsc para gerar o squad
```

### Sessão 3.2 — Criação do Squad
```
Use /nsc (Nirvana Squad Creator) com o documento:
docs/planejamento/ONBOARDING-SQUAD-SPEC.md

Gere o squad completo com agentes, tasks e workflows.
```

### Critério de conclusão do Passo 3
- [ ] PostHog integrado e coletando eventos
- [ ] Funil de ativação visível no dashboard PostHog
- [ ] Onboarding squad criado via /nsc
- [ ] Welcome flow implementado (checklist primeiros passos)
- [ ] Email de reativação configurado (24h, 48h inatividade)
- [ ] Métricas baseline definidas

---

## Handoff entre Sessões

### Template de handoff (colar no início de cada nova conversa)

```
CONTEXTO: Estou executando o Roadmap de Elevação do Scopsy Lab.
Documento: SCOPSY-CLAUDE-CODE/docs/planejamento/ROADMAP-ELEVATION-3PASSOS.md

PASSO ATUAL: [1/2/3]
SESSAO: [1.1/1.2/2.1/2.2/3.1/3.2]
STATUS: [O que já foi feito]
PROXIMO: [O que precisa ser feito agora]
BLOQUEIOS: [Se houver]

DOCUMENTOS GERADOS ATÉ AGORA:
- [lista de docs já produzidos com paths]
```

---

## Timeline Estimada

| Passo | Sessões | Dependência |
|-------|---------|-------------|
| 1. Estabilizar | 2-3 conversas | Nenhuma |
| 2. Otimizar Custo | 2-3 conversas | Passo 1 |
| 3. Crescer | 3-4 conversas | Passo 2 + usuários |

**Total:** 7-10 conversas Gemini + Claude ao longo de 2-4 semanas.
