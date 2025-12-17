# 🛠️ Scripts de Teste e Desenvolvimento

Scripts Node.js para facilitar testes do sistema de gamificação e gerenciamento de usuários.

## 📋 Pré-requisitos

Certifique-se de ter:
- Node.js 20+ instalado
- Arquivo `.env` ou `.env.local` configurado com:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`

## 🚀 Scripts Disponíveis

### 1. Criar Usuário de Teste Completo

Cria um usuário premium com cognits já configurados - **perfeito para testar!**

```bash
# Usa valores padrão (recomendado)
node scripts/create-test-user.js

# Customizar
node scripts/create-test-user.js <email> <cognits> <plan>
```

**Exemplos:**
```bash
# Usuário iniciante (Nível 1-2)
node scripts/create-test-user.js iniciante@scopsy.com 40 premium

# Usuário intermediário (Nível 4-5)
node scripts/create-test-user.js inter@scopsy.com 300 pro

# Usuário avançado (Nível 7-8)
node scripts/create-test-user.js avancado@scopsy.com 800 premium

# Usuário mestre (Nível 10+)
node scripts/create-test-user.js mestre@scopsy.com 1500 premium
```

**Credenciais Padrão:**
- Email: `teste-premium@scopsy.com`
- Senha: `Teste@123`
- Plano: `premium`
- Cognits: `150` (Nível 3: "Apontador de Sintomas")

---

### 2. Adicionar Cognits a Usuário Existente

Adiciona cognits manualmente a qualquer usuário para testar progressão.

```bash
node scripts/add-cognits.js <email> <cognits> [assistant_type]
```

**Exemplos:**
```bash
# Adicionar 50 cognits em Desafios Clínicos
node scripts/add-cognits.js teste@scopsy.com 50 case

# Adicionar 100 cognits em Radar Diagnóstico
node scripts/add-cognits.js teste@scopsy.com 100 diagnostic

# Adicionar 200 cognits (distribui automaticamente)
node scripts/add-cognits.js teste@scopsy.com 200
```

**Assistant Types:**
- `case` - Desafios Clínicos (+8 cognits/caso)
- `diagnostic` - Radar Diagnóstico (+5 cognits/caso)
- `journey` - Jornada Terapêutica (+25 cognits/sessão)
- `case_conceptualization` - Conceituação Cognitiva (+30 cognits/caso)

---

### 3. Alterar Plano de Usuário

Muda o plano de um usuário para testar interfaces Trial vs Premium.

```bash
node scripts/set-plan.js <email> <plan>
```

**Exemplos:**
```bash
# Tornar premium
node scripts/set-plan.js teste@scopsy.com premium

# Voltar para trial
node scripts/set-plan.js teste@scopsy.com free

# Plano PRO
node scripts/set-plan.js teste@scopsy.com pro
```

**Planos Disponíveis:**
- `free` - Trial (7 dias, 30 acessos)
- `basic` - R$ 29,90/mês (casos ilimitados)
- `pro` - R$ 69,90/mês (badges + certificados)
- `premium` - R$ 149,90/mês (supervisão + API)

---

## 🎮 Sistema de Níveis e Cognits

### Faixas de Progressão

| **Faixa** | **Cognits** | **Níveis** | **Títulos** |
|-----------|-------------|------------|-------------|
| Inicial | 0-150 | 1-3 | Estudante de Lente → Apontador de Sintomas |
| Intermediário | 151-500 | 4-6 | Decodificador → Construtor de Linha do Tempo |
| Avançado | 501-1200 | 7-9 | Lente Rápida → Terapeuta de Estratégia |
| Maestria | 1201+ | 10-12 | Arquiteto Cognitivo → Clínico de Alta Performance |

### Valores de Cognits por Módulo

Baseado na documentação de gamificação:

```
Radar Diagnóstico:       +5 cognits/caso
Desafios Clínicos:       +8 cognits/caso
Jornada Terapêutica:     +25 cognits/sessão
Conceituação Cognitiva:  +30 cognits/caso completo
```

---

## 🧪 Casos de Teste Comuns

### Testar Interface Trial
```bash
# Criar usuário trial
node scripts/create-test-user.js trial@scopsy.com 0 free

# Login: http://localhost:3000
# Deve mostrar: "30 Acessos Restantes" e "7 Dias Restantes"
```

### Testar Interface Premium
```bash
# Criar usuário premium com progresso
node scripts/create-test-user.js premium@scopsy.com 200 premium

# Login: http://localhost:3000/dashboard.html
# Deve mostrar: "200 Cognits" e "Desafios Concluídos"
```

### Testar Progressão de Níveis
```bash
# Nível 1 (iniciante)
node scripts/create-test-user.js nivel1@scopsy.com 30 premium

# Nível 5 (intermediário)
node scripts/create-test-user.js nivel5@scopsy.com 350 premium

# Nível 10 (mestre)
node scripts/create-test-user.js nivel10@scopsy.com 1500 premium
```

### Adicionar Cognits Progressivamente
```bash
# Criar usuário
node scripts/create-test-user.js progress@scopsy.com 0 premium

# Adicionar cognits gradualmente para ver mudanças
node scripts/add-cognits.js progress@scopsy.com 50   # Nível 2
node scripts/add-cognits.js progress@scopsy.com 60   # Nível 3
node scripts/add-cognits.js progress@scopsy.com 120  # Nível 4
```

---

## 🔍 Debugging

### Verificar Usuário no Supabase
```sql
-- Ver todos os usuários
SELECT id, email, plan, created_at FROM users;

-- Ver progresso de um usuário
SELECT * FROM user_progress WHERE user_id = 'USER_ID_HERE';
```

### Logs do Backend

Com o servidor rodando (`npm run dev`), observe os logs:

```
🐞 DEBUG USER DATA: { plan, created_at, cognits }
📤 RETORNO FINAL /api/progress/summary: { totalCognits, level, title }
```

---

## ⚠️ Troubleshooting

**Erro: "SUPABASE_URL e SUPABASE_ANON_KEY devem estar no .env"**
```bash
# Copie .env.local para .env
cp .env.local .env
```

**Erro: "Email já existe"**
```bash
# Use outro email ou delete o usuário existente no Supabase
# Ou use o script add-cognits.js para atualizar o existente
```

**Erro: "Usuário não encontrado"**
```bash
# Verifique se o email está correto
# Ou crie o usuário primeiro com create-test-user.js
```

---

## 📚 Referências

- **Documentação de Gamificação**: Ver `docs/GAMIFICACAO.md`
- **API Progress**: `GET /api/progress/summary`
- **Estrutura Database**: `docs/DATABASE_SCHEMA.md`

---

## 🎯 Próximos Passos

Após criar usuários de teste:

1. ✅ Login em `http://localhost:3000`
2. ✅ Acesse o Dashboard em `http://localhost:3000/dashboard.html`
3. ✅ Complete desafios em `http://localhost:3000/desafios.html`
4. ✅ Observe os cognits aumentando em tempo real
5. ✅ Veja mudanças de nível e títulos clínicos

**Bons testes! 🚀**
