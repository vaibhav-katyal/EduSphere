import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import path from 'path';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';
const CALLBACK_URL = isProduction 
  ? "https://edusphere-4-b7uo.onrender.com/auth/google/callback"
  : "http://localhost:3000/auth/google/callback";

// MongoDB Connection with improved error handling and reconnection logic
const connectToMongoDB = async () => {
  const MONGODB_URI = process.env.MONGO_URI;
  
  try {
    // Connection options
    const options = { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    };
    
    await mongoose.connect(MONGODB_URI, options);
    console.log("✅ MongoDB Connected");
    return true;
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    return false;
  }
};

// Initial connection attempt
connectToMongoDB();

// Handle connection errors
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
  console.log('Attempting to reconnect to MongoDB...');
  setTimeout(connectToMongoDB, 5000); // Try to reconnect after 5 seconds
});

// Handle disconnection
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  setTimeout(connectToMongoDB, 5000);
});

// Nodemailer setup for sending emails
async function sendSignupEmail(userEmail, userName) {
    try {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "adityasharma.5672@gmail.com",
                pass: "ezun hhkb oaye phsr"
            }
        });

        let mailOptions = {
            from: '"EduSphere Team" <adityasharma.5672@gmail.com>',
            to: userEmail,
            subject: "🚀 Welcome Aboard, Genius!",
            text: `Hey ${userName}, 

BOOM! 💥 You're officially a part of EduSphere! 🚀 

You just unlocked a world of next-level learning, exclusive study groups, and top-tier knowledge! 🤩

🎯 What's Next? 
- Join study groups & meet legends like you! 
- Access premium notes & resources! 
- Win challenges & flex your skills! 

⚡ Ready to explore? Click the link & jump in NOW:  
🔗 https://edusphere.com/dashboard 

See you inside, champ! 😎🔥  

- EduSphere Team  
(P.S. Legends don't wait! 😏)  
`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; text-align: center;">
                    <h1 style="color: #ff4747;">🚀 BOOM! YOU'RE IN! 🔥</h1>
                    <p>Hey <b>${userName}</b>, welcome to <b>EduSphere</b>! You just unlocked a world of **learning, community, and exclusive opportunities!** 😍</p>
                    
                    <h3>🎯 What's Next?</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li> Join study groups & meet legends like you! ✅</li>
                        <li> Access premium notes & resources! 📚</li>
                        <li> Win challenges & flex your knowledge! 🏆</li>
                    </ul>
                    
                    <p style="font-size: 18px; font-weight: bold;">⚡ Ready to explore? Click below & jump in NOW!</p>
                    
                    <a href="https://edusphere.com/dashboard" style="background: #ff4747; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 18px; font-weight: bold; display: inline-block;"> LET'S GOOO! </a>
                    
                    <p style="margin-top: 20px;">See you inside, champ! 😎🔥<br><b>- EduSphere Team</b></p>
                    <p style="font-size: 12px; color: #888;">P.S. Legends don't wait! 😏</p>
                </div>
            `
        };

        let info = await transporter.sendMail(mailOptions);
        console.log("✅ Email sent:", info.response);
    } catch (error) {
        console.error("❌ Error sending email:", error);
    }
}

// CORS setup with improved configuration
const allowedOrigins = [
    "http://localhost:3000", 
    "http://127.0.0.1:5500",
    "https://edusphere-4-b7uo.onrender.com"
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log("Blocked by CORS:", origin);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({ 
    secret: "your_secret_key", 
    resave: false, 
    saveUninitialized: false,
    cookie: {
        secure: isProduction, // Use secure cookies in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(passport.initialize());
app.use(passport.session());

const JWT_SECRET = "902d22ae459df3cef67d662f3b637feb8f149eb451362aa6e40596f9c6503dac2de98d1c3d5fa1ac61d6e545f4e46bac84d5a60937602c146ee0bc2e80e5b1b9";

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, unique: true, required: true },
    password: String
});

const User = mongoose.model("User", userSchema);

// Group Schema
const groupSchema = new mongoose.Schema({
    name: String,
    description: String,
    type: String,
    inviteCode: String,
    leader: String,
    members: [String]
});

const Group = mongoose.model("Group", groupSchema);

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: "7499225439-vfj5ihd30lgij33dt9in319fqhsgudf4.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
            let username = profile.displayName;
            let existingUser = await User.findOne({ username });

            if (existingUser) {
                username = `${profile.displayName}-${Math.floor(1000 + Math.random() * 9000)}`;
            }

            user = new User({
                username: username,
                email: profile.emails[0].value,
                password: ""
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
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Static file serving
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, "public")));

// Health check endpoint for Render
app.get("/health", (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    res.json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        database: dbStatus
    });
});

// Auth Routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback", 
    passport.authenticate("google", { failureRedirect: "/" }),
    async (req, res) => {
        try {
            const token = jwt.sign(
                { userId: req.user._id, email: req.user.email, username: req.user.username },
                JWT_SECRET,
                { expiresIn: "1h" }
            );
            res.redirect(`/index.html?token=${token}`);
        } catch (error) {
            console.error("❌ Error generating JWT for Google user:", error);
            res.redirect("/");
        }
    }
);

// User info endpoint for Google auth
app.get("/auth/user", (req, res) => {
    if (req.user) {
        res.json({ email: req.user.email, username: req.user.username });
    } else {
        res.status(401).json({ message: "Not authenticated" });
    }
});

// Signup Route
app.post("/signup", async (req, res) => {
    try {
        let { username, email, password } = req.body;

        // Check for existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("User already exists!");
            return res.status(400).json({ message: "User already exists!" });
        }

        // Ensure unique username
        let uniqueUsername = username;
        while (await User.findOne({ username: uniqueUsername })) {
            uniqueUsername = `${username}-${Math.floor(1000 + Math.random() * 9000)}`;
        }
        console.log("Unique Username:", uniqueUsername);

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log("Hashed Password:", hashedPassword);

        // Create and save new user
        const newUser = new User({
            username: uniqueUsername,
            email,
            password: hashedPassword
        });
        await newUser.save();

        // Send welcome email
        await sendSignupEmail(email, uniqueUsername);

        res.status(201).json({ message: "Signup successful! Email sent." });
    } catch (error) {
        if (error.code === 11000) {
            console.error("❌ Duplicate key error:", error.keyValue);
            res.status(400).json({ message: "Duplicate key error", field: error.keyValue });
        } else {
            console.error("❌ Error during signup:", error);
            res.status(500).json({ message: "Server Error", error: error.message });
        }
    }
});

// Signin Route
app.post("/signin", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            console.log("User not found!");
            return res.status(400).json({ message: "User not found!" });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password Match:", isMatch);
        if (!isMatch) {
            console.log("Invalid Password!");
            return res.status(400).json({ message: "Invalid Password!" });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id, email: user.email, username: user.username },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({ 
            message: "Login Successful!", 
            token, 
            username: user.username,
            email: user.email
        });
    } catch (error) {
        console.error("❌ Error during login:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// Protected Profile Route
app.get("/profile", async (req, res) => {
    let token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        if (token.startsWith("Bearer ")) {
            token = token.slice(7);
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("❌ JWT Verification Error:", error);
        res.status(401).json({ message: "Invalid token" });
    }
});

// Group Routes
app.get("/groups", async (req, res) => {
    try {
        const groups = await Group.find();
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: "Error fetching groups", error: error.message });
    }
});

app.post("/groups", async (req, res) => {
    try {
        const newGroup = new Group({
            ...req.body,
            inviteCode: Math.random().toString(36).substring(7)
        });
        await newGroup.save();
        res.status(201).json({ message: "Group Created!", group: newGroup });
    } catch (error) {
        res.status(500).json({ message: "Error creating group", error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Server Error:", err);
    res.status(500).json({ 
        message: "Server Error", 
        error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message 
    });
});

// Start server with connection verification
const PORT = process.env.PORT || 3000;

// Check database connection before starting server
const startServer = async () => {
    // Verify MongoDB connection
    if (mongoose.connection.readyState !== 1) {
        console.log("Waiting for MongoDB connection before starting server...");
        await connectToMongoDB();
    }
    
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
        console.log(`✅ MongoDB Status: ${mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"}`);
    });
};

startServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Gracefully shutting down...');
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
    }
});