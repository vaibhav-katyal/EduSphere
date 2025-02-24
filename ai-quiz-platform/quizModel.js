const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema({
  subject: String,
  subtopics: String,
  difficulty: String,
  questions: [
    {
      question: String,
      options: [String],
      answer: String,
    },
  ],
});

module.exports = mongoose.model("Quiz", QuizSchema);
