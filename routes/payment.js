const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');

router.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'usd' } = req.body;

        // Stripe expects the amount in **cents**
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            payment_method_types: ['card'],
        });

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
