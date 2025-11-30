const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const NIVEIS = ['basic', 'intermediate', 'advanced'];
const CASOS_POR_NIVEL = 10; // 10 de cada = 30 total

async function generateMicroMoment(level) {
  console.log(`Gerando: Resistência a Técnica (${level})...`);
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Rápido
      response_format: { type: "json_object" },
      temperature: 0.9, // Alta variação
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content: `Crie MICRO-MOMENTO de RESISTÊNCIA A TÉCNICA (30-60s).

SAÍDA JSON:
{
  "moment_type": "resistencia_tecnica",
  "context": {
    "session_number": "Sessão 1-10",
    "client_name": "Nome brasileiro",
    "client_age": 20-60,
    "diagnosis": "Diagnóstico",
    "what_just_happened": "Você sugeriu uma técnica/intervenção"
  },
  "critical_moment": {
    "dialogue": "Cliente REJEITA ou QUESTIONA (40-80 palavras realistas)",
    "non_verbal": "Linguagem corporal",
    "emotional_tone": "Tom emocional"
  },
  "decision_point": "O QUE VOCÊ RESPONDE?",
  "options": [
    {"letter": "A", "response": "Opção A", "approach": "Abordagem"},
    {"letter": "B", "response": "Opção B", "approach": "Abordagem"},
    {"letter": "C", "response": "Opção C", "approach": "Abordagem"},
    {"letter": "D", "response": "Opção D", "approach": "Abordagem"}
  ],
  "expert_choice": "A, B, C ou D",
  "expert_reasoning": {
    "why_this_works": "Por que funciona",
    "why_others_fail": {
      "option_X": "Por que falha",
      "option_Y": "Por que falha",
      "option_Z": "Por que falha"
    },
    "core_principle": "Princípio marcante",
    "what_happens_next": "O que acontece"
  },
  "learning_point": {
    "pattern_to_recognize": "Padrão",
    "instant_response": "Resposta automática",
    "common_mistake": "Erro comum"
  }
}

NÍVEL ${level}: ${level === 'basic' ? 'Óbvio' : level === 'intermediate' ? 'Nuances' : 'Complexo'}
Português BR realista.`
        },
        {
          role: "user",
          content: `Gere micro-momento resistencia_tecnica nível ${level}. JSON.`
        }
      ]
    });

    return JSON.parse(completion.choices[0].message.content);
    
  } catch (error) {
    console.error(`Erro:`, error.message);
    return null;
  }
}

async function saveMicroMoment(momentData, level) {
  try {
    const { data, error } = await supabase
      .from('cases')
      .insert({
        disorder: momentData.context?.diagnosis || 'Resistência',
        difficulty_level: level,
        category: 'clinical_moment',
        moment_type: 'resistencia_tecnica',
        case_content: momentData,
        vignette: momentData.critical_moment?.dialogue || '',
        status: 'active',
        times_used: 0,
        quality_score: 4.0,
        created_by: 'quick_population'
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar:', error.message);
      return false;
    }

    console.log(`✅ Salvo (ID: ${data.id.substring(0, 8)}...)`);
    return true;
    
  } catch (error) {
    console.error('Erro:', error);
    return false;
  }
}

async function populate() {
  console.log('⚡ Populando +30 micro-momentos de RESISTÊNCIA...\n');
  
  let total = 0;
  let sucesso = 0;

  for (const nivel of NIVEIS) {
    console.log(`\n📁 Nível: ${nivel}`);
    
    for (let i = 0; i < CASOS_POR_NIVEL; i++) {
      total++;
      
      const moment = await generateMicroMoment(nivel);
      
      if (moment) {
        const saved = await saveMicroMoment(moment, nivel);
        if (saved) sucesso++;
      }
      
      await new Promise(r => setTimeout(r, 300)); // Delay curto
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Total: ${total} | ✅ Sucesso: ${sucesso} | Taxa: ${((sucesso/total)*100).toFixed(1)}%`);
  console.log('='.repeat(50));
}

populate()
  .then(() => {
    console.log('\n✅ Concluído!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Erro:', err);
    process.exit(1);
  });