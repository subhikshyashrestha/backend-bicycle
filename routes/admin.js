const express = require('express');
const router = express.Router();
const Bike = require('../models/Bike');
const Ride = require('../models/Ride');
const Station = require('../models/Station');
const User = require('../models/user'); // Only if you have a User model

// 🔐 Simple Admin Authentication Middleware
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123';

router.use((req, res, next) => {
  const token = req.headers.authorization;
  if (token === `Bearer ${ADMIN_SECRET}`) {
    next(); // continue
  } else {
    return res.status(403).json({ message: 'Forbidden: Invalid admin token' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBikes = await Bike.countDocuments();
    const totalStations = await Station.countDocuments();
    const totalRides = await Ride.countDocuments();
    const ongoingRides = await Ride.countDocuments({ status: 'ongoing' });
    const completedRides = await Ride.countDocuments({ status: 'completed' });

    const rides = await Ride.find({ status: 'completed' });
    const totalPenalty = rides.reduce((acc, ride) => acc + (ride.penalty || 0), 0);

    res.json({
      totalUsers,
      totalBikes,
      totalStations,
      totalRides,
      ongoingRides,
      completedRides,
      totalPenalty,
    });
  } catch (err) {
    console.error('Admin Summary Error:', err);
    res.status(500).json({ message: 'Failed to fetch admin summary' });
  }
});

// 🔍 Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password'); // remove password
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// 🔍 Get all bikes
router.get('/bikes', async (req, res) => {
  try {
    const bikes = await Bike.find();
    res.json(bikes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bikes' });
  }
});

// 🔍 Get all stations
router.get('/stations', async (req, res) => {
  try {
    const stations = await Station.find();
    res.json(stations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stations' });
  }
});

// 🔍 Get all rides
router.get('/rides', async (req, res) => {
  try {
    const rides = await Ride.find().populate('user bike startStation destinationStation');
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch rides' });
  }
});



// 🟢 We'll add API endpoints below step-by-step

module.exports = router;
