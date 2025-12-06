# GUIA DE INTEGRAÇÃO - SCOPSY JORNADA CLÍNICA
## Como Integrar os Novos Arquivos ao Seu Projeto

---

## 📁 ARQUIVOS CRIADOS

```
src/
├── config/
│   └── casos/
│       ├── index.js          ← Registro central de casos
│       └── renata.js         ← Configuração da Renata
├── models/
│   └── pacienteState.js      ← Gerenciamento de estado
├── services/
│   ├── pacienteService.js    ← Integração com OpenAI
│   └── estadoStorage.js      ← Persistência (JSON)
└── routes/
    └── paciente.js           ← Endpoints da API

frontend/
└── jornada-clinica.html      ← Interface de chat

data/
└── estados/                  ← Pasta para armazenar estados (JSON)
```

---

## 🔧 PASSO 1: Copiar Arquivos

Copie os arquivos para seu projeto mantendo a estrutura de pastas.

```bash
# Se estiver usando o terminal
cp -r src/config/casos seu-projeto/src/config/
cp src/models/pacienteState.js seu-projeto/src/models/
cp src/services/pacienteService.js seu-projeto/src/services/
cp src/services/estadoStorage.js seu-projeto/src/services/
cp src/routes/paciente.js seu-projeto/src/routes/
cp frontend/jornada-clinica.html seu-projeto/frontend/
mkdir -p seu-projeto/data/estados
```

---

## 🔧 PASSO 2: Instalar Dependência OpenAI

Se ainda não tiver o SDK da OpenAI instalado:

```bash
npm install openai
```

---

## 🔧 PASSO 3: Configurar .env

Certifique-se de que seu arquivo `.env` ou `.env.local` tem:

```env
OPENAI_API_KEY=sk-sua-chave-aqui
```

---

## 🔧 PASSO 4: Integrar ao server.js

Abra seu arquivo `src/server.js` e adicione:

```javascript
// ============================================
// ADICIONE JUNTO COM OS OUTROS IMPORTS DE ROTAS
// ============================================

const pacienteRoutes = require('./routes/paciente');

// ============================================
// ADICIONE JUNTO COM OS OUTROS app.use()
// ============================================

app.use('/api/paciente', pacienteRoutes);
```

### Exemplo Completo (se seu server.js for parecido com isso):

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// Rotas existentes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const journeyRoutes = require('./routes/journey');
// ... outras rotas

// NOVA ROTA - Paciente (Jornada Clínica com IA)
const pacienteRoutes = require('./routes/paciente');

// Registrar rotas
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/journey', journeyRoutes);
// ... outras rotas

// NOVA ROTA - Registrar
app.use('/api/paciente', pacienteRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
```

---

## 🔧 PASSO 5: Testar

### 5.1 Iniciar o servidor

```bash
npm start
# ou
node src/server.js
```

### 5.2 Testar a API (via terminal)

```bash
# Listar casos disponíveis
curl http://localhost:3000/api/paciente/casos

# Deve retornar:
# {"sucesso":true,"quantidade":1,"casos":[{"id":"renata",...}]}
```

### 5.3 Acessar a interface

Abra no navegador:
```
http://localhost:3000/jornada-clinica.html?caso=renata
```

---

## 🔧 PASSO 6: Verificar Funcionamento

### Checklist:

- [ ] Página carrega sem erros no console
- [ ] Nome da Renata aparece no briefing
- [ ] Botão "Iniciar Sessão" está habilitado
- [ ] Ao clicar, sessão inicia
- [ ] Campo de texto é habilitado
- [ ] Ao enviar mensagem, aparece "Renata está refletindo..."
- [ ] Resposta da Renata aparece após alguns segundos
- [ ] Medidores na sidebar mostram valores

---

## 🐛 TROUBLESHOOTING

### Erro: "Cannot find module './config/casos'"

**Causa:** Estrutura de pastas incorreta.

**Solução:** Verifique se a pasta `src/config/casos/` existe e contém `index.js` e `renata.js`.

---

### Erro: "OPENAI_API_KEY não está configurada"

**Causa:** Variável de ambiente não encontrada.

**Solução:** 
1. Crie/edite o arquivo `.env` na raiz do projeto
2. Adicione: `OPENAI_API_KEY=sk-sua-chave`
3. Reinicie o servidor

---

### Erro: "Caso não encontrado: renata"

**Causa:** Arquivo de configuração não está sendo carregado.

**Solução:** Verifique se `src/config/casos/renata.js` exporta corretamente:
```javascript
module.exports = RENATA;
```

---

### Erro: "Assistant não configurado para o caso"

**Causa:** ID do Assistant não está no arquivo de configuração.

**Solução:** 
1. Abra `src/config/casos/renata.js`
2. Verifique se o `assistant.id` está correto:
```javascript
assistant: {
  id: 'asst_5Qu5AoYGaL2TpADYphlcmY3L',  // Seu ID aqui
  ...
}
```

---

### Resposta demora muito (mais de 30 segundos)

**Causa:** OpenAI pode estar lento ou timeout muito baixo.

**Solução:** 
1. Verifique o status da OpenAI: https://status.openai.com/
2. Aumente o timeout em `pacienteService.js` (linha do maxTentativas)

---

### Erro de CORS

**Causa:** Frontend e backend em portas diferentes.

**Solução:** Adicione ao server.js:
```javascript
const cors = require('cors');
app.use(cors());
```

---

## 📊 ESTRUTURA DAS RESPOSTAS DA API

### GET /api/paciente/casos
```json
{
  "sucesso": true,
  "quantidade": 1,
  "casos": [
    {
      "id": "renata",
      "nome": "Renata Moreira Lima",
      "idade": 34,
      "profissao": "Coordenadora administrativa",
      "resumo": "Burnout e autossacrifício...",
      "dificuldade": "intermediario",
      "abordagem": "TCC",
      "totalSessoes": 18
    }
  ]
}
```

### POST /api/paciente/iniciar
```json
{
  "sucesso": true,
  "estado": {
    "sessaoAtual": 1,
    "alianca": 4,
    "profundidade": 3,
    "defesas": 7
  },
  "threadId": "thread_abc123...",
  "caso": {
    "id": "renata",
    "nome": "Renata Moreira Lima"
  },
  "mensagemInicial": "Esta é a primeira sessão..."
}
```

### POST /api/paciente/mensagem
```json
{
  "sucesso": true,
  "resposta": "Oi, obrigada por perguntar...",
  "momentosDetectados": [
    {
      "id": "minimizacao",
      "nome": "A Minimização",
      "fase": "acolhida"
    }
  ],
  "estado": {
    "alianca": 4.5,
    "profundidade": 3.3,
    "defesas": 6.5
  }
}
```

---

## 🚀 PRÓXIMOS PASSOS APÓS INTEGRAÇÃO

1. **Testar várias interações** com a Renata
2. **Ajustar feedbacks** em `src/config/casos/renata.js`
3. **Integrar autenticação** (trocar TERAPEUTA_ID fixo por usuário real)
4. **Migrar storage para Supabase** (seguir comentários em `estadoStorage.js`)
5. **Adicionar mais casos** (copiar renata.js como template)

---

## 📞 SUPORTE

Se encontrar problemas:

1. Verifique o console do navegador (F12)
2. Verifique os logs do servidor (terminal)
3. Teste os endpoints isoladamente com curl/Postman
4. Revise este guia passo a passo

---

*Guia criado em 05/12/2024 para Scopsy v3.0*
