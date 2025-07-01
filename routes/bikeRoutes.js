const express = require('express');
const router = express.Router();
const Bike = require('../models/Bike');

// ✅ GET all bikes
router.get('/', async (req, res) => {
  try {
    const bikes = await Bike.find();
    res.json(bikes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bikes' });
  }
});

// 🔁 Seed route to store all bikes
router.get('/seed', async (req, res) => {
  try {
    const sampleBikes = [
      { code: 'S1', isAvailable: true, location: { lat: 27.685353, lng: 85.307080 } },
      { code: 'S2', isAvailable: false, location: { lat: 27.685400, lng: 85.307100 }, availableInMinutes: 4 },
      { code: 'S3', isAvailable: true, location: { lat: 27.685400, lng: 85.307100 } },
      { code: 'P1', isAvailable: true, location: { lat: 27.679600, lng: 85.319458 } },
      { code: 'P2', isAvailable: true, location: { lat: 27.679650, lng: 85.319500 } },
      { code: 'P3', isAvailable: true, location: { lat: 27.679650, lng: 85.319500 } },
      { code: 'J1', isAvailable: true, location: { lat: 27.673389, lng: 85.312648 } },
      { code: 'J2', isAvailable: false, location: { lat: 27.673450, lng: 85.312700 }, availableInMinutes: 6 },
      { code: 'J3', isAvailable: true, location: { lat: 27.673450, lng: 85.312700 } },
    ];

    await Bike.deleteMany();
    await Bike.insertMany(sampleBikes);

    res.json({ message: 'All frontend bikes seeded!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Seeding failed' });
  }
});

// ✅ POST: Create a new bike
router.post('/', async (req, res) => {
  const { code, isAvailable, location, availableInMinutes, assignedTo } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Bike code is required' });
  }

  const bike = new Bike({
    code,
    isAvailable: isAvailable !== undefined ? isAvailable : true,
    location: location || { lat: 0, lng: 0 },
    availableInMinutes: availableInMinutes || null,
    assignedTo: assignedTo || null,
  });

  try {
    const savedBike = await bike.save();
    res.status(201).json(savedBike);
  } catch (error) {
    res.status(500).json({ message: 'Error saving bike', error: error.message });
  }
});

// 🔐 Generate OTP and emit it via WebSocket, respond with OTP included
router.post('/generate-otp', async (req, res) => {
  try {
    const { bikeCode, userId } = req.body;
    const bike = await Bike.findOne({ code: bikeCode });

    if (!bike) return res.status(404).json({ message: 'Bike not found' });
    if (!bike.isAvailable) return res.status(400).json({ message: 'Bike is not available' });

    const now = new Date();
    const otpAgeSeconds = bike.otpGeneratedAt ? (now - bike.otpGeneratedAt) / 1000 : Infinity;

    // Regenerate OTP only if missing or expired (older than 90 sec)
    if (!bike.unlockOtp || otpAgeSeconds > 90) {
      bike.unlockOtp = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
      bike.otpGeneratedAt = now;
      await bike.save();
    }

    // Emit OTP via socket.io if available and userId provided
    const io = req.app.get('io');
    if (io && userId) {
      io.to(userId).emit('otp', {
        otp: bike.unlockOtp,
        bikeCode: bike.code,
      });
      console.log(`OTP emitted to user ${userId}: ${bike.unlockOtp}`);
    }

    // Respond with message and OTP
    res.status(200).json({
      message: 'OTP generated',
      otp: bike.unlockOtp,
    });
  } catch (error) {
    console.error('OTP generation error:', error);
    res.status(500).json({ message: 'Failed to generate OTP' });
  }
});

// ✅ Verify OTP and unlock bike
router.post('/verify-otp', async (req, res) => {
  try {
    const { code, otp } = req.body;
    const bike = await Bike.findOne({ code });

    if (!bike) return res.status(404).json({ message: 'Bike not found' });

    const now = new Date();
    const otpAgeSeconds = bike.otpGeneratedAt ? (now - bike.otpGeneratedAt) / 1000 : Infinity;

    // Check OTP validity and expiration
    if (
      !bike.unlockOtp ||
      bike.unlockOtp.toString() !== otp ||
      otpAgeSeconds > 90
    ) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // OTP is valid: unlock bike and reset OTP info
    bike.unlockOtp = null;
    bike.otpGeneratedAt = null;
    bike.isAvailable = false;
    await bike.save();

    res.json({
      message: 'OTP verified. Bike unlocked!',
      success: true,
      refreshBikes: true,
    });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

module.exports = router;
