const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const Station = require('../models/Station');
const Bike = require('../models/Bike');
const haversineDistance = require('../utils/distanceCalculator');
const turf = require('@turf/turf');

// 🗺️ Import Lalitpur boundary polygon (GeoJSON-style object)
const lalitpurPolygon = require('../utils/lalitpurPolygon.js');


// ✅ Start Ride with Dummy eSewa Simulation
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

  const missingFields = [];
  if (!userId) missingFields.push('userId');
  if (!bikeId) missingFields.push('bikeId');
  if (!startStationId) missingFields.push('startStationId');
  if (!destinationStationId) missingFields.push('destinationStationId');
  if (!selectedDuration) missingFields.push('selectedDuration');
  if (!estimatedCost) missingFields.push('estimatedCost');

  if (missingFields.length > 0) {
    return res.status(400).json({ error: 'Missing required fields', missingFields });
  }

  try {
    const startStation = await Station.findById(startStationId);
    if (!startStation) return res.status(404).json({ error: 'Start station not found' });

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

    // 🔁 Simulate eSewa confirmation after 1 second
    setTimeout(async () => {
      try {
        savedRide.paymentStatus = 'paid';
        await savedRide.save();
        console.log(`✅ Dummy eSewa payment confirmed for Ride ID: ${savedRide._id}`);
      } catch (err) {
        console.error('❌ Failed to simulate payment:', err.message);
      }
    }, 1000);

    const estimatedEndTime = new Date(Date.now() + selectedDuration * 60000);

    return res.status(201).json({
      message: 'Ride started. Dummy eSewa payment initiated.',
      rideId: savedRide._id,
      paymentStatus: savedRide.paymentStatus,
      rideEndTime: estimatedEndTime,
    });

  } catch (err) {
    console.error('❌ Ride Start Error:', err.message);
    return res.status(500).json({ error: 'Failed to start ride', details: err.message });
  }
});


// ✅ End Ride with Geofence & Penalty Logic
router.post('/end', async (req, res) => {
  const { rideId, userLocation } = req.body;

  if (!rideId || !userLocation || userLocation.latitude == null || userLocation.longitude == null) {
    return res.status(400).json({ error: 'Missing rideId or user location' });
  }

  try {
    const ride = await Ride.findById(rideId).populate('destinationStation');
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.status === 'completed') return res.status(400).json({ error: 'Ride already completed or ended previously.' });

    const endLat = parseFloat(userLocation.latitude);
    const endLng = parseFloat(userLocation.longitude);
    console.log('📍 User location:', userLocation);

    // 1️⃣ Near any station?
    const stations = await Station.find();
    const isNearAnyStation = stations.some(station => {
      const distKm = haversineDistance(endLat, endLng, station.latitude, station.longitude);
      return distKm <= 0.05; // 50 meters
    });

    // 2️⃣ Inside Lalitpur?
    let insideLalitpur = false;
    try {
      const userPoint = turf.point([endLng, endLat]);
      insideLalitpur = turf.booleanPointInPolygon(userPoint, lalitpurPolygon);
      console.log('🟢 Inside Lalitpur:', insideLalitpur);
    } catch (err) {
      console.error('❌ Turf polygon check failed:', err.message);
      return res.status(500).json({ error: 'Internal geofence validation failed' });
    }

    // 3️⃣ Apply Penalty Logic
    let penaltyAmount = 0;
    let penaltyReason = '';

    if (!insideLalitpur) {
      penaltyAmount = 100;
      penaltyReason = 'Outside operating zone (Lalitpur)';
    } else if (!isNearAnyStation) {
      penaltyAmount = 50;
      penaltyReason = 'Bike not returned to any station';
    }

    // 4️⃣ Update Ride
    const distanceCovered = haversineDistance(ride.startLat, ride.startLng, endLat, endLng);
    ride.endLat = endLat;
    ride.endLng = endLng;
    ride.endTime = new Date();
    ride.status = 'completed';
    ride.distance = distanceCovered;
    ride.penaltyAmount = penaltyAmount;
    ride.penaltyReason = penaltyReason;

    await ride.save();

    // 5️⃣ Mark Bike Available Again
    const bike = await Bike.findById(ride.bike);
    if (bike) {
      bike.isAvailable = true;
      await bike.save();
    }

    return res.json({
      message: 'Ride ended successfully',
      distance: `${distanceCovered.toFixed(2)} km`,
      finalFare: ride.estimatedCost + penaltyAmount,
      penaltyAmount,
      penaltyReason,
    });

  } catch (err) {
    console.error('❌ Error ending ride:', err.message);
    return res.status(500).json({ error: 'Failed to end ride', details: err.message });
  }
});
// 📊 Get summary of rides for a specific user
router.get('/user/:userId/summary', async (req, res) => {
  const { userId } = req.params;

  try {
    const rides = await Ride.find({ user: userId, status: 'completed' });

    const totalRides = rides.length;
    const totalDistance = rides.reduce((sum, ride) => sum + (ride.distance || 0), 0);
    const totalPenalty = rides.reduce((sum, ride) => sum + (ride.penaltyAmount || 0), 0);

    return res.status(200).json({
      userId,
      totalRides,
      totalDistance: `${totalDistance.toFixed(2)} km`,
      totalPenalty
    });
  } catch (err) {
    console.error('❌ Ride summary error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch user ride summary' });
  }
});


module.exports = router;
