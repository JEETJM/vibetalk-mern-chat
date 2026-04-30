const dotenv = require("dotenv");
dotenv.config();

const cloudinary = require("cloudinary").v2;

console.log("CLOUDINARY CHECK:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "OK" : "MISSING",
  api_key: process.env.CLOUDINARY_API_KEY ? "OK" : "MISSING",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "OK" : "MISSING"
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;