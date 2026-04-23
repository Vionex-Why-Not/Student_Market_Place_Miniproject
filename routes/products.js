const router = require("express").Router();
const pCtrl  = require("../controllers/productController");
const rCtrl  = require("../controllers/rentController");
const { protect } = require("../middleware/auth");
const { upload }  = require("../config/cloudinary");

// ── Products ──────────────────────────────────────────────────────────────────
router.get("/products",                        pCtrl.getProducts);
router.get("/product/:id",                     pCtrl.getProduct);
router.get("/my-products/:user_id",            pCtrl.getMyProducts);
router.post("/add-product",   protect, upload.single("image"), pCtrl.createProduct);
router.put("/update-product/:id", protect, upload.single("image"), pCtrl.updateProduct);
router.delete("/delete-product/:id",    protect, pCtrl.deleteProduct);
// Legacy compat (with user_id in path)
router.delete("/delete-product/:id/:user_id",  protect, pCtrl.deleteProduct);

// ── Rent Items ────────────────────────────────────────────────────────────────
router.get("/rent-products",                   rCtrl.getRentItems);
router.get("/rent-product/:id",                rCtrl.getRentItem);
router.get("/my-rent-items/:user_id",          rCtrl.getMyRentItems);
router.post("/add-rent",      protect, upload.single("image"), rCtrl.createRentItem);
router.put("/update-rent/:id", protect, upload.single("image"), rCtrl.updateRentItem);
router.delete("/delete-rent/:id",       protect, rCtrl.deleteRentItem);
router.delete("/delete-rent/:id/:user_id",     protect, rCtrl.deleteRentItem);

module.exports = router;
