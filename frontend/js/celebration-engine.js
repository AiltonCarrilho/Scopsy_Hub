/* ============================================
   CELEBRATION ENGINE v1.0
   Sistema de 4 camadas de celebração contextual
   Substitui showCelebration do gamification.js
   Carregado APÓS gamification.js em cada módulo
   ============================================ */

(function () {
  'use strict';

  // ===== CONFIG POR MÓDULO =====
  const MODULE_CONFIG = {
    diagnostic: {
      name: 'Radar Diagnóstico',
      icon: '🎯',
      title: 'Decisão de Expert!',
      colors: ['#0891B2', '#06b6d4', '#22d3ee', '#2952CC', '#ffffff'],
      gradient: 'linear-gradient(135deg, #0891B2, #2952CC)',
    },
    case: {
      name: 'Desafio Clínico',
      icon: '⚡',
      title: 'Análise Precisa!',
      colors: ['#7C3AED', '#8B5CF6', '#A78BFA', '#EC4899', '#ffffff'],
      gradient: 'linear-gradient(135deg, #7C3AED, #EC4899)',
    },
    conceptualization: {
      name: 'Conceituação',
      icon: '🧩',
      title: 'Conceituação Completa!',
      colors: ['#10B981', '#34D399', '#6EE7B7', '#FFD700', '#ffffff'],
      gradient: 'linear-gradient(135deg, #10B981, #FFD700)',
    },
    journey: {
      name: 'Jornada Clínica',
      icon: '🛤️',
      title: 'Sessão Concluída!',
      colors: ['#FFD700', '#FFA500', '#F97316', '#FBBF24', '#ffffff'],
      gradient: 'linear-gradient(135deg, #FFD700, #F97316)',
    },
  };

  // ===== ESTADO DE SESSÃO =====
  const session = {
    streak: 0,
    sessionCorrects: 0,
    lastOverlay: 0,
    streakTimer: null,
  };

  // ===== CSS INJETADO DINAMICAMENTE =====
  function injectCSS() {
    if (document.getElementById('ce-styles')) return;
    const style = document.createElement('style');
    style.id = 'ce-styles';
    style.textContent = `
      /* --- Toast stack (Camada 1) --- */
      .ce-toast-stack {
        position: fixed;
        top: 80px;
        right: 24px;
        z-index: 99990;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
      }
      .ce-toast {
        background: #ffffff;
        border: 1px solid rgba(0,0,0,0.08);
        border-radius: 12px;
        padding: 14px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        position: relative;
        overflow: hidden;
        min-width: 220px;
        animation: ce-toast-in 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: auto;
        font-family: 'Inter', -apple-system, system-ui, sans-serif;
      }
      .ce-toast-icon {
        width: 28px; height: 28px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; flex-shrink: 0;
      }
      .ce-toast-icon.success { background: rgba(45,212,191,0.15); }
      .ce-toast-icon.consolo { background: rgba(124,58,237,0.12); }
      .ce-toast-amount {
        font-size: 16px; font-weight: 800;
        background: linear-gradient(135deg, #008CE2, #2DD4BF);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      }
      .ce-toast-label { font-size: 11px; color: #64748B; }
      .ce-toast-bar {
        position: absolute; bottom: 0; left: 0; height: 3px;
        border-radius: 0 0 12px 12px;
        animation: ce-drain 2.5s linear forwards;
      }
      .ce-toast-bar.success { background: linear-gradient(90deg, #008CE2, #2DD4BF); }
      .ce-toast-bar.consolo { background: linear-gradient(90deg, #7C3AED, #8B5CF6); }

      /* --- Overlay de acerto (Camada 2) --- */
      .ce-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.7);
        z-index: 99995;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        animation: ce-fade-in 0.3s ease-out;
        font-family: 'Inter', -apple-system, system-ui, sans-serif;
      }
      .ce-overlay-card {
        background: #ffffff;
        border-radius: 24px;
        padding: 48px 40px;
        text-align: center;
        max-width: 440px; width: 90%;
        animation: ce-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      }
      .ce-overlay-icon { font-size: 72px; margin-bottom: 16px; animation: ce-bounce 0.6s ease-out 0.2s both; display: block; }
      .ce-overlay-title {
        font-size: 26px; font-weight: 800; margin-bottom: 8px; display: block;
        -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      }
      .ce-overlay-cognits {
        font-size: 48px; font-weight: 900; display: block;
        background: linear-gradient(135deg, #008CE2, #2DD4BF);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        animation: ce-cognits-pop 0.8s ease-out 0.4s both;
      }
      .ce-overlay-sub { font-size: 13px; color: #64748B; margin-top: 10px; display: block; }

      /* --- Combo badge (Camada 3) --- */
      .ce-combo {
        position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
        z-index: 99993; pointer-events: none;
      }
      .ce-combo-badge {
        background: linear-gradient(135deg, #F97316, #EF4444);
        padding: 10px 20px; border-radius: 12px;
        display: flex; align-items: center; gap: 10px;
        animation: ce-slam 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 4px 24px rgba(249,115,22,0.4);
        white-space: nowrap;
      }
      .ce-combo-fire { font-size: 22px; }
      .ce-combo-num { font-size: 26px; font-weight: 900; color: #fff; line-height: 1; }
      .ce-combo-lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.75); }

      /* --- Epic overlay (Camada 4) --- */
      .ce-epic {
        position: fixed; inset: 0; z-index: 99999;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        font-family: 'Inter', -apple-system, system-ui, sans-serif;
      }
      .ce-epic-bg {
        position: absolute; inset: 0;
        background: radial-gradient(circle at center, rgba(124,58,237,0.25), rgba(0,0,0,0.88));
        animation: ce-fade-in 0.4s ease-out;
      }
      .ce-epic-card {
        position: relative; text-align: center;
        background: #ffffff;
        border-radius: 24px; padding: 48px 40px;
        max-width: 440px; width: 90%;
        animation: ce-epic-enter 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 20px 60px rgba(124,58,237,0.4), 0 0 0 1px rgba(255,215,0,0.15);
      }
      .ce-epic-icon { font-size: 72px; margin-bottom: 12px; display: block; }
      .ce-epic-label {
        font-size: 12px; text-transform: uppercase; letter-spacing: 4px;
        color: #008CE2; margin-bottom: 8px; display: block;
      }
      .ce-epic-title {
        font-size: 32px; font-weight: 900; display: block;
        background: linear-gradient(135deg, #F97316, #EC4899);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      }
      .ce-epic-sub { font-size: 14px; color: #64748B; margin-top: 8px; display: block; }
      .ce-epic-cognits {
        font-size: 44px; font-weight: 900; margin-top: 12px; display: block;
        background: linear-gradient(135deg, #008CE2, #2DD4BF);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      }

      /* --- Ripple (fundo Camada 4) --- */
      .ce-ripple { position: fixed; inset: 0; pointer-events: none; z-index: 99992; }
      .ce-ripple-circle {
        position: absolute; border-radius: 50%; transform: scale(0);
        animation: ce-ripple 1s ease-out forwards;
      }

      /* --- Keyframes --- */
      @keyframes ce-toast-in {
        0% { transform: translateX(120%); opacity: 0; }
        100% { transform: translateX(0); opacity: 1; }
      }
      @keyframes ce-drain { 0% { width: 100%; } 100% { width: 0%; } }
      @keyframes ce-fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
      @keyframes ce-pop {
        0% { transform: scale(0.5) rotate(-8deg); opacity: 0; }
        100% { transform: scale(1) rotate(0); opacity: 1; }
      }
      @keyframes ce-bounce {
        0% { transform: translateY(0); }
        50% { transform: translateY(-16px); }
        100% { transform: translateY(0); }
      }
      @keyframes ce-cognits-pop {
        0% { transform: scale(0.5); opacity: 0; }
        60% { transform: scale(1.12); }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes ce-slam {
        0% { transform: scale(0) rotate(-15deg); opacity: 0; }
        65% { transform: scale(1.12) rotate(3deg); }
        100% { transform: scale(1) rotate(0); opacity: 1; }
      }
      @keyframes ce-epic-enter {
        0% { transform: scale(0.3) translateY(40px); opacity: 0; filter: blur(10px); }
        50% { filter: blur(0); }
        70% { transform: scale(1.04) translateY(-4px); }
        100% { transform: scale(1) translateY(0); opacity: 1; }
      }
      @keyframes ce-ripple {
        0% { transform: scale(0); opacity: 0.45; }
        100% { transform: scale(5); opacity: 0; }
      }

      /* --- Acessibilidade --- */
      @media (prefers-reduced-motion: reduce) {
        .ce-toast, .ce-overlay-card, .ce-combo-badge, .ce-epic-card,
        .ce-ripple-circle, .ce-overlay-icon, .ce-overlay-cognits {
          animation-duration: 0.01ms !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ===== HELPERS =====
  function getModuleCfg() {
    const mod = window.SCOPSY_MODULE || 'diagnostic';
    return MODULE_CONFIG[mod] || MODULE_CONFIG.diagnostic;
  }

  function removeAfter(el, delay) {
    setTimeout(() => { if (el && el.parentNode) el.remove(); }, delay);
  }

  // ===== CAMADA 1: TOAST =====
  let _toastStack = null;

  function getStack() {
    if (!_toastStack || !document.body.contains(_toastStack)) {
      _toastStack = document.createElement('div');
      _toastStack.className = 'ce-toast-stack';
      document.body.appendChild(_toastStack);
    }
    return _toastStack;
  }

  function playToast(cognits, type) {
    const stack = getStack();
    // Máximo 3 toasts simultâneos
    while (stack.children.length >= 3) {
      stack.lastChild.remove();
    }
    const isConsolo = type === 'consolo';
    const toast = document.createElement('div');
    toast.className = 'ce-toast';
    toast.innerHTML = `
      <div class="ce-toast-icon ${isConsolo ? 'consolo' : 'success'}">${isConsolo ? '💡' : '✓'}</div>
      <div>
        <div class="ce-toast-amount">+${cognits} cognit${cognits !== 1 ? 's' : ''}</div>
        <div class="ce-toast-label">${isConsolo ? 'Por tentar' : 'Resposta correta'}</div>
      </div>
      <div class="ce-toast-bar ${isConsolo ? 'consolo' : 'success'}"></div>
    `;
    stack.prepend(toast);
    setTimeout(() => {
      toast.style.transition = 'all 0.3s ease';
      toast.style.transform = 'translateX(120%)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // ===== CAMADA 2: CONFETE + OVERLAY =====
  function playConfete(cognits, colors) {
    if (typeof confetti === 'undefined') return;
    const scale = Math.min(cognits / 10, 2.5);
    const particles = Math.floor(40 + cognits * 3);
    confetti({ particleCount: Math.floor(particles / 3), angle: 60, spread: 55, origin: { x: 0, y: 0.65 }, colors, startVelocity: 50 * scale });
    confetti({ particleCount: Math.floor(particles / 3), angle: 120, spread: 55, origin: { x: 1, y: 0.65 }, colors, startVelocity: 50 * scale });
    setTimeout(() => {
      confetti({ particleCount: particles, spread: 160, startVelocity: 40 * scale, origin: { y: 0.6 }, colors, scalar: 1 + scale * 0.15 });
    }, 100);
  }

  function playOverlay(icon, title, cognits, gradient) {
    // Não empilha overlays
    if (document.querySelector('.ce-overlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'ce-overlay';
    overlay.innerHTML = `
      <div class="ce-overlay-card">
        <span class="ce-overlay-icon">${icon}</span>
        <span class="ce-overlay-title" style="background: ${gradient}; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">${title}</span>
        ${cognits > 0 ? `<span class="ce-overlay-cognits">+${cognits}</span>` : ''}
        <span class="ce-overlay-sub">Clique para continuar</span>
      </div>
    `;
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
    session.lastOverlay = Date.now();
    removeAfter(overlay, 2500);
  }

  // ===== CAMADA 3: STREAK PROGRESSIVO =====
  function playStreakConfetti(streak, colors) {
    if (typeof confetti === 'undefined') return;
    const intensity = Math.min(streak, 12);
    let streakColors;
    if (streak < 5) streakColors = ['#10B981', '#34D399', '#6EE7B7'];
    else if (streak < 8) streakColors = ['#F97316', '#FBBF24', '#FFD700'];
    else streakColors = colors;

    confetti({
      particleCount: 15 + intensity * 12,
      spread: 60 + intensity * 8,
      startVelocity: 25 + intensity * 4,
      origin: { y: 0.65 },
      colors: streakColors,
      scalar: 0.8 + intensity * 0.06,
    });

    if (streak === 5 || streak === 8 || streak >= 10) {
      setTimeout(() => {
        confetti({ particleCount: 130, spread: 180, startVelocity: 45, origin: { y: 0.5 }, colors: streakColors, scalar: 1.2 });
      }, 150);
    }
  }

  function playCombo(streak) {
    document.querySelector('.ce-combo')?.remove();
    const icon = streak >= 10 ? '🌟' : streak >= 7 ? '💥' : '🔥';
    const el = document.createElement('div');
    el.className = 'ce-combo';
    el.innerHTML = `
      <div class="ce-combo-badge">
        <span class="ce-combo-fire">${icon}</span>
        <div>
          <div class="ce-combo-num">x${streak}</div>
          <div class="ce-combo-lbl">COMBO</div>
        </div>
      </div>
    `;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'all 0.4s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(-20px)';
      setTimeout(() => el.remove(), 400);
    }, 2000);
  }

  // ===== CAMADA 4: ÉPICO =====
  function playRipple() {
    const container = document.createElement('div');
    container.className = 'ce-ripple';
    document.body.appendChild(container);
    const rippleColors = ['rgba(124,58,237,0.2)', 'rgba(8,145,178,0.18)', 'rgba(236,72,153,0.14)'];
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        const circle = document.createElement('div');
        circle.className = 'ce-ripple-circle';
        circle.style.cssText = `
          width: 120px; height: 120px;
          left: calc(50% - 60px); top: calc(50% - 60px);
          background: ${rippleColors[i % rippleColors.length]};
          animation-delay: ${i * 0.12}s;
        `;
        container.appendChild(circle);
      }, i * 120);
    }
    removeAfter(container, 2000);
  }

  // Web Audio API — fanfarra épica
  let _audioCtx = null;
  function getAudioCtx() {
    if (!_audioCtx) {
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { /* sem suporte */ }
    }
    return _audioCtx;
  }

  function playTone(freq, dur, type, vol, t) {
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    } catch (e) { /* falha silenciosa */ }
  }

  function playEpicSound() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    ctx.resume();
    const now = ctx.currentTime;
    playTone(523, 0.15, 'sine', 0.1,  now);
    playTone(659, 0.15, 'sine', 0.1,  now + 0.08);
    playTone(784, 0.15, 'sine', 0.1,  now + 0.16);
    playTone(1047, 0.3, 'sine', 0.14, now + 0.28);
    playTone(1319, 0.4, 'triangle', 0.08, now + 0.4);
  }

  function playEpicOverlay(data, cognits) {
    if (document.querySelector('.ce-epic')) return;
    const overlay = document.createElement('div');
    overlay.className = 'ce-epic';
    overlay.innerHTML = `
      <div class="ce-epic-bg"></div>
      <div class="ce-epic-card">
        <span class="ce-epic-icon">${data.icon}</span>
        <span class="ce-epic-label">${data.label}</span>
        <span class="ce-epic-title">${data.title}</span>
        <span class="ce-epic-sub">${data.sub}</span>
        ${cognits > 0 ? `<span class="ce-epic-cognits">+${cognits}</span>` : ''}
      </div>
    `;
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
    removeAfter(overlay, 3500);
  }

  function playEpicFull(data, cognits) {
    playRipple();
    playEpicSound();
    if (typeof confetti !== 'undefined') {
      const epicColors = ['#0891B2', '#7C3AED', '#EC4899', '#F97316', '#FFD700', '#10B981', '#fff'];
      setTimeout(() => {
        confetti({ particleCount: 200, spread: 180, startVelocity: 55, origin: { y: 0.55 }, colors: epicColors, scalar: 1.3 });
        setTimeout(() => {
          confetti({ particleCount: 80, spread: 360, startVelocity: 35, origin: { x: Math.random(), y: Math.random() * 0.4 }, colors: epicColors });
          confetti({ particleCount: 80, spread: 360, startVelocity: 35, origin: { x: Math.random(), y: Math.random() * 0.4 }, colors: epicColors });
        }, 400);
      }, 200);
    }
    playEpicOverlay(data, cognits);
  }

  // ===== ENGINE PRINCIPAL: decide camada =====
  function celebrar({ cognits, isCorrect, isRare, rareData, isMission, missionTier }) {
    const cfg = getModuleCfg();

    // Camada 4 — Evento épico (badge, nível, streak milestone)
    if (isRare && rareData) {
      playEpicFull(rareData, cognits || 0);
      return;
    }

    // Camada 4 — Missão difícil (tier 2 = +80-100 cognits)
    if (isMission && missionTier === 2) {
      playEpicFull({
        icon: '🏅',
        label: 'Missão Difícil',
        title: 'Missão Completa!',
        sub: `+${cognits} cognits de recompensa`,
      }, cognits);
      return;
    }

    // Camada 2 — Missão fácil/média
    if (isMission) {
      playConfete(cognits, cfg.colors);
      playOverlay(cfg.icon, 'Missão Completa!', cognits, cfg.gradient);
      return;
    }

    // Camada 3 — Streak ativo (3+)
    if (isCorrect && session.streak >= 3) {
      playStreakConfetti(session.streak, cfg.colors);
      playCombo(session.streak);
      // Streak 10+ também ganha overlay
      if (session.streak >= 10) {
        playOverlay('🌟', `COMBO x${session.streak}!`, cognits, cfg.gradient);
      }
      return;
    }

    // Camada 1 — Erro com consolo
    if (!isCorrect) {
      playToast(cognits, 'consolo');
      return;
    }

    // Camada 1 — Anti-fadiga (10+ acertos na sessão com overlay recente)
    if (session.sessionCorrects > 10 && Date.now() - session.lastOverlay < 5000) {
      playToast(cognits, 'success');
      return;
    }

    // Camada 2 — Acerto padrão
    playConfete(cognits, cfg.colors);
    playOverlay(cfg.icon, cfg.title, cognits, cfg.gradient);
  }

  // ===== OVERRIDE: window.showCelebration =====
  function showCelebrationEngine(cognits, isCorrect) {
    if (isCorrect === undefined) isCorrect = true;

    // Atualiza estado de sessão
    if (isCorrect) {
      session.sessionCorrects++;
      session.streak++;
      clearTimeout(session.streakTimer);
      session.streakTimer = setTimeout(() => {
        session.streak = 0;
      }, 5000);
    } else {
      session.streak = 0;
    }

    // Dispara celebração
    celebrar({ cognits, isCorrect });

    // Atualiza contador de cognits (função do gamification.js)
    if (typeof updateCognitCounter === 'function') {
      updateCognitCounter(cognits);
    }
  }

  // ===== API PÚBLICA =====
  window.CelebrationEngine = {
    // Para eventos externos (badges, level up, etc.)
    celebrarEpico: function (data, cognits) {
      playEpicFull(data, cognits || 0);
    },
    // Para completar missões (vindo do dashboard.js)
    celebrarMissao: function (cognits, tier) {
      const missionTier = tier === 'hard' ? 2 : tier === 'medium' ? 1 : 0;
      celebrar({ cognits, isCorrect: true, isMission: true, missionTier });
    },
    // Reset ao iniciar nova sessão
    resetSession: function () {
      session.streak = 0;
      session.sessionCorrects = 0;
      session.lastOverlay = 0;
      clearTimeout(session.streakTimer);
    },
    // Acesso ao estado (para debug)
    getSession: function () {
      return { ...session };
    },
  };

  // Substitui showCelebration do gamification.js
  window.showCelebration = showCelebrationEngine;

  // Inicializa CSS
  injectCSS();

  console.log('[CelebrationEngine] v1.0 ativo — módulo:', window.SCOPSY_MODULE || 'diagnostic (default)');

})();
