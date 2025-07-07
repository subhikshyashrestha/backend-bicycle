const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const Ride = require("../models/Ride");
const router = express.Router();

// ✅ Get ride history for a user
router.get("/:userId/rides", verifyToken, authorizeRoles("user", "admin"), async (req, res) => {
  const { userId } = req.params;

  // Prevent users from accessing others' data (unless admin)
  if (req.user.role !== "admin" && req.user.id !== userId) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const rides = await Ride.find({ user: userId })
      .populate("destinationStation", "name")
      .sort({ startTime: -1 });

    const formatted = rides.map((ride) => ({
      rideId: ride._id,
      startTime: ride.startTime,
      endTime: ride.endTime,
      distance: ride.distance,
      estimatedCost: ride.estimatedCost,
      penaltyAmount: ride.penaltyAmount || 0,
      penaltyReason: ride.penaltyReason || "",
      destinationStation: ride.destinationStation?.name || "Unknown",
      status: ride.status,
    }));

    return res.status(200).json({ rides: formatted });
  } catch (err) {
    console.error("❌ Error fetching ride history:", err.message);
    return res.status(500).json({ error: "Failed to fetch user rides" });
  }
});

module.exports = router;
