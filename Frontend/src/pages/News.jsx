import React, { useState, useEffect } from 'react';
import { Newspaper, TrendingUp, TrendingDown, AlertCircle, ExternalLink, Clock, RefreshCw } from 'lucide-react';
import { API } from '../utils/app';

const News = ({ user }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const loadNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API}/market/news`);
      if (!response.ok) throw new Error('Server error');
      const data = await response.json();
      setNews(Array.isArray(data) ? data : data.news || []);
    } catch (err) {
      console.error('News error:', err);
      setError('Unable to connect to the news server. Check if your Python backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNews(); }, []);

  const filteredNews = filter === 'all' ? news : news.filter(n => n.sentiment === filter);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="relative">
        <div className="w-14 h-14 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Newspaper className="w-5 h-5 text-cyan-500" />
        </div>
      </div>
      <p className="text-cyan-400 font-mono text-sm animate-pulse uppercase tracking-widest">Scanning Global Feeds...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="glass-panel p-8 rounded-2xl max-w-md text-center bg-rose-900/10 border-rose-500/30">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Feed Disconnected</h3>
        <p className="text-slate-400 text-sm mb-5">{error}</p>
        <button onClick={loadNews} className="px-6 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl transition-all text-sm">
          Reconnect
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-24" data-testid="news-container">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Market Intelligence</h1>
          <p className="text-cyan-400 text-sm mt-0.5 font-medium">Real-time Global Financial Feeds</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="glass-panel px-3 py-2 rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]"></div>
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">Live</span>
          </div>
          {/* Refresh */}
          <button onClick={loadNews} className="glass-panel p-2 rounded-xl text-slate-400 hover:text-cyan-400 transition-all" title="Refresh news">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: `All (${news.length})` },
          { key: 'positive', label: `Bullish (${news.filter(n => n.sentiment === 'positive').length})` },
          { key: 'neutral', label: `Neutral (${news.filter(n => n.sentiment === 'neutral').length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              filter === key
                ? 'bg-cyan-500 text-slate-900 shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                : 'glass-panel text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── News Grid ── */}
      {filteredNews.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredNews.map((item, index) => {
            const isPositive = item.sentiment === 'positive';
            const isNegative = item.sentiment === 'negative';
            return (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                key={index}
                className="glass-panel p-5 rounded-2xl flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.4)] hover:bg-slate-800/50 hover:border-slate-600/50 cursor-pointer"
              >
                {/* Top */}
                <div>
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-lg">
                      {item.source || 'Market Sync'}
                    </span>
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                      isPositive ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                      isNegative ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' :
                      'bg-slate-500/10 border border-slate-500/20 text-slate-400'
                    }`}>
                      {isPositive ? <TrendingUp size={14} /> : isNegative ? <TrendingDown size={14} /> : <TrendingUp size={14} className="opacity-40" />}
                    </div>
                  </div>

                  {/* Headline */}
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-3 leading-relaxed">
                    {item.title}
                  </h3>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-slate-700/40 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <Clock size={12} />
                    <span>{item.published?.split(' ').slice(1, 4).join(' ') || 'Recent'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-500 group-hover:text-cyan-400 transition-colors uppercase tracking-wider">
                    Read <ExternalLink size={12} className="ml-1" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      ) : (
        <div className="py-24 text-center glass-panel rounded-2xl border-dashed border-2 border-slate-700 flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700">
            <Newspaper className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-300 mb-2">No Articles Found</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            {filter !== 'all' ? `No ${filter} news found. Try a different filter.` : 'The market feed is quiet. Check back shortly.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default News;