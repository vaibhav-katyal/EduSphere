require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateQuiz(subject, subtopics, difficulty, numQuestions) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
  Generate ${numQuestions} multiple-choice quiz questions on ${subject} (subtopics: ${subtopics}).
  Difficulty: ${difficulty}.
  Return JSON format:
  [
    {
      "question": "What is X?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "answer": "Correct Option"
    }
  ]
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  try {
    return JSON.parse(text); 
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return [];
  }
}

module.exports = { generateQuiz };
