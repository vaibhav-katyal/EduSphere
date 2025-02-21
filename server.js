const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = "your_jwt_secret_key";

mongoose.connect("mongodb+srv://adityasharma08093:Lakshya9780@groupstudy.yl0qi.mongodb.net/?retryWrites=true&w=majority&appName=groupstudy", { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    otp: String,
    otpExpires: Date
});

const User = mongoose.model("User", userSchema);

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "adityasharma08093gmail.com", // Replace with your email
        pass: "atox ioqa kmgt chzj" // Replace with your email password or app password
    }
});

// Function to generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send OTP for Signup
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 min

  const user = await User.findOneAndUpdate(
      { email },
      { $set: { otp, otpExpires } },
      { upsert: true, new: true }
  );

  console.log("📩 OTP Generated:", otp, "for", email); // DEBUG LOG

  const mailOptions = {
      from: "your-email@gmail.com",
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It is valid for 10 minutes.`
  };

  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          console.error("❌ Error sending OTP:", error);
          return res.status(500).json({ message: "Error sending OTP. Check server logs." });
      }
      res.json({ message: "OTP sent successfully" });
  });
});



// Signup with OTP verification
app.post("/signup", async (req, res) => {
    const { username, email, password, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || new Date() > user.otpExpires) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.username = username;
    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
});

// Signin with OTP verification
app.post("/signin", async (req, res) => {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || new Date() > user.otpExpires) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: "Sign-in successful", token, username: user.username });
});

// Protected Profile Route
app.get("/profile", async (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
});

// Define Group Schema
const groupSchema = new mongoose.Schema({
    name: String,
    description: String,
    type: String,
    inviteCode: String,
    leader: String,
    members: [String]
});

const Group = mongoose.model("Group", groupSchema);

// Get all groups
app.get("/groups", async (req, res) => {
    const groups = await Group.find();
    res.json(groups);
});

// Create a new group
app.post("/groups", async (req, res) => {
    const newGroup = new Group(req.body);
    await newGroup.save();
    res.json({ message: "Group Created!", group: newGroup });
});

// Start server
app.listen(3000, () => console.log("Server running on port 3000"));
