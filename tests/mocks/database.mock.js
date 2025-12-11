/**
 * Mock do Database Service (Boost.space)
 *
 * Simula as operações de banco de dados sem fazer chamadas reais
 */

// "Banco de dados" em memória para os testes
let mockDatabase = {
  users: [],
  user_stats: [],
  conversations: [],
  messages: []
};

/**
 * Reseta o banco de dados mockado (usar em beforeEach)
 */
function resetMockDatabase() {
  mockDatabase = {
    users: [],
    user_stats: [],
    conversations: [],
    messages: []
  };
}

/**
 * Configura dados iniciais no banco mockado
 * @param {Object} data - Dados por tabela
 */
function seedMockDatabase(data) {
  mockDatabase = { ...mockDatabase, ...data };
}

/**
 * Mock de saveToBoostspace - Salva dados (INSERT)
 * @param {string} collection - Nome da coleção/tabela
 * @param {Object} data - Dados a serem salvos
 * @returns {Promise<Object>} Dados salvos com ID gerado
 */
async function saveToBoostspace(collection, data) {
  if (!mockDatabase[collection]) {
    mockDatabase[collection] = [];
  }

  // Gerar ID se não existir
  const newItem = {
    id: data.id || `mock-id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...data
  };

  mockDatabase[collection].push(newItem);
  return Promise.resolve(newItem);
}

/**
 * Mock de getFromBoostspace - Busca dados (SELECT)
 * @param {string} collection - Nome da coleção/tabela
 * @param {Object} filters - Filtros de busca
 * @returns {Promise<Array>} Array com resultados
 */
async function getFromBoostspace(collection, filters = {}) {
  if (!mockDatabase[collection]) {
    return Promise.resolve([]);
  }

  let results = mockDatabase[collection];

  // Aplicar filtros
  if (filters && Object.keys(filters).length > 0) {
    results = results.filter(item => {
      for (const [key, value] of Object.entries(filters)) {
        // Comparação case-insensitive para email
        if (key === 'email') {
          if (item[key]?.toLowerCase() !== value?.toLowerCase()) {
            return false;
          }
        } else if (item[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  return Promise.resolve(results);
}

/**
 * Mock de updateInBoostspace - Atualiza dados (UPDATE)
 * @param {string} collection - Nome da coleção/tabela
 * @param {string} id - ID do item a atualizar
 * @param {Object} data - Dados a serem atualizados
 * @returns {Promise<Object>} Dados atualizados
 */
async function updateInBoostspace(collection, id, data) {
  if (!mockDatabase[collection]) {
    throw new Error(`Collection ${collection} not found`);
  }

  const index = mockDatabase[collection].findIndex(item => item.id === id);

  if (index === -1) {
    throw new Error(`Item with id ${id} not found in ${collection}`);
  }

  // Atualizar item
  mockDatabase[collection][index] = {
    ...mockDatabase[collection][index],
    ...data,
    updated_at: new Date().toISOString()
  };

  return Promise.resolve(mockDatabase[collection][index]);
}

/**
 * Mock de deleteFromBoostspace - Deleta dados (DELETE)
 * @param {string} collection - Nome da coleção/tabela
 * @param {string} id - ID do item a deletar
 * @returns {Promise<boolean>} True se deletado
 */
async function deleteFromBoostspace(collection, id) {
  if (!mockDatabase[collection]) {
    return Promise.resolve(false);
  }

  const index = mockDatabase[collection].findIndex(item => item.id === id);

  if (index === -1) {
    return Promise.resolve(false);
  }

  mockDatabase[collection].splice(index, 1);
  return Promise.resolve(true);
}

/**
 * Obter estado atual do banco mockado (para debug)
 */
function getMockDatabase() {
  return mockDatabase;
}

module.exports = {
  saveToBoostspace,
  getFromBoostspace,
  updateInBoostspace,
  deleteFromBoostspace,
  resetMockDatabase,
  seedMockDatabase,
  getMockDatabase
};
