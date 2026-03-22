# Auditoria de Estabilização (Forge-Grade) - Scopsy Lab
**Sessão:** Passo 1.1 (Auditoria Gemini)
**Projeto:** Scopsy Lab Backend (Node.js/Express)

## Sumário Executivo
O backend do Scopsy Lab possui fundamentos de segurança robustos e uma engenharia exemplar de contenção de custos OpenAI, mas peca severamente na arquitetura de rotas (Fat Controllers) e na fragilidade da suíte de testes (Memory Leaks).

---

## 1. SEGURANÇA (Score: 8.5/10)
**Status:** Saudável, mas com flexibilizações de Content Policy.
- **Autenticação:** O middleware `auth.js` implementa `jsonwebtoken` no estado-da-arte, validando expiração e planos de forma isolada. Não há hardcoded secrets soltos nos handlers.
- **Supabase / Config:** Imensa dedicação aos scripts de Row-Level-Security (RLS). Encontrada uma migração robusta de 13 tabelas (`11-rls-complete-*`), forçando isolamento absoluto das rows por Tenant/Usuário.
- **Headers:** `helmet` instalado, mas relaxado (`contentSecurityPolicy: false`).
- **Issues:**
  - `MEDIUM`: Helmet relaxou a CSP totalmente. Se o Express for hospedar estáticos, está vulnerável a XSS via iframe injections. 

## 2. DATABASE (Score: 7.5/10)
**Status:** Seguro, mas suscetível a sobrecarga.
- O modelo relacional está isolado corretamente com RLS nas 13 tabelas, inclusive removendo o acesso público.
- **Issues:**
  - `MEDIUM`: Identifiquei forte indício de queries repetidas e risco de N+1 (Muitas requisições em O(n)) espalhadas nos arquivos massivos da camada Route.

## 3. API DESIGN (Score: 4.0/10) 🔴
**Status:** *Anti-pattern* crítico de "Fat Routes".
- As regras de negócio não estão encapsuladas em Domains ou Services. O arquivo `src/routes/case.js` possui inacreditáveis `59.000 bytes` (mais de 1.500 linhas de código puramente transacional em callbacks HTTP). E o `journey.js` tem 25.000 bytes.
- Isso viola princípios de Single-Responsibility e impede testes unitários finos.
- **Issues:**
  - `CRITICAL`: Lógica de banco (Queries em string literal) mesclada com Request Handlers HTTP.

## 4. ERROR HANDLING (Score: 8.0/10)
**Status:** Sólido.
- O `errorHandler.js` central é excelente. Ele captura perfeitamente erros do tipo `ValidationError` (Joi default) e mapeia para 400 Bad Request, impedindo vazamento de Stack Traces no modo Production.
- A maioria absoluta das sub-rotas faz uso estrito do `try/catch`. O Winston logger está implementado.

## 5. PERFORMANCE E CUSTOS (Score: 9.5/10) 🟢
**Status:** Módulo Elite.
- **Custo OpenAI:** O arquivo `thread-manager.js` contém a função salvadora `compressThreadHistory(threadId, keepLast = 10)`. Isso significa que, na arquitetura conversacional, o histórico é amputado ativamente, estancando a hemorragia de tokens (`$0.06`).
- **Rate Limit:** Divisão inteligente entre `apiLimiter`, `authLimiter` (brute force) e o `planLimiter` que atua como *Billing Firewall*.

## 6. TESTING (Score: 5.0/10) 🔴
**Status:** Frágil.
- Executei a suíte via `npm test` (`jest --coverage`).
- **Resultados:** 55 Testes criados, sendo que os 55 **Passaram** (100% pass rate nos existentes).
- **Problemas Críticos:** 
  1. O Jest emitiu erro fatal de encerramento (`Worker failed to exit gracefully`), apontando para **Vazamento de Memória** (Open Handles) nos processos de Banco ou Timers (`setTimeout` perdidos no `openai-service.js`).
  2. Cobertura muito baixa: Apenas **11.36% de lines coverage** em camadas cruciais como `message-handler.js`.

## 7. DEPLOYMENT READINESS (Score: 9.0/10)
**Status:** Pronto para Nuvem.
- Possui arquivos explícitos `.env.example`, `render.yaml`, scripts de `verificar-deploy.md`.
- `trust proxy` configurado no Express. Endpoint `/api/health` em plena operação fazendo keep-alive no Supabase.

---

### Execução de Gaps (Roadmap)

#### 🚀 Quick fixes (Fazer agora / Passo 1)
- Corrigir o vazamento de memória (Open Handle) na suíte do Jest, forçando `afterAll(() => server.close())` e limpando os mock sockets do DB.
- Reativar `ContentSecurityPolicy` no Helmet apontando as URIs estritas da Vercel.

#### 🏗️ Requires Planning (Passo 2 e 3)
- Refatoração Severa de Design de API (Strangler Fig Pattern): Criar a pasta `src/controllers` e `src/repository` para drenar as +1500 linhas do `routes/case.js` e `journey.js`. Nível de complexidade muito alto sem quebrar compatibilidade do frontend atual.
- Escalonar a cobertura do Jest de 11% para 50%, testando estritamente as regras gamificadas do `message-handler` das IAs.
