const Ride = require('../models/Ride');
const Bike = require('../models/Bike');

const startRide = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { bikeId, startLat, startLng } = req.body;

    console.log('📥 Request body:', req.body);
    console.log('🔐 Authenticated userId:', userId);

    // Check missing fields
    const missingFields = [];
    if (!userId) missingFields.push('userId (from token)');
    if (!bikeId) missingFields.push('bikeId');
    if (startLat === undefined) missingFields.push('startLat');
    if (startLng === undefined) missingFields.push('startLng');

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields,
        received: req.body
      });
    }

    // Check bike availability
    const bike = await Bike.findById(bikeId);
    if (!bike || !bike.isAvailable) {
      return res.status(400).json({ message: 'Bike not available' });
    }

    // Mark bike as unavailable
    bike.isAvailable = false;
    await bike.save();

    // Create ride record
    const ride = await Ride.create({
      user: userId,
      bike: bikeId,
      startLat,
      startLng,
      status: 'ongoing',
      startTime: new Date()
    });

    return res.status(201).json({
      message: 'Ride started successfully',
      ride
    });
  } catch (error) {
    console.error('❌ Ride Start Error:', error);
    res.status(500).json({ message: 'Server error while starting ride' });
  }
};

module.exports = { startRide };
