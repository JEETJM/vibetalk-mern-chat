const express = require("express");
const Status = require("../models/Status");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

router.post("/", protect, upload.single("file"), async (req, res) => {
  try {
    const { text } = req.body;

    let mediaUrl = "";
    let mediaType = "";

    if (req.file) {
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

      const result = await cloudinary.uploader.upload(base64, {
        folder: "vibetalk-status",
        resource_type: "auto"
      });

      mediaUrl = result.secure_url;
      mediaType = req.file.mimetype;
    }

    if (!mediaUrl && !text) {
      return res.status(400).json({ message: "Status text or file required" });
    }

    const status = await Status.create({
      user: req.user._id,
      text: text || "",
      mediaUrl,
      mediaType,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const populated = await status.populate("user", "name profilePic");

    res.status(201).json(populated);
  } catch (error) {
    console.log("STATUS CREATE ERROR:", error);
    res.status(500).json({ message: error.message || "Create status failed" });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    const statuses = await Status.find({
      expiresAt: { $gt: new Date() }
    })
      .populate("user", "name profilePic")
      .sort({ createdAt: -1 });

    res.json(statuses);
  } catch (error) {
    res.status(500).json({ message: "Fetch status failed" });
  }
});

router.put("/view/:id", protect, async (req, res) => {
  try {
    const status = await Status.findByIdAndUpdate(
      req.params.id,
      {
        $addToSet: {
          viewers: {
            user: req.user._id,
            viewedAt: new Date()
          }
        }
      },
      { new: true }
    );

    res.json(status);
  } catch (error) {
    res.status(500).json({ message: "View update failed" });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);

    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    if (String(status.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can delete only your own status" });
    }

    await Status.findByIdAndDelete(req.params.id);

    res.json({ message: "Status deleted", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: "Delete status failed" });
  }
});

module.exports = router;