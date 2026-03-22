# Scopsy Lab — Spec para Criação de Onboarding Squad

> Documento orientador para o Nirvana Squad Creator (`/nsc`) gerar um squad
> de onboarding sob medida para o Scopsy Lab.
> **Usar quando:** base de usuários ativa (50+), analytics integrado, Stripe funcional.

---

## 1. Contexto do Produto

**Scopsy Lab** é uma plataforma SaaS de treinamento clínico gamificada para psicólogos, focada em TCC, ACT e DBT.

### O que o usuário faz
- Treina "Olhar Clínico" com casos simulados (feedback formativo por IA)
- Pratica diagnóstico baseado em DSM-5-TR
- Percorre Jornadas Clínicas longitudinais (12 sessões por caso)
- Acumula XP (cognits), badges, streaks e missões diárias

### Stack técnico relevante
- **Backend:** Node.js + Express + OpenAI Assistants API (GPT-4 Turbo)
- **DB:** Supabase (PostgreSQL + RLS)
- **Real-time:** Socket.io
- **Frontend:** Vanilla JS (legado) + Next.js 16 (em migração)
- **Pagamentos:** Kiwify (atual) + Stripe (planejado)
- **Email:** Resend

### Planos de assinatura
| Plano | Preço | Limites |
|-------|-------|---------|
| FREE | R$ 0 | 3 casos/mês, sem jornada |
| BASIC | R$ 29,90 | 15 casos/mês, 1 jornada |
| PRO | R$ 69,90 | Ilimitado, 3 jornadas |
| PREMIUM | R$ 149,90 | Tudo + mentoria IA avançada |

---

## 2. Definição do Squad Desejado

### Prompt para o Nirvana Squad Creator

```
Crie um squad de onboarding e ativação para o Scopsy Lab, uma plataforma
SaaS de treinamento clínico gamificada para psicólogos.

O squad deve ter agentes para:

1. WELCOME FLOW AGENT
   - Gera sequência de boas-vindas personalizada por plano (Free/Basic/Pro/Premium)
   - Cria checklist de primeiros passos adaptativa
   - Define o "Aha Moment" alvo: completar o 1o caso clínico com feedback
   - Output: JSON com steps, mensagens, e triggers

2. ACTIVATION TRACKER AGENT
   - Define eventos-chave de ativação para tracking
   - Gera schema de eventos para PostHog/Mixpanel
   - Mapeia funil: cadastro → 1o login → 1o caso → feedback → 2o caso → streak
   - Output: event schema + funnel definition

3. ENGAGEMENT NUDGE AGENT
   - Cria templates de email/push para reativação (via Resend API)
   - Triggers baseados em inatividade (24h, 48h, 7d sem login)
   - Mensagens contextuais: "Seu streak de 3 dias vai quebrar!"
   - Integra com sistema de badges/streaks existente
   - Output: templates de email + trigger rules

4. GAMIFICATION OPTIMIZER AGENT
   - Analisa sistema de gamificação existente (badges, streaks, XP, missões)
   - Propõe melhorias no onboarding gamificado
   - Define "quick wins" para novos usuários (badge de 1o caso, badge explorador)
   - Balanceia dificuldade para evitar frustração inicial
   - Output: gamification adjustments + new badge definitions

5. CHURN PREDICTOR AGENT
   - Define sinais de risco de abandono (padrões comportamentais)
   - Cria regras de segmentação: engaged, at-risk, churned
   - Propõe intervenções por segmento
   - Output: segmentation rules + intervention playbook

Stack do projeto: Node.js, Express, Supabase, OpenAI Assistants, Socket.io,
Resend (email), Kiwify/Stripe (pagamentos).

Gamificação existente: badges (streak, login, learning), streaks (timezone-aware),
missões diárias, XP (cognits), ICC (Indice de Olhar Clínico).

Assistants OpenAI: orchestrator, case, diagnostic, journey, content-generator.

Prioridade: reduzir churn na 1a semana e aumentar conversão Free → Paid.
```

---

## 3. Dados Existentes para o Squad Consumir

### Endpoints de gamificação (já implementados)
```
GET /api/gamification/profile  → stats, ICC, badges, missions
GET /api/gamification/badges   → lista de badges do usuário
GET /api/streaks/current       → streak atual
GET /api/missions/daily        → missões do dia
```

### Badges existentes (badgeService.js)
- `streak-3`, `streak-7`, `streak-30` — streaks consecutivos
- `first-login`, `pioneer` — primeiros acessos
- `analyst-novice`, `analyst-expert`, `sharp-eye` — aprendizado

### Tabelas Supabase relevantes
- `users` — id, email, name, plan, crp, created_at
- `conversations` — id, user_id, assistant_type, thread_id, status
- `messages` — id, conversation_id, role, content, tokens_used
- `user_stats` — cases_completed, practice_hours, accuracy, streak_days, badges[], xp_points

### Métricas de custo
- Custo atual: ~$0.06/conversa (target: $0.02)
- Token limits por assistant: orchestrator=1200, case=1000, diagnostic=600, journey=1200

---

## 4. Critérios de Sucesso do Squad

| Métrica | Baseline | Target |
|---------|----------|--------|
| Churn 1a semana | ~75% (estimado) | < 50% |
| Tempo até 1o caso | Desconhecido | < 10 min |
| Conversão Free → Paid | < 5% (estimado) | > 15% |
| DAU/MAU ratio | Desconhecido | > 30% |
| Streak médio novos usuários | ~1 dia | > 3 dias |

---

## 5. Restrições

- **Custo OpenAI:** Qualquer feature de onboarding NÃO pode aumentar custo/conversa
- **Email:** Usar Resend API (já integrado), máx 3 emails/semana por usuário
- **Frontend:** Gerar outputs compatíveis com Vanilla JS E Next.js
- **Privacidade:** CRP (registro profissional) é dado sensível — nunca expor em analytics
- **Idioma:** Todo conteúdo em PT-BR
