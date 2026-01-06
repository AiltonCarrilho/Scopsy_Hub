# 🚀 GUIA DE IMPLEMENTAÇÃO: 3 GPTs SCOPSY LAB

**Data:** 05/01/2026
**Versão:** 1.0
**Objetivo:** Implementar e testar fluxo completo de criação de conteúdo

---

## 📋 CHECKLIST GERAL

### Antes de Começar
- [ ] Acesso ao ChatGPT Plus ou Pro (necessário para GPT Builder)
- [ ] Acesso ao link: https://chat.openai.com/gpts/editor
- [ ] Documentos prontos:
  - [ ] `GPT_1_GERADOR_INSTRUCOES.md`
  - [ ] `GPT_2_REVISOR_TECNICO_INSTRUCOES.md`
  - [ ] `GPT_3_REVISOR_CLINICO_INSTRUCOES.md`
- [ ] Tempo estimado: 30-40 minutos (10-15 min por GPT)

### Durante Implementação
- [ ] GPT 1 (Gerador) criado
- [ ] GPT 2 (Revisor Técnico) criado
- [ ] GPT 3 (Revisor Clínico) criado
- [ ] Teste do fluxo completo realizado
- [ ] Ajustes finalizados (se necessário)

---

## 🎯 PARTE 1: CRIAR GPT 1 (GERADOR)

### Passo 1: Abrir GPT Builder

1. Acesse: https://chat.openai.com/gpts/editor
2. Clique em **"Create a GPT"** ou **"+ Create"**
3. Escolha a aba **"Configure"** (não "Create")

---

### Passo 2: Configurar Informações Básicas

**Nome:**
```
Scopsy Clinical Case Generator
```

**Descrição:**
```
Generates rich, evidence-based clinical micro-moment cases for psychologist training. Creates 6 types of critical therapeutic moments (rupture, resistance, revelation, intervention, dilemma, timing) with structured 3-layer feedback based on TCC/ACT/DBT literature.
```

**Instruções:**
1. Abra o arquivo: `D:\projetos.vscode\SCOPSY-CLAUDE-CODE\docs\GPT_1_GERADOR_INSTRUCOES.md`
2. **Copie TODO o conteúdo** (Ctrl+A → Ctrl+C)
3. Cole na seção **"Instructions"**
4. Verifique que colou completo (scroll até o final)

**Conversation starters (sugestões de início):**
```
Crie 6 casos de micro-momentos, 1 de cada tipo, níveis variados

Crie 3 casos de ruptura_alianca: 1 basic, 1 intermediate, 1 advanced

Crie 1 caso de resistencia_tecnica, nível intermediate

Gere lote balanceado com foco em TAG e Depressão
```

---

### Passo 3: Configurar Capabilities

**Knowledge:** (deixe vazio por enquanto)
- Não precisa upload de arquivos inicialmente
- Se quiser depois: pode adicionar PDFs de protocolos TCC

**Capabilities:**
- ✅ **Code Interpreter:** ON (para validar JSON)
- ❌ **Web Browsing:** OFF (não precisa)
- ❌ **DALL-E Image Generation:** OFF (não precisa)

**Actions:** (deixe vazio)
- Não precisa APIs externas

---

### Passo 4: Configurar Modelo e Tom

**Model:**
- **Escolha:** GPT-4 (ou GPT-4 Turbo se disponível)
- **NÃO use:** GPT-3.5 (qualidade inferior)

**Additional Settings (se disponível):**
- **Temperature:** 0.85
  - Criatividade moderada-alta (não queremos casos repetitivos)
  - Mas não aleatório demais (precisamos estrutura)

**Tone:**
- Pedagógico
- Inspirador
- Detalhista
- Fundamentado em evidências

---

### Passo 5: Salvar e Publicar

1. Clique em **"Save"** no canto superior direito
2. Escolha visibilidade:
   - **"Only me"** (recomendado por enquanto)
   - Depois pode mudar para "Anyone with the link" se quiser compartilhar com equipe
3. Clique em **"Confirm"**

**Pronto! GPT 1 criado.** ✅

---

### Passo 6: Testar GPT 1 Isoladamente

**Antes de criar os outros, teste se GPT 1 funciona:**

1. Clique no GPT recém-criado
2. Digite no chat:
```
Crie 1 caso de ruptura_alianca, nível basic, foco em TAG
```

3. **O que esperar:**
   - GPT deve confirmar que vai criar o caso
   - Gerar JSON completo (500-800 linhas)
   - Ter todos os campos (context, critical_moment, options, expert_reasoning, theoretical_depth, learning_point)
   - Feedback em 3 camadas presente
   - Citações bibliográficas no theoretical_depth

4. **Se funcionou:** ✅ Prossiga para GPT 2
5. **Se deu erro:** Verifique se colou instruções completas

---

## 🔍 PARTE 2: CRIAR GPT 2 (REVISOR TÉCNICO)

### Passo 1: Abrir Novo GPT Builder

1. Volte para: https://chat.openai.com/gpts/editor
2. Clique em **"+ Create"** (novo GPT)
3. Escolha aba **"Configure"**

---

### Passo 2: Configurar Informações Básicas

**Nome:**
```
Scopsy Technical Reviewer
```

**Descrição:**
```
Validates structure, consistency and technical quality of clinical cases. Checks JSON validity, difficulty criteria alignment, option plausibility, 3-layer feedback completeness, internal consistency, and batch balance. Technical auditor before clinical review.
```

**Instruções:**
1. Abra: `D:\projetos.vscode\SCOPSY-CLAUDE-CODE\docs\GPT_2_REVISOR_TECNICO_INSTRUCOES.md`
2. **Copie TODO o conteúdo**
3. Cole na seção **"Instructions"**

**Conversation starters:**
```
Faça revisão técnica deste caso: [colar JSON]

Revise este lote de 6 casos tecnicamente

Valide apenas a estrutura JSON deste caso

Checklist completo: [colar caso]
```

---

### Passo 3: Configurar Capabilities

**Knowledge:** (vazio)

**Capabilities:**
- ✅ **Code Interpreter:** ON (validar JSON, contar tokens)
- ❌ **Web Browsing:** OFF
- ❌ **DALL-E:** OFF

**Actions:** (vazio)

---

### Passo 4: Configurar Modelo e Tom

**Model:** GPT-4

**Additional Settings:**
- **Temperature:** 0.3
  - BAIXA (queremos consistência e objetividade)
  - Não queremos criatividade, queremos rigor

**Tone:**
- Rigoroso
- Objetivo
- Construtivo
- Meticuloso

---

### Passo 5: Salvar e Publicar

1. **"Save"**
2. Visibilidade: **"Only me"**
3. **"Confirm"**

**Pronto! GPT 2 criado.** ✅

---

### Passo 6: Testar GPT 2 Isoladamente

1. Copie o JSON que GPT 1 gerou (caso de teste anterior)
2. Abra GPT 2
3. Cole no chat:
```
Faça revisão técnica completa deste caso:

[JSON COMPLETO AQUI]
```

4. **O que esperar:**
   - Relatório estruturado
   - Validação de todas as áreas (JSON, critérios, opções, feedback, consistência)
   - Status: ✅ APROVADO / ⚠️ AJUSTES MENORES / ❌ REJEITADO
   - Se rejeitado/ajustes: problemas específicos + sugestões

5. **Se funcionou:** ✅ Prossiga para GPT 3
6. **Se deu erro:** Verifique instruções

---

## 🩺 PARTE 3: CRIAR GPT 3 (REVISOR CLÍNICO)

### Passo 1: Abrir Novo GPT Builder

1. https://chat.openai.com/gpts/editor
2. **"+ Create"**
3. Aba **"Configure"**

---

### Passo 2: Configurar Informações Básicas

**Nome:**
```
Scopsy Clinical Reviewer
```

**Descrição:**
```
Validates clinical accuracy, theoretical precision and professional ethics of therapeutic cases. Checks DSM-5-TR diagnosis alignment, TCC/ACT/DBT intervention appropriateness, citation accuracy, CFP ethics compliance, and pedagogical quality. Senior clinical supervisor review.
```

**Instruções:**
1. Abra: `D:\projetos.vscode\SCOPSY-CLAUDE-CODE\docs\GPT_3_REVISOR_CLINICO_INSTRUCOES.md`
2. **Copie TODO o conteúdo**
3. Cole em **"Instructions"**

**Conversation starters:**
```
Faça revisão clínica deste caso aprovado tecnicamente: [JSON]

Valide apenas as citações deste caso

Revise clinicamente este lote de 6 casos

Verifique se diagnóstico/sintomas estão corretos: [JSON]
```

---

### Passo 3: Configurar Capabilities

**Knowledge:** (vazio)
- Se quiser depois: pode adicionar DSM-5-TR PDF

**Capabilities:**
- ✅ **Code Interpreter:** ON (se precisar validar JSON)
- ❌ **Web Browsing:** OFF (NÃO PODE checar citações online - deve escalar para humano se tiver dúvida)
- ❌ **DALL-E:** OFF

---

### Passo 4: Configurar Modelo e Tom

**Model:** GPT-4

**Additional Settings:**
- **Temperature:** 0.4
  - Moderada (rigor + alguma flexibilidade para julgar nuances)

**Tone:**
- Clínico experiente
- Baseado em evidências
- Ético
- Pedagógico (explica o "por quê")

---

### Passo 5: Salvar e Publicar

1. **"Save"**
2. Visibilidade: **"Only me"**
3. **"Confirm"**

**Pronto! GPT 3 criado.** ✅

---

### Passo 6: Testar GPT 3 Isoladamente

1. Use o mesmo JSON aprovado pelo GPT 2
2. Abra GPT 3
3. Cole:
```
Faça revisão clínica completa deste caso (já aprovado tecnicamente pelo GPT 2):

[JSON COMPLETO AQUI]
```

4. **O que esperar:**
   - Relatório clínico estruturado
   - Validação de: diagnóstico, sintomas, intervenções, citações, ética, pedagogia
   - Status: ✅ APROVADO / ⚠️ AJUSTES / ❌ REJEITADO / ❓ ESCALAR
   - Se rejeitar: fundamentação com literatura
   - Se escalar: dúvida específica + como verificar

5. **Se funcionou:** ✅ Pronto para testar fluxo completo!

---

## 🔄 PARTE 4: TESTAR FLUXO COMPLETO

### Cenário de Teste: Lote de 6 Casos

**Objetivo:** Simular produção real de conteúdo

---

### ETAPA 1: Geração (GPT 1)

**1. Abrir GPT 1 (Gerador)**

**2. Prompt de teste:**
```
Crie 6 casos de micro-momentos clínicos:
1. ruptura_alianca - basic
2. revelacao_dificil - intermediate
3. resistencia_tecnica - advanced
4. intervencao_crucial - basic
5. dilema_etico - intermediate
6. tecnica_oportuna - advanced

Transtornos variados (TAG, Depressão, TOC, TEPT, Fobia Social, Pânico).

Crie um caso por vez, aguarde minha confirmação antes do próximo.
```

**3. O que vai acontecer:**
- GPT 1 vai confirmar o plano
- Criar caso 1
- Aguardar você dizer "próximo" ou "continue"
- Criar caso 2
- ... até caso 6

**4. Tempo estimado:** 15-20 minutos (6 casos)

**5. Salve os 6 JSONs:**
- Copie cada JSON completo
- Cole em arquivo temporário (ex: `teste_lote_6_casos.txt`)
- Separe com comentários:
```
// ========================================
// CASO 1: Ruptura de Aliança (BASIC)
// ========================================
{...}

// ========================================
// CASO 2: Revelação Difícil (INTERMEDIATE)
// ========================================
{...}
```

---

### ETAPA 2: Revisão Técnica (GPT 2)

**1. Abrir GPT 2 (Revisor Técnico)**

**2. Prompt de teste:**
```
Recebi para revisão técnica este lote de 6 casos gerados pelo GPT 1.
Faça validação técnica completa de cada caso.

[COLAR OS 6 CASOS AQUI]
```

**3. O que vai acontecer:**
- GPT 2 vai analisar cada caso
- Gerar relatório estruturado
- Status de cada um: ✅ / ⚠️ / ❌
- Problemas específicos se houver
- Sugestões de correção

**4. Tempo estimado:** 10-15 minutos

**5. Resultados esperados:**

**Cenário ideal:**
```
✅ CASO 1: APROVADO
✅ CASO 2: APROVADO
✅ CASO 3: APROVADO
✅ CASO 4: APROVADO
⚠️ CASO 5: AJUSTES MENORES (opção D não plausível)
✅ CASO 6: APROVADO
```

**Cenário realista:**
```
✅ CASO 1: APROVADO
⚠️ CASO 2: AJUSTES MENORES (feedback curto)
❌ CASO 3: REJEITADO (dificuldade errada)
✅ CASO 4: APROVADO
⚠️ CASO 5: AJUSTES MENORES (1 opção boba)
✅ CASO 6: APROVADO
```

**6. Se houver problemas:**
- **Ajustes menores:** Você mesmo corrige os JSONs (5-10 min)
- **Rejeitados:** Volte ao GPT 1 e peça para recriar aquele caso específico

---

### ETAPA 3: Correções (Se Necessário)

**Se GPT 2 pediu ajustes:**

**1. Voltar ao GPT 1**

**2. Prompt:**
```
O Caso 5 (dilema_etico intermediate) foi rejeitado pelo Revisor Técnico por:
- Problema: Opção D não é plausível ("Dizer: Pare de reclamar")
- Sugestão: Substituir por erro real que terapeutas cometem

Por favor, recrie apenas este caso (dilema_etico intermediate) corrigindo este problema.
```

**3. GPT 1 vai recriar**

**4. Passe pelo GPT 2 novamente (só o caso corrigido)**

---

### ETAPA 4: Revisão Clínica (GPT 3)

**1. Selecionar apenas casos aprovados pelo GPT 2**

Por exemplo:
- Casos 1, 2, 4, 6 (aprovados)
- Caso 5 (após correção e re-aprovação)

**2. Abrir GPT 3 (Revisor Clínico)**

**3. Prompt:**
```
Recebi para revisão clínica estes 5 casos já aprovados tecnicamente pelo GPT 2.
Faça validação clínica completa (diagnóstico, intervenções, citações, ética).

[COLAR OS 5 CASOS APROVADOS]
```

**4. O que vai acontecer:**
- GPT 3 analisa clinicamente cada caso
- Verifica diagnósticos (DSM-5-TR)
- Valida intervenções (TCC/ACT/DBT)
- **CHECA CITAÇÕES** (reais vs inventadas)
- Valida ética (CFP)
- Status: ✅ / ⚠️ / ❌ / ❓

**5. Tempo estimado:** 15-20 minutos

**6. Resultados esperados:**

**Cenário ideal:**
```
✅ CASO 1: APROVADO CLINICAMENTE
✅ CASO 2: APROVADO CLINICAMENTE
✅ CASO 4: APROVADO CLINICAMENTE
⚠️ CASO 5: AJUSTE MENOR (sintoma atípico para TAG)
✅ CASO 6: APROVADO CLINICAMENTE
```

**Cenário realista:**
```
✅ CASO 1: APROVADO CLINICAMENTE
⚠️ CASO 2: AJUSTE MENOR (ano citação incorreto)
❌ CASO 4: REJEITADO (citação inventada)
❓ CASO 5: ESCALAR (dilema ético ambíguo - decisão institucional)
✅ CASO 6: APROVADO CLINICAMENTE
```

**7. Tratamento especial:**

**❓ ESCALADO (Status: NEEDS_HUMAN_REVIEW):**
- GPT 3 identificou dúvida legítima
- Exemplo: "Citação de Hayes (2020) não confirmada, mas parece plausível. Verificar em Google Scholar"
- **Ação:** Você (humano) verifica e decide

**❌ REJEITADO:**
- Exemplo: "Beck (2011) desenvolveu desfusão cognitiva" ← ERRO (desfusão é ACT/Hayes, não TCC/Beck)
- **Ação:** Voltar ao GPT 1, recriar caso com conceitos corretos

---

### ETAPA 5: Revisão Humana Final (Você)

**1. Casos aprovados clinicamente:**
- Leia cada um
- Verifique se faz sentido
- Aprove ou ajuste fino

**2. Casos escalados:**
- Verifique dúvida específica do GPT 3
- Exemplo: Checar citação em Google Scholar
- Decida: aprovar ou rejeitar

**3. Decisões institucionais:**
- Exemplo: Dilema ético sobre aceitar presente
- GPT 3 apresenta 2 perspectivas legítimas
- Você decide qual abordagem Scopsy vai ensinar

---

### ETAPA 6: População no Banco (Simulação)

**Casos aprovados finais:**

Exemplo de INSERT (você faria via código):

```sql
INSERT INTO cases (
  disorder,
  difficulty_level,
  moment_type,
  case_content,
  status,
  created_by
) VALUES (
  'TAG',
  'basic',
  'ruptura_alianca',
  '{"context": {...}, "critical_moment": {...}, ...}'::jsonb,
  'active',
  'gpt_generator_v1'
);
```

**Para este teste:**
- Você não precisa popular de verdade
- Apenas confirme que JSONs estão prontos
- Salve em arquivo: `casos_aprovados_teste.json`

---

## 📊 PARTE 5: AVALIAR RESULTADOS

### Métricas do Teste

**Taxa de aprovação esperada:**
- **GPT 2 (Técnico):** 70-80% aprovados na primeira rodada
- **GPT 3 (Clínico):** 80-90% dos aprovados pelo GPT 2

**Tempo total esperado:**
- Geração (GPT 1): 15-20 min
- Revisão técnica (GPT 2): 10-15 min
- Correções: 10-15 min
- Revisão clínica (GPT 3): 15-20 min
- Revisão humana: 10-15 min
- **TOTAL:** 60-85 minutos para 6 casos

**Isso significa:**
- ~10-14 min por caso (do zero até aprovado final)
- **Escalável:** 30-60 casos/dia se necessário

---

### Problemas Comuns e Soluções

**Problema 1: GPT 1 cria casos muito similares**

**Sintoma:**
- Todos os casos TAG
- Mesma estrutura de diálogo

**Solução:**
```
[No prompt do GPT 1]
"Variedade é crucial! Use:
- Transtornos diferentes (TAG, Depressão, TOC, TEPT, Fobia Social, Pânico)
- Nomes diferentes (João, Maria, Carlos, Ana, Pedro, Beatriz)
- Contextos variados (trabalho, família, relacionamento, saúde)"
```

---

**Problema 2: GPT 2 rejeita muitos casos**

**Sintoma:**
- Taxa de aprovação <50%

**Análise:**
- GPT 2 está muito rigoroso? OU
- GPT 1 não entendeu critérios?

**Solução:**
```
[Revisar instruções do GPT 1]
Focar mais em exemplos de cada nível (basic/intermediate/advanced)

[OU ajustar GPT 2]
Se rejeitou por motivo questionável, considerar ser menos rigoroso
```

---

**Problema 3: GPT 3 encontra muitas citações inventadas**

**Sintoma:**
- GPT 1 inventando autores/obras
- "Beck (2020) Mindfulness in ACT" ← impossível

**Solução:**
```
[Adicionar à instrução do GPT 1]
"CRÍTICO: Use APENAS autores e obras que você tem certeza que existem.
Prefira autores clássicos:
- Beck, J. S. (2011). Cognitive Behavior Therapy: Basics and Beyond (2ª ed.)
- Leahy, R. L. (2003). Roadblocks in CBT
- Safran & Muran (2000). Negotiating the Therapeutic Alliance
Se tiver dúvida, NÃO cite."
```

---

**Problema 4: GPT 3 escala muitos casos**

**Sintoma:**
- Muitos ❓ ESCALAR
- GPT 3 indeciso

**Análise:**
- É apropriado! GPT 3 deve escalar quando tiver dúvida legítima
- Isso protege contra aprovar citação inventada

**Solução:**
- Humano verifica casos escalados
- Se padrão recorrente (ex: sempre duvida de mesma obra), adicionar à base de conhecimento

---

## 🎯 PARTE 6: ITERAR E MELHORAR

### Após Primeiro Teste

**1. Anote padrões:**
- GPT 1 comete erros recorrentes? (ex: sempre confunde TCC com ACT)
- GPT 2 rejeita muito ou pouco?
- GPT 3 escala apropriadamente ou excessivamente?

**2. Ajuste instruções:**
- Adicione exemplos onde GPT 1 errou
- Esclareça critérios onde GPT 2 foi vago
- Refine lista de autores conhecidos do GPT 3

**3. Repita teste:**
- Gere novo lote de 6 casos
- Compare taxa de aprovação
- Esperado: melhora após cada iteração

---

### Otimizações Futuras

**Curto prazo (1-2 semanas):**
1. **Base de conhecimento:**
   - Upload de PDFs (DSM-5-TR, protocolos TCC) nos GPTs
   - Melhora precisão diagnóstica e técnica

2. **Templates:**
   - Criar prompts padronizados para cada tipo de momento
   - Ex: "Template para dilema_etico advanced: [estrutura]"

3. **Feedback loop:**
   - Casos que usuários reais adoram → analisar padrão
   - Casos que usuários reportam erro → corrigir GPT 1

**Médio prazo (1-3 meses):**
1. **Automação parcial:**
   - Script que pega output GPT 1 → passa GPT 2 → passa GPT 3
   - Você só revisa casos finais

2. **Métricas de qualidade:**
   - Trackear taxa de aprovação por tipo/nível
   - Identificar onde GPT 1 precisa melhorar

3. **Versioning:**
   - GPT 1 v1.1 (após aprendizado)
   - GPT 2 v1.1 (critérios refinados)
   - GPT 3 v1.1 (lista de citações expandida)

---

## ✅ CHECKLIST FINAL

### Após Implementação e Teste

**Implementação:**
- [ ] GPT 1 criado e funcionando
- [ ] GPT 2 criado e funcionando
- [ ] GPT 3 criado e funcionando
- [ ] Fluxo completo testado (6 casos)

**Qualidade:**
- [ ] Taxa de aprovação GPT 2: >70%
- [ ] Taxa de aprovação GPT 3: >80%
- [ ] Casos finais aprovados são de alta qualidade
- [ ] Tempo total por caso: <15 minutos

**Documentação:**
- [ ] Problemas encontrados documentados
- [ ] Soluções aplicadas documentadas
- [ ] Casos de teste salvos (para referência futura)

**Próximos passos:**
- [ ] População inicial do banco (30-60 casos)
- [ ] Implementar melhorias neurocientíficas
- [ ] Teste com usuários beta

---

## 💡 DICAS FINAIS

### Para Trabalhar Eficientemente

**1. Use múltiplas abas:**
- Aba 1: GPT 1 (deixa gerando enquanto você revisa)
- Aba 2: GPT 2 (validação técnica)
- Aba 3: GPT 3 (validação clínica)
- Aba 4: Documento com casos salvos

**2. Copy/paste estratégico:**
- Use notepad/VSCode para organizar JSONs
- Separe por status (aprovados, ajustes, rejeitados)
- Facilita passar entre GPTs

**3. Lotes pequenos primeiro:**
- Teste com 2-3 casos antes de fazer lote de 6
- Confirme que fluxo funciona
- Depois escale

**4. Salve tudo:**
- Prompts que funcionaram bem
- Casos exemplares (para treinar futuros GPTs)
- Erros comuns (para documentação)

---

## 🎉 CONCLUSÃO

### Você Terá

**Após concluir este guia:**
- ✅ 3 GPTs funcionais e testados
- ✅ Fluxo de produção validado
- ✅ 6+ casos de alta qualidade prontos
- ✅ Conhecimento de como iterar e melhorar
- ✅ Capacidade de produzir 30-60 casos/dia

**Próxima fase:**
- População do banco de dados
- Implementação das melhorias neurocientíficas
- Teste com usuários reais
- Iteração baseada em feedback

---

## 📞 SUPORTE

### Se Algo Der Errado

**Erro ao criar GPT:**
- Verifique se tem ChatGPT Plus/Pro
- Tente navegador diferente (Chrome recomendado)
- Limpe cache se necessário

**GPT não funciona como esperado:**
- Verifique se colou instruções completas
- Confirme configurações (model=GPT-4, temperature correta)
- Teste com prompt simples primeiro

**Dúvidas sobre fluxo:**
- Releia exemplos práticos nos documentos de cada GPT
- Compare output com exemplos esperados
- Ajuste instruções se necessário

---

**Boa sorte com a implementação! 🚀**

**Lembre-se:** Primeira iteração sempre tem ajustes. É normal. O importante é documentar aprendizados e melhorar continuamente.

---

**Versão:** 1.0
**Última atualização:** 05/01/2026
**Status:** Pronto para execução
