const express = require("express");
const { register, login } = require("../controllers/authController");

const router = express.Router();

// Email-password routes
router.post("/register", register);
router.post("/login", login);

// Optional: Logout route if you handle sessions
// router.get("/logout", (req, res) => {
//   // Your logout logic here
// });

module.exports = router;
