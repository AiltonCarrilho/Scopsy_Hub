/* ============================================
   GAMIFICATION.JS - Funções Centrais
   ============================================ */

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
 * Exibe celebração grande com confetti (apenas para acertos)
 * @param {number} amount - Quantidade de cognits ganhos
 * @param {boolean} isCorrect - Se foi uma resposta correta
 */
function showCelebration(amount, isCorrect = true) {
    if (!isCorrect) {
        // Para erros, apenas toast simples
        showCognitToast(amount, '💡 Por tentar');
        return;
    }

    // Criar overlay
    const overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    overlay.innerHTML = `
    <div class="celebration-content">
      <div class="celebration-icon">🎯</div>
      <h2 class="celebration-title">Decisão de Expert!</h2>
      <div class="celebration-cognits">+${amount}</div>
      <p class="celebration-message">Cognits ganhos</p>
      <button class="celebration-btn" onclick="const ov = this.closest('.celebration-overlay'); ov.classList.add('hiding'); setTimeout(() => ov.remove(), 300);">
        Continuar
      </button>
    </div>
    <canvas id="confetti-canvas"></canvas>
  `;

    document.body.appendChild(overlay);

    // Confetti!
    launchConfetti();

    // Atualizar contador
    updateCognitCounter(amount);

    // Remover automaticamente após 4 segundos (ajustado para nova animação 3s + margem)
    setTimeout(() => {
        if (overlay && overlay.parentNode) {
            overlay.classList.add('hiding');
            setTimeout(() => overlay.remove(), 300);
        }
    }, 4000);
}

/**
 * Lança confetti ÉPICO na tela
 */
function launchConfetti() {
    // Verificar se canvas-confetti está disponível
    if (typeof confetti === 'undefined') {
        console.error('❌ canvas-confetti NÃO carregado! Verifique a importação no HTML.');
        return;
    }

    console.log('🚀 Iniciando animação ÉPICA (3s)!');

    // Ajustar o canvas para o overlay
    const canvas = document.getElementById('confetti-canvas');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    const myConfetti = confetti.create(canvas, {
        resize: true,
        useWorker: true
    });

    const colors = ['#0891B2', '#2952CC', '#7C3AED', '#EC4899', '#F97316', '#FFD700', '#ffffff'];

    // 1. Efeito "School Pride" (Canhões laterais) - Imediato e INTENSO
    const end = Date.now() + (2 * 1000); // 2 segundos

    (function frame() {
        myConfetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors,
            startVelocity: 60
        });
        myConfetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors,
            startVelocity: 60
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());

    // 2. Explosão Central Massiva (imediatamente)
    myConfetti({
        particleCount: 200,
        spread: 180,
        origin: { y: 0.6 },
        colors: colors,
        startVelocity: 50,
        scalar: 1.2
    });

    // 3. Chuva Contínua e Aleatória (Curta)
    setTimeout(() => {
        const duration = 2000; // 2 segundos extra
        const animationEnd = Date.now() + duration;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 60;

            myConfetti({
                particleCount,
                startVelocity: 40,
                spread: 360,
                origin: {
                    x: Math.random(),
                    y: Math.random() - 0.2
                },
                colors: colors,
                scalar: randomInRange(0.8, 1.5)
            });
        }, 200);
    }, 200);

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }
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
    window.showCelebration = showCelebration; // Adicionado export
    window.updateCognitCounter = updateCognitCounter;
}
