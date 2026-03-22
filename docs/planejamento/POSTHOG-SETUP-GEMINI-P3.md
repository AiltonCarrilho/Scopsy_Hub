# Scopsy Lab — Guia de Configuração PostHog (Analytics & Onboarding)

> **Passo 3.1:** Implementação de tracking para ativação de usuários e análise de retenção.

## 1. Visão Geral do Setup

O objetivo é capturar o ciclo de vida do usuário desde o signup até a maestria clínica, permitindo identificar gargalos no funil de conversão.

### Frontends Alvos:
1. **Legado (Vanilla JS):** `D:/projetos.vscode/SCOPSY-CLAUDE-CODE/frontend/`
2. **Novo (Next.js):** `D:/projetos.vscode/projeto.scopsy3/scopsy-dashboard/`

---

## 2. Eventos-Chave para Implementação

| Categoria | Evento | Gatilho | Propriedades Sugeridas |
| :--- | :--- | :--- | :--- |
| **Aquisição** | `user_signed_up` | Sucesso no registro | `plan`, `source`, `method` |
| **Ativação** | `first_login` | Primeiro login realizado | `os`, `browser` |
| **Ativação** | `first_case_started` | Início do primeiro simulado | `assistant_type`, `case_id` |
| **Retenção** | `first_case_completed` | Fim do primeiro simulado | `score`, `xp_earned` |
| **Hábito** | `streak_started` | Segunda conexão consecutiva | `days_count` |
| **Conversão** | `plan_upgraded` | Webhook de pagamento recebido | `old_plan`, `new_plan`, `amount` |

---

## 3. Implementação Técnica

### A. Frontend Legado (HTML/JS)

Adicionar ao `<head>` de `index.html` e `dashboard.html`:

```javascript
<script>
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1.0)}(document,window.posthog||[]);
    posthog.init('<YOUR_PROJECT_API_KEY>',{api_host:'https://app.posthog.com'})
</script>
```

### B. Frontend Next.js (Novo)

Instalar: `npm install posthog-js`

Configurar no `_app.tsx` ou similar:

```typescript
// components/PostHogProvider.tsx
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  })
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
```

---

## 4. Cohorts & Funis (Configuração no Dashboard PostHog)

### Funil de Ativação:
1. `user_signed_up`
2. `first_login`
3. `first_case_started`
4. `first_case_completed`

### Cohorts Definidos:
- **Activated:** Usuários que completaram ao menos 1 caso (`cases_completed > 0`).
- **Engaged:** Usuários com streak ativo de 3+ dias.
- **At Risk:** Visto pela última vez há mais de 3 dias, mas menos de 14 dias.
- **Churned:** Não realiza login há mais de 14 dias.

---

## 5. Próximos Passos
1. Inserir a chave de API (Token) no `.env.local` e `config.js`.
2. Instrumentar os botões de "Iniciar Caso" e "Submeter Feedback" nos scripts JS dos frontends.
