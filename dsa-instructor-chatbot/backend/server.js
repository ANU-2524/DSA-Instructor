const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS configuration
app.use(cors({
  origin: [
    'https://onlydsa.netlify.app',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Enhanced system prompt with better structure
const SYSTEM_PROMPT = `You are a highly skilled, friendly, and clear Data Structures and Algorithms (DSA) instructor. Your goal is to teach, guide, and mentor students of various levels in understanding core DSA concepts, solving problems, and preparing for technical interviews.

Your Responsibilities:
- Explain DSA topics with real-world analogies and examples
- Provide code solutions in requested languages (Java, Python, C++, JavaScript)
- Always include time and space complexity analysis
- Break down problems step-by-step with intuition
- Share problem-solving patterns and strategies
- Recommend practice problems and learning paths

Your Teaching Style:
- Be encouraging and motivating, but honest about mistakes
- Use simple language with clear explanations
- Include visual descriptions and dry-run examples
- Ask clarifying questions when needed
- Provide hints before full solutions when appropriate
- Format code with proper syntax highlighting using markdown

Topics You Cover:
- Fundamentals: Arrays, Strings, Math, Bit Manipulation
- Linear DS: Stack, Queue, LinkedList, Deque
- Non-Linear DS: Trees, Graphs, Tries, Heaps
- Algorithms: Sorting, Searching, Two Pointers, Sliding Window
- Advanced: Dynamic Programming, Greedy, Backtracking, Divide & Conquer
- System Design basics and problem-solving patterns

Important Guidelines:
- Only answer DSA-related questions
- If asked about non-DSA topics, politely redirect focus to DSA learning
- Format responses with markdown for better readability (use **bold**, \`code\`, lists, etc.)
- Keep responses concise but comprehensive
- Always encourage practice and continuous learning
- Be supportive and never make students feel bad about not knowing something`;

// Enhanced chat endpoint with conversation history
app.post('/chat', async (req, res) => {
  const { prompt, history = [] } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ 
      error: 'Prompt is required',
      success: false 
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBhy1NJj_y93JmB3Mu4iFR6eqmcdROo2Ck';
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey?.length || 0);
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured in environment variables');
      console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('GEMINI')));
      return res.status(500).json({ 
        error: 'Server configuration error',
        success: false 
      });
    }

    // Use gemini-1.5-flash-latest for better performance
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    // Build conversation context from history
    const conversationContext = history
      .slice(-6) // Last 3 exchanges
      .map(msg => `${msg.role === 'user' ? 'Student' : 'Instructor'}: ${msg.text}`)
      .join('\n\n');

    const fullPrompt = conversationContext 
      ? `${SYSTEM_PROMPT}\n\n## Previous Conversation:\n${conversationContext}\n\n## Current Question:\nStudent: ${prompt}`
      : `${SYSTEM_PROMPT}\n\nStudent: ${prompt}`;
    
    const payload = {
      contents: [{
        role: 'user',
        parts: [{ text: fullPrompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };
    
    console.log('Sending request to Gemini API...');
    
    const geminiRes = await axios.post(geminiUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000 // 30 second timeout
    });
    
    let reply = 'No response received from AI.';
    
    if (geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      reply = geminiRes.data.candidates[0].content.parts[0].text.trim();
      console.log('Successfully received response from Gemini');
    } else {
      console.warn('Unexpected response structure from Gemini:', geminiRes.data);
    }
    
    res.status(200).json({ 
      reply,
      success: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      code: error.code
    });
    
    // Provide specific error messages
    let errorMessage = 'Something went wrong with the AI service';
    let statusCode = 500;
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Request timeout - please try again';
      statusCode = 504;
    } else if (error.response?.status === 429) {
      errorMessage = 'API rate limit exceeded - please wait a moment';
      statusCode = 429;
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      errorMessage = 'API authentication failed';
      statusCode = 401;
    } else if (error.response?.status === 400) {
      errorMessage = 'Invalid request format';
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      success: false,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check with better info
app.get('/', (req, res) => {
  res.json({ 
    message: 'DSA Instructor API is running!',
    status: 'healthy',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      chat: '/chat (POST)',
      health: '/ (GET)'
    },
    env: {
      nodeVersion: process.version,
      port: PORT
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: ['/', '/health', '/chat'],
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

const server = app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   DSA Instructor API Server Started   ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`Server running on port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET  /        - API info');
  console.log('  GET  /health  - Health check');
  console.log('  POST /chat    - Chat endpoint');
  console.log('════════════════════════════════════════');
});