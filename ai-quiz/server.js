require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
   .then(() => console.log("MongoDB Connected"))
   .catch(err => console.log(err));

// Import routes
const groupRoutes = require("./routes/groupRoutes");
app.use("/api/groups", groupRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


const groupId = "67aadc44bd85ad59d7eba560"; // MongoDB se groupId leke yaha daalo
fetch(`http://localhost:5000/api/groups/${groupId}/generate-quiz`, { 
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject, subtopics, difficulty, numQuestions })
});
