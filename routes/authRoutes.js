const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/authController');
const cloudinary = require('../cloudinaryConfig');

// ✅ Use memory storage instead of disk
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ POST /register - upload image to Cloudinary and pass to controller
router.post('/register', upload.single('citizenshipImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Citizenship image is required.' });
    }

    // ✅ Upload buffer to Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'citizenship_images' },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error);
          return res.status(500).json({ message: 'Image upload failed.' });
        }

        // ✅ Call controller with image URL
        req.body.citizenshipImage = result.secure_url;
        await authController.register(req, res);
      }
    );

    // ✅ Send image buffer to Cloudinary stream
    stream.end(req.file.buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed.' });
  }
});

// ✅ POST /login
router.post('/login', authController.login);

module.exports = router;
