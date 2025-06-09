import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function ChatBox() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chatMessages');
    return saved ? JSON.parse(saved) : [];
  });

  const [input, setInput] = useState('');

  const [memory, setMemory] = useState(() => {
    const saved = localStorage.getItem('chatMemory');
    return saved ? JSON.parse(saved) : { name: '', goal: '' };
  });

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

  const handleSend = async () => {
    if (!input.trim()) return;

    const cleanedInput = input.trim();
    const userMessage = { role: 'user', text: cleanedInput };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    updateMemoryFromInput(cleanedInput); // will update memory but async

    const prompt = `
User Info:
Name: ${memory.name || 'unknown'}
Goal: ${memory.goal || 'not specified'}

Message:
${cleanedInput}
    `;

    try {
      const response = await axios.post('http://localhost:5000/chat', { prompt });
      const botText = response.data.reply || 'Sorry, no response.';
      setMessages([...updatedMessages, { role: 'assistant', text: botText }]);
    } catch (err) {
      console.error('API Error:', err);
      setMessages([
        ...updatedMessages,
        { role: 'assistant', text: 'Failed to fetch response from server.' },
      ]);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setMemory({ name: '', goal: '' });
    localStorage.removeItem('chatMessages');
    localStorage.removeItem('chatMemory');
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 700,
        margin: '50px auto',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        height: '80vh',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: 10 }}>DSA Instructor Chat</h2>
      <button
        onClick={handleClearChat}
        style={{
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          padding: '8px 14px',
          borderRadius: 6,
          marginBottom: 10,
          cursor: 'pointer',
          fontWeight: 'bold',
          alignSelf: 'flex-end',
        }}
      >
        Clear Chat
      </button>

      <div
        ref={chatContainerRef}
        style={{
          flexGrow: 1,
          overflowY: 'auto',
          border: '1px solid #ccc',
          padding: 10,
          marginBottom: 15,
          borderRadius: 8,
          backgroundColor: '#f9f9f9',
        }}
      >
        {messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>
            Say hi! What do you want to learn about DSA today?
          </p>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              style={{
                textAlign: msg.role === 'user' ? 'right' : 'left',
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  padding: 10,
                  borderRadius: 12,
                  maxWidth: '75%',
                  backgroundColor: msg.role === 'user' ? '#cce5ff' : '#e9ecef',
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-line',
                  fontSize: 15,
                  lineHeight: 1.4,
                }}
              >
                {msg.text}
              </span>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <input
          type="text"
          placeholder="Ask your DSA question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          style={{
            flexGrow: 1,
            padding: 12,
            fontSize: 16,
            borderRadius: 6,
            border: '1px solid #ccc',
            height: 40,
          }}
        />
        <button
          onClick={handleSend}
          style={{
            padding: '0 20px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 16,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatBox;
