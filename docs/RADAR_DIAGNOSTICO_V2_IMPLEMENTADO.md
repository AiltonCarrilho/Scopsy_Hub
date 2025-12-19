# 🎯 Radar Diagnóstico 2.0 - IMPLEMENTADO

**Data:** 2024-12-18
**Arquivo Modificado:** `src/routes/diagnostic.js` (linhas 122-215)
**Status:** ✅ Pronto para testes

---

## 🎉 O QUE MUDOU

### ANTES:
- ❌ Apenas 1 formato: diagnóstico diferencial clássico
- ❌ Diferenciais genéricos (IA escolhia aleatoriamente)
- ❌ Palavras-chave óbvias na vinheta
- ❌ Opções de categorias completamente diferentes

### DEPOIS:
- ✅ **3 formatos rotativos** (variedade pedagógica!)
- ✅ Diferenciais PLAUSÍVEIS da mesma categoria
- ✅ Sem palavras-chave óbvias
- ✅ Treina múltiplas competências clínicas

---

## 📚 OS 3 FORMATOS IMPLEMENTADOS

### FORMATO 1: Diagnóstico Diferencial (40% dos casos)
**O que treina:** Escolher entre transtornos SIMILARES

**Exemplo:**
```
Vinheta: "Marina, 34 anos, professora, relata preocupação excessiva com
trabalho, finanças e saúde dos filhos há 8 meses. Dificuldade para relaxar,
tensão muscular, irritabilidade e insônia. Sintomas presentes na maioria dos
dias. Não há eventos traumáticos recentes nem situações específicas que
desencadeiem a ansiedade."

Pergunta: Qual é o diagnóstico DSM-5-TR mais provável?

A) Transtorno de Ansiedade Generalizada ✅
B) Transtorno de Ajustamento com Ansiedade
C) Transtorno de Pânico
D) Transtorno Depressivo Maior com ansiedade
```

---

### FORMATO 2: Critério Ausente (30% dos casos)
**O que treina:** Conhecimento PRECISO dos critérios DSM-5-TR

**Exemplo:**
```
Vinheta: [caso de TAG]

Diagnóstico: Transtorno de Ansiedade Generalizada

Pergunta: Qual dos sintomas apresentados NÃO faz parte dos critérios
DSM-5-TR de Transtorno de Ansiedade Generalizada?

A) Preocupação excessiva e difícil de controlar ✓
B) Inquietação ou sensação de estar "no limite" ✓
C) Fadiga fácil ✓
D) Ataques súbitos de pânico com taquicardia ✅ (pertence ao Pânico, não TAG)
```

---

### FORMATO 3: Intervenção Indicada (30% dos casos)
**O que treina:** Raciocínio clínico e timing de intervenções

**Exemplo:**
```
Vinheta: [caso clínico]

Contexto: Sessão 2 com Ana, 28 anos, TAG. Ela relata preocupação constante
mas "não entende por que isso acontece". Ainda não foi feita psicoeducação.

Pergunta: Qual intervenção TCC seria MAIS indicada neste momento?

A) Psicoeducação sobre modelo cognitivo da ansiedade ✅
B) Exposição a situações ansiogênicas
C) Reestruturação cognitiva profunda
D) Treino de relaxamento muscular progressivo
```

---

## 🎲 COMO FUNCIONA

1. **IA escolhe aleatoriamente** 1 dos 3 formatos
2. **Gera caso clínico** seguindo regras do formato escolhido
3. **Retorna JSON** com campo `format_type` identificando qual formato foi usado
4. **Frontend renderiza** normalmente (já é múltipla escolha)

---

## 📊 DISTRIBUIÇÃO ESPERADA

| Formato | % dos Casos | Competência Treinada |
|---------|------------|----------------------|
| Diagnóstico Diferencial | 40% | Diagnóstico diferencial entre similares |
| Critério Ausente | 30% | Conhecimento DSM-5-TR preciso |
| Intervenção Indicada | 30% | Raciocínio clínico / timing |

---

## 🔒 GARANTIAS DE QUALIDADE (REGRAS NO PROMPT)

### 1. Diferenciais Plausíveis
- ✅ Todas as opções da MESMA categoria (ex: apenas ansiedade)
- ✅ Diferenciais diferem por 1-2 critérios DSM apenas
- ❌ NUNCA misturar categorias distantes

### 2. Evitar "One-Word Diagnosis"
- ✅ Descrever SINTOMAS e CONTEXTO
- ❌ NÃO usar palavras-chave óbvias na vinheta
- Exemplo: NÃO escrever "pânico" se diagnóstico é Pânico

### 3. Nível de Dificuldade
- **Basic:** 1 opção claramente errada, 2 plausíveis, 1 correta
- **Intermediate:** 3 opções plausíveis, 1 correta (diferença sutil)
- **Advanced:** 4 opções igualmente plausíveis, critérios DSM diferenciam

### 4. Vinheta Realista
- 150-200 palavras
- Português brasileiro natural
- Contexto clínico realista (não acadêmico demais)
- Idade 20-60 anos, profissões variadas

---

## 🧪 COMO TESTAR

### Teste Manual (Recomendado AGORA):

1. **Inicie o backend:**
```bash
cd SCOPSY-CLAUDE-CODE
npm run dev
```

2. **Acesse o Radar Diagnóstico** no frontend

3. **Gere 10 casos seguidos**

4. **Verifique:**
   - ✅ Casos aparecem em formatos diferentes?
   - ✅ Diferenciais são plausíveis (mesma categoria)?
   - ✅ Não tem palavras-chave óbvias?
   - ✅ Intervenções fazem sentido para o contexto?

5. **Analise no console do backend:**
```
[Diagnostic] ✅ Caso selecionado (id: abc-123)
```

Abra o caso gerado e veja o JSON completo para avaliar qualidade.

---

## 📈 IMPACTO ESPERADO

### Taxa de Acerto:
- **ANTES:** ~90% (muito fácil - ilusão de competência)
- **DEPOIS:** ~60-70% (dificuldade real - aprendizado efetivo)

**ISSO É BOM!** Significa que está treinando de verdade.

### Engajamento:
- **ANTES:** Monótono (sempre o mesmo formato)
- **DEPOIS:** Variado (3 tipos de desafio)

### Aprendizado:
- **ANTES:** Superficial (reconhecimento de padrões óbvios)
- **DEPOIS:** Profundo (critérios DSM + raciocínio clínico)

---

## 🔄 PRÓXIMAS ITERAÇÕES (Depois de validar)

### Curto Prazo (se funcionar bem):
- ✅ Adicionar FORMATO 4: "Sinal que NÃO é o diagnóstico"
- ✅ Adicionar FORMATO 5: "Intervenção que NÃO usar ainda"

### Médio Prazo:
- ✅ Biblioteca de diferenciais pré-curados (controle total)
- ✅ Feedback mais rico por formato
- ✅ Analytics: qual formato tem menor taxa de acerto?

### Longo Prazo:
- ✅ Diagnósticos a descartar primeiro (hierarquia)
- ✅ Comorbidades concorrentes
- ✅ Especificadores DSM

---

## 🎓 EXEMPLO COMPLETO DE JSON GERADO

```json
{
  "metadata": {
    "difficulty_level": "intermediate",
    "category": "anxiety",
    "disorder": "Transtorno de Ansiedade Generalizada"
  },
  "clinical_content": {
    "vignette": "Marina, 34 anos, professora do ensino fundamental, busca atendimento relatando preocupação constante e intensa com diversas áreas da vida há aproximadamente 8 meses. Refere que se preocupa excessivamente com desempenho no trabalho, finanças familiares e saúde dos filhos, mesmo quando não há motivo real para isso. Relata dificuldade para relaxar, tensão muscular frequente, especialmente nos ombros e pescoço, irritabilidade crescente e insônia de manutenção (acorda várias vezes pensando nas preocupações). Os sintomas estão presentes na maioria dos dias e interferem em sua concentração no trabalho e nas interações familiares. Não identifica eventos traumáticos recentes nem situações específicas que desencadeiem os sintomas.",
    "session_context": null,
    "demographics": {
      "name": "Marina",
      "age": 34,
      "occupation": "Professora do ensino fundamental"
    }
  },
  "diagnostic_structure": {
    "correct_diagnosis": "Transtorno de Ansiedade Generalizada",
    "criteria_present": [
      "Preocupação excessiva e difícil de controlar por 6+ meses",
      "Inquietação, tensão muscular, irritabilidade, insônia",
      "Interferência significativa no funcionamento"
    ],
    "differential_reasoning": "Ajustamento descartado por ausência de estressor identificável. Pânico descartado por ausência de ataques súbitos. Depressão descartada por ausência de humor deprimido/anedonia como sintoma central."
  },
  "question_format": {
    "format_type": "differential",
    "question": "Qual é o diagnóstico DSM-5-TR mais provável?",
    "options": [
      "Transtorno de Ansiedade Generalizada",
      "Transtorno de Ajustamento com Ansiedade",
      "Transtorno de Pânico",
      "Transtorno Depressivo Maior com sintomas ansiosos"
    ],
    "correct_answer": "Transtorno de Ansiedade Generalizada",
    "rationale": "Presença de preocupação excessiva por mais de 6 meses, difícil de controlar, associada a sintomas somáticos (tensão, irritabilidade, insônia) e sem gatilho situacional específico, configurando TAG segundo DSM-5-TR."
  }
}
```

---

## ✅ STATUS

- [x] Prompt modificado
- [x] 3 formatos implementados
- [x] Regras de qualidade adicionadas
- [ ] Testado com 20 casos gerados
- [ ] Taxa de acerto medida
- [ ] Feedback dos psicólogos coletado

---

## 🚀 PRÓXIMO PASSO

**TESTAR AGORA!**

Gere 10-20 casos no frontend e avalie:
1. Variedade de formatos (os 3 aparecem?)
2. Qualidade dos diferenciais (plausíveis?)
3. Ausência de palavras-chave óbvias
4. Realismo clínico das vinhetas

Se 80%+ dos casos forem bons → **DEPLOY!**

Se não → Ajustar prompt e iterar.

---

**Próxima evolução:** Adicionar mais formatos quando esses 3 estiverem validados.
