const express = require("express")
const axios = require("axios")
const cors = require("cors")
const bodyParser = require("body-parser")
const path = require("path")

const app = express()
const PORT = 3000

app.use(cors({ origin: "*" }))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, "public")))

// Updated Judge0 API URL
const JUDGE0_API = "https://judge0-ce.p.rapidapi.com"

// Updated headers with your RapidAPI key
const JUDGE0_HEADERS = {
  "Content-Type": "application/json",
  "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
  "X-RapidAPI-Key": "b46a5d104amshd69c6d60d0555b3p1414c5jsndcb123f7ef7d",
}

// Supported Languages (unchanged)
const languageIds = {
  python: 71,
  c: 50,
  cpp: 54,
  java: 62,
  javascript: 63,
}

// Function to Poll Execution Result (updated URL)
const getExecutionResult = async (token) => {
  const resultUrl = `${JUDGE0_API}/submissions/${token}?base64_encoded=false`
  for (let i = 0; i < 10; i++) {
    try {
      const response = await axios.get(resultUrl, { headers: JUDGE0_HEADERS })
      if (response.data.status.id <= 2) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        continue
      }
      return response.data
    } catch (error) {
      console.error("Error fetching result:", error.message)
    }
  }
  return { error: "Execution result timed out" }
}

// API to Run Code (updated to handle user input)
app.post("/run", async (req, res) => {
  const { language, code, input } = req.body

  if (!languageIds[language]) {
    return res.status(400).json({ error: "Unsupported language" })
  }

  try {
    console.log("Submitting code...")

    const submissionResponse = await axios.post(
      `${JUDGE0_API}/submissions?base64_encoded=false&wait=false`,
      {
        source_code: code,
        language_id: languageIds[language],
        stdin: input || "",
      },
      { headers: JUDGE0_HEADERS },
    )

    const token = submissionResponse.data.token
    if (!token) {
      return res.status(500).json({ error: "Failed to get submission token" })
    }

    console.log("Fetching result...")
    const result = await getExecutionResult(token)
    res.json(result)
  } catch (error) {
    console.error("Execution error:", error.response ? error.response.data : error.message)
    res.status(error.response ? error.response.status : 500).json({
      error: "Execution failed",
      details: error.response ? error.response.data : error.message,
    })
  }
})

// Root Route (unchanged)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "editor.html"))
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

