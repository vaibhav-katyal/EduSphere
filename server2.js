require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },
});

const User = mongoose.model("User", UserSchema);

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL, // Your Gmail ID
    pass: process.env.PASSWORD, // Your App Password
  },
});

// Function to Generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Signup Route
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60000); // OTP expires in 10 minutes

    user = new User({ email, password: hashedPassword, otp, otpExpiry });
    await user.save();

    // Send OTP via Email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: "Your OTP for Signup",
        text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
      });
      console.log(`✅ OTP sent to ${email}`);
    } catch (emailError) {
      console.error("❌ Email Sending Error:", emailError);
      return res.status(500).json({ message: "Failed to send OTP email" });
    }

    res.status(200).json({ message: "OTP sent to email" });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
});

// OTP Verification Route
app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.otp !== otp || new Date() > user.otpExpiry) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Clear OTP fields after verification
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // Generate JWT Token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ message: "OTP verified", token });
  } catch (err) {
    console.error("❌ OTP Verification Error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
});

// Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    // Generate OTP for login
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60000); // 10-minute expiration
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP via Email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: "Your OTP for Login",
        text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
      });
      console.log(`✅ OTP sent to ${email}`);
    } catch (emailError) {
      console.error("❌ Email Sending Error:", emailError);
      return res.status(500).json({ message: "Failed to send OTP email" });
    }

    res.status(200).json({ message: "OTP sent to email" });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
