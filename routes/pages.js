const router = require("express").Router();

// Each route simply renders the matching EJS file.
// The EJS views call the API endpoints via fetch() on the client side
// (same pattern as the original project — no server-side data injection needed
//  because all data loads are already done in the original JS files).

router.get("/",            (_req, res) => res.render("index",       { title: "Home — StudXchange" }));
router.get("/marketplace", (_req, res) => res.render("marketplace", { title: "Marketplace — StudXchange" }));
router.get("/buy",         (_req, res) => res.render("buy",         { title: "Product Details — StudXchange" }));
router.get("/sell",        (_req, res) => res.render("sell",        { title: "Sell Item — StudXchange" }));
router.get("/rent",        (_req, res) => res.render("rent",        { title: "List for Rent — StudXchange" }));
router.get("/rentpage",    (_req, res) => res.render("rentpage",    { title: "Rent & Borrow — StudXchange" }));
router.get("/chat",        (_req, res) => res.render("chat",        { title: "Messages — StudXchange" }));
router.get("/committee",   (_req, res) => res.render("committee",   { title: "Committee Hub — StudXchange" }));
router.get("/myprofile",   (_req, res) => res.render("myprofile",   { title: "My Profile — StudXchange" }));
router.get("/login",       (_req, res) => res.render("login",       { title: "Sign In — StudXchange" }));
router.get("/admin",       (_req, res) => res.render("admin",       { title: "Admin Portal — StudXchange" }));

// Legacy .html redirects so old bookmarks / links still work
const redir = (to) => (_req, res) => res.redirect(301, to);
router.get("/index.html",       redir("/"));
router.get("/marketplace.html", redir("/marketplace"));
router.get("/buy.html",         redir("/buy"));
router.get("/sell.html",        redir("/sell"));
router.get("/rent.html",        redir("/rent"));
router.get("/rentpage.html",    redir("/rentpage"));
router.get("/chat.html",        redir("/chat"));
router.get("/committee.html",   redir("/committee"));
router.get("/myprofile.html",   redir("/myprofile"));
router.get("/Login.html",       redir("/login"));
router.get("/Adminlogin.html",  redir("/admin"));

module.exports = router;
