/**
 * ============================================================================
 * SCOPSY - SERVIÇO DE PACIENTE (INTEGRAÇÃO OPENAI)
 * ============================================================================
 * 
 * Este serviço gerencia toda a comunicação com os pacientes virtuais.
 * Ele conecta ao OpenAI Assistants API e mantém o estado das sessões.
 * 
 * ============================================================================
 * ARQUITETURA:
 * ============================================================================
 * 
 * TERAPEUTA → pacienteService → OpenAI Assistant → Resposta do Paciente
 *                ↓
 *           estadoStorage (salva estado)
 *                ↓
 *           pacienteState (atualiza medidores)
 * 
 * ============================================================================
 * FLUXO DE UMA SESSÃO:
 * ============================================================================
 * 
 * 1. iniciarTreinamento(terapeutaId, casoId)
 *    - Cria/carrega estado
 *    - Cria thread na OpenAI
 *    - Retorna estado inicial
 * 
 * 2. enviarMensagem(terapeutaId, casoId, mensagem)
 *    - Carrega estado
 *    - Gera contexto de estado
 *    - Envia para OpenAI
 *    - Recebe resposta do paciente
 *    - Detecta momentos de verdade
 *    - Salva estado atualizado
 *    - Retorna resposta + momentos detectados
 * 
 * 3. finalizarSessao(terapeutaId, casoId, resumo)
 *    - Salva resumo da sessão
 *    - Avança para próxima sessão
 * 
 * ============================================================================
 * DEPENDÊNCIAS:
 * ============================================================================
 * 
 * - OpenAI API (Assistants)
 * - src/config/casos (configuração dos casos)
 * - src/models/pacienteState (gerenciamento de estado)
 * - src/services/estadoStorage (persistência)
 * 
 * ============================================================================
 */

require('dotenv').config();
const OpenAI = require('openai');

// Importações internas
const casos = require('../config/casos');
const pacienteState = require('../models/pacienteState');
const estadoStorage = require('./estadoStorage');

// =============================================================================
// CONFIGURAÇÃO DO OPENAI
// =============================================================================

/**
 * Cliente OpenAI inicializado com a API key do ambiente.
 * 
 * IMPORTANTE: Certifique-se de que OPENAI_API_KEY está no .env
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Verifica se a API key está configurada
if (!process.env.OPENAI_API_KEY) {
  console.error('⚠️ ERRO: OPENAI_API_KEY não está configurada no .env');
}

// =============================================================================
// FUNÇÕES PRINCIPAIS
// =============================================================================

/**
 * Inicia ou continua um treinamento com um paciente.
 * 
 * @param {string} terapeutaId - ID único do terapeuta
 * @param {string} casoId - ID do caso (ex: 'renata')
 * @returns {Promise<Object>} - Estado inicial e informações da sessão
 * 
 * @example
 * const resultado = await iniciarTreinamento('terapeuta-123', 'renata');
 * console.log(resultado.estado);
 * console.log(resultado.mensagemInicial);
 */
async function iniciarTreinamento(terapeutaId, casoId) {
  console.log(`[PacienteService] Iniciando treinamento: ${terapeutaId} / ${casoId}`);
  
  // Valida se o caso existe
  if (!casos.casoExiste(casoId)) {
    throw new Error(`Caso não encontrado: ${casoId}`);
  }
  
  // Gera chave única para este terapeuta + caso
  const chaveEstado = `${terapeutaId}_${casoId}`;
  
  // Tenta carregar estado existente
  let estado = estadoStorage.carregarEstado(chaveEstado);
  
  if (!estado) {
    // Primeira vez - cria estado inicial
    console.log(`[PacienteService] Criando novo estado para: ${chaveEstado}`);
    estado = pacienteState.criarEstadoInicial(casoId, terapeutaId);
  } else {
    console.log(`[PacienteService] Estado carregado. Sessão: ${estado.sessaoAtual}`);
  }
  
  // Cria nova thread para esta sessão
  try {
    const thread = await openai.beta.threads.create();
    estado.threadId = thread.id;
    console.log(`[PacienteService] Thread criada: ${thread.id}`);
  } catch (error) {
    console.error('[PacienteService] Erro ao criar thread:', error);
    throw new Error('Falha ao conectar com o paciente virtual. Tente novamente.');
  }
  
  // Salva estado atualizado
  estadoStorage.salvarEstado(chaveEstado, estado);
  
  // Busca dados do caso para a mensagem inicial
  const caso = casos.getCaso(casoId);
  
  // Monta mensagem inicial baseada na sessão
  let mensagemInicial;
  if (estado.sessaoAtual === 1) {
    mensagemInicial = `Esta é a primeira sessão com ${caso.identificacao.nome}. ` +
      `${caso.identificacao.descricaoCompleta}`;
  } else {
    const ultimaSessao = pacienteState.getUltimaSessao(estado);
    mensagemInicial = `Esta é a sessão ${estado.sessaoAtual} com ${caso.identificacao.nome}. ` +
      `Na última sessão: ${ultimaSessao?.resumo || 'Vocês continuaram o trabalho terapêutico.'}`;
  }
  
  return {
    sucesso: true,
    estado: {
      sessaoAtual: estado.sessaoAtual,
      alianca: estado.alianca,
      profundidade: estado.profundidadePermitida,
      defesas: estado.defesasAtivas
    },
    threadId: estado.threadId,
    caso: {
      id: caso.identificacao.id,
      nome: caso.identificacao.nome,
      idade: caso.identificacao.idade,
      queixa: caso.identificacao.queixaInicial
    },
    mensagemInicial
  };
}

/**
 * Envia mensagem do terapeuta e recebe resposta do paciente.
 * 
 * @param {string} terapeutaId - ID do terapeuta
 * @param {string} casoId - ID do caso
 * @param {string} mensagem - Mensagem do terapeuta
 * @returns {Promise<Object>} - Resposta do paciente e momentos detectados
 * 
 * @example
 * const resultado = await enviarMensagem('terapeuta-123', 'renata', 'Como você está hoje?');
 * console.log(resultado.resposta); // Resposta da Renata
 * console.log(resultado.momentosDetectados); // Momentos de verdade na resposta
 */
async function enviarMensagem(terapeutaId, casoId, mensagem) {
  console.log(`[PacienteService] Mensagem recebida de ${terapeutaId}`);
  
  const chaveEstado = `${terapeutaId}_${casoId}`;
  
  // Carrega estado
  const estado = estadoStorage.carregarEstado(chaveEstado);
  if (!estado) {
    throw new Error('Sessão não iniciada. Chame iniciarTreinamento primeiro.');
  }
  
  if (!estado.threadId) {
    throw new Error('Thread não encontrada. Reinicie a sessão.');
  }
  
  // Busca configuração do Assistant
  const assistantConfig = casos.getAssistantConfig(casoId);
  if (!assistantConfig?.id) {
    throw new Error(`Assistant não configurado para o caso: ${casoId}`);
  }
  
  try {
    // Gera contexto de estado para calibrar respostas
    const contextoEstado = pacienteState.gerarContextoParaAssistant(estado);
    
    // Monta mensagem com contexto (o paciente "sabe" seu estado)
    const mensagemCompleta = `[CONTEXTO INTERNO - NÃO VERBALIZE]\n${contextoEstado}\n\n[FALA DO TERAPEUTA]\n${mensagem}`;
    
    // Adiciona mensagem à thread
    await openai.beta.threads.messages.create(estado.threadId, {
      role: 'user',
      content: mensagemCompleta
    });
    
    // Executa o Assistant
    const run = await openai.beta.threads.runs.create(estado.threadId, {
      assistant_id: assistantConfig.id
    });
    
    // Aguarda resposta (polling)
    let runStatus = await openai.beta.threads.runs.retrieve(estado.threadId, run.id);
    let tentativas = 0;
    const maxTentativas = 30; // 30 segundos máximo
    
    while (runStatus.status !== 'completed' && tentativas < maxTentativas) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(estado.threadId, run.id);
      tentativas++;
      
      if (runStatus.status === 'failed') {
        console.error('[PacienteService] Run falhou:', runStatus.last_error);
        throw new Error('O paciente não conseguiu responder. Tente novamente.');
      }
      
      if (runStatus.status === 'cancelled') {
        throw new Error('Resposta cancelada.');
      }
    }
    
    if (tentativas >= maxTentativas) {
      throw new Error('Tempo esgotado aguardando resposta do paciente.');
    }
    
    // Busca a resposta
    const messages = await openai.beta.threads.messages.list(estado.threadId);
    const respostaPaciente = messages.data[0].content[0].text.value;
    
    // Detecta momentos de verdade na resposta
    const momentosDetectados = casos.detectarMomentos(casoId, respostaPaciente);
    
    // Atualiza estado com timestamp
    estado.atualizadoEm = new Date().toISOString();
    estadoStorage.salvarEstado(chaveEstado, estado);
    
    console.log(`[PacienteService] Resposta recebida. Momentos detectados: ${momentosDetectados.length}`);
    
    return {
      sucesso: true,
      resposta: respostaPaciente,
      momentosDetectados,
      estado: {
        alianca: estado.alianca,
        profundidade: estado.profundidadePermitida,
        defesas: estado.defesasAtivas
      },
      // Frase de loading para a próxima (útil para frontend)
      proximaFraseLoading: casos.getFraseLoading(casoId)
    };
    
  } catch (error) {
    console.error('[PacienteService] Erro ao processar mensagem:', error);
    throw error;
  }
}

/**
 * Registra avaliação de um momento de verdade.
 * Chamado quando o sistema (ou supervisor) avalia a resposta do terapeuta.
 * 
 * @param {string} terapeutaId - ID do terapeuta
 * @param {string} casoId - ID do caso
 * @param {Object} momento - Dados do momento
 * @returns {Object} - Estado atualizado
 */
async function registrarMomento(terapeutaId, casoId, momento) {
  const chaveEstado = `${terapeutaId}_${casoId}`;
  let estado = estadoStorage.carregarEstado(chaveEstado);
  
  if (!estado) {
    throw new Error('Estado não encontrado');
  }
  
  // Registra o momento (atualiza medidores automaticamente)
  estado = pacienteState.registrarMomentoDeVerdade(estado, momento);
  
  // Salva estado
  estadoStorage.salvarEstado(chaveEstado, estado);
  
  // Busca feedback pré-escrito
  const feedback = casos.getFeedback(casoId, momento.id, momento.classificacao);
  
  return {
    sucesso: true,
    estado: {
      alianca: estado.alianca,
      profundidade: estado.profundidadePermitida,
      defesas: estado.defesasAtivas
    },
    feedback: feedback || null
  };
}

/**
 * Finaliza a sessão atual e avança para a próxima.
 * 
 * @param {string} terapeutaId - ID do terapeuta
 * @param {string} casoId - ID do caso
 * @param {string} resumo - Resumo do que aconteceu (opcional)
 * @returns {Object}
 */
async function finalizarSessao(terapeutaId, casoId, resumo = null) {
  const chaveEstado = `${terapeutaId}_${casoId}`;
  let estado = estadoStorage.carregarEstado(chaveEstado);
  
  if (!estado) {
    throw new Error('Estado não encontrado');
  }
  
  // Gera resumo automático se não fornecido
  const resumoFinal = resumo || `Sessão ${estado.sessaoAtual} finalizada.`;
  
  // Finaliza sessão
  estado = pacienteState.finalizarSessao(estado, resumoFinal);
  
  // Verifica se caso foi concluído
  if (pacienteState.casoConcluido(estado)) {
    estado = pacienteState.concluirCaso(estado);
  }
  
  // Salva estado
  estadoStorage.salvarEstado(chaveEstado, estado);
  
  return {
    sucesso: true,
    sessaoFinalizada: estado.sessaoAtual - 1,
    proximaSessao: estado.sessaoAtual,
    casoConcluido: estado.status === 'concluido',
    estatisticas: pacienteState.calcularEstatisticas(estado),
    medidores: {
      alianca: estado.alianca,
      profundidade: estado.profundidadePermitida,
      defesas: estado.defesasAtivas
    }
  };
}

/**
 * Busca o estado atual de um treinamento.
 * 
 * @param {string} terapeutaId - ID do terapeuta
 * @param {string} casoId - ID do caso
 * @returns {Object|null}
 */
function buscarEstado(terapeutaId, casoId) {
  const chaveEstado = `${terapeutaId}_${casoId}`;
  return estadoStorage.carregarEstado(chaveEstado);
}

/**
 * Busca histórico de mensagens da sessão atual.
 * 
 * @param {string} terapeutaId - ID do terapeuta
 * @param {string} casoId - ID do caso
 * @returns {Promise<Array>}
 */
async function buscarHistorico(terapeutaId, casoId) {
  const chaveEstado = `${terapeutaId}_${casoId}`;
  const estado = estadoStorage.carregarEstado(chaveEstado);
  
  if (!estado?.threadId) {
    return [];
  }
  
  try {
    const messages = await openai.beta.threads.messages.list(estado.threadId);
    
    return messages.data.reverse().map(msg => ({
      papel: msg.role === 'user' ? 'terapeuta' : 'paciente',
      conteudo: msg.content[0].text.value,
      timestamp: msg.created_at
    }));
    
  } catch (error) {
    console.error('[PacienteService] Erro ao buscar histórico:', error);
    return [];
  }
}

/**
 * Lista todos os casos disponíveis.
 * 
 * @returns {Array}
 */
function listarCasos() {
  return casos.listarCasosAtivos();
}

/**
 * Busca detalhes de um caso específico.
 * 
 * @param {string} casoId - ID do caso
 * @returns {Object|null}
 */
function buscarCaso(casoId) {
  return casos.getCaso(casoId);
}

/**
 * Gera estatísticas do treinamento.
 * 
 * @param {string} terapeutaId - ID do terapeuta
 * @param {string} casoId - ID do caso
 * @returns {Object}
 */
function gerarEstatisticas(terapeutaId, casoId) {
  const chaveEstado = `${terapeutaId}_${casoId}`;
  const estado = estadoStorage.carregarEstado(chaveEstado);
  
  if (!estado) {
    return null;
  }
  
  return pacienteState.calcularEstatisticas(estado);
}

// =============================================================================
// EXPORTAÇÕES
// =============================================================================

module.exports = {
  // Funções principais
  iniciarTreinamento,
  enviarMensagem,
  registrarMomento,
  finalizarSessao,
  
  // Consultas
  buscarEstado,
  buscarHistorico,
  listarCasos,
  buscarCaso,
  gerarEstatisticas
};
