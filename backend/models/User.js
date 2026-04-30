const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    profilePic: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
    },

    about: {
      type: String,
      default: "Hey there! I am using VibeTalk."
    },

    wallpaper: {
      type: String,
      default: ""
    },

    isOnline: {
      type: Boolean,
      default: false
    },

    lastSeen: {
      type: Date,
      default: Date.now
    },

    resetOtp: {
      type: String,
      default: ""
    },

    resetOtpExpire: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);