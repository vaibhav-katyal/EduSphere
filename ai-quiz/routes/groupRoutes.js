const express = require("express");
const router = express.Router();
const Group = require("../models/Group");
const axios = require("axios");

// Create a new group
router.post("/create", async (req, res) => {
   const { name, createdBy } = req.body;
   try {
      const newGroup = new Group({ name, createdBy, quizzes: [] });
      await newGroup.save();
      res.status(201).json(newGroup);
   } catch (err) {
      res.status(500).json({ error: err.message });
   }
});

// Generate AI Quiz
router.post("/:groupId/generate-quiz", async (req, res) => {
   const { subject, subtopics, difficulty, numQuestions } = req.body;
   const { groupId } = req.params;

   try {
      const response = await axios.post(
         "https://generativeai.googleapis.com/v1/models/gemini:generate",
         {
            prompt: `Generate ${numQuestions} multiple-choice questions on ${subject} 
                     with subtopics ${subtopics.join(", ")} at ${difficulty} level. 
                     Each question should have 4 options and a correct answer.`,
         },
         { headers: { Authorization: `Bearer ${process.env.GEMINI_API_KEY}` } }
      );

      const questions = response.data.choices.map((q) => ({
         question: q.question,
         options: q.options,
         correctAnswer: q.correctAnswer,
      }));

      const group = await Group.findById(groupId);
      group.quizzes.push({ subject, subtopics, difficulty, questions });
      await group.save();

      res.status(200).json(group);
   } catch (err) {
      res.status(500).json({ error: err.message });
   }
});

module.exports = router;
