import { useState } from "react";
import QuizForm from "./QuizForm";
import QuizComponent from "./QuizComponent";

function App() {
  const [quizData, setQuizData] = useState(null);

  return (
    <div>
      <h1>AI Quiz Generator</h1>
      {!quizData ? <QuizForm setQuizData={setQuizData} /> : <QuizComponent quizData={quizData} />}
    </div>
  );
}

export default App;
