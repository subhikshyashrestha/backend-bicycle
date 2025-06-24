const express = require('express');
const router = express.Router();
const haversineDistance = require('../utils/distanceCalculator');

// GET /api/v1/distance
router.get('/distance', (req, res) => {
  const { startLat, startLng, endLat, endLng } = req.query;

  // Validation
  if (!startLat || !startLng || !endLat || !endLng) {
    return res.status(400).json({ error: 'Missing coordinates' });
  }

  const distance = haversineDistance(
    parseFloat(startLat),
    parseFloat(startLng),
    parseFloat(endLat),
    parseFloat(endLng)
  );

  res.json({
    start: { lat: startLat, lng: startLng },
    end: { lat: endLat, lng: endLng },
    distance: `${distance} km`,
  });
});

module.exports = router;