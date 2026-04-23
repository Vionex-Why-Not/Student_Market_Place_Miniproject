const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title:         { type: String, required: true, trim: true },
  price:         { type: Number, required: true, min: 0 },
  category:      { type: String, default: "Other" },
  conditionType: { type: String, default: "Used" },
  description:   { type: String, default: "" },
  contact:       { type: String, default: "" },
  image:         { type: String, default: "" },
  imagePublicId: { type: String, default: "" },
  seller:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sellerName:    { type: String, default: "" },
  sellerEmail:   { type: String, default: "" },
}, { timestamps: true });

productSchema.index({ title: "text", description: "text", category: "text" });

module.exports = mongoose.model("Product", productSchema);
