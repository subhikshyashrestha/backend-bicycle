const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:true

    },

    bike:{
        type: mongoose.Schema.Types.ObjectId,
        ref: ' Bike',
        required: true

    },
    startTime: {
        type:Date,
        default: Date.now
    },
    endTime: {
        type:Date
    },
    status: {
        type: String,
        enum: ['ongoing','completed'],
        default: 'ongoing'
    }
});

module.exports = mongoose.model('Ride',rideSchema);