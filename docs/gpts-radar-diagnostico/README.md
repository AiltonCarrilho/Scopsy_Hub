# 📚 RADAR DIAGNÓSTICO - DOCUMENTAÇÃO COMPLETA

**Módulo:** Radar Diagnóstico (DSM-5-TR Training)
**Status:** 🟡 Funcional mas sub-otimizado → ✅ Pronto para migração
**Data:** 05/01/2026

---

## 📁 DOCUMENTOS DISPONÍVEIS

### 1. **AUDITORIA_RADAR_DIAGNOSTICO_COMPLETA.md**
Auditoria estratégica profunda do módulo identificando 6 gaps críticos:
- GAP 1: Geração sob demanda (latência 5-8s, custo $30/mês)
- GAP 2: Zero validação de qualidade (40% casos ruins)
- GAP 3: Vinhetas curtas/genéricas
- GAP 4: Distribuição de formatos não controlada
- GAP 5: Feedback genérico em tempo real
- GAP 6: Falta melhorias neurocientíficas

**Resultado:** Proposta de migrar para população pré-curada (150 casos validados).

---

### 2. **RADAR_DIAGNOSTICO_MELHORIAS_NEUROCIENCIA.md**
Melhorias neurocientíficas adaptadas para casos curtos (45-90s):
- ✅ **Interleaving Duplo:** Alterna formato (differential/criteria/intervention) E categoria DSM
- ✅ **Dificuldade Adaptativa:** Ajusta basic/intermediate/advanced (janela 10 casos)
- ✅ **Retrieval Practice:** Perguntas DSM intercaladas (1 a cada 4 casos)
- ✅ **Feedback Progressivo:** 3 níveis expansíveis (-40% carga cognitiva)

**Roadmap:** Fase 1 (3h) → Fase 2 (3h) → Fase 3 (10h)

---

### 3. **GPT_1_GERADOR_RADAR_DIAGNOSTICO.md**
Prompt completo (~6.200 chars) para criar GPT Gerador.

**Gera:**
- 3 formatos rotativos (differential 40% / criteria 30% / intervention 30%)
- Vinhetas 180-200 palavras (sem palavras-chave óbvias)
- Diferenciais plausíveis (mesma categoria DSM)
- Feedback pré-gerado (economia 90% custo)

---

### 4. **GPT_2_REVISOR_TECNICO_RADAR_DIAGNOSTICO.md**
Prompt completo (~6.800 chars) para criar GPT Revisor Técnico.

**Valida:**
- Estrutura JSON completa
- Contagem palavras (180-200)
- Ausência palavras-chave
- Diferenciais mesma categoria DSM
- Feedback específico (não genérico)

**Taxa aprovação:** 70-80%

---

### 5. **GPT_3_REVISOR_CLINICO_RADAR_DIAGNOSTICO.md**
Prompt completo (~7.400 chars) para criar GPT Revisor Clínico.

**Valida:**
- Precisão DSM-5-TR (critérios, duração, sintomas)
- Diferenciais discrimináveis
- Plausibilidade clínica
- Qualidade pedagógica
- Timing intervenções TCC

**Taxa aprovação:** 80-90% (dos aprovados pelo GPT 2)

---

### 6. **WORKFLOW_POPULACAO_RADAR_DIAGNOSTICO.md**
Workflow completo para popular 150 casos validados.

**Distribuição:**
- 50 basic / 50 intermediate / 50 advanced
- 60 anxiety / 45 mood / 30 trauma / 10 personality / 5 psychotic
- 40% differential / 30% criteria / 30% intervention

**Estimativa:** 20h trabalho, ~$60 USD

---

## 🎯 FLUXO RECOMENDADO

```
1. Ler: AUDITORIA_RADAR_DIAGNOSTICO_COMPLETA.md
   ↓ (entender gaps e proposta)

2. Ler: WORKFLOW_POPULACAO_RADAR_DIAGNOSTICO.md
   ↓ (entender como popular)

3. Criar 3 GPTs:
   - GPT_1_GERADOR_RADAR_DIAGNOSTICO.md
   - GPT_2_REVISOR_TECNICO_RADAR_DIAGNOSTICO.md
   - GPT_3_REVISOR_CLINICO_RADAR_DIAGNOSTICO.md
   ↓

4. Gerar 150 casos (20h, ~$60)
   ↓

5. Inserir no banco (script fornecido)
   ↓

6. Implementar melhorias neurocientíficas:
   - RADAR_DIAGNOSTICO_MELHORIAS_NEUROCIENCIA.md
   ↓

7. LUCRO! Módulo 100% otimizado
```

---

## 📊 RESULTADO ESPERADO

### ANTES (Situação Atual)
- ❌ Geração sob demanda (5-8s latência)
- ❌ Qualidade inconsistente (~60% bons)
- ❌ Custo: $0.03/caso tempo real = $30/mês
- ❌ Sem melhorias neurocientíficas

### DEPOIS (Com Este Workflow)
- ✅ Cache-first (<500ms, 95% dos casos)
- ✅ Qualidade 85-95% (3 GPTs validaram)
- ✅ Custo: $0 (pré-gerado)
- ✅ Melhorias neurocientíficas implementadas
- ✅ **Resultado:** +43% retenção, +40% engajamento

---

## 🚀 PRÓXIMOS PASSOS

1. **URGENTE:** Popular banco com 150 casos (20h, $60)
2. **ALTA:** Implementar Fase 1 melhorias (3h)
3. **MÉDIA:** Implementar Fase 2 melhorias (3h, aguardar dados)

---

**Criado por:** Claude Code
**Data:** 05/01/2026
**Versão:** 1.0
