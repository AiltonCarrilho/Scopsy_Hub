# 🚀 SCOPSY MVP - Arquitetura Kiwify + FlexiFunnels

**Data:** 19/12/2024
**Versão:** 1.0 - MVP Brasileiro
**Status:** 🟢 Implementação

---

## 🎯 Decisão Estratégica

**Problema identificado:**
- ❌ Stripe bloqueia pessoa física no Brasil
- ❌ Burocracia para CNPJ atrasa MVP
- ❌ Custos e complexidade desnecessários para validação

**Solução MVP:**
- ✅ **FlexiFunnels (Tier 3 Lifetime)** - Landing page alta conversão
- ✅ **Kiwify** - Gateway pagamento BR (aceita PF, parcelamento, Pix)
- ✅ **Webhooks Kiwify** - Automação de acesso ao SaaS
- ✅ **index.html → Página Institucional** - "Sobre o ScopsyLab"

---

## 💰 Estrutura de Planos (SIMPLIFICADA)

### 🆓 Trial Gratuito - 7 dias

**Objetivo:** Deixar experimentar antes de pagar

| Feature | Acesso Trial |
|---------|-------------|
| Desafios Clínicos | 30 casos |
| Radar Diagnóstico | 30 casos |
| Conceituação Cognitiva | 7 casos |
| Jornada Clínica | ❌ Bloqueado |
| Sistema de Gamificação | ⚠️ Visualiza mas não ganha badges |
| Cognits/XP | ⚠️ Visualiza progresso |

**Após 7 dias:**
- ❌ Bloqueia acesso a todos os módulos
- 🎯 Mostra tela: "Seu trial expirou. Desbloqueie acesso ilimitado por R$ 47/mês"

---

### ⭐ Premium - R$ 47,00/mês

**ÚNICO PLANO PAGO** (decisão simples = mais conversão)

| Feature | Acesso Premium |
|---------|---------------|
| Desafios Clínicos | ♾️ **Ilimitado** |
| Radar Diagnóstico | ♾️ **Ilimitado** |
| Conceituação Cognitiva | ♾️ **Ilimitado** |
| Jornada Clínica | ✅ **12 sessões completas** |
| Sistema de Gamificação | ✅ **Badges, níveis, títulos** |
| Cognits/XP | ✅ **Sistema completo** |
| Certificado de Conclusão | ✅ **Sim** |
| Histórico Completo | ✅ **Todas conversas salvas** |
| Exportar Conversas PDF | ✅ **Sim** |
| Suporte | ✅ **Email 24h** |

**Por que R$ 47?**
- ✅ Preço psicológico (abaixo de R$ 50)
- ✅ Parcelável até 12x (R$ 3,91/mês no cartão)
- ✅ Competitivo (livros de psicologia custam R$ 80-120)
- ✅ Acessível para estudantes

---

## 🏗️ Arquitetura Completa

```
┌─────────────────────────────────────────────────────────────┐
│                    JORNADA DO CLIENTE                        │
└─────────────────────────────────────────────────────────────┘

1. DESCOBERTA
   └─► Google/Instagram/Indicação
         ↓
2. LANDING PAGE (FlexiFunnels)
   ├─► VSL explicativo (2-3 min)
   ├─► Benefícios + Prova Social
   ├─► "7 dias grátis, depois R$ 47/mês"
   └─► CTA: "Começar Trial Grátis"
         ↓
3. CADASTRO TRIAL (scopsy.com.br/signup)
   ├─► Nome, Email, CRP (opcional)
   ├─► Senha
   └─► Cria conta com plan='free'
         ↓
4. TRIAL ATIVO (7 dias)
   ├─► Acessa dashboard
   ├─► Testa módulos (com limites)
   └─► Banner: "5 dias restantes de trial"
         ↓
5. DIA 7 - CONVERSÃO
   ├─► Modal: "Trial expirado. Upgrade para Premium?"
   ├─► Botão → Checkout Kiwify
   └─► Link: https://kiwify.app/scopsy_premium
         ↓
6. CHECKOUT (Kiwify)
   ├─► Email pré-preenchido
   ├─► Pagamento (Pix / Cartão / Boleto)
   └─► Kiwify processa pagamento
         ↓
7. WEBHOOK (Automação)
   ├─► Kiwify envia evento → Backend Scopsy
   ├─► Backend atualiza plan='premium'
   ├─► Libera acesso ilimitado
   └─► Envia email de boas-vindas Premium
         ↓
8. PREMIUM ATIVO
   ├─► Login → Dashboard completo
   ├─► Todos módulos desbloqueados
   └─► Gamificação full
```

---

## 📦 Componentes do Sistema

### 1️⃣ FlexiFunnels (Landing Page)

**URL:** `https://scopsy.flexifunnels.com.br` (ou domínio próprio)

**Estrutura da Página:**

```
┌─────────────────────────────────────────┐
│           HERO SECTION                  │
│                                         │
│  "Treine seu Olhar Clínico com IA      │
│   e Transforme-se em Expert TCC"       │
│                                         │
│  [Começar 7 dias grátis] ←── CTA       │
│   Depois apenas R$ 47/mês              │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│        PROBLEMA (Dor)                   │
│                                         │
│  "Você sente insegurança ao atender    │
│   casos complexos?"                    │
│                                         │
│  • Dúvida em formular diagnósticos     │
│  • Insegurança em escolher técnicas    │
│  • Falta de prática supervisionada     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│        SOLUÇÃO                          │
│                                         │
│  "ScopsyLab simula casos clínicos      │
│   reais com feedback de IA expert"     │
│                                         │
│  [Imagem: Screenshot do dashboard]     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│        COMO FUNCIONA (3 Passos)         │
│                                         │
│  1️⃣ Treine com Casos Reais             │
│     Desafios, Radar, Conceituação      │
│                                         │
│  2️⃣ Receba Feedback Expert             │
│     IA analisa suas decisões           │
│                                         │
│  3️⃣ Evolua seu Nível Clínico           │
│     Badges, XP, Certificado            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│        MÓDULOS DETALHADOS               │
│                                         │
│  🎯 Desafios Clínicos                   │
│     Micro-momentos críticos             │
│                                         │
│  🔍 Radar Diagnóstico                   │
│     Treino DSM-5-TR                     │
│                                         │
│  🧩 Conceituação Cognitiva              │
│     Formulação de caso TCC              │
│                                         │
│  🚀 Jornada Clínica (Premium)           │
│     12 sessões longitudinais            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│        PLANO & PREÇO                    │
│                                         │
│  💎 Premium - R$ 47/mês                 │
│                                         │
│  ✅ Acesso ilimitado                    │
│  ✅ Todos os módulos                    │
│  ✅ Gamificação completa                │
│  ✅ Certificado                         │
│  ✅ 7 dias grátis para testar           │
│                                         │
│  12x de R$ 3,91 no cartão              │
│  ou R$ 47 no Pix/Boleto                │
│                                         │
│  [Começar Trial Grátis]                │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│        PROVA SOCIAL                     │
│                                         │
│  📸 Foto + Nome + CRP                   │
│  "Aumentei minha segurança clínica     │
│   em 2 semanas de treino!"             │
│   - Dra. Maria (CRP 01/12345)          │
│                                         │
│  [Mais 2-3 depoimentos]                │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│        FAQ                              │
│                                         │
│  ❓ Como funciona o trial?              │
│  ❓ Posso cancelar quando quiser?       │
│  ❓ Tem certificado reconhecido?        │
│  ❓ Funciona no celular?                │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│        CTA FINAL                        │
│                                         │
│  "Comece a treinar agora               │
│   (7 dias grátis, sem compromisso)"    │
│                                         │
│  [Começar Meu Trial]                   │
└─────────────────────────────────────────┘
```

**Botão CTA leva para:**
```
https://scopsy.com.br/signup?source=flexifunnels
```

---

### 2️⃣ Kiwify (Gateway de Pagamento)

**O que configurar:**

#### Produto Único no Kiwify

| Item | Valor |
|------|-------|
| Nome do Produto | ScopsyLab Premium |
| Preço | R$ 47,00 |
| Recorrência | Mensal |
| ID Kiwify | `scopsy_premium` |
| Parcelamento | Até 12x sem juros |
| Métodos | Pix, Cartão, Boleto |

#### Configurar Webhooks

**URL do Webhook:**
```
https://scopsy.com.br/api/webhooks/kiwify
```

**Eventos a ouvir:**
- ✅ `order.approved` - Pagamento aprovado → Ativar Premium
- ✅ `subscription.canceled` - Cancelamento → Downgrade para Free
- ✅ `subscription.renewed` - Renovação → Manter Premium
- ✅ `order.refunded` - Reembolso → Downgrade para Free

**Payload Exemplo (order.approved):**
```json
{
  "event": "order.approved",
  "order_id": "KW_ABC123",
  "product_id": "scopsy_premium",
  "customer": {
    "email": "psicologo@email.com",
    "name": "Dr. João Silva",
    "phone": "+5511999999999"
  },
  "value": 47.00,
  "payment_method": "credit_card",
  "installments": 12,
  "status": "approved",
  "created_at": "2024-12-19T15:30:00Z",
  "subscription_id": "SUB_123"
}
```

---

### 3️⃣ Backend Scopsy (Webhook Handler)

**Arquivo:** `src/routes/webhooks.js` (criar novo)

**Fluxo Completo:**

```javascript
// POST /api/webhooks/kiwify
router.post('/kiwify', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // 1. Validar assinatura Kiwify
    const signature = req.headers['x-kiwify-signature'];
    if (!validateKiwifySignature(req.body, signature, process.env.KIWIFY_WEBHOOK_SECRET)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    logger.info('📥 Webhook Kiwify recebido', { event: event.event, order_id: event.order_id });

    // 2. Processar evento
    switch (event.event) {
      case 'order.approved':
        await handleOrderApproved(event);
        break;

      case 'subscription.canceled':
        await handleSubscriptionCanceled(event);
        break;

      case 'subscription.renewed':
        await handleSubscriptionRenewed(event);
        break;

      case 'order.refunded':
        await handleOrderRefunded(event);
        break;

      default:
        logger.warn('Evento desconhecido', { event: event.event });
    }

    // 3. Retornar 200 OK para Kiwify
    res.status(200).json({ success: true });

  } catch (error) {
    logger.error('❌ Erro ao processar webhook Kiwify', { error: error.message });
    res.status(500).json({ error: 'Internal error' });
  }
});

// ===================================
// HANDLERS
// ===================================

async function handleOrderApproved(event) {
  const { customer, order_id, subscription_id } = event;

  // Buscar usuário por email
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', customer.email)
    .single();

  if (error || !user) {
    logger.warn('⚠️ Usuário não encontrado para webhook', { email: customer.email });

    // OPCIONAL: Criar usuário automaticamente se não existe
    // Útil se cliente comprar ANTES de fazer trial
    await supabase.from('users').insert({
      email: customer.email,
      name: customer.name,
      plan: 'premium',
      subscription_status: 'active',
      kiwify_customer_id: order_id,
      kiwify_subscription_id: subscription_id,
      subscription_started_at: new Date(),
      created_at: new Date()
    });

    logger.info('✅ Novo usuário criado via webhook', { email: customer.email });
    return;
  }

  // Atualizar usuário existente para Premium
  await supabase
    .from('users')
    .update({
      plan: 'premium',
      subscription_status: 'active',
      kiwify_customer_id: order_id,
      kiwify_subscription_id: subscription_id,
      subscription_started_at: new Date(),
      trial_ends_at: null // Limpar trial
    })
    .eq('id', user.id);

  logger.info('✅ Usuário atualizado para Premium', {
    userId: user.id,
    email: user.email
  });

  // TODO: Enviar email de boas-vindas Premium
}

async function handleSubscriptionCanceled(event) {
  const { subscription_id } = event;

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('kiwify_subscription_id', subscription_id)
    .single();

  if (!user) {
    logger.warn('⚠️ Usuário não encontrado para cancelamento', { subscription_id });
    return;
  }

  // Downgrade para Free
  await supabase
    .from('users')
    .update({
      plan: 'free',
      subscription_status: 'canceled',
      subscription_ended_at: new Date()
    })
    .eq('id', user.id);

  logger.info('✅ Assinatura cancelada, downgrade para Free', { userId: user.id });

  // TODO: Enviar email de cancelamento
}

async function handleSubscriptionRenewed(event) {
  const { subscription_id } = event;

  await supabase
    .from('users')
    .update({
      subscription_status: 'active',
      subscription_next_billing: new Date(event.next_billing_date)
    })
    .eq('kiwify_subscription_id', subscription_id);

  logger.info('✅ Assinatura renovada', { subscription_id });
}

async function handleOrderRefunded(event) {
  // Mesma lógica de cancelamento
  await handleSubscriptionCanceled(event);
  logger.info('✅ Reembolso processado', { order_id: event.order_id });
}
```

---

### 4️⃣ Schema Supabase (Atualizado)

```sql
-- Adicionar colunas Kiwify à tabela users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS kiwify_customer_id TEXT,
ADD COLUMN IF NOT EXISTS kiwify_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_ended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_next_billing TIMESTAMP WITH TIME ZONE;

-- Índice para busca rápida por subscription_id
CREATE INDEX IF NOT EXISTS idx_users_kiwify_subscription
ON users(kiwify_subscription_id);

-- Índice para busca por customer_id
CREATE INDEX IF NOT EXISTS idx_users_kiwify_customer
ON users(kiwify_customer_id);

-- Comentários
COMMENT ON COLUMN users.kiwify_customer_id IS 'ID do pedido Kiwify (order_id)';
COMMENT ON COLUMN users.kiwify_subscription_id IS 'ID da assinatura recorrente Kiwify';
COMMENT ON COLUMN users.subscription_started_at IS 'Data de início da assinatura Premium';
COMMENT ON COLUMN users.subscription_ended_at IS 'Data de cancelamento da assinatura';
```

---

### 5️⃣ Página Institucional (index.html)

**Novo propósito:** Página "Sobre o ScopsyLab"

**Conteúdo minimalista:**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>ScopsyLab - Treinamento Clínico com IA</title>
  <meta name="description" content="Plataforma de treinamento clínico para psicólogos TCC, ACT e DBT. Casos simulados, feedback de IA e gamificação.">
</head>
<body>

  <!-- HEADER -->
  <header>
    <img src="logo.png" alt="ScopsyLab">
    <nav>
      <a href="#sobre">Sobre</a>
      <a href="#modulos">Módulos</a>
      <a href="https://scopsy.flexifunnels.com.br">Ver Planos</a>
      <a href="/login.html" class="btn-login">Entrar</a>
    </nav>
  </header>

  <!-- HERO -->
  <section class="hero">
    <h1>Transforme-se em Expert Clínico com IA</h1>
    <p>Treine seu olhar diagnóstico com casos simulados e feedback formativo</p>
    <a href="https://scopsy.flexifunnels.com.br" class="cta-button">
      Começar 7 dias grátis
    </a>
  </section>

  <!-- SOBRE -->
  <section id="sobre">
    <h2>Nossa Missão</h2>
    <p>
      O ScopsyLab treina psicólogos para desenvolverem olhar clínico expert
      através de casos simulados realistas com feedback formativo baseado em IA.
    </p>
  </section>

  <!-- MÓDULOS -->
  <section id="modulos">
    <h2>3 Módulos de Treino</h2>

    <div class="module">
      <h3>🎯 Desafios Clínicos</h3>
      <p>Micro-momentos críticos que exigem decisão imediata</p>
    </div>

    <div class="module">
      <h3>🔍 Radar Diagnóstico</h3>
      <p>Treino diagnóstico baseado em DSM-5-TR</p>
    </div>

    <div class="module">
      <h3>🧩 Conceituação Cognitiva</h3>
      <p>Formulação de caso em TCC com feedback estruturado</p>
    </div>

    <div class="module premium-badge">
      <h3>🚀 Jornada Clínica (Premium)</h3>
      <p>Acompanhamento longitudinal de 12 sessões</p>
    </div>
  </section>

  <!-- PARA QUEM É -->
  <section>
    <h2>Para Quem É</h2>
    <ul>
      <li>✅ Psicólogos TCC, ACT e DBT</li>
      <li>✅ Estudantes de Psicologia</li>
      <li>✅ Recém-formados</li>
      <li>✅ Profissionais que querem especialização</li>
    </ul>
  </section>

  <!-- CTA FINAL -->
  <section class="cta-section">
    <h2>Comece Hoje Mesmo</h2>
    <p>7 dias grátis, depois R$ 47/mês</p>
    <a href="https://scopsy.flexifunnels.com.br" class="cta-button">
      Iniciar Trial Gratuito
    </a>
  </section>

  <!-- FOOTER -->
  <footer>
    <p>&copy; 2024 ScopsyLab. Todos os direitos reservados.</p>
    <p>suporte@scopsy.com.br</p>
  </footer>

</body>
</html>
```

---

## 🔐 Segurança do Webhook

### Validação de Assinatura Kiwify

```javascript
const crypto = require('crypto');

function validateKiwifySignature(payload, signature, secret) {
  // Kiwify envia hash SHA256 no header X-Kiwify-Signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return `sha256=${expectedSignature}` === signature;
}
```

**Como funciona:**
1. Kiwify gera hash do payload com seu secret
2. Envia hash no header `X-Kiwify-Signature`
3. Backend recalcula hash com mesmo secret
4. Compara → se igual, requisição é autêntica

---

## 🛠️ Checklist de Implementação

### Fase 1: Kiwify Setup (1 dia)

- [ ] Criar conta Kiwify (se não tem)
- [ ] Criar produto "ScopsyLab Premium" (R$ 47/mês, recorrente)
- [ ] Configurar parcelamento (até 12x sem juros)
- [ ] Ativar Pix, Cartão e Boleto
- [ ] Obter ID do produto: `scopsy_premium`
- [ ] Configurar webhook URL: `https://scopsy.com.br/api/webhooks/kiwify`
- [ ] Obter Webhook Secret Key
- [ ] Testar checkout com cartão de teste Kiwify

### Fase 2: Backend Webhook (1 dia)

- [ ] Criar `src/routes/webhooks.js`
- [ ] Implementar validação de assinatura
- [ ] Handler `order.approved` (ativar Premium)
- [ ] Handler `subscription.canceled` (downgrade Free)
- [ ] Handler `subscription.renewed` (manter ativo)
- [ ] Handler `order.refunded` (downgrade Free)
- [ ] Adicionar colunas Kiwify no Supabase (SQL)
- [ ] Testar com Postman (simular webhook)
- [ ] Logs estruturados (Winston)

### Fase 3: FlexiFunnels Landing (2 dias)

- [ ] Acessar FlexiFunnels Tier 3
- [ ] Criar funil "ScopsyLab Launch"
- [ ] Página Hero + Problema + Solução
- [ ] Seção "Como Funciona"
- [ ] Seção "Módulos Detalhados"
- [ ] Seção "Plano & Preço" (R$ 47/mês)
- [ ] Prova Social (depoimentos)
- [ ] FAQ
- [ ] CTA Final
- [ ] Botões → `https://scopsy.com.br/signup`
- [ ] Testar responsivo mobile

### Fase 4: Página Institucional (1 dia)

- [ ] Transformar `index.html` em página "Sobre"
- [ ] Header com Logo + Nav
- [ ] Hero institucional
- [ ] Seção "Nossa Missão"
- [ ] Seção "Módulos" (cards)
- [ ] Seção "Para Quem É"
- [ ] CTA → FlexiFunnels
- [ ] Footer com contato
- [ ] Responsivo mobile

### Fase 5: Lógica Trial → Premium (1 dia)

- [ ] Middleware `checkPlan.js` já valida trial expirado
- [ ] Criar modal "Trial Expirado" no dashboard
- [ ] Botão "Fazer Upgrade" → Kiwify checkout
- [ ] Passar email do usuário via query: `?email=usuario@email.com`
- [ ] Banner no dashboard: "X dias restantes de trial"
- [ ] Testar fluxo completo Trial → Premium

### Fase 6: Testes End-to-End (1 dia)

- [ ] Fluxo 1: Landing → Signup → Trial → Upgrade → Premium
- [ ] Fluxo 2: Trial expira → Bloqueia → Upgrade → Desbloqueia
- [ ] Fluxo 3: Premium → Cancela → Downgrade Free
- [ ] Testar webhook `order.approved`
- [ ] Testar webhook `subscription.canceled`
- [ ] Verificar logs do Winston
- [ ] Testar em mobile (Chrome DevTools)

### Fase 7: Deploy Produção (1 dia)

- [ ] Remover variáveis Stripe do `.env.production`
- [ ] Adicionar variáveis Kiwify
- [ ] Commit + Push para GitHub
- [ ] Deploy no VPS (via SSH)
- [ ] Configurar webhook URL pública
- [ ] Testar webhook em produção (Kiwify → VPS)
- [ ] Monitorar logs: `pm2 logs scopsy-backend`

---

## 📊 Variáveis de Ambiente

### .env.production (atualizado)

```bash
# Environment
NODE_ENV=production
PORT=3000

# ❌ REMOVER (Stripe não usado no MVP)
# STRIPE_SECRET_KEY=...
# STRIPE_PUBLISHABLE_KEY=...

# ✅ KIWIFY
KIWIFY_PRODUCT_ID=scopsy_premium
KIWIFY_WEBHOOK_SECRET=seu_secret_key_aqui
KIWIFY_CHECKOUT_URL=https://kiwify.app/scopsy_premium

# FLEXIFUNNELS
FLEXIFUNNELS_LANDING_URL=https://scopsy.flexifunnels.com.br

# OpenAI
OPENAI_API_KEY=sk-proj-SUA_CHAVE_DE_PRODUCAO

# JWT
JWT_SECRET=E20tTFI7Jn/v26/TEOZYsmrQGh1kJhCBXj3h0YF8YMyHpp5It1fKo2vLX3vMb0oiPaa/fYmwdmyfoV7HNWxLvQ==

# Supabase
SUPABASE_URL=https://vhwpohwklbguizaixitv.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Frontend
FRONTEND_URL=https://scopsy.com.br

# Assistants
CASE_ID=asst_6nJqJh4VtRlhTkfdsgG4p3pp
ORCHESTRATOR_ID=asst_n4KRyVMnbDGE0bQrJAyJspYw
DIAGNOSTIC_ID=asst_Eo9sQwjkMv7Hjsi04Saa8zOs
JOURNEY_ID=asst_ydS6z2mQO82DtdBN4B1HSHP3
GENERATOR_ID=asst_rG9kO0tUDTmSa1xzMnIEhRmU
```

---

## 🎯 Métricas de Sucesso MVP

### Objetivo Mês 1 (Validação)
- 🎯 **50 visitas** na landing
- 🎯 **20 trials** iniciados (40% conversão)
- 🎯 **6 upgrades** para Premium (30% conversão trial → pago)
- 💰 **MRR: R$ 282** (6 × R$ 47)

**Break-even:** R$ 150/mês (custos VPS + OpenAI)
→ Precisa de **4 clientes Premium** para cobrir custos

### Objetivo Mês 3 (Tração)
- 🎯 200 visitas/mês
- 🎯 80 trials
- 🎯 40 Premium (50% conversão)
- 💰 **MRR: R$ 1.880**

### Objetivo Mês 6 (Crescimento)
- 🎯 500 visitas/mês
- 🎯 200 trials
- 🎯 120 Premium (60% conversão)
- 💰 **MRR: R$ 5.640**

---

## 🚀 Estratégia de Lançamento

### Semana 1-2: Soft Launch
- ✅ Testar com 5-10 beta testers (psicólogos conhecidos)
- ✅ Coletar feedback e ajustar
- ✅ Pedir depoimentos para landing page

### Semana 3-4: Lançamento Público
- 📢 Post no Instagram (stories + feed)
- 📢 Grupos de psicologia (Facebook, WhatsApp)
- 📢 Email para contatos profissionais
- 📢 Post no LinkedIn

### Mês 2: Tráfego Pago (se MRR > R$ 500)
- 💰 Meta Ads (R$ 10/dia)
- 🎯 Público: Psicólogos 25-45 anos, TCC
- 📊 Objetivo: Conversão de trial

---

## 📝 Notas Finais

### Por que R$ 47/mês é ideal:

✅ **Psicológico:** Abaixo de R$ 50 (não parece caro)
✅ **Parcelável:** 12x de R$ 3,91 (acessível)
✅ **Competitivo:** Livros custam R$ 80-120
✅ **Viável:** 4 clientes = break-even

### Limitações Kiwify (conhecer):

⚠️ Taxa: ~6,5% + R$ 0,40 (vs Stripe ~3%)
⚠️ Checkout fora do seu domínio
⚠️ Menos controle sobre UX

**MAS:** Para MVP vale a pena! Depois migra para Stripe com CNPJ.

---

**Próximos Passos Imediatos:**

1. ✅ Criar conta Kiwify
2. ✅ Configurar produto Premium (R$ 47/mês)
3. ✅ Obter Webhook Secret
4. ✅ Implementar webhook handler
5. ✅ Criar landing no FlexiFunnels

**Tempo estimado:** 5-7 dias de trabalho

---

**Última atualização:** 19/12/2024
**Versão:** 1.0 - MVP Simplificado
**Autor:** Claude Code + Ailton
