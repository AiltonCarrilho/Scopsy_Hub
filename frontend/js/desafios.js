document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    loadProgress(); // Carregar painel de progresso ao iniciar
});

const API_URL = 'http://localhost:3000/api'; // Ajuste se necessário para prod
let currentMoment = null;
let selectedChoice = null;
let startTime = null;

// ========================================
// LÓGICA DO PAINEL DE PROGRESSO (NOVO)
// ========================================
function loadProgress() {
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

        // Calcular limites (Baseado no Breakdown do backend)
        const LIMIT_GENERAL = 30;

        // Blindagem: Garantir que valores nulos do backend virem ZERO explicitamente
        const usedRaciocinio = Number(data.breakdown?.raciocinio || 0);
        const usedRadar = Number(data.breakdown?.radar || 0);
        const used = usedRaciocinio + usedRadar;

        console.log('🐞 DEBUG TRIAL:', { usedRaciocinio, usedRadar, used, limit: LIMIT_GENERAL });

        const remainingUsage = Math.max(0, LIMIT_GENERAL - used);
        const remainingDays = data.trial_days_left !== undefined ? Number(data.trial_days_left) : 7;

        let html = '';

        if (isTrial) {
            // MODO TRIAL
            html = `
                <strong>Seu Progresso Trial</strong>
                <div class="progress-grid">
                    <div class="progress-item">
                        <strong>${remainingUsage}</strong>
                        <span>Acessos Restantes</span>
                    </div>
                     <div class="progress-item">
                        <strong>${remainingDays}</strong>
                        <span>Dias Restantes</span>
                    </div>
                </div>
            `;

            // Atualizar Avisos/Bloqueio (Considera AMBOS os limites)
            updateTrialUI(remainingUsage, remainingDays);

        } else {
            // MODO PREMIUM (Mostra Cognits e Total)
            // Agora pegamos Cognits REAIS da API
            html = `
                <strong>Sua Performance Premium</strong>
                <div class="progress-grid">
                    <div class="progress-item">
                        <strong>${data.cognits || 0}</strong>
                        <span>Cognits</span>
                    </div>
                    <div class="progress-item">
                        <strong>${data.breakdown?.raciocinio || 0}</strong>
                        <span>Desafios Concluídos</span>
                    </div>
                </div>
            `;
        }

        panel.innerHTML = html;

    } catch (e) {
        console.error("Erro ao carregar stats", e);
    }
}


// ========================================
// LÓGICA DOS CASOS (EXISTENTE)
// ========================================

async function generateNewMoment() {
    document.getElementById('momentContainer').innerHTML = '<div class="loading">Gerando momento crítico...</div>';
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

    let optionsHTML = '';
    m.options.forEach(opt => {
        optionsHTML += `
          <div class="option-card" onclick="selectOption('${opt.letter}', this)">
            <span class="option-letter">${opt.letter}</span>
            <div style="flex:1">
              <strong>${opt.approach}</strong>
              <p style="margin:8px 0 0; color:#666; font-style:italic;">"${opt.response}"</p>
            </div>
          </div>`;
    });

    document.getElementById('momentContainer').innerHTML = `
        <div class="moment-card">
          <span class="context-badge">${ctx.diagnosis || 'Momento Clínico'}</span>
          
          <div class="context-section">
            <h4>CONTEXTO</h4>
            <p><strong>Cliente:</strong> ${ctx.client_name}, ${ctx.client_age} anos • <strong>Sessão:</strong> ${ctx.session_number}</p>
            <p><strong>Acabou de acontecer:</strong> ${ctx.what_just_happened}</p>
          </div>

          <div class="critical-moment">
            <h4 style="margin:0 0 16px; color:#e65100;">MOMENTO CRÍTICO</h4>
            <div class="dialogue">"${cm.dialogue}"</div>
            <div class="non-verbal"><strong>Observação:</strong> ${cm.non_verbal}</div>
          </div>

          <div class="decision-point">${m.decision_point}</div>

          <h4 style="margin:32px 0 16px; font-size:1.4rem;">Sua resposta:</h4>
          <div class="options-grid">${optionsHTML}</div>

          <div class="reasoning-section">
            <label style="display:block; margin-bottom:12px; font-weight:700;">Por que você escolheu esta opção?</label>
            <textarea id="reasoningText" class="reasoning-textarea" placeholder="Explique seu raciocínio em 1-2 frases..."></textarea>
          </div>

          <button class="submit-btn" id="submitBtn" onclick="submitDecision()" disabled>Confirmar Decisão</button>
        </div>`;
}

function selectOption(letter, el) {
    document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    selectedChoice = letter;
    document.getElementById('submitBtn').disabled = false;
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

    const fb = `
        <div class="feedback-card">
          <div class="feedback-header ${f.is_correct ? 'correct' : 'incorrect'}">
            <h2>${f.immediate_feedback}</h2>
            <p style="margin-top:12px; font-size:1.2rem;">
              ${f.is_correct ? 'Você pensou como um clínico experiente!' : 'Vamos crescer juntos com este aprendizado'}
            </p>
          </div>

          ${f.user_reasoning_analysis ? `<div class="feedback-section"><h4>Seu Raciocínio</h4><p style="font-style:italic;">${f.user_reasoning_analysis}</p></div>` : ''}

          <div class="feedback-section"><h4>Por que ${f.expert_choice} é a melhor escolha</h4><p>${er.why_this_works || ''}</p></div>

          ${er.core_principle ? `<div class="principle-box">PRINCÍPIO CLÍNICO: "${er.core_principle}"</div>` : ''}

          ${lp ? `<div class="feedback-section" style="background:#ecfdf5;"><h4>Aprendizado</h4><p><strong>Padrão:</strong> ${lp.pattern_to_recognize}</p><p><strong>Resposta ideal:</strong> ${lp.instant_response}</p></div>` : ''}

          <button class="next-moment-btn" onclick="generateNewMoment()">Próximo Momento Crítico</button>
        </div>`;

    document.getElementById('feedbackContainer').innerHTML = fb;
    document.getElementById('feedbackContainer').scrollIntoView({ behavior: 'smooth' });
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

    // 1. Resetar Estado Visual
    warning.classList.add('hidden');
    expired.classList.add('hidden');

    if (newMomentBtn) {
        newMomentBtn.disabled = false;
        newMomentBtn.style.opacity = '1';
        newMomentBtn.style.cursor = 'pointer';
        newMomentBtn.title = "Gerar novo caso";
    }

    // 2. Definir Estado de Expiração (BLOQUEIO)
    // Regra: Bloqueia se ACABOU TEMPO (<=0) OU ACABOU ATIVIDADES (<=0)
    // O Trial só é válido se (Dias > 0 E Atividades > 0)
    const isTimeExpired = remainingDays <= 0;
    const isUsageExpired = remainingUsage <= 0;
    const isTrialExpired = isTimeExpired || isUsageExpired;

    if (isTrialExpired) {
        // --- BLOQUEIO TOTAL ---
        expired.classList.remove('hidden');

        // Mensagem específica da causa
        const textEl = expired.querySelector('.trial-text');
        if (textEl) {
            if (isTimeExpired) {
                textEl.innerHTML = `<strong>Seu período de teste terminou.</strong><br>Os 7 dias de acesso grátis expiraram.`;
            } else {
                textEl.innerHTML = `<strong>Limite de atividades atingido.</strong><br>Você completou os 30 casos do período de teste.`;
            }
        }

        // Bloquear Botão
        if (newMomentBtn) {
            newMomentBtn.disabled = true;
            newMomentBtn.style.opacity = '0.5';
            newMomentBtn.style.cursor = 'not-allowed';
            newMomentBtn.title = "Faça upgrade para continuar treinando";
        }

        // Se já bloqueou, não precisa mostrar aviso de "quase acabando"
        lucide.createIcons();
        return;
    }

    // 3. Definir Estado de Alerta (AVISO)
    // Regra: Aviso se POUCO TEMPO (<=3) OU POUCAS ATIVIDADES (<=3)
    const isTimeLow = remainingDays <= 3;
    const isUsageLow = remainingUsage <= 3;

    if (isTimeLow || isUsageLow) {
        warning.classList.remove('hidden');

        const textEl = warning.querySelector('.trial-text');
        if (textEl) {
            if (isTimeLow) {
                textEl.innerHTML = `Seu teste acaba em <strong>${remainingDays} dia(s)</strong>.<br>Aproveite ou faça upgrade.`;
            } else {
                textEl.innerHTML = `Restam apenas <strong>${remainingUsage} atividades</strong>.<br>Aproveite ou faça upgrade.`;
            }
        }
    }

    // Re-renderizar ícones
    lucide.createIcons();
}
