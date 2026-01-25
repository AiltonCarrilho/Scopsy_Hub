# 🔍 AUDITORIA: Recursos Valiosos da Visão Estratégica

**Objetivo:** Identificar recursos planejados mas não implementados nos GPTs/casos

---

## ✅ JÁ INCLUÍMOS

1. ✅ **Elaborative Encoding** (feedback em 3 níveis)
2. ✅ **Humanização do feedback** (tom supervisor)
3. ✅ **Formato JSON completo**
4. ✅ **4 opções plausíveis**

---

## ⚠️ NÃO INCLUÍMOS (MAS DEVERÍAMOS)

### 1️⃣ **Calibração de Confiança** (Metacognição)

**Ciência:** Dunning-Kruger (1999) - Overconfidence É PERIGOSO na clínica

**O que é:**
Antes de ver feedback, usuário indica confiança (1-5):

- 1: "Chutei"
- 3: "Acho que está certo"
- 5: "Certeza absoluta"

**Por que importa:**

- Psicólogo que erra com alta confiança é RISCO para paciente
- Calibração: confiança deve corresponder a conhecimento real

**NO CASO, adicionar:**

```json
"metacognitive_prompts": {
  "confidence_question": "Antes de ver o feedback, quão confiante você está nesta decisão?",
  "confidence_scale": {
    "1": "🤷 Chutei completamente",
    "2": "🤔 Não tenho certeza",
    "3": "💭 Acho que está certo",
    "4": "✓ Bastante confiante",
    "5": "✓✓ Certeza absoluta"
  },
  "calibration_feedback": {
    "correct_high_confidence": "✅ Perfeito! Você está bem calibrado.",
    "correct_low_confidence": "✅ Acertou! Você sabia mais do que pensava. Trabalhe sua autoconfiança.",
    "incorrect_high_confidence": "⚠️ IMPORTANTE: Você errou com muita confiança. Overconfidence é um dos maiores riscos clínicos. Quando tiver certeza absoluta, SEMPRE revise.",
    "incorrect_low_confidence": "Você está ciente que ainda está aprendendo. Bom senso de autoconsciência."
  }
}
```

---

### 2️⃣ **Delayed Feedback** (3 segundos)

**Ciência:** Shute (2008) - Melhoria +15-20% na consolidação

**O que é:**
Após escolher, aguardar 3s ANTES de mostrar se acertou.

**Por que importa:**

- Cérebro processa decisão
- Cria "suspense cognitivo"
- Consolida memória de trabalho

**NO CASO, adicionar:**

```json
"interaction_timing": {
  "feedback_delay_seconds": 3,
  "delay_message": "Analisando sua decisão...",
  "show_timer": false,
  "rationale": "Delay permite processamento cognitivo profundo (Shute 2008)"
}
```

---

### 3️⃣ **Interleaved Practice Tags** (Prática Intercalada)

**Ciência:** Rohrer & Taylor (2007) - Melhoria +40-50% retenção

**O que é:**
Não repetir mesmo tema consecutivamente.

**Exemplo:**

- ❌ 10 casos de depressão seguidos
- ✅ Depressão → Ansiedade → Trauma → Depressão...

**NO CASO, adicionar:**

```json
"interleaving_metadata": {
  "disorder_category": "depression", // anxiety, trauma, ocd, panic
  "technique_cluster": "restructuring", // exposure, validation, behavioral
  "topic_id": "triade_cognitiva",
  "avoid_consecutive": true
}
```

---

### 4️⃣ **Difficulty Numeric Score** (Dificuldade Adaptativa)

**Ciência:** Bjork & Bjork (2011) - 70% acerto = zona ideal

**O que é:**
Score numérico 1-10 de dificuldade para algoritmo escolher próximo caso.

**NO CASO, adicionar:**

```json
"adaptive_difficulty": {
  "difficulty_numeric": 4, // 1-10
  "complexity_factors": {
    "ambiguity": 3, // 1-5: Quão ambígua é situação
    "time_pressure": 2, // 1-5: Urgência da decisão
    "variables_count": 3, // Quantas variáveis considerar
    "emotional_load": 4 // 1-5: Carga emocional do caso
  }
}
```

---

### 5️⃣ **Transfer Distance** (Testes de Transferência)

**Ciência:** Barnett & Ceci (2002) - Near vs Far Transfer

**O que é:**
Classificar se caso testa transferência de conhecimento.

**Tipos:**

- **NEAR:** Aplica mesma técnica em transtorno diferente
- **FAR:** Aplica princípio em domínio completamente diferente

**NO CASO, adicionar:**

```json
"transfer_metadata": {
  "is_transfer_challenge": false, // true se for teste de transferência
  "transfer_distance": null, // "near", "medium", "far" se aplicável
  "source_concept": null, // De onde deve transferir (ex: "reestruturacao_depressao")
  "target_context": null // Para onde transferir (ex: "ansiedade_social")
}
```

---

### 6️⃣ **Retrieval vs Recognition Mode**

**Ciência:** Karpicke & Roediger (2008) - Retrieval > Recognition em 50-100%

**O que é:**

- **Recognition:** Múltipla escolha (mais fácil, menos efetivo)
- **Retrieval:** Campo aberto (mais difícil, MUITO mais efetivo)

**NO CASO, adicionar:**

```json
"question_mode": "recognition", // ou "retrieval"
"retrieval_prompt": null, // Se modo retrieval: "O que você faria nesta situação? Explique seu raciocínio em 3-5 frases."
"requires_explanation": true // Se true, solicita explicação após escolher
```

---

### 7️⃣ **Overlearning Requirements**

**Ciência:** Driskell et al. (1992) - Move conhecimento para "automático"

**O que é:**
Após dominar bloco (90%+), fazer 3-5 casos extras de consolidação.

**NO CASO, adicionar:**

```json
"learning_stage": {
  "is_overlearning": false, // true se for caso de consolidação
  "is_first_exposure": false, // true se primeira vez vendo conceito
  "is_review": false, // true se revisão espaçada
  "mastery_requirement": 0.85 // % necessário para considerar dominado
}
```

---

### 8️⃣ **Prerequisites Tracking**

**Ciência:** Bloom (1968) - Mastery Learning

**O que é:**
Casos só liberados após dominar fundação.

**NO CASO, adicionar:**

```json
"prerequisite_metadata": {
  "required_blocks": ["1.1", "1.2"], // Blocos que devem estar 85%+ completos
  "required_concepts": ["triade_cognitiva", "pensamentos_automaticos"],
  "can_access_without": false // Se true, permite acesso antecipado (não recomendado)
}
```

---

### 9️⃣ **Time Tracking**

**Ciência:** Certificação CFP - Mínimo 40h de prática

**NO CASO, adicionar:**

```json
"time_metadata": {
  "estimated_time_minutes": 5, // Tempo estimado para completar este caso
  "counts_toward_certification": true
}
```

---

### 🔟 **Learning Point Evolution** (Padrão → Resposta → Erro Comum)

**JÁ TEMOS MAS pode melhorar:**

**ATUAL:**

```json
"learning_point": {
  "pattern_to_recognize": "Se X+Y → Z",
  "instant_response": "A → B → C",
  "common_mistake": "Iniciantes X. Experientes Y"
}
```

**MELHORAR PARA:**

```json
"learning_point": {
  "pattern_to_recognize": "Se X+Y → Z está ocorrendo",
  "instant_response": "Fazer A → Depois B → Então C",
  "common_mistake": "Iniciantes fazem X porque pensam Y. Experientes fazem Z porque sabem W.",
  "why_it_matters": "Este padrão aparece em 40%+ dos pacientes com [transtorno]. Dominar isso economiza anos de tentativa-erro.",
  "related_patterns": ["pattern_id_1", "pattern_id_2"]
}
```

---

## 🎯 RECOMENDAÇÕES

### ADICIONAR AGORA (Alta prioridade)

1. ✅ **`metacognitive_prompts`** - Calibração de confiança (CRÍTICO para clínica)
2. ✅ **`interleaving_metadata`** - Tags para prática intercalada
3. ✅ **`adaptive_difficulty`** - Score numérico de dificuldade
4. ✅ **`question_mode`** + `requires_explanation` - Retrieval practice

### ADICIONAR DEPOIS (Fase 2)

1. ⏳ **`interaction_timing`** - Delayed feedback (precisa backend)
2. ⏳ **`transfer_metadata`** - Testes de transferência (após ter massa de casos)
3. ⏳ **`learning_stage`** - Overlearning (após implementar blocos)
4. ⏳ **`prerequisite_metadata`** - Pré-requisitos (após implementar trilhas)

### MELHORAR

1. ✅ **`learning_point`** - Adicionar `why_it_matters` + `related_patterns`

---

## 📋 FORMATO JSON ATUALIZADO (v3)

```json
{
  "tag": "...",
  "moment_type": "...",
  "difficulty_level": "...",
  
  // ➕ NOVOS CAMPOS
  "interleaving_metadata": {
    "disorder_category": "depression",
    "technique_cluster": "restructuring",
    "topic_id": "triade_cognitiva"
  },
  
  "adaptive_difficulty": {
    "difficulty_numeric": 4,
    "complexity_factors": {
      "ambiguity": 3,
      "time_pressure": 2,
      "variables_count": 3,
      "emotional_load": 4
    }
  },
  
  "question_mode": "recognition",
  "requires_explanation": true,
  
  // RESTO IGUAL
  "context": {...},
  "critical_moment": {...},
  "options": [...],
  "expert_choice": "A",
  
  "expert_reasoning": {
    "why_this_works": "...",
    "why_others_fail": {...},
    "comparative_insights": {...}
  },
  
  "theoretical_depth": {...},
  
  "learning_point": {
    "pattern_to_recognize": "...",
    "instant_response": "...",
    "common_mistake": "...",
    "why_it_matters": "Este padrão aparece em X% dos casos...",
    "related_patterns": ["id1", "id2"]
  },
  
  // ➕ NOVO CAMPO
  "metacognitive_prompts": {
    "confidence_question": "...",
    "confidence_scale": {...},
    "calibration_feedback": {...}
  }
}
```

---

## ⚠️ O QUE NÃO PERDER

**Top 3 MAIS importantes esquecidos:**

1. **Calibração de Confiança** - Overconfidence mata paciente
2. **Interleaving Tags** - +40-50% retenção
3. **Difficulty Numeric** - Manter usuário em 70% (flow)

**Implementar esses 3 = diferença entre "quiz" e "sistema científico de maestria"**

---

**Próximo passo:** Atualizar `gpt-1-CONDENSADO` para v3 com esses campos? Ou deixar v2 por enquanto e adicionar depois?
