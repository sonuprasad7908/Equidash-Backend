import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Newspaper, Wrench, TrendingUp } from 'lucide-react';

const Tools = () => {
  const navigate = useNavigate();

  const features = [
    {
      path: '/calculator',
      icon: Calculator,
      label: 'Financial Calculators',
      desc: 'SIP, Lumpsum, Brokerage & Margin calculators to plan your investments',
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
      tag: '4 calculators',
      bullets: ['SIP Returns', 'Lumpsum Returns', 'Brokerage Cost', 'Margin Calculator'],
    },
    {
      path: '/news',
      icon: Newspaper,
      label: 'Market News Feed',
      desc: 'Latest NSE/BSE news with sentiment analysis — bullish, bearish or neutral',
      color: 'from-sky-500 to-blue-600',
      shadow: 'shadow-[0_0_20px_rgba(14,165,233,0.2)]',
      tag: 'Live news',
      bullets: ['Google News feed', 'Sentiment filter', 'Real-time updates', 'NSE/BSE focus'],
    },
  ];

  return (
    <div className="space-y-8 pb-24">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            <Wrench size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Tools</h1>
            <p className="text-amber-400 text-sm font-medium">Utilities to help you make better decisions</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Calculators', value: '4', color: 'text-amber-400' },
          { label: 'News Sources', value: 'Google News', color: 'text-sky-400' },
          { label: 'Sentiment Tags', value: 'Bullish / Neutral', color: 'text-white' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-panel p-4 rounded-xl text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-base font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Feature Cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Available Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map(({ path, icon: Icon, label, desc, color, shadow, tag, bullets }) => (
            <div key={path} onClick={() => navigate(path)}
              className={`glass-panel p-6 rounded-2xl cursor-pointer hover:-translate-y-1 transition-all duration-300 ${shadow} hover:border-slate-600/50 group`}>
              <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon size={22} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{label}</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">{desc}</p>
              {/* Bullet points */}
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                {bullets.map(b => (
                  <div key={b} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div className="w-1 h-1 bg-cyan-500 rounded-full flex-shrink-0"></div>
                    {b}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/50">{tag}</span>
                <span className="text-xs text-amber-400 font-bold group-hover:translate-x-1 transition-transform">Open →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 to-blue-500/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white mb-1">AI Assistant Available</h3>
            <p className="text-sm text-slate-400">Use the chat bubble at the bottom right of any page to ask EquiDash AI about stocks, market trends, or trading strategies.</p>
          </div>
          <button onClick={() => navigate('/')}
            className="flex-shrink-0 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-xl text-sm transition-all">
            Try AI →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tools;