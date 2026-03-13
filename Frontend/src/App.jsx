import { GoogleOAuthProvider } from '@react-oauth/google';
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './utils/app.css'; 
import './utils/index.css'; 

// MATCHING YOUR SIDEBAR EXACTLY:
import Login from './pages/login';         
import Dashboard from './pages/Dashboard'; 
import Portfolio from './pages/portfolio'; 
import News from './pages/News';           
import Layout from './components/layout';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('EquiDash_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('EquiDash_user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    console.log("LOGIN SUCCESS! Switching to Dashboard.");
    setUser(userData);
    localStorage.setItem('EquiDash_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('EquiDash_user');
  };

  if (loading) {
    return <div className="h-screen bg-[#0f172a] text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <GoogleOAuthProvider clientId="831186646421-99d9bg9i71g88c4ioplqq53usngcegg6.apps.googleusercontent.com">
      <div className="dark"> 
        <BrowserRouter>
          <Routes>
            <Route 
              path="/login" 
              element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} 
            />
            <Route
              path="/"
              element={
                user ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <Dashboard user={user} />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/portfolio"
              element={
                user ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <Portfolio user={user} />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/news"
              element={
                user ? (
                  <Layout user={user} onLogout={handleLogout}>
                    <News user={user} />
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;