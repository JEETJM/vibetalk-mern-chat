const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    mediaUrl: {
      type: String,
      default: ""
    },

    mediaType: {
      type: String,
      default: ""
    },

    text: {
      type: String,
      default: ""
    },

    viewers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        viewedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Status", statusSchema);