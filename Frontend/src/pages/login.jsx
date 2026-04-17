import { useGoogleLogin } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Eye, EyeOff, TrendingUp, CheckCircle, AlertCircle, X, Zap, Shield } from 'lucide-react';
import { API } from '../utils/app';

/* ─── Inject CSS into <head> once — avoids style-inside-grid bug ─── */
const injectCSS = () => {
  if (document.getElementById('lp-styles')) return;
  const el = document.createElement('style');
  el.id = 'lp-styles';
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Syne:wght@700;800&family=Inter:wght@400;500;600;700;800;900&display=swap');

    /* ── Page reset ── */
    html,body,#root{height:100%;margin:0;padding:0;box-sizing:border-box;}
    *{box-sizing:border-box;}

    /* ── Root: 2-column grid ── */
    .lp-root{
      font-family:'Inter',sans-serif;
      width:100vw;height:100vh;
      background:#030712;
      display:grid;
      grid-template-columns:420px 1fr;
      grid-template-rows:100vh;
      overflow:hidden;
      position:relative;
    }

    /* ── Grid background ── */
    .lp-root::before{
      content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
      background-image:
        linear-gradient(rgba(34,211,238,0.025) 1px,transparent 1px),
        linear-gradient(90deg,rgba(34,211,238,0.025) 1px,transparent 1px);
      background-size:52px 52px;
      mask-image:radial-gradient(ellipse 100% 80% at 50% 0%,black 30%,transparent 100%);
      -webkit-mask-image:radial-gradient(ellipse 100% 80% at 50% 0%,black 30%,transparent 100%);
    }

    /* ── Left panel ── */
    .lp-left{
      grid-column:1;
      position:relative;z-index:2;
      display:flex;flex-direction:column;
      height:100vh;
      padding:26px 36px;
      overflow:hidden;
      border-right:1px solid rgba(255,255,255,0.06);
      background:rgba(4,8,18,0.65);
      backdrop-filter:blur(6px);
      -webkit-backdrop-filter:blur(6px);
    }

    /* ── Right panel ── */
    .lp-right{
      grid-column:2;
      position:relative;z-index:2;
      display:flex;align-items:center;justify-content:center;
      height:100vh;
      padding:16px 36px;
      overflow-y:auto;overflow-x:hidden;
    }
    .lp-right::-webkit-scrollbar{width:4px;}
    .lp-right::-webkit-scrollbar-track{background:transparent;}
    .lp-right::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:8px;}

    /* ── Card ── */
    .lp-card{
      width:100%;max-width:400px;
      border-radius:20px;padding:24px;
      background:rgba(9,15,28,0.96);
      border:1px solid rgba(255,255,255,0.09);
      backdrop-filter:blur(32px);
      -webkit-backdrop-filter:blur(32px);
      box-shadow:0 32px 80px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.07);
      position:relative;overflow:hidden;
    }

    /* ── Input ── */
    .lp-inp{
      width:100%;padding:11px 14px;border-radius:12px;
      background:rgba(255,255,255,0.04);
      border:1px solid rgba(255,255,255,0.09);
      color:#f1f5f9;font-size:14px;
      font-family:'Inter',sans-serif;
      outline:none;
      transition:border-color 0.18s,box-shadow 0.18s;
      caret-color:#22d3ee;
    }
    .lp-inp:focus{
      border-color:rgba(34,211,238,0.5);
      box-shadow:0 0 0 3px rgba(34,211,238,0.08);
    }
    .lp-inp::placeholder{color:#334155;}

    /* ── Social btn ── */
    .lp-social{
      width:100%;display:flex;align-items:center;justify-content:center;gap:8px;
      padding:11px 16px;border-radius:12px;
      font-size:13px;font-weight:700;cursor:pointer;
      transition:background 0.18s,box-shadow 0.18s;
    }

    /* ── Submit btn ── */
    .lp-submit{
      width:100%;padding:13px;border-radius:12px;border:none;
      font-size:14px;font-weight:900;letter-spacing:0.05em;
      color:#030712;cursor:pointer;
      background:linear-gradient(135deg,#06b6d4,#3b82f6);
      box-shadow:0 0 24px rgba(34,211,238,0.3);
      transition:filter 0.18s,transform 0.18s,box-shadow 0.18s;
    }
    .lp-submit:hover:not(:disabled){
      filter:brightness(1.12);transform:translateY(-1px);
      box-shadow:0 0 36px rgba(34,211,238,0.55);
    }
    .lp-submit:disabled{opacity:0.45;cursor:not-allowed;}

    /* ── OR divider ── */
    .lp-or{position:relative;text-align:center;margin:10px 0;}
    .lp-or::before{content:'';position:absolute;left:0;right:0;top:50%;height:1px;background:rgba(255,255,255,0.07);}
    .lp-or span{
      position:relative;background:rgba(9,15,28,0.97);
      padding:0 12px;font-size:10px;color:#334155;
      text-transform:uppercase;letter-spacing:0.15em;font-weight:700;
    }

    /* ── Scan line on card ── */
    .lp-scan{
      position:absolute;left:0;right:0;height:1px;
      background:linear-gradient(90deg,transparent,rgba(34,211,238,0.3),transparent);
      animation:lp-scan 5s linear infinite;pointer-events:none;z-index:0;
    }
    @keyframes lp-scan{0%{top:-2px}100%{top:calc(100% + 2px)}}

    /* ── Ticker pill ── */
    .lp-tick{
      display:inline-flex;align-items:center;gap:5px;
      padding:4px 10px;border-radius:99px;
      border:1px solid rgba(255,255,255,0.08);
      background:rgba(255,255,255,0.04);
      font-size:11px;white-space:nowrap;
    }

    /* ── Grad text ── */
    .lp-grad{
      background:linear-gradient(135deg,#22d3ee,#3b82f6,#8b5cf6);
      background-size:200% 200%;
      animation:lp-grad 4s ease infinite;
      -webkit-background-clip:text;
      -webkit-text-fill-color:transparent;
      background-clip:text;
    }
    @keyframes lp-grad{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}

    /* ── Logo glow ── */
    .lp-glow{animation:lp-glow 3s ease-in-out infinite;}
    @keyframes lp-glow{
      0%,100%{box-shadow:0 0 18px rgba(34,211,238,0.28)}
      50%{box-shadow:0 0 36px rgba(34,211,238,0.6)}
    }

    /* ── Spinner ── */
    @keyframes lp-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    .lp-spinner{
      display:inline-block;width:14px;height:14px;border-radius:50%;
      border:2px solid rgba(0,0,0,0.2);border-top-color:#030712;
      animation:lp-spin 0.7s linear infinite;
    }

    /* ── Orbs ── */
    @keyframes lp-orb1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(18px,-12px) scale(1.04)}}
    @keyframes lp-orb2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-12px,10px) scale(0.96)}}

    /* ── Mobile: 960px ── */
    @media(max-width:960px){
      .lp-root{grid-template-columns:1fr;grid-template-rows:auto;}
      .lp-left{display:none;}
      .lp-right{grid-column:1;height:100vh;}
    }
    @media(max-width:480px){
      .lp-right{padding:16px;}
      .lp-card{padding:22px;border-radius:18px;}
    }
  `;
  document.head.appendChild(el);
};

/* ─── Particle canvas ─── */
const ParticleCanvas = () => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); let raf;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const pts = Array.from({ length: 50 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.1 + 0.3,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > c.width) p.vx *= -1;
        if (p.y < 0 || p.y > c.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34,211,238,0.4)'; ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(34,211,238,${0.08 * (1 - d / 100)})`;
            ctx.lineWidth = 0.6; ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
};

/* ─── Toast ─── */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const ok = type === 'success';
  return (
    <div style={{
      position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 400,
      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 18px',
      borderRadius: 14, backdropFilter: 'blur(24px)',
      background: ok ? 'rgba(4,22,14,0.97)' : 'rgba(22,4,4,0.97)',
      border: `1px solid ${ok ? 'rgba(52,211,153,0.35)' : 'rgba(251,113,133,0.35)'}`,
      color: ok ? '#34d399' : '#fb7185',
      boxShadow: '0 8px 32px rgba(0,0,0,0.65)',
      whiteSpace: 'nowrap', fontSize: 13, fontFamily: "'Inter',sans-serif",
    }}>
      {ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
      <span style={{ fontWeight: 600 }}>{message}</span>
      <button onClick={onClose} style={{ opacity: 0.5, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', marginLeft: 4 }}
        onMouseEnter={e => e.currentTarget.style.opacity = 1}
        onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>
        <X size={13} />
      </button>
    </div>
  );
};

/* ═══════════════════════════════
   MAIN LOGIN COMPONENT
═══════════════════════════════ */
const Login = ({ onLogin }) => {
  /* Inject CSS into <head> on mount */
  useEffect(() => { injectCSS(); }, []);

  const [email, setEmail]         = useState('');
  const [name, setName]           = useState('');
  const [password, setPassword]   = useState('');
  const [otp, setOtp]             = useState('');
  const [loading, setLoading]     = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [showOtp, setShowOtp]     = useState(false);
  const [toast, setToast]         = useState(null);
  const [showPwd, setShowPwd]     = useState(false);

  const say = (msg, type = 'success') => setToast({ message: msg, type });

  /* ── Google OAuth ── */
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async t => {
      setLoading(true);
      try {
        const r = await axios.post(`${API}/auth/google`, { token: t.access_token });
        if (r.data?.status === 'success') onLogin(r.data.user);
        else say('Google verification failed.', 'error');
      } catch { say('Google login failed. Is the backend running?', 'error'); }
      finally { setLoading(false); }
    },
    onError: () => say('Google login cancelled.', 'error'),
  });

  /* ── Facebook OAuth ── */
  const responseFacebook = async r => {
    if (!r.accessToken) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/facebook`, { token: r.accessToken });
      if (res.data?.status === 'success') onLogin(res.data.user);
      else say('Facebook verification failed.', 'error');
    } catch { say('Facebook login failed.', 'error'); }
    finally { setLoading(false); }
  };

  /* ── Email form ── */
  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      if (isRegister) {
        if (!showOtp) {
          const r = await axios.post(`${API}/send-otp`, {
            email, name: name || email.split('@')[0], password, provider: 'email',
          });
          if (r.data.status === 'pending_verification' || r.data.status === 'success') {
            setShowOtp(true); say('OTP sent! Check your inbox.');
          } else say('Failed to send OTP.', 'error');
        } else {
          const r = await axios.post(`${API}/verify-otp`, { email, otp: otp.trim() });
          if (r.data?.status === 'success') {
            say('Verified! Logging in…');
            setTimeout(() => onLogin(r.data.user || r.data), 800);
          } else say(`Failed: ${r.data.message || 'Invalid code.'}`, 'error');
        }
      } else {
        const r = await axios.post(`${API}/login`, { email, password });
        if (r.data.status === 'success') onLogin(r.data.user || r.data);
        else say(r.data.detail || r.data.message || 'Login failed.', 'error');
      }
    } catch (err) {
      say(err.response?.data?.detail || err.response?.data?.message || err.message || 'Authentication failed. Check your email and password.', 'error');
    } finally { setLoading(false); }
  };

  const tickers = [
    { s: 'NIFTY',    p: '₹22,411', c:  0.63 },
    { s: 'SENSEX',   p: '₹73,847', c:  0.58 },
    { s: 'RELIANCE', p: '₹2,934',  c:  1.24 },
    { s: 'TCS',      p: '₹3,821',  c: -0.45 },
  ];

  const features = ['AI Forecasting', 'Real-time NSE/BSE', 'Paper Trading', 'Groq LLaMA', 'Stripe'];

  /* ── Label shorthand ── */
  const Lbl = ({ children }) => (
    <label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 800, color: '#475569', display: 'block', marginBottom: 6 }}>
      {children}
    </label>
  );

  return (
    <div className="lp-root">
      <ParticleCanvas />

      {/* Ambient orbs */}
      <div style={{ position: 'fixed', top: '5%', left: '5%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(59,130,246,0.1) 0%,transparent 70%)', animation: 'lp-orb1 12s ease-in-out infinite', pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'fixed', bottom: '5%', right: '5%', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.09) 0%,transparent 70%)', animation: 'lp-orb2 15s ease-in-out infinite', pointerEvents: 'none', zIndex: 1 }} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ════════════════════
          LEFT PANEL
      ════════════════════ */}
      <div className="lp-left">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div className="lp-glow" style={{
            width: 42, height: 42, borderRadius: 13, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
          }}>
            <TrendingUp size={19} color="#fff" />
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', fontFamily: "'Syne',sans-serif" }}>
            Equi<span style={{ color: '#22d3ee' }}>Dash</span>
          </span>
        </div>

        {/* AI badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 11px', borderRadius: 99, marginBottom: 12, width: 'fit-content',
          border: '1px solid rgba(34,211,238,0.22)', background: 'rgba(34,211,238,0.07)',
        }}>
          <Zap size={10} style={{ color: '#22d3ee' }} />
          <span style={{ fontSize: 10, color: '#22d3ee', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            AI-Powered Terminal
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 36, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.04em',
          color: '#f8fafc', marginBottom: 10, fontFamily: "'Syne',sans-serif",
        }}>
          Trade Smarter<br />
          <span className="lp-grad">With AI.</span>
        </h1>

        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 16, maxWidth: 320 }}>
          Institutional-grade analytics, real-time NSE/BSE intelligence, and AI-powered forecasting — all in one terminal.
        </p>

        {/* Live tickers */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {tickers.map(t => (
            <div key={t.s} className="lp-tick">
              <span style={{ fontWeight: 800, color: '#94a3b8' }}>{t.s}</span>
              <span style={{ color: '#f1f5f9', fontFamily: "'IBM Plex Mono',monospace" }}>{t.p}</span>
              <span style={{ fontWeight: 800, fontFamily: "'IBM Plex Mono',monospace", color: t.c > 0 ? '#34d399' : '#fb7185' }}>
                {t.c > 0 ? '+' : ''}{t.c}%
              </span>
            </div>
          ))}
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {features.map(f => (
            <span key={f} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 99, fontSize: 11, fontWeight: 600,
              color: '#475569', border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.025)',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22d3ee', flexShrink: 0 }} />
              {f}
            </span>
          ))}
        </div>

        {/* Stats — pinned to bottom */}
        <div style={{
          display: 'flex', gap: 24, marginTop: 'auto', paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {[['50+', 'NSE Stocks'], ['Live', 'Market Data'], ['AI', 'Powered'], ['Free', 'Forever']].map(([v, l]) => (
            <div key={l}>
              <p style={{ fontSize: 21, fontWeight: 800, color: '#22d3ee', fontFamily: "'Syne',sans-serif" }}>{v}</p>
              <p style={{ fontSize: 10, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════
          RIGHT PANEL — Form
      ════════════════════ */}
      <div className="lp-right">
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Card */}
          <div className="lp-card">
            <div className="lp-scan" />
            {/* Corner glow */}
            <div style={{ position: 'absolute', top: -20, right: -20, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(59,130,246,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />
            {/* Top accent line */}
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', height: 1, width: 120, background: 'linear-gradient(90deg,transparent,rgba(34,211,238,0.5),transparent)' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Heading */}
              <h2 style={{ fontSize: 23, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', marginBottom: 6, fontFamily: "'Syne',sans-serif" }}>
                {showOtp ? 'Verify Account' : isRegister ? 'Get Started' : 'Welcome Back'}
              </h2>
              <p style={{ fontSize: 13, color: '#475569', marginBottom: 16, lineHeight: 1.5 }}>
                {showOtp
                  ? 'Enter the 6-digit code sent to your email'
                  : isRegister
                  ? 'Create your free trading account'
                  : 'Sign in to your trading terminal'}
              </p>

              {/* Social login */}
              {!showOtp && (<>
                <button onClick={() => loginWithGoogle()} type="button" disabled={loading} className="lp-social"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', marginBottom: 6 }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <FacebookLogin appId="938075182128201" autoLoad={false} fields="name,email,picture" callback={responseFacebook}
                  render={rp => (
                    <button onClick={rp.onClick} type="button" disabled={loading} className="lp-social"
                      style={{ background: 'rgba(24,119,242,0.1)', border: '1px solid rgba(24,119,242,0.25)', color: '#93c5fd', marginBottom: 12 }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(24,119,242,0.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(24,119,242,0.1)'; }}>
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Continue with Facebook
                    </button>
                  )} />

                <div className="lp-or"><span>or continue with email</span></div>
              </>)}

              {/* Form */}
              <form onSubmit={handleSubmit}>
                {!showOtp && (<>
                  <div style={{ marginBottom: 10 }}>
                    <Lbl>Email Address</Lbl>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      disabled={loading} placeholder="you@example.com" className="lp-inp" required />
                  </div>
                  {isRegister && (
                    <div style={{ marginBottom: 10 }}>
                      <Lbl>Full Name</Lbl>
                      <input value={name} onChange={e => setName(e.target.value)}
                        disabled={loading} placeholder="Your name" className="lp-inp" />
                    </div>
                  )}
                  <div style={{ marginBottom: 14 }}>
                    <Lbl>Password</Lbl>
                    <div style={{ position: 'relative' }}>
                      <input type={showPwd ? 'text' : 'password'} value={password}
                        onChange={e => setPassword(e.target.value)} disabled={loading}
                        placeholder="••••••••" className="lp-inp" required style={{ paddingRight: 42 }} />
                      <button type="button" onClick={() => setShowPwd(p => !p)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', transition: 'color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#f1f5f9'}
                        onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </>)}

                {showOtp && (
                  <div style={{ marginBottom: 14 }}>
                    <Lbl>6-Digit Verification Code</Lbl>
                    <input type="text" value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6} required disabled={loading} placeholder="000000"
                      className="lp-inp"
                      style={{ textAlign: 'center', letterSpacing: '0.55em', fontSize: 22, fontWeight: 900, fontFamily: "'IBM Plex Mono',monospace", background: 'rgba(6,182,212,0.07)', borderColor: 'rgba(6,182,212,0.35)' }} />
                    <p style={{ fontSize: 11, color: '#334155', textAlign: 'center', marginTop: 7 }}>Check your inbox for the 6-digit code</p>
                  </div>
                )}

                <button type="submit" disabled={loading} className="lp-submit">
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span className="lp-spinner" /> Processing…
                    </span>
                  ) : showOtp ? 'VERIFY & ENTER' : isRegister ? 'SEND OTP →' : 'SIGN IN →'}
                </button>
              </form>

              {/* Toggle register/login */}
              {!showOtp && (
                <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#475569' }}>
                  {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                  <button type="button" onClick={() => { setIsRegister(p => !p); setToast(null); }} disabled={loading}
                    style={{ background: 'none', border: 'none', color: '#22d3ee', fontWeight: 800, cursor: 'pointer', fontSize: 13, transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#67e8f9'}
                    onMouseLeave={e => e.currentTarget.style.color = '#22d3ee'}>
                    {isRegister ? 'Sign In' : 'Create Account'}
                  </button>
                </p>
              )}
              {showOtp && (
                <button type="button" onClick={() => { setShowOtp(false); setOtp(''); }}
                  style={{ width: '100%', marginTop: 10, padding: '9px 0', background: 'none', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
                  ← Back to registration
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 16 }}>
            <Shield size={11} style={{ color: '#334155' }} />
            <p style={{ fontSize: 11, color: '#334155', fontFamily: "'Inter',sans-serif" }}>
              Paper trading only · No real money involved · 256-bit SSL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;