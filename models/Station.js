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
    type: Number,  // Number of bikes the station can hold
    default: 10,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Station', stationSchema);
    