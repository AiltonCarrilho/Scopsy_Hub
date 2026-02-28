/**
 * SCOPSY - Case Review Service
 *
 * Serviço de revisão automática de casos clínicos usando GPT-4o
 * Garante qualidade clínica antes de casos chegarem aos usuários
 *
 * @author Claude Code + Ailton
 * @version 1.0
 * @date 2024-12-31
 */

const OpenAI = require('openai');
const logger = require('../config/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ═══════════════════════════════════════════════════════════════════════
// PROMPTS DOS REVISORES POR MÓDULO
// ═══════════════════════════════════════════════════════════════════════

const REVIEWER_PROMPTS = {
  /**
   * Revisor para Micro-Momentos Clínicos (Desafios)
   * Foco: Timing terapêutico + manejo de resistência
   */
  micromoment: `Você é um Supervisor Clínico em TCC com 15 anos de experiência.

Avalie este MICRO-MOMENTO CLÍNICO para treinamento de psicólogos.

TAREFA: Revisar se o caso ensina timing terapêutico adequado.

CRITÉRIOS OBRIGATÓRIOS (total 100 pontos):

1. TIMING TERAPÊUTICO (40 pontos)
   - Resposta adequada ao momento relacional ATUAL
   - Considera estado emocional do cliente AGORA
   - Não antecipa etapas (técnica antes de aliança)

   Pergunta-chave: "Se dissesse isso AGORA, aumentaria ou reduziria resistência?"

2. MANEJO DE RESISTÊNCIA (30 pontos)
   ESCALA DE VALIDAÇÃO:
   - Nível 0 (Invalidante): Score 0/30 - Ex: "Você pode achar simples, mas..."
   - Nível 1 (Neutro): Score 10/30 - Ignora resistência
   - Nível 2 (Superficial): Score 20/30 - "Entendo sua dúvida"
   - Nível 3 (Profunda): Score 30/30 - "Faz sentido desconfiar após tantas tentativas"

   REGRA RÍGIDA: Se resistência alta → Validação DEVE ser ≥ nível 2

3. PRESERVAÇÃO DA ALIANÇA (20 pontos)
   - Tom colaborativo (não autoritário)
   - Cliente mantém agência
   - Evita ruptura relacional

4. ECONOMIA VERBAL (10 pontos)
   - Cabe em 30-60 segundos
   - Foco em 1 objetivo por vez

REPROVAÇÃO AUTOMÁTICA (Score 0) SE:
- Contém "reagir defensivamente"
- Linguagem absolutista ("sempre", "nunca", "claramente")
- Rótulos categóricos ("cliente é manipulador")
- Qualquer técnica iatrogênica

SAÍDA JSON OBRIGATÓRIA:
{
  "aprovado": boolean,
  "score_total": 0-100,
  "classificacao": "EXPERT|ADEQUADA|QUESTIONAVEL|INADEQUADA",
  "scores_detalhados": {
    "timing": 0-40,
    "resistencia": 0-30,
    "alianca": 0-20,
    "economia": 0-10
  },
  "problemas_criticos": ["lista de problemas graves"],
  "problemas_moderados": ["lista de problemas menores"],
  "pontos_fortes": ["lista de aspectos bem feitos"],
  "sugestao_correcao": {
    "expert_choice_recomendada": "A|B|C|D ou null",
    "justificativa": "Por que essa escolha é clinicamente superior",
    "principio_clinico": "Nome do princípio TCC sendo ensinado",
    "resposta_exemplar": "Como deveria ser a resposta ideal"
  },
  "requer_revisao_humana": boolean,
  "acao": "APROVAR|APROVAR_COM_LOG|REVISAO_HUMANA|REPROVAR"
}

CLASSIFICAÇÃO:
- 85-100: EXPERT → APROVAR
- 70-84: ADEQUADA → APROVAR_COM_LOG
- 50-69: QUESTIONAVEL → REVISAO_HUMANA
- 0-49: INADEQUADA → REPROVAR`,

  /**
   * Revisor para Conceitualizações Cognitivas
   * Foco: Raciocínio clínico estruturado
   */
  conceptualization: `Você é um Supervisor Clínico especialista em Conceitualização Cognitiva (Beck).

Avalie esta CONCEITUAÇÃO COGNITIVA para treinamento de psicólogos.

TAREFA: Verificar se o caso ensina raciocínio clínico estruturado correto.

CRITÉRIOS OBRIGATÓRIOS (total 100 pontos):

1. MODELO DAS 5 PARTES (30 pontos)
   Todas devem estar presentes:
   □ Situação identificada (6 pts)
   □ Pensamentos automáticos (6 pts)
   □ Emoções (6 pts)
   □ Comportamentos (6 pts)
   □ Reações fisiológicas (6 pts)

   Ausência de qualquer parte: máximo 20/30

2. COERÊNCIA CAUSAL (40 pontos)
   - Ligações explícitas: Pensamento → Emoção → Comportamento
   - Sequência temporal lógica
   - Compatível com dados do caso

   EXEMPLO BOM (40/40):
   Situação: Crítica do chefe
   → Pensamento: "Vou ser demitido"
   → Emoção: Ansiedade (8/10)
   → Comportamento: Evita reuniões

   EXEMPLO RUIM (15/40):
   Pensamento: "Sou um fracasso" ← Isso é crença nuclear, não automático!
   Comportamento: Come demais ← Não conectado à situação

3. NÍVEL DE INFERÊNCIA (20 pontos)
   Diferencia corretamente:
   - Pensamento automático ≠ Crença nuclear
   - Dado observável ≠ Hipótese
   - Sintoma ≠ Diagnóstico

   ERROS GRAVES:
   ❌ "Cliente pensa 'sou incapaz'" na sessão 2
   ✅ "Possível crença de incapacidade (hipótese)"

4. FLEXIBILIDADE (10 pontos)
   - Apresenta hipóteses alternativas
   - Indica limitações da informação
   - Reconhece o que NÃO pode ser afirmado

SAÍDA JSON:
{
  "aprovado": boolean,
  "score_modelo_5_partes": 0-30,
  "score_coerencia_causal": 0-40,
  "score_nivel_inferencia": 0-20,
  "score_flexibilidade": 0-10,
  "score_total": 0-100,
  "problemas_conceituais": ["lista de erros"],
  "pontos_fortes": ["aspectos bem feitos"],
  "sugestoes": ["melhorias específicas"],
  "requer_revisao_humana": boolean
}`,

  /**
   * Revisor para Diagnóstico (DSM-5-TR)
   * Foco: Critérios diagnósticos + diferencial
   */
  diagnostic: `Você é um Psiquiatra especialista em Diagnóstico Diferencial (DSM-5-TR).

Avalie este caso de DIAGNÓSTICO para treinamento de psicólogos.

TAREFA: Verificar precisão diagnóstica e raciocínio diferencial.

CRITÉRIOS OBRIGATÓRIOS (total 100 pontos):

1. CRITÉRIOS DSM-5-TR CORRETOS (40 pontos)
   □ Todos critérios obrigatórios presentes
   □ Duração/frequência especificada
   □ Prejuízo funcional identificado
   □ Critérios de exclusão verificados

   Se QUALQUER critério obrigatório ausente: máximo 20/40

2. DIAGNÓSTICO DIFERENCIAL (40 pontos)
   OBRIGATÓRIO: Listar 2-4 diferenciais com:
   - Por que foi CONSIDERADO
   - Por que foi DESCARTADO

   FORMATO ESPERADO:
   "Diagnóstico Principal: TAG

   Diferenciais:
   1. Transtorno Pânico
      - Considerado: sintomas somáticos
      - Descartado: sem ataques delimitados"

   Se NÃO lista diferenciais: Score 0/40

3. ESPECIFICADORES (10 pontos)
   □ Gravidade (leve/moderado/grave)
   □ Com/sem insight
   □ Curso

4. EVITA SUPERDIAGNÓSTICO (10 pontos)
   - Não diagnostica sem evidência
   - Respeita hierarquia DSM
   - Não patologiza reações normais

SAÍDA JSON:
{
  "aprovado": boolean,
  "score_criterios_dsm": 0-40,
  "score_diferencial": 0-40,
  "score_especificadores": 0-10,
  "score_superdiagnostico": 0-10,
  "score_total": 0-100,
  "problemas_dsm5": ["critérios ausentes ou incorretos"],
  "diferenciais_ausentes": ["diagnósticos não considerados"],
  "gravidade": "CRITICO|MODERADO|LEVE|NENHUM",
  "acao": "APROVAR|REPROVAR|REVISAR"
}`
};

// ═══════════════════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════

/**
 * Formatar caso do banco para enviar ao revisor GPT
 * Extrai apenas campos relevantes do case_content
 */
function formatCaseForReview(caseData, moduleType) {
  const content = caseData.case_content || {};

  if (moduleType === 'micromoment') {
    return `Revise este MICRO-MOMENTO CLÍNICO:

CONTEXTO DA SESSÃO:
${content.context?.session_number || 'Sessão não especificada'}
Cliente: ${content.context?.client_name || 'Nome não especificado'}, ${content.context?.client_age || '?'} anos
Diagnóstico: ${content.context?.diagnosis || caseData.disorder || 'Não especificado'}
Situação: ${content.context?.what_just_happened || 'Não especificada'}

MOMENTO CRÍTICO:
${content.critical_moment?.dialogue || 'Diálogo não disponível'}

Observações não-verbais: ${content.critical_moment?.non_verbal || 'Não registrado'}
Tom emocional: ${content.critical_moment?.emotional_tone || 'Não especificado'}

PERGUNTA AO TERAPEUTA:
${content.decision_point || 'O que você responde?'}

OPÇÕES DE RESPOSTA:
${content.options?.map(o => `${o.letter}) ${o.response} (Abordagem: ${o.approach})`).join('\n\n') || 'Opções não disponíveis'}

RESPOSTA MARCADA COMO EXPERT:
Opção ${content.expert_choice}

JUSTIFICATIVA FORNECIDA:
${JSON.stringify(content.expert_reasoning, null, 2)}`;
  }

  if (moduleType === 'conceptualization') {
    return `Revise esta CONCEITUAÇÃO COGNITIVA (TCC):

DADOS DO CLIENTE:
Nome: ${content.client_name || 'Não especificado'}
Idade: ${content.client_age || '?'} anos
Diagnóstico: ${content.diagnosis || caseData.disorder || 'Não especificado'}

SINTOMAS PRINCIPAIS:
${content.key_symptoms?.map((s, i) => `${i + 1}. ${s}`).join('\n') || 'Sintomas não listados'}

VULNERABILIDADES / FATORES PREDISPONENTES:
${content.vulnerabilities || 'Não especificadas'}

CRENÇAS CENTRAIS IDENTIFICADAS:
${content.core_beliefs_hints?.map((cb, i) => `${i + 1}. "${cb}"`).join('\n') || 'Crenças não identificadas'}

FATORES DE MANUTENÇÃO:
${content.maintaining_factors || 'Não especificados'}

TRÍADE COGNITIVA:
Pensamentos: ${content.cognitive_triad_hints?.thoughts || 'Não especificados'}
Emoções: ${content.cognitive_triad_hints?.emotions || 'Não especificadas'}
Comportamentos: ${content.cognitive_triad_hints?.behaviors || 'Não especificados'}`;
  }

  if (moduleType === 'diagnostic') {
    const clinical = content.clinical_content || {};
    const diagnostic = content.diagnostic_structure || {};
    const question = content.question_format || {};

    return `Revise este caso de DIAGNÓSTICO DSM-5-TR:

VINHETA CLÍNICA:
${clinical.vignette || caseData.vignette || 'Vinheta não disponível'}

DADOS DEMOGRÁFICOS:
Nome: ${clinical.demographics?.name || 'Não especificado'}
Idade: ${clinical.demographics?.age || '?'} anos
Ocupação: ${clinical.demographics?.occupation || 'Não especificada'}
Contexto: ${clinical.demographics?.context || 'Não especificado'}

DIAGNÓSTICO PROPOSTO:
${diagnostic.correct_diagnosis || caseData.correct_diagnosis || caseData.disorder || 'Não especificado'}

CÓDIGO DSM-5-TR:
${diagnostic.diagnostic_code || 'Não especificado'}

CRITÉRIOS DSM-5-TR PRESENTES:
${diagnostic.criteria_present?.map((c, i) => `${i + 1}. ${c}`).join('\n') || 'Critérios não listados'}

OPÇÕES DE DIAGNÓSTICO DIFERENCIAL:
${question.options?.map((opt, i) => `${i + 1}. ${opt}`).join('\n') || 'Opções não disponíveis'}

DIAGNÓSTICO CORRETO (índice):
${question.correct_option_index !== null ? question.correct_option_index + 1 : 'Não especificado'}`;
  }

  return JSON.stringify(caseData, null, 2);
}

// ═══════════════════════════════════════════════════════════════════════
// FUNÇÕES PRINCIPAIS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Revisar caso clínico usando GPT-4o
 *
 * @param {Object} caseData - Dados completos do caso
 * @param {string} moduleType - Tipo do módulo: 'micromoment' | 'conceptualization' | 'diagnostic'
 * @returns {Promise<Object>} Resultado da revisão
 */
async function reviewCase(caseData, moduleType) {
  try {
    logger.info('Iniciando revisão de caso', { moduleType, caseId: caseData.id });

    // Validar tipo de módulo
    if (!REVIEWER_PROMPTS[moduleType]) {
      throw new Error(`Tipo de módulo inválido: ${moduleType}`);
    }

    // Chamar GPT-4o para revisão
    const startTime = Date.now();

    const formattedCase = formatCaseForReview(caseData, moduleType);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',  // Mais barato (8x) + rate limit maior (200k TPM vs 30k)
      response_format: { type: 'json_object' },
      temperature: 0.3,  // Baixa variabilidade para consistência
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: REVIEWER_PROMPTS[moduleType]
        },
        {
          role: 'user',
          content: formattedCase
        }
      ]
    });

    const elapsedTime = Date.now() - startTime;
    const resultado = JSON.parse(completion.choices[0].message.content);

    // Enriquecer resultado com metadados
    const reviewResult = {
      ...resultado,
      metadata: {
        module_type: moduleType,
        case_id: caseData.id || null,
        reviewed_at: new Date().toISOString(),
        review_time_ms: elapsedTime,
        tokens_used: completion.usage?.total_tokens || 0,
        model: 'gpt-4o-mini'
      }
    };

    // Logging baseado no resultado
    if (!reviewResult.aprovado || reviewResult.requer_revisao_humana) {
      logger.warn('Caso requer atenção', {
        caseId: caseData.id,
        score: reviewResult.score_total,
        acao: reviewResult.acao,
        problemas: reviewResult.problemas_criticos
      });
    } else {
      logger.info('Caso aprovado automaticamente', {
        caseId: caseData.id,
        score: reviewResult.score_total
      });
    }

    return reviewResult;

  } catch (error) {
    logger.error('Erro ao revisar caso', {
      error: error.message,
      moduleType,
      caseId: caseData.id
    });
    throw error;
  }
}

/**
 * Revisar múltiplos casos em batch (paralelo)
 *
 * @param {Array<Object>} cases - Array de casos para revisar
 * @param {string} moduleType - Tipo do módulo
 * @param {number} batchSize - Tamanho do batch (padrão: 10)
 * @returns {Promise<Array<Object>>} Array de resultados
 */
async function reviewBatch(cases, moduleType, batchSize = 10) {
  logger.info('Iniciando revisão em batch', {
    total_cases: cases.length,
    batch_size: batchSize,
    module_type: moduleType
  });

  const results = [];

  // Processar em batches para não sobrecarregar API
  for (let i = 0; i < cases.length; i += batchSize) {
    const batch = cases.slice(i, i + batchSize);

    logger.info(`Processando batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(cases.length / batchSize)}`);

    // Revisar casos do batch em paralelo
    const batchResults = await Promise.allSettled(
      batch.map(caseData => reviewCase(caseData, moduleType))
    );

    // Processar resultados
    batchResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        logger.error('Erro ao revisar caso no batch', {
          caseId: batch[idx].id,
          error: result.reason.message
        });
        results.push({
          error: true,
          case_id: batch[idx].id,
          message: result.reason.message
        });
      }
    });

    // Pequeno delay entre batches para respeitar rate limits
    if (i + batchSize < cases.length) {
      await sleep(1000);  // 1 segundo entre batches
    }
  }

  // Estatísticas finais
  const stats = {
    total: results.length,
    aprovados: results.filter(r => !r.error && r.aprovado).length,
    revisao_humana: results.filter(r => !r.error && r.requer_revisao_humana).length,
    reprovados: results.filter(r => !r.error && !r.aprovado).length,
    erros: results.filter(r => r.error).length
  };

  logger.info('Revisão em batch concluída', stats);

  return {
    results,
    stats
  };
}

/**
 * Categorizar caso para fila apropriada baseado no resultado da revisão
 *
 * @param {Object} reviewResult - Resultado da revisão
 * @returns {string} Categoria: 'production' | 'human_review' | 'rejected'
 */
function categorizeCase(reviewResult) {
  if (reviewResult.error) {
    return 'rejected';
  }

  const { aprovado, requer_revisao_humana, score_total } = reviewResult;

  if (!aprovado || score_total < 50) {
    return 'rejected';
  }

  if (requer_revisao_humana || score_total < 70) {
    return 'human_review';
  }

  return 'production';
}

/**
 * Obter estatísticas de qualidade dos casos revisados
 *
 * @param {Array<Object>} reviewResults - Resultados de revisões
 * @returns {Object} Estatísticas agregadas
 */
function getQualityStats(reviewResults) {
  const validResults = reviewResults.filter(r => !r.error);

  if (validResults.length === 0) {
    return { error: 'Nenhum resultado válido' };
  }

  const scores = validResults.map(r => r.score_total);

  return {
    total_cases: validResults.length,
    score_medio: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
    score_min: Math.min(...scores),
    score_max: Math.max(...scores),
    distribuicao: {
      expert: validResults.filter(r => r.score_total >= 85).length,
      adequada: validResults.filter(r => r.score_total >= 70 && r.score_total < 85).length,
      questionavel: validResults.filter(r => r.score_total >= 50 && r.score_total < 70).length,
      inadequada: validResults.filter(r => r.score_total < 50).length
    },
    problemas_comuns: aggregateProblems(validResults),
    taxa_aprovacao: ((validResults.filter(r => r.aprovado).length / validResults.length) * 100).toFixed(1) + '%'
  };
}

/**
 * Agregar problemas comuns encontrados
 */
function aggregateProblems(results) {
  const problems = {};

  results.forEach(r => {
    if (r.problemas_criticos) {
      r.problemas_criticos.forEach(p => {
        problems[p] = (problems[p] || 0) + 1;
      });
    }
  });

  // Retornar top 5 problemas
  return Object.entries(problems)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([problema, count]) => ({ problema, ocorrencias: count }));
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════

module.exports = {
  reviewCase,
  reviewBatch,
  categorizeCase,
  getQualityStats,
  REVIEWER_PROMPTS
};
