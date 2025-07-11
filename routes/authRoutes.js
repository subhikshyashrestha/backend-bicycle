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

// Use upload.single() middleware for the image field name 'citizenshipImage'
router.post('/register', upload.single('citizenshipImage'), authController.register);

module.exports = router;
