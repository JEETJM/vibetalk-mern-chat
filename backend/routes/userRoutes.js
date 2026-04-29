const express = require("express");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id }
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.log("USERS FETCH ERROR:", error);
    res.status(500).json({ message: "Users fetch failed" });
  }
});

module.exports = router;