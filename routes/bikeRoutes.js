const express = require('express');
const router = express.Router();
const Bike = require('../models/Bike');

// 🔁 Seed route to store all bikes
router.get('/seed', async (req, res) => {
  try {
    const sampleBikes = [
      // Sanepa
      {
        code: 'S1',
        isAvailable: true,
        location: { lat: 27.685353, lng: 85.307080 },
      },
      {
        code: 'S2',
        isAvailable: false,
        location: { lat: 27.685400, lng: 85.307100 },
        availableInMinutes: 4,
      },
      {
        code: 'S3',
        isAvailable: true,
        location: { lat: 27.685400, lng: 85.307100 },
      },
      // Pulchowk
      {
        code: 'P1',
        isAvailable: true,
        location: { lat: 27.679600, lng: 85.319458 },
      },
      {
        code: 'P2',
        isAvailable: true,
        location: { lat: 27.679650, lng: 85.319500 },
      },
      {
        code: 'P3',
        isAvailable: true,
        location: { lat: 27.679650, lng: 85.319500 },
      },
      // Jawalakhel
      {
        code: 'J1',
        isAvailable: true,
        location: { lat: 27.673389, lng: 85.312648 },
      },
      {
        code: 'J2',
        isAvailable: false,
        location: { lat: 27.673450, lng: 85.312700 },
        availableInMinutes: 6,
      },
      {
        code: 'J3',
        isAvailable: true,
        location: { lat: 27.673450, lng: 85.312700 },
      },
    ];

    await Bike.deleteMany();
    await Bike.insertMany(sampleBikes);

    res.json({ message: 'All frontend bikes seeded!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Seeding failed' });
  }
});

// POST create a new bike
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

// 🔐 Generate OTP using bike code (valid for 90 seconds)
router.get('/code/:code/otp', async (req, res) => {
  try {
    const { code } = req.params;
    const bike = await Bike.findOne({ code });

    if (!bike) return res.status(404).json({ message: 'Bike not found' });
    if (!bike.isAvailable) return res.status(400).json({ message: 'Bike is not available' });

    const now = new Date();
    const otpAgeSeconds = bike.otpGeneratedAt ? (now - bike.otpGeneratedAt) / 1000 : Infinity;

    if (!bike.unlockOtp || otpAgeSeconds > 90) {
      // Generate new OTP if none exists or expired
      bike.unlockOtp = Math.floor(1000 + Math.random() * 9000);
      bike.otpGeneratedAt = now;
      await bike.save();
    }

    res.json({ otp: bike.unlockOtp });
  } catch (error) {
    console.error('OTP generation error:', error);
    res.status(500).json({ message: 'Failed to generate OTP' });
  }
});

// ✅ Verify OTP
router.post('/code/:code/verify-otp', async (req, res) => {
  try {
    const { code } = req.params;
    const { otp } = req.body;

    const bike = await Bike.findOne({ code });

    if (!bike) return res.status(404).json({ message: 'Bike not found' });

    const now = new Date();
    const otpAgeSeconds = bike.otpGeneratedAt ? (now - bike.otpGeneratedAt) / 1000 : Infinity;

    if (
      !bike.unlockOtp ||
      bike.unlockOtp.toString() !== otp ||
      otpAgeSeconds > 90
    ) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // ✅ OTP is valid
    bike.unlockOtp = null;
    bike.otpGeneratedAt = null;
    await bike.save();

    res.json({ message: 'OTP verified. Bike unlocked!' });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

module.exports = router;
