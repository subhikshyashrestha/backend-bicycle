const mongoose = require ('mongoose');

const bikeSchema = new mongoose.Schema({
    code : { type:String,
        required : true,
        unique: true
    },
    isAvailable: {
        type: Boolean,
        default: true

    },
    location: {
        lat:{type:Number},
        lng : {type:Number}

    },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref:'User',default:null}
});


module.exports = mongoose.model('Bike',bikeSchema);
