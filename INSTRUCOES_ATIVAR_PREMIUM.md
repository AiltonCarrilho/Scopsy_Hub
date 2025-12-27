# Como Ativar Premium Manualmente - Scopsy

## Usuário
**Email:** ailtoncarrilhopsi@gmail.com

---

## Opção 1: Via Interface do Supabase (MAIS FÁCIL)

### Passo a Passo:

1. **Acessar Supabase**
   - Ir para: https://supabase.com/dashboard
   - Fazer login

2. **Abrir Projeto Scopsy**
   - Selecionar o projeto correto

3. **Table Editor**
   - Menu lateral → "Table Editor"
   - Selecionar tabela: **users**

4. **Encontrar Usuário**
   - Usar o filtro ou buscar por email: `ailtoncarrilhopsi@gmail.com`
   - Clicar na linha do usuário

5. **Editar Campos**
   - Clicar no ícone de editar (lápis)
   - Alterar os seguintes campos:
     - `plan`: mudar para `premium`
     - `subscription_status`: mudar para `active`
     - `trial_ends_at`: deixar vazio (NULL)
   - Clicar em "Save"

6. **Verificar**
   - Conferir se os campos foram atualizados
   - Fechar o editor

7. **No Site**
   - Fazer **logout** do Scopsy
   - Fazer **login** novamente
   - Verificar se aparece como Premium

---

## Opção 2: Via SQL Editor (ALTERNATIVA)

### Passo a Passo:

1. **Acessar Supabase**
   - https://supabase.com/dashboard

2. **SQL Editor**
   - Menu lateral → "SQL Editor"
   - Clicar em "New query"

3. **Copiar e Colar o SQL**
   ```sql
   -- Verificar usuário atual
   SELECT
     id,
     email,
     name,
     plan,
     subscription_status,
     trial_ends_at
   FROM users
   WHERE email = 'ailtoncarrilhopsi@gmail.com';

   -- Atualizar para Premium
   UPDATE users
   SET
     plan = 'premium',
     subscription_status = 'active',
     subscription_started_at = NOW(),
     trial_ends_at = NULL,
     updated_at = NOW()
   WHERE email = 'ailtoncarrilhopsi@gmail.com';

   -- Verificar atualização
   SELECT
     id,
     email,
     name,
     plan,
     subscription_status,
     subscription_started_at
   FROM users
   WHERE email = 'ailtoncarrilhopsi@gmail.com';
   ```

4. **Executar**
   - Clicar em "Run" ou pressionar Ctrl+Enter
   - Verificar os resultados

5. **No Site**
   - Fazer logout e login novamente

---

## Verificar se Funcionou

Após atualizar, verifique:

1. ✅ Fazer logout do Scopsy
2. ✅ Fazer login novamente
3. ✅ Verificar se o banner de trial desapareceu
4. ✅ Verificar se tem acesso a recursos premium
5. ✅ Dashboard deve mostrar "Plano: Premium"

---

## Por Que Isso Aconteceu?

**Possíveis causas:**

1. **Webhook não configurado** - Kiwify não enviou notificação
2. **Webhook URL incorreta** - Backend não recebeu
3. **Backend offline** - Render estava reiniciando
4. **Delay do Kiwify** - Pode levar alguns minutos

**Solução permanente:**

Configure o webhook no Kiwify:
- URL: `https://scopsy-hub.onrender.com/api/webhooks/kiwify`
- Eventos: Todos (ou pelo menos `order.approved`)

---

## Precisa de Ajuda?

Se tiver dúvidas:
1. Tire print da tela do Supabase
2. Me envie para eu te ajudar
3. Ou me chame no próximo passo
