const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// ✅ Environment config
dotenv.config();

// ✅ Initialize app (Must come BEFORE using app)
const app = express();

// ✅ CORS setup (Safe and secure for production)
app.use(cors({
  origin: ['https://zupito-frontend.onrender.com'], // only allow frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// ✅ JSON parser middleware
app.use(express.json());

// ✅ Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bikeRoutes = require('./routes/bikeRoutes');
const utilityRoutes = require('./routes/utilityRoutes');
const rideRoutes = require('./routes/rideRoutes');
const stationRoutes = require('./routes/stationRoutes');

// ✅ MongoDB connection
mongoose.connect(process.env.DBURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.log("❌ MongoDB connection error:", err));

// ✅ Health check routes
app.get('/api/ping', (req, res) => {
  res.status(200).json({ message: 'Backend is connected!' });
});

app.get('/api/healthcheck', (req, res) => {
  res.json({ status: 'Backend is reachable' });
});

// ✅ Register API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/bikes', bikeRoutes);
app.use('/api/v1', utilityRoutes);
app.use('/api/v1/rides', rideRoutes);
app.use('/api/v1/stations', stationRoutes);

// ✅ Optional test route
app.post('/api/v1/auth/register', (req, res) => {
  console.log("Received dummy register request", req.body);
  res.status(200).json({ message: "Dummy register route hit" });
});

// ✅ Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
