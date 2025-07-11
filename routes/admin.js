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

// =======================
// Admin Registration
// =======================
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ username, passwordHash });
    await newAdmin.save();

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    console.error('Admin Registration Error:', error);
    res.status(500).json({ message: 'Failed to register admin' });
  }
});

// =======================
// Admin Login
// =======================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ adminId: admin._id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ message: 'Login error' });
  }
});

// =======================
// Middleware to verify Admin token
// =======================
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded; // Store decoded admin info
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Apply admin verification middleware to all routes below this line
router.use(verifyAdmin);

// =======================
// Admin Dashboard Summary
// =======================
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

// =======================
// View All Users
// =======================
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Fetch Users Error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// =======================
// Pending Users - Get all users waiting for verification
// =======================
router.get('/pending-users', async (req, res) => {
  try {
    const pendingUsers = await User.find({ isVerified: false, role: 'user' }).select('-password');
    res.json(pendingUsers);
  } catch (error) {
    console.error('Fetch Pending Users Error:', error);
    res.status(500).json({ message: 'Failed to fetch pending users' });
  }
});

// =======================
// Verify a User
// =======================
router.post('/verify-user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isVerified = true;
    await user.save();
    res.json({ message: `User ${user.username} verified.` });
  } catch (error) {
    console.error('Verify User Error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
});

// =======================
// Reject (Delete) a User
// =======================
router.delete('/reject-user/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User rejected and deleted.' });
  } catch (error) {
    console.error('Reject User Error:', error);
    res.status(500).json({ message: 'Deletion failed' });
  }
});

// =======================
// View All Bikes
// =======================
router.get('/bikes', async (req, res) => {
  try {
    const bikes = await Bike.find();
    res.json(bikes);
  } catch (error) {
    console.error('Fetch Bikes Error:', error);
    res.status(500).json({ message: 'Failed to fetch bikes' });
  }
});

// =======================
// Add New Bike
// =======================
router.post('/bikes', async (req, res) => {
  try {
    const { code, isAvailable, location, assignedStation } = req.body;

    if (!code || typeof location?.lat !== 'number' || typeof location?.lng !== 'number') {
      return res.status(400).json({ message: 'Bike code and valid location are required' });
    }

    const existing = await Bike.findOne({ code });
    if (existing) {
      return res.status(409).json({ message: 'Bike with this code already exists' });
    }

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

// =======================
// Delete Bike
// =======================
router.delete('/bikes/:bikeId', async (req, res) => {
  const { bikeId } = req.params;

  try {
    const bike = await Bike.findById(bikeId);
    if (!bike) return res.status(404).json({ message: 'Bike not found' });

    // Optional: add check if bike is on a ride before deletion

    await Bike.findByIdAndDelete(bikeId);
    res.json({ message: 'Bike deleted successfully' });
  } catch (error) {
    console.error('Delete Bike Error:', error);
    res.status(500).json({ message: 'Failed to delete bike' });
  }
});

// =======================
// View All Stations
// =======================
router.get('/stations', async (req, res) => {
  try {
    const stations = await Station.find();
    res.json(stations);
  } catch (error) {
    console.error('Fetch Stations Error:', error);
    res.status(500).json({ message: 'Failed to fetch stations' });
  }
});

// =======================
// Add New Station
// =======================
router.post('/stations', async (req, res) => {
  try {
    const { name, latitude, longitude, capacity } = req.body;

    if (!name || typeof latitude !== 'number' || typeof longitude !== 'number' || typeof capacity !== 'number') {
      return res.status(400).json({ message: 'All station fields are required and must be valid' });
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

// =======================
// Delete Station
// =======================
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
    console.error('Delete Station Error:', error);
    res.status(500).json({ message: 'Failed to delete station' });
  }
});

// =======================
// View All Rides
// =======================
router.get('/rides', async (req, res) => {
  try {
    const rides = await Ride.find()
      .populate('user bike startStation destinationStation');
    res.json(rides);
  } catch (error) {
    console.error('Fetch Rides Error:', error);
    res.status(500).json({ message: 'Failed to fetch rides' });
  }
});

module.exports = router;
