/**
 * ============================================================================
 * SCOPSY - MODELO DE ESTADO DO PACIENTE
 * ============================================================================
 * 
 * Este arquivo gerencia o ESTADO do paciente ao longo do tratamento.
 * O estado muda conforme as intervenções do terapeuta.
 * 
 * ============================================================================
 * CONCEITOS IMPORTANTES:
 * ============================================================================
 * 
 * ESTADO: Representa "como o paciente está" em determinado momento.
 * Inclui nível de aliança, o quanto está aberto, o que já foi revelado.
 * 
 * MEDIDORES: Três números (0-10) que calibram as respostas do paciente:
 * - alianca: Confiança no terapeuta
 * - profundidadePermitida: Quanto material profundo pode emergir
 * - defesasAtivas: Quão defendido/fechado está
 * 
 * REATIVIDADE: O estado MUDA baseado na qualidade das intervenções.
 * Intervenção boa → aliança sobe, defesas baixam
 * Intervenção ruim → aliança cai, defesas sobem
 * 
 * ============================================================================
 * COMO FUNCIONA:
 * ============================================================================
 * 
 * 1. Terapeuta inicia treinamento → criarEstadoInicial(casoId)
 * 2. A cada intervenção avaliada → atualizarMedidores(estado, classificacao)
 * 3. Conteúdo revelado → marcarComoRevelado(estado, tema)
 * 4. Progresso observado → marcarProgresso(estado, tipo)
 * 5. Fim da sessão → finalizarSessao(estado, resumo)
 * 
 * ============================================================================
 */

const { getEstadoInicial, getCaso } = require('../config/casos');

// =============================================================================
// CRIAÇÃO DE ESTADO
// =============================================================================

/**
 * Cria o estado inicial para um terapeuta começar um caso.
 * 
 * @param {string} casoId - ID do caso (ex: 'renata')
 * @param {string} terapeutaId - ID do terapeuta
 * @returns {Object} - Estado inicial completo
 * 
 * @example
 * const estado = criarEstadoInicial('renata', 'terapeuta-123');
 */
function criarEstadoInicial(casoId, terapeutaId) {
  // Busca configuração do caso
  const caso = getCaso(casoId);
  if (!caso) {
    throw new Error(`Caso não encontrado: ${casoId}`);
  }
  
  const estadoBase = caso.estadoInicial;
  
  return {
    // Identificação
    terapeutaId: terapeutaId,
    casoId: casoId,
    
    // Sessão atual
    sessaoAtual: 1,
    threadId: null, // Preenchido quando criar thread na OpenAI
    
    // Medidores principais (cópia do estado inicial do caso)
    alianca: estadoBase.alianca,
    profundidadePermitida: estadoBase.profundidadePermitida,
    defesasAtivas: estadoBase.defesasAtivas,
    
    // Histórico revelado (cópia da estrutura do caso)
    historicoRevelado: { ...caso.historicoRevelado },
    
    // Progresso terapêutico (cópia da estrutura do caso)
    progresso: { ...caso.progresso },
    
    // Momentos de verdade que ocorreram
    momentosDeVerdade: [],
    
    // Resumo das sessões anteriores
    resumoSessoes: [],
    
    // Metadados
    status: 'ativo', // 'ativo', 'pausado', 'concluido'
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  };
}

// =============================================================================
// ATUALIZAÇÃO DE MEDIDORES
// =============================================================================

/**
 * Tabela de impacto por classificação.
 * Define quanto cada medidor muda baseado na qualidade da intervenção.
 * 
 * PERSONALIZE: Ajuste esses valores se quiser mais/menos sensibilidade.
 */
const IMPACTO_CLASSIFICACAO = {
  excelente: {
    alianca: +1.0,
    profundidadePermitida: +0.5,
    defesasAtivas: -1.0
  },
  boa: {
    alianca: +0.5,
    profundidadePermitida: +0.3,
    defesasAtivas: -0.5
  },
  ok: {
    alianca: +0.2,
    profundidadePermitida: +0.1,
    defesasAtivas: -0.1
  },
  erro: {
    alianca: -0.5,
    profundidadePermitida: -0.3,
    defesasAtivas: +1.0
  }
};

/**
 * Atualiza os medidores baseado na classificação de uma intervenção.
 * 
 * @param {Object} estado - Estado atual
 * @param {string} classificacao - 'excelente', 'boa', 'ok', 'erro'
 * @returns {Object} - Estado atualizado
 * 
 * @example
 * estado = atualizarMedidores(estado, 'excelente');
 * // aliança subiu, defesas baixaram
 */
function atualizarMedidores(estado, classificacao) {
  const impacto = IMPACTO_CLASSIFICACAO[classificacao];
  
  if (!impacto) {
    console.warn(`Classificação desconhecida: ${classificacao}`);
    return estado;
  }
  
  // Aplica impacto respeitando limites (0-10)
  estado.alianca = Math.min(10, Math.max(0, estado.alianca + impacto.alianca));
  estado.profundidadePermitida = Math.min(10, Math.max(0, estado.profundidadePermitida + impacto.profundidadePermitida));
  estado.defesasAtivas = Math.min(10, Math.max(0, estado.defesasAtivas + impacto.defesasAtivas));
  
  // Atualiza timestamp
  estado.atualizadoEm = new Date().toISOString();
  
  return estado;
}

/**
 * Aplica impacto customizado nos medidores.
 * Use quando o momento de verdade tem impacto específico definido.
 * 
 * @param {Object} estado - Estado atual
 * @param {Object} impacto - { alianca: X, profundidade: Y, defesas: Z }
 * @returns {Object} - Estado atualizado
 */
function aplicarImpactoCustom(estado, impacto) {
  if (impacto.alianca !== undefined) {
    estado.alianca = Math.min(10, Math.max(0, estado.alianca + impacto.alianca));
  }
  if (impacto.profundidade !== undefined) {
    estado.profundidadePermitida = Math.min(10, Math.max(0, estado.profundidadePermitida + impacto.profundidade));
  }
  if (impacto.defesas !== undefined) {
    estado.defesasAtivas = Math.min(10, Math.max(0, estado.defesasAtivas + impacto.defesas));
  }
  
  estado.atualizadoEm = new Date().toISOString();
  return estado;
}

// =============================================================================
// REGISTRO DE MOMENTOS
// =============================================================================

/**
 * Registra que um momento de verdade ocorreu e como foi respondido.
 * 
 * @param {Object} estado - Estado atual
 * @param {Object} momento - Dados do momento
 * @param {string} momento.id - ID do momento (ex: 'minimizacao')
 * @param {string} momento.nome - Nome descritivo
 * @param {string} momento.respostaTerapeuta - O que o terapeuta disse
 * @param {string} momento.classificacao - 'excelente', 'boa', 'ok', 'erro'
 * @returns {Object} - Estado atualizado
 * 
 * @example
 * estado = registrarMomentoDeVerdade(estado, {
 *   id: 'minimizacao',
 *   nome: 'A Minimização',
 *   respostaTerapeuta: 'O que te faz pensar que não é grave?',
 *   classificacao: 'boa'
 * });
 */
function registrarMomentoDeVerdade(estado, momento) {
  // Adiciona ao histórico
  estado.momentosDeVerdade.push({
    sessao: estado.sessaoAtual,
    id: momento.id,
    nome: momento.nome,
    respostaTerapeuta: momento.respostaTerapeuta,
    classificacao: momento.classificacao,
    timestamp: new Date().toISOString()
  });
  
  // Atualiza medidores baseado na classificação
  atualizarMedidores(estado, momento.classificacao);
  
  return estado;
}

// =============================================================================
// HISTÓRICO REVELADO
// =============================================================================

/**
 * Marca um tema como revelado no tratamento.
 * 
 * @param {Object} estado - Estado atual
 * @param {string} tema - Chave do tema (ex: 'infanciaDificil')
 * @returns {Object} - Estado atualizado
 * 
 * @example
 * // Após Renata contar sobre a mãe
 * estado = marcarComoRevelado(estado, 'infanciaDificil');
 */
function marcarComoRevelado(estado, tema) {
  if (estado.historicoRevelado.hasOwnProperty(tema)) {
    estado.historicoRevelado[tema] = true;
    estado.atualizadoEm = new Date().toISOString();
  } else {
    console.warn(`Tema desconhecido: ${tema}`);
  }
  return estado;
}

/**
 * Verifica se um tema já foi revelado.
 * 
 * @param {Object} estado - Estado atual
 * @param {string} tema - Chave do tema
 * @returns {boolean}
 */
function foiRevelado(estado, tema) {
  return estado.historicoRevelado[tema] === true;
}

/**
 * Retorna lista de temas já revelados.
 * 
 * @param {Object} estado - Estado atual
 * @returns {Array<string>}
 */
function getTemasRevelados(estado) {
  return Object.entries(estado.historicoRevelado)
    .filter(([_, revelado]) => revelado)
    .map(([tema, _]) => tema);
}

/**
 * Retorna lista de temas ainda não revelados.
 * 
 * @param {Object} estado - Estado atual
 * @returns {Array<string>}
 */
function getTemasNaoRevelados(estado) {
  return Object.entries(estado.historicoRevelado)
    .filter(([_, revelado]) => !revelado)
    .map(([tema, _]) => tema);
}

// =============================================================================
// PROGRESSO TERAPÊUTICO
// =============================================================================

/**
 * Marca um progresso como observado.
 * 
 * @param {Object} estado - Estado atual
 * @param {string} tipo - Tipo de progresso (ex: 'reconhecePadroes')
 * @returns {Object} - Estado atualizado
 * 
 * @example
 * // Renata conseguiu identificar um padrão sozinha
 * estado = marcarProgresso(estado, 'reconhecePadroes');
 */
function marcarProgresso(estado, tipo) {
  if (estado.progresso.hasOwnProperty(tipo)) {
    estado.progresso[tipo] = true;
    estado.atualizadoEm = new Date().toISOString();
  } else {
    console.warn(`Tipo de progresso desconhecido: ${tipo}`);
  }
  return estado;
}

/**
 * Retorna lista de progressos alcançados.
 * 
 * @param {Object} estado - Estado atual
 * @returns {Array<string>}
 */
function getProgressosAlcancados(estado) {
  return Object.entries(estado.progresso)
    .filter(([_, alcancado]) => alcancado)
    .map(([tipo, _]) => tipo);
}

// =============================================================================
// GESTÃO DE SESSÕES
// =============================================================================

/**
 * Finaliza a sessão atual e avança para a próxima.
 * 
 * @param {Object} estado - Estado atual
 * @param {string} resumo - Resumo do que aconteceu na sessão
 * @returns {Object} - Estado atualizado
 * 
 * @example
 * estado = finalizarSessao(estado, 'Boa aliança estabelecida. Renata contou sobre a infância.');
 */
function finalizarSessao(estado, resumo) {
  // Registra resumo da sessão
  estado.resumoSessoes.push({
    numero: estado.sessaoAtual,
    resumo: resumo,
    medidoresFinais: {
      alianca: estado.alianca,
      profundidade: estado.profundidadePermitida,
      defesas: estado.defesasAtivas
    },
    momentos: estado.momentosDeVerdade.filter(m => m.sessao === estado.sessaoAtual),
    data: new Date().toISOString()
  });
  
  // Avança para próxima sessão
  estado.sessaoAtual += 1;
  estado.atualizadoEm = new Date().toISOString();
  
  // Limpa threadId (será criado novo na próxima sessão)
  estado.threadId = null;
  
  return estado;
}

/**
 * Retorna resumo da última sessão.
 * 
 * @param {Object} estado - Estado atual
 * @returns {Object|null}
 */
function getUltimaSessao(estado) {
  if (estado.resumoSessoes.length === 0) return null;
  return estado.resumoSessoes[estado.resumoSessoes.length - 1];
}

/**
 * Verifica se o caso foi concluído.
 * 
 * @param {Object} estado - Estado atual
 * @returns {boolean}
 */
function casoConcluido(estado) {
  const caso = getCaso(estado.casoId);
  if (!caso) return false;
  return estado.sessaoAtual > caso.identificacao.totalSessoes;
}

/**
 * Marca o caso como concluído.
 * 
 * @param {Object} estado - Estado atual
 * @returns {Object}
 */
function concluirCaso(estado) {
  estado.status = 'concluido';
  estado.atualizadoEm = new Date().toISOString();
  return estado;
}

// =============================================================================
// GERAÇÃO DE CONTEXTO PARA O ASSISTANT
// =============================================================================

/**
 * Gera texto de contexto para injetar no prompt do Assistant.
 * Isso ajuda o paciente virtual a "saber" seu estado atual.
 * 
 * @param {Object} estado - Estado atual
 * @returns {string} - Texto para adicionar ao prompt
 * 
 * @example
 * const contexto = gerarContextoParaAssistant(estado);
 * // Adiciona ao prompt antes de enviar mensagem
 */
function gerarContextoParaAssistant(estado) {
  // Descrição dos níveis
  const descAlianca = estado.alianca < 4 ? '(ainda desconfiada)' 
    : estado.alianca < 7 ? '(começando a confiar)' 
    : '(confia bastante)';
  
  const descProfundidade = estado.profundidadePermitida < 4 ? '(só superfície)'
    : estado.profundidadePermitida < 7 ? '(pode ir mais fundo)'
    : '(material profundo acessível)';
  
  const descDefesas = estado.defesasAtivas > 6 ? '(muito defendida)'
    : estado.defesasAtivas > 3 ? '(defesas moderadas)'
    : '(mais aberta)';
  
  let contexto = `
---
ESTADO ATUAL DA PACIENTE (Sessão ${estado.sessaoAtual}):

MEDIDORES INTERNOS (use para calibrar suas respostas):
- Aliança com terapeuta: ${estado.alianca.toFixed(1)}/10 ${descAlianca}
- Profundidade permitida: ${estado.profundidadePermitida.toFixed(1)}/10 ${descProfundidade}
- Defesas ativas: ${estado.defesasAtivas.toFixed(1)}/10 ${descDefesas}

`;

  // Temas revelados
  const revelados = getTemasRevelados(estado);
  if (revelados.length > 0) {
    contexto += `TEMAS JÁ ABORDADOS: ${revelados.join(', ')}\n`;
  }
  
  // Temas não revelados
  const naoRevelados = getTemasNaoRevelados(estado);
  if (naoRevelados.length > 0) {
    contexto += `TEMAS QUE PODEM EMERGIR (se houver segurança): ${naoRevelados.join(', ')}\n`;
  }
  
  // Progressos
  const progressos = getProgressosAlcancados(estado);
  if (progressos.length > 0) {
    contexto += `\nPROGRESSOS OBSERVADOS: ${progressos.join(', ')}\n`;
  }
  
  // Última sessão
  const ultima = getUltimaSessao(estado);
  if (ultima) {
    contexto += `\nÚLTIMA SESSÃO: ${ultima.resumo}\n`;
  }
  
  contexto += `
---
INSTRUÇÕES: Calibre suas respostas de acordo com este estado.
- Se aliança está baixa, seja mais defensiva e cautelosa.
- Se profundidade está alta, pode acessar material mais profundo.
- Se defesas estão altas, não force, respeite o ritmo.
`;

  return contexto;
}

// =============================================================================
// ESTATÍSTICAS
// =============================================================================

/**
 * Calcula estatísticas do treinamento até o momento.
 * 
 * @param {Object} estado - Estado atual
 * @returns {Object}
 */
function calcularEstatisticas(estado) {
  const momentos = estado.momentosDeVerdade;
  
  const porClassificacao = {
    excelente: momentos.filter(m => m.classificacao === 'excelente').length,
    boa: momentos.filter(m => m.classificacao === 'boa').length,
    ok: momentos.filter(m => m.classificacao === 'ok').length,
    erro: momentos.filter(m => m.classificacao === 'erro').length
  };
  
  const total = momentos.length;
  const taxaAcerto = total > 0 
    ? ((porClassificacao.excelente + porClassificacao.boa) / total * 100).toFixed(1)
    : 0;
  
  return {
    sessoesCompletas: estado.sessaoAtual - 1,
    sessaoAtual: estado.sessaoAtual,
    momentosEnfrentados: total,
    porClassificacao,
    taxaAcerto: `${taxaAcerto}%`,
    aliancaAtual: estado.alianca.toFixed(1),
    temasRevelados: getTemasRevelados(estado).length,
    progressosAlcancados: getProgressosAlcancados(estado).length
  };
}

// =============================================================================
// EXPORTAÇÕES
// =============================================================================

module.exports = {
  // Criação
  criarEstadoInicial,
  
  // Medidores
  atualizarMedidores,
  aplicarImpactoCustom,
  IMPACTO_CLASSIFICACAO,
  
  // Momentos de verdade
  registrarMomentoDeVerdade,
  
  // Histórico revelado
  marcarComoRevelado,
  foiRevelado,
  getTemasRevelados,
  getTemasNaoRevelados,
  
  // Progresso
  marcarProgresso,
  getProgressosAlcancados,
  
  // Sessões
  finalizarSessao,
  getUltimaSessao,
  casoConcluido,
  concluirCaso,
  
  // Contexto para Assistant
  gerarContextoParaAssistant,
  
  // Estatísticas
  calcularEstatisticas
};
