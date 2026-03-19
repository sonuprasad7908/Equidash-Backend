import React, { useState, useRef } from 'react';
import { Filter, TrendingUp, TrendingDown, RefreshCw, Search, Play } from 'lucide-react';
import { API } from '../utils/app';

const STOCKS = [
  'RELIANCE','TCS','HDFCBANK','ICICIBANK','INFY','SBIN','WIPRO','HCLTECH',
  'BAJFINANCE','MARUTI','SUNPHARMA','ONGC','NTPC','ADANIENT','ITC',
  'HINDUNILVR','TITAN','AXISBANK','KOTAKBANK','BHARTIARTL','TATASTEEL',
  'JSWSTEEL','TECHM','DRREDDY','CIPLA','DIVISLAB','APOLLOHOSP','COALINDIA',
  'BPCL','INDUSINDBK',
  // ✅ Tata Motors split into 2 in Oct 2025
  'TMPV','TMCV'
];

const Screener = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('change');
  const [sortDir, setSortDir] = useState('desc');
  const [filters, setFilters] = useState({
    minRsi: 0, maxRsi: 100,
    minChange: -20, maxChange: 20,
    signal: 'all'
  });
  const abortRef = useRef(false);

  const fmt = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const loadScreener = async () => {
    setLoading(true);
    setLoaded(false);
    setStocks([]);
    setProgress(0);
    abortRef.current = false;

    const results = [];
    for (let i = 0; i < STOCKS.length; i++) {
      if (abortRef.current) break;
      const ticker = STOCKS[i];
      try {
        const res = await fetch(`${API}/stock/${ticker}`);
        const data = await res.json();
        if (data.price) {
          results.push({
            ticker,
            name: data.name,
            price: data.price,
            change: data.change,
            market_cap: data.market_cap,
            volume: data.volume,
            pe_ratio: data.pe_ratio,
            rsi: data.indicators?.rsi,
            macd: data.indicators?.macd,
            sma_20: data.indicators?.sma_20,
            signal: data.indicators?.macd > 0 ? 'BUY' : 'SELL'
          });
          setStocks([...results]);
        }
      } catch (e) {}
      setProgress(i + 1);
    }

    setLoading(false);
    setLoaded(true);
  };

  const stopScreener = () => {
    abortRef.current = true;
    setLoading(false);
    setLoaded(true);
  };

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const filtered = stocks
    .filter(s => s.ticker.includes(search.toUpperCase()) || s.name?.toLowerCase().includes(search.toLowerCase()))
    .filter(s => (s.rsi || 50) >= filters.minRsi && (s.rsi || 50) <= filters.maxRsi)
    .filter(s => s.change >= filters.minChange && s.change <= filters.maxChange)
    .filter(s => filters.signal === 'all' || s.signal === filters.signal)
    .sort((a, b) => {
      const av = a[sortBy] || 0, bv = b[sortBy] || 0;
      return sortDir === 'asc' ? av - bv : bv - av;
    });

  const SortHeader = ({ col, label }) => (
    <th className="py-3 px-4 text-right cursor-pointer hover:text-cyan-400 transition-colors select-none"
      onClick={() => handleSort(col)}>
      {label} {sortBy === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </th>
  );

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Stock Screener</h1>
        <p className="text-cyan-400 text-sm mt-0.5 font-medium">Filter & discover stocks by technical indicators</p>
      </div>

      {/* Filters */}
      <div className="glass-panel p-5 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-cyan-400" />
          <p className="text-sm font-bold text-white uppercase tracking-wider">Filters</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Min RSI</label>
            <input type="number" value={filters.minRsi} onChange={e => setFilters(f => ({...f, minRsi: +e.target.value}))} min={0} max={100}
              className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition-all" />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Max RSI</label>
            <input type="number" value={filters.maxRsi} onChange={e => setFilters(f => ({...f, maxRsi: +e.target.value}))} min={0} max={100}
              className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition-all" />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Min Change %</label>
            <input type="number" value={filters.minChange} onChange={e => setFilters(f => ({...f, minChange: +e.target.value}))}
              className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition-all" />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Max Change %</label>
            <input type="number" value={filters.maxChange} onChange={e => setFilters(f => ({...f, maxChange: +e.target.value}))}
              className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition-all" />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Signal</label>
            <select value={filters.signal} onChange={e => setFilters(f => ({...f, signal: e.target.value}))}
              className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition-all">
              <option value="all">All Signals</option>
              <option value="BUY">BUY only</option>
              <option value="SELL">SELL only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search + Run Button */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by ticker or company name..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all" />
        </div>
        {loading ? (
          <button onClick={stopScreener}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-400 text-white font-bold px-6 py-2.5 rounded-xl transition-all text-sm">
            <RefreshCw size={16} className="animate-spin" />
            Stop ({progress}/{STOCKS.length})
          </button>
        ) : (
          <button onClick={loadScreener}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold px-6 py-2.5 rounded-xl transition-all text-sm shadow-[0_0_12px_rgba(34,211,238,0.3)]">
            <Play size={16} />
            {loaded ? 'Refresh Screener' : 'Run Screener'}
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {loading && (
        <div className="glass-panel p-4 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-slate-400">Scanning stocks...</p>
            <p className="text-sm font-bold text-cyan-400">{progress}/{STOCKS.length}</p>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${(progress / STOCKS.length) * 100}%` }}></div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loaded && !loading && (
        <div className="glass-panel p-12 rounded-2xl text-center">
          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 mx-auto border border-slate-700">
            <Filter className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-300 mb-2">Ready to Screen</h3>
          <p className="text-slate-500 text-sm mb-4">Click "Run Screener" to scan {STOCKS.length} NSE stocks with live technical data</p>
          <div className="flex flex-wrap justify-center gap-2">
            {STOCKS.slice(0, 8).map(t => (
              <span key={t} className="text-xs font-mono px-2 py-1 bg-slate-800/60 text-slate-400 rounded-lg border border-slate-700/50">{t}</span>
            ))}
            <span className="text-xs font-mono px-2 py-1 bg-slate-800/60 text-slate-400 rounded-lg border border-slate-700/50">+{STOCKS.length - 8} more</span>
          </div>
        </div>
      )}

      {/* Results Table */}
      {(loaded || loading) && stocks.length > 0 && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
            <h2 className="text-base font-bold text-white">
              Results {loading && <span className="text-cyan-400 text-sm">(loading...)</span>}
            </h2>
            <span className="text-xs font-mono text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/50">
              {filtered.length} of {stocks.length} stocks
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-slate-900/40 border-b border-slate-700/50 text-[10px] uppercase tracking-widest text-slate-400">
                  <th className="py-3 pl-6 font-semibold">Ticker</th>
                  <SortHeader col="price" label="Price" />
                  <SortHeader col="change" label="Change %" />
                  <SortHeader col="rsi" label="RSI" />
                  <SortHeader col="macd" label="MACD" />
                  <SortHeader col="pe_ratio" label="P/E" />
                  <SortHeader col="market_cap" label="Mkt Cap" />
                  <th className="py-3 pr-6 text-right font-semibold">Signal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={i} className="border-b border-slate-700/20 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 pl-6">
                      <div>
                        <p className="font-bold text-white text-sm">{s.ticker}</p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{s.name}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white text-right text-sm">₹{fmt(s.price)}</td>
                    <td className={`py-3.5 px-4 font-mono font-bold text-right text-sm ${s.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      <div className="flex items-center justify-end gap-1">
                        {s.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {s.change >= 0 ? '+' : ''}{s.change?.toFixed(2)}%
                      </div>
                    </td>
                    <td className={`py-3.5 px-4 font-mono text-right text-sm font-bold ${s.rsi > 70 ? 'text-rose-400' : s.rsi < 30 ? 'text-emerald-400' : 'text-white'}`}>
                      {s.rsi?.toFixed(1)}
                      <p className="text-[9px] text-slate-500 font-normal">{s.rsi > 70 ? 'Overbought' : s.rsi < 30 ? 'Oversold' : 'Neutral'}</p>
                    </td>
                    <td className={`py-3.5 px-4 font-mono text-right text-sm ${s.macd > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{s.macd?.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300 text-right text-sm">{s.pe_ratio ? s.pe_ratio.toFixed(1) : 'N/A'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300 text-right text-sm">{s.market_cap ? `₹${(s.market_cap / 10000000).toFixed(0)}Cr` : 'N/A'}</td>
                    <td className="py-3.5 pr-6 text-right">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.signal === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                        {s.signal}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Screener;