
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ChatBox.css';

const DSA_TIPS = [
  "Practice a few DSA problems every day for steady progress!",
  "Draw diagrams to visualize data structures and algorithms.",
  "Understand time and space complexity for each solution.",
  "Break big problems into smaller subproblems.",
  "Master recursion and iterative approaches.",
  "Learn to debug with print statements and dry runs.",
  "Focus on patterns, not just individual problems.",
  "Review your mistakes and learn from them.",
  "Try to explain your solution to someone else.",
  "Practice coding on paper or a whiteboard!"
];

function getTipOfDay() {
  const day = new Date().getDate();
  return DSA_TIPS[day % DSA_TIPS.length];
}

function ChatBox() {
  // Light/Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('dsaDarkMode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.documentElement.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.classList.remove('dark-mode');
    }
    localStorage.setItem('dsaDarkMode', darkMode);
  }, [darkMode]);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chatMessages');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [memory, setMemory] = useState(() => {
    const saved = localStorage.getItem('chatMemory');
    return saved ? JSON.parse(saved) : { name: '', goal: '' };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('chatMemory', JSON.stringify(memory));
  }, [memory]);

  const updateMemoryFromInput = (text) => {
    const nameMatch = text.match(/my name is\s+(.+)/i);
    const goalMatch = text.match(/i want to learn\s+(.+)/i);
    setMemory((prev) => ({
      name: nameMatch ? nameMatch[1].split(' ')[0] : prev.name,
      goal: goalMatch ? goalMatch[1] : prev.goal,
    }));
  };


  // Always use local backend for Ollama
  const BACKEND_URL = 'https://dsa-instructor.onrender.com/chat';

  // Helper for retrying API call
  const fetchWithRetry = async (data, retries = 2, timeout = 60000) => {
    for (let i = 0; i <= retries; i++) {
      try {
        const source = axios.CancelToken.source();
        const timer = setTimeout(() => source.cancel('Request timeout'), timeout);
        const response = await axios.post(BACKEND_URL, data, { cancelToken: source.token });
        clearTimeout(timer);
        return response;
      } catch (err) {
        if (axios.isCancel(err)) throw err;
        if (i === retries) throw err;
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    const cleanedInput = input.trim();
    const userMessage = { role: 'user', text: cleanedInput };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    updateMemoryFromInput(cleanedInput);
    try {
      const response = await fetchWithRetry({ prompt: cleanedInput });
      const botText = response.data.reply || 'Sorry, no response.';
      setMessages((prev) => [...prev, { role: 'assistant', text: botText }]);
    } catch (err) {
      console.error('API Error:', err);
      setError('Failed to fetch response from server.');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Failed to fetch response from server.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setMemory({ name: '', goal: '' });
    localStorage.removeItem('chatMessages');
    localStorage.removeItem('chatMemory');
    setError(null);
  };

  return (
    <>
      {/* Animated creative background */}
      <div className="dsa-bg-animated">
        <div className="dsa-bg-shape dsa-bg-shape1"></div>
        <div className="dsa-bg-shape dsa-bg-shape2"></div>
        <div className="dsa-bg-shape dsa-bg-shape3"></div>
        <div className="dsa-bg-shape dsa-bg-shape4"></div>
      </div>
      <div className="dsa-chat-bg">
        <div className="dsa-chat-container">
          <div className="dsa-chat-header">
            <div className="dsa-chat-title">DSA Instructor <span role="img" aria-label="motivation"></span></div>
            <div className="dsa-chat-motivation">"Every great coder was once a beginner. Let's level up your DSA skills together!"</div>
            <button className="dsa-clear-btn" onClick={handleClearChat}>Clear Chat</button>
            <button
              className="dsa-clear-btn"
              style={{ right: 140, background: darkMode ? '#6366f1' : '#18181b', color: '#fff' }}
              onClick={() => setDarkMode((d) => !d)}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
          <div className="dsa-chat-messages" ref={chatContainerRef}>
            {messages.length === 0 ? (
              <div className="dsa-chat-empty">Say Hi! What do you want to learn about DSA today?</div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`dsa-chat-bubble-row ${msg.role === 'user' ? 'right' : 'left'}`}>
                  {msg.role === 'assistant' && (
                    <div className="dsa-avatar dsa-avatar-bot" title="DSA Instructor">🧑‍🏫</div>
                  )}
                  <div className={`dsa-chat-bubble ${msg.role}`}>{msg.text}</div>
                  {msg.role === 'user' && (
                    <div className="dsa-avatar dsa-avatar-user" title="You">🧑‍💻</div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="dsa-chat-bubble-row left">
                <div className="dsa-avatar dsa-avatar-bot">🧑‍🏫</div>
                <div className="dsa-chat-bubble assistant dsa-typing">
                  <span className="dsa-typing-dots">
                    <span>.</span><span>.</span><span>.</span>
                  </span>
                  Thinking...
                </div>
              </div>
            )}
            {error && (
              <div className="dsa-chat-error">{error}</div>
            )}
          </div>
          <div className="dsa-chat-input-row">
            <input
              type="text"
              className="dsa-chat-input"
              placeholder="Ask your DSA question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !loading) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={loading}
            />
            <button
              className="dsa-send-btn"
              onClick={handleSend}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
          <div className="dsa-footer">
            <span className="dsa-tip-icon" role="img" aria-label="tip">💡</span>
            <span><b>DSA Tip of the Day:</b> {getTipOfDay()}</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default ChatBox;
