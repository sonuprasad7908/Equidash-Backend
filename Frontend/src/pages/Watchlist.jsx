import React, { useState, useEffect, useCallback } from 'react';
import { Star, Plus, Trash2, TrendingUp, TrendingDown, Search, RefreshCw, AlertCircle } from 'lucide-react';
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
    } catch (e) {
      setError('Failed to load watchlist.');
    } finally { setLoading(false); }
  }, [user.id]);

  const fetchPrices = async (list) => {
    setRefreshing(true);
    const prices = {};
    await Promise.all(list.map(async (item) => {
      try {
        const res = await fetch(`${API}/stock/${item.ticker}`);
        const data = await res.json();
        prices[item.ticker] = { price: data.price, change: data.change, name: data.name };
      } catch (e) { prices[item.ticker] = null; }
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
    } catch (e) { setError('Failed to add stock.'); }
    finally { setAdding(false); }
  };

  const handleRemove = async (ticker) => {
    try {
      await fetch(`${API}/watchlist/${user.id}/remove/${ticker}`, { method: 'DELETE' });
      await loadWatchlist();
    } catch (e) { setError('Failed to remove stock.'); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-14 h-14 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
      <p className="text-cyan-400 font-mono text-sm animate-pulse uppercase tracking-widest">Loading Watchlist...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Watchlist</h1>
          <p className="text-cyan-400 text-sm mt-0.5 font-medium">Track your favourite stocks</p>
        </div>
        <button onClick={() => fetchPrices(watchlist)} className="glass-panel p-2.5 rounded-xl text-slate-400 hover:text-cyan-400 transition-all">
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Add Stock */}
      <div className="glass-panel p-5 rounded-2xl">
        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-3">Add Stock to Watchlist</p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input type="text" value={newTicker} onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Enter NSE ticker... e.g. RELIANCE"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white text-sm font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all" />
          </div>
          <button onClick={handleAdd} disabled={adding || !newTicker.trim()}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-900 font-bold px-5 py-2.5 rounded-xl transition-all text-sm">
            <Plus size={16} /> Add
          </button>
        </div>
        {/* Quick add popular stocks */}
        <div className="flex flex-wrap gap-2 mt-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider w-full">Quick Add:</p>
          {['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN', 'TATAMOTORS', 'WIPRO', 'ITC'].map(t => (
            <button key={t} onClick={() => { setNewTicker(t); }}
              className="text-[10px] font-mono px-2 py-1 bg-slate-800/60 border border-slate-700/50 text-slate-400 rounded-lg hover:text-cyan-400 hover:border-cyan-500/30 transition-all">
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="flex items-center gap-2 text-rose-400 text-sm"><AlertCircle size={16} />{error}</div>}

      {/* Watchlist Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Star className="text-yellow-400" size={16} />
            <h2 className="text-base font-bold text-white">My Watchlist</h2>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/50">{watchlist.length} stocks</span>
        </div>

        {watchlist.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700">
              <Star className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-300 mb-2">No stocks yet</h3>
            <p className="text-slate-500 text-sm">Add stocks above to start tracking them.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {watchlist.map((item, i) => {
              const stock = stockPrices[item.ticker];
              const isPositive = stock?.change >= 0;
              return (
                <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {item.ticker[0]}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{item.ticker}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[150px]">{stock?.name || 'Loading...'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {stock ? (
                      <>
                        <div className="text-right">
                          <p className="font-bold font-mono text-white text-sm">₹{fmt(stock.price)}</p>
                          <p className={`text-xs font-bold font-mono flex items-center gap-1 justify-end ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {isPositive ? '+' : ''}{stock.change?.toFixed(2)}%
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-slate-500 text-xs">Loading...</p>
                    )}
                    <button onClick={() => handleRemove(item.ticker)} className="text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;