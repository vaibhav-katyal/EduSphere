const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = "your_jwt_secret_key"; // Change this to a secure key

// Connect to MongoDB
mongoose.connect("mongodb+srv://adityasharma08093:Lakshya9780@groupstudy.yl0qi.mongodb.net/?retryWrites=true&w=majority&appName=groupstudy", { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Define User Schema
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});

const User = mongoose.model("User", userSchema);

// User Signup Route
app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
});

// User Signin Route
app.post("/signin", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "Sign-in successful", token, username: user.username });
});

// Protected Route Example (Requires Authentication)
app.get("/profile", async (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password'); // Exclude password from response
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