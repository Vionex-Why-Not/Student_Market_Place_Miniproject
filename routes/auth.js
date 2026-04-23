const router = require("express").Router();
const ctrl   = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// ── Student auth (frontend calls /api/register and /api/login) ───────────────
router.post("/api/register",       ctrl.register);
router.post("/api/login",          ctrl.login);

// ── Admin auth (frontend calls /admin/register and /admin/login) ─────────────
router.post("/admin/register",     ctrl.adminRegister);
router.post("/admin/login",        ctrl.adminLogin);

// ── Profile update ────────────────────────────────────────────────────────────
router.put("/api/profile",  protect, ctrl.updateProfile);

module.exports = router;
