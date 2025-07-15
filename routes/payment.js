const express = require('express');
const router = express.Router();
const paypalController = require('../controllers/paypalController');

// Just pass controller functions directly (they accept req, res)
router.post('/create-order', paypalController.createOrder);
router.post('/capture-order', paypalController.capturePayment);

module.exports = router;
