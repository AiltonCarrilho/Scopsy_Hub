
/**
 * trial-banner.js
 * Handles the display and logic of the trial warning banner across pages.
 */

(() => {
    // API_URL vem do config.js (window.API_URL)

    document.addEventListener('DOMContentLoaded', () => {
        initTrialBanner();
    });

    function initTrialBanner() {
        const userJson = localStorage.getItem('user');
        if (!userJson) return;

        try {
            const user = JSON.parse(userJson);

            // Only show for free plan users
            // Adjust condition based on your actual plan values (e.g. 'free', null, undefined)
            const isPremium = user.plan === 'premium' || user.plan === 'pro';
            if (isPremium) return;

            const banner = document.getElementById('trialBanner');
            if (!banner) return; // Banner HTML not present on page

            // Show banner
            banner.style.display = 'flex';

            // Update days
            const daysElement = document.getElementById('trialDaysLeft');
            if (daysElement) {
                const days = calculateTrialDaysLeft(user.created_at);
                daysElement.textContent = days;
            }

            // Attach Click Handler to Upgrade Button(s)
            const upgradeBtns = document.querySelectorAll('.btn-upgrade');
            upgradeBtns.forEach(btn => {
                btn.addEventListener('click', handleUpgradeClick);
            });

        } catch (e) {
            console.error('TrialBanner error:', e);
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

    async function handleUpgradeClick(e) {
        e.preventDefault();
        const btn = e.currentTarget;
        const originalText = btn.textContent;

        btn.textContent = 'Processando...';
        btn.style.opacity = '0.7';
        btn.style.pointerEvents = 'none';

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            const res = await fetch(`${API_URL}/api/payments/create-checkout-session`, {
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
                alert('Erro ao iniciar pagamento: ' + (data.error || 'Erro desconhecido'));
                resetBtn(btn, originalText);
            }
        } catch (err) {
            console.error('Erro de checkout:', err);
            alert('Erro de conexão com o sistema de pagamento.');
            resetBtn(btn, originalText);
        }
    }

    function resetBtn(btn, text) {
        btn.textContent = text;
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
    }
})();
