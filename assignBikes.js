const mongoose = require('mongoose');
const Station = require('./models/Station'); // adjust path if needed
const Bike = require('./models/Bike');       // adjust path if needed
require('dotenv').config();                   // to load your DB connection URL

async function assignBikesToStations() {
  try {
    await mongoose.connect(process.env.DBURL);
    console.log('Connected to DB');

    const stations = await Station.find();

    for (const station of stations) {
      // Find 3 bikes NOT assigned to any station yet
      const unassignedBikes = await Bike.find({ assignedStation: null }).limit(3);

      if (unassignedBikes.length < 3) {
        console.log(`Not enough unassigned bikes for station ${station.name}`);
        continue; // skip if not enough bikes
      }

      for (const bike of unassignedBikes) {
        bike.assignedStation = station._id;                      // link bike to station
        bike.location = { lat: station.latitude, lng: station.longitude }; // set bike location to station location
        bike.isAvailable = true;                                 // make sure bike is available
        await bike.save();

        // Add bike id to station.bikes array if not already there
        if (!station.bikes.includes(bike._id)) {
          station.bikes.push(bike._id);
        }
      }

      await station.save();
      console.log(`Assigned 3 bikes to station ${station.name}`);
    }

    console.log('All done!');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

assignBikesToStations();
