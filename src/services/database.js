/**
 * Database Service - Supabase
 */

const { supabase } = require('./supabase');
const logger = require('../config/logger');

/**
 * Salvar dados
 */
async function saveToBoostspace(collection, data) {
  try {
    logger.info('💾 Salvando no Supabase', { collection });

    const { data: result, error } = await supabase
      .from(collection)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info('✅ Salvo no Supabase', { collection, id: result.id });
    return result;

  } catch (error) {
    console.error('🔍 ERRO DETALHADO SUPABASE (SAVE):');
    console.error('Message:', error.message);
    console.error('Full error:', error);
    
    logger.error('❌ Erro ao salvar no Supabase', { 
      error: error.message,
      collection 
    });
    throw new Error(`Falha ao salvar: ${error.message}`);
  }
}

/**
 * Buscar dados
 */
async function getFromBoostspace(collection, filters = {}) {
  try {
    logger.info('🔍 Buscando no Supabase', { collection, filters });

    let query = supabase.from(collection).select('*');

    // Aplicar filtros
    if (filters.email) {
      query = query.eq('email', filters.email);
    }

    if (filters.id) {
      query = query.eq('id', filters.id);
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    logger.info('✅ Encontrados no Supabase', { count: data?.length || 0 });
    return data || [];

  } catch (error) {
    console.error('🔍 ERRO DETALHADO SUPABASE (GET):');
    console.error('Message:', error.message);
    console.error('Full error:', error);
    
    logger.error('❌ Erro ao buscar no Supabase', { 
      error: error.message,
      collection 
    });
    throw new Error(`Falha ao buscar: ${error.message}`);
  }
}

/**
 * Atualizar dados
 */
async function updateInBoostspace(collection, id, data) {
  try {
    logger.info('📝 Atualizando no Supabase', { collection, id });

    const { data: result, error } = await supabase
      .from(collection)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info('✅ Atualizado no Supabase', { collection, id });
    return result;

  } catch (error) {
    logger.error('❌ Erro ao atualizar no Supabase', { 
      error: error.message,
      collection,
      id 
    });
    throw new Error(`Falha ao atualizar: ${error.message}`);
  }
}

/**
 * Deletar registro
 */
async function deleteFromBoostspace(collection, id) {
  try {
    logger.info('🗑️ Deletando do Supabase', { collection, id });

    const { error } = await supabase
      .from(collection)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    logger.info('✅ Deletado do Supabase', { collection, id });
    return { success: true };

  } catch (error) {
    logger.error('❌ Erro ao deletar do Supabase', { 
      error: error.message,
      collection,
      id 
    });
    throw new Error(`Falha ao deletar: ${error.message}`);
  }
}

module.exports = {
  saveToBoostspace,
  getFromBoostspace,
  updateInBoostspace,
  deleteFromBoostspace
};