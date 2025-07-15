const Stripe = require('stripe');

console.log("🔐 Stripe Key from .env:", process.env.STRIPE_SECRET_KEY); // Debugging

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("❌ STRIPE_SECRET_KEY is missing from .env");
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
module.exports = stripe;
