const mongoose = require("mongoose");

const rentItemSchema = new mongoose.Schema({
  title:         { type: String, required: true, trim: true },
  category:      { type: String, default: "Other" },
  description:   { type: String, default: "" },
  contact:       { type: String, default: "" },
  rentPerDay:    { type: Number, required: true, min: 0 },
  deposit:       { type: Number, default: 0 },
  image:         { type: String, default: "" },
  imagePublicId: { type: String, default: "" },
  isAvailable:   { type: Boolean, default: true },
  seller:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sellerName:    { type: String, default: "" },
  sellerEmail:   { type: String, default: "" },
}, { timestamps: true });

rentItemSchema.index({ title: "text", description: "text", category: "text" });

module.exports = mongoose.model("RentItem", rentItemSchema);
