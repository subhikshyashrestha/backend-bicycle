const dotenv = require('dotenv');
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');

const cors = require('cors');
const path = require('path');

const { setupSocketServer, sendOtpToUser } = require('./otpSocketServer');
const Bike = require('./models/Bike');

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ Setup Socket.IO and attach to app
const io = setupSocketServer(server);
app.set('io', io); // Now accessible in routes via req.app.get('io')

// ✅ Middleware
app.use(cors({
  origin: ['https://zupito-frontend.onrender.com'], // adjust for frontend domain
  credentials: true,
}));
app.use(express.json());

// ✅ Serve static files (for images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ MongoDB connection
mongoose.connect(process.env.DBURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true, 
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bikeRoutes = require('./routes/bikeRoutes');
const utilityRoutes = require('./routes/utilityRoutes');
const rideRoutes = require('./routes/rideRoutes');
const stationRoutes = require('./routes/stationRoutes');
const adminRoutes = require('./routes/admin'); // contains /pending-users
const paymentRoutes = require('./routes/payment');

// ✅ Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/bikes', bikeRoutes);
app.use('/api/v1', utilityRoutes);
app.use('/api/v1/rides', rideRoutes);
app.use('/api/v1/stations', stationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

// ✅ OTP Generation Route
app.post('/api/v1/otp/generate', async (req, res) => {
  const { userId, bikeCode } = req.body;

  if (!userId || !bikeCode) {
    return res.status(400).json({ message: 'userId and bikeCode are required' });
  }

  try {
    const bike = await Bike.findOne({ code: bikeCode });
    if (!bike || !bike.isAvailable) {
      return res.status(404).json({ message: 'Bike not found or unavailable' });
    }

    const otp = sendOtpToUser(userId, bikeCode); // Emits OTP via socket
    if (!otp) {
      return res.status(500).json({ message: 'User is not connected via socket' });
    }

    console.log(`✅ OTP emitted to user ${userId} for bike ${bikeCode}`);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ OTP generation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 8000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server + Socket.IO running on port ${PORT}`);
});
