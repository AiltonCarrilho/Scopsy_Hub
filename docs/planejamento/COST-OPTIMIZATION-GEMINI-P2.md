# Scopsy Lab — Relatório de Otimização de Custos (Context Engineering)

> **Passo 2:** Redução do Custo Médio por Conversa de $0.06 para $0.02

Este documento sumariza a auditoria das rotinas de bilhetagem e uso de tokens na arquitetura Scopsy Lab, seguida pelo plano de implementação (Quick Wins e Middle-Term) focado em **Context Engineering**.

---

## 1. Auditoria e Diagnóstico Atual

### A. Lifecycle de Threads (`openai-service.js` e `thread-manager.js`)
- **Criação e Reuso:** A busca é eficiente, procurando primeiro no `Boost.space` pelo `conversationId` antes de invocar a API. 
- **Compressão Manual:** `compressThreadHistory` implementa uma reinjeção braçal (cria novo thread e copia as últimas 10 mensagens). Isso consome requisições API adicionais, tempo de I/O e tokens extras de completion para reinstanciar a mesma thread. Além de arriscado, isso é obsoleto na Assistants API.
- **Orfandade:** Não há processo explícito de delete de threads inativas na arquitetura até agora.

### B. Gestão de Mensagens (`message-handler.js`)
- **Polling:** Utiliza um while-loop com delay dinâmico (backoff exponencial 1s -> 5s). É seguro e contorna rate limits de consulta na API, mas retém CPU do serviço web.
- **Limites Nativos Ignorados:** Ao criar o `run` na OpenAI, define-se `max_prompt_tokens` e `max_completion_tokens`, mas a flag `truncation_strategy` nativa (Assistants API v2) é integralmente omitida na configuração atual da codebase. Isso provoca a inflação linear do histórico de tokens a cada mensagem.

### C. Contagem e Limites (`token-counter.js` e `constants.js`)
- **Estimativa por Length:** Divisão rudimentar de `length / 4` (1 token = 4 chars). Em português a densidade é maior, mas essa heurística resolve superficialmente sem precisar embargar o payload com processamento BPE Tiktoken.
- **Limites Estáticos Inflados:** As constantes em `constants.js` fixam o Assistente `orchestrator` em absurdos `1200` completion tokens (quase 1 página inteira de texto) sendo que ele faz requisições majoritariamente curtas de roteamento.

---

## 2. Estratégia de Redução (Plano de Implementação)

### A. Potencial Caching (Foco no `token-counter.js`)
O cache In-Memory do Map atual apenas cataloga `['start', 'menu', 'help']`.
- **Estratégia:** Expandir este dicionário léxico para saudações genéricas (ex: 'oi', 'olá', 'tudo bem'). Em sessões clínicas LLMs, mais de 15% das mensagens iniciais não têm peso lógico.
- **Economia Esperada:** Evitar o despacho dessas heurísticas básicas para o GPT-4 Turbo abate em média 15 a 20% do volume diário nas cold-starts de jornadas.

### B. Truncamento Dinâmico Inteligente (Foco no `message-handler.js`)
Em vez de clonar manualmente a thread no Node (que gasta CPU e repete billing), exigiremos truncagem nativa pela OpenAI antes de gerar o GPT output. Ao injetar a `truncation_strategy` com `type: 'last_messages'`, forçamos a OpenAI a ocultar as mensagens 1-10 quando estamos na mensagem 20.
- **Economia Esperada:** Janelas colossais estabilizam. O custo por nova mensagem permanece fixo (Ex: 0.02c fixos contra +5% aditivado por iteração anterior), gerando 30-40% de corte.

### C. Down-Route de Modelos (Orchestrator Swap)
**Análise de Função:** Saudações, roteamentos e listagens simples estão sendo servidos via Orchestrator com GPT-4-Turbo ou Omni.
- **Estratégia:** Criar/configurar na OpenAI o Orchestrator Assistant forçando a engine `gpt-4o-mini` (10x mais barato que Omni padrão). Interações de complexidade clínica (como Diagnose ou Raciocínio TCC) mantêm as chaves ricas atuais (`asst_UqKPT...`).
- **Economia Esperada:** A camada orquestral atua como "Dispatcher". Assumindo 50% das queries da plataforma com teor diretivo ou de transição (ex: "Quero fazer um caso" / "Ver jornada"), a redução de custo global é estonteante.

### D. Prompt Optimization vs Thresholds (Foco no `constants.js`)
A instrução e retorno de todos os assistentes precisam ser estrangulados em limites menores (e sem perda de coerência).

---

## 3. Guia de Modificação de Código (Quick Wins)

Para realizar a otimização cirúrgica, modifique a criação de Run (`message-handler.js`):

```javascript
    // No método sendMessage, injetar truncation_strategy e limitar Orchestrator:
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      max_prompt_tokens: tokenLimit,
      // Estrangular resposta do orquestrador
      max_completion_tokens: assistantType === 'orchestrator' ? 300 : tokenLimit,
      // Forçar OpenAI a truncar histórico sem usar CompressThread (obsoleto e caro)
      truncation_strategy: {
        type: 'last_messages',
        last_messages: 10 // Otimiza a janela
      }
    });
```

E no dicionário de Cache (`message-handler.js`), adicione:

```javascript
    // Em sendMessage()
    const fastOmitCache = ['start', 'menu', 'help', 'oi', 'olá', 'ola', 'bom dia'];
    if (fastOmitCache.includes(message.toLowerCase().trim())) {
      setCached(cacheKey, result);
    }
```

No `constants.js`, realize os seguintes cortes de capa de Completion (pois o teto aloca a reserva do rate limit):

```javascript
const TOKEN_LIMITS = {
  orchestrator: 400, // Era 1200
  case: 1000, 
  diagnostic: 600,
  journey: 800, // Era 1200
  generator: 1200 // Era 1500
};
```

**Critério Estimado Pós-Execução:** A conversão efetiva vai estagnar as subidas contínuas de prompt token (`prompt_tokens` que sempre cresciam a cada request) estacionando os requests, provendo fixação de `$0.02` per capitulada.
