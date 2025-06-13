const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "No token, authorization denied" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // Store user info in request
            console.log("The decoded user is:", req.user);
            next(); // Move to the next middleware or route
        } catch (err) {
            return res.status(400).json({ message: "Token is not valid" });
        }
    } else {
        return res.status(401).json({ message: "Authorization header missing or invalid" });
    }
};

module.exports = verifyToken;
 