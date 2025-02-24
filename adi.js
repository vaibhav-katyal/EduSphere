document.getElementById('quiz-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const subject = document.getElementById('subject').value;
    const topic = document.getElementById('topic').value;
    const difficulty = document.getElementById('difficulty').value;
    
    const apiKey = 'AIzaSyDDmY_b_6PRACvQRi53wRt4Gc2Q4gjCtlE'; // Replace this with your actual Gemini API key
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateText?key=${apiKey}`;

    const requestBody = {
        prompt: {
            text: `Generate a ${difficulty} level quiz with 5 multiple-choice questions on the topic of ${topic} in ${subject}. Provide a JSON response with questions, options, and the correct answer.`,
        }
    };

    try {
        console.log('Fetching quiz questions from Gemini API...');
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log('Quiz questions fetched successfully:', data);

        if (data && data.candidates && data.candidates[0] && data.candidates[0].output) {
            const quizData = JSON.parse(data.candidates[0].output);
            displayQuiz(quizData);
        } else {
            throw new Error('Invalid response format from API');
        }
    } catch (error) {
        console.error('Error fetching quiz questions:', error);
        document.getElementById('quiz-display').innerHTML = `<p>Failed to load quiz questions. Error: ${error.message}</p>`;
    }
});

function displayQuiz(questions) {
    const quizDisplay = document.getElementById('quiz-display');
    quizDisplay.innerHTML = '';

    questions.forEach((question, index) => {
        const questionElement = document.createElement('div');
        questionElement.className = 'question';

        const questionText = document.createElement('p');
        questionText.textContent = `${index + 1}. ${question.question}`;
        questionElement.appendChild(questionText);

        question.options.forEach(option => {
            const optionLabel = document.createElement('label');
            const optionInput = document.createElement('input');
            optionInput.type = 'radio';
            optionInput.name = `question-${index}`;
            optionInput.value = option;
            optionLabel.appendChild(optionInput);
            optionLabel.appendChild(document.createTextNode(option));
            questionElement.appendChild(optionLabel);
        });

        quizDisplay.appendChild(questionElement);
    });
}
