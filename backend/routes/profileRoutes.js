const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

const uploadToCloudinary = async (file, folder, resourceType = "auto") => {
  const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

  return await cloudinary.uploader.upload(base64, {
    folder,
    resource_type: resourceType
  });
};

router.put(
  "/me",
  protect,
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "wallpaper", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { name, about } = req.body;

      const updateData = {};

      if (name) updateData.name = name;
      if (about) updateData.about = about;

      if (req.files?.profilePic?.[0]) {
        const result = await uploadToCloudinary(
          req.files.profilePic[0],
          "whatsapp-clone-dp",
          "image"
        );
        updateData.profilePic = result.secure_url;
      }

      if (req.files?.wallpaper?.[0]) {
        const result = await uploadToCloudinary(
          req.files.wallpaper[0],
          "whatsapp-clone-wallpaper",
          "image"
        );
        updateData.wallpaper = result.secure_url;
      }

      const user = await User.findByIdAndUpdate(req.user._id, updateData, {
        new: true
      }).select("-password -chatLockPin");

      res.json(user);
    } catch (error) {
      console.log("PROFILE UPDATE ERROR:", error);
      res.status(500).json({ message: error.message || "Profile update failed" });
    }
  }
);

router.put("/chat-lock", protect, async (req, res) => {
  try {
    const { enabled, pin } = req.body;

    const updateData = {
      chatLocked: enabled
    };

    if (enabled) {
      if (!pin || pin.length < 4) {
        return res.status(400).json({ message: "Minimum 4 digit PIN required" });
      }

      updateData.chatLockPin = await bcrypt.hash(pin, 10);
    } else {
      updateData.chatLockPin = "";
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true
    }).select("-password -chatLockPin");

    res.json(user);
  } catch (error) {
    console.log("CHAT LOCK ERROR:", error);
    res.status(500).json({ message: error.message || "Chat lock update failed" });
  }
});

router.post("/unlock", protect, async (req, res) => {
  try {
    const { pin } = req.body;

    const user = await User.findById(req.user._id);

    if (!user.chatLocked) {
      return res.json({ unlocked: true });
    }

    const ok = await bcrypt.compare(pin, user.chatLockPin);

    if (!ok) {
      return res.status(400).json({ message: "Wrong PIN" });
    }

    res.json({ unlocked: true });
  } catch (error) {
    res.status(500).json({ message: "Unlock failed" });
  }
});

module.exports = router;