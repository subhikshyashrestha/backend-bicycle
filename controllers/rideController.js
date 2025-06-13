const Ride = require('../models/Ride');
const Bike = require('../models/Bike');

const startRide = async (req,res) => {
    try{
        const userId = req.user.id; //From token
        const { bikeId } = req.body;

        //check if bike exists and is available
        const bike = await Bike.findById(bikeId);
        if (!bike || !bike.isAvailable){
            return res.status(400).json({message : "Bike not available"});

        }

        //mark bike as unavailable
        bike.isAvailable = false;
        await bike.save();

        //create ride record
        const ride = await Ride.create({
            user : userId,
            bike : bikeId,
        });

        res.status(201).json({message:'Ride started',ride});
    


    }
    catch(error){
        console.error(error);
        res.status(500).json({message: 'Server error while starting ride'});

    }

};



const endRide = async (req,res) => {}


module.exports = { startRide};
