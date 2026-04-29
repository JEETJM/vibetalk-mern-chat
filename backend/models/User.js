const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    profilePic: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
    },

    about: {
      type: String,
      default: "Hey there! I am using MERN Chat."
    },

    wallpaper: {
      type: String,
      default: ""
    },

    chatLocked: {
      type: Boolean,
      default: false
    },

    chatLockPin: {
      type: String,
      default: ""
    },

    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);