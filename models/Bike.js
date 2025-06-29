// models/Bike.js
const mongoose = require('mongoose');

const bikeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  isAvailable: { type: Boolean, default: true },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
  unlockOtp: Number,
  otpGeneratedAt: Date,
  availableInMinutes: Number,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedStation: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', default: null },  // Add this line
});

module.exports = mongoose.model('Bike', bikeSchema);
