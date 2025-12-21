/**
 * POPULAR SÉRIES DE CASOS
 * Cria séries longitudinais estilo "Judith Beck"
 * Permite acompanhar evolução do mesmo cliente
 */

require('dotenv').config({ path: '.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ========================================
// DEFINIÇÃO DAS SÉRIES INICIAIS
// ========================================
const SERIES_TO_CREATE = [
  {
    series_slug: 'marcos_tag_completa',
    series_name: 'Marcos - TAG: Da Avaliação à Alta',
    client_name: 'Marcos Silva',
    client_age: 35,
    client_gender: 'masculino',
    disorder: 'Transtorno de Ansiedade Generalizada (TAG)',
    disorder_category: 'anxiety',
    difficulty_level: 'intermediate',
    description: 'Acompanhe Marcos, 35 anos, funcionário público, ao longo de 8 sessões de TCC para TAG. Observe a evolução da aliança terapêutica, aplicação progressiva de técnicas e manejo de resistências.',
    learning_goals: 'Identificar evolução de aliança, timing de técnicas, manejo de resistência, prevenção de recaída',
    total_episodes: 5,
    episodes: [
      {
        episode_number: 1,
        episode_title: 'Sessão 2: Primeira Resistência',
        session_context: 'Sessão 2 - Marcos chega mais confortável após primeira sessão positiva',
        moment_type: 'resistencia_tecnica',
        description: 'Ao propor registro de pensamentos, Marcos resiste dizendo que não tem tempo e que prefere só conversar'
      },
      {
        episode_number: 2,
        episode_title: 'Sessão 4: Insight Emergente',
        session_context: 'Sessão 4 - Marcos trouxe alguns registros e percebeu padrões',
        moment_type: 'intervencao_crucial',
        description: 'Marcos identifica que sua preocupação é desproporcional. Momento oportuno para aprofundar questionamento socrático'
      },
      {
        episode_number: 3,
        episode_title: 'Sessão 6: Revelação Difícil',
        session_context: 'Sessão 6 - Progresso visível, mas Marcos está tenso hoje',
        moment_type: 'revelacao_dificil',
        description: 'Marcos revela conflito conjugal grave relacionado à sua ansiedade. Chora pela primeira vez'
      },
      {
        episode_number: 4,
        episode_title: 'Sessão 9: Questionamento da Terapia',
        session_context: 'Sessão 9 - Marcos teve semana difícil e questiona se terapia está funcionando',
        moment_type: 'ruptura_alianca',
        description: 'Após pequena recaída sintomática, Marcos questiona eficácia da TCC e diz que talvez precise de medicação'
      },
      {
        episode_number: 5,
        episode_title: 'Sessão 11: Consolidação e Autonomia',
        session_context: 'Sessão 11 - Penúltima sessão, Marcos com 70% de melhora',
        moment_type: 'tecnica_oportuna',
        description: 'Marcos relata ansiedade sobre término da terapia. Momento para reforçar autonomia e prevenir recaída'
      }
    ]
  },
  {
    series_slug: 'ana_depressao_completa',
    series_name: 'Ana - Depressão: Apatia à Ativação',
    client_name: 'Ana Paula',
    client_age: 28,
    client_gender: 'feminino',
    disorder: 'Transtorno Depressivo Maior',
    disorder_category: 'mood',
    difficulty_level: 'intermediate',
    description: 'Acompanhe Ana, 28 anos, designer freelancer, em 6 sessões de TCC para depressão. Observe manejo de desesperança, ativação comportamental e reestruturação cognitiva.',
    learning_goals: 'Manejo de desesperança, ativação comportamental, trabalho com tríade negativa, prevenção de recaída',
    total_episodes: 4,
    episodes: [
      {
        episode_number: 1,
        episode_title: 'Sessão 1: Desesperança Profunda',
        session_context: 'Primeira sessão - Ana chega apática, olhar cabisbaixo',
        moment_type: 'revelacao_dificil',
        description: 'Ana revela ideação suicida passiva. Diz que não vê sentido em nada'
      },
      {
        episode_number: 2,
        episode_title: 'Sessão 3: Resistência à Ativação',
        session_context: 'Sessão 3 - Proposta de ativação comportamental',
        moment_type: 'resistencia_tecnica',
        description: 'Ana resiste a fazer atividades prazerosas dizendo que não sente vontade e que seria forçado'
      },
      {
        episode_number: 3,
        episode_title: 'Sessão 6: Primeiro Progresso',
        session_context: 'Sessão 6 - Ana fez algumas atividades e relata pequena melhora',
        moment_type: 'intervencao_crucial',
        description: 'Ana minimiza próprio progresso ("foi só sorte"). Momento crucial para trabalhar tríade negativa'
      },
      {
        episode_number: 4,
        episode_title: 'Sessão 10: Medo da Recaída',
        session_context: 'Sessão 10 - Ana com 60% de melhora mas insegura',
        moment_type: 'intervencao_crucial',
        description: 'Ana expressa medo de recair e perder tudo que conquistou. Como fortalecer autoeficácia?'
      }
    ]
  },
  {
    series_slug: 'carlos_panico_completa',
    series_name: 'Carlos - Pânico: Do Medo à Exposição',
    client_name: 'Carlos Eduardo',
    client_age: 42,
    client_gender: 'masculino',
    disorder: 'Transtorno de Pânico',
    disorder_category: 'anxiety',
    difficulty_level: 'advanced',
    description: 'Acompanhe Carlos, 42 anos, executivo, em 6 sessões focadas em exposição interoceptiva e dessensibilização. Observe manejo de evitação e construção de hierarquia de exposição.',
    learning_goals: 'Psicoeducação sobre pânico, exposição interoceptiva, manejo de evitação, construção de hierarquia',
    total_episodes: 4,
    episodes: [
      {
        episode_number: 1,
        episode_title: 'Sessão 2: Crise Durante Sessão',
        session_context: 'Sessão 2 - Ao falar sobre ataques, Carlos começa a hiperv entilar',
        moment_type: 'intervencao_crucial',
        description: 'Carlos tem sintomas de pânico durante a sessão ao descrever última crise. Como intervir no momento?'
      },
      {
        episode_number: 2,
        episode_title: 'Sessão 4: Recusa de Exposição',
        session_context: 'Sessão 4 - Proposta de exposição interoceptiva',
        moment_type: 'resistencia_tecnica',
        description: 'Carlos recusa categoricamente fazer exercícios de hiperventilação, dizendo que é perigoso'
      },
      {
        episode_number: 3,
        episode_title: 'Sessão 7: Dilema Medicação',
        session_context: 'Sessão 7 - Carlos quer parar medicação contra orientação psiquiátrica',
        moment_type: 'dilema_etico',
        description: 'Carlos insiste em parar medicação sozinho pois "quer vencer sem muletas". Como lidar?'
      },
      {
        episode_number: 4,
        episode_title: 'Sessão 10: Primeira Exposição Bem-Sucedida',
        session_context: 'Sessão 10 - Carlos fez primeira exposição e não teve crise',
        moment_type: 'intervencao_crucial',
        description: 'Carlos relata sucesso mas atribui a "sorte". Momento crucial para reestruturação cognitiva'
      }
    ]
  }
];

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================
async function populateSeries() {
  try {
    console.log('🎬 INICIANDO CRIAÇÃO DE SÉRIES DE CASOS\n');
    console.log('=====================================\n');

    let totalCreated = 0;
    let totalEpisodes = 0;

    for (const seriesData of SERIES_TO_CREATE) {
      console.log(`📚 Criando série: ${seriesData.series_name}`);
      console.log(`   Cliente: ${seriesData.client_name}, ${seriesData.client_age} anos`);
      console.log(`   Episódios: ${seriesData.total_episodes}\n`);

      // 1. Criar série no banco
      const { data: series, error: seriesError } = await supabase
        .from('case_series')
        .insert({
          series_slug: seriesData.series_slug,
          series_name: seriesData.series_name,
          client_name: seriesData.client_name,
          client_age: seriesData.client_age,
          client_gender: seriesData.client_gender,
          disorder: seriesData.disorder,
          disorder_category: seriesData.disorder_category,
          difficulty_level: seriesData.difficulty_level,
          description: seriesData.description,
          learning_goals: seriesData.learning_goals,
          total_episodes: seriesData.total_episodes,
          status: 'active',
          created_by: 'populate_series_script'
        })
        .select()
        .single();

      if (seriesError) {
        console.error(`   ❌ Erro ao criar série: ${seriesError.message}\n`);
        continue;
      }

      console.log(`   ✅ Série criada (ID: ${series.id})\n`);
      totalCreated++;

      // 2. Gerar episódios com OpenAI
      for (const episode of seriesData.episodes) {
        console.log(`   📝 Gerando Episódio ${episode.episode_number}: ${episode.episode_title}`);

        try {
          // Gerar caso via OpenAI
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            response_format: { type: "json_object" },
            temperature: 0.85,
            max_tokens: 1500,
            messages: [
              {
                role: "system",
                content: `Você cria MICRO-MOMENTOS clínicos para séries longitudinais de casos.

CONTEXTO DA SÉRIE:
Cliente: ${seriesData.client_name}, ${seriesData.client_age} anos
Diagnóstico: ${seriesData.disorder}
Evolução: ${episode.episode_title}

MOMENTO CRÍTICO: ${episode.description}

SAÍDA JSON:
{
  "moment_type": "${episode.moment_type}",
  "context": {
    "session_number": "${episode.session_context}",
    "client_name": "${seriesData.client_name}",
    "client_age": ${seriesData.client_age},
    "diagnosis": "${seriesData.disorder}",
    "what_just_happened": "2-3 frases contextualizando momento (considere evolução prévia)"
  },
  "critical_moment": {
    "dialogue": "Fala do cliente (60-100 palavras). REALISTA. Refletir ${episode.description}",
    "non_verbal": "Linguagem corporal (1-2 frases)",
    "emotional_tone": "Tom emocional"
  },
  "decision_point": "O QUE VOCÊ DIZ/FAZ AGORA?",
  "options": [
    {"letter": "A", "response": "Resposta A (20-40 palavras)", "approach": "Nome abordagem"},
    {"letter": "B", "response": "Resposta B (20-40 palavras)", "approach": "Nome abordagem"},
    {"letter": "C", "response": "Resposta C (20-40 palavras)", "approach": "Nome abordagem"},
    {"letter": "D", "response": "Resposta D (20-40 palavras)", "approach": "Nome abordagem"}
  ],
  "expert_choice": "A, B, C ou D",
  "expert_reasoning": {
    "why_this_works": "Por que funciona neste MOMENTO da terapia (4-5 frases)",
    "why_others_fail": {
      "option_X": "Por que falha (considerando momento terapêutico)",
      "option_Y": "Por que falha",
      "option_Z": "Por que falha"
    },
    "core_principle": "Princípio central (1 frase)",
    "what_happens_next": "Provável evolução após esta escolha (2-3 frases)"
  },
  "learning_point": {
    "pattern_to_recognize": "Padrão clínico a observar",
    "instant_response": "Como responder no momento",
    "common_mistake": "Erro comum neste tipo de situação"
  }
}

IMPORTANTE: Considerar que este é episódio ${episode.episode_number} de ${seriesData.total_episodes}. Refletir evolução progressiva do caso.`
              },
              {
                role: "user",
                content: `Crie episódio ${episode.episode_number}: ${episode.description}. APENAS JSON.`
              }
            ]
          });

          const caseData = JSON.parse(completion.choices[0].message.content);

          // 3. Salvar no banco
          const { error: caseError } = await supabase
            .from('cases')
            .insert({
              disorder: seriesData.disorder,
              difficulty_level: seriesData.difficulty_level,
              category: 'clinical_moment',
              moment_type: episode.moment_type,
              case_content: caseData,
              vignette: caseData.critical_moment?.dialogue || '',
              status: 'active',
              times_used: 0,
              quality_score: 5.0,
              created_by: 'series_generator',
              // Campos da série
              series_id: series.id,
              episode_number: episode.episode_number,
              episode_title: episode.episode_title
            });

          if (caseError) {
            console.log(`      ❌ Erro ao salvar episódio: ${caseError.message}`);
          } else {
            console.log(`      ✅ Episódio ${episode.episode_number} criado`);
            totalEpisodes++;
          }

          // Delay para não sobrecarregar API
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`      ❌ Erro ao gerar: ${error.message}`);
        }
      }

      console.log('\n');
    }

    console.log('=====================================');
    console.log('📊 RESUMO FINAL:');
    console.log(`   ✅ Séries criadas: ${totalCreated}/${SERIES_TO_CREATE.length}`);
    console.log(`   ✅ Episódios gerados: ${totalEpisodes}`);
    console.log('=====================================\n');

    if (totalCreated > 0) {
      console.log('🎉 Séries criadas com sucesso!\n');
      console.log('📝 Próximos passos:');
      console.log('   1. Testar rotas da API');
      console.log('   2. Atualizar interface frontend');
      console.log('   3. Validar experiência pedagógica\n');
    }

    process.exit(0);

  } catch (error) {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  }
}

// ========================================
// EXECUTAR
// ========================================
console.log('⚠️  IMPORTANTE: Este script gerará casos via OpenAI API');
console.log('   Custo estimado: ~$0.50 - $1.00');
console.log('   Tempo estimado: ~3-5 minutos\n');
console.log('Pressione Ctrl+C para cancelar ou aguarde 3 segundos...\n');

setTimeout(() => {
  populateSeries();
}, 3000);
