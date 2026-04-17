import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './utils/index.css'; // FIXED: Changed from '@/index.css' to direct relative path

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);