const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d"
  });
};

const defaultProfilePic =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

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

const makeOtp = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

const otpEmailTemplate = ({ otp }) => {
  return `
    <div style="margin:0;padding:0;background:#0b141a;font-family:Arial,sans-serif;">
      <div style="max-width:560px;margin:0 auto;padding:30px;">
        <div style="background:#202c33;border-radius:22px;padding:28px;border:1px solid rgba(255,255,255,0.08);">
          <h1 style="color:#00a884;margin:0 0 8px;font-size:32px;">⚡ VibeTalk</h1>
          <h2 style="color:#e9edef;margin:10px 0;">Password Reset OTP</h2>
          <p style="color:#cfd8dc;font-size:16px;line-height:1.6;">
            You requested to reset your VibeTalk password. Use the OTP below:
          </p>
          <div style="background:#111b21;border-radius:16px;padding:18px;text-align:center;margin:22px 0;">
            <div style="font-size:42px;letter-spacing:8px;color:#25d366;font-weight:900;">
              ${otp}
            </div>
          </div>
          <p style="color:#8696a0;font-size:14px;">
            This OTP is valid for 10 minutes. If you did not request this, ignore this email.
          </p>
          <p style="color:#8696a0;font-size:13px;margin-top:25px;">
            © VibeTalk Security
          </p>
        </div>
      </div>
    </div>
  `;
};

router.post("/register", upload.single("profilePic"), async (req, res) => {
  try {
    let { name, email, password } = req.body;

    name = name?.trim();
    email = email?.trim().toLowerCase();
    password = password?.trim();

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password minimum 6 characters" });
    }

    const exists = await User.findOne({ email });

    if (exists) {
      return res
        .status(400)
        .json({ message: "User already exists. Please login." });
    }

    let profilePic = defaultProfilePic;

    if (req.file) {
      profilePic = await uploadToCloudinary(req.file, "vibetalk-profile");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      profilePic,
      about: "Hey there! I am using VibeTalk."
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      about: user.about || "",
      wallpaper: user.wallpaper || "",
      token: generateToken(user._id)
    });
  } catch (error) {
    console.log("REGISTER ERROR:", error);
    res.status(500).json({ message: error.message || "Register failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email?.trim().toLowerCase();
    password = password?.trim();

    console.log("LOGIN TRY:", email);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      console.log("LOGIN FAILED: user not found");
      return res.status(400).json({ message: "Invalid email or password" });
    }

    let isMatch = false;

    if (user.password?.startsWith("$2a$") || user.password?.startsWith("$2b$")) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = password === user.password;

      if (isMatch) {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
        console.log("OLD PASSWORD MIGRATED TO BCRYPT:", email);
      }
    }

    if (!isMatch) {
      console.log("LOGIN FAILED: password not match");
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic || defaultProfilePic,
      about: user.about || "",
      wallpaper: user.wallpaper || "",
      token: generateToken(user._id)
    });
  } catch (error) {
    console.log("LOGIN ERROR:", error);
    res.status(500).json({ message: error.message || "Login failed" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    let { email } = req.body;

    email = email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: "If this email exists, OTP has been sent."
      });
    }

    const otp = makeOtp();

    user.resetOtp = hashOtp(otp);
    user.resetOtpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await sendEmail({
        to: email,
        subject: "VibeTalk Password Reset OTP",
        html: otpEmailTemplate({ otp })
      });

      res.json({
        message: "OTP sent to your registered email."
      });
    } catch (mailError) {
      console.log("EMAIL SEND ERROR:", mailError.message);
      console.log("RESET OTP FOR TEST:", otp);

      res.status(500).json({
        message:
          "OTP generated but email sending failed. Check Brevo SMTP settings."
      });
    }
  } catch (error) {
    console.log("FORGOT PASSWORD ERROR:", error);
    res.status(500).json({ message: "Forgot password failed" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    let { email, otp, newPassword } = req.body;

    email = email?.trim().toLowerCase();
    otp = otp?.trim();
    newPassword = newPassword?.trim();

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password minimum 6 characters" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid OTP or email" });
    }

    const hashedInputOtp = hashOtp(otp);

    if (!user.resetOtp || user.resetOtp !== hashedInputOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (!user.resetOtpExpire || user.resetOtpExpire < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = "";
    user.resetOtpExpire = null;
    await user.save();

    res.json({
      message: "Password reset successful. Please login."
    });
  } catch (error) {
    console.log("RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: "Reset password failed" });
  }
});

module.exports = router;