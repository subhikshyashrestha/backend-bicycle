// Dynamic import of node-fetch for ES Module compatibility
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const base64 = require('base-64');

// PayPal credentials from environment
const PAYPAL_CLIENT = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API = 'https://api-m.sandbox.paypal.com'; // sandbox endpoint

// ✅ Get PayPal access token
async function generateAccessToken() {
  const auth = base64.encode(`${PAYPAL_CLIENT}:${PAYPAL_SECRET}`);

  try {
    const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    console.log('🎟️ Access Token Response:', data);

    if (!response.ok) {
      throw new Error(data.error_description || 'Failed to get PayPal access token');
    }

    return data.access_token;
  } catch (error) {
    console.error('❌ Access Token Error:', error);
    throw error;
  }
}

// ✅ Create PayPal Order
exports.createOrder = async (req, res) => {
  try {
    const amount = req.body.amount;
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const accessToken = await generateAccessToken();

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        application_context: {
          return_url: 'https://zupito.com/payment-success',
          cancel_url: 'https://zupito.com/payment-cancel',
        },
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: amount,
            },
          },
        ],
      }),
    });

    const data = await response.json();
    console.log('📦 PayPal Create Order Response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create PayPal order');
    }

    res.json(data);
  } catch (error) {
    console.error('❌ Create Order Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Capture PayPal Payment
exports.capturePayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const accessToken = await generateAccessToken();

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('✅ Capture Payment Response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to capture PayPal payment');
    }

    res.json(data);
  } catch (error) {
    console.error('❌ Capture Payment Error:', error);
    res.status(500).json({ error: error.message });
  }
};
