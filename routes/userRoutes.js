const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router = express.Router();

// only admin can access this router
router.get("/admin", verifyToken, authorizeRoles("admin"), (req, res) => {
    res.json({ message: "Welcome Admin" });
});

// both admin and user can access this router
router.get("/user", verifyToken, authorizeRoles("admin", "user"), (req, res) => {
    res.json({ message: "Welcome User" });
});

module.exports = router;
