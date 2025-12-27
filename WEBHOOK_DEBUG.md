# Debug do Webhook Kiwify - Scopsy

## Problema Reportado
Usuário fez compra mas o premium não foi ativado.

## Checklist de Verificação

### 1. Webhook Configurado no Kiwify? ✓ / ✗

**URL que deve estar configurada:**
```
https://scopsy-hub.onrender.com/api/webhooks/kiwify
```

**Como verificar:**
1. Login no Kiwify
2. Ir em Configurações → Webhooks
3. Verificar se a URL acima está cadastrada
4. Verificar se está ATIVO

### 2. Backend Rodando no Render? ✓ / ✗

**Como verificar:**
1. Acessar: https://scopsy-hub.onrender.com/api/health
2. Deve retornar: `{"status":"ok"}`
3. Se retornar 404 ou erro: backend não está rodando

### 3. Email Usado na Compra

**IMPORTANTE:** O email usado na compra DEVE ser o MESMO do trial.

- Email do trial: `______________`
- Email da compra: `______________`
- São iguais? ✓ / ✗

### 4. Logs do Render

**Como acessar:**
1. Login no Render (https://dashboard.render.com)
2. Selecionar serviço `scopsy-hub`
3. Clicar em "Logs"
4. Procurar por:
   - `[WEBHOOK]` - eventos recebidos
   - `order.approved` - compra aprovada
   - Erros relacionados

### 5. Testar Webhook Manualmente

**Opção A: Via script Node.js**
```bash
cd D:\projetos.vscode\SCOPSY-CLAUDE-CODE
node test-webhook-manual.js
```

**Opção B: Via curl**
```bash
curl -X POST https://scopsy-hub.onrender.com/api/webhooks/kiwify \
  -H "Content-Type: application/json" \
  -d '{
    "event": "order.approved",
    "order_id": "TEST_123",
    "customer": {
      "email": "SEU_EMAIL@example.com",
      "name": "Seu Nome"
    },
    "subscription_id": "SUB_123"
  }'
```

### 6. Verificar Banco de Dados (Supabase)

**Verificar se usuário existe:**
1. Login no Supabase
2. Ir em Table Editor → `users`
3. Procurar pelo email usado na compra
4. Verificar campo `plan`:
   - Se for `free` ou `trial`: webhook não processou
   - Se for `premium`: webhook processou ✓

### 7. Forçar Upgrade Manual (Solução Temporária)

Se o webhook falhou, você pode atualizar manualmente no Supabase:

**SQL:**
```sql
UPDATE users
SET
  plan = 'premium',
  subscription_status = 'active',
  subscription_started_at = NOW(),
  trial_ends_at = NULL,
  updated_at = NOW()
WHERE email = 'EMAIL_DO_USUARIO@example.com';
```

## Possíveis Causas do Problema

### Causa 1: Webhook não configurado no Kiwify
**Solução:** Configurar URL do webhook nas configurações do Kiwify

### Causa 2: Backend offline no Render
**Solução:** Verificar se o serviço está rodando e reiniciar se necessário

### Causa 3: Email diferente entre trial e compra
**Solução:**
- Opção A: Atualizar manualmente no banco
- Opção B: Criar lógica para linkar compras por CPF ou outro identificador

### Causa 4: Erro no processamento do webhook
**Solução:** Verificar logs do Render para identificar o erro específico

### Causa 5: Delay no webhook
**Solução:** Aguardar alguns minutos e recarregar a página (fazer logout/login)

## Próximos Passos

1. **Verificar logs do Render** - Ver se webhook chegou
2. **Confirmar email** - Se é o mesmo
3. **Teste manual** - Forçar ativação via script
4. **Update manual** - Se necessário, atualizar via SQL

## Código do Webhook

Localização: `src/routes/webhooks.js`

Função responsável: `handleOrderApproved(event)`

Fluxo:
1. Recebe evento do Kiwify
2. Extrai email do cliente
3. Busca usuário no banco
4. Se não existe: cria novo com plan='premium'
5. Se existe: atualiza plan para 'premium'
6. Envia email de boas-vindas

## Contato Suporte

Se o problema persistir:
1. Enviar logs do Render
2. Informar email usado
3. Informar horário da compra
4. Enviar screenshot do erro (se houver)
