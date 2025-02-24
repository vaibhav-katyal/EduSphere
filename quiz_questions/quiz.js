async function generateQuiz() {
    const subject = document.getElementById("subject").value;
    const subtopic = document.getElementById("subtopic").value;
    const difficulty = document.getElementById("difficulty").value;
    const numQuestions = document.getElementById("numQuestions").value;
    const quizOutput = document.getElementById("quizOutput");

    if (!subject || !subtopic || !difficulty || !numQuestions) {
        alert("Please fill all fields.");
        return;
    }

    quizOutput.innerHTML = "Generating quiz...";

    try {
        const response = await fetch('http://localhost:5000/generate-quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ subject, subtopic, difficulty, numQuestions })
        });

        const data = await response.json();

        if (data.error) {
            quizOutput.innerHTML = `<p style="color: red;">${data.error}</p>`;
            return;
        }

        let questionsHtml = "<h3>Quiz Questions:</h3>";
        data.questions.forEach((question, index) => {
            questionsHtml += `<p><strong>Q${index + 1}: ${question}</strong></p>`;
        });

        quizOutput.innerHTML = questionsHtml;

    } catch (error) {
        console.error("Error:", error);
        quizOutput.innerHTML = `<p style="color: red;">Failed to generate quiz. Try again later.</p>`;
    }
}
