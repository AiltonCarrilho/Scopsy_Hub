// ========================================
// RADAR DIAGNÓSTICO - SCOPSY LAB
// ========================================

// Detectar ambiente (desenvolvimento vs produção)
const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_URL = IS_DEV
    ? 'http://localhost:3000/api'
    : '/api';

let currentCase = null;
let caseStartTime = null;
let selectedAnswer = null;

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ diagnostic.js carregado');
    console.log('🌍 Ambiente:', IS_DEV ? 'DESENVOLVIMENTO' : 'PRODUÇÃO');
    console.log('🔗 API_URL:', API_URL);

    loadProgress(); // Carregar painel de progresso
    loadStats();    // Carregar stats antigas (temporário)
    generateNewCase();
});

// ========================================
// PAINEL DE PROGRESSO (TRIAL/PREMIUM)
// ========================================
function loadProgress() {
    console.log('🚀 loadProgress() iniciado');

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const panel = document.getElementById('progressPanel');

    if (!panel) return;

    const isPremium = user.plan === 'premium' || user.plan === 'pro';
    const isTrial = !isPremium;

    if (isTrial) {
        panel.classList.add('trial');
    }

    fetchStatsAndRender(panel, isTrial);
}

async function fetchStatsAndRender(panel, isTrial) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/progress/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data || typeof data !== 'object') {
            console.error('❌ Resposta inválida do backend:', data);
            return;
        }

        console.log('📊 Resposta /api/progress/summary:', data);

        let html = '';

        if (isTrial) {
            // MODO TRIAL - Mostra limite ESPECÍFICO de Radar Diagnóstico
            const remaining = data.remaining || {};
            const remainingRadar = Number(remaining.radar) || 0;
            const remainingDays = Number(data.trial_days_left) || 0;

            console.log('🎯 TRIAL - Radar:', { remainingRadar, remainingDays });

            html = `
                <strong>Seu Progresso Trial</strong>
                <div class="progress-grid">
                    <div class="progress-item">
                        <strong>${remainingRadar}</strong>
                        <span>Diagnósticos Restantes</span>
                    </div>
                    <div class="progress-item">
                        <strong>${remainingDays}</strong>
                        <span>Dias Restantes</span>
                    </div>
                </div>
            `;

        } else {
            // MODO PREMIUM - Mostra Cognits e Gamificação
            const cognits = Number(data.cognits) || 0;
            const level = Number(data.level) || 1;
            const title = data.clinical_title || 'Estudante de Lente';
            const diagnosticosConcluidos = Number(data.breakdown?.radar) || 0;

            console.log('💎 PREMIUM:', { cognits, level, title });

            html = `
                <strong>${title} (Nível ${level})</strong>
                <div class="progress-grid">
                    <div class="progress-item">
                        <strong>${cognits}</strong>
                        <span>Cognits</span>
                    </div>
                    <div class="progress-item">
                        <strong>${diagnosticosConcluidos}</strong>
                        <span>Diagnósticos Concluídos</span>
                    </div>
                </div>
            `;
        }

        panel.innerHTML = html;

        // ✅ Esconder barra de stats antiga para Trial (só Premium deve ver)
        const statsBar = document.getElementById('statsBar');
        if (statsBar) {
            if (isTrial) {
                statsBar.style.display = 'none';
                console.log('🚫 Stats bar escondida (Trial)');
            } else {
                statsBar.style.display = 'flex';
                console.log('✅ Stats bar visível (Premium)');
            }
        }

    } catch (e) {
        console.error("❌ Erro ao carregar stats:", e);
    }
}

// ========================================
// STATS ANTIGAS (temporário - manter compatibilidade)
// ========================================
async function loadStats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/diagnostic/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('totalCases').textContent = data.progress.total_diagnoses || 0;
            document.getElementById('accuracy').textContent =
                (data.progress.accuracy_rate || 0).toFixed(1) + '%';
            document.getElementById('xpPoints').textContent = data.progress.xp_points || 0;
        }
    } catch (error) {
        console.error('Erro ao carregar stats:', error);
    }
}

// ========================================
// GERAÇÃO DE CASOS
// ========================================
async function generateNewCase() {
    try {
        document.getElementById('caseContainer').innerHTML = '<div class="loading">⏳ Gerando caso diagnóstico...<br><small>Isso pode levar 10-15 segundos</small></div>';
        document.getElementById('feedbackContainer').innerHTML = '';

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/diagnostic/generate-case`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                level: 'intermediate',
                category: 'anxiety'
            })
        });

        const data = await response.json();

        if (data.success) {
            currentCase = {
                ...data.case,
                case_id: data.case_id,
                from_cache: data.from_cache
            };
            caseStartTime = Date.now();
            selectedAnswer = null;
            renderCase(currentCase);
        } else {
            document.getElementById('caseContainer').innerHTML =
                `<div class="error-message">Erro ao gerar caso: ${data.error}</div>`;
        }
    } catch (error) {
        console.error('Erro ao gerar caso:', error);
        document.getElementById('caseContainer').innerHTML =
            '<div class="error-message">Erro ao conectar com o servidor. Verifique se o backend está rodando.</div>';
    }
}

// ========================================
// RENDERIZAÇÃO
// ========================================
function renderCase(caseData) {
    const container = document.getElementById('caseContainer');

    const vignette = caseData.clinical_content?.vignette || 'Vinheta não disponível';
    const options = caseData.question_format?.options || [];

    let optionsHTML = '';
    options.forEach((option, index) => {
        optionsHTML += `
            <button class="option-button" data-answer="${option}" onclick="selectOption('${option.replace(/'/g, "\\'")}', this)">
                ${String.fromCharCode(65 + index)}. ${option}
            </button>
        `;
    });

    container.innerHTML = `
        <div class="case-card">
            <h3>📋 Caso Clínico</h3>
            <div class="vignette">${vignette}</div>
            <h4>Qual é o diagnóstico mais provável?</h4>
            <div class="options-grid" id="optionsGrid">${optionsHTML}</div>
            <button class="submit-btn" id="submitBtn" onclick="submitAnswer()" disabled>Enviar Resposta</button>
        </div>
    `;
}

// ========================================
// INTERAÇÃO
// ========================================
function selectOption(answer, button) {
    // Remover seleção anterior
    document.querySelectorAll('.option-button').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Adicionar seleção
    button.classList.add('selected');
    selectedAnswer = answer;

    // Habilitar botão
    document.getElementById('submitBtn').disabled = false;
}

async function submitAnswer() {
    if (!selectedAnswer) return;

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processando...';

    const timeSpent = Math.floor((Date.now() - caseStartTime) / 1000);

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/diagnostic/submit-answer`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                case_id: currentCase.case_id,
                user_answer: selectedAnswer,
                correct_diagnosis: currentCase.diagnostic_structure?.correct_diagnosis,
                time_spent_seconds: timeSpent,
                case_data: currentCase
            })
        });

        const data = await response.json();

        if (data.success) {
            // ⭐ NOVO - Exibir celebração
            if (data.cognits_gained) {
                if (data.is_correct && typeof showCelebration === 'function') {
                    showCelebration(data.cognits_gained, true);
                } else if (typeof showCognitToast === 'function') {
                    showCognitToast(data.cognits_gained, '💡 Por tentar');
                }
            }

            showResult(data.is_correct, data.feedback);
            loadStats(); // Stats antigas
            loadProgress(); // ✅ Atualizar painel de progresso
        } else {
            alert('Erro ao processar resposta');
        }
    } catch (error) {
        console.error('Erro ao enviar resposta:', error);
        alert('Erro ao conectar com o servidor');
    }

    submitBtn.textContent = 'Enviar Resposta';
}

// ========================================
// FEEDBACK
// ========================================
function showResult(isCorrect, feedback) {
    // Marcar opções
    document.querySelectorAll('.option-button').forEach(btn => {
        btn.disabled = true;
        const answer = btn.getAttribute('data-answer');

        if (answer === currentCase.diagnostic_structure?.correct_diagnosis) {
            btn.classList.add('correct');
        } else if (answer === selectedAnswer && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });

    // Mostrar feedback
    if (feedback && feedback.feedback_eco) {
        const feedbackContainer = document.getElementById('feedbackContainer');

        feedbackContainer.innerHTML = `
            <div class="feedback-card">
                <h3>${isCorrect ? '✅ Correto!' : '❌ Incorreto'}</h3>

                <div class="feedback-section">
                    <h4>📝 Explicação</h4>
                    <p>${feedback.feedback_eco.explicar?.what_happened || ''}</p>
                </div>

                <div class="feedback-section">
                    <h4>🔗 Conexão Teórica</h4>
                    <p>${feedback.feedback_eco.conectar?.theory_connection || ''}</p>
                </div>

                <div class="feedback-section">
                    <h4>🎯 Orientação</h4>
                    <p>${feedback.feedback_eco.orientar?.what_to_focus_next || ''}</p>
                </div>

                <button class="next-case-btn" onclick="generateNewCase()">Próximo Caso →</button>
            </div>
        `;
    } else {
        document.getElementById('feedbackContainer').innerHTML = `
            <div class="feedback-card">
                <h3>${isCorrect ? '✅ Correto!' : '❌ Incorreto'}</h3>
                <p>Diagnóstico correto: ${currentCase.diagnostic_structure?.correct_diagnosis || ''}</p>
                <button class="next-case-btn" onclick="generateNewCase()">Próximo Caso →</button>
            </div>
        `;
    }
}
