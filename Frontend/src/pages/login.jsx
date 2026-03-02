import { useGoogleLogin } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import React, { useState } from 'react';
import axios from 'axios';

// IMPORTANT: Ensure this matches your backend.
const API = "http://localhost:8001/api";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState(''); 
  const [otp, setOtp] = useState('');           
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false); 

  // --- GOOGLE LOGIN HOOK ---
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log("GOOGLE TOKEN RECEIVED! Sending to Backend...", tokenResponse);
      setLoading(true);
      try {
        const response = await axios.post(`${API}/auth/google`, { token: tokenResponse.access_token });
        if (response.data && response.data.status === 'success') {
          console.log("PYTHON SAYS SUCCESS! Switching to Dashboard...");
          onLogin(response.data.user); 
        } else {
          alert("Backend verification failed.");
        }
      } catch (error) {
        console.error("Google Backend Error", error);
        alert("Server failed to process Google Login. Is your Python server running?");
      } finally {
        setLoading(false);
      }
    },
    onError: error => console.log('Google Login Failed:', error)
  });

  // --- FACEBOOK LOGIN HOOK ---
  const responseFacebook = async (response) => {
    console.log("FACEBOOK RESPONSE RECEIVED!", response);
    
    // If user closes popup, accessToken won't exist
    if (response.accessToken) {
      setLoading(true);
      try {
        // We will build this Python route in the next step!
        const res = await axios.post(`${API}/auth/facebook`, { token: response.accessToken });
        if (res.data && res.data.status === 'success') {
          console.log("PYTHON SAYS SUCCESS! Switching to Dashboard...");
          onLogin(res.data.user); 
        } else {
          alert("Backend verification failed.");
        }
      } catch (error) {
        console.error("Facebook Backend Error", error);
        alert("Server failed to process Facebook Login. Is Python running?");
      } finally {
        setLoading(false);
      }
    } else {
      console.log("Facebook login was cancelled or failed.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        if (!showOtpInput) {
          const response = await axios.post(`${API}/send-otp`, {
            email,
            name: name || email.split('@')[0],
            password,
            provider: 'email'
          });
          
          if (response.data.status === 'pending_verification' || response.data.status === 'success') {
            setShowOtpInput(true);
            alert('OTP sent! Please check your email.');
          } else {
            alert('Something went wrong sending the OTP.');
          }
        } else {
          const cleanOtp = otp.trim();
          const response = await axios.post(`${API}/verify-otp`, { email, otp: cleanOtp });
          
          if (response.data && (response.data.status === 'success' || response.data.message === 'success')) {
            onLogin(response.data.user || response.data); 
          } else {
            alert(`Verification failed: ${response.data.message || response.data.detail || 'Please check the code.'}`);
          }
        }
      } else {
        const response = await axios.post(`${API}/login`, { email, password });
        if (response.data.status === 'success') {
          onLogin(response.data.user || response.data);
        }
      }
    } catch (error) {
      console.error("API Error:", error.response?.data);
      alert(error.response?.data?.detail || error.response?.data?.message || 'Authentication failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'radial-gradient(circle at top right, #1e1b4b, #0f172a)' }}>
      {/* LEFT SIDE - BRANDING */}
      <div className="flex-1 hidden lg:flex flex-col justify-center px-12 py-12">
        <div className="max-w-md">
          <h1 className="text-6xl font-bold mb-4 text-white">
            Stock<span className="text-blue-500">Edge</span>
            <br />
            <span className="font-light opacity-70">Terminal</span>
          </h1>
          <p className="text-gray-400 text-xl mt-4">
            Institutional-grade analytics, AI forecasting, and real-time market intelligence.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="flex-1 flex items-center justify-center bg-[#0b1120] p-8">
        <div className="w-full max-w-md bg-[#1e293b] p-10 rounded-2xl border border-gray-800 shadow-2xl">
          <h2 className="text-2xl font-bold mb-2 text-white">
            {showOtpInput ? 'Verify Account' : isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            {showOtpInput ? 'Enter the code sent to your Gmail' : isRegister ? 'Join StockEdge Pro' : 'Enter your credentials'}
          </p>

          {!showOtpInput && (
            <>
              {/* GOOGLE BUTTON */}
              <button 
                onClick={() => loginWithGoogle()} 
                type="button" 
                disabled={loading}
                className="w-full mb-3 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Processing...' : 'Continue with Google'}
              </button>

              {/* FACEBOOK BUTTON WRAPPER */}
              <FacebookLogin
                appId="938075182128201"
                autoLoad={false}
                fields="name,email,picture"
                callback={responseFacebook}
                render={renderProps => (
                  <button 
                    onClick={renderProps.onClick} 
                    type="button"
                    disabled={loading}
                    className="w-full mb-4 py-3 bg-[#1877F2] text-white rounded-lg font-semibold hover:bg-[#0d65d9] transition flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    {loading ? 'Processing...' : 'Continue with Facebook'}
                  </button>
                )}
              />

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#1e293b] text-gray-400">OR</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-400 text-xs mb-2">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={showOtpInput || loading}
                className="w-full p-2 bg-[#0b1120] border border-gray-700 rounded text-white outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            {isRegister && !showOtpInput && (
              <div className="mb-4">
                <label className="block text-gray-400 text-xs mb-2">NAME</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full p-2 bg-[#0b1120] border border-gray-700 rounded text-white outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>
            )}

            {!showOtpInput && (
              <div className="mb-4">
                <label className="block text-gray-400 text-xs mb-2">PASSWORD</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full p-2 bg-[#0b1120] border border-gray-700 rounded text-white outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>
            )}

            {showOtpInput && (
              <div className="mb-4">
                <label className="block text-blue-400 text-xs mb-2 font-bold">VERIFICATION CODE (OTP)</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  disabled={loading}
                  className="w-full p-3 bg-[#0b1120] border-2 border-blue-500 rounded text-white text-center tracking-[0.5em] text-xl font-bold disabled:opacity-50"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition shadow-lg active:scale-95 disabled:opacity-70"
            >
              {loading ? 'PROCESSING...' : showOtpInput ? 'VERIFY & LOGIN' : isRegister ? 'SEND OTP' : 'INITIALIZE SESSION'}
            </button>
          </form>

          {!showOtpInput && (
            <p className="text-center mt-6 text-gray-400 text-sm">
              {isRegister ? 'Already have an account? ' : 'New user? '}
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                disabled={loading}
                className="text-blue-500 font-semibold hover:underline disabled:opacity-50"
              >
                {isRegister ? 'Login' : 'Create Account'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;