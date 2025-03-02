import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyA5Z0bmgatBgYljaaBo6nteF4Fj8EIeAVs");

async function run() {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Generate a multiple-choice quiz about operating systems threads. 
  Create exactly 5 questions at medium difficulty level.
  
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
  5. Questions are challenging but fair for the medium level
  6. No HTML or markdown formatting in the response, just plain text
  7. ONLY return the JSON object, nothing else
  `;

    const result = await model.generateContent(prompt);
    console.log(result.response.text());
}

run().catch(console.error);
