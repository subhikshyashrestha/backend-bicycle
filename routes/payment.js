const express = require('express');
const router = express.Router();
const { createOrder, capturePayment } = require('../controllers/paypalController');

router.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body; // get amount from frontend
    const order = await createOrder(amount);
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.post('/capture-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    const captureData = await capturePayment(orderId);
    res.json(captureData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to capture payment' });
  }
});

module.exports = router;
