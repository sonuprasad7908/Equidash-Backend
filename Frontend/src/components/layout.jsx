import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, Newspaper, LogOut, TrendingUp, User, Plus, Star, Filter,
  Calculator, Landmark, Sun, Moon, Bell, History, GitCompare, Map, Settings, Wrench, Search } from 'lucide-react';

export const ThemeContext = createContext();
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('equidash_theme') || 'dark');
  useEffect(() => {
    localStorage.setItem('equidash_theme', theme);
    const html = document.documentElement;
    if (theme === 'light') { html.classList.add('light-mode'); html.classList.remove('dark-mode'); }
    else { html.classList.add('dark-mode'); html.classList.remove('light-mode'); }
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};
export const useTheme = () => useContext(ThemeContext);

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  return (
    <button onClick={toggleTheme}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 flex items-center flex-shrink-0 ${isLight ? 'bg-cyan-500' : 'bg-slate-700'}`}>
      <span className={`absolute w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${isLight ? 'left-6 bg-white' : 'left-0.5 bg-slate-400'}`}>
        {isLight ? <Sun size={10} className="text-yellow-500" /> : <Moon size={10} className="text-slate-700" />}
      </span>
    </button>
  );
};

const Layout = ({ children, user, onLogout }) => {
  const location = useLocation();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const navGroups = [
    {
      label: 'Trading',
      labelPath: '/trading',
      labelColor: 'text-cyan-400',
      items: [
        { path: '/', icon: Home, label: 'Dashboard' },
        { path: '/portfolio', icon: Briefcase, label: 'Portfolio' },
        { path: '/transactions', icon: History, label: 'Transactions' },
        { path: '/watchlist', icon: Star, label: 'Watchlist' },
        { path: '/alerts', icon: Bell, label: 'Price Alerts' },
      ]
    },
    {
      label: 'Research',
      labelPath: '/research',
      labelColor: 'text-violet-400',
      items: [
        { path: '/compare', icon: GitCompare, label: 'Compare' },
        { path: '/heatmap', icon: Map, label: 'Heat Map' },
        { path: '/screener', icon: Filter, label: 'Screener' },
        { path: '/ipo', icon: Landmark, label: 'IPO Centre' },
      ]
    },
    {
      label: 'Tools',
      labelPath: '/tools',
      labelColor: 'text-amber-400',
      items: [
        { path: '/calculator', icon: Calculator, label: 'Calculators' },
        { path: '/news', icon: Newspaper, label: 'News Feed' },
      ]
    },
  ];

  const activeColor = (isLight, isActive) => {
    if (isActive) return isLight
      ? 'bg-cyan-50 text-cyan-600 border border-cyan-200'
      : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/5 text-cyan-400 border border-cyan-500/20';
    return isLight
      ? 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:translate-x-0.5'
      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 hover:translate-x-0.5';
  };

  return (
    <div className={`flex h-screen font-sans transition-all duration-300 ${
      isLight ? 'bg-gradient-to-br from-blue-50 via-slate-50 to-cyan-50 text-slate-800'
              : 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-slate-200'
    }`}>
      {/* ── Sidebar ── */}
      <div className={`w-64 flex flex-col z-10 transition-all duration-300 ${
        isLight ? 'bg-white border-r border-slate-200 shadow-lg'
                : 'bg-slate-900/40 backdrop-blur-xl border-r border-slate-700/50 shadow-[4px_0_24px_rgba(0,0,0,0.2)]'
      }`}>

        {/* Logo + Toggle */}
        <div className={`p-5 border-b flex items-center justify-between ${isLight ? 'border-slate-100' : 'border-slate-800/50'}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(34,211,238,0.4)]">
              <TrendingUp size={16} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Equi<span className="text-cyan-500">Dash</span></h2>
          </div>
          <ThemeToggle />
        </div>

        {/* User → Profile */}
        {user && (
          <Link to="/profile" className={`mx-3 mt-3 p-3 rounded-xl flex items-center gap-3 transition-all ${
            isLight ? 'bg-slate-50 border border-slate-200 hover:bg-cyan-50 hover:border-cyan-200'
                    : 'glass-panel hover:bg-slate-800/60'
          }`}>
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-white" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className={`text-sm font-semibold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{user.name || 'Trader'}</p>
              <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{user.email}</p>
            </div>
            <Settings size={13} className="text-slate-400 flex-shrink-0" />
          </Link>
        )}

        {/* Balance */}
        <div className={`mx-3 mt-3 p-4 rounded-xl text-center transition-all ${
          isLight ? 'bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100'
                  : 'glass-panel hover:border-cyan-500/30'
        }`}>
          <p className={`text-[10px] uppercase tracking-wider font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Virtual Balance</p>
          <h2 className="text-xl font-bold font-mono text-cyan-500 mt-1" data-testid="user-balance">
            ₹{user?.balance?.toLocaleString('en-IN') || '10,00,000'}
          </h2>
          <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Paper Trading</p>
          <Link to="/pricing" className={`mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            isLight ? 'bg-cyan-100 border border-cyan-200 text-cyan-600 hover:bg-cyan-200'
                    : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
          }`}><Plus size={12} /> Add Funds</Link>
        </div>

        {/* Nav Groups */}
        <nav className="flex-1 px-3 mt-3 overflow-y-auto custom-scrollbar space-y-3 pb-2">
          {navGroups.map(({ label, labelPath, labelColor, items }) => (
            <div key={label}>
              {/* ✅ Clickable group label */}
              <Link to={labelPath}
                className={`flex items-center gap-1.5 px-3 mb-1 group w-fit`}>
                <p className={`text-[10px] uppercase tracking-widest font-bold transition-colors ${
                  location.pathname === labelPath ? labelColor : isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-600 hover:text-slate-400'
                }`}>{label}</p>
                <span className={`text-[9px] opacity-0 group-hover:opacity-100 transition-opacity ${labelColor}`}>→</span>
              </Link>
              <div className="space-y-0.5">
                {items.map(({ path, icon: Icon, label: itemLabel }) => {
                  const isActive = location.pathname === path;
                  return (
                    <Link key={path} to={path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${activeColor(isLight, isActive)}`}>
                      <Icon size={16} />
                      <span className="font-medium text-sm">{itemLabel}</span>
                      {isActive && <div className={`ml-auto w-1.5 h-1.5 rounded-full ${isLight ? 'bg-cyan-500' : 'bg-cyan-400'}`}></div>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className={`p-3 border-t ${isLight ? 'border-slate-100' : 'border-slate-800/50'}`}>
          <button onClick={onLogout}
            className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl transition-all group ${
              isLight ? 'text-rose-500 hover:bg-rose-50' : 'text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10'
            }`}>
            <LogOut size={18} className="group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </div>
    </div>
  );
};

export default Layout;