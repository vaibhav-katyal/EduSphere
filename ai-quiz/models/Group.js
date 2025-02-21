const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema({
   name: { type: String, required: true },
   quizzes: [
      {
         subject: String,
         subtopics: [String],
         difficulty: String,
         questions: [
            {
               question: String,
               options: [String],
               correctAnswer: String,
            },
         ],
      },
   ],
   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Group", GroupSchema);
