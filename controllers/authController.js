const User          = require("../models/User");
const Admin         = require("../models/Admin");
const { signToken } = require("../middleware/auth");

// Helper — always returns a plain object with BOTH _id and id set
function safeUser(doc, extraFields = {}) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.password;
  obj.id = String(obj._id);   // frontend uses user.id
  return { ...obj, ...extraFields };
}

// ── Student Register ──────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const domain = process.env.ALLOWED_EMAIL_DOMAIN || "vcet.edu.in";
    if (!email.toLowerCase().endsWith(`@${domain}`))
      return res.status(400).json({ success: false, message: `Only @${domain} email allowed` });

    const user  = await User.create({ name, email: email.toLowerCase(), password });
    const token = signToken(user._id, "user");
    res.status(201).json({ success: true, message: "Account created!", token, user: safeUser(user) });
  } catch (err) { next(err); }
};

// ── Student Login ─────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: "Incorrect email or password" });

    const token = signToken(user._id, "user");
    res.json({ success: true, message: "Login successful", token, user: safeUser(user) });
  } catch (err) { next(err); }
};

// ── Admin Register ────────────────────────────────────────────────────────────
exports.adminRegister = async (req, res, next) => {
  try {
    const { name, email, password, secret_key } = req.body;
    if (secret_key !== (process.env.ADMIN_SECRET_KEY || "STUDXCHANGE_ADMIN_2026"))
      return res.status(403).json({ success: false, error: "Invalid admin secret key" });
    if (!password || password.length < 8)
      return res.status(400).json({ success: false, error: "Password must be at least 8 characters" });

    await Admin.create({ name, email: email.toLowerCase(), password });
    res.status(201).json({ success: true, message: "Admin account created! You can now sign in." });
  } catch (err) { next(err); }
};

// ── Admin Login ───────────────────────────────────────────────────────────────
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+password");
    if (!admin || !(await admin.comparePassword(password)))
      return res.status(401).json({ success: false, error: "Invalid admin credentials" });

    const token = signToken(admin._id, "admin");
    const adminObj = safeUser(admin, { role: "admin", isAdmin: true });
    res.json({ success: true, token, admin: adminObj, user: adminObj });
  } catch (err) { next(err); }
};

// ── Update Profile ────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, college, course, location, bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, college, course, location, bio },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user: safeUser(user) });
  } catch (err) { next(err); }
};
