import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  TrendingUp, User, Plus, Sun, Moon, Settings,
  Wrench, Search, ArrowUpRight, LogOut, Activity, Clock
} from 'lucide-react';

export const ThemeContext = createContext();
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('equidash_theme') || 'dark');
  useEffect(() => {
    localStorage.setItem('equidash_theme', theme);
    document.documentElement.classList.toggle('light-mode', theme === 'light');
    document.documentElement.classList.toggle('dark-mode', theme !== 'light');
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};
export const useTheme = () => useContext(ThemeContext);

/* ─── 3D Tilt card hook ─── */
const use3DTilt = (strength = 8) => {
  const ref = useRef(null);
  const onMouseMove = e => {
    const el = ref.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg) translateZ(4px)`;
    el.style.boxShadow = `${-x * 12}px ${-y * 12}px 32px rgba(34,211,238,0.12), 0 0 0 1px rgba(34,211,238,0.12)`;
  };
  const onMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0px)';
    el.style.boxShadow = '';
  };
  return { ref, onMouseMove, onMouseLeave };
};

/* ─── Theme Toggle ─── */
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  return (
    <button onClick={toggleTheme}
      title={isLight ? 'Switch to Dark' : 'Switch to Light'}
      style={{
        position: 'relative', width: 40, height: 22, borderRadius: 11, flexShrink: 0,
        background: isLight ? 'rgba(34,211,238,0.85)' : 'rgba(30,41,59,0.9)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: isLight ? '0 0 12px rgba(34,211,238,0.4)' : 'none',
        cursor: 'pointer', transition: 'all 0.3s',
      }}>
      <span style={{
        position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isLight ? '#fff' : '#475569',
        left: isLight ? 20 : 2, transition: 'all 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        fontSize: 9,
      }}>
        {isLight ? '☀️' : '🌙'}
      </span>
    </button>
  );
};

/* ─── Live IST Clock ─── */
const LiveClock = ({ isLight }) => {
  const [time, setTime] = useState('');
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const h = ist.getHours();
      const m = ist.getMinutes();
      const s = ist.getSeconds();
      const pad = n => n.toString().padStart(2, '0');
      setTime(`${pad(h)}:${pad(m)}:${pad(s)} IST`);
      // NSE is open Mon-Fri 9:15 - 15:30
      const day = ist.getDay();
      const totalMin = h * 60 + m;
      setIsMarketOpen(day >= 1 && day <= 5 && totalMin >= 555 && totalMin < 930);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      margin: '0 10px 8px',
      padding: '10px 12px',
      borderRadius: 12,
      background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.025)',
      border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Clock size={10} style={{ color: '#475569' }} />
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 600, color: isLight ? '#334155' : '#94a3b8', letterSpacing: '0.04em' }}>
          {time}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: isMarketOpen ? '#34d399' : '#475569',
          boxShadow: isMarketOpen ? '0 0 8px rgba(52,211,153,0.6)' : 'none',
          animation: isMarketOpen ? 'mkt-pulse 1.5s ease-in-out infinite' : 'none',
        }} />
        <span style={{
          fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: isMarketOpen ? '#34d399' : '#475569',
        }}>
          NSE {isMarketOpen ? 'Open' : 'Closed'}
        </span>
      </div>
    </div>
  );
};

/* ─── New-tab item with 3D tilt ─── */
const NewTabItem = ({ path, icon: Icon, label, sublabel, accent, delay = 0, isActive }) => {
  const { ref, onMouseMove, onMouseLeave } = use3DTilt(6);
  const [vis, setVis] = useState(false);
  const [hov, setHov] = useState(false);

  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);

  const handleClick = e => {
    e.preventDefault();
    window.open(window.location.origin + path, '_blank', 'noopener,noreferrer');
  };

  return (
    <a href={path} onClick={handleClick}
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={e => { onMouseLeave(e); setHov(false); }}
      onMouseEnter={() => setHov(true)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 12px', borderRadius: 14,
        textDecoration: 'none', cursor: 'pointer',
        background: isActive ? `${accent}14` : hov ? `${accent}0e` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isActive ? accent + '30' : hov ? accent + '25' : 'rgba(255,255,255,0.05)'}`,
        transition: 'background 0.18s, border-color 0.18s, transform 0.18s',
        transformStyle: 'preserve-3d',
        opacity: vis ? 1 : 0,
        marginBottom: 4,
        position: 'relative',
        overflow: 'hidden',
      }}>
      {/* Active indicator — left border pill */}
      {isActive && (
        <div style={{
          position: 'absolute', left: 0, top: '20%', bottom: '20%',
          width: 3, borderRadius: '0 3px 3px 0',
          background: accent,
          boxShadow: `0 0 8px ${accent}`,
        }} />
      )}
      {/* Icon */}
      <div style={{
        width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isActive ? `${accent}22` : hov ? `${accent}18` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isActive || hov ? accent + '35' : 'rgba(255,255,255,0.07)'}`,
        transition: 'all 0.18s', flexShrink: 0,
        transform: 'translateZ(6px)',
      }}>
        <Icon size={14} style={{ color: isActive || hov ? accent : '#64748b', transition: 'color 0.18s' }} />
      </div>
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0, transform: 'translateZ(4px)' }}>
        <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: isActive || hov ? accent : '#94a3b8', transition: 'color 0.18s' }}>{label}</p>
        {sublabel && <p style={{ fontSize: 9, color: '#334155', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sublabel}</p>}
      </div>
      <ArrowUpRight size={11} style={{ color: isActive || hov ? accent : '#1e293b', flexShrink: 0, transform: `translateZ(4px) ${hov ? 'translate(1px,-1px)' : ''}`, transition: 'all 0.18s' }} />
    </a>
  );
};

/* ══════════════════════════════
   MAIN LAYOUT
══════════════════════════════ */
const Layout = ({ children, user, onLogout }) => {
  const location = useLocation();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setTimeout(() => setReady(true), 60); }, []);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Syne:wght@700;800&family=Inter:wght@400;500;600;700;800;900&display=swap');

    /* ── Page-level 3D depth background ── */
    .equidash-app {
      perspective: 1200px;
      background: ${isLight ? '#f1f5f9' : '#030712'};
      min-height: 100vh;
    }

    /* Animated gradient mesh */
    .equidash-app::before {
      content: '';
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background:
        radial-gradient(ellipse 60% 50% at 20% 10%, ${isLight ? 'rgba(34,211,238,0.04)' : 'rgba(34,211,238,0.07)'} 0%, transparent 60%),
        radial-gradient(ellipse 50% 60% at 80% 80%, ${isLight ? 'rgba(99,102,241,0.03)' : 'rgba(99,102,241,0.06)'} 0%, transparent 60%),
        radial-gradient(ellipse 40% 40% at 50% 50%, ${isLight ? 'rgba(167,139,250,0.02)' : 'rgba(167,139,250,0.03)'} 0%, transparent 60%);
      animation: mesh-shift 12s ease-in-out infinite alternate;
    }
    @keyframes mesh-shift {
      0%   { opacity: 0.7; transform: scale(1)    rotate(0deg);   }
      50%  { opacity: 1;   transform: scale(1.05) rotate(0.5deg); }
      100% { opacity: 0.8; transform: scale(0.98) rotate(-0.5deg);}
    }

    /* Grid lines */
    .equidash-app::after {
      content: '';
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background-image:
        linear-gradient(${isLight ? 'rgba(34,211,238,0.025)' : 'rgba(34,211,238,0.03)'} 1px, transparent 1px),
        linear-gradient(90deg, ${isLight ? 'rgba(34,211,238,0.025)' : 'rgba(34,211,238,0.03)'} 1px, transparent 1px);
      background-size: 52px 52px;
      mask-image: radial-gradient(ellipse 100% 80% at 50% 0%, black 20%, transparent 100%);
    }

    /* Sidebar 3D */
    .eq-sidebar {
      transform-style: preserve-3d;
      animation: sidebar-in 0.55s cubic-bezier(0.22,1,0.36,1) both;
    }
    @keyframes sidebar-in {
      from { opacity: 0; transform: perspective(800px) translateX(-24px) rotateY(6deg); }
      to   { opacity: 1; transform: perspective(800px) translateX(0)      rotateY(0deg); }
    }

    /* Main content 3D entrance */
    .eq-main-content {
      animation: content-in 0.6s cubic-bezier(0.22,1,0.36,1) 0.15s both;
    }
    @keyframes content-in {
      from { opacity: 0; transform: perspective(800px) translateY(20px) rotateX(2deg); }
      to   { opacity: 1; transform: perspective(800px) translateY(0)     rotateX(0deg); }
    }

    /* 3D card hover */
    .card-3d {
      transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease;
      transform-style: preserve-3d;
      will-change: transform;
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)'}; border-radius: 8px; }

    /* Page route transition */
    @keyframes logo-pulse {
      0%   { box-shadow: 0 0 12px rgba(34,211,238,0.4); }
      100% { box-shadow: 0 0 24px rgba(34,211,238,0.8); }
    }
    .eq-page { animation: page-rise 0.4s cubic-bezier(0.22,1,0.36,1) both; }
    @keyframes page-rise {
      from { opacity: 0; transform: translateY(14px) scale(0.99); }
      to   { opacity: 1; transform: translateY(0)     scale(1);    }
    }

    /* Market pulse animation */
    @keyframes mkt-pulse {
      0%,100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.3); }
    }

    /* ── Mobile ── */
    .eq-hamburger{display:none;flex-direction:column;gap:5px;padding:10px;background:none;border:none;cursor:pointer;z-index:300;}
    .eq-hamburger span{display:block;width:22px;height:2px;border-radius:99px;background:#64748b;transition:all 0.25s ease;}
    .eq-hamburger:hover span{background:#22d3ee;}
    .eq-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);z-index:18;}
    .eq-overlay.open{display:block;}
    @media(max-width:768px){
      .eq-hamburger{display:flex!important;position:fixed;top:14px;left:14px;}
      .eq-sidebar{position:fixed!important;left:0;top:0;bottom:0;z-index:200;width:240px!important;transform:translateX(-100%);transition:transform 0.3s cubic-bezier(0.22,1,0.36,1)!important;animation:none!important;}
      .eq-sidebar.open{transform:translateX(0)!important;}
      .eq-main-content>div{padding:16px 14px!important;}
    }
    @media(max-width:480px){.eq-main-content>div{padding:12px 10px!important;}}
  `;

  const newTabNav = [
    { path: '/trading', icon: TrendingUp, label: 'Trading', sublabel: 'Execute · Portfolio · Watchlist', accent: '#22d3ee', delay: 200 },
    { path: '/research', icon: Search, label: 'Research', sublabel: 'Screener · Heat Map · Compare · IPO', accent: '#a78bfa', delay: 280 },
    { path: '/tools', icon: Wrench, label: 'Tools', sublabel: 'Calculators · News Feed', accent: '#fb923c', delay: 360 },
  ];

  const sidebarStyle = {
    width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
    background: isLight ? 'rgba(255,255,255,0.93)' : 'rgba(7,12,24,0.93)',
    backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
    borderRight: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.05)',
    boxShadow: isLight
      ? '4px 0 32px rgba(0,0,0,0.08), inset -1px 0 0 rgba(255,255,255,0.5)'
      : '4px 0 40px rgba(0,0,0,0.6), 8px 0 60px rgba(34,211,238,0.03)',
    position: 'relative', zIndex: 20,
    fontFamily: "'Inter', sans-serif",
  };

  return (
    <div className="equidash-app" style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', sans-serif", color: isLight ? '#0f172a' : '#e2e8f0' }}>
      <style>{CSS}</style>

      {/* Mobile hamburger */}
      <button className="eq-hamburger" onClick={() => setMobileOpen(p => !p)} aria-label="Menu">
        <span style={mobileOpen ? { transform: 'rotate(45deg) translate(5px,5px)' } : {}} />
        <span style={mobileOpen ? { opacity: 0, transform: 'translateX(-8px)' } : {}} />
        <span style={mobileOpen ? { transform: 'rotate(-45deg) translate(5px,-5px)' } : {}} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && <div className="eq-overlay open" onClick={() => setMobileOpen(false)} />}

      {/* ═══ 3D SIDEBAR ═══ */}
      {ready && (
        <aside className={`eq-sidebar${mobileOpen ? ' open' : ''}`} style={sidebarStyle}>

          {/* Logo */}
          <div style={{ padding: '14px 14px 12px', borderBottom: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
                boxShadow: '0 0 16px rgba(34,211,238,0.45)',
                animation: 'logo-pulse 3s ease-in-out infinite alternate',
              }}>
                <TrendingUp size={15} color="#fff" />
              </div>
              <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color: isLight ? '#0f172a' : '#f8fafc' }}>
                Equi<span style={{ color: '#22d3ee' }}>Dash</span>
              </span>
            </div>
            <ThemeToggle />
          </div>

          {/* User card */}
          {user && (
            <button onClick={() => window.open(window.location.origin + '/profile', '_blank')}
              style={{
                margin: '8px 10px 0', padding: '10px 12px', borderRadius: 14,
                display: 'flex', alignItems: 'center', gap: 10,
                background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer', transition: 'all 0.18s', textAlign: 'left', width: 'calc(100% - 20px)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.06)'; e.currentTarget.style.borderColor = 'rgba(34,211,238,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'; }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#06b6d4,#6366f1)', color: '#fff', fontSize: 13, fontWeight: 800, flexShrink: 0, boxShadow: '0 0 12px rgba(34,211,238,0.3)' }}>
                {(user.name || 'T')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: isLight ? '#0f172a' : '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || 'Trader'}</p>
                <p style={{ fontSize: 10, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{user.email}</p>
              </div>
              <Settings size={11} style={{ color: '#475569', flexShrink: 0 }} />
            </button>
          )}

          {/* Balance */}
          <div style={{ margin: '8px 10px 10px', padding: '13px 14px', borderRadius: 14, background: 'linear-gradient(135deg,rgba(6,182,212,0.08),rgba(59,130,246,0.05))', border: '1px solid rgba(34,211,238,0.14)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Sparkle accent */}
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle,rgba(34,211,238,0.15) 0%,transparent 70%)', pointerEvents: 'none' }} />
            <p style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 4 }}>Virtual Balance</p>
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 17, fontWeight: 700, color: '#22d3ee', letterSpacing: '-0.02em', marginBottom: 10 }}>
              ₹{user?.balance?.toLocaleString('en-IN') || '10,00,000'}
            </p>
            <Link to="/pricing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px', borderRadius: 9, fontSize: 10, fontWeight: 700, color: '#22d3ee', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', textDecoration: 'none', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.18)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(34,211,238,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <Plus size={10} /> Add Funds
            </Link>
          </div>

          {/* Live Clock + Market Status */}
          <LiveClock isLight={isLight} />

          {/* Divider */}
          <div style={{ margin: '0 10px 6px', height: 1, background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)' }} />

          {/* Main nav */}
          <nav style={{ flex: 1, padding: '4px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0, scrollbarWidth: 'none' }}>
            {newTabNav.map(({ path, icon, label, sublabel, accent, delay }) => (
              <NewTabItem
                key={path}
                path={path}
                icon={icon}
                label={label}
                sublabel={sublabel}
                accent={accent}
                delay={delay}
                isActive={location.pathname === path}
              />
            ))}
          </nav>

          {/* Logout */}
          <div style={{ padding: '10px 10px 14px', borderTop: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)' }}>
            <button onClick={onLogout}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', width: '100%', borderRadius: 11, background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(251,113,133,0.55)', transition: 'all 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.08)'; e.currentTarget.style.color = '#fb7185'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(251,113,133,0.55)'; }}>
              <LogOut size={14} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Logout</span>
            </button>
          </div>
        </aside>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="eq-main-content" style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1, scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>
        <div className="eq-page" style={{ padding: 28, maxWidth: 1400, margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;