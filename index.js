const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // ✅ Add CORS
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bikeRoutes = require('./routes/bikeRoutes');

dotenv.config();

const app = express();

// ✅ Middleware
app.use(cors());               // Enable CORS
app.use(express.json());       // Parse JSON bodies




// ✅ Health check routes
app.get('/api/ping', (req, res) => {
  res.status(200).json({ message: 'Backend is connected!' });
});

app.get('/api/healthcheck', (req, res) => {
  res.json({ status: 'Backend is reachable' });
});

// ✅ MongoDB connection
mongoose.connect(process.env.DBURL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ MongoDB connection error:", err));

// ✅ API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/bikes', bikeRoutes);

// (Optional) Dummy route test
app.post('/api/v1/auth/register', (req, res) => {
  console.log("Received dummy register request", req.body);
  res.status(200).json({ message: "Dummy register route hit" });
});

// ✅ Start the server
const port = process.env.PORT || 8000;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
});
