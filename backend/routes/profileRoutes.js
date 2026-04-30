const express = require("express");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

const uploadToCloudinary = async (file, folder) => {
  if (!file) return "";

  const base64 = `data:${file.mimetype};base64,${file.buffer.toString(
    "base64"
  )}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder,
    resource_type: "auto"
  });

  return result.secure_url;
};

router.put(
  "/update",
  protect,
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "wallpaper", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      console.log("PROFILE BODY:", req.body);
      console.log("PROFILE FILES:", req.files);

      const { name, about } = req.body;

      const updateData = {};

      if (name) updateData.name = name;
      if (about !== undefined) updateData.about = about;

      if (req.files?.profilePic?.[0]) {
        updateData.profilePic = await uploadToCloudinary(
          req.files.profilePic[0],
          "vibetalk-profile"
        );
      }

      if (req.files?.wallpaper?.[0]) {
        updateData.wallpaper = await uploadToCloudinary(
          req.files.wallpaper[0],
          "vibetalk-wallpaper"
        );
      }

      const user = await User.findByIdAndUpdate(req.user._id, updateData, {
        new: true
      }).select("-password");

      const token = req.headers.authorization?.split(" ")[1];

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        about: user.about || "",
        wallpaper: user.wallpaper || "",
        token
      });
    } catch (error) {
      console.log("PROFILE UPDATE ERROR:", error);
      res.status(500).json({
        message: error.message || "Profile update failed"
      });
    }
  }
);

module.exports = router;