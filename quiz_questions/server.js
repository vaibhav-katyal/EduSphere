require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Define Schema for Quiz Storage
const quizSchema = new mongoose.Schema({
    subject: String,
    subtopic: String,
    difficulty: String,
    numQuestions: Number,
    questions: Array,
    createdAt: { type: Date, default: Date.now }
});
const Quiz = mongoose.model('Quiz', quizSchema);

// **AI Quiz Generation Route**
app.post('/generate-quiz', async (req, res) => {
    try {
        const { subject, subtopic, difficulty, numQuestions } = req.body;
        if (!subject || !subtopic || !difficulty || !numQuestions) {
            return res.status(400).json({ error: "All fields are required!" });
        }

        const prompt = `Generate ${numQuestions} multiple-choice quiz questions on ${subject} (${subtopic}) with ${difficulty} difficulty. Each question should have 4 options (A, B, C, D) and specify the correct answer.`;

        // Request to Gemini API
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateText?key=${process.env.GEMINI_API_KEY}`,
            { prompt, temperature: 0.7 },
            { headers: { 'Content-Type': 'application/json' } }
        );

        console.log("🔹 Full Gemini API Response:", response.data);

        if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
            return res.status(500).json({ error: "Invalid response from Gemini API." });
        }

        // Extracting questions
        const questionsText = response.data.candidates[0].content.parts[0].text;
        const questionsArray = questionsText.split("\n\n").map(q => q.trim()); // Splitting into individual questions

        // Save Quiz in MongoDB
        const newQuiz = new Quiz({ subject, subtopic, difficulty, numQuestions, questions: questionsArray });
        await newQuiz.save();

        res.json({ message: "✅ Quiz saved successfully!", questions: questionsArray });

    } catch (error) {
        console.error("❌ Quiz Generation Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to generate quiz. Try again later." });
    }
});

// **Start Server**
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
