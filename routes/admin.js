const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Bike = require('../models/Bike');
const Ride = require('../models/Ride');
const Station = require('../models/Station');
const User = require('../models/user');
const Admin = require('../models/admin');

// 🔐 JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// ✅ Admin registration route (for one-time setup)
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newAdmin = new Admin({ username, passwordHash });
    await newAdmin.save();

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    console.error('Admin registration failed:', error);
    res.status(500).json({ message: 'Failed to register admin' });
  }
});

// ✅ Admin login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ adminId: admin._id }, JWT_SECRET, {
      expiresIn: '1d',
    });

    res.json({ token });
  } catch (error) {
    console.error('Admin login failed:', error);
    res.status(500).json({ message: 'Login error' });
  }
});

// 🔒 Auth middleware for protected admin routes
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded; // Attach admin info to request
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// 🟢 Protected Routes Below
router.use(verifyAdmin);

// 📊 Admin Summary
router.get('/summary', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBikes = await Bike.countDocuments();
    const totalStations = await Station.countDocuments();
    const totalRides = await Ride.countDocuments();
    const ongoingRides = await Ride.countDocuments({ status: 'ongoing' });
    const completedRides = await Ride.countDocuments({ status: 'completed' });

    const rides = await Ride.find({ status: 'completed' });
    const totalPenalty = rides.reduce((acc, ride) => acc + (ride.penaltyAmount || 0), 0);

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

// 👥 Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// 🚲 Get all bikes
router.get('/bikes', async (req, res) => {
  try {
    const bikes = await Bike.find();
    res.json(bikes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bikes' });
  }
});

// 🏬 Get all stations
router.get('/stations', async (req, res) => {
  try {
    const stations = await Station.find();
    res.json(stations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stations' });
  }
});

// 🚴‍♂️ Get all rides
router.get('/rides', async (req, res) => {
  try {
    const rides = await Ride.find().populate('user bike startStation destinationStation');
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch rides' });
  }
});

module.exports = router;
