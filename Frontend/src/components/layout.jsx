import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, Newspaper, LogOut, TrendingUp } from 'lucide-react';

const Layout = ({ children, user, onLogout }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/portfolio', icon: Briefcase, label: 'Portfolio' },
    { path: '/news', icon: Newspaper, label: 'News Feed' }
  ];

  return (
    // UPGRADE: Deep radial gradient background for depth
    <div className="flex h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-slate-200 font-sans">
      
      {/* UPGRADE: Glassmorphism Sidebar */}
      <div className="w-64 bg-slate-900/40 backdrop-blur-xl border-r border-slate-700/50 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-10">
        <div className="p-6">
          <h2 className="text-2xl font-bold tracking-tight">
            Equi<span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">Dash</span>
          </h2>
        </div>

        {/* UPGRADE: Glowing Balance Card */}
        <div className="mx-6 mb-8 p-5 glass-panel rounded-2xl text-center transition-all duration-300 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)]">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Virtual Balance</p>
          <h2 className="text-3xl font-bold font-mono text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.4)] mt-2" data-testid="user-balance">
            ₹{user?.balance?.toLocaleString('en-IN') || '10,00,000'}
          </h2>
        </div>

        {/* UPGRADE: Sleek Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/5 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 hover:translate-x-1'
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <Icon size={20} className={isActive ? "drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : ""} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800/50">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-300"
            data-testid="logout-btn"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </div>
    </div>
  );
};

export default Layout;