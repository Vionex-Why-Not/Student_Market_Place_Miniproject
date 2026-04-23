const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role:     { type: String, enum: ["user", "admin"], default: "user" },
  phone:    { type: String, default: "" },
  college:  { type: String, default: "" },
  course:   { type: String, default: "" },
  location: { type: String, default: "" },
  bio:      { type: String, default: "" },
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.comparePassword = function (p) { return bcrypt.compare(p, this.password); };
userSchema.methods.toJSON = function () {
  const o = this.toObject(); delete o.password; return o;
};

module.exports = mongoose.model("User", userSchema);
