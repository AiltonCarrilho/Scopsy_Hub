document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ desafios.js carregado');
    console.log('🌍 Ambiente:', IS_DEV ? 'DESENVOLVIMENTO' : 'PRODUÇÃO');
    console.log('🔗 API_URL:', API_URL);

    // ✅ Adicionar listener ao botão principal de novo momento
    const newMomentBtn = document.getElementById('newMomentBtn');
    if (newMomentBtn) {
        newMomentBtn.addEventListener('click', generateNewMoment);
    }

    lucide.createIcons();
    loadProgress(); // Carregar painel de progresso ao iniciar
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
// LÓGICA DOS CASOS (EXISTENTE)
// ========================================

async function generateNewMoment() {
    document.getElementById('momentContainer').innerHTML = '<div class="loading">🔍 Carregando caso...</div>';
    document.getElementById('feedbackContainer').innerHTML = '';

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/case/generate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ level: 'intermediate', moment_type: 'resistencia_tecnica' })
        });
        const data = await res.json();

        if (data.success) {
            currentMoment = { ...data.case, case_id: data.case_id };
            selectedChoice = null;
            startTime = Date.now();
            renderMoment(currentMoment);
        } else {
            document.getElementById('momentContainer').innerHTML = `<div class="moment-card"><p style="color:#ef4444">Erro: ${data.error}</p></div>`;
        }
    } catch (e) {
        document.getElementById('momentContainer').innerHTML = '<div class="moment-card"><p style="color:#ef4444">Erro de conexão</p></div>';
    }
}

function renderMoment(m) {
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
        card.addEventListener('click', function() {
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

    const fb = `
        <div class="feedback-card">
          <div class="feedback-header ${f.is_correct ? 'correct' : 'incorrect'}">
            <h2>${safeImmediateFeedback}</h2>
            <p style="margin-top:12px; font-size:1.2rem;">
              ${f.is_correct ? 'Você pensou como um clínico experiente!' : 'Vamos crescer juntos com este aprendizado'}
            </p>
          </div>

          ${safeUserReasoning ? `<div class="feedback-section"><h4>Seu Raciocínio</h4><p style="font-style:italic;">${safeUserReasoning}</p></div>` : ''}

          <div class="feedback-section"><h4>Por que ${safeExpertChoice} é a melhor escolha</h4><p>${safeWhyWorks}</p></div>

          ${safeCorePrinciple ? `<div class="principle-box">PRINCÍPIO CLÍNICO: "${safeCorePrinciple}"</div>` : ''}

          ${lp ? `<div class="feedback-section" style="background:#ecfdf5;"><h4>Aprendizado</h4><p><strong>Padrão:</strong> ${safePattern}</p><p><strong>Resposta ideal:</strong> ${safeInstantResponse}</p></div>` : ''}

          <button class="next-moment-btn" id="nextMomentBtn">Próximo Momento Crítico</button>
        </div>`;

    document.getElementById('feedbackContainer').innerHTML = fb;
    document.getElementById('feedbackContainer').scrollIntoView({ behavior: 'smooth' });

    // ✅ Adicionar listener ao botão de próximo momento
    attachNextMomentListener();
}

function attachNextMomentListener() {
    const nextBtn = document.getElementById('nextMomentBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', generateNewMoment);
    }
}

// ========================================
// FUNÇÕES AUXILIARES (TRIAL/UPGRADE)
// ========================================
async function goToUpgrade() {
    const btn = document.querySelector('.upgrade-btn');
    if (btn) btn.textContent = 'Processando...';

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/payments/create-checkout-session`, {
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
            alert('Erro ao iniciar upgrade: ' + (data.error || 'Tente novamente'));
            if (btn) btn.textContent = 'Fazer Upgrade Agora';
        }
    } catch (e) {
        console.error('Erro de upgrade:', e);
        alert('Erro de conexão.');
        if (btn) btn.textContent = 'Fazer Upgrade Agora';
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
