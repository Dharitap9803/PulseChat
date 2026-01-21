const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");
const asyncHandler = require("express-async-handler");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract token
      token = req.headers.authorization.split(" ")[1];

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request
      req.user = await User.findById(decoded.id).select("-password");

      // Extra safety check
      if (!req.user) {
        return res.status(401).json({
          message: "Not authorized, user not found",
        });
      }

      // Move to next middleware
      next();
      return;
    } catch (error) {
      // Token invalid / expired
      return res.status(401).json({
        message: "Not authorized, token failed",
      });
    }
  }

  // No token case
  return res.status(401).json({
    message: "Not authorized, no token",
  });
});

module.exports = { protect };
