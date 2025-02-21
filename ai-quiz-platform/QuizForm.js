import { useState } from "react";
import axios from "axios";

const QuizForm = ({ setQuizData }) => {
  const [subject, setSubject] = useState("");
  const [subtopics, setSubtopics] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [numQuestions, setNumQuestions] = useState(5);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await axios.post("http://localhost:5000/generate-quiz", {
      subject,
      subtopics,
      difficulty,
      numQuestions,
    });
    setQuizData(response.data.questions);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
      <input type="text" placeholder="Subtopics" value={subtopics} onChange={(e) => setSubtopics(e.target.value)} required />
      <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
      <input type="number" min="1" max="20" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} required />
      <button type="submit">Generate Quiz</button>
    </form>
  );
};

export default QuizForm;
