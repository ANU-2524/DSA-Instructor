import React from 'react';
import ChatBox from './Components/ChatBox';

function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <ChatBox />
    </div>
  );
}

export default App;