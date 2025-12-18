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
        // Shared Upgrade Handler
        const handleUpgrade = async (e) => {
            e.preventDefault();
            const btn = e.currentTarget;
            const originalText = btn.textContent;

            btn.textContent = 'Processando...';
            btn.style.opacity = '0.7';
            btn.style.pointerEvents = 'none';

            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/payments/create-checkout-session`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ returnUrl: window.location.href })
                });

                const data = await res.json();

                if (data.url) {
                    window.location.href = data.url;
                } else {
                    alert('Erro ao iniciar pagamento: ' + (data.error || 'Erro desconhecido'));
                    btn.textContent = originalText;
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'auto';
                }
            } catch (err) {
                console.error('Erro de checkout:', err);
                alert('Erro de conexão com o sistema de pagamento.');
                btn.textContent = originalText;
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
            }
        };

        // Attach to Modal Button
        const btnUpgradeModal = document.querySelector('.btn-upgrade-modal');
        if (btnUpgradeModal) {
            btnUpgradeModal.onclick = handleUpgrade;
        }

        // Attach to Banner Button
        const btnUpgradeBanner = trialBanner ? trialBanner.querySelector('.btn-upgrade') : null;
        if (btnUpgradeBanner) {
            btnUpgradeBanner.onclick = handleUpgrade;
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

    // ZONA DE PERIGO: PORTAL DO CLIENTE (Premium Only)
    if (isPremium) {
        const userInfo = document.querySelector('.user-info');
        // Evitar duplicar
        if (userInfo && !document.getElementById('btnPortal')) {
            const btnPortal = document.createElement('button');
            btnPortal.id = 'btnPortal';
            btnPortal.className = 'btn-logout';
            // Estilo diferenciado (dourado/escuro)
            btnPortal.style.background = 'transparent';
            btnPortal.style.border = '1px solid rgba(255,255,255,0.3)';
            btnPortal.style.marginRight = '12px';
            btnPortal.style.fontSize = '0.9rem';
            btnPortal.textContent = 'Gerenciar Assinatura';

            btnPortal.onclick = async () => {
                btnPortal.textContent = 'Carregando...';
                try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${API_URL}/api/payments/create-portal-session`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ returnUrl: window.location.href })
                    });
                    const data = await res.json();
                    if (data.url) {
                        window.location.href = data.url;
                    } else {
                        alert('Erro ao abrir portal: ' + (data.error || 'Erro desconhecido'));
                        btnPortal.textContent = 'Gerenciar Assinatura';
                    }
                } catch (e) {
                    console.error('Portal Error:', e);
                    alert('Erro de conexão');
                    btnPortal.textContent = 'Gerenciar Assinatura';
                }
            };

            const btnLogout = userInfo.querySelector('.btn-logout');
            if (btnLogout) {
                userInfo.insertBefore(btnPortal, btnLogout);
            } else {
                userInfo.appendChild(btnPortal);
            }
        }
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
// CARREGAR FRESCOR CLÍNICO
// ========================================
async function loadFreshness() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${API_URL}/api/freshness/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) return;

        const data = await res.json();

        if (data.success && data.freshness) {
            const freshness = data.freshness;
            const indicator = document.getElementById('freshnessIndicator');

            // Mostrar apenas para Premium
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.plan !== 'premium') {
                indicator.style.display = 'none';
                return;
            }

            // Exibir indicador
            indicator.style.display = 'flex';
            indicator.className = `freshness-indicator ${freshness.status}`;

            // Atualizar conteúdo
            document.getElementById('freshnessIcon').textContent = freshness.emoji;
            document.getElementById('freshnessTitle').textContent = freshness.message;
            document.getElementById('freshnessPercentage').textContent = `${freshness.percentage}%`;
            document.getElementById('freshnessDescription').textContent = freshness.description;
            document.getElementById('freshnessFill').style.width = `${freshness.percentage}%`;

            console.log('💧 Frescor carregado:', freshness);
        }

    } catch (error) {
        console.error('Erro ao carregar frescor:', error);
    }
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
    displayGamification(); // ⭐ Gamificação
    loadStreak();          // 🔥 Streaks
    loadMissions();        // 🎯 Missões
    // loadBadges();       // 🏆 Badges (REMOVIDO)
    loadFreshness();       // 💧 Frescor

    // Adicionar event listener ao botão de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

// ========================================
// GAMIFICAÇÃO - EXIBIR COGNITS E NÍVEL
// ========================================
async function displayGamification() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${API_URL}/api/progress/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        // Verificar se é Premium
        if (data.plan !== 'premium') {
            document.getElementById('levelCard').style.display = 'none';
            return;
        }

        // Exibir card de nível
        const levelCard = document.getElementById('levelCard');
        if (levelCard) {
            levelCard.style.display = 'block';
        }

        // Atualizar dados
        const levelNumber = document.getElementById('levelNumber');
        const levelTitle = document.getElementById('levelTitle');
        const cognitAmount = document.getElementById('cognitAmount');
        const currentCognits = document.getElementById('currentCognits');
        const targetCognits = document.getElementById('targetCognits');
        const remainingCognits = document.getElementById('remainingCognits');
        const nextLevelName = document.getElementById('nextLevelName');
        const levelProgressBar = document.getElementById('levelProgressBar');

        if (levelNumber) levelNumber.textContent = data.level || 1;
        if (levelTitle) levelTitle.textContent = data.clinical_title || 'Estudante de Lente';
        if (cognitAmount) cognitAmount.textContent = data.cognits || 0;
        if (currentCognits) currentCognits.textContent = data.cognits || 0;
        if (targetCognits) targetCognits.textContent = data.next_level?.at || 151;
        if (remainingCognits) remainingCognits.textContent = data.next_level?.remaining || 151;
        if (nextLevelName) nextLevelName.textContent = getNextLevelName(data.level || 1);

        // Atualizar barra de progresso
        if (levelProgressBar) {
            const progress = ((data.cognits || 0) / (data.next_level?.at || 151)) * 100;
            levelProgressBar.style.width = `${Math.min(progress, 100)}%`;
        }

    } catch (error) {
        console.error('Erro ao carregar gamificação:', error);
    }
}

function getNextLevelName(currentLevel) {
    const levels = {
        1: 'Observador Clínico',
        2: 'Apontador de Sintomas',
        3: 'Decodificador Diagnóstico',
        4: 'Mapeador de Comorbidades',
        5: 'Construtor de Linha do Tempo',
        6: 'Lente Rápida',
        7: 'Escultor de Conceituação',
        8: 'Terapeuta de Estratégia',
        9: 'Arquiteto Cognitivo',
        10: 'Mentor de Diagnóstico',
        11: 'Clínico de Alta Performance',
        12: 'Maestria Absoluta'
    };
    return levels[currentLevel + 1] || 'Maestria Absoluta';
}

// ========================================
// NAVEGAÇÃO PARA ASSISTENTES
// ========================================
// Os links já funcionam via <a href="chat.html?assistant=X">
// Não precisa adicionar JavaScript extra

// ========================================
// ========================================
// GAMIFICATION: MISSIONS
// ========================================
async function loadMissions() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/missions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success && data.missions) {
            document.getElementById('missionsSection').style.display = 'block';
            renderMissions(data.missions);
            startMissionTimer();
        }
    } catch (e) {
        console.error('Erro ao carregar missões:', e);
    }
}

function renderMissions(missions) {
    const grid = document.getElementById('missionsGrid');
    if (!grid) return;

    grid.innerHTML = missions.map(mission => {
        const percent = Math.min((mission.progress / mission.target) * 100, 100);
        const isCompleted = mission.is_completed;
        const reward = mission.reward_cognits;

        return `
        <div class="mission-card ${isCompleted ? 'completed' : ''}">
            <div class="mission-meta">
                <span class="mission-desc">${mission.description}</span>
                <div class="mission-reward">
                    <img src="assets/icons/cognit-24.svg" width="16" height="16">
                    +${reward}
                </div>
            </div>
            
            <svg class="check-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>

            <div class="mission-progress-container">
                <div class="mission-progress-bar">
                    <div class="mission-progress-fill" style="width: ${percent}%"></div>
                </div>
                <div class="mission-progress-text">
                    ${isCompleted ? '<span>Completado!</span>' : `<span>${mission.progress} / ${mission.target}</span>`}
                    ${isCompleted ? '' : `<span>${Math.round(percent)}%</span>`}
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function startMissionTimer() {
    const timerEl = document.getElementById('missionResetTimer');
    if (!timerEl) return;

    function update() {
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const diff = tomorrow - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        timerEl.textContent = `${hours}h ${minutes}m`;
    }

    update();
    setInterval(update, 60000); // Atualizar a cada minuto
}

// ========================================
// GAMIFICATION: BADGES
// ========================================
async function loadBadges() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/gamification/badges`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success && data.badges) {
            renderBadges(data.badges);
        }
    } catch (e) {
        console.error('Erro ao carregar badges:', e);
    }
}

function renderBadges(badges) {
    const scroller = document.getElementById('badgesScroller');
    if (!scroller) return;

    scroller.innerHTML = badges.map(badge => `
        <div class="badge-item ${badge.earned ? 'unlocked' : ''}" data-desc="${badge.description} (${badge.xp_bonus} XP)">
            <div class="badge-icon-container">
                ${getBadgeIcon(badge.icon_url)}
            </div>
            <div class="badge-name">${badge.name}</div>
        </div>
    `).join('');
}

function getBadgeIcon(iconName) {
    // Mapa simples de emojis para ícones (ou SVG path)
    const map = {
        'badge-fire-3': '🔥',
        'badge-fire-7': '🌋',
        'badge-fire-30': '☄️',
        'badge-flag': '🏳️',
        'badge-footprint': '👣',
        'badge-magnifier-bronze': '🥉',
        'badge-magnifier-gold': '🥇',
        'badge-eye': '👁️',
        'default': '🏆'
    };
    return map[iconName] || map['default'];
}
async function loadStreak() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/streaks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success && data.streak) {
            updateStreakUI(data.streak);
        }
    } catch (e) {
        console.error('Erro ao carregar streak:', e);
    }
}

function updateStreakUI(streakData) {
    const container = document.getElementById('streakIndicator');
    const count = document.getElementById('streakCount');
    const icon = document.getElementById('streakIcon');

    if (!container || !count) return;

    const current = streakData.current_streak || 0;

    container.style.display = 'flex';
    count.textContent = current;

    if (current > 0) {
        if (icon) {
            icon.classList.remove('gray');
            icon.classList.add('lit');
        }
        count.classList.remove('gray');

        // Se fez hoje, tooltip muda
        if (streakData.today === streakData.last_activity_date) {
            const tooltip = container.querySelector('.streak-tooltip');
            if (tooltip) {
                tooltip.innerHTML = '<span class="fire-text">Sequência Turbo!</span><br>Você já praticou hoje! 🔥';
            }
        }
    } else {
        if (icon) {
            icon.classList.add('gray');
            icon.classList.remove('lit');
        }
        count.classList.add('gray');
    }
}

// EXPORTAR FUNÇÕES (se necessário)
// ========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkAuth,
        logout,
        loadUserStats
    };
}