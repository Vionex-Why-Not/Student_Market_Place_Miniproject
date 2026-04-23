const router = require("express").Router();
const ctrl   = require("../controllers/communityController");
const { protect, adminOnly } = require("../middleware/auth");

// Committees
router.get("/committees",                                    ctrl.getCommittees);
router.post("/committees",               protect, adminOnly, ctrl.createCommittee);
router.delete("/committees/:id",         protect, adminOnly, ctrl.deleteCommittee);

// Membership
router.post("/committees/:id/join",                protect, ctrl.joinCommittee);
router.get("/committees/:id/membership/:user_id",           ctrl.getMembership);
router.get("/committees/:id/members",              protect, ctrl.getMembers);
router.post("/committees/:id/members/:user_id/approve", protect, adminOnly, ctrl.approveM);
router.post("/committees/:id/members/:user_id/reject",  protect, adminOnly, ctrl.rejectM);
// IMPORTANT: this exact path must come BEFORE /committees/:id/members/:uid routes
router.get("/committee-requests/pending",          protect, adminOnly, ctrl.getPendingRequests);
router.get("/my-committees/:user_id",                        ctrl.getMyCommittees);

// Events
router.get("/committee-events",                              ctrl.getAllEvents);
router.get("/committee-events/:committee_id/list",           ctrl.getCommitteeEvents);
router.post("/committee-events",         protect, adminOnly, ctrl.createEvent);
router.delete("/committee-events/:id",   protect, adminOnly, ctrl.deleteEvent);
router.post("/committee-events/:id/rsvp",          protect, ctrl.rsvpEvent);
router.get("/committee-events/:id/rsvp/:user_id",           ctrl.getRsvpStatus);

// Announcements
router.get("/announcements",                                 ctrl.getAnnouncements);
router.get("/announcements/:committee_id/list",              ctrl.getCommitteeAnnouncements);
router.post("/announcements",            protect, adminOnly, ctrl.createAnnouncement);
router.delete("/announcements/:id",      protect, adminOnly, ctrl.deleteAnnouncement);

// Group messages
router.get("/committees/:id/messages",                       ctrl.getGroupMessages);
router.post("/committees/:id/messages",            protect, ctrl.postGroupMessage);

// Notifications
router.get("/notifications/:user_id",                        ctrl.getNotifications);
router.post("/notifications/read-all/:user_id",    protect, ctrl.markAllRead);
router.get("/notifications/unread-count/:user_id",           ctrl.getUnreadCount);

// Admin broadcast notification
router.post("/admin/send-notification",  protect, adminOnly, ctrl.adminSendNotification);

module.exports = router;
