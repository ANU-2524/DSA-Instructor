 
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const axios = require('axios');

// System prompt for LLM to act as a DSA instructor
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

Only reply to DSA questions. If something is unrelated, politely say No and motivate to focus on DSA. Answer the user very directly, and if user talks about something else, respect what user says and motivate them to concentrate more on studies.`;

// POST /chat endpoint for DSA Instructor
app.post('/chat', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  try {
    const response = await axios({
      method: 'post',
      url: 'http://localhost:11434/api/chat',
      data: {
        model: 'llama3',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ]
      },
      headers: { 'Content-Type': 'application/json' },
      responseType: 'stream'
    });

    let fullReply = '';
    let buffer = '';
    response.data.on('data', (chunk) => {
      buffer += chunk.toString();
      let lines = buffer.split('\n');
      buffer = lines.pop(); // last line may be incomplete
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line);
          if (obj.message && obj.message.content) {
            fullReply += obj.message.content;
          }
        } catch (e) {
          // ignore parse errors
        }
      }
    });
    response.data.on('end', () => {
      fullReply = fullReply.trim() || 'No response.';
      res.status(200).json({ reply: fullReply });
    });
    response.data.on('error', (err) => {
      console.error('Ollama stream error:', err);
      res.status(500).json({ error: 'Error reading Ollama response' });
    });
  } catch (error) {
    if (error.response) {
      console.error('Ollama LLM Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Ollama LLM Error:', error.message || error);
    }
    res.status(500).json({ error: 'Something went wrong with the local LLM (Ollama)' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
