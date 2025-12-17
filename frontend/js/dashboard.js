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

    // Lógica Trial vs Premium
    const isPremium = user.plan === 'premium' || user.plan === 'pro'; // Ajustar conforme valores reais do banco

    // Elementos de UI
    const premiumStats = document.getElementById('premiumStats');
    const trialStats = document.getElementById('trialStats');
    const trialBanner = document.getElementById('trialBanner');
    const cardJornada = document.getElementById('cardJornada');
    const modal = document.getElementById('premiumModal');
    const closeModal = document.getElementById('closePremiumModal');

    // Configurar fechar modal
    if (closeModal) {
        closeModal.onclick = () => {
            if (modal) modal.style.display = 'none';
        }
    }
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    // Resetar visibilidade
    if (premiumStats) premiumStats.style.display = 'none';
    if (trialStats) trialStats.style.display = 'none';
    if (trialBanner) trialBanner.style.display = 'none';

    if (isPremium) {
        // --- MODO PREMIUM ---
        if (premiumStats) premiumStats.style.display = 'block';

        // Jornada Normal (já vem assim do HTML, mas garantimos link)
        if (cardJornada) {
            cardJornada.onclick = null; // Remove bloqueio anterior se houver
            // Se for tag <a>, o href deve estar correto no HTML ou setado aqui
            cardJornada.href = "jornada.html";
        }

    } else {
        // --- MODO TRIAL ---
        if (trialStats) trialStats.style.display = 'block';
        if (trialBanner) trialBanner.style.display = 'flex';

        // Interceptar Clique na Jornada
        if (cardJornada) {
            cardJornada.onclick = (e) => {
                e.preventDefault(); // Não seguir link
                if (modal) modal.style.display = 'flex';
            };
        }

        // Configurar Botão de Upgrade no Modal
        const btnUpgrade = document.querySelector('.btn-upgrade-modal');
        if (btnUpgrade) {
            btnUpgrade.onclick = async (e) => {
                e.preventDefault();
                btnUpgrade.textContent = 'Processando...';
                btnUpgrade.style.opacity = '0.7';

                try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${API_URL}/api/payments/create-checkout-session`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    const data = await res.json();

                    if (data.url) {
                        window.location.href = data.url;
                    } else {
                        alert('Erro ao iniciar pagamento: ' + (data.error || 'Erro desconhecido'));
                        btnUpgrade.textContent = 'Tentar Novamente';
                        btnUpgrade.style.opacity = '1';
                    }
                } catch (err) {
                    console.error('Erro de checkout:', err);
                    alert('Erro de conexão com o sistema de pagamento.');
                    btnUpgrade.textContent = 'Tentar Novamente';
                    btnUpgrade.style.opacity = '1';
                }
            };
        }

        // Calcular Dias Restantes
        let daysLeft;
        if (user.trial_days_left !== undefined) {
            daysLeft = user.trial_days_left;
        } else {
            daysLeft = calculateDaysLeft(user.created_at);
        }

        const elDaysLeft = document.getElementById('trialDaysLeft');
        if (elDaysLeft) elDaysLeft.textContent = daysLeft;

        const elDaysLeftStat = document.getElementById('trialDaysLeftStat');
        if (elDaysLeftStat) elDaysLeftStat.textContent = daysLeft;

        // Mostrar barras de limite nos cards
        document.querySelectorAll('.trial-limit-info').forEach(el => el.style.display = 'block');
    }
}

function calculateDaysLeft(createdAt) {
    if (!createdAt) return 7;
    const start = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Use floor directly to match backend
    const remaining = 7 - diffDays;
    return remaining > 0 ? remaining : 0;
}

// ========================================
// CARREGAR ESTATÍSTICAS DO USUÁRIO
// ========================================
async function loadUserStats() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // NEW: Centralized Access to Progress/Gamification/Plan
        const res = await fetch(`${API_URL}/api/progress/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Falha ao buscar progresso');

        const data = await res.json();

        // Data format from /progress/summary:
        // { success, plan, trial_days_left, exercises_done, correct_answers, accuracy, cognits, level, clinical_title, breakdown: {...} }

        updateStatsDisplay(data);
        displayUserInfo(data); // Passa o objeto completo que já tem plano

    } catch (error) {
        console.error('Erro ao carregar stats do dashboard:', error);
    }
}

// ========================================
// ATUALIZAR DISPLAY DE ESTATÍSTICAS
// ========================================
function updateStatsDisplay(data) {
    const isPremium = data.plan !== 'free';

    if (isPremium) {
        // --- PREMIUM VIEW ---
        // 1. Raciocínio Clínico (Total de Casos + Conceituação)
        const elTotal = document.getElementById('totalConversations');
        if (elTotal) {
            // Soma do breakdown ou pegar do exercises_done se coincidir
            const totalRaciocinio = (data.breakdown?.raciocinio || 0) + (data.breakdown?.conceituacao || 0);
            elTotal.textContent = totalRaciocinio;
        }

        // 2. Radar Diagnóstico
        const elRadar = document.getElementById('casesCompleted');
        if (elRadar) elRadar.textContent = data.breakdown?.radar || 0;

        // 3. Jornada Terapêutica (Sessões completadas)
        // Mostra total de sessões/casos de jornada terapêutica
        const elJornada = document.getElementById('diagnosticsCompleted');
        if (elJornada) elJornada.textContent = data.breakdown?.jornada || 0;

        // 4. Cognits (Unidades de Sabedoria Cognitiva)
        const elCognits = document.getElementById('badgesEarned');
        if (elCognits) elCognits.textContent = data.cognits || 0;

        // EXTRA: Título Clínico (se houver onde mostrar, senão console)
        console.log(`[Gamification] Title: ${data.clinical_title} (Level ${data.level})`);

    } else {
        // --- TRIAL VIEW ---
        const LIMIT_GENERAL = 30; // Raciocínio + Radar
        const LIMIT_CONCEPT = 7;  // Conceituação

        const usedGeneral = (data.breakdown?.raciocinio || 0) + (data.breakdown?.radar || 0);
        const remainingGeneral = Math.max(0, LIMIT_GENERAL - usedGeneral);

        const usedConcept = data.breakdown?.conceituacao || 0;
        const remainingConcept = Math.max(0, LIMIT_CONCEPT - usedConcept);

        // General Limit Bar
        const elGeneral = document.getElementById('trialAccessGeneral');
        const barGeneral = document.getElementById('barGeneral');
        if (elGeneral) elGeneral.textContent = remainingGeneral;
        if (barGeneral) {
            const pct = Math.max(0, (remainingGeneral / LIMIT_GENERAL) * 100);
            barGeneral.style.width = `${pct}%`;
            if (pct < 20) barGeneral.style.backgroundColor = '#ff4444';
        }

        // Concept Limit Bar
        const elConcept = document.getElementById('trialAccessConcept');
        const barConcept = document.getElementById('barConcept');
        if (elConcept) elConcept.textContent = remainingConcept;
        if (barConcept) {
            const pct = Math.max(0, (remainingConcept / LIMIT_CONCEPT) * 100);
            barConcept.style.width = `${pct}%`;
        }

        // Update Card Text (Raciocínio)
        const limitTextRadiocinio = document.querySelector('#cardRaciocinio .limit-text');
        if (limitTextRadiocinio) limitTextRadiocinio.textContent = `Restam ${remainingGeneral} de ${LIMIT_GENERAL} acessos`;

        const barRaciocinio = document.querySelector('#cardRaciocinio .limit-bar');
        if (barRaciocinio) barRaciocinio.style.width = `${Math.max(0, (remainingGeneral / LIMIT_GENERAL) * 100)}%`;

        // Update Card Text (Radar Diagnóstico)
        const limitTextRadar = document.querySelector('#cardRadar .limit-text');
        if (limitTextRadar) limitTextRadar.textContent = `Restam ${remainingGeneral} de ${LIMIT_GENERAL} acessos`;

        const barRadar = document.querySelector('#cardRadar .limit-bar');
        if (barRadar) barRadar.style.width = `${Math.max(0, (remainingGeneral / LIMIT_GENERAL) * 100)}%`;
    }
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