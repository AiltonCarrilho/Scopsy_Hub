/* ============================================
   GAMIFICATION.JS - Funções Centrais
   ============================================ */

// ─── Configuração por módulo ───────────────────────────────────────────────
const MODULE_CONFIG = {
    diagnostic:        { icon: '🎯', title: 'Decisão de Expert!',      colors: ['#0891B2','#06b6d4','#2952CC','#ffffff'] },
    case:              { icon: '⚡', title: 'Análise Precisa!',         colors: ['#7C3AED','#8B5CF6','#EC4899','#ffffff'] },
    conceptualization: { icon: '🧩', title: 'Conceituação Completa!',  colors: ['#10B981','#34D399','#FFD700','#ffffff'] },
    journey:           { icon: '🛤️', title: 'Sessão Concluída!',       colors: ['#FFD700','#FFA500','#F97316','#ffffff'] },
};

// ─── Estado de sessão (front-end only, reset ao recarregar) ───────────────
const celebrationState = {
    streak: 0,
    sessionCorrects: 0,
    lastCelebrationTime: 0,
};

/**
 * Exibe toast de ganho de cognits
 * @param {number} amount - Quantidade de cognits ganhos
 * @param {string} reason - Motivo (opcional)
 */
function showCognitToast(amount, reason = '') {
    // Remover toast anterior se existir
    const existingToast = document.querySelector('.cognit-toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Criar toast
    const toast = document.createElement('div');
    toast.className = 'cognit-toast';
    toast.innerHTML = `
    <div class="cognit-icon-animated">
      <img src="/assets/icons/cognit.svg" alt="Cognit">
    </div>
    <div class="cognit-text">
      <span class="cognit-amount-toast">+${amount}</span>
      <span class="cognit-label">${reason || 'Cognits'}</span>
    </div>
  `;

    document.body.appendChild(toast);

    // Atualizar contador no header (se existir)
    updateCognitCounter(amount);

    // Remover após 3 segundos
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Motor central de celebração com 4 camadas
 * @param {number} amount - Quantidade de cognits ganhos
 * @param {boolean} isCorrect - Se foi uma resposta correta
 * @param {string} module - Módulo ativo ('case'|'diagnostic'|'conceptualization'|'journey')
 */
function showCelebration(amount, isCorrect = true, module = 'case') {
    const cfg = MODULE_CONFIG[module] || MODULE_CONFIG.case;

    if (!isCorrect) {
        // Streak quebrado
        celebrationState.streak = 0;
        if (amount > 0) {
            showCognitToast(amount, '💡 Por tentar');
        }
        return;
    }

    // Acerto: atualiza estado
    celebrationState.streak++;
    celebrationState.sessionCorrects++;

    // ── Layer 3: Streak Combo ──────────────────────────────────────────────
    if (celebrationState.streak >= 3) {
        _playStreakCombo(celebrationState.streak, amount, cfg);
        updateCognitCounter(amount);
        return;
    }

    // ── Layer 1: Anti-fadiga (muitos acertos rápidos) ─────────────────────
    const now = Date.now();
    if (celebrationState.sessionCorrects > 10 && (now - celebrationState.lastCelebrationTime) < 5000) {
        showCognitToast(amount, 'Resposta correta');
        return;
    }

    // ── Layer 2: Confete + Overlay ─────────────────────────────────────────
    _showCelebrationOverlay(cfg.icon, cfg.title, amount);
    _playModuleConfetti(cfg.colors);
    updateCognitCounter(amount);
    celebrationState.lastCelebrationTime = Date.now();
}

// ─── Helpers privados ──────────────────────────────────────────────────────

/**
 * Exibe overlay modal de celebração
 */
function _showCelebrationOverlay(icon, title, amount) {
    const overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    overlay.innerHTML = `
    <div class="celebration-content">
      <div class="celebration-icon">${icon}</div>
      <h2 class="celebration-title">${title}</h2>
      <div class="celebration-cognits">+${amount}</div>
      <p class="celebration-message">Cognits ganhos</p>
      <button class="celebration-btn" onclick="const ov = this.closest('.celebration-overlay'); ov.classList.add('hiding'); setTimeout(() => ov.remove(), 300);">
        Continuar
      </button>
    </div>
    <canvas id="confetti-canvas"></canvas>
  `;

    document.body.appendChild(overlay);

    setTimeout(() => {
        if (overlay && overlay.parentNode) {
            overlay.classList.add('hiding');
            setTimeout(() => overlay.remove(), 300);
        }
    }, 4000);
}

/**
 * Lança confete com paleta de cores do módulo
 * @param {string[]} colors - Array de cores hex
 */
function _playModuleConfetti(colors) {
    if (typeof confetti === 'undefined') {
        console.error('❌ canvas-confetti NÃO carregado! Verifique a importação no HTML.');
        return;
    }

    const canvas = document.getElementById('confetti-canvas');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });

    // Canhões laterais (2s)
    const end = Date.now() + 2000;
    (function frame() {
        myConfetti({ particleCount: 5, angle: 60,  spread: 55, origin: { x: 0 }, colors, startVelocity: 60 });
        myConfetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors, startVelocity: 60 });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());

    // Explosão central
    myConfetti({ particleCount: 200, spread: 180, origin: { y: 0.6 }, colors, startVelocity: 50, scalar: 1.2 });

    // Chuva contínua (2s extra)
    setTimeout(() => {
        const animEnd = Date.now() + 2000;
        const iv = setInterval(() => {
            if (Date.now() >= animEnd) { clearInterval(iv); return; }
            myConfetti({ particleCount: 60, startVelocity: 40, spread: 360, origin: { x: Math.random(), y: Math.random() - 0.2 }, colors, scalar: _rand(0.8, 1.5) });
        }, 200);
    }, 200);
}

/**
 * Exibe combo badge + confete proporcional ao streak
 * @param {number} streak - Streak atual
 * @param {number} amount - Cognits ganhos
 * @param {Object} cfg - Configuração do módulo atual
 */
function _playStreakCombo(streak, amount, cfg) {
    if (typeof confetti === 'undefined') return;

    // ── Combo badge ────────────────────────────────────────────────────────
    const existing = document.querySelector('.combo-container');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.className = 'combo-container';
    container.innerHTML = `
      <div class="combo-badge">
        <span class="combo-fire">🔥</span>
        <div>
          <div class="combo-number">x${streak}</div>
          <div class="combo-label">Combo</div>
        </div>
      </div>
    `;
    document.body.appendChild(container);
    setTimeout(() => { if (container.parentNode) container.remove(); }, 2000);

    // ── Confete por intensidade ────────────────────────────────────────────
    let colors, particles, bursts;
    if (streak >= 10) {
        // Rainbow
        colors = ['#FF0000','#FF7F00','#FFFF00','#00FF00','#0000FF','#8B00FF','#ffffff'];
        particles = 120; bursts = 2;
    } else if (streak >= 8) {
        colors = ['#FF6B6B','#FFD700','#7C3AED','#00CED1','#ffffff'];
        particles = 100; bursts = 2;
    } else if (streak >= 5) {
        colors = ['#F97316','#FCD34D','#FFA500','#ffffff'];
        particles = 60; bursts = 1;
    } else {
        // streak 3–4: verde suave
        colors = ['#10B981','#34D399','#6EE7B7','#ffffff'];
        particles = 30; bursts = 0;
    }

    // Burst principal
    confetti({ particleCount: particles, spread: 90, origin: { y: 0.5 }, colors, startVelocity: 45 });

    // Bursts extras
    for (let i = 0; i < bursts; i++) {
        setTimeout(() => {
            confetti({ particleCount: Math.floor(particles * 0.6), spread: 120, origin: { x: Math.random(), y: _rand(0.3, 0.7) }, colors, startVelocity: 35 });
        }, (i + 1) * 250);
    }

    // Overlay especial ao atingir 10+
    if (streak >= 10) {
        _showCelebrationOverlay('🔥', `COMBO x${streak}!`, amount);
    }
}

/**
 * Lança confetti ÉPICO na tela (compat. legada)
 */
function launchConfetti() {
    _playModuleConfetti(['#0891B2', '#2952CC', '#7C3AED', '#EC4899', '#F97316', '#FFD700', '#ffffff']);
}

function _rand(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Atualiza contador de cognits no header
 * @param {number} gained - Cognits ganhos
 */
function updateCognitCounter(gained) {
    const counter = document.getElementById('cognitAmount');
    if (counter) {
        const current = parseInt(counter.textContent) || 0;
        const newAmount = current + gained;

        // Animação de incremento
        animateNumber(counter, current, newAmount, 600);
    }

    // Atualizar também o contador atual na barra de progresso
    const currentCognits = document.getElementById('currentCognits');
    if (currentCognits) {
        const current = parseInt(currentCognits.textContent) || 0;
        const newAmount = current + gained;
        animateNumber(currentCognits, current, newAmount, 600);

        // Atualizar barra de progresso
        updateProgressBar(newAmount);
    }
}

/**
 * Atualiza barra de progresso
 */
function updateProgressBar(newCognits) {
    const progressBar = document.getElementById('levelProgressBar');
    const targetCognits = document.getElementById('targetCognits');
    const remainingCognits = document.getElementById('remainingCognits');

    if (progressBar && targetCognits) {
        const target = parseInt(targetCognits.textContent) || 151;
        const progress = (newCognits / target) * 100;
        progressBar.style.width = `${Math.min(progress, 100)}%`;

        if (remainingCognits) {
            const remaining = Math.max(0, target - newCognits);
            remainingCognits.textContent = remaining;
        }
    }
}

/**
 * Anima número incrementando
 */
function animateNumber(element, from, to, duration) {
    const start = Date.now();
    const range = to - from;

    function update() {
        const now = Date.now();
        const progress = Math.min((now - start) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(from + (range * easeOut));

        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.showCognitToast = showCognitToast;
    window.showCelebration = showCelebration;
    window.updateCognitCounter = updateCognitCounter;
}
