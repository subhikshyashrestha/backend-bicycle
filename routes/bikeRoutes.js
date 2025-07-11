const express = require('express');
const router = express.Router();
const Bike = require('../models/Bike');
const verifyToken = require('../middleware/authMiddleware'); // Added middleware import
const User = require('../models/user'); // Added User model to check isVerified

// ✅ GET all bikes with auto-unlock and countdown logic
router.get('/', async (req, res) => {
  try {
    const bikes = await Bike.find();
    const now = new Date();

    const updatedBikes = await Promise.all(
      bikes.map(async (bike) => {
        if (!bike.isAvailable && bike.autoUnlockAt && now > bike.autoUnlockAt) {
          // Unlock bike after 2 minutes
          bike.isAvailable = true;
          bike.autoUnlockAt = null;
          bike.availableInMinutes = 0;
          await bike.save();
        } else if (!bike.isAvailable && bike.autoUnlockAt) {
          // Update availableInMinutes countdown
          const diffMs = bike.autoUnlockAt - now;
          bike.availableInMinutes = diffMs > 0 ? Math.ceil(diffMs / 60000) : 0;
          await bike.save();
        } else {
          // Bike is available, no wait time
          bike.availableInMinutes = 0;
          await bike.save();
        }
        return bike;
      })
    );

    res.json(updatedBikes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bikes' });
  }
});

// ✅ GET bikes by assigned station ID (ONLY AVAILABLE BIKES)
router.get('/station/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    const bikes = await Bike.find({
      assignedStation: stationId,
      isAvailable: true, // ✅ Only show available bikes
    });

    console.log(`📍 Found ${bikes.length} available bikes for station ${stationId}`);
    res.json(bikes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bikes for station' });
  }
});

// 🔁 Seed route to store all bikes including new ones
router.get('/seed', async (req, res) => {
  try {
    const sampleBikes = [
      { code: 'S1', isAvailable: true, location: { lat: 27.685353, lng: 85.307080 }, assignedStation: '685e3618dd442896cc04bea1' },
      { code: 'S2', isAvailable: false, location: { lat: 27.685400, lng: 85.307100 }, availableInMinutes: 4, assignedStation: '685e3618dd442896cc04bea1' },
      { code: 'S3', isAvailable: true, location: { lat: 27.685400, lng: 85.307100 }, assignedStation: '685e3618dd442896cc04bea1' },
      { code: 'P1', isAvailable: true, location: { lat: 27.679600, lng: 85.319458 }, assignedStation: '685e716ef8c4edf40545021f' },
      { code: 'P2', isAvailable: true, location: { lat: 27.679650, lng: 85.319500 }, assignedStation: '685e716ef8c4edf40545021f' },
      { code: 'P3', isAvailable: true, location: { lat: 27.679650, lng: 85.319500 }, assignedStation: '685e716ef8c4edf40545021f' },
      { code: 'J1', isAvailable: true, location: { lat: 27.673389, lng: 85.312648 }, assignedStation: '685e70b6f8c4edf40545021d' },
      { code: 'J2', isAvailable: false, location: { lat: 27.673450, lng: 85.312700 }, availableInMinutes: 6, assignedStation: '685e70b6f8c4edf40545021d' },
      { code: 'J3', isAvailable: true, location: { lat: 27.673450, lng: 85.312700 }, assignedStation: '685e70b6f8c4edf40545021d' },
      { code: 'D1', isAvailable: true, location: { lat: 27.670000, lng: 85.320000 }, assignedStation: '6864f71330b38403c8a6476c' },
      { code: 'D2', isAvailable: true, location: { lat: 27.670010, lng: 85.320000 }, assignedStation: '6864f71330b38403c8a6476c' },
      { code: 'D3', isAvailable: true, location: { lat: 27.670020, lng: 85.320000 }, assignedStation: '6864f71330b38403c8a6476c' },
      { code: 'E1', isAvailable: true, location: { lat: 27.666872951079593, lng: 85.30955274795652 }, assignedStation: '6864f56230b38403c8a64767' },
      { code: 'E2', isAvailable: true, location: { lat: 27.666872951079593, lng: 85.30955274795652 }, assignedStation: '6864f56230b38403c8a64767' },
      { code: 'E3', isAvailable: true, location: { lat: 27.666872951079593, lng: 85.30955274795652 }, assignedStation: '6864f56230b38403c8a64767' },
    ];

    await Bike.deleteMany();
    await Bike.insertMany(sampleBikes);

    res.json({ message: 'All bikes seeded with new bikes included!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Seeding failed' });
  }
});

// ✅ POST: Create a new bike
router.post('/', async (req, res) => {
  const { code, isAvailable, location, availableInMinutes, assignedTo, assignedStation } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Bike code is required' });
  }

  const bike = new Bike({
    code,
    isAvailable: isAvailable !== undefined ? isAvailable : true,
    location: location || { lat: 0, lng: 0 },
    availableInMinutes: availableInMinutes || null,
    assignedTo: assignedTo || null,
    assignedStation: assignedStation || null,
  });

  try {
    const savedBike = await bike.save();
    res.status(201).json(savedBike);
  } catch (error) {
    res.status(500).json({ message: 'Error saving bike', error: error.message });
  }
});

// ✅ POST: Assign a bike to a station
router.post('/assign-bike-to-station', async (req, res) => {
  const { bikeCode, stationId } = req.body;

  try {
    const bike = await Bike.findOne({ code: bikeCode });
    if (!bike) return res.status(404).json({ message: 'Bike not found' });

    bike.assignedStation = stationId;
    await bike.save();

    res.json({ message: 'Bike assigned to station successfully', bike });
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign bike', error: error.message });
  }
});

// 🔐 Generate OTP and emit via WebSocket (Protected + verified user check)
router.post('/generate-otp', verifyToken, async (req, res) => {
  try {
    const { bikeCode } = req.body;
    const user = await User.findById(req.user.id);

    if (!user || !user.isVerified) {
      return res.status(403).json({ message: 'Only verified users can unlock bikes' });
    }

    const bike = await Bike.findOne({ code: bikeCode });

    if (!bike) return res.status(404).json({ message: 'Bike not found' });
    if (!bike.isAvailable) return res.status(400).json({ message: 'Bike is not available' });

    const now = new Date();
    const otpAgeSeconds = bike.otpGeneratedAt ? (now - bike.otpGeneratedAt) / 1000 : Infinity;

    if (!bike.unlockOtp || otpAgeSeconds > 90) {
      bike.unlockOtp = Math.floor(1000 + Math.random() * 9000);
      bike.otpGeneratedAt = now;
      await bike.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.to(req.user.id).emit('otp', {
        otp: bike.unlockOtp,
        bikeCode: bike.code,
      });
    }

    res.status(200).json({
      message: 'OTP generated',
      otp: bike.unlockOtp,
    });
  } catch (error) {
    console.error('OTP generation error:', error);
    res.status(500).json({ message: 'Failed to generate OTP' });
  }
});

// 🔐 Verify OTP and unlock bike (Protected)
router.post('/verify-otp', verifyToken, async (req, res) => {
  try {
    const { code, otp } = req.body;
    const user = await User.findById(req.user.id);

    if (!user || !user.isVerified) {
      return res.status(403).json({ message: 'Only verified users can verify OTP' });
    }

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

    bike.unlockOtp = null;
    bike.otpGeneratedAt = null;
    bike.isAvailable = false;
    bike.autoUnlockAt = new Date(Date.now() + 2 * 60 * 1000); // unlock in 2 mins
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
