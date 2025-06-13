const express = require('express');
const router = express.Router();
const Bike = require('../models/Bike');
const verifyToken = require('../middleware/authMiddleware');

router.get('/',verifyToken,async (req,res)=>{
    try{
        const availableBikes = await Bike.find({ isAvailable:true});

        res.json(availableBikes);
    }
    catch (error){
        res.status(500).json({message:"Error fetching bikes"});
    }

    }
);

module.exports = router;