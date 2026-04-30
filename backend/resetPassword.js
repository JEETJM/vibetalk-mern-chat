const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

const resetPassword = async () => {
  try {
    const email = process.argv[2]?.trim().toLowerCase();
    const newPassword = process.argv[3]?.trim();

    if (!email || !newPassword) {
      console.log("Use: node resetPassword.js email password");
      process.exit(1);
    }

    if (newPassword.length < 6) {
      console.log("Password must be at least 6 characters");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found:", email);
      process.exit(1);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    console.log("Password reset successful for:", email);
    console.log("New password:", newPassword);

    process.exit(0);
  } catch (error) {
    console.log("RESET PASSWORD ERROR:", error.message);
    process.exit(1);
  }
};

resetPassword();