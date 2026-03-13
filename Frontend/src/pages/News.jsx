import React, { useState, useEffect } from 'react';
import { Newspaper, TrendingUp, TrendingDown, AlertCircle, ExternalLink, Clock } from 'lucide-react';

const News = ({ user }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMarketOverview = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8001/api/market/news'); 
      
      if (!response.ok) {
        throw new Error('Server responded with an error');
      }
      
      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        setNews(data);
      } else if (data && data.news) {
        setNews(data.news);
      }
      
      setError(null);
    } catch (err) {
      console.error("News Load Error:", err);
      setError("Unable to connect to the news server. Check if your Python backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Newspaper className="w-6 h-6 text-cyan-500 animate-pulse" />
          </div>
        </div>
        <p className="text-cyan-400 font-mono animate-pulse tracking-widest uppercase text-sm">Scanning Global Feeds...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="glass-panel p-8 rounded-2xl max-w-md text-center bg-rose-900/10 border-rose-500/30 shadow-[0_0_30px_rgba(225,29,72,0.1)]">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2 tracking-wide">Feed Disconnected</h3>
          <p className="text-slate-400 mb-6 leading-relaxed">{error}</p>
          <button 
            onClick={loadMarketOverview}
            className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)] hover:shadow-[0_0_25px_rgba(225,29,72,0.5)]"
          >
            RECONNECT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700" data-testid="news-container">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-700/50 pb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-md">Market Intelligence</h1>
          <p className="text-cyan-400 mt-1 font-medium tracking-wide">Real-time Global Financial Feeds</p>
        </div>
        
        {/* Live Status Indicator */}
        <div className="hidden sm:flex items-center gap-3 glass-panel px-4 py-2.5 rounded-xl border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.05)]">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mt-0.5">Live Sync</span>
        </div>
      </div>

      {/* News Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {news.length > 0 ? (
          news.map((item, index) => {
            const isPositive = item.sentiment === 'positive';
            const isNegative = item.sentiment === 'negative'; // Just in case we add this later
            
            return (
              <a 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                key={index} 
                className="glass-panel p-6 rounded-2xl flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)] hover:bg-slate-800/50 hover:border-slate-500/50 cursor-pointer h-[280px]"
              >
                {/* Article Header & Sentiment */}
                <div>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-md">
                        {item.source || 'Market Sync'}
                      </span>
                    </div>
                    
                    {/* Glowing Sentiment Pill */}
                    <div className={`p-1.5 rounded-lg border ${
                      isPositive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 
                      isNegative ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_10px_rgba(225,29,72,0.1)]' :
                      'bg-slate-500/10 border-slate-500/20 text-slate-400'
                    }`}>
                      {isPositive ? <TrendingUp className="w-4 h-4" /> : 
                       isNegative ? <TrendingDown className="w-4 h-4" /> : 
                       <TrendingUp className="w-4 h-4 opacity-50" />}
                    </div>
                  </div>
                  
                  {/* Headline */}
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-3 leading-snug mb-3">
                    {item.title}
                  </h3>
                </div>

                {/* Article Footer */}
                <div className="mt-auto border-t border-slate-700/50 pt-4 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{item.time || item.published?.split(' ').slice(1,4).join(' ') || 'Recent'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-cyan-400 transition-colors uppercase tracking-wider">
                    Read <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              </a>
            );
          })
        ) : (
          <div className="col-span-full py-24 text-center glass-panel rounded-3xl border-dashed border-2 border-slate-700 bg-slate-800/20 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-slate-700">
              <Newspaper className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-300 mb-2">Awaiting Intelligence</h3>
            <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
              The market feed is currently quiet. Check back shortly for updated sentiment analysis and breaking news.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default News;