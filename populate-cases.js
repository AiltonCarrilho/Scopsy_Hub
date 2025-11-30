const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configurações
const CASOS_POR_CATEGORIA = 20;
const CATEGORIAS = [
  { name: 'anxiety', disorders: ['TAG', 'Pânico', 'Fobia Social', 'TOC'] },
  { name: 'mood', disorders: ['Depressão Maior', 'Distimia', 'Bipolar'] },
  { name: 'trauma', disorders: ['TEPT', 'Transtorno de Estresse Agudo'] }
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
          content: `Você é um gerador de casos clínicos para treino de psicólogos. Você SEMPRE retorna apenas JSON válido.

ESTRUTURA DE SAÍDA (obrigatória):
{
  "metadata": {
    "difficulty_level": "${level}",
    "category": "${category}",
    "disorder": "${disorder}"
  },
  "clinical_content": {
    "vignette": "Vinheta detalhada em português brasileiro (150-250 palavras)",
    "demographics": {
      "name": "Nome fictício",
      "age": número entre 20-55,
      "occupation": "Profissão variada",
      "context": "Contexto da consulta"
    }
  },
  "diagnostic_structure": {
    "correct_diagnosis": "${disorder}",
    "diagnostic_code": "Código DSM-5-TR",
    "criteria_present": [
      "Critério DSM-5-TR específico 1",
      "Critério DSM-5-TR específico 2",
      "Critério 3",
      "Critério 4"
    ]
  },
  "question_format": {
    "question": "Qual é o diagnóstico mais provável?",
    "options": [
      "${disorder}",
      "Diagnóstico diferencial 1",
      "Diagnóstico diferencial 2",
      "Diagnóstico diferencial 3"
    ],
    "correct_option_index": 0
  }
}

REGRAS:
- Vinhetas realistas em português brasileiro
- Idade 20-55 anos, profissões variadas
- SEMPRE incluir: duração, sintomas específicos, prejuízo funcional
- Diferenciais plausíveis que requerem raciocínio clínico
- Nível ${level}: ${level === 'basic' ? 'sintomas típicos claros' : level === 'intermediate' ? 'sobreposição sintomática moderada' : 'apresentação atípica, comorbidades'}
- Varie contextos: trabalho, família, relacionamentos, acadêmico`
        },
        {
          role: "user",
          content: `Gere um caso clínico realista de ${disorder}. Retorne APENAS o JSON.`
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
  console.log(`📈 Taxa de sucesso: ${((totalSucesso/totalCasos)*100).toFixed(1)}%`);
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