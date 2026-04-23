const {
  Committee, CommitteeMember, CommitteeEvent,
  EventRsvp, Announcement, GroupMessage, Notification,
} = require("../models/Community");
const User = require("../models/User");

// ── COMMITTEES ────────────────────────────────────────────────────────────────
exports.getCommittees = async (req, res, next) => {
  try {
    const committees = await Committee.find().sort({ createdAt: 1 }).lean();
    const withStats  = await Promise.all(committees.map(async c => ({
      ...c, id: c._id,
      member_count: await CommitteeMember.countDocuments({ committee: c._id, status: "approved" }),
      event_count:  await CommitteeEvent.countDocuments({ committee: c._id }),
      post_count:   await Announcement.countDocuments({ committee: c._id }),
    })));
    res.json(withStats);
  } catch (err) { next(err); }
};

exports.createCommittee = async (req, res, next) => {
  try {
    const { name, description, category, icon } = req.body;
    const c = await Committee.create({ name, description, category, icon, createdBy: req.user._id });
    res.status(201).json({ success: true, id: c._id });
  } catch (err) { next(err); }
};

exports.deleteCommittee = async (req, res, next) => {
  try {
    await Committee.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ── MEMBERSHIP ────────────────────────────────────────────────────────────────
exports.joinCommittee = async (req, res, next) => {
  try {
    await CommitteeMember.create({ committee: req.params.id, user: req.body.user_id, status: "pending" });
    res.json({ success: true });
  } catch (err) {
    if (err.code === 11000) return res.json({ success: false, error: "Already requested" });
    next(err);
  }
};

exports.getMembership = async (req, res, next) => {
  try {
    const m = await CommitteeMember.findOne({ committee: req.params.id, user: req.params.user_id });
    res.json({ status: m ? m.status : "none" });
  } catch (err) { next(err); }
};

exports.getMembers = async (req, res, next) => {
  try {
    const members = await CommitteeMember.find({ committee: req.params.id })
      .populate("user", "name email").sort({ status: 1, createdAt: 1 }).lean();
    res.json(members.map(m => ({ ...m, id: m._id, user_name: m.user?.name, user_email: m.user?.email, user_id: m.user?._id, requested_at: m.createdAt })));
  } catch (err) { next(err); }
};

exports.approveM = async (req, res, next) => {
  try {
    await CommitteeMember.findOneAndUpdate({ committee: req.params.id, user: req.params.user_id }, { status: "approved" });
    const c = await Committee.findById(req.params.id);
    await Notification.create({ user: req.params.user_id, icon: "✅", title: "Join Request Approved!", body: `You've been approved to join ${c?.name}.` });
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.rejectM = async (req, res, next) => {
  try {
    await CommitteeMember.findOneAndUpdate({ committee: req.params.id, user: req.params.user_id }, { status: "rejected" });
    const c = await Committee.findById(req.params.id);
    await Notification.create({ user: req.params.user_id, icon: "❌", title: "Join Request Rejected", body: `Your request to join ${c?.name} was not approved.` });
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.getPendingRequests = async (req, res, next) => {
  try {
    const rows = await CommitteeMember.find({ status: "pending" })
      .populate("user", "name email").populate("committee", "name icon").sort({ createdAt: -1 }).lean();
    res.json(rows.map(r => ({ ...r, id: r._id, user_name: r.user?.name, user_email: r.user?.email, user_id: r.user?._id, committee_id: r.committee?._id, committee_name: r.committee?.name, committee_icon: r.committee?.icon, requested_at: r.createdAt })));
  } catch (err) { next(err); }
};

exports.getMyCommittees = async (req, res, next) => {
  try {
    const ms = await CommitteeMember.find({ user: req.params.user_id, status: "approved" }).populate("committee").lean();
    res.json(ms.map(m => ({ ...m.committee, id: m.committee._id, my_status: "approved" })));
  } catch (err) { next(err); }
};

// ── EVENTS ────────────────────────────────────────────────────────────────────
exports.getAllEvents = async (req, res, next) => {
  try {
    const events = await CommitteeEvent.find().populate("committee", "name icon").sort({ eventDate: 1 }).lean();
    const result  = await Promise.all(events.map(async e => ({
      ...e, id: e._id, event_date: e.eventDate, max_participants: e.maxParticipants,
      committee_name: e.committee?.name, committee_icon: e.committee?.icon,
      committee_id:   e.committee?._id,
      registered_count: await EventRsvp.countDocuments({ event: e._id }),
    })));
    res.json(result);
  } catch (err) { next(err); }
};

exports.getCommitteeEvents = async (req, res, next) => {
  try {
    const events = await CommitteeEvent.find({ committee: req.params.committee_id }).sort({ eventDate: 1 }).lean();
    const result  = await Promise.all(events.map(async e => ({
      ...e, id: e._id, event_date: e.eventDate,
      registered_count: await EventRsvp.countDocuments({ event: e._id }),
    })));
    res.json(result);
  } catch (err) { next(err); }
};

exports.createEvent = async (req, res, next) => {
  try {
    const { committee_id, title, description, event_date, venue, max_participants } = req.body;
    const ev = await CommitteeEvent.create({ committee: committee_id, title, description, eventDate: event_date, venue, maxParticipants: max_participants || 0, createdBy: req.user._id });
    res.status(201).json({ success: true, id: ev._id });
  } catch (err) { next(err); }
};

exports.deleteEvent = async (req, res, next) => {
  try { await CommitteeEvent.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (err) { next(err); }
};

exports.rsvpEvent = async (req, res, next) => {
  try {
    await EventRsvp.create({ event: req.params.id, user: req.body.user_id });
    res.json({ success: true });
  } catch (err) {
    if (err.code === 11000) return res.json({ success: false, error: "Already registered" });
    next(err);
  }
};

exports.getRsvpStatus = async (req, res, next) => {
  try {
    const rsvp = await EventRsvp.findOne({ event: req.params.id, user: req.params.user_id });
    res.json({ rsvped: !!rsvp });
  } catch (err) { next(err); }
};

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────────────────
exports.getAnnouncements = async (req, res, next) => {
  try {
    const anns = await Announcement.find().populate("committee", "name icon").sort({ createdAt: -1 }).limit(100).lean();
    res.json(anns.map(a => ({ ...a, id: a._id, committee_id: a.committee?._id, committee_name: a.committee?.name, committee_icon: a.committee?.icon, created_at: a.createdAt })));
  } catch (err) { next(err); }
};

exports.getCommitteeAnnouncements = async (req, res, next) => {
  try {
    const anns = await Announcement.find({ committee: req.params.committee_id }).sort({ createdAt: -1 }).lean();
    res.json(anns.map(a => ({ ...a, id: a._id, created_at: a.createdAt })));
  } catch (err) { next(err); }
};

exports.createAnnouncement = async (req, res, next) => {
  try {
    const { committee_id, title, body, type } = req.body;
    const ann = await Announcement.create({ committee: committee_id, title, body, type, createdBy: req.user._id });
    const members = await CommitteeMember.find({ committee: committee_id, status: "approved" }).lean();
    const committee = await Committee.findById(committee_id);
    const notifs = members.filter(m => String(m.user) !== String(req.user._id)).map(m => ({
      user: m.user, icon: "📢", title: `New: ${title}`,
      body: `From ${committee?.name}: ${(body || "").slice(0, 80)}`,
    }));
    if (notifs.length) await Notification.insertMany(notifs);
    res.status(201).json({ success: true, id: ann._id });
  } catch (err) { next(err); }
};

exports.deleteAnnouncement = async (req, res, next) => {
  try { await Announcement.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (err) { next(err); }
};

// ── GROUP MESSAGES ────────────────────────────────────────────────────────────
exports.getGroupMessages = async (req, res, next) => {
  try {
    const msgs = await GroupMessage.find({ committee: req.params.id }).sort({ createdAt: 1 }).limit(200).lean();
    res.json(msgs.map(m => ({ ...m, id: m._id, sender_name: m.senderName, sent_at: m.createdAt, sender_id: m.sender })));
  } catch (err) { next(err); }
};

exports.postGroupMessage = async (req, res, next) => {
  try {
    const { sender_id, message } = req.body;
    const u   = await User.findById(sender_id).lean();
    const msg = await GroupMessage.create({ committee: req.params.id, sender: sender_id, senderName: u?.name || "Unknown", message });
    res.status(201).json({ success: true, id: msg._id });
  } catch (err) { next(err); }
};

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
exports.getNotifications = async (req, res, next) => {
  try {
    const notifs = await Notification.find({ user: req.params.user_id }).sort({ createdAt: -1 }).limit(50).lean();
    res.json(notifs.map(n => ({ ...n, id: n._id, is_read: n.isRead, created_at: n.createdAt })));
  } catch (err) { next(err); }
};

exports.markAllRead = async (req, res, next) => {
  try { await Notification.updateMany({ user: req.params.user_id }, { isRead: true }); res.json({ success: true }); }
  catch (err) { next(err); }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ user: req.params.user_id, isRead: false });
    res.json({ count });
  } catch (err) { next(err); }
};

exports.adminSendNotification = async (req, res, next) => {
  try {
    const { target, committee_id, icon, title, body } = req.body;
    let userIds = [];
    if (target === "all") {
      userIds = (await User.find({}, "_id").lean()).map(u => u._id).filter(id => String(id) !== String(req.user._id));
    } else if (target === "committee" && committee_id) {
      const members = await CommitteeMember.find({ committee: committee_id, status: "approved" }, "user").lean();
      userIds = members.map(m => m.user).filter(id => String(id) !== String(req.user._id));
    }
    if (userIds.length) await Notification.insertMany(userIds.map(uid => ({ user: uid, icon: icon || "🔔", title, body })));
    res.json({ success: true, count: userIds.length });
  } catch (err) { next(err); }
};
