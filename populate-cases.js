const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
// Tentar carregar .env.local primeiro (se existir)
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configurações
const CASOS_POR_CATEGORIA = 20;
const CATEGORIAS = [
  // 1. Transtornos de Ansiedade
  { name: 'anxiety', disorders: ['Transtorno de Ansiedade Generalizada (TAG)', 'Transtorno de Pânico', 'Fobia Social (Ansiedade Social)', 'Agorafobia'] },

  // 2. Transtornos do Humor (Depressivos e Bipolares)
  { name: 'mood', disorders: ['Transtorno Depressivo Maior', 'Transtorno Depressivo Persistente (Distimia)', 'Transtorno Bipolar Tipo II', 'Ciclotimia'] },

  // 3. Transtornos Relacionados a Trauma e Estresse
  { name: 'trauma', disorders: ['Transtorno de Estresse Pós-Traumático (TEPT)', 'Transtorno de Estresse Agudo', 'Transtorno de Adaptação'] },

  // 4. Transtornos Obsessivo-Compulsivos (Nova categoria DSM-5)
  { name: 'obsessive', disorders: ['Transtorno Obsessivo-Compulsivo (TOC)', 'Transtorno Dismórfico Corporal', 'Transtorno de Acumulação'] },

  // 5. Transtornos da Personalidade
  { name: 'personality_b', disorders: ['Transtorno de Personalidade Borderline', 'Transtorno de Personalidade Narcisista', 'Transtorno de Personalidade Histriônica'] },
  { name: 'personality_c', disorders: ['Transtorno de Personalidade Evitativa', 'Transtorno de Personalidade Dependente', 'Transtorno de Personalidade Obsessivo-Compulsiva'] },

  // 6. Transtornos Alimentares
  { name: 'eating', disorders: ['Anorexia Nervosa', 'Bulimia Nervosa', 'Transtorno de Compulsão Alimentar'] }
];
const NIVEIS = ['basic', 'intermediate', 'advanced'];

// Função para gerar um caso
async function generateCase(level, category, disorder) {
  console.log(`Gerando: ${disorder} (${level})...`);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // MAIS BARATO e rápido para geração em massa
      response_format: { type: "json_object" },
      temperature: 0.9, // Alta criatividade para variedade
      messages: [
        {
          role: "system",
          content: `Você é um gerador de casos clínicos para treino diagnóstico e clínico DSM-5-TR.

OBJETIVO PEDAGÓGICO: Treinar competências clínicas reais (diagnóstico diferencial, conhecimento DSM, raciocínio clínico).

========================================
FORMATOS DISPONÍVEIS (escolha 1 aleatoriamente):
========================================

FORMATO 1: DIAGNÓSTICO DIFERENCIAL (40% dos casos)
- Pergunta: "Qual é o diagnóstico DSM-5-TR mais provável?"
- 4 opções: todas da MESMA categoria (ex: apenas ansiedade)
- Diferenciais PLAUSÍVEIS (não óbvios)

FORMATO 2: CRITÉRIO AUSENTE (30% dos casos)
- Dê o diagnóstico na pergunta
- Pergunta: "Qual dos sintomas apresentados NÃO faz parte dos critérios DSM-5-TR de [diagnóstico]?"
- 3 critérios corretos + 1 que não pertence

FORMATO 3: INTERVENÇÃO INDICADA (30% dos casos)
- Adicione contexto de sessão (ex: "Sessão 2", "primeira sessão", "após psicoeducação")
- Pergunta: "Qual intervenção TCC seria MAIS indicada neste momento?"
- 4 intervenções plausíveis (psicoeducação, reestruturação cognitiva, exposição, ativação comportamental, etc)

========================================
REGRAS CRÍTICAS (TODOS OS FORMATOS):
========================================

1. DIFERENCIAIS/OPÇÕES PLAUSÍVEIS:
   - NUNCA misturar categorias distantes (ansiedade com psicose)
   - Todas as opções devem ser da MESMA categoria diagnóstica
   - Diferenciais devem diferir por 1-2 critérios DSM apenas

2. EVITAR "ONE-WORD DIAGNOSIS":
   - NÃO use palavras-chave óbvias na vinheta
   - Descreva SINTOMAS e CONTEXTO, não o nome do transtorno
   - Exemplo: NÃO escreva "pânico" se diagnóstico é Transtorno de Pânico

3. NÍVEL DE DIFICULDADE:
   - basic: 1 opção claramente errada, 2 plausíveis, 1 correta
   - intermediate: 3 opções plausíveis, 1 correta (diferença sutil)
   - advanced: 4 opções igualmente plausíveis, critérios DSM diferenciam

4. VINHETA REALISTA:
   - 150-200 palavras
   - Português brasileiro natural
   - Contexto clínico realista (não acadêmico demais)
   - Idade 20-60 anos, profissões variadas

========================================
SAÍDA JSON:
========================================

{
  "metadata": {
    "difficulty_level": "${level}",
    "category": "${category}",
    "disorder": "${disorder}"
  },
  "clinical_content": {
    "vignette": "Vinheta 150-200 palavras. DESCREVA sintomas e contexto, NÃO nomeie transtorno.",
    "session_context": "Sessão X, fase terapêutica, rapport (APENAS para FORMATO 3)",
    "demographics": {"name": "Nome brasileiro", "age": 20-60, "occupation": "Profissão"}
  },
  "diagnostic_structure": {
    "correct_diagnosis": "${disorder}",
    "criteria_present": ["Critério DSM A presente", "Critério B", "Critério C"],
    "differential_reasoning": "Por que diferenciais são plausíveis mas incorretos (1-2 frases)"
  },
  "question_format": {
    "format_type": "differential | criteria_absent | intervention",
    "question": "Pergunta específica do formato escolhido",
    "options": [
      "Opção correta",
      "Opção plausível 1",
      "Opção plausível 2",
      "Opção plausível 3"
    ],
    "correct_answer": "A opção correta (texto exato, deve ser igual a uma das options)",
    "rationale": "Por que a resposta correta é a melhor (2-3 frases)"
  }
}

PORTUGUÊS BRASILEIRO. Casos realistas. DSM-5-TR. ESCOLHA 1 FORMATO ALEATORIAMENTE.`
        },
        {
          role: "user",
          content: `Gere um caso clínico realista de ${disorder} (Nível: ${level}). Retorne APENAS o JSON.`
        }
      ]
    });

    const caseData = JSON.parse(completion.choices[0].message.content);
    return caseData;

  } catch (error) {
    console.error(`Erro ao gerar ${disorder}:`, error.message);
    return null;
  }
}

// Função para salvar caso no banco
async function saveCase(caseData, level, category) {
  try {
    const { data, error } = await supabase
      .from('cases')
      .insert({
        disorder: caseData.metadata?.disorder || 'Unknown',
        difficulty_level: level,
        category: category,
        case_content: caseData,
        vignette: caseData.clinical_content?.vignette || '',
        correct_diagnosis: caseData.diagnostic_structure?.correct_diagnosis || '',
        status: 'active', // JÁ MARCA COMO ATIVO (validado)
        times_used: 0,
        times_correct: 0,
        times_incorrect: 0,
        quality_score: 4.0, // Pontuação inicial boa
        created_by: 'seed_script'
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar:', error.message);
      return false;
    }

    console.log(`✅ Salvo: ${caseData.metadata?.disorder} (ID: ${data.id})`);
    return true;

  } catch (error) {
    console.error('Erro ao salvar caso:', error);
    return false;
  }
}

// Função principal
async function populateDatabase() {
  console.log('🚀 Iniciando população do banco de dados...\n');

  let totalCasos = 0;
  let totalSucesso = 0;
  let totalFalhas = 0;

  for (const categoria of CATEGORIAS) {
    console.log(`\n📁 Categoria: ${categoria.name}`);

    for (const disorder of categoria.disorders) {
      for (const nivel of NIVEIS) {

        // Gerar múltiplos casos por combinação
        const casosPorCombinacao = Math.ceil(CASOS_POR_CATEGORIA / categoria.disorders.length / NIVEIS.length);

        for (let i = 0; i < casosPorCombinacao; i++) {
          totalCasos++;

          const caseData = await generateCase(nivel, categoria.name, disorder);

          if (caseData) {
            const saved = await saveCase(caseData, nivel, categoria.name);
            if (saved) {
              totalSucesso++;
            } else {
              totalFalhas++;
            }
          } else {
            totalFalhas++;
          }

          // Delay para não sobrecarregar API (opcional)
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO:');
  console.log(`Total tentativas: ${totalCasos}`);
  console.log(`✅ Sucessos: ${totalSucesso}`);
  console.log(`❌ Falhas: ${totalFalhas}`);
  console.log(`📈 Taxa de sucesso: ${((totalSucesso / totalCasos) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));
}

// Executar
populateDatabase()
  .then(() => {
    console.log('\n✅ População concluída!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });