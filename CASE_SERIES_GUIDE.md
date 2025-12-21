# 📚 SISTEMA DE SÉRIES DE CASOS - Guia Completo

## 🎯 Visão Geral

Sistema que permite acompanhar a **evolução do mesmo cliente ao longo de múltiplas sessões**, no modelo "Judith Beck" (como Sally nos livros dela).

**Diferença dos Desafios Aleatórios:**
- ❌ **Antes:** Sempre um cliente diferente (João → Maria → Carlos...)
- ✅ **Agora:** Acompanhar MESMO cliente em diferentes momentos (Marcos S1 → Marcos S4 → Marcos S9...)

---

## 🏗️ Arquitetura Implementada

### 1. **Banco de Dados**

#### Tabela `case_series`
```sql
- id (UUID)
- series_name (TEXT) -- "Marcos - TAG: Do Acolhimento à Alta"
- series_slug (TEXT UNIQUE) -- "marcos_tag_completa"
- client_name (TEXT) -- "Marcos Silva"
- client_age (INT)
- disorder (TEXT)
- disorder_category (TEXT) -- "anxiety", "mood", etc
- total_episodes (INT) -- Quantos episódios tem
- description (TEXT) -- Descrição pedagógica
- learning_goals (TEXT) -- Objetivos de aprendizagem
- status (TEXT) -- "active", "draft", "archived"
```

#### Modificações em `cases`
```sql
ALTER TABLE cases ADD COLUMN:
- series_id (UUID) -- Vínculo com série (NULL = caso avulso)
- episode_number (INT) -- Ordem do episódio (1, 2, 3...)
- episode_title (TEXT) -- "Sessão 2: Primeira Resistência"
```

### 2. **APIs Criadas**

#### `GET /api/case/series`
Lista séries disponíveis

```javascript
// Request
GET /api/case/series?difficulty_level=intermediate&disorder_category=anxiety

// Response
{
  "success": true,
  "series": [
    {
      "id": "uuid",
      "series_name": "Marcos - TAG: Da Avaliação à Alta",
      "client_name": "Marcos Silva",
      "client_age": 35,
      "disorder": "TAG",
      "total_episodes": 5,
      "episodes_available": 5,
      "description": "Acompanhe Marcos ao longo de 8 sessões...",
      "learning_goals": "Aliança, timing técnicas, manejo resistência..."
    }
  ],
  "total": 3
}
```

#### `GET /api/case/series/:series_id/next`
Retorna próximo episódio não visto

```javascript
// Request
GET /api/case/series/uuid-da-serie/next

// Response
{
  "success": true,
  "series": {...},
  "episode": {
    "id": "case-uuid",
    "episode_number": 2,
    "episode_title": "Sessão 4: Insight Emergente",
    "case_content": {...},
    "progress": {
      "current": 2,
      "total": 5,
      "percentage": 40
    }
  },
  "case": {...} // Conteúdo do caso (formato padrão)
}

// Response (série completa)
{
  "success": true,
  "completed": true,
  "message": "Parabéns! Você completou toda a série...",
  "series": {...}
}
```

#### `GET /api/case/series/:series_id/progress`
Progresso do usuário na série

```javascript
// Response
{
  "success": true,
  "series": {...},
  "progress": {
    "completed": 3,
    "total": 5,
    "percentage": 60,
    "episodes": [
      {
        "episode_number": 1,
        "episode_title": "Sessão 2: Primeira Resistência",
        "completed": true,
        "interaction": {
          "is_correct": true,
          "created_at": "2025-01-15T10:00:00"
        }
      },
      {
        "episode_number": 2,
        "completed": true
      },
      {
        "episode_number": 3,
        "completed": true
      },
      {
        "episode_number": 4,
        "completed": false
      },
      {
        "episode_number": 5,
        "completed": false
      }
    ],
    "is_complete": false
  }
}
```

---

## 📦 Scripts Criados

### 1. **sql-scripts/09-case-series.sql**
Cria estrutura do banco de dados

**Executar manualmente no Supabase Dashboard:**
1. Acesse: https://supabase.com/dashboard
2. SQL Editor → New Query
3. Cole o conteúdo do arquivo
4. Execute (Run)

### 2. **populate-case-series.js**
Gera 3 séries iniciais com episódios

**Séries que serão criadas:**
1. **Marcos - TAG** (5 episódios)
   - Sessão 2: Primeira Resistência
   - Sessão 4: Insight Emergente
   - Sessão 6: Revelação Difícil
   - Sessão 9: Questionamento da Terapia
   - Sessão 11: Consolidação

2. **Ana - Depressão** (4 episódios)
   - Sessão 1: Desesperança Profunda
   - Sessão 3: Resistência à Ativação
   - Sessão 6: Primeiro Progresso
   - Sessão 10: Medo da Recaída

3. **Carlos - Pânico** (4 episódios)
   - Sessão 2: Crise Durante Sessão
   - Sessão 4: Recusa de Exposição
   - Sessão 7: Dilema Medicação
   - Sessão 10: Primeira Exposição Bem-Sucedida

**Executar:**
```bash
cd SCOPSY-CLAUDE-CODE
node populate-case-series.js
```

**Custo:** ~$0.50-1.00 (OpenAI API)
**Tempo:** ~3-5 minutos

---

## 🎮 Como Usar no Frontend

### Interface Sugerida

```html
<!-- Escolher modo -->
<div class="case-mode-selector">
  <button onclick="loadRandomCase()">
    🎲 Micro-Momento Aleatório
  </button>

  <button onclick="showSeriesList()">
    📚 Seguir Série de Caso
  </button>
</div>

<!-- Listar séries -->
<div id="seriesList" style="display:none;">
  <!-- Será populado via JS -->
</div>

<!-- Progress da série -->
<div id="seriesProgress">
  Episódio 2/5 (40%) - Marcos - TAG
  ━━━━━━━░░░
</div>
```

### JavaScript de Exemplo

```javascript
// 1. Listar séries
async function showSeriesList() {
  const response = await fetch('/api/case/series');
  const data = await response.json();

  const html = data.series.map(s => `
    <div class="series-card" onclick="startSeries('${s.id}')">
      <h3>${s.series_name}</h3>
      <p>${s.client_name}, ${s.client_age} anos - ${s.disorder}</p>
      <div class="episodes-count">${s.episodes_available} episódios</div>
      <p class="description">${s.description}</p>
    </div>
  `).join('');

  document.getElementById('seriesList').innerHTML = html;
}

// 2. Iniciar série
async function startSeries(seriesId) {
  const response = await fetch(\`/api/case/series/\${seriesId}/next\`);
  const data = await response.json();

  if (data.completed) {
    alert(data.message);
    return;
  }

  // Mostrar caso
  displayCase(data.case, data.episode);

  // Mostrar progress
  updateProgress(data.episode.progress);
}

// 3. Próximo episódio (após resolver atual)
async function nextEpisode(seriesId) {
  // Mesmo código de startSeries()
  startSeries(seriesId);
}

// 4. Ver progresso
async function viewProgress(seriesId) {
  const response = await fetch(\`/api/case/series/\${seriesId}/progress\`);
  const data = await response.json();

  const html = data.progress.episodes.map(ep => \`
    <div class="episode \${ep.completed ? 'completed' : 'pending'}">
      \${ep.completed ? '✓' : '○'} Episódio \${ep.episode_number}: \${ep.episode_title}
    </div>
  \`).join('');

  document.getElementById('progressList').innerHTML = html;
}
```

---

## 🎓 Experiência Pedagógica

### Modelo "Judith Beck"

**No livro dela:**
- Sally aparece em múltiplas sessões
- Vemos evolução da aliança
- Decisões têm consequências longitudinais
- Aprendemos timing de técnicas

**No Scopsy (agora):**
```
Episódio 1 (Marcos - Sessão 2):
  Usuário escolhe validar muito → ✅

Episódio 2 (Marcos - Sessão 4):
  "Marcos desenvolveu confiança após validação da S2"
  Agora está aberto para técnicas

Episódio 3 (Marcos - Sessão 6):
  "Devido à boa aliança, Marcos revela conflito conjugal"
  (Consequência da escolha do Ep1!)

Episódio 4 (Marcos - Sessão 9):
  "Pequena recaída - mas aliança mantém Marcos engajado"
  (Aliança construída nos episódios anteriores!)
```

**Vantagens:**
- ✅ Vê consequências de decisões
- ✅ Aprende timing (quando fazer X vs Y)
- ✅ Observa evolução de aliança
- ✅ Mais profundidade clínica
- ✅ Simula terapia real

---

## 🚀 Próximos Passos

### 1. **Executar SQL (Criar Tabelas)**
```bash
# Copiar sql-scripts/09-case-series.sql
# Executar no Supabase Dashboard
```

### 2. **Popular Séries Iniciais**
```bash
cd SCOPSY-CLAUDE-CODE
node populate-case-series.js
```

### 3. **Testar APIs**
```bash
# Listar séries
curl http://localhost:3000/api/case/series

# Próximo episódio
curl http://localhost:3000/api/case/series/{ID}/next

# Progresso
curl http://localhost:3000/api/case/series/{ID}/progress
```

### 4. **Atualizar Frontend**
- Adicionar botão "Séries" em desafios.html
- Criar modal para listar séries
- Mostrar progresso da série
- Botão "Próximo Episódio"

---

## 📊 Métricas Pedagógicas

**Comparação:**

| Métrica | Aleatório | Séries |
|---------|-----------|--------|
| Variedade | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Profundidade | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Consequências | ❌ | ✅ |
| Timing | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Aliança | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Realismo | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Recomendação:** Oferecer AMBOS os modos!
- **Iniciantes:** Séries (mais estruturado)
- **Avançados:** Aleatório (mais variedade)

---

## 🎯 Conclusão

Sistema de Séries implementado com sucesso!

**Permite:**
- ✅ Explorar nuances do mesmo cliente
- ✅ Ver evolução longitudinal
- ✅ Aprender timing de técnicas
- ✅ Consequências de decisões
- ✅ Maior profundidade clínica

**Modelo "Judith Beck"** totalmente funcional! 📚✨

---

**Criado em:** 20/12/2025
**Versão:** 1.0
