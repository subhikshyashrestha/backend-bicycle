
const jwt = require("jsonwebtoken");

// Middleware to verify JWT token from Authorization header
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Check if Authorization header exists and starts with Bearer
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header missing or invalid" });
  }

  // 2. Extract the token
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token not found" });
  }

  try {
    // 3. Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach decoded user info to the request
    req.user = decoded; // Contains user id and role
    console.log("✅ Token verified. Decoded user:", req.user);

    next(); // Proceed to next middleware/route
  } catch (err) {
    console.error("❌ Token verification error:", err.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = verifyToken;
