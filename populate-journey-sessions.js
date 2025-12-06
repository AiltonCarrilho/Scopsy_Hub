require('dotenv').config();
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================
// ESTRUTURA DAS 12 SESSÕES
// ============================================
const SESSION_STRUCTURE = [
  {
    number: 1,
    title: 'Sessão 1: Avaliação Inicial e Estabelecimento de Rapport',
    phase: 'assessment',
    focus: 'Estabelecer aliança terapêutica, compreender queixa principal, história de vida'
  },
  {
    number: 2,
    title: 'Sessão 2: Conceituação Cognitiva e Definição de Metas',
    phase: 'assessment',
    focus: 'Formular conceituação do caso, estabelecer metas terapêuticas específicas'
  },
  {
    number: 3,
    title: 'Sessão 3: Psicoeducação sobre TAG e Modelo Cognitivo',
    phase: 'psychoeducation',
    focus: 'Ensinar modelo cognitivo, normalizar sintomas, identificar ciclos de preocupação'
  },
  {
    number: 4,
    title: 'Sessão 4: Identificação de Pensamentos Automáticos',
    phase: 'psychoeducation',
    focus: 'Treinar registro de pensamentos, identificar padrões cognitivos'
  },
  {
    number: 5,
    title: 'Sessão 5: Questionamento Socrático e Reestruturação',
    phase: 'intervention',
    focus: 'Questionar pensamentos disfuncionais, desenvolver pensamentos alternativos'
  },
  {
    number: 6,
    title: 'Sessão 6: Experimentos Comportamentais',
    phase: 'intervention',
    focus: 'Testar previsões catastróficas, exposição gradual a situações evitadas'
  },
  {
    number: 7,
    title: 'Sessão 7: Crenças Intermediárias',
    phase: 'intervention',
    focus: 'Identificar regras e suposições, trabalhar rigidez cognitiva'
  },
  {
    number: 8,
    title: 'Sessão 8: Crenças Centrais',
    phase: 'intervention',
    focus: 'Explorar origem das crenças, desenvolver crenças mais adaptativas'
  },
  {
    number: 9,
    title: 'Sessão 9: Tolerância à Incerteza',
    phase: 'consolidation',
    focus: 'Trabalhar necessidade de controle, aceitar incerteza como parte da vida'
  },
  {
    number: 10,
    title: 'Sessão 10: Generalização de Habilidades',
    phase: 'consolidation',
    focus: 'Aplicar técnicas em diferentes contextos, consolidar aprendizados'
  },
  {
    number: 11,
    title: 'Sessão 11: Prevenção de Recaída',
    phase: 'termination',
    focus: 'Identificar sinais de alerta, plano de ação para recaídas, autonomia'
  },
  {
    number: 12,
    title: 'Sessão 12: Encerramento e Revisão de Ganhos',
    phase: 'termination',
    focus: 'Celebrar progresso, revisar ferramentas aprendidas, despedida terapêutica'
  }
];

// ============================================
// GERAR SESSÃO COM GPT-4O
// ============================================
async function generateSession(sessionInfo, previousSessions) {
  console.log(`\n📝 Gerando Sessão ${sessionInfo.number}: ${sessionInfo.title}`);

  const previousContext = previousSessions.length > 0 
    ? `\n\nCONTEXTO DAS SESSÕES ANTERIORES:\n${previousSessions.map((s, i) => 
        `Sessão ${i + 1}: ${s.brief_summary || 'Primeira sessão'}`
      ).join('\n')}`
    : '';

  const prompt = `Você é um psicólogo clínico experiente criando material de treinamento para estudantes de TCC.

CASO: Marina, 28 anos, professora, Transtorno de Ansiedade Generalizada
BACKGROUND: Família exigente, padrões elevados. Preocupação excessiva com trabalho, relacionamentos, saúde. Evita situações sociais por medo de avaliação negativa.

SESSÃO ATUAL:
- Número: ${sessionInfo.number}/12
- Título: ${sessionInfo.title}
- Fase: ${sessionInfo.phase}
- Foco: ${sessionInfo.focus}${previousContext}

TAREFA: Crie conteúdo detalhado e clinicamente preciso para esta sessão.

FORMATO JSON:
{
  "context": "Parágrafo de 150-200 palavras descrevendo o que aconteceu desde a última sessão. Incluir: estado emocional da cliente, eventos relevantes, evolução dos sintomas, preparação para sessão atual. Seja específico e realista.",
  
  "homework_review": "${sessionInfo.number > 1 ? 'Parágrafo de 80-100 palavras sobre como foi o homework da sessão anterior. Incluir dificuldades e sucessos.' : null}",
  
  "client_state": "2-3 frases sobre estado atual: humor, nível de ansiedade, abertura para trabalho terapêutico",
  
  "decision_prompt": "Situação clínica específica que exige decisão terapêutica. Seja concreto: cite falas da cliente, comportamentos observados, momento crítico da sessão. 60-80 palavras.",
  
  "options": [
    {
      "label": "A",
      "text": "Descrição clara da intervenção (40-60 palavras). Use terminologia técnica apropriada.",
      "technique": "nome_da_tecnica_tcc",
      "is_best": true,
      "feedback": {
        "immediate": "Reação imediata da cliente (40-60 palavras). Seja específico: o que ela disse, como se comportou, mudanças observáveis.",
        "explanation": "Explicação técnica de 80-100 palavras: por que esta intervenção é eficaz neste momento, qual mecanismo de mudança está sendo ativado, como se alinha com objetivos terapêuticos.",
        "impact": {
          "rapport": 8,
          "insight": 10,
          "behavioral_change": 7,
          "symptom_reduction": 6
        }
      }
    },
    {
      "label": "B",
      "text": "Segunda melhor opção (40-60 palavras)",
      "technique": "nome_da_tecnica",
      "is_best": false,
      "feedback": {
        "immediate": "Reação da cliente (40-60 palavras)",
        "explanation": "Por que funciona parcialmente mas não é ótima (80-100 palavras)",
        "impact": {
          "rapport": 7,
          "insight": 6,
          "behavioral_change": 5,
          "symptom_reduction": 4
        }
      }
    },
    {
      "label": "C",
      "text": "Opção menos eficaz (40-60 palavras)",
      "technique": "nome_da_tecnica",
      "is_best": false,
      "feedback": {
        "immediate": "Reação da cliente (40-60 palavras)",
        "explanation": "Por que não é ideal (80-100 palavras)",
        "impact": {
          "rapport": 5,
          "insight": 4,
          "behavioral_change": 3,
          "symptom_reduction": 2
        }
      }
    },
    {
      "label": "D",
      "text": "Opção contraindicada ou prematura (40-60 palavras)",
      "technique": "nome_da_tecnica",
      "is_best": false,
      "feedback": {
        "immediate": "Reação negativa da cliente (40-60 palavras)",
        "explanation": "Por que é inadequada neste momento (80-100 palavras)",
        "impact": {
          "rapport": 3,
          "insight": 2,
          "behavioral_change": 1,
          "symptom_reduction": 0
        }
      }
    }
  ],
  
  "brief_summary": "Resumo de 1 frase (20-30 palavras) do que foi trabalhado nesta sessão. Para referência nas próximas sessões."
}

DIRETRIZES:
- Seja clinicamente preciso e realista
- Use técnicas apropriadas para a fase do tratamento
- Mantenha progressão lógica (sessões iniciais: avaliação, intermediárias: intervenção, finais: consolidação)
- Opção A deve ser a melhor escolha técnica para aquele momento
- Opções B, C, D devem ser plausíveis mas progressivamente menos adequadas
- Impactos devem refletir eficácia da intervenção (A > B > C > D)
- Linguagem acessível mas tecnicamente correta`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 3000,
      messages: [
        {
          role: "system",
          content: "Você é um psicólogo clínico experiente em TCC criando material educacional de alta qualidade."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const sessionData = JSON.parse(completion.choices[0].message.content);
    console.log(`   ✅ Conteúdo gerado (${completion.usage.total_tokens} tokens)`);
    
    return sessionData;

  } catch (error) {
    console.error(`   ❌ Erro ao gerar sessão: ${error.message}`);
    throw error;
  }
}

// ============================================
// POPULAR SESSÕES
// ============================================
async function populateSessions() {
  console.log('🌱 POPULAÇÃO DE JORNADA CLÍNICA');
  console.log('================================\n');

  try {
    // Buscar jornada existente (TAG)
    const { data: journey, error: journeyError } = await supabase
      .from('clinical_journeys')
      .select('*')
      .eq('disorder', 'Transtorno de Ansiedade Generalizada')
      .single();

    if (journeyError) {
      console.error('❌ Jornada não encontrada. Execute o schema SQL primeiro.');
      process.exit(1);
    }

    console.log(`📋 Jornada encontrada: ${journey.title}`);
    console.log(`   Cliente: ${journey.client_name}, ${journey.client_age} anos`);
    console.log(`   ID: ${journey.id}\n`);

    // Verificar sessões existentes
    const { data: existingSessions } = await supabase
      .from('journey_sessions')
      .select('session_number')
      .eq('journey_id', journey.id);

    if (existingSessions && existingSessions.length > 0) {
      console.log('⚠️  Sessões já existem. Deseja recriar? (y/N)');
      console.log('   (Ctrl+C para cancelar, Enter para continuar)\n');
      
      // Para automação, vamos deletar e recriar
      const { error: deleteError } = await supabase
        .from('journey_sessions')
        .delete()
        .eq('journey_id', journey.id);

      if (deleteError) throw deleteError;
      console.log('   🗑️  Sessões anteriores deletadas\n');
    }

    // Gerar e salvar 12 sessões
    const previousSessions = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < SESSION_STRUCTURE.length; i++) {
      const sessionInfo = SESSION_STRUCTURE[i];
      
      try {
        // Gerar conteúdo
        const sessionData = await generateSession(sessionInfo, previousSessions);

        // Salvar no banco
        const { error: insertError } = await supabase
          .from('journey_sessions')
          .insert({
            journey_id: journey.id,
            session_number: sessionInfo.number,
            session_title: sessionInfo.title,
            session_phase: sessionInfo.phase,
            context: sessionData.context,
            homework_review: sessionData.homework_review,
            client_state: sessionData.client_state,
            decision_prompt: sessionData.decision_prompt,
            options: sessionData.options,
            time_limit_seconds: 180
          });

        if (insertError) throw insertError;

        console.log(`   💾 Salva no banco`);
        
        // Guardar resumo para próximas sessões
        previousSessions.push({
          number: sessionInfo.number,
          brief_summary: sessionData.brief_summary
        });

        successCount++;

        // Delay para não sobrecarregar API
        await new Promise(resolve => setTimeout(resolve, 1500));

      } catch (error) {
        console.error(`   ❌ Erro: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n================================');
    console.log('📊 RESUMO FINAL:');
    console.log(`   ✅ Sessões criadas: ${successCount}/12`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   📈 Taxa de sucesso: ${((successCount / 12) * 100).toFixed(1)}%`);
    console.log('================================\n');

    if (successCount === 12) {
      console.log('🎉 Jornada completa criada com sucesso!\n');
      console.log('📝 Próximos passos:');
      console.log('   1. Abrir: http://127.0.0.1:5500/frontend/jornada.html');
      console.log('   2. Testar fluxo completo');
      console.log('   3. Ajustar conteúdo se necessário\n');
    }

    process.exit(0);

  } catch (error) {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  }
}

// ============================================
// EXECUTAR
// ============================================
populateSessions();