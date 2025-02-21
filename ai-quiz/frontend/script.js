async function generateQuiz() {
    const subject = document.getElementById("subject").value;
    const subtopics = document.getElementById("subtopics").value.split(",");
    const difficulty = document.getElementById("difficulty").value;
    const numQuestions = document.getElementById("numQuestions").value;

    const res = await fetch("http://localhost:5000/api/groups/groupId/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, subtopics, difficulty, numQuestions })
    });

    const data = await res.json();
    console.log(data);
}
