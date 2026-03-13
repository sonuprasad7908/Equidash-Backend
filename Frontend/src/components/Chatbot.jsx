import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API } from '../utils/app';
import { Send, X, Bot, User } from 'lucide-react';

// --- THE NEW TYPEWRITER MACHINE ---
const TypewriterText = ({ text, delay = 15 }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Reset if the text changes
    setCurrentText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText(prevText => prevText + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, delay);
      
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);

  return <span>{currentText}</span>;
};
// -----------------------------------

const Chatbot = ({ user, onClose }) => {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Hello! 👋 I am EquiDash AI. How can I help you navigate the market today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickActions = [
    'Market News',
    'Buy Suggestion',
    'Price of TATAMOTORS',
    'Portfolio Analysis'
  ];

  const handleSend = async (message = input) => {
    if (!message.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { type: 'user', text: message }]);
    setInput('');
    setLoading(true);

    try {
      // Small logic to dynamically guess the ticker if mentioned
      const guessedTicker = message.toUpperCase().includes('TATAMOTORS') ? 'TATAMOTORS' : 'SBIN';

      const response = await axios.post(`${API}/chat`, {
        user_id: user?.id || 'guest',
        message: message,
        ticker: guessedTicker // Sends the ticker to Python!
      });

      // THE FIX: Looking for .reply instead of .response
      const botReply = response.data.reply || response.data.response || "Analysis complete.";

      // Add bot response
      setMessages((prev) => [
        ...prev,
        { type: 'bot', text: botReply }
      ]);
    } catch (error) {
      console.error("Chat API Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          text: 'Sorry, my AI servers are currently taking a breather. Please try again!'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed bottom-24 right-8 w-96 h-[600px] bg-[#1e293b] rounded-2xl shadow-2xl border border-gray-700 flex flex-col z-50"
      data-testid="chatbot-container"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="font-bold text-white">EquiDash AI</h3>
            <p className="text-xs text-green-500">● Online</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X size={24} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0b1221]">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.type === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-700 text-gray-100 rounded-bl-none'
              }`}
            >
              {/* 🚀 THE TYPEWRITER UPGRADE IS HERE */}
              <p className="text-sm whitespace-pre-wrap">
                {msg.type === 'bot' ? (
                  <TypewriterText text={msg.text} />
                ) : (
                  msg.text
                )}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 p-3 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-gray-700">
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleSend(action)}
              className="text-xs px-3 py-1 bg-blue-500 bg-opacity-10 border border-blue-500 text-blue-400 rounded-full hover:bg-blue-500 hover:text-white transition"
              data-testid={`quick-action-${index}`}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything..."
            className="flex-1 bg-[#0f172a] border border-gray-700 text-white rounded-lg px-4 py-2 text-sm"
            disabled={loading}
            data-testid="chat-input"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
            data-testid="send-chat-btn"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;