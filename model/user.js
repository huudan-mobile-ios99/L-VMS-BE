// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  customer_name: { type: String, required: true },
  customer_number: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  canview: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("users", userSchema);
