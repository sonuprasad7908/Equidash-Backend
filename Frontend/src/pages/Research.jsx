import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GitCompare, Map, Filter, Landmark, Search, TrendingUp } from 'lucide-react';

const Research = () => {
  const navigate = useNavigate();

  const features = [
    {
      path: '/compare',
      icon: GitCompare,
      label: 'Stock Comparison',
      desc: 'Compare 2-3 stocks side by side with normalized charts and 10 key metrics',
      color: 'from-violet-500 to-purple-600',
      shadow: 'shadow-[0_0_20px_rgba(139,92,246,0.2)]',
      tag: 'Up to 3 stocks',
    },
    {
      path: '/heatmap',
      icon: Map,
      label: 'Market Heat Map',
      desc: 'Visual color-coded overview of all NSE sectors — see what\'s hot and what\'s not',
      color: 'from-orange-500 to-rose-500',
      shadow: 'shadow-[0_0_20px_rgba(249,115,22,0.2)]',
      tag: '8 sectors',
    },
    {
      path: '/screener',
      icon: Filter,
      label: 'Stock Screener',
      desc: 'Filter 30+ NSE stocks by RSI, MACD, signal type and % change',
      color: 'from-cyan-500 to-blue-600',
      shadow: 'shadow-[0_0_20px_rgba(34,211,238,0.2)]',
      tag: '30+ stocks',
    },
    {
      path: '/ipo',
      icon: Landmark,
      label: 'IPO Centre',
      desc: 'Track open, upcoming & recently listed IPOs with GMP and lot size',
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
      tag: 'Live IPO data',
    },
  ];

  return (
    <div className="space-y-8 pb-24">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)]">
            <Search size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Research</h1>
            <p className="text-violet-400 text-sm font-medium">Analyse & discover market opportunities</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Stocks Covered', value: '30+', color: 'text-cyan-400' },
          { label: 'Sectors', value: '8', color: 'text-violet-400' },
          { label: 'Indicators', value: 'RSI, MACD, BB', color: 'text-white' },
          { label: 'Data Source', value: 'Yahoo Finance', color: 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-panel p-4 rounded-xl text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Feature Cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Research Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map(({ path, icon: Icon, label, desc, color, shadow, tag }) => (
            <div key={path} onClick={() => navigate(path)}
              className={`glass-panel p-6 rounded-2xl cursor-pointer hover:-translate-y-1 transition-all duration-300 ${shadow} hover:border-slate-600/50 group`}>
              <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon size={22} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{label}</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">{desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/50">{tag}</span>
                <span className="text-xs text-violet-400 font-bold group-hover:translate-x-1 transition-transform">Open →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Research;