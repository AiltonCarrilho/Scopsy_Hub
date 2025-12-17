const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticateRequest } = require('../middleware/auth');
const { getFromBoostspace, updateInBoostspace } = require('../services/database');
const logger = require('../config/logger');

// ===========================================
// 1. CRIAR SESSÃO DE CHECKOUT
// ===========================================
router.post('/create-checkout-session', authenticateRequest, async (req, res) => {
    try {
        const userId = req.user.userId;
        const users = await getFromBoostspace('users', { id: userId });
        const user = users[0];

        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

        // URL base do frontend
        const origin = req.headers.origin || 'http://localhost:5500';
        const priceId = process.env.STRIPE_PRICE_ID;

        logger.info('Iniciando Checkout Stripe', {
            userId,
            email: user.email,
            priceId: priceId ? '*******' + priceId.slice(-4) : 'UNDEFINED',
            origin
        });

        if (!priceId) {
            throw new Error('STRIPE_PRICE_ID não configurado no servidor');
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: user.email,
            client_reference_id: userId.toString(),
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${origin}/dashboard.html?session_id={CHECKOUT_SESSION_ID}&upgrade=success`,
            cancel_url: `${origin}/dashboard.html?upgrade=canceled`,
            metadata: {
                userId: userId.toString()
            }
        });

        res.json({ id: session.id, url: session.url });

    } catch (error) {
        logger.error('Erro detalhado do Stripe:', {
            message: error.message,
            type: error.type,
            code: error.code,
            param: error.param,
            stack: error.stack
        });

        // Retornar erro legível para o frontend
        const errorMessage = error.type === 'StripeInvalidRequestError'
            ? `Configuração inválida no Stripe: ${error.message}`
            : 'Erro ao processar pagamento';

        res.status(500).json({ error: errorMessage, details: error.message });
    }
});

// ===========================================
// 2. WEBHOOK (Recebe eventos do Stripe)
// ===========================================
// O middleware raw body já foi configurado no server.js para esta rota
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        logger.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            await handleCheckoutCompleted(session);
            break;
        // Adicionar outros eventos (invoice.payment_succeeded, etc.)
        default:
        // console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

async function handleCheckoutCompleted(session) {
    const userId = session.client_reference_id || session.metadata?.userId;

    if (userId) {
        logger.info(`✅ Pagamento confirmado para User ${userId}`);

        // Atualizar usuário para Premium
        try {
            await updateInBoostspace('users', { id: userId }, {
                plan: 'premium',
                subscription_status: 'active',
                updated_at: new Date().toISOString()
            });
            logger.info(`🚀 User ${userId} atualizado para PREMIUM`);
        } catch (e) {
            logger.error('Erro ao atualizar usuário após pagamento:', e);
        }
    } else {
        logger.warn('⚠️ Webhook recebido sem userId identificado');
    }
}

module.exports = router;
