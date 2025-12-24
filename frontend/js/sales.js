/**
 * sales.js
 * Handles interactions on the Sales/Landing page (p.vendas.html).
 * Manages redirects to signup and Stripe checkout initiation.
 */

document.addEventListener('DOMContentLoaded', () => {
    // API_URL vem do config.js (window.API_URL)
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

    // Premium Checkout Logic (Kiwify/Flexifunnels - em breve)
    if (btnPricingPremium) {
        btnPricingPremium.addEventListener('click', async (e) => {
            e.preventDefault();

            // TODO: Integrar com Kiwify/Flexifunnels
            alert('Pagamentos em breve! Por enquanto, crie sua conta grátis.');
            window.location.href = 'signup.html';
        });
    }

    function resetBtn(btn, text) {
        btn.textContent = text;
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
    }
});
