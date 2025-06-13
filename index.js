const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require("./routes/userRoutes");
const bikeRoutes = require('./routes/bikeRoutes');

dotenv.config();

const app = express();
app.use(express.json());

app.get('/api/ping', (req, res) => {
  res.status(200).json({ message: 'Backend is connected!' });
});

mongoose.connect(process.env.DBURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

// Remove session and passport middleware here

app.use('/api/auth', authRoutes);
app.use("/api/users", userRoutes);
app.use('/api/bikes', bikeRoutes);

app.get('/api/healthcheck', (req, res) => {
  res.json({ status: "Backend is reachable" });
});

const port = process.env.PORT || 8000;

app.listen(port, '0.0.0.0', () => {
  console.log("Server running on port " + port);
});
