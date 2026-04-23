const mongoose = require("mongoose");

// ── Committee ─────────────────────────────────────────────────────────────────
const committeeSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  category:    { type: String, default: "Other" },
  icon:        { type: String, default: "🏛️" },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
}, { timestamps: true });
const Committee = mongoose.model("Committee", committeeSchema);

// ── Committee Member ──────────────────────────────────────────────────────────
const cmSchema = new mongoose.Schema({
  committee: { type: mongoose.Schema.Types.ObjectId, ref: "Committee", required: true },
  user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status:    { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
}, { timestamps: true });
cmSchema.index({ committee: 1, user: 1 }, { unique: true });
const CommitteeMember = mongoose.model("CommitteeMember", cmSchema);

// ── Committee Event ───────────────────────────────────────────────────────────
const eventSchema = new mongoose.Schema({
  committee:       { type: mongoose.Schema.Types.ObjectId, ref: "Committee", required: true },
  title:           { type: String, required: true },
  description:     { type: String, default: "" },
  eventDate:       { type: Date },
  venue:           { type: String, default: "" },
  maxParticipants: { type: Number, default: 0 },
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
}, { timestamps: true });
const CommitteeEvent = mongoose.model("CommitteeEvent", eventSchema);

// ── Event RSVP ────────────────────────────────────────────────────────────────
const rsvpSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: "CommitteeEvent", required: true },
  user:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
rsvpSchema.index({ event: 1, user: 1 }, { unique: true });
const EventRsvp = mongoose.model("EventRsvp", rsvpSchema);

// ── Announcement ──────────────────────────────────────────────────────────────
const announcementSchema = new mongoose.Schema({
  committee: { type: mongoose.Schema.Types.ObjectId, ref: "Committee", required: true },
  title:     { type: String, required: true },
  body:      { type: String, default: "" },
  type:      { type: String, enum: ["info", "important", "event"], default: "info" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
}, { timestamps: true });
const Announcement = mongoose.model("Announcement", announcementSchema);

// ── Group Message ─────────────────────────────────────────────────────────────
const groupMsgSchema = new mongoose.Schema({
  committee:  { type: mongoose.Schema.Types.ObjectId, ref: "Committee", required: true },
  sender:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderName: { type: String, default: "" },
  message:    { type: String, required: true },
}, { timestamps: true });
const GroupMessage = mongoose.model("GroupMessage", groupMsgSchema);

// ── Notification ──────────────────────────────────────────────────────────────
const notifSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  icon:   { type: String, default: "🔔" },
  title:  { type: String, required: true },
  body:   { type: String, default: "" },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });
const Notification = mongoose.model("Notification", notifSchema);

module.exports = { Committee, CommitteeMember, CommitteeEvent, EventRsvp, Announcement, GroupMessage, Notification };
