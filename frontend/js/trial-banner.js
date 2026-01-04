/**
 * trial-banner.js - VERSÃO LIMPA KIWIFY
 * Redirecionamento DIRETO sem API
 */

(function() {
    'use strict';

    console.log('🔵 trial-banner.js NOVO carregado');

    document.addEventListener('DOMContentLoaded', function() {
        initTrialBanner();
    });

    function initTrialBanner() {
        const userJson = localStorage.getItem('user');
        if (!userJson) {
            console.log('⚠️ Sem usuário logado');
            return;
        }

        try {
            const user = JSON.parse(userJson);
            console.log('👤 Usuário:', user.email, 'Plano:', user.plan);

            // Mostrar apenas para FREE
            const isPremium = user.plan === 'premium' || user.plan === 'pro';
            if (isPremium) {
                console.log('✅ Usuário premium - banner oculto');
                return;
            }

            const banner = document.getElementById('trialBanner');
            if (!banner) {
                console.warn('⚠️ Banner #trialBanner não encontrado');
                return;
            }

            // Mostrar banner
            banner.style.display = 'flex';
            console.log('✅ Banner trial exibido');

            // Atualizar dias
            const daysElement = document.getElementById('trialDaysLeft');
            if (daysElement) {
                const days = calculateTrialDaysLeft(user.created_at);
                daysElement.textContent = days;
                console.log('📅 Dias restantes:', days);
            }

            // Anexar evento aos botões
            const upgradeBtns = document.querySelectorAll('.btn-upgrade');
            console.log('🔘 Botões encontrados:', upgradeBtns.length);

            upgradeBtns.forEach(btn => {
                btn.addEventListener('click', handleUpgradeClick);
            });

        } catch (e) {
            console.error('❌ Erro no trial banner:', e);
        }
    }

    function calculateTrialDaysLeft(createdAt) {
        if (!createdAt) return 7;
        const start = new Date(createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - start);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const remaining = 7 - diffDays;
        return remaining > 0 ? remaining : 0;
    }

    function handleUpgradeClick(e) {
        e.preventDefault();
        console.log('🎯 Botão upgrade clicado');

        const btn = e.currentTarget;
        const originalText = btn.textContent;

        btn.textContent = 'Redirecionando...';
        btn.style.opacity = '0.7';
        btn.style.pointerEvents = 'none';

        // REDIRECIONAMENTO DIRETO - SEM API
        const KIWIFY_URL = 'https://pay.kiwify.com.br/cMd4tVk';

        // Pegar email do token
        const token = localStorage.getItem('token');
        let userEmail = '';

        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                userEmail = payload.email || '';
                console.log('📧 Email:', userEmail);
            } catch (e) {
                console.warn('⚠️ Erro ao decodificar token:', e);
            }
        }

        // Montar URL final
        const finalUrl = userEmail
            ? `${KIWIFY_URL}?email=${encodeURIComponent(userEmail)}`
            : KIWIFY_URL;

        console.log('🚀 Redirecionando para:', finalUrl);

        // Aguardar 300ms e redirecionar
        setTimeout(function() {
            window.location.href = finalUrl;
        }, 300);
    }

})();
