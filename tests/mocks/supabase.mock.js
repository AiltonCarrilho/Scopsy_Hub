/**
 * Mock do Supabase Client para Testes
 *
 * Simula as respostas do Supabase sem fazer chamadas reais ao banco
 */

/**
 * Cria um mock do Supabase client
 * @param {Object} mockData - Dados mockados por tabela
 * @returns {Object} Mock do Supabase client
 */
function createMockSupabaseClient(mockData = {}) {
  function createQueryBuilder(table) {
    const builder = {
      currentTable: table,
      filters: {},

      from(tableName) {
        return createQueryBuilder(tableName);
      },

      select(columns) {
        this.filters.select = columns;
        return this;
      },

      eq(column, value) {
        this.filters[column] = value;
        return this;
      },

      single() {
        // Retorna apenas o primeiro item
        const tableData = mockData[this.currentTable] || [];

        // Aplicar filtros
        let filtered = tableData.filter(item => {
          for (const [key, value] of Object.entries(this.filters)) {
            if (key === 'select') continue;
            if (item[key] !== value) return false;
          }
          return true;
        });

        if (filtered.length === 0) {
          return Promise.resolve({
            data: null,
            error: { code: 'PGRST116', message: 'Not found' }
          });
        }

        return Promise.resolve({
          data: filtered[0],
          error: null
        });
      },

      // Fazer o query builder ser "thenable" (compatível com async/await)
      then(resolve, reject) {
        const tableData = mockData[this.currentTable] || [];

        // Aplicar filtros
        let filtered = tableData.filter(item => {
          for (const [key, value] of Object.entries(this.filters)) {
            if (key === 'select') continue;
            if (item[key] !== value) return false;
          }
          return true;
        });

        const result = {
          data: filtered,
          error: null
        };

        // Resolve como uma Promise de verdade
        if (resolve) {
          resolve(result);
        }
        return Promise.resolve(result);
      },

      catch(handler) {
        return this;
      }
    };

    return builder;
  }

  return {
    from: (table) => createQueryBuilder(table)
  };
}

/**
 * Fixtures de dados para testes
 */
const mockUserProgress = [
  {
    id: '1',
    user_id: 'user-123',
    assistant_type: 'case',
    total_cases: 10,
    correct_diagnoses: 8,
    xp_points: 100,
    last_activity_date: new Date().toISOString().split('T')[0] // Hoje
  },
  {
    id: '2',
    user_id: 'user-123',
    assistant_type: 'diagnostic',
    total_cases: 5,
    correct_diagnoses: 4,
    xp_points: 50,
    last_activity_date: new Date().toISOString().split('T')[0]
  }
];

const mockUserStats = {
  id: '1',
  user_id: 'user-123',
  cases_completed: 15,
  practice_hours: 2.5,
  accuracy: 80,
  streak_days: 3,
  last_activity: new Date().toISOString(),
  badges: ['first-case', 'streak-7'],
  xp_points: 150
};

module.exports = {
  createMockSupabaseClient,
  mockUserProgress,
  mockUserStats
};
