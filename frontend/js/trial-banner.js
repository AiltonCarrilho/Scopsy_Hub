
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

    function handleUpgradeClick(e) {
        e.preventDefault();

        // Redirecionar diretamente para checkout Kiwify
        const KIWIFY_CHECKOUT = 'https://pay.kiwify.com.br/Q10ghYM';
        window.open(KIWIFY_CHECKOUT, '_blank');
    }
})();
