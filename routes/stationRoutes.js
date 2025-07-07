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

// --- KNN / Nearest stations route ---

// Haversine formula to calculate distance between two lat/lon points
function haversine(lat1, lon1, lat2, lon2) {
  const toRad = angle => (angle * Math.PI) / 180;
  const R = 6371; // Radius of Earth in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in km
}

// POST /nearest — find k nearest stations given user location
router.post('/nearest', async (req, res) => {
  const { lat, lon, k } = req.body;

  if (lat == null || lon == null) {
    return res.status(400).json({ message: 'lat and lon are required' });
  }

  try {
    // Get all stations from DB with bikes populated
    const stations = await Station.find().populate('bikes');

    // Calculate distance for each station from user location + count available bikes
    const stationsWithDistance = stations.map(station => ({
      id: station._id,
      name: station.name,
      latitude: station.latitude,
      longitude: station.longitude,
      capacity: station.capacity,
      availableBikes: station.bikes.filter(bike => bike.isAvailable).length,
      distance: haversine(lat, lon, station.latitude, station.longitude),
    }));

    // Sort by distance ascending
    stationsWithDistance.sort((a, b) => a.distance - b.distance);

    // Limit to top k stations (default 3)
    const nearestStations = stationsWithDistance.slice(0, k || 3);

    return res.json({ nearestStations });
  } catch (error) {
    console.error('Error fetching nearest stations:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
