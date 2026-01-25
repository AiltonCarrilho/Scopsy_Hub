const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configurações - CASE precisa menos casos que Diagnostic
const CASOS_POR_NIVEL = 2; // 2 de cada nível = mais variedade
const CATEGORIAS = [
  { 
    name: 'anxiety', 
    contexts: ['Trabalho', 'Família', 'Relacionamento', 'Acadêmico']
  },
  { 
    name: 'mood', 
    contexts: ['Luto', 'Transição', 'Isolamento', 'Burnout']
  },
  { 
    name: 'trauma', 
    contexts: ['Acidente', 'Violência', 'Perda súbita', 'Abuso']
  },
  { 
    name: 'personality', 
    contexts: ['Trabalho', 'Relacionamentos', 'Família', 'Social']
  }
];
const NIVEIS = ['basic', 'intermediate', 'advanced'];

// Função para gerar um caso
async function generateCase(level, category, context) {
  console.log(`Gerando Case: ${category} (${level}) - ${context}...`);
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.9, // Alta criatividade
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: `Você é um gerador de casos clínicos realistas para treino de psicólogos. Retorna APENAS JSON.

SAÍDA:
{
  "metadata": {
    "difficulty_level": "${level}",
    "category": "${category}",
    "context": "${context}",
    "disorder": "Transtorno específico"
  },
  "clinical_content": {
    "vignette": "Caso clínico detalhado (250-400 palavras). Natural e humanizado, como caso real de consultório. Contexto: ${context}",
    "demographics": {
      "name": "Nome brasileiro",
      "age": número 18-65,
      "occupation": "Profissão variada",
      "context": "Motivo da busca por terapia"
    }
  },
  "therapeutic_focus": {
    "presenting_problem": "Problema apresentado",
    "emotional_state": "Estado emocional",
    "cognitive_patterns": ["Padrão 1", "Padrão 2"],
    "behavioral_patterns": ["Padrão 1", "Padrão 2"],
    "intervention_suggestions": ["Intervenção 1", "Intervenção 2"]
  }
}

NÍVEL ${level}:
- basic: apresentação típica, sintomas claros
- intermediate: fatores múltiplos, apresentação mista  
- advanced: comorbidades, complexidade, apresentação atípica

CONTEXTO ${context}: Integre este contexto naturalmente no caso.

REGRAS:
- Português brasileiro natural
- Idade 18-65, profissões brasileiras variadas
- Vinheta realista e empática (250-400 palavras)
- Sempre: duração, prejuízo funcional, tentativas de lidar`
        },
        {
          role: "user",
          content: `Gere caso de ${category} no contexto ${context}. APENAS JSON.`
        }
      ]
    });

    const caseData = JSON.parse(completion.choices[0].message.content);
    return caseData;
    
  } catch (error) {
    console.error(`Erro: ${category} (${context}):`, error.message);
    return null;
  }
}

// Função para salvar
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
        correct_diagnosis: caseData.metadata?.disorder || '',
        status: 'active',
        times_used: 0,
        times_correct: 0,
        times_incorrect: 0,
        quality_score: 4.0,
        created_by: 'case_seed_script'
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar:', error.message);
      return false;
    }

    console.log(`✅ Salvo: ${caseData.metadata?.disorder} - ${caseData.metadata?.context} (ID: ${data.id})`);
    return true;
    
  } catch (error) {
    console.error('Erro ao salvar:', error);
    return false;
  }
}

// Função principal
async function populateCases() {
  console.log('🚀 Populando casos do CASE MODULE...\n');
  console.log('📊 Estratégia: Variedade > Quantidade\n');
  
  let totalCasos = 0;
  let totalSucesso = 0;
  let totalFalhas = 0;

  for (const categoria of CATEGORIAS) {
    console.log(`\n📁 Categoria: ${categoria.name}`);
    
    for (const nivel of NIVEIS) {
      // Escolher contextos aleatórios para cada nível
      const selectedContexts = categoria.contexts
        .sort(() => Math.random() - 0.5)
        .slice(0, CASOS_POR_NIVEL);
      
      for (const context of selectedContexts) {
        totalCasos++;
        
        const caseData = await generateCase(nivel, categoria.name, context);
        
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
        
        // Delay para não sobrecarregar API
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO - CASE MODULE:');
  console.log(`Total tentativas: ${totalCasos}`);
  console.log(`✅ Sucessos: ${totalSucesso}`);
  console.log(`❌ Falhas: ${totalFalhas}`);
  console.log(`📈 Taxa de sucesso: ${((totalSucesso/totalCasos)*100).toFixed(1)}%`);
  console.log(`\n💡 Casos suficientes para ${Math.floor(totalSucesso/3)}-${Math.floor(totalSucesso/2)} sessões típicas`);
  console.log('='.repeat(50));
}

// Executar
populateCases()
  .then(() => {
    console.log('\n✅ População de casos CASE concluída!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });