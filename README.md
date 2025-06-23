# 🧠 DSA Instructor — Your AI-Powered Learning Companion

Welcome to **DSA Instructor**, a smart chatbot designed to help students master **Data Structures and Algorithms (DSA)** with personalized guidance, real-world explanations, and AI-generated answers.

🌐 **Live Site**: [Ask from DSA-ChatBot](https://onlydsa.netlify.app/)

---

## 🚀 Features

- 💬 Chat-based Q&A for DSA doubts  
- 🤖 Powered by **Google's Gemini 1.5 Flash (LLM)**  
- 🧠 Remembers your **name** and **goal** to personalize learning  
- 📦 Saves chat history in browser using `localStorage`  
- 🔄 Backend API integration with real-time responses  
- 🧹 "Clear Chat" button to reset your session anytime  
- 📱 Fully responsive, minimal UI

---

## 🧠 How It Works

1. User sends a DSA-related question (e.g., "Explain Binary Search").
2. The app sends the prompt and user memory (name, goal) to the backend.
3. The backend uses **Gemini 1.5 Flash** (via Google Generative Language API) to generate a response based on a teaching-focused system prompt.
4. Response is shown to the user in a clean chat interface.

---

## 🛠️ Tech Stack

### Frontend:
- React.js (with Hooks + `useRef`)
- Tailored chat interface
- `localStorage` for persistence

