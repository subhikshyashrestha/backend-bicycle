const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const haversineDistance = require('../utils/distanceCalculator');

// ✅ Start a Ride
router.post('/start', async (req, res) => {
  console.log('Request body:', req.body); 
  const { userId, bikeId, startLat, startLng } = req.body;

  if (!userId || !bikeId || startLat == null || startLng == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const ride = new Ride({
      user: userId,
      bike: bikeId,
      startLat,
      startLng,
      startTime: new Date(),
      status: 'ongoing'
    });

    await ride.save();
    res.status(201).json({ message: 'Ride started', rideId: ride._id });
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

module.exports = router;
