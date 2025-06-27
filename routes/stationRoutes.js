const express = require('express');
const router = express.Router();
const Station = require('../models/Station');

// GET all stations
router.get('/', async (req, res) => {
  try {
    const stations = await Station.find();
    res.json(stations);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create a new station
router.post('/', async (req, res) => {
  const { name, latitude, longitude, capacity } = req.body;

  if (!name || !latitude || !longitude) {
    return res.status(400).json({ message: 'Please provide name, latitude, and longitude.' });
  }

  const station = new Station({
    name,
    latitude,
    longitude,
    capacity: capacity || 10,
  });

  try {
    const savedStation = await station.save();
    res.status(201).json(savedStation);
  } catch (err) {
    res.status(500).json({ message: 'Error saving station.' });
  }
});

module.exports = router;
