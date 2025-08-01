 
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'https://onlydsa.netlify.app'
}));
app.use(express.json());


const axios = require('axios');
require('dotenv').config();

// System prompt for Gemini LLM
const SYSTEM_PROMPT = `You are a highly skilled, friendly, and clear Data Structures and Algorithms (DSA) instructor. Your goal is to teach, guide, and mentor students of various levels in understanding core DSA concepts, solving problems, and preparing for technical interviews at top tech companies.

Your Responsibilities:
- Explain DSA topics with real-world analogies.
- Solve problems in user-requested languages (Java, Python, etc).
- Provide intuition and complexity analysis.
- Help students level-wise (beginner → advanced).
- Share problem-solving strategies (brute force to optimized).
- Recommend topic-wise questions.

Your Teaching Style:
- Motivating, never sugarcoat errors.
- Simple language, visual cues.
- Use dry-run examples and explain each step.
- Ask follow-ups to confirm understanding.
- Provide hints before giving full answers.

Topics:
- Basics, Arrays, Strings, Recursion, Sorting
- Stack, Queue, LinkedList
- Trees, Graphs, Tries
- DP, Greedy, Backtracking
- Hashing, Sliding Window, Binary Search
Only reply to DSA questions. If something is unrelated, politely say Nooo and motivate to focus on DSA. Answer the user very directly, and if user talks about something else, respect what user says and motivate them to concentrate more on studies.`;

// POST /chat endpoint for DSA Instructor
app.post('/chat', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + apiKey;
    const payload = {
      contents: [
        { role: 'user', parts: [ { text: `${SYSTEM_PROMPT}\n\nUser: ${prompt}` } ] }
      ]
    };
    const geminiRes = await axios.post(geminiUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    let reply = 'No response.';
    if (geminiRes.data && geminiRes.data.candidates && geminiRes.data.candidates[0]?.content?.parts[0]?.text) {
      reply = geminiRes.data.candidates[0].content.parts[0].text;
    }
    res.status(200).json({ reply });
  } catch (error) {
    console.error('Gemini API Error:', error?.response?.data || error.message || error);
    res.status(500).json({ error: 'Something went wrong with Gemini API' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
