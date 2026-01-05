# 🚀 PLANO DE LANÇAMENTO PRAGMÁTICO - SCOPSY LAB

**Data:** 04/01/2026
**Objetivo:** Lançar em 2 dias com conteúdo "bom o suficiente"
**Filosofia:** MVP > Perfeição | Validar > Lapidar | Feedback Real > Suposições

---

## 📊 SITUAÇÃO ATUAL

### Status dos Módulos

```
✅ Desafios Clínicos    → 278 casos (FUNCIONA)
❌ Conceituação         → 0 casos (QUEBRADO - CRÍTICO!)
✅ Radar Diagnóstico    → Casos existem (FUNCIONA)
⚠️  Jornada Terapêutica → Backend incompleto (não crítico para MVP)
```

### O Que Está Pronto

- ✅ Frontend completo (4 módulos)
- ✅ Sistema de autenticação (JWT)
- ✅ Gamificação (cognits, níveis, badges)
- ✅ Integração Supabase
- ✅ Sistema de pagamento (Kiwify)
- ✅ Landing page + Checkout
- ✅ Scripts de população (já existem!)

### Problema Crítico

**Conceituação está quebrado:**
- 0 casos no banco
- Frontend retorna "Nenhum caso disponível"
- Usuário não consegue usar este módulo

---

## 🎯 DECISÃO ESTRATÉGICA

### ❌ O QUE NÃO FAZER (Antes de Lançar)

**Knowledge Base Completo:**
- 9 tabelas novas no Supabase
- Refatoração de código
- GPTs consultando banco estruturado
- **Tempo:** 2-4 semanas
- **Risco:** ALTO (pode quebrar funcionalidades)
- **ROI:** Negativo (investe muito, retorno zero por enquanto)

**Razão:** Isso é MUDANÇA ESTRUTURAL, não "popular conteúdo".

### ✅ O QUE FAZER (Solução Pragmática)

**Popular usando scripts existentes:**
- Scripts já estão no código (`populate-*.js`)
- Geram casos via OpenAI (você já paga mesmo)
- Salvam direto no Supabase
- **Tempo:** 1-2 dias
- **Risco:** BAIXO (zero mudança no código)
- **ROI:** ALTÍSSIMO (pode lançar e validar mercado)

---

## 📅 CRONOGRAMA DE 2 DIAS

### DIA 1 (HOJE) - Popular Conceituação

#### Manhã (2-3 horas)

**1. Rodar Script de População**
```bash
cd D:\projetos.vscode\SCOPSY-CLAUDE-CODE

# Popular casos de conceituação (todas categorias)
node populate-all-categories.js
```

**Aguardar:** ~10-15 minutos (gera 50 casos)

**Verificar no Supabase:**
```sql
SELECT
  count(*) as total,
  difficulty_level,
  category
FROM cases
WHERE category = 'clinical_moment'
  AND created_by = 'diverse_population_script'
GROUP BY difficulty_level, category;
```

**Resultado esperado:**
```
Total: 50+ casos
- Anxiety: 15 casos (5 basic, 5 intermediate, 5 advanced)
- Mood: 15 casos
- Trauma: 10 casos
- Personality: 10 casos
```

#### Tarde (3-4 horas)

**2. Testar Módulo de Conceituação**

- Abrir `frontend/conceituacao.html`
- Gerar 5 casos (1 de cada categoria)
- Preencher conceituação completa (4 campos)
- Verificar feedback formativo

**Checklist de Qualidade:**
- [ ] Vinheta faz sentido? (300-400 palavras)
- [ ] Tríade cognitiva identificável?
- [ ] Crenças são relevantes?
- [ ] Feedback é útil? (não genérico)
- [ ] XP é atribuído? (+30 cognits)

**Se casos estiverem ruins:**
- Ajustar prompts em `populate-all-categories.js`
- Deletar casos ruins do Supabase
- Re-rodar script

**3. Testar Outros Módulos (Quick Check)**

- **Desafios:** Gerar 2 momentos, responder
- **Radar:** Gerar 2 diagnósticos, responder
- **Jornada:** Verificar se lista jornadas (não precisa funcionar 100%)

---

### DIA 2 (AMANHÃ) - Ajustes Finais e Deploy

#### Manhã (2-3 horas)

**1. Correções Críticas (se houver)**

- Bugs encontrados ontem
- Ajustes de prompt (se necessário)
- Melhorias de UX urgentes

**2. Teste de Fluxo Completo**

**Fluxo do Usuário Real:**
```
1. Landing page → Checkout Kiwify
2. Criar conta → Login
3. Dashboard → Ver 4 módulos
4. Testar Desafios (1 caso)
5. Testar Conceituação (1 caso)
6. Testar Radar (1 caso)
7. Ver gamificação (cognits, badges)
8. Logout
```

**Timing:** ~15 minutos por fluxo completo

**Fazer 2x:**
- 1x como FREE trial
- 1x como PREMIUM (simular pagamento)

#### Tarde (2-3 horas)

**3. Deploy para Produção**

```bash
# Commit mudanças
git add .
git commit -m "feat: Popular casos de conceituação + ajustes pré-lançamento"
git push origin main

# Verificar deploy automático (Vercel)
# Aguardar ~3-5 minutos
```

**4. Teste em Produção**

- Abrir URL produção
- Repetir fluxo completo (15 min)
- Verificar se tudo funciona

**5. Preparar Comunicação de Lançamento**

- [ ] Post redes sociais (anunciar lançamento)
- [ ] Email lista (se tiver)
- [ ] Grupos psicologia (LinkedIn, Facebook)
- [ ] Story Instagram

---

## 🎉 LANÇAMENTO (Final do Dia 2)

### Checklist Pré-Lançamento

**Técnico:**
- [ ] ✅ Conceituação funcionando (50+ casos)
- [ ] ✅ Desafios funcionando (278 casos)
- [ ] ✅ Radar funcionando (casos existem)
- [ ] ✅ Autenticação funcionando
- [ ] ✅ Pagamento funcionando (Kiwify)
- [ ] ✅ Gamificação funcionando
- [ ] ✅ Deploy produção OK

**Conteúdo:**
- [ ] ✅ Landing page atualizada
- [ ] ✅ Preços definidos
- [ ] ✅ FAQ completo
- [ ] ✅ Termos de uso
- [ ] ✅ Política de privacidade

**Comunicação:**
- [ ] Post anúncio redes sociais
- [ ] Email lançamento (se tiver lista)
- [ ] Mensagem grupos psicólogos

### Momento do Lançamento

**Publicar simultaneamente:**
- LinkedIn (post profissional)
- Instagram (story + post)
- Facebook grupos psicologia
- Email (se tiver lista)

**Mensagem-chave:**
```
🚀 Scopsy Lab está no ar!

A primeira plataforma de treino clínico para psicólogos brasileiros.

✨ Casos clínicos reais
🎯 Feedback formativo instantâneo
🏆 Sistema de gamificação
📚 Baseado em TCC, ACT e DBT

Teste GRÁTIS por 7 dias: [link]

#Psicologia #TCC #TreinamentoClínico
```

---

## 📊 PÓS-LANÇAMENTO (Semana 1-4)

### Semana 1: Monitorar e Corrigir

**Métricas Críticas:**
- Quantos cadastros?
- Quantos testam FREE?
- Quantos convertem para PAID?
- Qual módulo mais usado?
- Onde travam/desistem?

**Ações:**
- Corrigir bugs reportados (prioridade 1)
- Responder dúvidas usuários
- Ajustar conteúdo se necessário

### Semana 2-4: Coletar Feedback

**Perguntas para usuários:**
1. Qual módulo você mais gosta? Por quê?
2. O feedback foi útil? Específico o suficiente?
3. Conteúdo é realista?
4. Falta algo?
5. O que te faria pagar?

**Canais de Feedback:**
- Email direto
- Formulário in-app
- Calls com early adopters (se possível)

### Decisões Baseadas em Feedback

**SE feedback for "conteúdo raso/genérico":**
→ AÍ sim implementar Knowledge Base (com $$ entrando)

**SE feedback for "falta módulo X":**
→ Priorizar novo módulo

**SE feedback for "interface confusa":**
→ Melhorias de UX

**SE não vender:**
→ Problema é marketing/posicionamento, não conteúdo

---

## 💰 EXPECTATIVAS REALISTAS

### Primeiras 4 Semanas

**Cenário Pessimista:**
- 20 cadastros
- 2 conversões (10%)
- R$ 60/mês
- Aprendizados: o que NÃO funciona

**Cenário Realista:**
- 50 cadastros
- 8 conversões (16%)
- R$ 240/mês
- Aprendizados: o que melhorar

**Cenário Otimista:**
- 100 cadastros
- 20 conversões (20%)
- R$ 600/mês
- Aprendizados: como escalar

### Mês 3 (Se iterar bem)

**Target realista:**
- 200 usuários ativos
- 30 pagantes (15%)
- R$ 900/mês
- Break-even operacional

---

## ⚠️ ARMADILHAS A EVITAR

### 1. Perfeccionismo Pré-Lançamento

**Sintomas:**
- "Só mais uma feature..."
- "Vou melhorar o conteúdo antes..."
- "Precisa estar perfeito..."

**Cura:**
- LANÇAR com "bom o suficiente"
- Iterar baseado em feedback REAL
- Lembrar: Duolingo v1 era bem simples

### 2. Ignorar Feedback de Usuários

**Sintomas:**
- "Eu sei melhor que eles..."
- "Mas a teoria diz que..."
- "Vou implementar minha visão..."

**Cura:**
- Usuário sempre tem razão sobre PROBLEMA
- Você tem razão sobre SOLUÇÃO
- Ouvir mais que falar

### 3. Otimização Prematura

**Sintomas:**
- "Vou refatorar o código..."
- "Vou implementar cache avançado..."
- "Vou criar microserviços..."

**Cura:**
- Só otimizar quando DER PROBLEMA
- Código "feio" que funciona > código "lindo" que ninguém usa
- Escalar quando tiver escala real

### 4. Feature Creep

**Sintomas:**
- "Vou adicionar chat entre usuários..."
- "Vou fazer app mobile..."
- "Vou adicionar certificados..."

**Cura:**
- Foco no core: TREINO CLÍNICO COM FEEDBACK
- Novas features SÓ se usuários pedirem
- 80% do valor vem de 20% das features

---

## 🎯 MANTRA DO LANÇAMENTO

```
┌────────────────────────────────────────┐
│                                        │
│   LANÇAR > LAPIDAR                     │
│   FEEDBACK REAL > SUPOSIÇÕES           │
│   USUÁRIOS PAGANTES > FEATURES LEGAIS  │
│   BOM O SUFICIENTE > PERFEITO          │
│                                        │
└────────────────────────────────────────┘
```

### Quando Alguém Perguntar "Mas e se..."

**Resposta padrão:**
```
"Boa pergunta! Vou anotar e decidir
baseado no feedback dos primeiros usuários."
```

### Quando Você Pensar "Vou Melhorar X Antes..."

**Resposta para si mesmo:**
```
"Isso é crítico para LANÇAR ou
é otimização que posso fazer DEPOIS?"

Se for DEPOIS → Ignorar por enquanto
```

---

## 📋 RESUMO EXECUTIVO

### Problema
- Conceituação quebrado (0 casos)
- Tentação de fazer Knowledge Base completo (4 semanas)

### Solução
- Popular com scripts existentes (1 dia)
- Lançar com "bom o suficiente" (2 dias)
- Iterar baseado em feedback real (semanas 1-4)

### Resultado Esperado
- SaaS funcionando e validando mercado
- Primeiras vendas em 1 semana
- Aprendizados reais sobre o que usuários valorizam
- Base para decisões futuras (Knowledge Base ou não)

### Próximo Passo
```bash
# HOJE, AGORA, JÁ:
node populate-all-categories.js
```

---

**"Done is better than perfect."** - Mark Zuckerberg
**"If you're not embarrassed by the first version, you've launched too late."** - Reid Hoffman

🚀 **BORA LANÇAR!**
