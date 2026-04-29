const express = require("express");
const Message = require("../models/Message");
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

router.get("/:receiverId", protect, async (req, res) => {
  try {
    const messages = await Message.find({
      deletedFor: { $ne: req.user._id },
      $or: [
        { sender: req.user._id, receiver: req.params.receiverId },
        { sender: req.params.receiverId, receiver: req.user._id }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Messages fetch failed" });
  }
});

router.post("/", protect, upload.single("file"), async (req, res) => {
  try {
    const { receiver, text } = req.body;

    let fileUrl = "";
    let fileType = "";

    if (req.file) {
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

      const result = await cloudinary.uploader.upload(base64, {
        folder: "whatsapp-clone-files",
        resource_type: "auto"
      });

      fileUrl = result.secure_url;
      fileType = req.file.mimetype;
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver,
      text: text || "",
      fileUrl,
      fileType
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message || "Message send failed" });
  }
});

router.put("/edit/:messageId", protect, async (req, res) => {
  try {
    const { text } = req.body;

    const message = await Message.findById(req.params.messageId);

    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can edit only your own message" });
    }

    if (message.fileUrl) {
      return res.status(400).json({ message: "File message cannot be edited" });
    }

    message.text = text;
    message.isEdited = true;

    await message.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: "Edit failed" });
  }
});

router.put("/delete-for-me/:messageId", protect, async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      { $addToSet: { deletedFor: req.user._id } },
      { new: true }
    );

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: "Delete for me failed" });
  }
});

router.put("/delete-for-everyone/:messageId", protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only sender can delete for everyone" });
    }

    message.text = "This message was deleted";
    message.fileUrl = "";
    message.fileType = "";
    message.deletedForEveryone = true;

    await message.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: "Delete for everyone failed" });
  }
});

router.put("/read/:senderId", protect, async (req, res) => {
  try {
    await Message.updateMany(
      { sender: req.params.senderId, receiver: req.user._id },
      { isRead: true }
    );

    res.json({ message: "Read updated" });
  } catch (error) {
    res.status(500).json({ message: "Read update failed" });
  }
});

module.exports = router;