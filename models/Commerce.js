const mongoose = require("mongoose");

// ── Wishlist ──────────────────────────────────────────────────────────────────
const wishlistSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  itemId:   { type: mongoose.Schema.Types.ObjectId, required: true },
  itemType: { type: String, enum: ["product", "rent"], required: true },
}, { timestamps: true });
wishlistSchema.index({ user: 1, itemId: 1, itemType: 1 }, { unique: true });
const Wishlist = mongoose.model("Wishlist", wishlistSchema);

// ── Chat Request ──────────────────────────────────────────────────────────────
const chatRequestSchema = new mongoose.Schema({
  sender:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  product:     { type: mongoose.Schema.Types.ObjectId },
  status:      { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  requestType: { type: String, enum: ["buy", "rent"], default: "buy" },
  rentRequest: { type: mongoose.Schema.Types.ObjectId, ref: "RentRequest", default: null },
}, { timestamps: true });
const ChatRequest = mongoose.model("ChatRequest", chatRequestSchema);

// ── Message ───────────────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
  chatRequest: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRequest", required: true },
  sender:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderName:  { type: String, default: "" },
  receiver:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message:     { type: String, required: true },
}, { timestamps: true });
const Message = mongoose.model("Message", messageSchema);

// ── Rent Request ──────────────────────────────────────────────────────────────
const rentRequestSchema = new mongoose.Schema({
  renter:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rentItem:    { type: mongoose.Schema.Types.ObjectId, ref: "RentItem", required: true },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  totalCost:   { type: Number, default: 0 },
  message:     { type: String, default: "" },
  status:      { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  chatRequest: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRequest", default: null },
}, { timestamps: true });
const RentRequest = mongoose.model("RentRequest", rentRequestSchema);

module.exports = { Wishlist, ChatRequest, Message, RentRequest };
