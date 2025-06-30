const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// ✅ Import OTP Socket module
const { setupSocketServer, sendOtpToUser } = require('./otpSocketServer');

dotenv.config();

const app = express();
const server = http.createServer(app); // Needed for sockets

// ✅ Socket.IO setup
setupSocketServer(server);

// ✅ Middleware
app.use(cors({ origin: ['https://zupito-frontend.onrender.com'], credentials: true }));
app.use(express.json());

// ✅ MongoDB
mongoose.connect(process.env.DBURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ MongoDB connection error:", err));

// ✅ Routes (same as before)
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bikeRoutes = require('./routes/bikeRoutes');
const utilityRoutes = require('./routes/utilityRoutes');
const rideRoutes = require('./routes/rideRoutes');
const stationRoutes = require('./routes/stationRoutes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/bikes', bikeRoutes);
app.use('/api/v1', utilityRoutes);
app.use('/api/v1/rides', rideRoutes);
app.use('/api/v1/stations', stationRoutes);

// ✅ OTP API Route
app.post('/api/v1/otp/generate', (req, res) => {
  const { userId, bikeCode } = req.body;

  if (!userId || !bikeCode) {
    return res.status(400).json({ message: 'userId and bikeCode are required' });
  }

  const otp = sendOtpToUser(userId, bikeCode);
  if (!otp) {
    return res.status(404).json({ message: 'User not connected' });
  }

  res.json({ success: true });
});

// ✅ Server Start
const PORT = process.env.PORT || 8000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server + Socket.IO running on port ${PORT}`);
});
