const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  capacity: {
    type: Number,
    default: 10,
  },
  bikes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bike', // 👈 Reference to the Bike model
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Station', stationSchema);
