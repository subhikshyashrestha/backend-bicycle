const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const multer = require('multer');

// Configure multer storage for citizenship images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/citizenship');  // folder to store images
  },
  filename: (req, file, cb) => {
    // unique filename: timestamp + original name
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Register route with citizenship image upload
router.post('/register', upload.single('citizenshipImage'), authController.register);

// Add login route here
router.post('/login', authController.login);

module.exports = router;
