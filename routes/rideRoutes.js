const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const haversineDistance = require('../utils/distanceCalculator');

// ✅ Start a Ride with dummy eSewa payment
router.post('/start', async (req, res) => {
  console.log('Request body:', req.body);
  const {
    userId,
    bikeId,
    startLat,
    startLng,
    selectedDuration,   // Added
    estimatedCost       // Added
  } = req.body;

  if (!userId || !bikeId || startLat == null || startLng == null || !selectedDuration || !estimatedCost) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const ride = new Ride({
      user: userId,
      bike: bikeId,
      startLat,
      startLng,
      startTime: new Date(),
      status: 'ongoing',
      selectedDuration,
      estimatedCost,
      paymentStatus: 'pending', // 🔄 Initially pending
    });

    const savedRide = await ride.save();

    // 🧪 Simulate dummy eSewa payment success after 1 second
    setTimeout(async () => {
      savedRide.paymentStatus = 'paid';
      await savedRide.save();
      console.log(`✅ Dummy eSewa payment success for Ride ID: ${savedRide._id}`);
    }, 1000);

    res.status(201).json({
      message: 'Ride started. Dummy eSewa payment initiated.',
      rideId: savedRide._id,
      paymentStatus: ride.paymentStatus,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start ride', details: err.message });
  }
});

// ✅ End a Ride
router.post('/end', async (req, res) => {
  const { rideId, endLat, endLng } = req.body;

  if (!rideId || endLat == null || endLng == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.status !== 'ongoing') return res.status(400).json({ error: 'Ride already completed' });

    const distance = parseFloat(
      haversineDistance(
        ride.startLat,
        ride.startLng,
        parseFloat(endLat),
        parseFloat(endLng)
      )
    );

    ride.endLat = parseFloat(endLat);
    ride.endLng = parseFloat(endLng);
    ride.endTime = new Date();
    ride.distance = distance;
    ride.status = 'completed';

    await ride.save();

    res.json({
      message: 'Ride ended successfully',
      distance: `${distance} km`,
      ride
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to end ride', details: err.message });
  }
});

// ✅ Check ride payment status and details by rideId
router.get('/:rideId/status', async (req, res) => {
  const { rideId } = req.params;

  try {
    const ride = await Ride.findById(rideId).populate('bike');
    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    res.json({
      paymentStatus: ride.paymentStatus || 'pending',
      rideStatus: ride.status,
      bike: ride.bike,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ride status', details: err.message });
  }
});

module.exports = router;
