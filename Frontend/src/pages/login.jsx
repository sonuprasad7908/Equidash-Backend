import { useGoogleLogin } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import React, { useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff, TrendingUp, CheckCircle, AlertCircle, X } from 'lucide-react';
import { API } from '../utils/app';

const Toast = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md animate-fade-in ${
      type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-300' : 'bg-rose-900/90 border-rose-500/50 text-rose-300'
    }`}>
      {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 ml-1"><X size={14} /></button>
    </div>
  );
};

const InputField = ({ label, type = 'text', value, onChange, disabled, placeholder }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="mb-4">
      <label className="block text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">{label}</label>
      <div className="relative">
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          required
          className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700/60 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all disabled:opacity-50"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3.5 text-slate-400 hover:text-white transition-colors">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
};

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const response = await axios.post(`${API}/auth/google`, { token: tokenResponse.access_token });
        if (response.data?.status === 'success') onLogin(response.data.user);
        else showToast('Google verification failed.', 'error');
      } catch {
        showToast('Google login failed. Is your backend running?', 'error');
      } finally { setLoading(false); }
    },
    onError: () => showToast('Google login was cancelled.', 'error')
  });

  const responseFacebook = async (response) => {
    if (!response.accessToken) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/facebook`, { token: response.accessToken });
      if (res.data?.status === 'success') onLogin(res.data.user);
      else showToast('Facebook verification failed.', 'error');
    } catch {
      showToast('Facebook login failed. Is your backend running?', 'error');
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        if (!showOtpInput) {
          const response = await axios.post(`${API}/send-otp`, {
            email, name: name || email.split('@')[0], password, provider: 'email'
          });
          if (response.data.status === 'pending_verification' || response.data.status === 'success') {
            setShowOtpInput(true);
            showToast('OTP sent! Check your email inbox.', 'success');
          } else {
            showToast('Failed to send OTP. Try again.', 'error');
          }
        } else {
          const response = await axios.post(`${API}/verify-otp`, { email, otp: otp.trim() });
          if (response.data?.status === 'success') {
            showToast('Account verified! Logging in...', 'success');
            setTimeout(() => onLogin(response.data.user || response.data), 800);
          } else {
            showToast(`Verification failed: ${response.data.message || 'Invalid code.'}`, 'error');
          }
        }
      } else {
        const response = await axios.post(`${API}/login`, { email, password });
        if (response.data.status === 'success') onLogin(response.data.user || response.data);
      }
    } catch (error) {
      showToast(error.response?.data?.detail || error.response?.data?.message || 'Authentication failed.', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'radial-gradient(ellipse at top right, #1e1b4b 0%, #0f172a 50%, #000000 100%)' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Left Branding */}
      <div className="flex-1 hidden lg:flex flex-col justify-between px-16 py-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            <TrendingUp size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-white">Equi<span className="text-cyan-400">Dash</span></span>
        </div>
        <div className="max-w-lg">
          <h1 className="text-6xl font-bold text-white leading-tight mb-6">
            Trade Smarter<br />
            <span className="text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">With AI</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            Institutional-grade analytics, real-time market intelligence, and AI-powered forecasting — all in one terminal.
          </p>
          <div className="flex flex-wrap gap-3">
            {['AI Forecasting', 'Real-time Data', 'Paper Trading', 'Smart Analytics'].map(f => (
              <span key={f} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-slate-300">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>{f}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-8">
          {[['50+', 'NSE Stocks'], ['Live', 'Market Data'], ['AI', 'Powered']].map(([val, label]) => (
            <div key={label}>
              <p className="text-2xl font-bold text-cyan-400">{val}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-black/20 backdrop-blur-sm">
        <div className="w-full max-w-md">
          <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 shadow-2xl">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp size={16} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">Equi<span className="text-cyan-400">Dash</span></span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {showOtpInput ? '✉️ Verify Account' : isRegister ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              {showOtpInput ? 'Enter the 6-digit code sent to your email'
                : isRegister ? "Join EquiDash — it's free"
                : 'Sign in to your trading terminal'}
            </p>

            {!showOtpInput && (
              <>
                <button onClick={() => loginWithGoogle()} type="button" disabled={loading}
                  className="w-full mb-3 py-3 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 hover:-translate-y-0.5 shadow-lg">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
                <FacebookLogin appId="938075182128201" autoLoad={false} fields="name,email,picture" callback={responseFacebook}
                  render={renderProps => (
                    <button onClick={renderProps.onClick} type="button" disabled={loading}
                      className="w-full mb-5 py-3 bg-[#1877F2] hover:bg-[#0d65d9] text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 hover:-translate-y-0.5 shadow-lg">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Continue with Facebook
                    </button>
                  )}
                />
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700/60"></div></div>
                  <div className="relative flex justify-center"><span className="px-3 bg-slate-900/80 text-slate-500 text-xs uppercase tracking-widest">or continue with email</span></div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit}>
              {!showOtpInput && (
                <>
                  <InputField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} placeholder="you@example.com" />
                  {isRegister && <InputField label="Full Name" value={name} onChange={e => setName(e.target.value)} disabled={loading} placeholder="Your name" />}
                  <InputField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} placeholder="••••••••" />
                </>
              )}
              {showOtpInput && (
                <div className="mb-6">
                  <label className="block text-xs text-cyan-400 uppercase tracking-widest font-semibold mb-3">Verification Code</label>
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6} required disabled={loading} placeholder="000000"
                    className="w-full px-4 py-4 bg-slate-900/80 border-2 border-cyan-500/50 focus:border-cyan-400 rounded-xl text-white text-center tracking-[0.6em] text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all disabled:opacity-50" />
                  <p className="text-xs text-slate-500 text-center mt-2">Check your inbox for the 6-digit code</p>
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : showOtpInput ? 'VERIFY & LOGIN' : isRegister ? 'SEND OTP' : 'LOGIN'}
              </button>
            </form>

            {!showOtpInput && (
              <p className="text-center mt-5 text-slate-400 text-sm">
                {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                <button type="button" onClick={() => { setIsRegister(!isRegister); setToast(null); }} disabled={loading}
                  className="text-cyan-400 font-semibold hover:text-cyan-300 hover:underline disabled:opacity-50 transition-colors">
                  {isRegister ? 'Sign In' : 'Create Account'}
                </button>
              </p>
            )}
            {showOtpInput && (
              <button type="button" onClick={() => { setShowOtpInput(false); setOtp(''); }}
                className="w-full mt-3 py-2.5 text-slate-400 hover:text-white text-sm transition-colors">
                ← Back to registration
              </button>
            )}
          </div>
          <p className="text-center text-xs text-slate-600 mt-4">Paper trading only · No real money involved</p>
        </div>
      </div>
    </div>
  );
};

export default Login;