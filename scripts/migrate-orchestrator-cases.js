/**
 * migrate-orchestrator-cases.js
 *
 * Corrige metadados dos casos inseridos pelo projeto "Orquestrar casos clinicos":
 *
 * 1. M4 (Conceituação): Corrige category e created_by para compatibilidade com backend
 * 2. M3 (Jornadas): Migra sessões da tabela `cases` para `clinical_journeys` + `journey_sessions`
 *
 * Uso:
 *   node scripts/migrate-orchestrator-cases.js --dry-run   # Mostra o que faria
 *   node scripts/migrate-orchestrator-cases.js              # Executa migração
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DRY_RUN = process.argv.includes('--dry-run');

async function fixM4Cases() {
  console.log('\n========================================');
  console.log('M4 - CONCEITUAÇÃO: Corrigindo metadados');
  console.log('========================================');

  // Buscar casos M4 com valores incorretos
  const { data: m4Cases, error } = await supabase
    .from('cases')
    .select('id, case_title, category, created_by')
    .eq('category', 'conceptualization')
    .eq('created_by', 'case_generator');

  if (error) {
    console.error('Erro ao buscar M4:', error.message);
    return 0;
  }

  console.log(`Encontrados: ${m4Cases?.length || 0} casos M4 para corrigir`);

  if (!m4Cases || m4Cases.length === 0) {
    console.log('Nenhum caso M4 para corrigir.');
    return 0;
  }

  m4Cases.forEach(c => {
    console.log(`  - ${c.case_title} (${c.id})`);
  });

  if (DRY_RUN) {
    console.log('[DRY-RUN] Faria UPDATE em', m4Cases.length, 'casos');
    return m4Cases.length;
  }

  const { error: updateError, count } = await supabase
    .from('cases')
    .update({
      category: 'clinical_moment',
      created_by: 'diverse_population_script'
    })
    .eq('category', 'conceptualization')
    .eq('created_by', 'case_generator');

  if (updateError) {
    console.error('Erro no UPDATE M4:', updateError.message);
    return 0;
  }

  console.log(`✅ ${m4Cases.length} casos M4 corrigidos`);
  return m4Cases.length;
}

async function migrateM3Journeys() {
  console.log('\n========================================');
  console.log('M3 - JORNADAS: Migrando para tabelas corretas');
  console.log('========================================');

  // Buscar sessões M3 da tabela cases (onde foram inseridas incorretamente)
  const { data: m3Cases, error } = await supabase
    .from('cases')
    .select('id, case_title, case_content, disorder, difficulty_level')
    .eq('category', 'journey')
    .eq('moment_type', 'journey_session')
    .order('case_title', { ascending: true });

  if (error) {
    console.error('Erro ao buscar M3:', error.message);
    return 0;
  }

  console.log(`Encontradas: ${m3Cases?.length || 0} sessões M3 na tabela cases`);

  if (!m3Cases || m3Cases.length === 0) {
    console.log('Nenhuma sessão M3 para migrar.');
    return 0;
  }

  // Agrupar sessões por número da jornada (extrair de "Jornada 001" no título)
  const journeyMap = {};

  for (const c of m3Cases) {
    const content = c.case_content;
    if (!content) continue;

    // Extrair número da jornada do título: "Jornada 001 - Sessao 1: ..."
    const journeyMatch = c.case_title.match(/Jornada\s*(\d+)/i);
    const journeyNum = journeyMatch ? parseInt(journeyMatch[1]) : 0;
    const disorder = c.disorder || content.disorder || 'Desconhecido';

    if (!journeyMap[journeyNum]) {
      journeyMap[journeyNum] = {
        journeyNum,
        disorder,
        difficulty_level: c.difficulty_level || 'intermediate',
        sessions: []
      };
    }

    journeyMap[journeyNum].sessions.push({
      case_id: c.id,
      case_title: c.case_title,
      session_number: content.session_number || extractSessionNumber(c.case_title),
      content
    });
  }

  const journeys = Object.values(journeyMap).sort((a, b) => a.journeyNum - b.journeyNum);
  console.log(`Jornadas detectadas: ${journeys.length}`);

  journeys.forEach(j => {
    j.sessions.sort((a, b) => a.session_number - b.session_number);
    console.log(`\n  Jornada ${j.journeyNum}: ${j.disorder} (${j.sessions.length} sessões)`);
    j.sessions.forEach(s => {
      console.log(`    Sessão ${s.session_number}: ${s.case_title}`);
    });
  });

  if (DRY_RUN) {
    console.log(`\n[DRY-RUN] Criaria ${journeys.length} jornadas e ${m3Cases.length} sessões`);
    return m3Cases.length;
  }

  let totalMigrated = 0;

  for (const journey of journeys) {
    // 1. Criar entrada em clinical_journeys
    const journeyTitle = `Jornada ${journey.journeyNum}: ${journey.disorder}`;

    // Verificar se já existe
    const { data: existing } = await supabase
      .from('clinical_journeys')
      .select('id')
      .eq('title', journeyTitle)
      .maybeSingle();

    let journeyId;

    if (existing) {
      console.log(`  Jornada "${journeyTitle}" já existe (${existing.id}), reutilizando...`);
      journeyId = existing.id;
    } else {
      // Mapear disorder → disorder_category
      const disorderCategory = mapDisorderToCategory(journey.disorder);

      // Extrair dados do cliente da 1a sessão
      const firstSession = journey.sessions[0]?.content;
      const narrative = firstSession?.session_content?.narrative || '';
      const verbatim = firstSession?.session_content?.client_verbatim || '';
      const preContext = firstSession?.pre_session_context?.what_happened_since_last || '';

      // Extrair nome do cliente da narrativa
      const nameMatch = narrative.match(/(?:história de |rapport.*?com |sessão.*?com )([A-Z][a-záéíóúàâêôãõç]+)/i)
        || narrative.match(/([A-Z][a-záéíóúàâêôãõç]+)\s+(?:descreveu|relatou|chegou|demonstrou|vinha|procur)/);
      const clientName = nameMatch ? nameMatch[1] : `Paciente Jornada ${journey.journeyNum}`;

      const { data: newJourney, error: journeyError } = await supabase
        .from('clinical_journeys')
        .insert({
          title: journeyTitle,
          client_name: clientName,
          client_age: 35,
          disorder: journey.disorder,
          disorder_category: disorderCategory,
          difficulty_level: journey.difficulty_level,
          case_background: preContext,
          presenting_problem: verbatim ? verbatim.substring(0, 500) : narrative.substring(0, 500),
          status: 'active',
          created_by: 'case_generator',
          quality_score: 4.5
        })
        .select()
        .single();

      if (journeyError) {
        console.error(`  Erro ao criar jornada "${journeyTitle}":`, journeyError.message);
        continue;
      }

      journeyId = newJourney.id;
      console.log(`  ✅ Jornada criada: ${journeyTitle} (${journeyId})`);
    }

    // 2. Criar sessões em journey_sessions
    for (const session of journey.sessions) {
      const content = session.content;

      // Verificar se sessão já existe
      const { data: existingSession } = await supabase
        .from('journey_sessions')
        .select('id')
        .eq('journey_id', journeyId)
        .eq('session_number', session.session_number)
        .maybeSingle();

      if (existingSession) {
        console.log(`    Sessão ${session.session_number} já existe, pulando...`);
        totalMigrated++;
        continue;
      }

      // Transformar decision_options → options no formato esperado pelo frontend
      const options = transformOptions(content.decision_options, content.feedback_structure);

      // Mapear session_phase
      const sessionPhase = mapSessionPhase(content.session_phase, session.session_number);

      const sessionData = {
        journey_id: journeyId,
        session_number: session.session_number,
        session_title: content.session_title || session.case_title,
        session_phase: sessionPhase,
        context: content.session_content?.narrative || '',
        homework_review: content.pre_session_context?.homework_completion || null,
        client_state: content.session_content?.client_verbatim || content.pre_session_context?.client_mood_today || null,
        decision_prompt: content.session_content?.critical_decision_point || '',
        options: options
      };

      const { error: sessionError } = await supabase
        .from('journey_sessions')
        .insert(sessionData);

      if (sessionError) {
        console.error(`    Erro sessão ${session.session_number}:`, sessionError.message);
        continue;
      }

      totalMigrated++;
      process.stdout.write('.');
    }

    console.log('');
  }

  console.log(`\n✅ ${totalMigrated} sessões migradas para journey_sessions`);
  return totalMigrated;
}

// ============================
// HELPERS
// ============================

function extractSessionNumber(title) {
  const match = title.match(/Sess[aã]o\s*(\d+)/i);
  return match ? parseInt(match[1]) : 0;
}

function mapDisorderToCategory(disorder) {
  const lower = (disorder || '').toLowerCase();
  if (lower.includes('ansiedade') || lower.includes('tag') || lower.includes('pânico') || lower.includes('fobia')) return 'anxiety';
  if (lower.includes('depress') || lower.includes('bipolar') || lower.includes('distimia')) return 'mood';
  if (lower.includes('trauma') || lower.includes('tept') || lower.includes('estresse')) return 'trauma';
  if (lower.includes('personalidade') || lower.includes('borderline')) return 'personality';
  if (lower.includes('alimentar') || lower.includes('anorexia') || lower.includes('bulimia')) return 'eating';
  return 'other';
}

function mapSessionPhase(originalPhase, sessionNumber) {
  // Se o orquestrador já enviou uma fase reconhecida, usar
  const validPhases = ['assessment', 'psychoeducation', 'intervention', 'consolidation', 'termination'];
  if (validPhases.includes(originalPhase)) return originalPhase;

  // Mapear fases do orquestrador para as esperadas pelo frontend
  const phaseMap = {
    'inicial': 'assessment',
    'intermediaria': 'intervention',
    'intermediária': 'intervention',
    'avancada': 'consolidation',
    'avançada': 'consolidation',
    'final': 'termination',
    'encerramento': 'termination'
  };

  if (phaseMap[originalPhase]) return phaseMap[originalPhase];

  // Fallback: inferir pela posição da sessão
  if (sessionNumber <= 2) return 'assessment';
  if (sessionNumber <= 4) return 'psychoeducation';
  if (sessionNumber <= 8) return 'intervention';
  if (sessionNumber <= 10) return 'consolidation';
  return 'termination';
}

function transformOptions(decisionOptions, feedbackStructure) {
  if (!decisionOptions || !Array.isArray(decisionOptions)) return [];

  return decisionOptions.map(opt => {
    // Buscar explicação adicional da feedback_structure se disponível
    let explanation = opt.long_term_effect || '';
    if (feedbackStructure) {
      if (opt.is_optimal && feedbackStructure.optimal_choice_feedback) {
        explanation = feedbackStructure.optimal_choice_feedback.explicar || explanation;
      } else if (!opt.is_optimal && feedbackStructure.suboptimal_explanations) {
        explanation = feedbackStructure.suboptimal_explanations[opt.option_letter] || explanation;
      }
    }

    return {
      label: opt.option_letter,
      text: opt.approach || opt.intervention,
      is_best: opt.is_optimal || false,
      feedback: {
        is_optimal: opt.is_optimal || false,
        immediate: opt.immediate_outcome || '',
        explanation: explanation,
        impact: {
          rapport: opt.impact?.rapport || 0,
          insight: opt.impact?.insight || 0,
          behavioral_change: opt.impact?.behavioral_change || 0,
          symptom_reduction: opt.impact?.symptom_reduction || 0
        }
      }
    };
  });
}

// ============================
// MAIN
// ============================
async function main() {
  console.log(DRY_RUN
    ? '*** DRY-RUN: Mostrando o que seria feito ***'
    : '*** EXECUTANDO MIGRAÇÃO ***');
  console.log('Supabase:', process.env.SUPABASE_URL?.substring(0, 30) + '...');

  const m4Count = await fixM4Cases();
  const m3Count = await migrateM3Journeys();

  console.log('\n========================================');
  console.log('RESUMO');
  console.log('========================================');
  console.log(`M4 (Conceituação): ${m4Count} casos corrigidos`);
  console.log(`M3 (Jornadas): ${m3Count} sessões migradas`);
  console.log(DRY_RUN ? '\n⚠️  DRY-RUN - nada foi alterado. Rode sem --dry-run para executar.' : '\n✅ Migração concluída!');
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
