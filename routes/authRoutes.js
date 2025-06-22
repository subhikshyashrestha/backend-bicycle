// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/test', (req, res) => {
  res.send('Auth route test successful');
});

// Register route
router.post('/register', authController.register);

// Login route
router.post('/login', authController.login);

module.exports = router;
