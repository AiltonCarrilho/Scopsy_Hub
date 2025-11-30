const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Tipos de micro-momentos
const MOMENT_TYPES = [
  {
    type: 'ruptura_alianca',
    name: 'Ruptura na Aliança',
    count: 5
  },
  {
    type: 'revelacao_dificil',
    name: 'Revelação Sensível',
    count: 5
  },
  {
    type: 'resistencia_tecnica',
    name: 'Resistência a Técnica',
    count: 5
  },
  {
    type: 'intervencao_crucial',
    name: 'Momento de Intervenção',
    count: 5
  },
  {
    type: 'dilema_etico',
    name: 'Dilema Ético',
    count: 3
  },
  {
    type: 'tecnica_oportuna',
    name: 'Timing de Técnica',
    count: 5
  }
];

const NIVEIS = ['basic', 'intermediate', 'advanced'];

async function generateMicroMoment(momentType, level) {
  console.log(`Gerando: ${momentType.name} (${level})...`);
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.85,
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: `Crie MICRO-MOMENTO clínico crítico (30-60 segundos).

TIPO: ${momentType.name}

SAÍDA JSON:
{
  "moment_type": "${momentType.type}",
  "context": {
    "session_number": "Sessão 1-10",
    "client_name": "Nome",
    "client_age": 20-60,
    "diagnosis": "Diagnóstico",
    "what_just_happened": "2-3 frases"
  },
  "critical_moment": {
    "dialogue": "Fala realista do cliente (40-80 palavras)",
    "non_verbal": "Linguagem corporal (1-2 frases)",
    "emotional_tone": "Tom emocional"
  },
  "decision_point": "O QUE VOCÊ DIZ/FAZ AGORA?",
  "options": [
    {"letter": "A", "response": "Resposta A", "approach": "Abordagem A"},
    {"letter": "B", "response": "Resposta B", "approach": "Abordagem B"},
    {"letter": "C", "response": "Resposta C", "approach": "Abordagem C"},
    {"letter": "D", "response": "Resposta D", "approach": "Abordagem D"}
  ],
  "expert_choice": "A, B, C ou D",
  "expert_reasoning": {
    "why_this_works": "3-4 frases",
    "why_others_fail": {
      "option_X": "Por que falha",
      "option_Y": "Por que falha", 
      "option_Z": "Por que falha"
    },
    "core_principle": "Princípio marcante",
    "what_happens_next": "2-3 frases"
  },
  "learning_point": {
    "pattern_to_recognize": "Padrão",
    "instant_response": "Resposta automática",
    "common_mistake": "Erro comum"
  }
}

REGRAS: Diálogo realista português BR, 4 opções plausíveis, feedback cirúrgico.
NÍVEL ${level}: ${level === 'basic' ? 'Padrão claro' : level === 'intermediate' ? 'Nuances' : 'Complexo'}`
        },
        {
          role: "user",
          content: `Crie micro-momento "${momentType.type}", nível ${level}. APENAS JSON.`
        }
      ]
    });

    const momentData = JSON.parse(completion.choices[0].message.content);
    return momentData;
    
  } catch (error) {
    console.error(`Erro: ${momentType.name}:`, error.message);
    return null;
  }
}

async function saveMicroMoment(momentData, level) {
  try {
    const { data, error } = await supabase
      .from('cases')
      .insert({
        disorder: momentData.context?.diagnosis || 'Micro-Momento',
        difficulty_level: level,
        category: 'clinical_moment',
        moment_type: momentData.moment_type,
        case_content: momentData,
        vignette: momentData.critical_moment?.dialogue || '',
        status: 'active',
        times_used: 0,
        quality_score: 4.0,
        created_by: 'micro_moment_seed'
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar:', error.message);
      return false;
    }

    console.log(`✅ Salvo: ${momentData.moment_type} (ID: ${data.id})`);
    return true;
    
  } catch (error) {
    console.error('Erro:', error);
    return false;
  }
}

async function populateMicroMoments() {
  console.log('🎬 Populando MICRO-MOMENTOS CLÍNICOS...\n');
  
  let totalMomentos = 0;
  let totalSucesso = 0;
  let totalFalhas = 0;

  for (const momentType of MOMENT_TYPES) {
    console.log(`\n🎯 Tipo: ${momentType.name}`);
    
    for (const nivel of NIVEIS) {
      const countForLevel = Math.ceil(momentType.count / NIVEIS.length);
      
      for (let i = 0; i < countForLevel; i++) {
        totalMomentos++;
        
        const momentData = await generateMicroMoment(momentType, nivel);
        
        if (momentData) {
          const saved = await saveMicroMoment(momentData, nivel);
          if (saved) {
            totalSucesso++;
          } else {
            totalFalhas++;
          }
        } else {
          totalFalhas++;
        }
        
        // Delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO - MICRO-MOMENTOS:');
  console.log(`Total tentativas: ${totalMomentos}`);
  console.log(`✅ Sucessos: ${totalSucesso}`);
  console.log(`❌ Falhas: ${totalFalhas}`);
  console.log(`📈 Taxa de sucesso: ${((totalSucesso/totalMomentos)*100).toFixed(1)}%`);
  console.log(`\n⚡ Micro-momentos para ${Math.floor(totalSucesso/3)} sessões de treino rápido`);
  console.log('='.repeat(50));
}

populateMicroMoments()
  .then(() => {
    console.log('\n✅ População concluída!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });