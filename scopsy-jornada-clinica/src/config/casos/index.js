/**
 * ============================================================================
 * SCOPSY - REGISTRO CENTRAL DE CASOS CLÍNICOS
 * ============================================================================
 * 
 * Este arquivo é o PONTO CENTRAL para gerenciar todos os casos clínicos.
 * Quando você criar um novo caso, registre-o aqui.
 * 
 * ============================================================================
 * COMO ADICIONAR UM NOVO CASO:
 * ============================================================================
 * 
 * 1. Crie o arquivo de configuração (ex: src/config/casos/marcos.js)
 *    Use renata.js como modelo/template
 * 
 * 2. Importe o arquivo aqui:
 *    const MARCOS = require('./marcos');
 * 
 * 3. Adicione ao objeto CASOS:
 *    marcos: MARCOS,
 * 
 * 4. Adicione à lista CASOS_ATIVOS se quiser que apareça para usuários:
 *    'marcos',
 * 
 * Pronto! O sistema vai reconhecer o novo caso automaticamente.
 * 
 * ============================================================================
 */

// =============================================================================
// IMPORTAÇÃO DOS CASOS
// =============================================================================

/**
 * Caso Renata - Caso-piloto
 * Burnout e autossacrifício. Excelente para treinar acolhida e validação.
 */
const RENATA = require('./renata');

/**
 * TEMPLATE PARA NOVOS CASOS:
 * 
 * // Caso Marcos - Depressão
 * // Homem de 45 anos com depressão maior. Foco em ativação comportamental.
 * const MARCOS = require('./marcos');
 * 
 * // Caso Julia - Ansiedade Social
 * // Jovem de 22 anos com fobia social. Treina exposição gradual.
 * const JULIA = require('./julia');
 */

// =============================================================================
// REGISTRO DE CASOS
// =============================================================================

/**
 * Objeto contendo todos os casos disponíveis no sistema.
 * 
 * ESTRUTURA:
 * - Chave: ID do caso (usado na URL e banco de dados)
 * - Valor: Objeto de configuração completo
 * 
 * IMPORTANTE: O ID deve ser lowercase, sem espaços ou caracteres especiais.
 */
const CASOS = {
  renata: RENATA,
  
  // ADICIONE NOVOS CASOS AQUI:
  // marcos: MARCOS,
  // julia: JULIA,
  // carlos: CARLOS,
};

// =============================================================================
// CASOS ATIVOS
// =============================================================================

/**
 * Lista de IDs dos casos que estão ativos (visíveis para usuários).
 * 
 * USE ISSO PARA:
 * - Esconder casos em desenvolvimento
 * - Fazer lançamentos graduais
 * - Desativar casos temporariamente
 * 
 * Se um caso está em CASOS mas não está aqui, ele existe no sistema
 * mas não aparece nas listagens.
 */
const CASOS_ATIVOS = [
  'renata',
  // 'marcos',  // Descomente quando estiver pronto
  // 'julia',
];

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

/**
 * Retorna um caso pelo ID.
 * 
 * @param {string} casoId - ID do caso (ex: 'renata')
 * @returns {Object|null} - Configuração do caso ou null se não existir
 * 
 * @example
 * const caso = getCaso('renata');
 * console.log(caso.identificacao.nome); // "Renata Moreira Lima"
 */
function getCaso(casoId) {
  const id = casoId?.toLowerCase();
  return CASOS[id] || null;
}

/**
 * Retorna lista de todos os casos ativos.
 * 
 * @returns {Array} - Array de objetos com dados resumidos dos casos
 * 
 * @example
 * const casos = listarCasosAtivos();
 * // [{ id: 'renata', nome: 'Renata Moreira Lima', resumo: '...', ... }]
 */
function listarCasosAtivos() {
  return CASOS_ATIVOS.map(id => {
    const caso = CASOS[id];
    if (!caso) return null;
    
    return {
      id: caso.identificacao.id,
      nome: caso.identificacao.nome,
      idade: caso.identificacao.idade,
      profissao: caso.identificacao.profissao,
      resumo: caso.identificacao.resumoCurto,
      dificuldade: caso.identificacao.dificuldade,
      abordagem: caso.identificacao.abordagem,
      totalSessoes: caso.identificacao.totalSessoes,
      tags: caso.identificacao.tags
    };
  }).filter(Boolean);
}

/**
 * Verifica se um caso existe e está ativo.
 * 
 * @param {string} casoId - ID do caso
 * @returns {boolean}
 */
function casoExiste(casoId) {
  const id = casoId?.toLowerCase();
  return CASOS_ATIVOS.includes(id) && CASOS[id] !== undefined;
}

/**
 * Retorna os momentos de verdade de um caso.
 * 
 * @param {string} casoId - ID do caso
 * @returns {Array|null} - Array de momentos ou null
 */
function getMomentos(casoId) {
  const caso = getCaso(casoId);
  return caso?.momentosDeVerdade || null;
}

/**
 * Retorna um momento específico pelo ID.
 * 
 * @param {string} casoId - ID do caso
 * @param {string} momentoId - ID do momento
 * @returns {Object|null}
 */
function getMomento(casoId, momentoId) {
  const momentos = getMomentos(casoId);
  if (!momentos) return null;
  return momentos.find(m => m.id === momentoId) || null;
}

/**
 * Retorna o feedback para um momento e classificação.
 * 
 * @param {string} casoId - ID do caso
 * @param {string} momentoId - ID do momento
 * @param {string} classificacao - 'erro', 'ok', 'boa', 'excelente'
 * @returns {Object|null}
 */
function getFeedback(casoId, momentoId, classificacao) {
  const caso = getCaso(casoId);
  if (!caso?.feedbacks?.[momentoId]) return null;
  return caso.feedbacks[momentoId][classificacao] || null;
}

/**
 * Retorna configuração do Assistant para um caso.
 * 
 * @param {string} casoId - ID do caso
 * @returns {Object|null} - { id, modelo, temperature, ... }
 */
function getAssistantConfig(casoId) {
  const caso = getCaso(casoId);
  return caso?.assistant || null;
}

/**
 * Retorna o estado inicial para um caso.
 * 
 * @param {string} casoId - ID do caso
 * @returns {Object|null} - { alianca, profundidadePermitida, defesasAtivas }
 */
function getEstadoInicial(casoId) {
  const caso = getCaso(casoId);
  return caso?.estadoInicial || null;
}

/**
 * Retorna uma frase de loading aleatória para um caso.
 * 
 * @param {string} casoId - ID do caso
 * @returns {string}
 */
function getFraseLoading(casoId) {
  const caso = getCaso(casoId);
  if (!caso?.frasesLoading?.length) {
    return "Processando...";
  }
  const idx = Math.floor(Math.random() * caso.frasesLoading.length);
  return caso.frasesLoading[idx].texto;
}

/**
 * Detecta se uma mensagem contém gatilhos de algum momento de verdade.
 * 
 * @param {string} casoId - ID do caso
 * @param {string} mensagem - Texto da mensagem (da paciente)
 * @returns {Array} - Array de momentos detectados
 */
function detectarMomentos(casoId, mensagem) {
  const momentos = getMomentos(casoId);
  if (!momentos || !mensagem) return [];
  
  const textoLower = mensagem.toLowerCase();
  const detectados = [];
  
  momentos.forEach(momento => {
    const temGatilho = momento.gatilhos.some(gatilho => 
      textoLower.includes(gatilho.toLowerCase())
    );
    
    if (temGatilho) {
      detectados.push({
        id: momento.id,
        nome: momento.nome,
        fase: momento.fase,
        descricao: momento.descricao,
        oQueEstaEmJogo: momento.oQueEstaEmJogo
      });
    }
  });
  
  return detectados;
}

// =============================================================================
// ESTATÍSTICAS (para dashboard admin futuro)
// =============================================================================

/**
 * Retorna estatísticas gerais dos casos.
 * 
 * @returns {Object}
 */
function getEstatisticas() {
  return {
    totalCasos: Object.keys(CASOS).length,
    casosAtivos: CASOS_ATIVOS.length,
    porAbordagem: {
      TCC: CASOS_ATIVOS.filter(id => CASOS[id]?.identificacao?.abordagem === 'TCC').length,
      ACT: CASOS_ATIVOS.filter(id => CASOS[id]?.identificacao?.abordagem === 'ACT').length,
      DBT: CASOS_ATIVOS.filter(id => CASOS[id]?.identificacao?.abordagem === 'DBT').length,
    },
    porDificuldade: {
      basico: CASOS_ATIVOS.filter(id => CASOS[id]?.identificacao?.dificuldade === 'basico').length,
      intermediario: CASOS_ATIVOS.filter(id => CASOS[id]?.identificacao?.dificuldade === 'intermediario').length,
      avancado: CASOS_ATIVOS.filter(id => CASOS[id]?.identificacao?.dificuldade === 'avancado').length,
    }
  };
}

// =============================================================================
// EXPORTAÇÕES
// =============================================================================

module.exports = {
  // Objetos
  CASOS,
  CASOS_ATIVOS,
  
  // Funções principais
  getCaso,
  listarCasosAtivos,
  casoExiste,
  
  // Funções de momentos
  getMomentos,
  getMomento,
  detectarMomentos,
  
  // Funções de feedback
  getFeedback,
  
  // Funções de configuração
  getAssistantConfig,
  getEstadoInicial,
  getFraseLoading,
  
  // Estatísticas
  getEstatisticas
};
