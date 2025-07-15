const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

// ✅ REGISTER CONTROLLER
const register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      phone,
      role,
      citizenshipNumber,
      citizenshipImage, // ✅ This is the Cloudinary URL sent from the route
    } = req.body;

    // Check required fields
    if (!citizenshipImage) {
      return res.status(400).json({ message: "Citizenship image is required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      phone,
      role,
      citizenshipNumber,
      citizenshipImage, // ✅ Save Cloudinary URL
      isVerified: false,
    });

    await newUser.save();

    res.status(201).json({
      message: `User registered with username ${username}, pending verification.`,
    });
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ✅ LOGIN CONTROLLER
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Step 1: Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: `User with username ${username} not found` });
    }

    // Step 2: Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Step 3: Optional admin-only route check
    if (req.originalUrl.includes("/admin") && user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    // Step 4: Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Step 5: Return user info
    res.status(200).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        walletBalance: user.walletBalance || 0,
        totalRides: user.totalRides || 0,
        totalDistance: user.totalDistance || 0,
        membershipLevel: user.membershipLevel || "Basic",
        joinedDate: user.createdAt || null,
        citizenshipImage: user.citizenshipImage || null,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = {
  register,
  login,
};
