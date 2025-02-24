require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const { generateQuiz } = require("./quizGenerator");
const Quiz = require("./quizModel");




const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// API to Generate Quiz
app.post("/generate-quiz", async (req, res) => {
  const { subject, subtopics, difficulty, numQuestions } = req.body;
  const questions = await generateQuiz(subject, subtopics, difficulty, numQuestions);

  // Save quiz in MongoDB
  const quiz = new Quiz({ subject, subtopics, difficulty, questions });
  await quiz.save();

  res.json({ questions });
});

// API to Fetch Stored Quizzes
app.get("/quizzes", async (req, res) => {
  const quizzes = await Quiz.find();
  res.json(quizzes);
});

// Start Server
app.listen(5000, () => console.log("Server running on port 5000"));
