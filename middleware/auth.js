const jwt   = require("jsonwebtoken");
const User  = require("../models/User");
const Admin = require("../models/Admin");

// Sign a token
const signToken = (id, role = "user") =>
  jwt.sign({ id, role }, process.env.JWT_SECRET || "dev_secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// Protect — requires valid JWT (from Authorization header or cookie)
const protect = async (req, res, next) => {
  let token =
    req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : req.cookies?.token;

  if (!token)
    return res.status(401).json({ success: false, error: "Not authenticated. Please log in." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    if (decoded.role === "admin") {
      req.user = await Admin.findById(decoded.id);
      if (req.user) req.user.role = "admin";
    } else {
      req.user = await User.findById(decoded.id);
    }
    if (!req.user) return res.status(401).json({ success: false, error: "User not found" });
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
};

// Admin only
const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin")
    return res.status(403).json({ success: false, error: "Admin access required" });
  next();
};

// Optional auth — attaches user if token exists, does NOT block
const optionalAuth = async (req, res, next) => {
  let token =
    req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : req.cookies?.token;
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    req.user = decoded.role === "admin"
      ? await Admin.findById(decoded.id)
      : await User.findById(decoded.id);
    if (req.user && decoded.role === "admin") req.user.role = "admin";
  } catch { /* silently ignore */ }
  next();
};

module.exports = { protect, adminOnly, optionalAuth, signToken };
