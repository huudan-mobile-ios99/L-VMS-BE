const express = require("express");
const router = express.Router();
const User = require("../model/user");

// Helper to generate code
function generateCode(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
// ✅ 1. List all users
router.get("/list", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// ✅ 2. Update user by ID
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;  // can update customer_name, number, canview etc.

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// ✅ 3. Delete user by ID
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// ✅ Create new user
router.post("/create", async (req, res) => {
  try {
    const { customer_name, customer_number, canview } = req.body;
    if (!customer_name || !customer_number) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const code = generateCode();
    const newUser = new User({ customer_name, customer_number, code, canview: canview || false });
    await newUser.save();

    res.status(201).json({ success: true, user: newUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ Get config by code (only if canview=true)
router.get("/config", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ success: false, message: "Code is required" });
    const user = await User.findOne({ code });
    if (!user) return res.status(404).json({ success: false, message: "Invalid code" });
    if (!user.canview) return res.status(403).json({ success: false, message: "Access denied" });
    res.json({
      success: true,
      streamUrl: "ws://192.168.101.169:3333/app/stream",
      player: "ovenplayer",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports=router;
