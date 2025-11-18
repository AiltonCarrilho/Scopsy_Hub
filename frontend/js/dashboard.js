/**
 * Dashboard.js - Scopsy
 * Proteção de rota + carregamento de dados do usuário
 */

const API_URL = 'http://localhost:3000';

// ========================================
// PROTEÇÃO DE ROTA
// ========================================
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token) {
        console.log('❌ Token não encontrado, redirecionando para login...');
        window.location.href = 'login.html';
        return false;
    }

    if (user) {
        try {
            const userData = JSON.parse(user);
            displayUserInfo(userData);
        } catch (error) {
            console.error('❌ Erro ao parsear dados do usuário:', error);
            // Continuar mesmo com erro (validar token no backend)
        }
    } else {
        console.log('⚠️  Nenhum dado de usuário salvo, validando token...');
    }

    // Validar token com backend
    validateToken(token);
    
    return true;
}

// ========================================
// VALIDAR TOKEN COM BACKEND
// ========================================
async function validateToken(token) {
    try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Token inválido ou expirado');
        }

        const data = await response.json();
        
        // Atualizar dados do usuário
        localStorage.setItem('user', JSON.stringify(data.user));
        displayUserInfo(data.user);
        
    } catch (error) {
        console.error('❌ Erro ao validar token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// ========================================
// EXIBIR INFORMAÇÕES DO USUÁRIO
// ========================================
function displayUserInfo(user) {
    if (!user) {
        console.warn('⚠️  Nenhum dado de usuário para exibir');
        return;
    }

    // Nome do usuário no header
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = user.name || user.email;
    } else {
        console.warn('⚠️  Elemento #userName não encontrado no DOM');
    }

    // Plano do usuário (se existir)
    const planElement = document.getElementById('userPlan');
    if (planElement && user.plan) {
        planElement.textContent = user.plan.toUpperCase();
    }
}

// ========================================
// CARREGAR ESTATÍSTICAS DO USUÁRIO
// ========================================
async function loadUserStats() {
    const token = localStorage.getItem('token');
    
    if (!token) return;

    try {
        // Placeholder - substituir quando backend tiver endpoint /api/dashboard/stats
        // const response = await fetch(`${API_URL}/api/dashboard/stats`, {
        //     headers: {
        //         'Authorization': `Bearer ${token}`
        //     }
        // });
        // const stats = await response.json();

        // Por enquanto, usar valores mockados
        const stats = {
            totalConversations: 0,
            casesCompleted: 0,
            diagnosticsCompleted: 0,
            badgesEarned: 0
        };

        updateStatsDisplay(stats);
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        // Se falhar, manter zeros
    }
}

// ========================================
// ATUALIZAR DISPLAY DE ESTATÍSTICAS
// ========================================
function updateStatsDisplay(stats) {
    const elements = {
        totalConversations: document.getElementById('totalConversations'),
        casesCompleted: document.getElementById('casesCompleted'),
        diagnosticsCompleted: document.getElementById('diagnosticsCompleted'),
        badgesEarned: document.getElementById('badgesEarned')
    };

    // Atualizar cada elemento se existir
    Object.keys(elements).forEach(key => {
        if (elements[key] && stats[key] !== undefined) {
            elements[key].textContent = stats[key];
        }
    });
}

// ========================================
// LOGOUT
// ========================================
function logout() {
    console.log('👋 Fazendo logout...');
    
    // Limpar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirecionar para index (landing page)
    window.location.href = 'index.html';
}

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Dashboard carregado');
    
    // Verificar autenticação
    if (!checkAuth()) {
        return; // Se não autenticado, já redirecionou
    }
    
    // Carregar estatísticas
    loadUserStats();
    
    // Adicionar event listener ao botão de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

// ========================================
// NAVEGAÇÃO PARA ASSISTENTES
// ========================================
// Os links já funcionam via <a href="chat.html?assistant=X">
// Não precisa adicionar JavaScript extra

// ========================================
// EXPORTAR FUNÇÕES (se necessário)
// ========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkAuth,
        logout,
        loadUserStats
    };
}