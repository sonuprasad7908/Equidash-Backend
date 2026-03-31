import { GoogleOAuthProvider } from '@react-oauth/google';
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './utils/app.css';
import './utils/index.css';

import LoadingScreen  from './components/LoadingScreen';
import Login          from './pages/login';
import Dashboard      from './pages/Dashboard';
import Pricing        from './pages/Pricing';
import PaymentSuccess from './pages/PaymentSuccess';

/* Full-screen tab pages (open in new browser tab, no sidebar) */
import Trading  from './pages/Trading';
import Research from './pages/Research';
import Tools    from './pages/Tools';
import Profile  from './pages/Profile';

import Layout, { ThemeProvider } from './components/layout';

function App() {
  const [user,       setUser]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  // Only show splash on the very first visit per browser session
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('eq_splash_done'));

  useEffect(() => {
    const stored = localStorage.getItem('EquiDash_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); }
      catch { localStorage.removeItem('EquiDash_user'); }
    }
    setLoading(false);
  }, []);

  const handleLogin         = u => { setUser(u);  localStorage.setItem('EquiDash_user', JSON.stringify(u)); };
  const handleLogout        = ()  => { setUser(null); localStorage.removeItem('EquiDash_user'); };
  const handleBalanceUpdate = b   => { const u = { ...user, balance: b }; setUser(u); localStorage.setItem('EquiDash_user', JSON.stringify(u)); };
  const handleUserUpdate    = u   => { setUser(u); localStorage.setItem('EquiDash_user', JSON.stringify(u)); };

  /* ── Splash / Loading ── */
  if (showSplash) return <LoadingScreen onComplete={() => {
    sessionStorage.setItem('eq_splash_done', '1');
    setShowSplash(false);
  }} />;

  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#030712' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid rgba(34,211,238,0.15)', borderTopColor:'#22d3ee', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── Route wrappers ── */
  /* Pages with sidebar */
  const Protected = ({ children }) =>
    user
      ? <Layout user={user} onLogout={handleLogout}>{children}</Layout>
      : <Navigate to="/login" replace />;

  /* Full-screen pages (no sidebar) opened in new tab */
  const ProtectedTab = ({ children }) =>
    user ? children : <Navigate to="/login" replace />;

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || '831186646421-99d9bg9i71g88c4ioplqq53usngcegg6.apps.googleusercontent.com'}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>

            {/* Public */}
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} />

            {/* Main dashboard */}
            <Route path="/"             element={<Protected><Dashboard   user={user} /></Protected>} />
            <Route path="/pricing"      element={<Protected><Pricing     user={user} onBalanceUpdate={handleBalanceUpdate} /></Protected>} />
            <Route path="/payment-success" element={<PaymentSuccess onBalanceUpdate={handleBalanceUpdate} />} />

            {/* Old routes → redirect to Trading (which has them as tabs) */}
            <Route path="/portfolio"    element={<Navigate to="/trading" replace />} />
            <Route path="/transactions" element={<Navigate to="/trading" replace />} />
            <Route path="/watchlist"    element={<Navigate to="/trading" replace />} />
            <Route path="/alerts"       element={<Navigate to="/trading" replace />} />

            {/* Full-screen tab pages (no sidebar) */}
            <Route path="/trading"  element={<ProtectedTab><Trading user={user} /></ProtectedTab>} />
            <Route path="/research" element={<ProtectedTab><Research /></ProtectedTab>} />
            <Route path="/tools"    element={<ProtectedTab><Tools /></ProtectedTab>} />
            <Route path="/profile"  element={<ProtectedTab><Profile user={user} onUserUpdate={handleUserUpdate} onLogout={handleLogout} /></ProtectedTab>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />

          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;