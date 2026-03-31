import React, { useState, useEffect, useCallback } from 'react';
import { Star, Plus, Trash2, TrendingUp, TrendingDown, Search, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { API } from '../utils/app';

const Watchlist = ({ user }) => {
  const [watchlist, setWatchlist] = useState([]);
  const [stockPrices, setStockPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newTicker, setNewTicker] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  const fmt = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const loadWatchlist = useCallback(async () => {
    try {
      const res = await fetch(`${API}/watchlist/${user.id}`);
      const data = await res.json();
      setWatchlist(data);
      await fetchPrices(data);
    } catch { setError('Failed to load watchlist.'); }
    finally { setLoading(false); }
  }, [user.id]);

  const fetchPrices = async (list) => {
    setRefreshing(true);
    const prices = {};
    await Promise.all(list.map(async (item) => {
      try {
        const res = await fetch(`${API}/stock/${item.ticker}`);
        const data = await res.json();
        prices[item.ticker] = { price: data.price, change: data.change, name: data.name };
      } catch { prices[item.ticker] = null; }
    }));
    setStockPrices(prices);
    setRefreshing(false);
  };

  useEffect(() => { loadWatchlist(); }, [loadWatchlist]);

  const handleAdd = async () => {
    if (!newTicker.trim()) return;
    setAdding(true);
    try {
      await fetch(`${API}/watchlist/${user.id}/add/${newTicker.toUpperCase()}`, { method: 'POST' });
      setNewTicker('');
      await loadWatchlist();
    } catch { setError('Failed to add stock.'); }
    finally { setAdding(false); }
  };

  const handleRemove = async (ticker) => {
    try {
      await fetch(`${API}/watchlist/${user.id}/remove/${ticker}`, { method: 'DELETE' });
      await loadWatchlist();
    } catch { setError('Failed to remove stock.'); }
  };

  const POPULAR = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN', 'WIPRO', 'ITC', 'AXISBANK'];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-white/[0.06] border-t-cyan-500 rounded-full animate-spin"></div>
      <p className="text-cyan-400 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Watchlist...</p>
    </div>
  );

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Watchlist</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track your favourite stocks</p>
        </div>
        <button onClick={() => fetchPrices(watchlist)}
          className="p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Add Stock */}
      <div className="p-5 rounded-2xl border bg-white/[0.02] border-white/[0.07]">
        <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mb-3">Add Stock</p>
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-600" size={14} />
            <input type="text" value={newTicker}
              onChange={e => setNewTicker(e.target.value.toUpperCase())}
              onKeyPress={e => e.key === 'Enter' && handleAdd()}
              placeholder="Enter NSE ticker... e.g. RELIANCE"
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all" />
          </div>
          <button onClick={handleAdd} disabled={adding || !newTicker.trim()}
            className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-900 font-black px-4 py-2.5 rounded-xl transition-all text-xs shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR.filter(t => !watchlist.find(w => w.ticker === t)).map(t => (
            <button key={t} onClick={() => setNewTicker(t)}
              className="text-[10px] font-mono px-2.5 py-1 bg-white/[0.04] border border-white/[0.07] text-slate-500 rounded-lg hover:text-cyan-400 hover:border-cyan-500/25 transition-all">
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-rose-400 text-xs p-3 rounded-xl bg-rose-950/20 border border-rose-500/20">
          <AlertCircle size={14} />{error}
        </div>
      )}

      {/* Watchlist */}
      <div className="rounded-2xl border bg-white/[0.02] border-white/[0.07] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star size={14} className="text-amber-400" />
            <h2 className="text-sm font-black text-white">My Watchlist</h2>
          </div>
          <span className="text-[10px] font-bold text-slate-600 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.07]">{watchlist.length} stocks</span>
        </div>

        {watchlist.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center mb-3">
              <Star className="w-5 h-5 text-slate-600" />
            </div>
            <p className="text-slate-400 font-bold text-sm mb-1">Watchlist is empty</p>
            <p className="text-slate-600 text-xs">Add stocks above to start tracking live prices.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {watchlist.map((item, i) => {
              const stock = stockPrices[item.ticker];
              const isPositive = (stock?.change || 0) >= 0;
              const colors = ['bg-cyan-500/15', 'bg-indigo-500/15', 'bg-violet-500/15', 'bg-amber-500/15', 'bg-emerald-500/15', 'bg-rose-500/15'];
              const textColors = ['text-cyan-400', 'text-indigo-400', 'text-violet-400', 'text-amber-400', 'text-emerald-400', 'text-rose-400'];
              return (
                <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${colors[i % colors.length]} flex items-center justify-center text-xs font-black flex-shrink-0 ${textColors[i % textColors.length]}`}>
                      {item.ticker.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-black text-white text-sm">{item.ticker}</p>
                      <p className="text-[10px] text-slate-600 truncate max-w-[150px]">{stock?.name || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {stock ? (
                      <div className="text-right">
                        <p className="font-black font-mono text-white text-sm">₹{fmt(stock.price)}</p>
                        <div className={`flex items-center justify-end gap-0.5 text-[11px] font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                          {isPositive ? '+' : ''}{stock.change?.toFixed(2)}%
                        </div>
                      </div>
                    ) : (
                      <div className="w-20 h-8 animate-pulse bg-white/[0.04] rounded-lg"></div>
                    )}
                    <button onClick={() => handleRemove(item.ticker)}
                      className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all p-1.5 rounded-lg hover:bg-rose-500/10">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {watchlist.length > 0 && (
          <div className="px-5 py-3 border-t border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
            <p className="text-[10px] text-slate-600">{watchlist.length} stocks tracked</p>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${refreshing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
              <p className="text-[10px] text-slate-600">{refreshing ? 'Refreshing...' : 'Live prices'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;