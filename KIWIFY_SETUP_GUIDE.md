# GUIA COMPLETO: Configuracao Kiwify para Scopsy

**Data:** 19/12/2024
**Objetivo:** Implementar sistema de pagamentos recorrentes usando Kiwify
**Tempo estimado:** 2-3 horas

---

## INDICE

1. [Cadastro e Configuracao Kiwify](#1-cadastro-kiwify)
2. [Criar Produto Premium](#2-criar-produto)
3. [Configurar Webhooks](#3-configurar-webhooks)
4. [Atualizar Variaveis de Ambiente](#4-variaveis-ambiente)
5. [Executar Migration SQL](#5-migration-sql)
6. [Configurar Link de Checkout](#6-configurar-checkout)
7. [Testar Integracao](#7-testar)
8. [Monitoramento](#8-monitoramento)

---

## PASSO 1: Cadastro Kiwify

### 1.1 Criar Conta

1. **Acesse:** https://kiwify.com.br
2. **Clique em:** "Criar conta gratis"
3. **Preencha:**
   - Nome completo
   - Email (use um email que voce acessa frequentemente)
   - Senha forte (minimo 8 caracteres)
   - Telefone (WhatsApp)
4. **Confirme** o email (verifique caixa de entrada e spam)

### 1.2 Configurar Dados Bancarios

**MUITO IMPORTANTE:** Sem isso voce nao recebe pagamentos!

1. No painel Kiwify, va em **"Configuracoes"** -> **"Dados Bancarios"** ou **"Recebimento"**
2. Escolha: **Pessoa Fisica (CPF)**
3. Preencha:
   ```
   CPF: _______________
   Nome completo: _____________________
   Banco: _____________
   Agencia: ___________
   Conta: _____________
   Tipo: Corrente ou Poupanca
   ```
4. **Salve** e aguarde validacao (pode demorar ate 24h uteis)

---

## PASSO 2: Criar Produto "ScopsyLab Premium"

### 2.1 Iniciar Criacao

1. No painel Kiwify, clique em **"Produtos"** -> **"Criar Produto"**
2. Escolha o tipo: **"Assinatura/Recorrencia"** (nao escolha "Produto unico"!)

### 2.2 Preencher Detalhes

| Campo | Valor | Observacoes |
|-------|-------|-------------|
| **Nome do Produto** | `ScopsyLab Premium` | Aparece no checkout |
| **Descricao** | `Acesso ilimitado a plataforma de treinamento clinico com IA para psicologos TCC/ACT/DBT` | Ate 200 caracteres |
| **Preco** | `R$ 47,00` | Valor mensal |
| **Recorrencia** | `Mensal` | Todo mes no mesmo dia |
| **Trial gratuito** | `7 dias` | ATIVAR! |

### 2.3 Configurar Pagamentos

**Metodos (ative TODOS):**
- **Pix** (conversao alta! Pagamento instantaneo)
- **Cartao de Credito**
  - Parcelamento: **Ate 12x sem juros** (Importante para conversao!)
  - Bandeiras: Visa, Master, Elo, Amex, Hipercard
- **Boleto** (opcional, mas pode ajudar)

### 2.4 Configurar Acesso Pos-Compra

1. Na secao **"Area de Membros"** ou **"Produto Digital"**, escolha:
   - **"Redirecionar para URL externa"** (recomendado)

2. **URL de redirecionamento:**
   ```
   https://scopsy.com.br/dashboard?welcome=premium
   ```

3. **Email de boas-vindas automatico:**
   ```
   Assunto: Bem-vindo ao ScopsyLab Premium!

   Ola {{customer_name}},

   Seu acesso Premium ja esta ATIVO!

   Comece agora mesmo:
   >> https://scopsy.com.br/dashboard

   O que voce desbloqueia:
   - Desafios Clinicos ilimitados
   - Radar Diagnostico completo
   - Conceituacao Cognitiva TCC
   - Jornada Clinica (12 sessoes)
   - Sistema de Gamificacao
   - Certificado de conclusao

   Duvidas? Responda este email!

   Equipe ScopsyLab
   ```

### 2.5 Salvar e Obter Credenciais

1. **Clique em "Salvar Produto"**
2. Apos salvar, voce vera:

**ANOTE AQUI:**
```
Product ID: _________________________
Link de Checkout: https://pay.kiwify.com.br/_____________
```

---

## PASSO 3: Configurar Webhooks

### 3.1 Acessar Webhooks

1. No produto criado, procure por:
   - **"Configuracoes Avancadas"**, ou
   - **"Webhooks"**, ou
   - **"Integracoes"** -> **"Webhooks"**
2. Clique em **"Adicionar Webhook"** ou **"Configurar Notificacao"**

### 3.2 Configurar URL

**URL do Webhook:**
```
https://scopsy.com.br/api/webhooks/kiwify
```

**Se ainda nao tiver dominio em producao:**
```
http://SEU_IP_VPS:3000/api/webhooks/kiwify
```

**ATENCAO:** A Kiwify pode exigir HTTPS! Use ngrok temporariamente:
```bash
# Instalar ngrok (https://ngrok.com/)
ngrok http 3000

# Copiar URL HTTPS gerada (ex: https://abc123.ngrok.io)
# Usar: https://abc123.ngrok.io/api/webhooks/kiwify
```

### 3.3 Selecionar Eventos

**Marque TODOS esses eventos:**
- `order.approved` ou `order_approved` - Pagamento aprovado
- `subscription.canceled` ou `subscription_canceled` - Cancelamento
- `subscription.renewed` ou `subscription_renewed` - Renovacao mensal
- `order.refunded` ou `order_refunded` - Reembolso

### 3.4 Obter Webhook Secret

1. Apos configurar, a Kiwify gera um **Webhook Secret** (chave secreta)
2. Formato: `whsec_XXXXXXXXXXXXXXXXXXXX`
3. **Copie e guarde com seguranca!**

**ANOTE AQUI:**
```
Webhook Secret: whsec_________________________________
```

---

## PASSO 4: Atualizar Variaveis de Ambiente

### 4.1 Editar `.env.local`

Abra o arquivo `D:\projetos.vscode\SCOPSY-CLAUDE-CODE\.env.local` e atualize:

```bash
# ==========================================
# KIWIFY (Pagamentos)
# ==========================================
KIWIFY_WEBHOOK_SECRET=whsec_COLE_SEU_SECRET_AQUI
KIWIFY_PRODUCT_ID=COLE_SEU_PRODUCT_ID_AQUI
KIWIFY_CHECKOUT_URL=https://pay.kiwify.com.br/COLE_SEU_LINK_AQUI

# ==========================================
# FLEXIFUNNELS (Landing Page)
# ==========================================
FLEXIFUNNELS_LANDING_URL=https://scopsy.flexifunnels.com.br
```

### 4.2 Editar `frontend/upgrade.html`

Abra o arquivo `frontend/upgrade.html` e localize a linha:

```javascript
const KIWIFY_CHECKOUT_URL = 'https://pay.kiwify.com.br/SEU_LINK_AQUI';
```

**Substitua por:**
```javascript
const KIWIFY_CHECKOUT_URL = 'https://pay.kiwify.com.br/SEU_LINK_REAL';
```

---

## PASSO 5: Executar Migration SQL

### 5.1 Acessar Supabase

1. Va para https://supabase.com/dashboard
2. Selecione seu projeto **Scopsy**
3. No menu lateral, clique em **"SQL Editor"**

### 5.2 Executar Script

1. Clique em **"New Query"**
2. Abra o arquivo `sql-scripts/08-kiwify-integration.sql`
3. **Copie TODO o conteudo** do arquivo
4. **Cole** no SQL Editor do Supabase
5. Clique em **"Run"** (ou `Ctrl+Enter`)

### 5.3 Verificar Sucesso

Voce deve ver:
```
--- Migracao Kiwify concluida com sucesso! ---
```

---

## PASSO 6: Testar Integracao

### 6.1 Testar Webhook Localmente

**Opcao A: Usar ngrok (recomendado para testes)**
```bash
# Terminal 1: Iniciar backend
cd D:\projetos.vscode\SCOPSY-CLAUDE-CODE
npm run dev

# Terminal 2: Iniciar ngrok
ngrok http 3000

# Copiar URL HTTPS gerada
# Atualizar webhook na Kiwify com essa URL
```

**Opcao B: Testar com Postman**
```bash
POST http://localhost:3000/api/webhooks/kiwify
Headers:
  Content-Type: application/json
  X-Kiwify-Signature: sha256=test123

Body (JSON):
{
  "event": "order.approved",
  "order_id": "TEST_ORDER_123",
  "customer": {
    "email": "teste@email.com",
    "name": "Teste Usuario"
  },
  "subscription_id": "SUB_TEST_123",
  "value": 47.00,
  "status": "approved"
}
```

### 6.2 Verificar Logs

Abra os logs do backend:
```bash
# Ver logs em tempo real
npm run dev

# Ou verificar arquivo de log
type logs\scopsy.log | findstr "WEBHOOK"
```

### 6.3 Verificar Supabase

1. Va para Supabase -> **Table Editor** -> **users**
2. Procure o usuario teste
3. Verifique se campos foram atualizados:
   - `plan` = `'premium'`
   - `subscription_status` = `'active'`
   - `kiwify_customer_id` = `'TEST_ORDER_123'`
   - `kiwify_subscription_id` = `'SUB_TEST_123'`

### 6.4 Teste Real com Cartao de Teste

**Kiwify fornece cartoes de teste:**
```
Numero: 4111 1111 1111 1111
CVV: 123
Validade: qualquer data futura (ex: 12/2026)
Nome: APPROVED (para aprovar) ou DECLINED (para recusar)
```

1. Acesse seu link de checkout: `https://pay.kiwify.com.br/SEU_LINK`
2. Preencha com dados de teste
3. Use cartao `4111 1111 1111 1111`
4. Nome: **APPROVED**
5. Finalize compra
6. Verifique webhook recebido nos logs

---

## PASSO 7: Monitoramento

### 7.1 Logs do Backend

**Verificar webhooks recebidos:**
```bash
# Logs em tempo real (Windows)
type logs\scopsy.log | findstr "WEBHOOK"

# Ver erros apenas
type logs\scopsy.log | findstr "ERROR" | findstr "WEBHOOK"
```

### 7.2 Health Check do Webhook

**Teste se endpoint esta funcionando:**
```bash
curl http://localhost:3000/api/webhooks/kiwify/health
```

**Resposta esperada:**
```json
{
  "status": "OK",
  "webhook": "kiwify",
  "timestamp": "2024-12-19T...",
  "env": {
    "hasWebhookSecret": true,
    "hasProductId": true
  }
}
```

---

## TROUBLESHOOTING

### Problema: Webhook nao esta sendo recebido

**Checklist:**
- [ ] URL do webhook esta correta na Kiwify?
- [ ] Backend esta rodando? (`npm run dev`)
- [ ] Porta 3000 esta acessivel?
- [ ] Se usar ngrok, URL HTTPS esta atualizada?
- [ ] Firewall nao esta bloqueando?

**Debug:**
```bash
# Verificar se servidor esta ouvindo
curl http://localhost:3000/health

# Verificar logs
type logs\scopsy.log
```

### Problema: Assinatura invalida (401)

**Possiveis causas:**
- Webhook secret esta errado no `.env.local`
- Kiwify mudou o secret (gere novamente)
- Corpo da requisicao foi modificado

**Solucao:**
1. Va para Kiwify -> Webhooks
2. Clique em "Regerar Secret"
3. Atualize `.env.local`
4. Reinicie backend: `npm run dev`

### Problema: Usuario nao foi atualizado

**Verificar:**
```sql
-- No Supabase SQL Editor
SELECT * FROM users WHERE email = 'email@teste.com';
```

**Verificar logs:**
```bash
type logs\scopsy.log | findstr "email@teste.com"
```

---

## CHECKLIST FINAL

### Antes de ir para producao:

- [ ] Conta Kiwify criada e verificada
- [ ] Dados bancarios configurados e aprovados
- [ ] Produto "ScopsyLab Premium" criado (R$ 47/mes, trial 7 dias)
- [ ] Webhooks configurados com eventos corretos
- [ ] Webhook Secret obtido e salvo em `.env.local`
- [ ] Product ID e Checkout URL salvos em `.env.local`
- [ ] Migration SQL executada no Supabase
- [ ] Link de checkout atualizado em `frontend/upgrade.html`
- [ ] Testado webhook com Postman ou cartao de teste
- [ ] Verificado que usuario e atualizado para Premium
- [ ] Logs estruturados funcionando (Winston)
- [ ] Health check do webhook respondendo

---

## PROXIMOS PASSOS

1. Configurar FlexiFunnels (landing page)
2. Criar depoimentos/prova social
3. Planejar estrategia de lancamento
4. Definir budget para trafego pago

---

## RECURSOS UTEIS

- **Documentacao Kiwify:** https://docs.kiwify.com.br/
- **Suporte Kiwify:** suporte@kiwify.com.br
- **Painel Kiwify:** https://dashboard.kiwify.com.br/
- **Tester de Webhooks:** https://webhook.site/ (para debug)

---

**Ultima atualizacao:** 19/12/2024
**Autor:** Claude Code + Ailton
**Versao:** 1.0
