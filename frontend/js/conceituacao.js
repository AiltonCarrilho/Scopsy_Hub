// ========================================
// CONCEITUAÇÃO DE CASO - SCOPSY LAB
// ========================================

// Detectar ambiente (desenvolvimento vs produção)
const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_URL = IS_DEV
    ? 'http://localhost:3000/api'  // Desenvolvimento: backend na porta 3000
    : '/api';                       // Produção: path relativo

let currentCase = null;
let caseStartTime = null;

// Configurações padrão
let caseConfig = {
    level: 'intermediate',
    focus: 'conceituacao',
    category: 'anxiety'
};

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ conceituacao.js carregado');
    console.log('🌍 Ambiente:', IS_DEV ? 'DESENVOLVIMENTO' : 'PRODUÇÃO');
    console.log('🔗 API_URL:', API_URL);

    loadProgress(); // Carregar painel de progresso ao iniciar
});

// ========================================
// PAINEL DE PROGRESSO (TRIAL/PREMIUM)
// ========================================
function loadProgress() {
    console.log('🚀 loadProgress() iniciado');

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const panel = document.getElementById('progressPanel');

    if (!panel) return;

    // Verificar se é Trial
    const isPremium = user.plan === 'premium' || user.plan === 'pro';
    const isTrial = !isPremium;

    // Se for Trial, adicionar classe visual
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
            // MODO TRIAL - Mostra limite ESPECÍFICO de Conceituação
            const remaining = data.remaining || {};
            const remainingConceituacao = Number(remaining.conceituacao) || 0;
            const remainingDays = Number(data.trial_days_left) || 0;

            console.log('🎯 TRIAL - Conceituação:', { remainingConceituacao, remainingDays });

            html = `
                <strong>Seu Progresso Trial</strong>
                <div class="progress-grid">
                    <div class="progress-item">
                        <strong>${remainingConceituacao}</strong>
                        <span>Conceituações Restantes</span>
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
            const conceituacoesConcluidas = Number(data.breakdown?.conceituacao) || 0;
            const accuracy = (Number(data.accuracy) || 0).toFixed(1);

            console.log('💎 PREMIUM:', { cognits, level, title, accuracy });

            html = `
                <strong>${title} (Nível ${level})</strong>
                <div class="progress-grid">
                    <div class="progress-item">
                        <strong>${cognits}</strong>
                        <span>Cognits</span>
                    </div>
                    <div class="progress-item">
                        <strong>${accuracy}%</strong>
                        <span>Acurácia</span>
                    </div>
                    <div class="progress-item">
                        <strong>${conceituacoesConcluidas}</strong>
                        <span>Conceituações</span>
                    </div>
                </div>
            `;
        }

        panel.innerHTML = html;

    } catch (e) {
        console.error("❌ Erro ao carregar stats:", e);
    }
}

// ========================================
// MODAL DE PERSONALIZAÇÃO
// ========================================
function openCustomizeModal() {
    const modal = document.getElementById('customizeModal');
    modal.style.display = 'block';

    // Verificar plano e habilitar/desabilitar opções
    checkPremiumFeaturesAccess();
}

function closeCustomizeModal() {
    document.getElementById('customizeModal').style.display = 'none';
}

function closePremiumModal() {
    document.getElementById('premiumUpgradeModal').style.display = 'none';
}

function showPremiumModal() {
    document.getElementById('premiumUpgradeModal').style.display = 'block';
}

/**
 * Verifica plano do usuário e habilita/desabilita opções premium
 */
function checkPremiumFeaturesAccess() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isPremium = user.plan === 'premium' || user.plan === 'pro';

    const premiumOptions = document.querySelectorAll('.focus-option.disabled');

    premiumOptions.forEach(option => {
        const input = option.querySelector('input[type="radio"]');
        const badge = option.querySelector('.premium-badge');

        if (isPremium) {
            // USUÁRIO PREMIUM: Habilitar opção
            option.classList.remove('disabled');
            if (input) input.disabled = false;
            if (badge) badge.style.display = 'none';

            // Adicionar click handler para seleção
            option.onclick = function() {
                selectFocus(input.value);
            };
        } else {
            // USUÁRIO TRIAL: Manter desabilitado, adicionar modal de upgrade
            option.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                showPremiumModal();
            };
            option.style.cursor = 'pointer';
        }
    });
}

function selectFocus(focusType) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isPremium = user.plan === 'premium' || user.plan === 'pro';

    // Verificar se é opção premium
    const premiumFocuses = ['tecnicas_tcc', 'act', 'dbt', 'esquemas', 'alianca'];
    const isPremiumFocus = premiumFocuses.includes(focusType);

    // Se é premium focus e usuário não é premium, mostrar modal
    if (isPremiumFocus && !isPremium) {
        showPremiumModal();
        return;
    }

    // Permitir seleção
    const options = document.querySelectorAll('.focus-option');
    options.forEach(opt => opt.classList.remove('active'));

    // Encontrar e ativar a opção correta
    const targetInput = document.querySelector(`input[value="${focusType}"]`);
    if (targetInput) {
        targetInput.checked = true;
        const parentOption = targetInput.closest('.focus-option');
        if (parentOption) {
            parentOption.classList.add('active');
        }
    }
}

// ========================================
// GERAÇÃO DE CASOS
// ========================================
async function generateNewCase() {
    await generateCase(caseConfig);
    closeCustomizeModal();
}

async function generateCustomCase() {
    caseConfig = {
        level: document.getElementById('levelSelect').value,
        focus: document.querySelector('input[name="focus"]:checked').value,
        category: document.getElementById('categorySelect').value
    };

    await generateCase(caseConfig);
    closeCustomizeModal();
}

async function generateCase(config) {
    try {
        console.log('📋 Gerando caso:', config);

        document.getElementById('caseContainer').innerHTML =
            '<div class="loading"><div class="spinner"></div><p>Gerando caso clínico personalizado...</p></div>';
        document.getElementById('feedbackContainer').innerHTML = '';

        const token = localStorage.getItem('token');

        const response = await fetch(`${API_URL}/case/generate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                level: config.level,
                category: 'clinical_moment',
                disorder_category: config.category
            })
        });

        const data = await response.json();

        if (data.success) {
            currentCase = {
                ...data.case,
                case_id: data.case_id,
                id: data.case_id,
                config: config
            };

            caseStartTime = Date.now();
            renderCase(currentCase);
        } else {
            // Mensagem amigável quando não há casos
            const errorMsg = data.message || data.error || 'Erro ao gerar caso';
            document.getElementById('caseContainer').innerHTML =
                `<div class="case-card">
                    <div style="padding: 20px; text-align: center;">
                        <h3 style="color: #f57c00; margin-bottom: 16px;">⚠️ Nenhum Caso Disponível</h3>
                        <p style="color: #666; margin-bottom: 20px;">${errorMsg}</p>
                        <button onclick="openCustomizeModal()" style="background: #9C27B0; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px;">
                            ⚙️ Tentar Outra Categoria
                        </button>
                    </div>
                </div>`;
        }
    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('caseContainer').innerHTML =
            '<div class="case-card"><p style="color: #f44336;">Erro ao conectar</p></div>';
    }
}

function renderCase(caseData) {
    // Backend já envia vinheta montada
    let vignette = caseData.vignette || 'Vinheta não disponível';

    // Melhorar formatação da vinheta (SEM excesso)
    if (vignette && vignette.length > 100) {
        const lineBreaks = (vignette.match(/\n/g) || []).length;

        if (lineBreaks < 2) {
            vignette = vignette.replace(/\. ([A-Z])/g, '.\n\n$1');
        }

        vignette = vignette.replace(/\n{3,}/g, '\n\n');
    }

    const config = caseData.config || caseConfig;

    const levelLabels = {
        'basic': 'Básico',
        'intermediate': 'Intermediário',
        'advanced': 'Avançado'
    };

    const focusLabels = {
        'conceituacao': 'Conceituação Cognitiva',
        'tecnicas_tcc': 'Técnicas de TCC',
        'act': 'Habilidades ACT',
        'dbt': 'Habilidades DBT',
        'esquemas': 'Terapia Focada em Esquemas',
        'alianca': 'Aliança Terapêutica'
    };

    // 🔒 SEGURANÇA XSS: Sanitizar vinheta do backend
    const safeVignette = sanitizeHTML(vignette);

    document.getElementById('caseContainer').innerHTML = `
        <div class="case-card">
            <div style="margin-bottom: 16px;">
                <span class="case-config-badge">📊 ${levelLabels[config.level]}</span>
                <span class="case-config-badge">🎯 ${focusLabels[config.focus]}</span>
            </div>

            <div class="info-box">
                <h4>🎯 Objetivo desta análise</h4>
                <p>Pratique a conceituação completa de caso identificando padrões cognitivos, emocionais e comportamentais. Foque em:</p>
                <ul style="margin: 8px 0; padding-left: 20px;">
                    <li>Tríade cognitiva (Pensamento → Emoção → Comportamento)</li>
                    <li>Crenças centrais, intermediárias e automáticas</li>
                    <li>Formulação conceitual do caso</li>
                    <li>Estratégias de intervenção</li>
                </ul>
            </div>

            <h3>📋 Caso Clínico</h3>
            <div class="vignette">${safeVignette}</div>

            <!-- 1. TRÍADE COGNITIVA -->
            <div class="analysis-section">
                <h3>🔄 1. Tríade Cognitiva</h3>
                <p>Identifique o ciclo: Pensamentos → Emoções → Comportamentos</p>
                <textarea
                    id="triadeTextarea"
                    class="analysis-textarea"
                    placeholder="Exemplo:&#10;Pensamento: 'Vou fracassar nesta apresentação'&#10;Emoção: Ansiedade intensa, medo&#10;Comportamento: Evita preparar, procrastina, considera cancelar"
                ></textarea>
            </div>

            <!-- 2. CRENÇAS -->
            <div class="analysis-section">
                <h3>💭 2. Identificação de Crenças</h3>
                <p>Qual(is) crença(s) central(is), intermediária(s) e pensamento(s) automático(s) você identifica?</p>
                <textarea
                    id="crencasTextarea"
                    class="analysis-textarea"
                    placeholder="Exemplo:&#10;Crença central: 'Sou incompetente'&#10;Crença intermediária: 'Se eu tentar coisas difíceis, vou falhar'&#10;Pensamentos automáticos: 'Não vou conseguir', 'Todos vão perceber que sou um fraude'"
                ></textarea>
            </div>

            <!-- 3. FORMULAÇÃO CONCEITUAL -->
            <div class="analysis-section">
                <h3>🧩 3. Formulação Conceitual</h3>
                <p>Como você conceituaria este caso? (Vulnerabilidades, gatilhos, fatores mantenedores)</p>
                <textarea
                    id="formulacaoTextarea"
                    class="analysis-textarea"
                    placeholder="Exemplo:&#10;Este paciente desenvolveu crenças de incompetência devido a [história]. Atualmente, situações de [gatilho] ativam estas crenças, gerando [resposta emocional/comportamental]. O padrão se mantém porque [fatores mantenedores]."
                ></textarea>
            </div>

            <!-- 4. INTERVENÇÃO -->
            <div class="analysis-section">
                <h3>💡 4. Estratégia de Intervenção</h3>
                <p>Qual seria seu foco terapêutico e quais técnicas você usaria?</p>
                <textarea
                    id="intervencaoTextarea"
                    class="analysis-textarea"
                    placeholder="Exemplo:&#10;Foco em reestruturação cognitiva para crenças de incompetência, experimentos comportamentais de exposição gradual a desafios profissionais. Técnicas: Registro de Pensamentos, Role-play de situações temidas."
                ></textarea>
            </div>

            <button class="submit-btn btn-primary" onclick="submitConceptualization()">Enviar Conceituação</button>
        </div>
    `;
}

// ========================================
// ENVIO E FEEDBACK
// ========================================
async function submitConceptualization() {
    const triade = document.getElementById('triadeTextarea').value.trim();
    const crencas = document.getElementById('crencasTextarea').value.trim();
    const formulacao = document.getElementById('formulacaoTextarea').value.trim();
    const intervencao = document.getElementById('intervencaoTextarea').value.trim();

    if (!triade || !crencas || !formulacao || !intervencao) {
        alert('Por favor, preencha todos os campos da conceituação.');
        return;
    }

    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processando análise...';

    const timeSpent = Math.floor((Date.now() - caseStartTime) / 1000);

    const conceptualization = {
        triade_cognitiva: triade,
        crencas: crencas,
        formulacao_conceitual: formulacao,
        estrategia_intervencao: intervencao
    };

    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_URL}/case/conceptualize`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                case_data: currentCase,
                conceptualization: conceptualization,
                time_spent_seconds: timeSpent
            })
        });

        const data = await response.json();

        if (data.success) {
            // ⭐ NOVO - Exibir celebração
            if (data.cognits_gained) {
                if (typeof showCelebration === 'function') {
                    showCelebration(data.cognits_gained, true);
                } else if (typeof showCognitToast === 'function') {
                    showCognitToast(data.cognits_gained, '🎯 Conceituação Completa!');
                }
            }

            showFeedback(data.feedback);
            // ✅ Atualizar progresso após sucesso
            loadProgress();
        } else {
            alert('Erro ao processar conceituação');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao conectar');
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar Conceituação';
}

function showFeedback(feedback) {
    // 🔒 SEGURANÇA XSS: Sanitizar todos os campos de feedback do backend
    const safeTriade = sanitizeHTML(feedback.triade_feedback || 'Feedback sobre tríade cognitiva');
    const safeCrencas = sanitizeHTML(feedback.crencas_feedback || 'Feedback sobre crenças');
    const safeFormulacao = sanitizeHTML(feedback.formulacao_feedback || 'Feedback sobre formulação');
    const safeIntervencao = sanitizeHTML(feedback.intervencao_feedback || 'Feedback sobre intervenção');
    const safeStrengths = sanitizeHTML(feedback.strengths || 'Continue desenvolvendo');
    const safeAreas = sanitizeHTML(feedback.areas_to_develop || 'Continue praticando');

    const feedbackHTML = `
        <div class="feedback-card">
            <h3>✅ Feedback Formativo</h3>

            <div class="feedback-section">
                <h4>🔄 Sua Tríade Cognitiva</h4>
                <p>${safeTriade}</p>
            </div>

            <div class="feedback-section">
                <h4>💭 Suas Crenças Identificadas</h4>
                <p>${safeCrencas}</p>
            </div>

            <div class="feedback-section">
                <h4>🧩 Sua Formulação Conceitual</h4>
                <p>${safeFormulacao}</p>
            </div>

            <div class="feedback-section">
                <h4>💡 Sua Estratégia de Intervenção</h4>
                <p>${safeIntervencao}</p>
            </div>

            <div class="feedback-section" style="background: #e8f5e9;">
                <h4>🎯 Pontos Fortes da Sua Análise</h4>
                <p>${safeStrengths}</p>
            </div>

            <div class="feedback-section" style="background: #fff3e0;">
                <h4>📚 Áreas para Aprofundar</h4>
                <p>${safeAreas}</p>
            </div>

            <button class="btn-primary" onclick="generateNewCase()" style="margin-top: 24px; width: 100%;">
                📋 Próximo Caso
            </button>
        </div>
    `;

    document.getElementById('feedbackContainer').innerHTML = feedbackHTML;
    document.getElementById('feedbackContainer').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// ========================================
// MODAL
// ========================================
window.onclick = function (event) {
    const modal = document.getElementById('customizeModal');
    if (event.target === modal) {
        closeCustomizeModal();
    }
};
