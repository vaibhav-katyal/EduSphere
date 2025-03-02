require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🔥 Razorpay Instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Order Create API
app.post("/create-order", async (req, res) => {
    try {
        const { amount } = req.body;

        const options = {
            amount: amount * 100, // Convert to paise
            currency: "INR",
            receipt: `order_rcptid_${Math.floor(Math.random() * 10000)}`,
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error("Error Creating Order:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
});

// ✅ Server Listen
app.listen(5000, () => console.log("Server running on port 5000"));
