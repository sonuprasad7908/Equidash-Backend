import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Briefcase, History, Star, Bell, TrendingUp, TrendingDown, DollarSign, BarChart2 } from 'lucide-react';

const Trading = ({ user }) => {
  const navigate = useNavigate();
  const fmt = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const features = [
    {
      path: '/',
      icon: Home,
      label: 'Dashboard',
      desc: 'Live market terminal with candlestick charts, AI forecast & trade execution',
      color: 'from-cyan-500 to-blue-600',
      shadow: 'shadow-[0_0_20px_rgba(34,211,238,0.2)]',
      stats: 'Live NSE/BSE data',
    },
    {
      path: '/portfolio',
      icon: Briefcase,
      label: 'Portfolio',
      desc: 'Track your open positions, P&L and overall investment performance',
      color: 'from-indigo-500 to-purple-600',
      shadow: 'shadow-[0_0_20px_rgba(99,102,241,0.2)]',
      stats: 'Real-time P&L tracking',
    },
    {
      path: '/transactions',
      icon: History,
      label: 'Transaction History',
      desc: 'View all your buy & sell orders with filtering and sorting',
      color: 'from-blue-500 to-cyan-600',
      shadow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
      stats: 'Full order history',
    },
    {
      path: '/watchlist',
      icon: Star,
      label: 'Watchlist',
      desc: 'Track your favourite stocks with live prices and % change',
      color: 'from-yellow-500 to-orange-500',
      shadow: 'shadow-[0_0_20px_rgba(234,179,8,0.2)]',
      stats: 'Live price tracking',
    },
    {
      path: '/alerts',
      icon: Bell,
      label: 'Price Alerts',
      desc: 'Set price targets and get notified when stocks hit your target',
      color: 'from-rose-500 to-pink-600',
      shadow: 'shadow-[0_0_20px_rgba(244,63,94,0.2)]',
      stats: 'Smart notifications',
    },
    {
      path: '/pricing',
      icon: DollarSign,
      label: 'Add Funds',
      desc: 'Top up your virtual trading balance via Stripe payment gateway',
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
      stats: 'Secure payments',
    },
  ];

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Trading</h1>
            <p className="text-cyan-400 text-sm font-medium">Execute trades & manage your portfolio</p>
          </div>
        </div>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Virtual Balance', value: `₹${fmt(user?.balance)}`, color: 'text-cyan-400', icon: DollarSign },
          { label: 'Account Type', value: 'Paper Trading', color: 'text-emerald-400', icon: BarChart2 },
          { label: 'Market Status', value: 'NSE/BSE Live', color: 'text-white', icon: TrendingUp },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="glass-panel p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800/50 rounded-xl flex items-center justify-center">
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
              <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Trading Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {features.map(({ path, icon: Icon, label, desc, color, shadow, stats }) => (
            <div key={path} onClick={() => navigate(path)}
              className={`glass-panel p-6 rounded-2xl cursor-pointer hover:-translate-y-1 transition-all duration-300 ${shadow} hover:border-slate-600/50 group`}>
              <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon size={22} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{label}</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">{desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/50">{stats}</span>
                <span className="text-xs text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">Open →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Trading;