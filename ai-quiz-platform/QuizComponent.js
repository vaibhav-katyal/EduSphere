import { useState } from "react";

const QuizComponent = ({ quizData }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState("");

  const handleAnswer = (option) => {
    if (option === quizData[currentQuestion].answer) {
      setScore(score + 1);
      setFeedback("Correct!");
    } else {
      setFeedback(`Wrong! Correct answer: ${quizData[currentQuestion].answer}`);
    }

    setTimeout(() => {
      setFeedback("");
      setSelectedAnswer(null);
      if (currentQuestion < quizData.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        alert(`Quiz finished! Your Score: ${score}/${quizData.length}`);
      }
    }, 1000);
  };

  return (
    <div>
      <h2>{quizData[currentQuestion].question}</h2>
      {quizData[currentQuestion].options.map((option, index) => (
        <button key={index} onClick={() => handleAnswer(option)}>{option}</button>
      ))}
      <p>{feedback}</p>
      <p>Progress: {currentQuestion + 1}/{quizData.length}</p>
    </div>
  );
};

export default QuizComponent;
