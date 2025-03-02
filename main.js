// import './style.css';

// DOM Elements
const generateBtn = document.getElementById('generateBtn');
const quizSection = document.getElementById('quizSection');
const loadingSection = document.getElementById('loadingSection');
const quizForm = document.querySelector('.quiz-form');
const quizContainer = document.getElementById('quizContainer');
const submitQuizBtn = document.getElementById('submitQuizBtn');
const newQuizBtn = document.getElementById('newQuizBtn');
const resultsSection = document.getElementById('resultsSection');
const scoreValue = document.getElementById('scoreValue');
const totalQuestions = document.getElementById('totalQuestions');
const scorePercentage = document.getElementById('scorePercentage');
const resultsBreakdown = document.getElementById('resultsBreakdown');
const reviewQuizBtn = document.getElementById('reviewQuizBtn');
const newQuizAfterResultsBtn = document.getElementById('newQuizAfterResultsBtn');
const quizTitle = document.getElementById('quizTitle');
const quizDescription = document.getElementById('quizDescription');

// Gemini API Key
const API_KEY = "AIzaSyA5Z0bmgatBgYljaaBo6nteF4Fj8EIeAVs";

// Store quiz data
let currentQuiz = {
  questions: [],
  userAnswers: [],
  topic: '',
  subtopic: '',
  difficulty: ''
};

// Initialize the application
function init() {
  setupEventListeners();
  setupScrollAnimations();
}

// Set up event listeners
function setupEventListeners() {
  generateBtn.addEventListener('click', handleGenerateQuiz);
  submitQuizBtn.addEventListener('click', handleSubmitQuiz);
  newQuizBtn.addEventListener('click', resetToForm);
  reviewQuizBtn.addEventListener('click', showQuizWithAnswers);
  newQuizAfterResultsBtn.addEventListener('click', resetToForm);
}

// Set up scroll animations
function setupScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  // Observe features grid
  const featuresGrid = document.querySelector('.features-grid');
  observer.observe(featuresGrid);

  // Observe testimonial cards
  const testimonialCards = document.querySelectorAll('.testimonial-card');
  testimonialCards.forEach(card => observer.observe(card));
}

// Handle quiz generation
async function handleGenerateQuiz() {
  const topic = document.getElementById('topic').value.trim();
  const subtopic = document.getElementById('subtopic').value.trim();
  const numQuestions = document.getElementById('numQuestions').value;
  const difficulty = document.getElementById('difficulty').value;

  if (!topic) {
      alert('Please enter a topic for your quiz');
      return;
  }

  // Show loading screen
  quizForm.style.display = 'none';
  loadingSection.style.display = 'block';

  try {
      // Directly call the generateQuizWithAI function instead of using a server endpoint
      const quizData = await generateQuizWithAI(topic, subtopic, numQuestions, difficulty);

      if (quizData && quizData.questions && quizData.questions.length > 0) {
          currentQuiz = {
              ...quizData,
              topic,
              subtopic,
              difficulty,
              userAnswers: Array(quizData.questions.length).fill(null),
          };

          displayQuiz(currentQuiz);
      } else {
          throw new Error('Failed to generate quiz questions');
      }
  } catch (error) {
      console.error('Error generating quiz:', error);

      // Use fallback only if there's an actual error
      try {
          console.log("Using fallback quiz data");
          const fallbackData = generateFallbackQuiz(topic, subtopic, numQuestions, difficulty);

          currentQuiz = {
              ...fallbackData,
              topic,
              subtopic,
              difficulty,
              userAnswers: Array(fallbackData.questions.length).fill(null),
          };

          displayQuiz(currentQuiz);
      } catch (fallbackError) {
          alert('There was an error generating your quiz. Please try again.');
          resetToForm();
      }
  }
}

// Generate quiz using Gemini API
async function generateQuizWithAI(topic, subtopic, numQuestions, difficulty) {
  const subtopicText = subtopic ? ` focusing on ${subtopic}` : '';
  const prompt = `Generate a multiple-choice quiz about ${topic}${subtopicText}. 
  Create exactly ${numQuestions} questions at ${difficulty} difficulty level.
  
  Format the response as a valid JSON object with this structure:
  {
    "questions": [
      {
        "question": "Question text here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Brief explanation of the correct answer"
      }
    ]
  }
  
  Make sure:
  1. Each question has exactly 4 options
  2. The correctAnswer is the index (0-3) of the correct option
  3. The explanation is brief but informative
  4. The JSON is valid and properly formatted
  5. Questions are challenging but fair for the ${difficulty} level
  6. No HTML or markdown formatting in the response, just plain text
  7. ONLY return the JSON object, nothing else
  `;

  try {
    // Using the same approach as your test.js file
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    console.log("API Response:", data);
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0].text) {
      throw new Error('Invalid API response structure');
    }

    // Extract the text content from the response
    const textContent = data.candidates[0].content.parts[0].text;
    console.log("Text content:", textContent);
    
    // Find the JSON part in the response
    let jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Try to find JSON with a more lenient approach
      const possibleJson = textContent.substring(
        textContent.indexOf('{'),
        textContent.lastIndexOf('}') + 1
      );
      
      if (possibleJson && possibleJson.includes('"questions"')) {
        jsonMatch = [possibleJson];
      } else {
        throw new Error('Could not extract JSON from API response');
      }
    }
    
    // Parse the JSON
    try {
      const quizData = JSON.parse(jsonMatch[0]);
      
      // Validate the quiz data structure
      if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
        throw new Error('Invalid quiz data structure');
      }
      
      // Ensure all questions have the required fields
      quizData.questions.forEach((q, i) => {
        if (!q.question || !q.options || !Array.isArray(q.options) || 
            q.options.length !== 4 || typeof q.correctAnswer !== 'number' || !q.explanation) {
          throw new Error(`Question ${i+1} has invalid structure`);
        }
      });
      
      return quizData;
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'for text:', jsonMatch[0]);
      throw new Error('Failed to parse quiz data JSON');
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

// Generate fallback quiz data when API fails
function generateFallbackQuiz(topic, subtopic, numQuestions, difficulty) {
  const count = parseInt(numQuestions);
  const questions = [];
  
  // Generate sample questions based on topic
  for (let i = 0; i < count; i++) {
    questions.push({
      question: `Sample ${topic} question #${i + 1}${subtopic ? ` about ${subtopic}` : ''}?`,
      options: [
        `${topic} answer option A`,
        `${topic} answer option B`,
        `${topic} answer option C`,
        `${topic} answer option D`
      ],
      correctAnswer: Math.floor(Math.random() * 4),
      explanation: `This is a sample explanation for a ${difficulty} level question about ${topic}${subtopic ? ` focusing on ${subtopic}` : ''}.`
    });
  }
  
  return { questions };
}

// Display the generated quiz
function displayQuiz(quiz) {
  // Update quiz title and description
  const subtopicText = quiz.subtopic ? ` - ${quiz.subtopic}` : '';
  quizTitle.textContent = `${quiz.topic}${subtopicText} Quiz`;
  quizDescription.textContent = `${quiz.questions.length} ${quiz.difficulty} level questions`;
  
  // Clear previous quiz
  quizContainer.innerHTML = '';
  
  // Create question cards
  quiz.questions.forEach((question, index) => {
    const questionCard = document.createElement('div');
    questionCard.className = 'question-card animate-on-scroll';
    
    questionCard.innerHTML = `
      <div class="question-number">Question ${index + 1}</div>
      <div class="question-text">${question.question}</div>
      <ul class="options-list">
        ${question.options.map((option, optionIndex) => `
          <li class="option-item">
            <label class="option-label">
              <input type="radio" name="question-${index}" value="${optionIndex}" class="option-radio">
              ${option}
            </label>
          </li>
        `).join('')}
      </ul>
    `;
    
    quizContainer.appendChild(questionCard);
    
    // Add event listeners to track user answers
    const radioButtons = questionCard.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
      radio.addEventListener('change', (e) => {
        currentQuiz.userAnswers[index] = parseInt(e.target.value);
      });
    });
    
    // Delay animation for staggered effect
    setTimeout(() => {
      questionCard.classList.add('animated');
    }, index * 100);
  });
  
  // Hide loading, show quiz
  loadingSection.style.display = 'none';
  quizSection.style.display = 'block';
  
  // Scroll to quiz section
  quizSection.scrollIntoView({ behavior: 'smooth' });
}

// Handle quiz submission
function handleSubmitQuiz() {
  // Check if all questions are answered
  const unansweredQuestions = currentQuiz.userAnswers.filter(answer => answer === null).length;
  
  if (unansweredQuestions > 0) {
    if (!confirm(`You have ${unansweredQuestions} unanswered question(s). Do you want to submit anyway?`)) {
      return;
    }
  }
  
  // Calculate score
  let score = 0;
  currentQuiz.questions.forEach((question, index) => {
    if (currentQuiz.userAnswers[index] === question.correctAnswer) {
      score++;
    }
  });
  
  // Update results display
  scoreValue.textContent = score;
  totalQuestions.textContent = currentQuiz.questions.length;
  const percentage = Math.round((score / currentQuiz.questions.length) * 100);
  scorePercentage.textContent = `${percentage}%`;
  
  // Generate results breakdown
  generateResultsBreakdown();
  
  // Show results section
  quizSection.style.display = 'none';
  resultsSection.style.display = 'block';
  
  // Scroll to results
  resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Generate detailed results breakdown
function generateResultsBreakdown() {
  resultsBreakdown.innerHTML = '';
  
  currentQuiz.questions.forEach((question, index) => {
    const userAnswer = currentQuiz.userAnswers[index];
    const isCorrect = userAnswer === question.correctAnswer;
    
    const resultItem = document.createElement('div');
    resultItem.className = `result-item ${isCorrect ? 'correct' : 'incorrect'}`;
    
    resultItem.innerHTML = `
      <div class="result-icon ${isCorrect ? 'correct' : 'incorrect'}">
        <i class="fas ${isCorrect ? 'fa-check-circle' : 'fa-times-circle'}"></i>
      </div>
      <div class="result-content">
        <div class="result-question">${question.question}</div>
        ${userAnswer !== null ? 
          `<div class="result-answer">Your answer: ${question.options[userAnswer]}</div>` : 
          `<div class="result-answer">You didn't answer this question</div>`
        }
        ${!isCorrect ? 
          `<div class="correct-answer">Correct answer: ${question.options[question.correctAnswer]}</div>` : 
          ''
        }
        <div class="result-explanation">${question.explanation}</div>
      </div>
    `;
    
    resultsBreakdown.appendChild(resultItem);
  });
}

// Show quiz with correct answers highlighted
function showQuizWithAnswers() {
  // Hide results, show quiz
  resultsSection.style.display = 'none';
  quizSection.style.display = 'block';
  
  // Disable all radio buttons
  const radioButtons = quizContainer.querySelectorAll('input[type="radio"]');
  radioButtons.forEach(radio => {
    radio.disabled = true;
  });
  
  // Highlight correct and incorrect answers
  currentQuiz.questions.forEach((question, qIndex) => {
    const options = quizContainer.querySelectorAll(`input[name="question-${qIndex}"]`);
    
    options.forEach((option, oIndex) => {
      const optionLabel = option.closest('.option-label');
      
      if (oIndex === question.correctAnswer) {
        // Correct answer
        optionLabel.style.backgroundColor = 'rgba(0, 255, 102, 0.2)';
        optionLabel.style.borderColor = 'var(--primary-color)';
      } else if (currentQuiz.userAnswers[qIndex] === oIndex) {
        // Incorrect user answer
        optionLabel.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        optionLabel.style.borderColor = '#ff3333';
      }
    });
    
    // Add explanation
    const questionCard = options[0].closest('.question-card');
    const explanation = document.createElement('div');
    explanation.className = 'question-explanation';
    explanation.innerHTML = `<p><strong>Explanation:</strong> ${question.explanation}</p>`;
    explanation.style.marginTop = '16px';
    explanation.style.padding = '12px';
    explanation.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
    explanation.style.borderRadius = '8px';
    
    questionCard.appendChild(explanation);
  });
  
  // Change submit button text
  submitQuizBtn.style.display = 'none';
  
  // Scroll to quiz
  quizSection.scrollIntoView({ behavior: 'smooth' });
}

// Reset to quiz form
function resetToForm() {
  quizSection.style.display = 'none';
  resultsSection.style.display = 'none';
  quizForm.style.display = 'block';
  
  // Reset form fields
  document.getElementById('topic').value = '';
  document.getElementById('subtopic').value = '';
  
  // Reset current quiz data
  currentQuiz = {
    questions: [],
    userAnswers: [],
    topic: '',
    subtopic: '',
    difficulty: ''
  };
  
  // Scroll to form
  quizForm.scrollIntoView({ behavior: 'smooth' });
  
  // Reset submit button
  submitQuizBtn.style.display = 'block';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);

// Additional scroll animations for question cards
document.addEventListener('scroll', () => {
  const questionCards = document.querySelectorAll('.question-card.animate-on-scroll');
  questionCards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight - 100;
    
    if (isVisible) {
      card.classList.add('animated');
    }
  });
});