const express = require('express');
const router = express.Router();
const Station = require('../models/Station');
const Bike = require('../models/Bike');

// GET all stations with their bikes populated
router.get('/', async (req, res) => {
  try {
    const stations = await Station.find().populate('bikes');
    res.json({ stations });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST create a new station
router.post('/', async (req, res) => {
  const { name, latitude, longitude, capacity } = req.body;

  if (!name || latitude === undefined || longitude === undefined) {
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
    res.status(500).json({ message: 'Error saving station.', error: err.message });
  }
});

// POST assign a bike to a station
router.post('/:stationId/add-bike/:bikeId', async (req, res) => {
  const { stationId, bikeId } = req.params;

  try {
    // Find the station by ID
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }

    // Update bike's station reference and location to station's lat/lng
    const bike = await Bike.findByIdAndUpdate(
      bikeId,
      {
        station: stationId,
        location: { lat: station.latitude, lng: station.longitude },
      },
      { new: true }
    );

    if (!bike) {
      return res.status(404).json({ message: 'Bike not found' });
    }

    // Add bike's ObjectId to the station's bikes array (avoids duplicates)
    await Station.findByIdAndUpdate(
      stationId,
      { $addToSet: { bikes: bike._id } }
    );

    // Fetch updated station with bikes populated to return in response
    const updatedStation = await Station.findById(stationId).populate('bikes');

    res.status(200).json({
      message: 'Bike added to station successfully',
      station: updatedStation,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to assign bike', error: err.message });
  }
});

// DELETE remove a bike from a station (without deleting bike itself)
router.delete('/:stationId/remove-bike/:bikeId', async (req, res) => {
  const { stationId, bikeId } = req.params;

  try {
    // Remove bikeId from station's bikes array
    const updatedStation = await Station.findByIdAndUpdate(
      stationId,
      { $pull: { bikes: bikeId } },
      { new: true }
    ).populate('bikes');

    if (!updatedStation) {
      return res.status(404).json({ message: 'Station not found' });
    }

    res.json({
      message: 'Bike removed from station successfully',
      station: updatedStation,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove bike', error: error.message });
  }
});

module.exports = router;
