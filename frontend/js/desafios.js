document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ desafios.js carregado');
    console.log('🌍 Ambiente:', IS_DEV ? 'DESENVOLVIMENTO' : 'PRODUÇÃO');
    console.log('🔗 API_URL:', API_URL);

    // ✅ STRICT AUTH CHECK
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // ✅ Adicionar listener ao botão principal de novo momento
    const newMomentBtn = document.getElementById('newMomentBtn');
    if (newMomentBtn) {
        newMomentBtn.addEventListener('click', generateNewMoment);
    }

    lucide.createIcons();
    loadProgress(); // Carregar painel de progresso ao iniciar
    loadAdaptiveLevelIndicator(); // 🎯 Carregar nível adaptativo
});

// Detectar ambiente (desenvolvimento vs produção)
const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_URL = IS_DEV
    ? 'http://localhost:3000/api'  // Desenvolvimento: backend na porta 3000
    : '/api';                       // Produção: path relativo

let currentMoment = null;
let selectedChoice = null;
let startTime = null;

// ========================================
// LÓGICA DO PAINEL DE PROGRESSO (NOVO)
// ========================================
function loadProgress() {
    console.log('🚀 loadProgress() iniciado');

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const panel = document.getElementById('progressPanel');

    // 🛡️ FORÇAR ESCONDER AVISOS NO INÍCIO (style direto)
    const warning = document.getElementById('trialWarning');
    const expired = document.getElementById('trialExpired');

    console.log('🔍 Elementos encontrados:', { warning: !!warning, expired: !!expired, panel: !!panel });

    if (warning) {
        warning.style.display = 'none';
        warning.classList.add('hidden');
    }

    if (expired) {
        expired.style.display = 'none';
        expired.classList.add('hidden');
    }

    if (!panel) return;

    // Verificar se é Trial
    const isPremium = user.plan === 'premium' || user.plan === 'pro';
    const isTrial = !isPremium;

    // Se for Trial, adicionar classe visual
    if (isTrial) {
        panel.classList.add('trial');
    }

    // Buscar dados reais do dashboard (reutilizando a lógica)
    // Se não tivermos os dados em cache ou localStorage, idealmente faríamos fetch.
    // Para simplificar, vamos simular ou pegar de localStorage se houver 'stats'.
    // Mas o mais correto é um fetch rápido nas stats ou calcular baseado no user.

    // Vamos fazer um fetch nas stats para ser preciso
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
            // MODO TRIAL - Mostra limite ESPECÍFICO de Desafios Clínicos
            const remaining = data.remaining || {};
            const remainingRaciocinio = Number(remaining.raciocinio) || 0;
            const remainingDays = Number(data.trial_days_left) || 0;

            console.log('🎯 TRIAL - Desafios:', { remainingRaciocinio, remainingDays });

            html = `
                <strong>Seu Progresso Trial</strong>
                <div class="progress-grid">
                    <div class="progress-item">
                        <strong>${remainingRaciocinio}</strong>
                        <span>Desafios Restantes</span>
                    </div>
                    <div class="progress-item">
                        <strong>${remainingDays}</strong>
                        <span>Dias Restantes</span>
                    </div>
                </div>
            `;

            // Atualizar UI de bloqueio (específico para Desafios)
            updateTrialUI(remainingRaciocinio, remainingDays);

        } else {
            // MODO PREMIUM - Mostra Cognits e Gamificação
            const cognits = Number(data.cognits) || 0;
            const level = Number(data.level) || 1;
            const title = data.clinical_title || 'Estudante de Lente';
            const desafiosConcluidos = Number(data.breakdown?.raciocinio) || 0;
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
                        <strong>${desafiosConcluidos}</strong>
                        <span>Desafios</span>
                    </div>
                </div>
            `;

            // 🔒 GARANTIR que avisos de trial estejam ESCONDIDOS para premium
            hidePremiumTrialWarnings();
        }

        panel.innerHTML = html;

    } catch (e) {
        console.error("❌ Erro ao carregar stats:", e);
    }
}

// 🔒 ESCONDER AVISOS DE TRIAL PARA USUÁRIOS PREMIUM
function hidePremiumTrialWarnings() {
    const warning = document.getElementById('trialWarning');
    const expired = document.getElementById('trialExpired');
    const newMomentBtn = document.querySelector('.new-moment-btn');

    console.log('💎 Escondendo avisos de trial para usuário premium');

    if (warning) {
        warning.style.display = 'none';
        warning.style.visibility = 'hidden';
        warning.classList.add('hidden');
    }

    if (expired) {
        expired.style.display = 'none';
        expired.style.visibility = 'hidden';
        expired.classList.add('hidden');
    }

    // Garantir que botão está habilitado
    if (newMomentBtn) {
        newMomentBtn.disabled = false;
        newMomentBtn.style.opacity = '1';
        newMomentBtn.style.cursor = 'pointer';
        newMomentBtn.style.pointerEvents = 'auto';
    }
}

// ========================================
// 🎯 NÍVEL ADAPTATIVO (Neurociência)
// ========================================

/**
 * Carrega e exibe indicador de nível adaptativo
 * Objetivo: Mostrar progresso tangível e motivar upgrade
 */
async function loadAdaptiveLevelIndicator() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/case/adaptive-level`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            renderAdaptiveLevelUI(data.adaptive_level, data.accuracy, data.progress_to_next);
        }
    } catch (e) {
        console.error('❌ Erro ao carregar nível adaptativo:', e);
    }
}

/**
 * Renderiza UI do nível adaptativo no painel de progresso
 * @param {string} level - 'basic', 'intermediate', 'advanced'
 * @param {number} accuracy - Acurácia dos últimos 10 casos (0-100)
 * @param {number} progressToNext - Progresso para próximo nível (0-100)
 */
function renderAdaptiveLevelUI(level, accuracy, progressToNext) {
    const panel = document.getElementById('progressPanel');
    if (!panel) return;

    const levelNames = {
        basic: 'Iniciante',
        intermediate: 'Intermediário',
        advanced: 'Avançado'
    };

    const levelColors = {
        basic: '#10b981',        // Verde
        intermediate: '#f59e0b', // Laranja
        advanced: '#2563EB'      // Scopsy Blue
    };

    const levelName = levelNames[level] || 'Intermediário';
    const levelColor = levelColors[level] || '#f59e0b';

    // Mensagem de progresso
    let progressMessage = '';
    if (level === 'basic' && progressToNext < 100) {
        progressMessage = `Faltam ${Math.ceil((100 - progressToNext) * 0.8)}% de acurácia para Intermediário`;
    } else if (level === 'intermediate' && progressToNext < 100) {
        progressMessage = `Faltam ${Math.ceil((100 - progressToNext) * 0.85)}% de acurácia para Avançado`;
    } else if (level === 'advanced') {
        progressMessage = 'Continue assim para manter o nível! 🏆';
    } else {
        progressMessage = 'Você está pronto para o próximo nível!';
    }

    // Adicionar indicador no topo do painel (se ainda não existe)
    const existingIndicator = panel.querySelector('.adaptive-level-indicator');

    const levelIndicatorHTML = `
        <div class="adaptive-level-indicator" style="
            background: linear-gradient(135deg, ${levelColor}15, ${levelColor}05);
            border-left: 4px solid ${levelColor};
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 16px;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 0.85rem; color: #666; margin-bottom: 4px;">
                        Nível Atual
                    </div>
                    <div style="font-size: 1.2rem; font-weight: 700; color: ${levelColor};">
                        ${levelName}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.85rem; color: #666; margin-bottom: 4px;">
                        Acurácia
                    </div>
                    <div style="font-size: 1.2rem; font-weight: 700; color: #333;">
                        ${accuracy.toFixed(0)}%
                    </div>
                </div>
            </div>

            <!-- Barra de progresso para próximo nível -->
            <div style="margin-top: 12px;">
                <div style="font-size: 0.75rem; color: #666; margin-bottom: 6px;">
                    ${progressMessage}
                </div>
                <div style="
                    width: 100%;
                    height: 6px;
                    background: #e5e7eb;
                    border-radius: 3px;
                    overflow: hidden;
                ">
                    <div style="
                        width: ${progressToNext}%;
                        height: 100%;
                        background: ${levelColor};
                        transition: width 0.3s ease;
                    "></div>
                </div>
            </div>
        </div>
    `;

    // Inserir ou atualizar
    if (existingIndicator) {
        existingIndicator.outerHTML = levelIndicatorHTML;
    } else {
        panel.insertAdjacentHTML('afterbegin', levelIndicatorHTML);
    }
}

/**
 * Calcula progresso para o próximo nível baseado em accuracy atual
 * @param {string} currentLevel - Nível atual ('basic', 'intermediate', 'advanced')
 * @param {number} accuracy - Acurácia atual (0-100)
 * @returns {number} - Progresso (0-100)
 */
function calculateProgressToNext(currentLevel, accuracy) {
    if (currentLevel === 'basic') {
        // Precisa 80% para subir para intermediário
        return Math.min((accuracy / 80) * 100, 100);
    }
    if (currentLevel === 'intermediate') {
        // Precisa 85% para subir para avançado
        return Math.min((accuracy / 85) * 100, 100);
    }
    if (currentLevel === 'advanced') {
        // Já está no topo, mostrar manutenção (70%)
        return Math.min((accuracy / 70) * 100, 100);
    }
    return 0;
}

// ========================================
// LÓGICA DOS CASOS (EXISTENTE)
// ========================================

async function generateNewMoment() {
    document.getElementById('momentContainer').innerHTML = '<div class="loading">🔍 Carregando caso...</div>';
    document.getElementById('feedbackContainer').innerHTML = '';

    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Token não encontrado. Faça login novamente.");

        // Fallback para API local se necessário
        const apiUrl = API_URL.startsWith('http') ? API_URL : window.location.origin + API_URL;

        const res = await fetch(`${apiUrl}/case/generate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ level: 'intermediate' })
        });

        const data = await res.json();

        if (data.success) {
            // 🛡️ VALIDAÇÃO DE DADOS (Fix para erro "diagnosis of undefined")
            if (!data.case || !data.case.context) {
                console.error('❌ Erro crítico: Caso retornado sem contexto!', data);
                document.getElementById('momentContainer').innerHTML = `
                    <div class="moment-card">
                        <h3 style="color:#ef4444">Erro nos dados do caso</h3>
                        <p>O servidor retornou um caso incompleto. Por favor, tente gerar outro.</p>
                        <button onclick="generateNewMoment()" class="submit-btn" style="margin-top:16px; width:auto;">Tentar Novamente</button>
                    </div>`;
                return;
            }

            currentMoment = { ...data.case, case_id: data.case_id };
            selectedChoice = null;
            startTime = Date.now();

            // 🎯 Atualizar indicador de nível adaptativo se dados disponíveis
            if (data.adaptive_level && data.performance_summary) {
                const accuracy = data.performance_summary.recent_accuracy || 0;
                const progressToNext = calculateProgressToNext(data.adaptive_level, accuracy);
                renderAdaptiveLevelUI(data.adaptive_level, accuracy, progressToNext);
            }

            renderMoment(currentMoment);
        } else {
            console.error('Erro backend:', data);
            document.getElementById('momentContainer').innerHTML = `<div class="moment-card"><p style="color:#ef4444">Erro ao gerar caso: ${data.error || 'Erro desconhecido'}</p></div>`;
        }
    } catch (e) {
        console.error('Erro de conexão:', e);
        document.getElementById('momentContainer').innerHTML = `<div class="moment-card"><p style="color:#ef4444">Erro de conexão: ${e.message}</p></div>`;
    }
}

function renderMoment(m) {
    // 🛡️ PROTEÇÃO ADICIONAL: Se chegar aqui sem contexto, não quebra
    if (!m || !m.context) {
        console.error('❌ renderMoment chamado com dados inválidos:', m);
        return;
    }

    const ctx = m.context;
    const cm = m.critical_moment;

    // 🔒 SEGURANÇA XSS: Sanitizar dados do backend
    const safeDiagnosis = escapeHTML(ctx.diagnosis || 'Momento Clínico');
    const safeClientName = escapeHTML(ctx.client_name);
    const safeWhatHappened = sanitizeHTML(ctx.what_just_happened);
    const safeDialogue = sanitizeHTML(cm.dialogue);
    const safeNonVerbal = sanitizeHTML(cm.non_verbal);
    const safeDecisionPoint = sanitizeHTML(m.decision_point);

    let optionsHTML = '';
    m.options.forEach(opt => {
        // 🔒 SEGURANÇA XSS: Sanitizar opções
        const safeApproach = escapeHTML(opt.approach);
        const safeResponse = escapeHTML(opt.response);
        const safeLetter = escapeHTML(opt.letter);

        optionsHTML += `
          <div class="option-card" data-letter="${safeLetter}">
            <span class="option-letter">${safeLetter}</span>
            <div style="flex:1">
              <strong>${safeApproach}</strong>
              <p style="margin:8px 0 0; color:#666; font-style:italic;">"${safeResponse}"</p>
            </div>
          </div>`;
    });

    document.getElementById('momentContainer').innerHTML = `
        <div class="moment-card">
          <span class="context-badge">${safeDiagnosis}</span>

          <div class="context-section">
            <h4>CONTEXTO</h4>
            <p><strong>Cliente:</strong> ${safeClientName}, ${ctx.client_age} anos • <strong>Sessão:</strong> ${ctx.session_number}</p>
            <p><strong>Acabou de acontecer:</strong> ${safeWhatHappened}</p>
          </div>

          <div class="critical-moment">
            <h4 style="margin:0 0 16px; color:#e65100;">MOMENTO CRÍTICO</h4>
            <div class="dialogue">"${safeDialogue}"</div>
            <div class="non-verbal"><strong>Observação:</strong> ${safeNonVerbal}</div>
          </div>

          <div class="decision-point">${safeDecisionPoint}</div>

          <h4 style="margin:32px 0 16px; font-size:1.4rem;">Sua resposta:</h4>
          <div class="options-grid">${optionsHTML}</div>

          <div class="reasoning-section">
            <label style="display:block; margin-bottom:12px; font-weight:700;">Por que você escolheu esta opção?</label>
            <textarea id="reasoningText" class="reasoning-textarea" placeholder="Explique seu raciocínio em 1-2 frases..."></textarea>
          </div>

          <button class="submit-btn" id="submitBtn" disabled>Confirmar Decisão</button>
        </div>`;

    // ✅ Adicionar event listeners APÓS renderizar (delegação de eventos)
    attachOptionListeners();
    attachSubmitListener();
}

// ========================================
// EVENT LISTENERS - Delega eventos após renderizar
// ========================================
function attachOptionListeners() {
    const optionCards = document.querySelectorAll('.option-card');

    optionCards.forEach(card => {
        card.addEventListener('click', function () {
            selectOption(this);
        });
    });
}

function attachSubmitListener() {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        // Remove listener antigo se existir
        const newBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newBtn, submitBtn);

        // Adiciona novo listener
        newBtn.addEventListener('click', submitDecision);
    }
}

function selectOption(el) {
    // Remove seleção anterior
    document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));

    // Adiciona seleção atual
    el.classList.add('selected');

    // Pega letra da opção
    const letter = el.getAttribute('data-letter');
    selectedChoice = letter;

    // Habilita botão de submit
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.disabled = false;
}

async function submitDecision() {
    if (!selectedChoice) return;
    const reasoning = document.getElementById('reasoningText').value.trim();
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Analisando...';

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/case/analyze`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                case_data: { ...currentMoment, case_id: currentMoment.case_id },
                user_choice: selectedChoice,
                user_reasoning: reasoning,
                time_spent_seconds: timeSpent
            })
        });
        const data = await res.json();

        if (data.success) {
            // ⭐ NOVO - Exibir celebração ou toast
            if (data.cognits_gained) {
                if (data.feedback.is_correct && typeof showCelebration === 'function') {
                    showCelebration(data.cognits_gained, true);
                } else if (typeof showCognitToast === 'function') {
                    showCognitToast(data.cognits_gained, '💡 Por tentar');
                }
            }

            showFeedback(data.feedback, selectedChoice);
            // Atualizar O Painel de Progresso após sucesso (decrementa quota em tempo real)
            loadProgress();
        }
    } catch (e) { console.error(e); }

    btn.disabled = false;
    btn.textContent = 'Confirmar Decisão';
}

function showFeedback(f, userChoice) {
    // Marcar opções corretas/incorretas
    document.querySelectorAll('.option-card').forEach(card => {
        card.style.pointerEvents = 'none';
        const letter = card.querySelector('.option-letter').textContent;
        if (letter === f.expert_choice) card.classList.add('correct');
        else if (letter === userChoice && !f.is_correct) card.classList.add('incorrect');
    });

    const er = f.expert_reasoning;
    const lp = f.learning_point;

    // 🔒 SEGURANÇA XSS: Sanitizar feedback do backend
    const safeImmediateFeedback = sanitizeHTML(f.immediate_feedback);
    const safeUserReasoning = f.user_reasoning_analysis ? sanitizeHTML(f.user_reasoning_analysis) : '';
    const safeExpertChoice = escapeHTML(f.expert_choice);
    const safeWhyWorks = sanitizeHTML(er.why_this_works || '');
    const safeCorePrinciple = er.core_principle ? sanitizeHTML(er.core_principle) : '';
    const safePattern = lp ? sanitizeHTML(lp.pattern_to_recognize) : '';
    const safeInstantResponse = lp ? sanitizeHTML(lp.instant_response) : '';
    const safeCommonMistake = lp ? sanitizeHTML(lp.common_mistake) : '';

    // 🧠 CHUNKING: Feedback em 3 níveis expansíveis (Teoria Carga Cognitiva)
    // Objetivo: -50% carga cognitiva + usuário controla profundidade
    const fb = `
        <div class="feedback-card">
            <!-- ========================================
                 NÍVEL 1: SEMPRE VISÍVEL (Feedback Imediato)
                 ======================================== -->
            <div class="feedback-header ${f.is_correct ? 'correct' : 'incorrect'}">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div>
                        <h2 style="margin: 0;">${safeImmediateFeedback}</h2>
                        <p style="margin: 8px 0 0; font-size: 1.1rem; opacity: 0.9;">
                            ${f.is_correct
            ? 'Você pensou como um clínico experiente!'
            : 'Vamos crescer juntos com este aprendizado'
        }
                        </p>
                    </div>
                </div>
            </div>

            <!-- Análise do raciocínio do usuário (se houver) -->
            ${safeUserReasoning ? `
                <div class="feedback-level-1" style="
                    background: #f0f9ff;
                    border-left: 4px solid #0ea5e9;
                    padding: 16px;
                    margin: 16px 0;
                    border-radius: 8px;
                ">
                    <h4 style="margin: 0 0 8px; color: #0369a1; font-size: 1rem;">
                        💭 Seu Raciocínio
                    </h4>
                    <p style="margin: 0; font-style: italic; color: #333;">
                        ${safeUserReasoning}
                    </p>
                </div>
            ` : ''}

            <!-- ========================================
                 NÍVEL 2: EXPANSÍVEL (Raciocínio do Expert)
                 ======================================== -->
            <details class="feedback-expandable" open>
                <summary class="feedback-summary">
                    <span class="summary-icon">📖</span>
                    <span class="summary-text">Por que <strong>${safeExpertChoice}</strong> é a melhor escolha</span>
                    <span class="summary-chevron">▼</span>
                </summary>
                <div class="feedback-expandable-content">
                    <p>${safeWhyWorks}</p>

                    ${safeCorePrinciple ? `
                        <div class="principle-box" style="
                            background: linear-gradient(135deg, #fef3c7, #fde68a);
                            border-left: 4px solid #f59e0b;
                            padding: 16px;
                            margin: 16px 0;
                            border-radius: 8px;
                        ">
                            <div style="display: flex; align-items: start; gap: 12px;">
                                <div style="font-size: 1.5rem;">💡</div>
                                <div>
                                    <div style="font-size: 0.85rem; color: #92400e; font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">
                                        Princípio Clínico
                                    </div>
                                    <div style="font-size: 1.1rem; font-weight: 600; color: #78350f;">
                                        "${safeCorePrinciple}"
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </details>

            <!-- ========================================
                 NÍVEL 3: EXPANSÍVEL (Aprendizado Profundo)
                 ======================================== -->
            ${lp && (safePattern || safeInstantResponse || safeCommonMistake) ? `
                <details class="feedback-expandable">
                    <summary class="feedback-summary">
                        <span class="summary-icon">🎯</span>
                        <span class="summary-text">Ponto de Aprendizagem</span>
                        <span class="summary-chevron">▼</span>
                    </summary>
                    <div class="feedback-expandable-content" style="background: #ecfdf5;">
                        ${safePattern ? `
                            <div style="margin-bottom: 16px;">
                                <h5 style="margin: 0 0 8px; color: #047857; font-size: 0.95rem;">
                                    🔍 Padrão a Reconhecer
                                </h5>
                                <p style="margin: 0; color: #065f46;">
                                    ${safePattern}
                                </p>
                            </div>
                        ` : ''}

                        ${safeInstantResponse ? `
                            <div style="margin-bottom: 16px;">
                                <h5 style="margin: 0 0 8px; color: #047857; font-size: 0.95rem;">
                                    ⚡ Resposta Ideal
                                </h5>
                                <p style="margin: 0; color: #065f46;">
                                    ${safeInstantResponse}
                                </p>
                            </div>
                        ` : ''}

                        ${safeCommonMistake ? `
                            <div style="
                                background: #fef2f2;
                                border-left: 4px solid #ef4444;
                                padding: 12px;
                                border-radius: 6px;
                            ">
                                <h5 style="margin: 0 0 8px; color: #991b1b; font-size: 0.95rem;">
                                    ⚠️ Erro Comum
                                </h5>
                                <p style="margin: 0; color: #7f1d1d;">
                                    ${safeCommonMistake}
                                </p>
                            </div>
                        ` : ''}

                        ${!safePattern && !safeInstantResponse && !safeCommonMistake ? `
                            <div style="
                                background: #fef9c3;
                                border-left: 4px solid #eab308;
                                padding: 16px;
                                border-radius: 6px;
                                text-align: center;
                            ">
                                <p style="margin: 0; color: #713f12; font-size: 0.95rem;">
                                    📝 Este caso ainda não tem pontos de aprendizagem cadastrados.<br>
                                    <span style="font-size: 0.85rem; opacity: 0.8;">
                                        Estamos atualizando nosso banco de casos com insights mais profundos!
                                    </span>
                                </p>
                            </div>
                        ` : ''}
                    </div>
                </details>
            ` : ''}

            <!-- Botão de próximo caso -->
            <button class="next-moment-btn" id="nextMomentBtn" style="margin-top: 24px;">
                Próximo Momento Crítico →
            </button>
        </div>`;

    document.getElementById('feedbackContainer').innerHTML = fb;
    document.getElementById('feedbackContainer').scrollIntoView({ behavior: 'smooth' });

    // ✅ Adicionar listener ao botão
    attachNextMomentListener();

    // 🎯 Inicializar animações dos expandables
    initializeExpandableAnimations();
}

function attachNextMomentListener() {
    const nextBtn = document.getElementById('nextMomentBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', generateNewMoment);
    }
}

/**
 * Inicializa animações suaves para elementos expansíveis <details>
 * Objetivo: Transições fluidas ao expandir/recolher conteúdo
 */
function initializeExpandableAnimations() {
    const expandables = document.querySelectorAll('.feedback-expandable');

    expandables.forEach(details => {
        const summary = details.querySelector('.feedback-summary');
        const chevron = summary?.querySelector('.summary-chevron');

        // Atualizar chevron no estado inicial
        if (chevron) {
            chevron.textContent = details.open ? '▲' : '▼';
        }

        // Listener para toggle
        details.addEventListener('toggle', () => {
            if (chevron) {
                chevron.textContent = details.open ? '▲' : '▼';
            }
        });

        // Adicionar classe para animação CSS
        const content = details.querySelector('.feedback-expandable-content');
        if (content) {
            content.style.animation = details.open
                ? 'fadeIn 0.3s ease forwards'
                : 'fadeOut 0.2s ease forwards';
        }
    });
}

// ========================================
// FUNÇÕES AUXILIARES (TRIAL/UPGRADE)
// ========================================
async function goToUpgrade() {
    const btn = document.querySelector('.upgrade-btn');
    if (btn) {
        btn.textContent = 'Redirecionando...';
        btn.style.opacity = '0.7';
        btn.style.pointerEvents = 'none';
    }

    try {
        // Link direto do Kiwify
        const KIWIFY_CHECKOUT_URL = 'https://pay.kiwify.com.br/cMd4tVk';

        // Pegar email do usuário se estiver logado
        const token = localStorage.getItem('token');
        let userEmail = '';

        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                userEmail = payload.email || '';
            } catch (e) {
                console.warn('Erro ao decodificar token:', e);
            }
        }

        // Montar URL com email
        const checkoutUrl = userEmail
            ? `${KIWIFY_CHECKOUT_URL}?email=${encodeURIComponent(userEmail)}`
            : KIWIFY_CHECKOUT_URL;

        // Aguardar 300ms para UX
        await new Promise(resolve => setTimeout(resolve, 300));

        // Redirecionar
        window.location.href = checkoutUrl;
    } catch (e) {
        console.error('Erro de upgrade:', e);
        alert('Erro ao redirecionar para checkout.');
        if (btn) {
            btn.textContent = 'Fazer Upgrade Agora';
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        }
    }
}

// Atualizar UI com base no estado do Trial (Lógica de Negócio Robusta)
function updateTrialUI(remainingUsage, remainingDays) {
    const warning = document.getElementById('trialWarning');
    const expired = document.getElementById('trialExpired');
    const newMomentBtn = document.querySelector('.new-moment-btn');

    // Elementos opcionais (caso não existam na página)
    if (!warning || !expired) return;

    // 🛡️ BLINDAGEM CRÍTICA: Converter para número e garantir valores válidos
    const usage = Number(remainingUsage);
    const days = Number(remainingDays);

    // 🐞 DEBUG EXPLÍCITO
    console.log('🔍 VERIFICAÇÃO TRIAL:', {
        remainingUsage: usage,
        remainingDays: days,
        isNaN_usage: isNaN(usage),
        isNaN_days: isNaN(days),
        original_usage: remainingUsage,
        original_days: remainingDays
    });

    // Se valores inválidos, ASSUMIR QUE É USUÁRIO NOVO (modo seguro)
    if (isNaN(usage) || isNaN(days) || usage < 0 || days < 0) {
        console.warn('⚠️ Valores inválidos detectados, assumindo trial novo');
        warning.style.display = 'none';
        warning.classList.add('hidden');
        expired.style.display = 'none';
        expired.classList.add('hidden');
        return;
    }

    // 1. 🛡️ RESETAR ESTADO VISUAL (style direto + classe)
    warning.style.display = 'none';
    warning.classList.add('hidden');
    expired.style.display = 'none';
    expired.classList.add('hidden');

    if (newMomentBtn) {
        newMomentBtn.disabled = false;
        newMomentBtn.style.opacity = '1';
        newMomentBtn.style.cursor = 'pointer';
        newMomentBtn.title = "Gerar novo caso";
    }

    // 2. ⚠️ REGRA DE BLOQUEIO CRÍTICA
    // Só bloqueia se EXPLICITAMENTE acabou (não por valores padrão)
    const isTimeExpired = days === 0; // Exatamente zero, não <=
    const isUsageExpired = usage === 0; // Exatamente zero, não <=
    const isTrialExpired = isTimeExpired || isUsageExpired;

    console.log('🚦 Estado Trial:', { isTimeExpired, isUsageExpired, isTrialExpired });

    if (isTrialExpired) {
        // --- BLOQUEIO TOTAL ---
        expired.style.display = 'block'; // ✅ Forçar exibição com style direto
        expired.classList.remove('hidden');

        const textEl = expired.querySelector('.trial-text');
        if (textEl) {
            if (isTimeExpired) {
                textEl.innerHTML = `<strong>Seu período de teste terminou.</strong><br>Os 7 dias de acesso grátis expiraram.`;
            } else {
                textEl.innerHTML = `<strong>Limite de atividades atingido.</strong><br>Você completou os 30 casos do período de teste.`;
            }
        }

        if (newMomentBtn) {
            newMomentBtn.disabled = true;
            newMomentBtn.style.opacity = '0.5';
            newMomentBtn.style.cursor = 'not-allowed';
            newMomentBtn.title = "Faça upgrade para continuar treinando";
        }

        lucide.createIcons();
        return;
    }

    // 3. Aviso só se REALMENTE próximo do limite (1-3)
    const isTimeLow = days > 0 && days <= 3;
    const isUsageLow = usage > 0 && usage <= 3;

    if (isTimeLow || isUsageLow) {
        warning.style.display = 'block'; // ✅ Forçar exibição com style direto
        warning.classList.remove('hidden');

        const textEl = warning.querySelector('.trial-text');
        if (textEl) {
            if (isTimeLow) {
                textEl.innerHTML = `Seu teste acaba em <strong>${days} dia(s)</strong>.<br>Aproveite ou faça upgrade.`;
            } else {
                textEl.innerHTML = `Restam apenas <strong>${usage} atividades</strong>.<br>Aproveite ou faça upgrade.`;
            }
        }
    }

    lucide.createIcons();
}
