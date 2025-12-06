/**
 * ============================================================================
 * SCOPSY - SERVIÇO DE ARMAZENAMENTO DE ESTADO
 * ============================================================================
 * 
 * Este serviço gerencia a persistência do estado dos pacientes.
 * 
 * ============================================================================
 * ESTRATÉGIA DE STORAGE:
 * ============================================================================
 * 
 * MVP (ATUAL): Arquivos JSON no disco
 * - Simples de implementar
 * - Funciona para desenvolvimento e testes
 * - Não requer configuração adicional
 * 
 * PRODUÇÃO (FUTURO): Supabase/PostgreSQL
 * - Escalável
 * - Persistente
 * - Backup automático
 * 
 * ============================================================================
 * COMO MIGRAR PARA SUPABASE:
 * ============================================================================
 * 
 * 1. Crie a tabela no Supabase (SQL está em docs/database-schema.sql)
 * 
 * 2. Descomente a seção "SUPABASE STORAGE" abaixo
 * 
 * 3. Comente a seção "JSON STORAGE"
 * 
 * 4. Configure SUPABASE_URL e SUPABASE_KEY no .env
 * 
 * 5. Teste com um usuário antes de migrar todos
 * 
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

/**
 * Pasta onde os estados são salvos (JSON storage).
 * Certifique-se de que esta pasta existe e tem permissão de escrita.
 */
const PASTA_ESTADOS = path.join(__dirname, '../../data/estados');

/**
 * Garante que a pasta de estados existe.
 * Executado quando o módulo é carregado.
 */
function garantirPastaExiste() {
  if (!fs.existsSync(PASTA_ESTADOS)) {
    fs.mkdirSync(PASTA_ESTADOS, { recursive: true });
    console.log(`[EstadoStorage] Pasta criada: ${PASTA_ESTADOS}`);
  }
}

// Executa ao carregar o módulo
garantirPastaExiste();

// =============================================================================
// JSON STORAGE (MVP)
// =============================================================================
// Esta seção usa arquivos JSON para armazenar estado.
// Simples e funcional para desenvolvimento.

/**
 * Salva o estado de um treinamento em arquivo JSON.
 * 
 * @param {string} chave - Identificador único (ex: 'terapeuta123_renata')
 * @param {Object} estado - Objeto de estado completo
 * @returns {boolean} - Sucesso da operação
 * 
 * @example
 * salvarEstado('terapeuta123_renata', estadoAtual);
 */
function salvarEstado(chave, estado) {
  try {
    // Sanitiza a chave para nome de arquivo
    const chaveSanitizada = chave.replace(/[^a-zA-Z0-9_-]/g, '_');
    const caminhoArquivo = path.join(PASTA_ESTADOS, `${chaveSanitizada}.json`);
    
    // Adiciona metadados
    estado._chave = chave;
    estado._salvoEm = new Date().toISOString();
    
    // Salva com formatação para debug
    fs.writeFileSync(caminhoArquivo, JSON.stringify(estado, null, 2));
    
    console.log(`[EstadoStorage] Estado salvo: ${chaveSanitizada}`);
    return true;
    
  } catch (error) {
    console.error(`[EstadoStorage] Erro ao salvar estado:`, error);
    return false;
  }
}

/**
 * Carrega o estado de um treinamento do arquivo JSON.
 * 
 * @param {string} chave - Identificador único
 * @returns {Object|null} - Estado carregado ou null se não existir
 * 
 * @example
 * const estado = carregarEstado('terapeuta123_renata');
 * if (estado) {
 *   console.log('Sessão atual:', estado.sessaoAtual);
 * }
 */
function carregarEstado(chave) {
  try {
    const chaveSanitizada = chave.replace(/[^a-zA-Z0-9_-]/g, '_');
    const caminhoArquivo = path.join(PASTA_ESTADOS, `${chaveSanitizada}.json`);
    
    if (!fs.existsSync(caminhoArquivo)) {
      console.log(`[EstadoStorage] Estado não encontrado: ${chaveSanitizada}`);
      return null;
    }
    
    const dados = fs.readFileSync(caminhoArquivo, 'utf-8');
    const estado = JSON.parse(dados);
    
    console.log(`[EstadoStorage] Estado carregado: ${chaveSanitizada}`);
    return estado;
    
  } catch (error) {
    console.error(`[EstadoStorage] Erro ao carregar estado:`, error);
    return null;
  }
}

/**
 * Verifica se existe estado salvo para uma chave.
 * 
 * @param {string} chave - Identificador único
 * @returns {boolean}
 */
function existeEstado(chave) {
  const chaveSanitizada = chave.replace(/[^a-zA-Z0-9_-]/g, '_');
  const caminhoArquivo = path.join(PASTA_ESTADOS, `${chaveSanitizada}.json`);
  return fs.existsSync(caminhoArquivo);
}

/**
 * Remove o estado de um treinamento.
 * 
 * @param {string} chave - Identificador único
 * @returns {boolean}
 */
function removerEstado(chave) {
  try {
    const chaveSanitizada = chave.replace(/[^a-zA-Z0-9_-]/g, '_');
    const caminhoArquivo = path.join(PASTA_ESTADOS, `${chaveSanitizada}.json`);
    
    if (fs.existsSync(caminhoArquivo)) {
      fs.unlinkSync(caminhoArquivo);
      console.log(`[EstadoStorage] Estado removido: ${chaveSanitizada}`);
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error(`[EstadoStorage] Erro ao remover estado:`, error);
    return false;
  }
}

/**
 * Lista todos os estados salvos.
 * 
 * @returns {Array<Object>} - Lista com resumo de cada estado
 */
function listarEstados() {
  try {
    const arquivos = fs.readdirSync(PASTA_ESTADOS);
    
    return arquivos
      .filter(arquivo => arquivo.endsWith('.json'))
      .map(arquivo => {
        try {
          const caminho = path.join(PASTA_ESTADOS, arquivo);
          const dados = JSON.parse(fs.readFileSync(caminho, 'utf-8'));
          return {
            chave: dados._chave || arquivo.replace('.json', ''),
            casoId: dados.casoId,
            terapeutaId: dados.terapeutaId,
            sessaoAtual: dados.sessaoAtual,
            status: dados.status,
            atualizadoEm: dados.atualizadoEm
          };
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
      
  } catch (error) {
    console.error(`[EstadoStorage] Erro ao listar estados:`, error);
    return [];
  }
}

/**
 * Lista estados de um terapeuta específico.
 * 
 * @param {string} terapeutaId - ID do terapeuta
 * @returns {Array<Object>}
 */
function listarEstadosPorTerapeuta(terapeutaId) {
  return listarEstados().filter(e => e.terapeutaId === terapeutaId);
}

// =============================================================================
// SUPABASE STORAGE (PRODUÇÃO - DESCOMENTRAR QUANDO MIGRAR)
// =============================================================================
/*

const { createClient } = require('@supabase/supabase-js');

// Cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Tabela no Supabase
const TABELA_ESTADOS = 'paciente_estados';

async function salvarEstadoSupabase(chave, estado) {
  try {
    // Verifica se já existe
    const { data: existente } = await supabase
      .from(TABELA_ESTADOS)
      .select('id')
      .eq('chave', chave)
      .single();
    
    if (existente) {
      // Atualiza
      const { error } = await supabase
        .from(TABELA_ESTADOS)
        .update({
          estado: estado,
          updated_at: new Date().toISOString()
        })
        .eq('chave', chave);
      
      if (error) throw error;
    } else {
      // Insere
      const { error } = await supabase
        .from(TABELA_ESTADOS)
        .insert({
          chave: chave,
          terapeuta_id: estado.terapeutaId,
          caso_id: estado.casoId,
          estado: estado
        });
      
      if (error) throw error;
    }
    
    console.log(`[EstadoStorage/Supabase] Estado salvo: ${chave}`);
    return true;
    
  } catch (error) {
    console.error(`[EstadoStorage/Supabase] Erro ao salvar:`, error);
    return false;
  }
}

async function carregarEstadoSupabase(chave) {
  try {
    const { data, error } = await supabase
      .from(TABELA_ESTADOS)
      .select('estado')
      .eq('chave', chave)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }
    
    return data?.estado || null;
    
  } catch (error) {
    console.error(`[EstadoStorage/Supabase] Erro ao carregar:`, error);
    return null;
  }
}

// Para usar Supabase, substitua as exportações no final por:
// module.exports = {
//   salvarEstado: salvarEstadoSupabase,
//   carregarEstado: carregarEstadoSupabase,
//   // ... outras funções adaptadas
// };

*/

// =============================================================================
// UTILITÁRIOS
// =============================================================================

/**
 * Limpa estados antigos (mais de X dias sem atualização).
 * Útil para manutenção periódica.
 * 
 * @param {number} diasLimite - Estados mais antigos que isso serão removidos
 * @returns {number} - Quantidade de estados removidos
 */
function limparEstadosAntigos(diasLimite = 30) {
  const estados = listarEstados();
  const agora = new Date();
  let removidos = 0;
  
  estados.forEach(estado => {
    const atualizado = new Date(estado.atualizadoEm);
    const diasDesdeAtualizacao = (agora - atualizado) / (1000 * 60 * 60 * 24);
    
    if (diasDesdeAtualizacao > diasLimite) {
      if (removerEstado(estado.chave)) {
        removidos++;
      }
    }
  });
  
  console.log(`[EstadoStorage] Limpeza: ${removidos} estados removidos`);
  return removidos;
}

/**
 * Faz backup de todos os estados para um arquivo único.
 * 
 * @param {string} caminhoBackup - Caminho do arquivo de backup
 * @returns {boolean}
 */
function fazerBackup(caminhoBackup = null) {
  try {
    const caminho = caminhoBackup || path.join(PASTA_ESTADOS, `backup_${Date.now()}.json`);
    const estados = listarEstados().map(resumo => {
      return carregarEstado(resumo.chave);
    });
    
    fs.writeFileSync(caminho, JSON.stringify(estados, null, 2));
    console.log(`[EstadoStorage] Backup criado: ${caminho}`);
    return true;
    
  } catch (error) {
    console.error(`[EstadoStorage] Erro ao fazer backup:`, error);
    return false;
  }
}

// =============================================================================
// EXPORTAÇÕES
// =============================================================================

module.exports = {
  // Operações principais
  salvarEstado,
  carregarEstado,
  existeEstado,
  removerEstado,
  
  // Listagens
  listarEstados,
  listarEstadosPorTerapeuta,
  
  // Manutenção
  limparEstadosAntigos,
  fazerBackup,
  
  // Constantes (útil para debug)
  PASTA_ESTADOS
};
