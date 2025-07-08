const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bike: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bike',
    required: true
  },
  startLat: {
    type: Number,
    required: true
  },
  startLng: {
    type: Number,
    required: true
  },
  endLat: {
    type: Number
  },
  endLng: {
    type: Number
  },
  distance: {
    type: Number // distance in kilometers
  },
  selectedDuration: {
    type: Number, // in minutes
    required: true
  },
  estimatedCost: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['ongoing', 'completed'],
    default: 'ongoing'
  },

  // ✅ NEW FIELDS:
  penaltyAmount: {
    type: Number,
    default: 0
  },
  startStation: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Station'
  },
  penaltyReason: {
    type: String,
    default: ''
  },
  destinationStation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station'
  }
});

module.exports = mongoose.model('Ride', rideSchema);
