import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API } from '../utils/app';
import { Send, X, Bot, Trash2 } from 'lucide-react';

// --- TYPEWRITER EFFECT ---
const TypewriterText = ({ text, delay = 12 }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
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

// --- SMART TICKER DETECTOR ---
// Detects any known NSE stock ticker mentioned in the message
const detectTicker = (message) => {
  const upperMsg = message.toUpperCase();

  const knownTickers = [
    'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK',
    'SBIN', 'TATAMOTORS', 'TATASTEEL', 'WIPRO', 'HCLTECH',
    'BAJFINANCE', 'BAJAJFINSV', 'MARUTI', 'SUNPHARMA', 'ONGC',
    'NTPC', 'POWERGRID', 'ADANIENT', 'ADANIPORTS', 'ULTRACEMCO',
    'ASIANPAINT', 'NESTLEIND', 'BRITANNIA', 'DIVISLAB', 'DRREDDY',
    'CIPLA', 'APOLLOHOSP', 'TECHM', 'LTIM', 'LT',
    'AXISBANK', 'KOTAKBANK', 'INDUSINDBK', 'FEDERALBNK', 'IDFCFIRSTB',
    'ITC', 'HINDUNILVR', 'TITAN', 'TRENT', 'DMART',
    'ZOMATO', 'PAYTM', 'NYKAA', 'POLICYBZR', 'IRCTC',
    'COALINDIA', 'BPCL', 'IOC', 'GAIL', 'VEDL',
    'JSWSTEEL', 'HINDALCO', 'SAIL', 'NMDC', 'RECLTD',
    'PFC', 'IRFC', 'HUDCO', 'NBCC', 'BEL',
    'HAL', 'BHEL', 'CONCOR', 'BALKRISIND', 'MOTHERSON',
  ];

  for (const ticker of knownTickers) {
    if (upperMsg.includes(ticker)) {
      return ticker;
    }
  }

  // Regex fallback: match words in ALL CAPS (2-10 chars) that look like tickers
  const capMatch = upperMsg.match(/\b[A-Z]{2,10}\b/g);
  if (capMatch) {
    const excluded = ["THE", "AND", "FOR", "BUY", "SELL", "NSE", "BSE", "IPO", "AI", "OF", "IN", "IS", "IT", "NEWS", "MARKET", "PORTFOLIO", "ANALYSIS", "STOCK", "PRICE", "TODAY", "BEST", "SUGGEST", "SUGGESTION"];
    const filtered = capMatch.filter(w => !excluded.includes(w));
    if (filtered.length > 0) return filtered[0];
  }

  return 'SBIN'; // Default fallback
};

// --- MAIN CHATBOT COMPONENT ---
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
    'Buy Suggestion for RELIANCE',
    'Price of TATAMOTORS',
    'Analyse HDFCBANK',
    'Portfolio Analysis',
    'Best stocks to buy today',
  ];

  const handleSend = async (message = input) => {
    if (!message.trim()) return;

    setMessages((prev) => [...prev, { type: 'user', text: message }]);
    setInput('');
    setLoading(true);

    try {
      // ✅ Smart ticker detection — works for any NSE stock
      const detectedTicker = detectTicker(message);

      const response = await axios.post(`${API}/chat`, {
        user_id: user?.id || 'guest',
        message: message,
        ticker: detectedTicker
      });

      const botReply = response.data.reply || response.data.response || "Analysis complete.";

      setMessages((prev) => [...prev, { type: 'bot', text: botReply }]);
    } catch (error) {
      console.error("Chat API Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          text: 'Sorry, my AI servers are currently taking a breather. Please try again in a moment!'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        type: 'bot',
        text: 'Chat cleared! 👋 How can I help you navigate the market today?'
      }
    ]);
  };

  return (
    <div
      className="fixed bottom-24 right-8 w-96 h-[620px] bg-[#1e293b] rounded-2xl shadow-2xl border border-gray-700 flex flex-col z-50"
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
        <div className="flex items-center gap-2">
          {/* Clear chat button */}
          <button
            onClick={handleClearChat}
            className="text-gray-400 hover:text-red-400 transition"
            title="Clear chat"
          >
            <Trash2 size={18} />
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0b1221]">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-end gap-2 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* Bot avatar */}
            {msg.type === 'bot' && (
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
                <Bot size={14} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.type === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-700 text-gray-100 rounded-bl-none'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.type === 'bot' && index === messages.length - 1 ? (
                  <TypewriterText text={msg.text} />
                ) : (
                  msg.text
                )}
              </p>
            </div>
          </div>
        ))}

        {/* Loading dots */}
        {loading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-gray-700 p-3 rounded-lg rounded-bl-none">
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
        <p className="text-xs text-gray-500 mb-2">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleSend(action)}
              disabled={loading}
              className="text-xs px-3 py-1 bg-blue-500 bg-opacity-10 border border-blue-500 text-blue-400 rounded-full hover:bg-blue-500 hover:text-white transition disabled:opacity-50"
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
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
            placeholder="Ask about any stock... e.g. Analyse TCS"
            className="flex-1 bg-[#0f172a] border border-gray-700 text-white rounded-lg px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
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