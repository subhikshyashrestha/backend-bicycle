const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const Station = require('../models/Station');
const haversineDistance = require('../utils/distanceCalculator');

// ✅ Start a Ride with dummy eSewa payment simulation
router.post('/start', async (req, res) => {
  console.log('📥 Ride Start Request:', req.body);

  const {
    userId,
    bikeId,
    startStationId,
    destinationStationId,
    selectedDuration,
    estimatedCost
  } = req.body;

  // 🧠 Validate required fields
  const missingFields = [];
  if (!userId) missingFields.push('userId');
  if (!bikeId) missingFields.push('bikeId');
  if (!startStationId) missingFields.push('startStationId');
  if (!destinationStationId) missingFields.push('destinationStationId');
  if (!selectedDuration) missingFields.push('selectedDuration');
  if (!estimatedCost) missingFields.push('estimatedCost');

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: 'Missing required fields',
      missingFields
    });
  }

  try {
    // 📍 Get coordinates from start station
    const startStation = await Station.findById(startStationId);
    if (!startStation) {
      return res.status(404).json({ error: 'Start station not found' });
    }

    // 📝 Create a new Ride document
    const ride = new Ride({
      user: userId,
      bike: bikeId,
      startLat: startStation.latitude,
      startLng: startStation.longitude,
      destinationStation: destinationStationId,
      startTime: new Date(),
      selectedDuration,
      estimatedCost,
      status: 'ongoing',
      paymentStatus: 'pending',
    });

    const savedRide = await ride.save();

    // 🧪 Simulate eSewa success after 1s
    setTimeout(async () => {
      try {
        savedRide.paymentStatus = 'paid';
        await savedRide.save();
        console.log(`✅ Dummy eSewa payment confirmed for Ride ID: ${savedRide._id}`);
      } catch (err) {
        console.error('❌ Failed to simulate payment:', err.message);
      }
    }, 1000);

    // ⏱️ Estimate ride end time
    const estimatedEndTime = new Date(Date.now() + selectedDuration * 60000);

    // 📤 Respond immediately with ride info
    return res.status(201).json({
      message: 'Ride started. Dummy eSewa payment initiated.',
      rideId: savedRide._id,
      paymentStatus: savedRide.paymentStatus,
      rideEndTime: estimatedEndTime,
    });
  } catch (err) {
    console.error('❌ Ride Start Error:', err);
    return res.status(500).json({
      error: 'Failed to start ride',
      details: err.message,
    });
  }
});

module.exports = router;
