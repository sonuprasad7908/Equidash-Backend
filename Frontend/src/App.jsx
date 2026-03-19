import { GoogleOAuthProvider } from '@react-oauth/google';
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './utils/app.css';
import './utils/index.css';

import LoadingScreen from './components/LoadingScreen';
import Login from './pages/login';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/portfolio';
import News from './pages/News';
import Pricing from './pages/Pricing';
import PaymentSuccess from './pages/PaymentSuccess';
import Watchlist from './pages/Watchlist';
import Screener from './pages/Screener';
import IPO from './pages/IPO';
import Calculator from './pages/Calculator';
import Alerts from './pages/Alerts';
import Transactions from './pages/Transactions';
import Compare from './pages/Compare';
import Profile from './pages/Profile';
import HeatMap from './pages/HeatMap';
import Trading from './pages/Trading';
import Research from './pages/Research';
import Tools from './pages/Tools';
import Layout, { ThemeProvider } from './components/layout';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('EquiDash_user');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); }
      catch (e) { localStorage.removeItem('EquiDash_user'); }
    }
    setLoading(false);
  }, []);

  const handleLogin = (u) => { setUser(u); localStorage.setItem('EquiDash_user', JSON.stringify(u)); };
  const handleLogout = () => { setUser(null); localStorage.removeItem('EquiDash_user'); };
  const handleBalanceUpdate = (b) => {
    const u = { ...user, balance: b };
    setUser(u); localStorage.setItem('EquiDash_user', JSON.stringify(u));
  };
  const handleUserUpdate = (u) => { setUser(u); localStorage.setItem('EquiDash_user', JSON.stringify(u)); };

  // Show splash screen on first load
  if (showSplash) {
    return <LoadingScreen onComplete={() => setShowSplash(false)} />;
  }

  if (loading) return (
    <div className="h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
    </div>
  );

  const ProtectedRoute = ({ children }) =>
    user ? <Layout user={user} onLogout={handleLogout}>{children}</Layout> : <Navigate to="/login" replace />;

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || "831186646421-99d9bg9i71g88c4ioplqq53usngcegg6.apps.googleusercontent.com"}>
      <ThemeProvider>
        <div className="dark">
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} />
              <Route path="/" element={<ProtectedRoute><Dashboard user={user} /></ProtectedRoute>} />
              <Route path="/portfolio" element={<ProtectedRoute><Portfolio user={user} /></ProtectedRoute>} />
              <Route path="/transactions" element={<ProtectedRoute><Transactions user={user} /></ProtectedRoute>} />
              <Route path="/watchlist" element={<ProtectedRoute><Watchlist user={user} /></ProtectedRoute>} />
              <Route path="/alerts" element={<ProtectedRoute><Alerts user={user} /></ProtectedRoute>} />
              <Route path="/screener" element={<ProtectedRoute><Screener /></ProtectedRoute>} />
              <Route path="/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
              <Route path="/heatmap" element={<ProtectedRoute><HeatMap /></ProtectedRoute>} />
              <Route path="/ipo" element={<ProtectedRoute><IPO /></ProtectedRoute>} />
              <Route path="/calculator" element={<ProtectedRoute><Calculator /></ProtectedRoute>} />
              <Route path="/news" element={<ProtectedRoute><News user={user} /></ProtectedRoute>} />
              <Route path="/pricing" element={<ProtectedRoute><Pricing user={user} onBalanceUpdate={handleBalanceUpdate} /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile user={user} onUserUpdate={handleUserUpdate} onLogout={handleLogout} /></ProtectedRoute>} />
              <Route path="/payment-success" element={<PaymentSuccess onBalanceUpdate={handleBalanceUpdate} />} />
              <Route path="/trading" element={<ProtectedRoute><Trading user={user} /></ProtectedRoute>} />
              <Route path="/research" element={<ProtectedRoute><Research /></ProtectedRoute>} />
              <Route path="/tools" element={<ProtectedRoute><Tools /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
            </Routes>
          </BrowserRouter>
        </div>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;