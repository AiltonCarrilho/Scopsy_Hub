/**
 * auth.js - Funções compartilhadas de autenticação
 * Scopsy v4.0
 */

// API_URL é definido em config.js (carregado antes deste arquivo)
// Não redeclarar para evitar conflitos!

// ========================================
// VERIFICAR SE ESTÁ AUTENTICADO
// ========================================
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// ========================================
// OBTER TOKEN
// ========================================
function getToken() {
    return localStorage.getItem('token');
}

// ========================================
// OBTER USUÁRIO
// ========================================
function getUser() {
    const userStr = localStorage.getItem('user');
    try {
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Erro ao parsear dados do usuário:', error);
        return null;
    }
}

// ========================================
// FAZER LOGOUT
// ========================================
function logout() {
    console.log('👋 Fazendo logout...');
    
    // Limpar todos os dados de autenticação
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Redirecionar para landing page
    window.location.href = 'index.html';
}

// ========================================
// VALIDAR TOKEN COM BACKEND
// ========================================
async function validateToken() {
    const token = getToken();
    
    if (!token) {
        return false;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Token inválido');
        }
        
        const data = await response.json();
        
        // Atualizar dados do usuário
        localStorage.setItem('user', JSON.stringify(data.user));
        
        return true;
        
    } catch (error) {
        console.error('❌ Token inválido:', error);
        
        // Limpar dados inválidos
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        return false;
    }
}

// ========================================
// REDIRECIONAR PARA LOGIN SE NÃO AUTENTICADO
// ========================================
function requireAuth() {
    if (!isAuthenticated()) {
        console.log('❌ Não autenticado, redirecionando...');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// ========================================
// ADICIONAR HEADER DE AUTORIZAÇÃO
// ========================================
function getAuthHeaders() {
    const token = getToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// ========================================
// EXPORTAR PARA USO EM OUTROS ARQUIVOS
// ========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isAuthenticated,
        getToken,
        getUser,
        logout,
        validateToken,
        requireAuth,
        getAuthHeaders
    };
}