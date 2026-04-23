const router = require("express").Router();
const ctrl   = require("../controllers/chatController");
const { protect } = require("../middleware/auth");

// My listings (merged products + rent)
router.get("/my-listings/:user_id",   ctrl.getMyListings);
// My sale items and rent items separately
router.get("/my-sale-items/:user_id", ctrl.getMyListings);
router.get("/my-rent-items/:user_id", ctrl.getMyListings);

// Wishlist
router.post("/wishlist",              protect, ctrl.addToWishlist);
router.post("/add-to-wishlist",       protect, ctrl.addToWishlist);
router.get("/wishlist/:user_id",               ctrl.getWishlist);
router.delete("/wishlist",            protect, ctrl.removeFromWishlist);
router.delete("/remove-wishlist",     protect, ctrl.removeFromWishlist);

// Chat requests — buy flow
router.post("/send-chat-request",              protect, ctrl.sendChatRequest);
router.get("/chat-status/:sender/:receiver/:product",   ctrl.getChatStatus);
router.get("/get-requests/:seller_id",                  ctrl.getRequests);
router.post("/accept-chat",                    protect, ctrl.acceptChat);
router.post("/reject-chat",                    protect, ctrl.rejectChat);
router.get("/my-chats/:user_id",                        ctrl.getMyChats);

// Messages
router.get("/messages/:request_id",                     ctrl.getMessages);

// Rent requests
router.post("/send-rent-request",              protect, ctrl.sendRentRequest);
router.get("/my-rent-requests/:owner_id",               ctrl.getMyRentRequests);
router.get("/rent-request-status/:renter_id/:product_id", ctrl.getRentRequestStatus);
router.post("/accept-rent-request",            protect, ctrl.acceptRentRequest);
router.post("/reject-rent-request",            protect, ctrl.rejectRentRequest);

module.exports = router;
