const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const path = require("path");
const app = express();
app.use(cors());
app.use(express.json());

const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:5500"];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));
// Session setup for Google OAuth
app.use(session({ secret: "your_secret_key", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

const JWT_SECRET = "902d22ae459df3cef67d662f3b637feb8f149eb451362aa6e40596f9c6503dac2de98d1c3d5fa1ac61d6e545f4e46bac84d5a60937602c146ee0bc2e80e5b1b9"; // Change this to a secure key

// Connect to MongoDB
mongoose.connect("mongodb+srv://adityasharma08093:Lakshya9780@groupstudy.yl0qi.mongodb.net/?retryWrites=true&w=majority&appName=groupstudy", { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Define User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },  // ✅ Remove "unique: true"
    email: { type: String, unique: true, required: true },  // ✅ Keep email unique
    password: String
});


const User = mongoose.model("User", userSchema);

// 🔹 Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: "7499225439-vfj5ihd30lgij33dt9in319fqhsgudf4.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "http://localhost:3000/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
            let username = profile.displayName;
            let existingUser = await User.findOne({ username });

            // ✅ If username already exists, modify it
            if (existingUser) {
                username = `${profile.displayName}-${Math.floor(1000 + Math.random() * 9000)}`;
            }

            user = new User({
                username: username,
                email: profile.emails[0].value,
                password: "" // No password for Google users
            });

            await user.save();
        }

        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

// 🔹 Google Login Routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve static files from "public" or another folder if you have one
app.use(express.static(path.join(__dirname, "public")));

// Google Auth callback
app.get("/auth/google/callback", 
    passport.authenticate("google", { failureRedirect: "/" }),
    async (req, res) => {
        try {
            // Generate a JWT token for Google login users
            const token = jwt.sign(
                { userId: req.user._id, email: req.user.email, username: req.user.username },
                JWT_SECRET,
                { expiresIn: "1h" } // Token valid for 1 hour
            );

            // Redirect with token in URL (frontend will store it)
            res.redirect(`/index.html?token=${token}`);
        } catch (error) {
            console.error("Error generating JWT for Google user:", error);
            res.redirect("/"); // Redirect to home if error occurs
        }
    }
);


// 🔹 User Signup Route
app.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        let user = await User.findOne({ email });

        if (user) {
            // ✅ If user exists but has no password, allow setting one
            if (!user.password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                user.password = hashedPassword;
                await user.save();
                return res.status(200).json({ message: "Password set successfully, now you can login manually!" });
            }
            return res.status(400).json({ message: "User already exists. Please login or reset password." });
        }

        // ✅ Only create a new user if they don't already exist
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });

        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("❌ Signup Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});



// 🔹 User Signin Route
app.post("/signin", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // ✅ Logging username for debugging
        console.log("✅ Username from DB:", user.username);

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, username: user.username }, 
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ message: "Sign-in successful", token, username: user.username });
    } catch (error) {
        console.error("❌ Signin Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});



// 🔹 Protected Route Example
app.get("/profile", async (req, res) => {
    let token = req.headers.authorization;

    console.log("🛠️ Received Token in /profile:", token);  // Debugging

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        // Remove "Bearer " prefix if present
        if (token.startsWith("Bearer ")) {
            token = token.slice(7, token.length);
        }

        console.log("🔍 Token After Removing 'Bearer':", token); // Debugging

        const decoded = jwt.verify(token, JWT_SECRET);
        console.log("✅ Decoded Token:", decoded); // Debugging

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log("✅ Returning User Data:", user);
        res.json(user);
    } catch (error) {
        console.error("❌ JWT Verification Error:", error);
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
