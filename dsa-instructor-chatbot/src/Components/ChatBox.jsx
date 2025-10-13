import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Sun, Moon, Code2, Lightbulb, Sparkles } from 'lucide-react';
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

// Demo mode responses for fallback
const getDemoResponse = (input) => {
  const lower = input.toLowerCase();
  if (lower.includes('binary search')) {
    return "Binary Search is an efficient algorithm for finding an element in a sorted array. Think of it like finding a word in a dictionary - you don't start from page 1!\n\n**How it works:**\n1. Start at the middle element\n2. If target equals middle, you're done!\n3. If target < middle, search left half\n4. If target > middle, search right half\n5. Repeat until found or exhausted\n\n**Time Complexity:** O(log n)\n**Space Complexity:** O(1) iterative, O(log n) recursive\n\nWant to see code implementation?";
  }
  if (lower.includes('time complexity')) {
    return "Time Complexity measures how runtime grows with input size.\n\n**Common complexities:**\n- O(1): Constant - array access\n- O(log n): Logarithmic - binary search\n- O(n): Linear - single loop\n- O(n log n): Linearithmic - merge sort\n- O(n²): Quadratic - nested loops\n- O(2ⁿ): Exponential - recursive fibonacci\n\nFocus on the dominant term and drop constants!";
  }
  if (lower.includes('hello') || lower.includes('hi')) {
    return "Hello! 👋 I'm your DSA Instructor. I'm here to help you master Data Structures and Algorithms!\n\nYou can ask me about:\n- Algorithms (sorting, searching, graph algorithms)\n- Data structures (arrays, trees, graphs, heaps)\n- Problem-solving strategies\n- Time/space complexity analysis\n- Interview preparation tips\n\nWhat would you like to learn today?";
  }
  return "Great question! As your DSA instructor, I'd love to help you understand this concept better. In a production environment, I'm powered by Google's Gemini AI to give you detailed, personalized explanations.\n\nFor now, try asking me about:\n- Binary Search\n- Time Complexity\n- Or just say Hello!";
};

function ChatBox() {
  const [darkMode, setDarkMode] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

  const BACKEND_URL = 'http://localhost:5000/chat';

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    setLoading(true);
    setError(null);
    const cleanedInput = input.trim();
    const userMessage = { role: 'user', text: cleanedInput };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    try {
      // Try real API first with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: cleanedInput,
          history: updatedMessages.slice(-6) // Send last 3 exchanges for context
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      const botText = data.reply || 'Sorry, no response.';
      setMessages(prev => [...prev, { role: 'assistant', text: botText }]);
    } catch (err) {
      // Fallback to demo mode if API fails
      console.log('Using demo mode');
      setTimeout(() => {
        const demoResponse = getDemoResponse(cleanedInput);
        setMessages(prev => [...prev, { role: 'assistant', text: demoResponse }]);
        setLoading(false);
      }, 800);
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className={`chat-wrapper ${darkMode ? 'dark-mode' : ''}`}>
      {/* Floating background elements */}
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
      </div>

      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div className="header-content">
            <div className="header-left">
              <div className="header-icon">
                <Code2 className="icon" />
              </div>
              <div className="header-text">
                <h1 className="header-title">
                  DSA Instructor
                  <Sparkles className="sparkle-icon" />
                </h1>
                <p className="header-subtitle">Your AI Learning Companion</p>
              </div>
            </div>
            
            <div className="header-actions">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="icon-button theme-toggle"
                title={darkMode ? 'Light mode' : 'Dark mode'}
              >
                {darkMode ? <Sun className="icon" /> : <Moon className="icon" />}
              </button>
              <button
                onClick={handleClearChat}
                className="icon-button clear-button"
                title="Clear chat"
              >
                <Trash2 className="icon" />
              </button>
            </div>
          </div>
          
          <p className="header-motto">
            "Every great coder was once a beginner. Let's level up together!"
          </p>
        </div>

        {/* Chat Messages */}
        <div ref={chatContainerRef} className="chat-messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="welcome-card">
                <Code2 className="welcome-icon" />
                <h3 className="welcome-title">Welcome to DSA Instructor!</h3>
                <p className="welcome-text">
                  Ask me anything about Data Structures & Algorithms. I'm here to help you learn and grow!
                </p>
              </div>
              
              <div className="suggestions-grid">
                {['Explain Binary Search', 'What is Time Complexity?', 'Best sorting algorithm?', 'Graph traversal methods'].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="suggestion-button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} className={`message-row ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? '👤' : '🧑‍🏫'}
                  </div>
                  
                  <div className="message-bubble">
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="message-row assistant">
                  <div className="message-avatar">🧑‍🏫</div>
                  <div className="message-bubble loading">
                    <div className="loading-dots">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="error-message">{error}</div>
              )}
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="chat-input-area">
          <div className="input-row">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !loading) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask your DSA question..."
              disabled={loading}
              className="chat-input"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="send-button"
            >
              <Send className="icon" />
              <span className="button-text">Send</span>
            </button>
          </div>
          
          {/* Tip of the Day */}
          <div className="tip-container">
            <Lightbulb className="tip-icon" />
            <div className="tip-content">
              <p className="tip-label">DSA Tip of the Day</p>
              <p className="tip-text">{getTipOfDay()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatBox;