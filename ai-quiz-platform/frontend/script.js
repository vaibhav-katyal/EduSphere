document.getElementById("quiz-form").addEventListener("submit", async function(event) {
    event.preventDefault();

    const subject = document.getElementById("subject").value;
    const subtopics = document.getElementById("subtopics").value;
    const difficulty = document.getElementById("difficulty").value;
    const numQuestions = document.getElementById("numQuestions").value;
    const loader = document.getElementById("loader");

    loader.style.display = "block";

    const response = await fetch("http://localhost:5000/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, subtopics, difficulty, numQuestions }),
    });

    const data = await response.json();
    loader.style.display = "none";

    if (data.questions.length > 0) {
        startQuiz(data.questions);
    } else {
        alert("Failed to generate questions. Try again.");
    }
});

function startQuiz(questions) {
    const quizContainer = document.getElementById("quiz-container");
    quizContainer.innerHTML = "";
    let score = 0;
    let index = 0;
    const answers = [];

    function loadQuestion() {
        if (index >= questions.length) {
            showSummary();
            return;
        }

        let q = questions[index];
        quizContainer.innerHTML = `<h3 class="question">${q.question}</h3>`;
        let optionsContainer = document.createElement("div");
        optionsContainer.classList.add("options");

        q.options.forEach(option => {
            let btn = document.createElement("button");
            btn.textContent = option;
            btn.onclick = () => {
                answers.push({ question: q.question, chosen: option, correct: q.answer });
                if (option === q.answer) {
                    score++;
                    btn.style.backgroundColor = "green";
                } else {
                    btn.style.backgroundColor = "red";
                }

                setTimeout(() => {
                    index++;
                    loadQuestion();
                }, 1000);
            };
            optionsContainer.appendChild(btn);
        });

        quizContainer.appendChild(optionsContainer);
    }

    function showSummary() {
        quizContainer.innerHTML = `<h2 class="score">Your Score: ${score} / ${questions.length}</h2>`;

        const summaryContainer = document.createElement("div");
        summaryContainer.classList.add("summary");
        const summaryTitle = document.createElement("h3");
        summaryTitle.textContent = "Quiz Summary";
        summaryContainer.appendChild(summaryTitle);

        const summaryList = document.createElement("ul");

        answers.forEach(answer => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <strong>Question:</strong> ${answer.question} <br>
                <strong>Your Answer:</strong> <span class="${answer.chosen === answer.correct ? 'correct' : 'incorrect'}">${answer.chosen}</span> <br>
                <strong>Correct Answer:</strong> ${answer.correct}
            `;
            summaryList.appendChild(listItem);
        });

        summaryContainer.appendChild(summaryList);
        quizContainer.appendChild(summaryContainer);
    }

    loadQuestion();
}