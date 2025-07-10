
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Bike = require('../models/Bike');
const Ride = require('../models/Ride');
const Station = require('../models/Station');
const User = require('../models/user');
const Admin = require('../models/admin');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// ✅ Admin registration
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) return res.status(400).json({ message: 'Admin already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ username, passwordHash });
    await newAdmin.save();
    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to register admin' });
  }
});

// ✅ Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ adminId: admin._id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Login error' });
  }
});

// 🔐 Middleware to verify token
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

router.use(verifyAdmin);

// 📊 Admin dashboard summary
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
    res.status(500).json({ message: 'Failed to fetch admin summary' });
  }
});

// 👥 View all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// 🚲 View all bikes
router.get('/bikes', async (req, res) => {
  try {
    const bikes = await Bike.find();
    res.json(bikes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bikes' });
  }
});

// ✅ ➕ Add new bike
router.post('/bikes', async (req, res) => {
  try {
    const { code, isAvailable, location, assignedStation } = req.body;

    if (!code || !location?.lat || !location?.lng) {
      return res.status(400).json({ message: 'Code and valid location are required' });
    }

    const existing = await Bike.findOne({ code });
    if (existing) return res.status(409).json({ message: 'Bike with this code already exists' });

    const newBike = new Bike({
      code,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      location,
      assignedStation: assignedStation || null,
    });

    await newBike.save();
    res.status(201).json({ message: 'Bike created successfully', bike: newBike });
  } catch (error) {
    console.error('Add Bike Error:', error);
    res.status(500).json({ message: 'Failed to create bike' });
  }
});

// ❌ Delete bike
router.delete('/bikes/:bikeId', async (req, res) => {
  const { bikeId } = req.params;
  try {
    const bike = await Bike.findById(bikeId);
    if (!bike) return res.status(404).json({ message: 'Bike not found' });

    // Optional: Check if bike is currently assigned or on ride, you can add here.

    await Bike.findByIdAndDelete(bikeId);
    res.json({ message: 'Bike deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete bike' });
  }
});

// 🏬 View all stations
router.get('/stations', async (req, res) => {
  try {
    const stations = await Station.find();
    res.json(stations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stations' });
  }
});

// ✅ ➕ Add new station
router.post('/stations', async (req, res) => {
  try {
    const { name, latitude, longitude, capacity } = req.body;
    if (!name || !latitude || !longitude || !capacity) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await Station.findOne({ name });
    if (existing) {
      return res.status(409).json({ message: 'Station with this name already exists' });
    }

    const newStation = new Station({
      name,
      latitude,
      longitude,
      capacity,
      bikes: [],
    });

    await newStation.save();
    res.status(201).json({ message: 'Station added successfully', station: newStation });
  } catch (error) {
    console.error('Add Station Error:', error);
    res.status(500).json({ message: 'Failed to add station' });
  }
});

// ❌ Delete station
router.delete('/stations/:stationId', async (req, res) => {
  const { stationId } = req.params;
  try {
    const station = await Station.findById(stationId);
    if (!station) return res.status(404).json({ message: 'Station not found' });

    const assignedBikes = await Bike.find({ assignedStation: stationId });
    if (assignedBikes.length > 0) {
      return res.status(400).json({ message: 'Cannot delete: Station has assigned bikes' });
    }

    await Station.findByIdAndDelete(stationId);
    res.json({ message: 'Station deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete station' });
  }
});

// 🚴‍♂️ View all rides
router.get('/rides', async (req, res) => {
  try {
    const rides = await Ride.find().populate('user bike startStation destinationStation');
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch rides' });
  }
});

module.exports = router;


