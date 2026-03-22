# Revisão Claude — Otimização de Custos Gemini Passo 2.1

**Data:** 2026-03-21
**Documento revisado:** `COST-OPTIMIZATION-GEMINI-P2.md`
**Método:** Validação contra código real em `message-handler.js`, `token-counter.js`, `constants.js`

---

## Validação dos 4 Pilares

### A. Cache de Saudações — APROVADO com ajuste

**Finding do Gemini:** Expandir cache de `['start', 'menu', 'help']` para incluir saudações.
**Código real (linha 94):** Confirmado — cache só cobre 3 strings.

**Aprovação:** Sim, mas com cuidados:
- O cache atual salva o RESULTADO COMPLETO (resposta da IA). Saudações como "oi" vão receber a mesma resposta sempre — isso é OK para o orchestrator, mas NÃO para assistants especializados onde o contexto importa.
- **Ajuste:** Cache de saudações deve ser APENAS para `assistantType === 'orchestrator'`. Cachear "oi" no journey assistant quebraria o contexto clínico.
- **Economia real:** ~15-20% das interações iniciais. Finding válido.

### B. Truncation Strategy Nativa — FORTEMENTE APROVADO

**Finding do Gemini:** Injetar `truncation_strategy: { type: 'last_messages', last_messages: 10 }` no `runs.create`.
**Código real (linhas 58-62):** Confirmado — `truncation_strategy` AUSENTE. Só tem `max_prompt_tokens` e `max_completion_tokens`.

**Aprovação forte:** Esta é a mudança de maior impacto.
- Atualmente o `compressThreadHistory` no thread-manager.js faz isso MANUALMENTE (cria thread novo, copia mensagens). A truncation strategy nativa faz o mesmo sem custo adicional.
- **Atenção:** Depois de implementar truncation_strategy, o `compressThreadHistory` se torna redundante. NÃO remover ainda — deixar como fallback, mas parar de chamá-lo ativamente.
- **Economia real:** 30-40% em conversas longas (10+ mensagens). Finding preciso.

### C. Down-Route do Orchestrator — APROVADO com ressalva importante

**Finding do Gemini:** Trocar o orchestrator de GPT-4 Turbo para GPT-4o-mini.
**Análise:** O orchestrator (`asst_n4KRyVMnbDGE0bQrJAyJspYw`) é um Assistant na OpenAI — a troca de modelo se faz NO DASHBOARD da OpenAI, não no código.

**Ressalva crítica:** Essa mudança NÃO é código — é configuração na plataforma OpenAI.
- O Gemini não pode fazer isso via código
- Requer acesso ao dashboard OpenAI → Assistants → orchestrator → trocar modelo
- **Testar ANTES** em sandbox: o orchestrator precisa rotear corretamente com mini
- **Economia real:** Se 50% das queries passam pelo orchestrator, e mini é 10x mais barato, economia de ~45% nessa camada. Finding válido mas execução é manual.

### D. Redução de Token Limits — PARCIALMENTE APROVADO

**Finding do Gemini:** Reduzir `orchestrator: 1200→400`, `journey: 1200→800`, `generator: 1500→1200`.

**Análise por assistant:**

| Assistant | Atual | Proposto | Veredicto |
|-----------|-------|----------|-----------|
| orchestrator | 1200 | 400 | **Aprovado** — só roteia, 400 é generoso |
| case | 1000 | 1000 | Mantido — precisa de feedback detalhado |
| diagnostic | 600 | 600 | Mantido — já é baixo |
| journey | 1200 | 800 | **Risco** — jornadas têm narrativa longa, 800 pode truncar |
| generator | 1500 | 1200 | **Aprovado** — margem confortável |

**Ajuste:** Manter `journey: 1000` (não 800) para segurança. Reduzir de 1200→1000 já economiza sem risco de truncar narrativa clínica.

---

## Priorização de Implementação

| # | Ação | Impacto | Risco | Esforço |
|---|------|---------|-------|---------|
| 1 | Truncation strategy no runs.create | 30-40% | Baixo | 5 min |
| 2 | Reduzir orchestrator token limit 1200→400 | 15-20% | Baixo | 1 min |
| 3 | Expandir cache saudações (só orchestrator) | 10-15% | Baixo | 15 min |
| 4 | Reduzir generator 1500→1200, journey 1200→1000 | 5-10% | Médio | 1 min |
| 5 | Down-route orchestrator para mini | 40-45% na camada | Médio | Manual no dashboard |

**Implementar na ordem: 1 → 2 → 3 → 4.** Item 5 é manual e requer testes separados.

---

## Prompt para Gemini — Sessão 2.2 (Implementação)

```
Você é um dev sênior Node.js. Execute estas 4 otimizações de custo no Scopsy Lab.
Mudanças CIRÚRGICAS — não refatore arquitetura.

Projeto: D:/projetos.vscode/SCOPSY-CLAUDE-CODE/

OTIMIZAÇÃO 1: Truncation Strategy (MAIOR IMPACTO)
- Arquivo: src/services/message-handler.js
- Na criação do run (linha ~58), adicionar truncation_strategy:
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
    max_prompt_tokens: tokenLimit,
    max_completion_tokens: assistantType === 'orchestrator' ? 400 : tokenLimit,
    truncation_strategy: {
      type: 'last_messages',
      last_messages: 10
    }
  });
- NÃO remover compressThreadHistory do thread-manager.js (manter como fallback)

OTIMIZAÇÃO 2: Token Limits
- Arquivo: src/services/constants.js
- Alterar TOKEN_LIMITS para:
  orchestrator: 400,  // era 1200 (só roteia)
  case: 1000,         // mantém
  diagnostic: 600,    // mantém
  journey: 1000,      // era 1200 (redução segura)
  generator: 1200     // era 1500

OTIMIZAÇÃO 3: Expandir Cache de Saudações (SOMENTE orchestrator)
- Arquivo: src/services/message-handler.js
- Na checagem de cache (linha ~94), expandir para:
  const CACHEABLE_MESSAGES = ['start', 'menu', 'help', 'oi', 'olá', 'ola',
    'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'hello', 'hi'];
  if (CACHEABLE_MESSAGES.includes(message.toLowerCase().trim())
      && assistantType === 'orchestrator') {
    setCached(cacheKey, result);
  }
- IMPORTANTE: NÃO cachear saudações para case/diagnostic/journey — contexto importa

OTIMIZAÇÃO 4: Completion tokens dinâmico para orchestrator
- Já incluído na OTIMIZAÇÃO 1 via:
  max_completion_tokens: assistantType === 'orchestrator' ? 400 : tokenLimit

REGRAS:
- NÃO alterar system prompts
- NÃO alterar fluxo de polling
- NÃO remover compressThreadHistory
- Rodar npm test ao final — todos devem passar
- Commitar com: "perf: optimize token usage (truncation strategy + cache expansion)"

OUTPUT:
Salve relatório em: docs/planejamento/COST-OPTIMIZATION-GEMINI-SESSAO-2.2.md
Incluir: o que mudou, diff resumido, estimativa de economia
```

---

## Critério para Avançar ao Passo 3

- [ ] truncation_strategy injetado no runs.create
- [ ] Token limits ajustados (orchestrator 400, journey 1000, generator 1200)
- [ ] Cache expandido com guard de assistantType
- [ ] Testes passando (140/140)
- [ ] Nota: down-route do orchestrator para mini é ação MANUAL no dashboard OpenAI (separado)
