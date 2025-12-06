/**
 * ============================================================================
 * SCOPSY - ROTAS DA API DE PACIENTE
 * ============================================================================
 * 
 * Este arquivo define todos os endpoints da API para interação com pacientes.
 * 
 * ============================================================================
 * ENDPOINTS DISPONÍVEIS:
 * ============================================================================
 * 
 * GET  /api/paciente/casos
 *      Lista todos os casos clínicos disponíveis
 * 
 * GET  /api/paciente/casos/:casoId
 *      Detalhes de um caso específico
 * 
 * POST /api/paciente/iniciar
 *      Inicia um treinamento com um caso
 * 
 * POST /api/paciente/mensagem
 *      Envia mensagem do terapeuta, recebe resposta do paciente
 * 
 * POST /api/paciente/momento
 *      Registra avaliação de um momento de verdade
 * 
 * POST /api/paciente/finalizar-sessao
 *      Finaliza a sessão atual
 * 
 * GET  /api/paciente/estado/:terapeutaId/:casoId
 *      Busca estado atual do treinamento
 * 
 * GET  /api/paciente/historico/:terapeutaId/:casoId
 *      Busca histórico de mensagens da sessão
 * 
 * GET  /api/paciente/estatisticas/:terapeutaId/:casoId
 *      Estatísticas do treinamento
 * 
 * ============================================================================
 * COMO INTEGRAR AO SERVER.JS:
 * ============================================================================
 * 
 * No seu arquivo server.js, adicione:
 * 
 * const pacienteRoutes = require('./routes/paciente');
 * app.use('/api/paciente', pacienteRoutes);
 * 
 * ============================================================================
 */

const express = require('express');
const router = express.Router();

// Importa o serviço de paciente
const pacienteService = require('../services/pacienteService');

// =============================================================================
// MIDDLEWARE DE VALIDAÇÃO
// =============================================================================

/**
 * Valida se os campos obrigatórios estão presentes no body.
 * 
 * @param {Array<string>} campos - Lista de campos obrigatórios
 */
function validarCampos(campos) {
  return (req, res, next) => {
    const faltando = campos.filter(campo => !req.body[campo]);
    
    if (faltando.length > 0) {
      return res.status(400).json({
        sucesso: false,
        erro: `Campos obrigatórios faltando: ${faltando.join(', ')}`
      });
    }
    
    next();
  };
}

/**
 * Middleware de tratamento de erros assíncronos.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// =============================================================================
// ROTAS DE CASOS
// =============================================================================

/**
 * GET /api/paciente/casos
 * 
 * Lista todos os casos clínicos disponíveis.
 * 
 * @returns {Array} Lista de casos com dados resumidos
 * 
 * @example
 * // Response:
 * {
 *   sucesso: true,
 *   casos: [
 *     { id: 'renata', nome: 'Renata Moreira Lima', resumo: '...', ... }
 *   ]
 * }
 */
router.get('/casos', (req, res) => {
  try {
    const casos = pacienteService.listarCasos();
    
    res.json({
      sucesso: true,
      quantidade: casos.length,
      casos
    });
    
  } catch (error) {
    console.error('[API] Erro ao listar casos:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao listar casos'
    });
  }
});

/**
 * GET /api/paciente/casos/:casoId
 * 
 * Retorna detalhes de um caso específico.
 * 
 * @param {string} casoId - ID do caso (ex: 'renata')
 */
router.get('/casos/:casoId', (req, res) => {
  try {
    const { casoId } = req.params;
    const caso = pacienteService.buscarCaso(casoId);
    
    if (!caso) {
      return res.status(404).json({
        sucesso: false,
        erro: `Caso não encontrado: ${casoId}`
      });
    }
    
    // Retorna apenas dados seguros (não expõe prompts internos)
    res.json({
      sucesso: true,
      caso: {
        identificacao: caso.identificacao,
        estadoInicial: caso.estadoInicial,
        totalMomentos: caso.momentosDeVerdade?.length || 0,
        fases: [...new Set(caso.momentosDeVerdade?.map(m => m.fase) || [])]
      }
    });
    
  } catch (error) {
    console.error('[API] Erro ao buscar caso:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar caso'
    });
  }
});

// =============================================================================
// ROTAS DE TREINAMENTO
// =============================================================================

/**
 * POST /api/paciente/iniciar
 * 
 * Inicia ou retoma um treinamento com um paciente.
 * 
 * @body {string} terapeutaId - ID do terapeuta
 * @body {string} casoId - ID do caso (ex: 'renata')
 * 
 * @example
 * // Request:
 * POST /api/paciente/iniciar
 * { "terapeutaId": "user-123", "casoId": "renata" }
 * 
 * // Response:
 * {
 *   sucesso: true,
 *   estado: { sessaoAtual: 1, alianca: 4, ... },
 *   caso: { nome: 'Renata', ... },
 *   mensagemInicial: "Esta é a primeira sessão..."
 * }
 */
router.post('/iniciar', 
  validarCampos(['terapeutaId', 'casoId']),
  asyncHandler(async (req, res) => {
    const { terapeutaId, casoId } = req.body;
    
    console.log(`[API] Iniciando treinamento: ${terapeutaId} / ${casoId}`);
    
    const resultado = await pacienteService.iniciarTreinamento(terapeutaId, casoId);
    
    res.json(resultado);
  })
);

/**
 * POST /api/paciente/mensagem
 * 
 * Envia mensagem do terapeuta e recebe resposta do paciente.
 * 
 * @body {string} terapeutaId - ID do terapeuta
 * @body {string} casoId - ID do caso
 * @body {string} mensagem - Mensagem do terapeuta
 * 
 * @example
 * // Request:
 * POST /api/paciente/mensagem
 * { 
 *   "terapeutaId": "user-123", 
 *   "casoId": "renata",
 *   "mensagem": "Como você está se sentindo hoje, Renata?" 
 * }
 * 
 * // Response:
 * {
 *   sucesso: true,
 *   resposta: "Oi, obrigada por perguntar...",
 *   momentosDetectados: [...],
 *   estado: { alianca: 4.5, ... }
 * }
 */
router.post('/mensagem',
  validarCampos(['terapeutaId', 'casoId', 'mensagem']),
  asyncHandler(async (req, res) => {
    const { terapeutaId, casoId, mensagem } = req.body;
    
    // Validação adicional
    if (mensagem.trim().length === 0) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Mensagem não pode estar vazia'
      });
    }
    
    console.log(`[API] Mensagem de ${terapeutaId}: ${mensagem.substring(0, 50)}...`);
    
    const resultado = await pacienteService.enviarMensagem(terapeutaId, casoId, mensagem);
    
    res.json(resultado);
  })
);

/**
 * POST /api/paciente/momento
 * 
 * Registra avaliação de um momento de verdade.
 * Chamado quando o sistema detecta e avalia uma intervenção.
 * 
 * @body {string} terapeutaId - ID do terapeuta
 * @body {string} casoId - ID do caso
 * @body {Object} momento - Dados do momento
 * @body {string} momento.id - ID do momento (ex: 'minimizacao')
 * @body {string} momento.nome - Nome do momento
 * @body {string} momento.respostaTerapeuta - O que o terapeuta disse
 * @body {string} momento.classificacao - 'excelente', 'boa', 'ok', 'erro'
 */
router.post('/momento',
  validarCampos(['terapeutaId', 'casoId', 'momento']),
  asyncHandler(async (req, res) => {
    const { terapeutaId, casoId, momento } = req.body;
    
    // Valida classificação
    const classificacoesValidas = ['excelente', 'boa', 'ok', 'erro'];
    if (!classificacoesValidas.includes(momento.classificacao)) {
      return res.status(400).json({
        sucesso: false,
        erro: `Classificação inválida. Use: ${classificacoesValidas.join(', ')}`
      });
    }
    
    console.log(`[API] Momento registrado: ${momento.id} / ${momento.classificacao}`);
    
    const resultado = await pacienteService.registrarMomento(terapeutaId, casoId, momento);
    
    res.json(resultado);
  })
);

/**
 * POST /api/paciente/finalizar-sessao
 * 
 * Finaliza a sessão atual e avança para a próxima.
 * 
 * @body {string} terapeutaId - ID do terapeuta
 * @body {string} casoId - ID do caso
 * @body {string} resumo - Resumo da sessão (opcional)
 */
router.post('/finalizar-sessao',
  validarCampos(['terapeutaId', 'casoId']),
  asyncHandler(async (req, res) => {
    const { terapeutaId, casoId, resumo } = req.body;
    
    console.log(`[API] Finalizando sessão: ${terapeutaId} / ${casoId}`);
    
    const resultado = await pacienteService.finalizarSessao(terapeutaId, casoId, resumo);
    
    res.json(resultado);
  })
);

// =============================================================================
// ROTAS DE CONSULTA
// =============================================================================

/**
 * GET /api/paciente/estado/:terapeutaId/:casoId
 * 
 * Busca o estado atual de um treinamento.
 */
router.get('/estado/:terapeutaId/:casoId', (req, res) => {
  try {
    const { terapeutaId, casoId } = req.params;
    
    const estado = pacienteService.buscarEstado(terapeutaId, casoId);
    
    if (!estado) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Treinamento não encontrado'
      });
    }
    
    res.json({
      sucesso: true,
      estado: {
        sessaoAtual: estado.sessaoAtual,
        alianca: estado.alianca,
        profundidade: estado.profundidadePermitida,
        defesas: estado.defesasAtivas,
        status: estado.status,
        temasRevelados: Object.entries(estado.historicoRevelado)
          .filter(([_, v]) => v)
          .map(([k, _]) => k),
        progressos: Object.entries(estado.progresso)
          .filter(([_, v]) => v)
          .map(([k, _]) => k)
      }
    });
    
  } catch (error) {
    console.error('[API] Erro ao buscar estado:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar estado'
    });
  }
});

/**
 * GET /api/paciente/historico/:terapeutaId/:casoId
 * 
 * Busca histórico de mensagens da sessão atual.
 */
router.get('/historico/:terapeutaId/:casoId',
  asyncHandler(async (req, res) => {
    const { terapeutaId, casoId } = req.params;
    
    const historico = await pacienteService.buscarHistorico(terapeutaId, casoId);
    
    res.json({
      sucesso: true,
      quantidade: historico.length,
      mensagens: historico
    });
  })
);

/**
 * GET /api/paciente/estatisticas/:terapeutaId/:casoId
 * 
 * Retorna estatísticas do treinamento.
 */
router.get('/estatisticas/:terapeutaId/:casoId', (req, res) => {
  try {
    const { terapeutaId, casoId } = req.params;
    
    const estatisticas = pacienteService.gerarEstatisticas(terapeutaId, casoId);
    
    if (!estatisticas) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Treinamento não encontrado'
      });
    }
    
    res.json({
      sucesso: true,
      estatisticas
    });
    
  } catch (error) {
    console.error('[API] Erro ao gerar estatísticas:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao gerar estatísticas'
    });
  }
});

// =============================================================================
// MIDDLEWARE DE ERRO
// =============================================================================

/**
 * Handler de erros global para as rotas.
 */
router.use((error, req, res, next) => {
  console.error('[API] Erro:', error);
  
  res.status(500).json({
    sucesso: false,
    erro: error.message || 'Erro interno do servidor'
  });
});

// =============================================================================
// EXPORTAÇÃO
// =============================================================================

module.exports = router;
