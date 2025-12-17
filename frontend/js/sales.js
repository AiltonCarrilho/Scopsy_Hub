/**
 * sales.js
 * Handles interactions on the Sales/Landing page (p.vendas.html).
 * Manages redirects to signup and Stripe checkout initiation.
 */

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000'; // Adjust if deploying
    const token = localStorage.getItem('token');

    // Button References
    const btnHeroSignup = document.getElementById('btn-hero-signup');
    const btnPricingTrial = document.getElementById('btn-pricing-trial');
    const btnPricingPremium = document.getElementById('btn-pricing-premium');
    const btnBottomSignup = document.getElementById('btn-bottom-signup');

    // Helper: Redirect to Signup
    function goToSignup() {
        window.location.href = 'signup.html';
    }

    // Attach Signup Listeners (Redundant if href is set in HTML, but good for tracking/logic)
    if (btnHeroSignup) btnHeroSignup.addEventListener('click', goToSignup);
    if (btnPricingTrial) btnPricingTrial.addEventListener('click', goToSignup);
    if (btnBottomSignup) btnBottomSignup.addEventListener('click', goToSignup);

    // Premium Checkout Logic
    if (btnPricingPremium) {
        btnPricingPremium.addEventListener('click', async (e) => {
            e.preventDefault();

            // 1. Check Auth
            if (!token) {
                // Not logged in: Redirect to Signup (could pass ?plan=premium to handle auto-checkout later)
                // For now, simple redirect.
                // alert('Para assinar, crie sua conta gratuita primeiro.'); 
                window.location.href = 'signup.html';
                return;
            }

            // 2. Check Plan (Optional - if already premium, maybe redirect to dashboard?)
            try {
                const userJson = localStorage.getItem('user');
                if (userJson) {
                    const user = JSON.parse(userJson);
                    if (user.plan === 'premium') {
                        alert('Você já é Premium!');
                        window.location.href = 'dashboard.html';
                        return;
                    }
                }
            } catch (err) {
                console.error('Error checking user plan', err);
            }

            // 3. Initiate Checkout
            const originalText = btnPricingPremium.textContent;
            btnPricingPremium.textContent = 'Processando...';
            btnPricingPremium.style.opacity = '0.7';
            btnPricingPremium.style.pointerEvents = 'none';

            try {
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
                    resetBtn(btnPricingPremium, originalText);
                }
            } catch (err) {
                console.error('Checkout error:', err);
                alert('Erro de conexão. Tente novamente.');
                resetBtn(btnPricingPremium, originalText);
            }
        });
    }

    function resetBtn(btn, text) {
        btn.textContent = text;
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
    }
});
