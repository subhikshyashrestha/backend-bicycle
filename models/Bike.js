// models/Bike.js
const mongoose = require('mongoose');

const bikeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  location: {
    lat: Number,
    lng: Number,
  },
  unlockOtp: {
    type: Number,
    default: null,
  },
  otpGeneratedAt: {
    type: Date,
    default: null,
  },
  availableInMinutes: {
    type: Number,
    default: null,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  assignedStation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    default: null,
  },
});

module.exports = mongoose.model('Bike', bikeSchema);
