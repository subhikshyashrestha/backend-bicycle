const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const multer = require('multer');
const path = require('path');

// ✅ Configure multer storage for citizenship images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/citizenship');  // Folder must exist
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);  // Unique file name
  }
});

// ✅ Initialize multer middleware
const upload = multer({ storage });

// ✅ POST /register - Handle file + text input
router.post('/register', upload.single('citizenshipImage'), authController.register);

// ✅ POST /login
router.post('/login', authController.login);

module.exports = router;
