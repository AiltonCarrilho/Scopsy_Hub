require('dotenv').config();
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CATEGORIES = [
  {
    name: 'Trauma',
    disorders: [
      'Transtorno de Estresse Pós-Traumático',
      'Transtorno de Estresse Agudo',
      'Transtorno de Adaptação',
      'Transtorno Dissociativo de Identidade',
      'TEPT Complexo'
    ]
  },
  {
    name: 'Mood',
    disorders: [
      'Transtorno Depressivo Maior',
      'Transtorno Depressivo Persistente (Distimia)',
      'Transtorno Bipolar Tipo I',
      'Transtorno Bipolar Tipo II',
      'Transtorno Ciclotímico'
    ]
  }
];

const LEVELS = ['basic', 'intermediate', 'advanced'];

async function generateCase(disorder, level, categoryName) {
  const levelDescriptions = {
    basic: 'Apresentação típica e clara dos sintomas. Caso didático.',
    intermediate: 'Apresentação com nuances e alguns sintomas sobrepostos.',
    advanced: 'Apresentação atípica ou complexa, com múltiplos fatores.'
  };

  const prompt = `Crie um caso clínico COMPLETO E RICO para conceituação em TCC.

TRANSTORNO: ${disorder}
NÍVEL: ${level} - ${levelDescriptions[level]}
CATEGORIA: ${categoryName}

REQUISITOS:

1. VINHETA (300-400 palavras):
- Nome fictício, idade, profissão
- História de vida relevante (família, relacionamentos, traumas)
- Sintomas atuais detalhados
- Gatilhos e eventos precipitantes
- Padrões de comportamento
- Impacto funcional (trabalho, relações, autocuidado)

2. ELEMENTOS PARA CONCEITUAÇÃO:
- Tríade cognitiva clara (pensamentos típicos, emoções, comportamentos)
- Sugestões de crenças centrais, intermediárias e automáticas
- Vulnerabilidades de desenvolvimento
- Fatores mantenedores atuais

3. TOM:
- Humanizado e empático
- Detalhes concretos e específicos
- Evite jargão excessivo
- Linguagem clínica mas acessível

FORMATO JSON:
{
  "vignette": "Vinheta narrativa completa de 300-400 palavras. Deve ser rica em detalhes clínicos, história de vida, padrões cognitivos e comportamentais. Conte uma história envolvente que permita análise profunda.",
  "client_name": "Nome do cliente",
  "client_age": idade,
  "diagnosis": "${disorder}",
  "key_symptoms": ["sintoma1", "sintoma2", "sintoma3"],
  "cognitive_triad_hints": {
    "thoughts": "Exemplos de pensamentos típicos",
    "emotions": "Emoções predominantes",
    "behaviors": "Comportamentos observáveis"
  },
  "core_beliefs_hints": ["crença central 1", "crença central 2"],
  "vulnerabilities": "Breve história de vulnerabilidades",
  "maintaining_factors": "Principais fatores mantenedores"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.9,
    max_tokens: 2000,
    messages: [
      {
        role: "system",
        content: "Você é um psicólogo clínico experiente criando casos para treinamento em TCC. Crie casos ricos, realistas e clinicamente precisos."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  let caseData;
  try {
    caseData = JSON.parse(completion.choices[0].message.content);
  } catch (e) {
    console.error('❌ Erro ao fazer parse do JSON:', e.message);
    return null;
  }

  const { data: newCase, error } = await supabase
    .from('cases')
    .insert({
      disorder: disorder,
      difficulty_level: level,
      category: 'clinical_moment',
      case_content: {
        client_name: caseData.client_name,
        client_age: caseData.client_age,
        diagnosis: caseData.diagnosis,
        key_symptoms: caseData.key_symptoms,
        cognitive_triad_hints: caseData.cognitive_triad_hints,
        core_beliefs_hints: caseData.core_beliefs_hints,
        vulnerabilities: caseData.vulnerabilities,
        maintaining_factors: caseData.maintaining_factors
      },
      vignette: caseData.vignette,
      status: 'active',
      times_used: 0,
      quality_score: 4.5,
      created_by: 'diverse_population_script'
    })
    .select()
    .single();

  if (error) {
    console.error(`❌ Erro ao salvar: ${error.message}`);
    return null;
  }

  return newCase;
}

async function populateTraumaAndMood() {
  console.log('🧠 POPULAÇÃO DE TRAUMA + MOOD');
  console.log('================================\n');
  console.log('📊 30 casos totais (15 trauma + 15 mood)\n');

  let totalGenerated = 0;
  let totalErrors = 0;

  for (const category of CATEGORIES) {
    console.log(`\n📁 CATEGORIA: ${category.name}`);
    console.log(`   Transtornos: ${category.disorders.length}`);
    console.log(`   Total: 15 casos (5 × 3 níveis)\n`);

    for (const level of LEVELS) {
      console.log(`  📊 Nível: ${level}`);
      
      for (let i = 0; i < category.disorders.length; i++) {
        const disorder = category.disorders[i];
        process.stdout.write(`     ${i + 1}/5 ${disorder.substring(0, 40)}... `);
        
        try {
          const result = await generateCase(disorder, level, category.name);
          if (result) {
            console.log('✅');
            totalGenerated++;
          } else {
            console.log('❌');
            totalErrors++;
          }
        } catch (error) {
          console.log(`❌ ${error.message}`);
          totalErrors++;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  console.log('\n================================');
  console.log('📊 RESUMO FINAL:');
  console.log(`   ✅ Casos gerados: ${totalGenerated}`);
  console.log(`   ❌ Erros: ${totalErrors}`);
  console.log(`   📈 Taxa de sucesso: ${((totalGenerated / (totalGenerated + totalErrors)) * 100).toFixed(1)}%`);
  console.log('================================\n');

  process.exit(0);
}

populateTraumaAndMood().catch(err => {
  console.error('💥 Erro fatal:', err);
  process.exit(1);
});