import React, { useState } from 'react';
import { Plus, X, Search, TrendingUp, TrendingDown, BarChart2, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { API } from '../utils/app';

const COLORS = ['#06b6d4', '#f59e0b', '#a855f7'];
const COLOR_NAMES = ['cyan', 'amber', 'purple'];

const Compare = () => {
  const [tickers, setTickers] = useState(['RELIANCE', 'TCS']);
  const [inputTicker, setInputTicker] = useState('');
  const [stocksData, setStocksData] = useState({});
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const fmt = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const addTicker = () => {
    const t = inputTicker.trim().toUpperCase();
    if (!t) return;
    if (tickers.includes(t)) { setError('Stock already added!'); return; }
    if (tickers.length >= 3) { setError('Max 3 stocks can be compared.'); return; }
    setTickers(prev => [...prev, t]);
    setInputTicker('');
    setError('');
  };

  const removeTicker = (t) => {
    setTickers(prev => prev.filter(s => s !== t));
    setStocksData(prev => { const n = {...prev}; delete n[t]; return n; });
  };

  const loadComparison = async () => {
    if (tickers.length < 2) { setError('Add at least 2 stocks to compare.'); return; }
    setLoading(true);
    setLoaded(false);
    setError('');
    const results = {};
    await Promise.all(tickers.map(async (ticker) => {
      try {
        const res = await fetch(`${API}/stock/${ticker}`);
        const data = await res.json();
        if (data.price) results[ticker] = data;
        else setError(`${ticker} not found.`);
      } catch (e) { setError(`Failed to load ${ticker}.`); }
    }));
    setStocksData(results);
    setLoading(false);
    setLoaded(true);
  };

  // Build chart data from price history
  const buildChartData = () => {
    const allDates = new Set();
    Object.values(stocksData).forEach(s => s.chart_data?.dates?.forEach(d => allDates.add(d)));
    const sortedDates = Array.from(allDates).sort().slice(-90); // Last 90 days

    return sortedDates.map(date => {
      const point = { date: date.slice(5) }; // MM-DD format
      tickers.forEach(ticker => {
        const s = stocksData[ticker];
        if (s?.chart_data) {
          const idx = s.chart_data.dates.indexOf(date);
          if (idx !== -1) {
            // Normalize to % change from first point for fair comparison
            const firstPrice = s.chart_data.close[0];
            const price = s.chart_data.close[idx];
            point[ticker] = parseFloat(((price - firstPrice) / firstPrice * 100).toFixed(2));
          }
        }
      });
      return point;
    });
  };

  const MetricRow = ({ label, values, format = (v) => v, colorize = false }) => (
    <tr className="border-b border-slate-700/20 hover:bg-slate-800/20 transition-colors">
      <td className="py-3 pl-6 text-slate-400 text-sm font-medium">{label}</td>
      {tickers.map((ticker, i) => {
        const val = values[ticker];
        const formatted = val !== undefined && val !== null ? format(val) : 'N/A';
        let color = 'text-white';
        if (colorize && typeof val === 'number') {
          color = val >= 0 ? 'text-emerald-400' : 'text-rose-400';
        }
        return (
          <td key={ticker} className={`py-3 px-4 font-mono font-bold text-right text-sm ${color}`}>
            {formatted}
          </td>
        );
      })}
    </tr>
  );

  const chartData = loaded ? buildChartData() : [];

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Stock Comparison</h1>
        <p className="text-cyan-400 text-sm mt-0.5 font-medium">Compare up to 3 stocks side by side</p>
      </div>

      {/* Stock Selector */}
      <div className="glass-panel p-5 rounded-2xl">
        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-3">Select Stocks to Compare</p>

        {/* Selected Tickers */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tickers.map((t, i) => (
            <div key={t} className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold"
              style={{ borderColor: COLORS[i] + '50', backgroundColor: COLORS[i] + '15', color: COLORS[i] }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
              {t}
              {tickers.length > 2 && (
                <button onClick={() => removeTicker(t)} className="opacity-60 hover:opacity-100 ml-1">
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
          {tickers.length < 3 && (
            <div className="text-xs text-slate-500 flex items-center px-3">
              + Add {3 - tickers.length} more
            </div>
          )}
        </div>

        {/* Add Ticker Input */}
        {tickers.length < 3 && (
          <div className="flex gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
              <input type="text" value={inputTicker}
                onChange={e => setInputTicker(e.target.value.toUpperCase())}
                onKeyPress={e => e.key === 'Enter' && addTicker()}
                placeholder="Add ticker... e.g. INFY"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white text-sm font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all" />
            </div>
            <button onClick={addTicker}
              className="flex items-center gap-2 glass-panel px-4 py-2.5 rounded-xl text-slate-400 hover:text-cyan-400 text-sm font-bold transition-all">
              <Plus size={16} /> Add
            </button>
          </div>
        )}

        {/* Quick Add */}
        <div className="flex flex-wrap gap-2 mb-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider w-full">Quick Add:</p>
          {['HDFCBANK', 'INFY', 'SBIN', 'WIPRO', 'ITC', 'ADANIENT'].filter(t => !tickers.includes(t)).map(t => (
            <button key={t} onClick={() => { setInputTicker(t); }}
              className="text-[10px] font-mono px-2 py-1 bg-slate-800/60 border border-slate-700/50 text-slate-400 rounded-lg hover:text-cyan-400 hover:border-cyan-500/30 transition-all">
              {t}
            </button>
          ))}
        </div>

        {error && <p className="text-rose-400 text-sm mb-3">⚠️ {error}</p>}

        <button onClick={loadComparison} disabled={loading || tickers.length < 2}
          className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-900 font-bold py-3 rounded-xl transition-all text-sm shadow-[0_0_12px_rgba(34,211,238,0.3)]">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Loading...' : loaded ? 'Refresh Comparison' : 'Compare Stocks'}
        </button>
      </div>

      {/* Results */}
      {loaded && Object.keys(stocksData).length >= 2 && (
        <>
          {/* Price Performance Chart */}
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-base font-bold text-white mb-1">Price Performance (Last 90 Days)</h3>
            <p className="text-xs text-slate-400 mb-4">Normalized % return from start date</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} interval={14} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(value, name) => [`${value}%`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {tickers.map((ticker, i) => (
                    stocksData[ticker] && (
                      <Line key={ticker} type="monotone" dataKey={ticker}
                        stroke={COLORS[i]} strokeWidth={2} dot={false}
                        activeDot={{ r: 4, fill: COLORS[i] }} />
                    )
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Metrics Comparison Table */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50">
              <h3 className="text-base font-bold text-white">Key Metrics Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-900/40 border-b border-slate-700/50">
                    <th className="py-3 pl-6 text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Metric</th>
                    {tickers.map((ticker, i) => (
                      <th key={ticker} className="py-3 px-4 text-right text-sm font-bold" style={{ color: COLORS[i] }}>
                        {stocksData[ticker]?.name?.split(' ').slice(0, 2).join(' ') || ticker}
                        <p className="text-[10px] text-slate-500 font-normal">{ticker}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <MetricRow label="Current Price" values={Object.fromEntries(tickers.map(t => [t, stocksData[t]?.price]))} format={v => `₹${fmt(v)}`} />
                  <MetricRow label="Day Change %" values={Object.fromEntries(tickers.map(t => [t, stocksData[t]?.change]))} format={v => `${v >= 0 ? '+' : ''}${v?.toFixed(2)}%`} colorize />
                  <MetricRow label="Market Cap" values={Object.fromEntries(tickers.map(t => [t, stocksData[t]?.market_cap]))} format={v => `₹${(v / 10000000).toFixed(0)}Cr`} />
                  <MetricRow label="P/E Ratio" values={Object.fromEntries(tickers.map(t => [t, stocksData[t]?.pe_ratio]))} format={v => v ? v.toFixed(2) : 'N/A'} />
                  <MetricRow label="52W High" values={Object.fromEntries(tickers.map(t => [t, stocksData[t]?.week_52_high]))} format={v => `₹${fmt(v)}`} />
                  <MetricRow label="52W Low" values={Object.fromEntries(tickers.map(t => [t, stocksData[t]?.week_52_low]))} format={v => `₹${fmt(v)}`} />
                  <MetricRow label="RSI (14)" values={Object.fromEntries(tickers.map(t => [t, stocksData[t]?.indicators?.rsi]))} format={v => v?.toFixed(1)} />
                  <MetricRow label="MACD" values={Object.fromEntries(tickers.map(t => [t, stocksData[t]?.indicators?.macd]))} format={v => v?.toFixed(2)} colorize />
                  <MetricRow label="SMA 20" values={Object.fromEntries(tickers.map(t => [t, stocksData[t]?.indicators?.sma_20]))} format={v => `₹${fmt(v)}`} />
                  <MetricRow label="Volume" values={Object.fromEntries(tickers.map(t => [t, stocksData[t]?.volume]))} format={v => `${(v / 1000000).toFixed(2)}M`} />
                </tbody>
              </table>
            </div>

            {/* Winner Row */}
            <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/20">
              <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider font-semibold">Quick Verdict</p>
              <div className="flex gap-3 flex-wrap">
                {(() => {
                  const validStocks = tickers.filter(t => stocksData[t]);
                  const bestChange = validStocks.reduce((best, t) =>
                    (stocksData[t]?.change || -999) > (stocksData[best]?.change || -999) ? t : best, validStocks[0]);
                  const lowestPE = validStocks.filter(t => stocksData[t]?.pe_ratio > 0).reduce((best, t) =>
                    (stocksData[t]?.pe_ratio || 999) < (stocksData[best]?.pe_ratio || 999) ? t : best, validStocks[0]);
                  const highestRSI = validStocks.reduce((best, t) =>
                    (stocksData[t]?.indicators?.rsi || 0) > (stocksData[best]?.indicators?.rsi || 0) ? t : best, validStocks[0]);

                  return [
                    { label: '📈 Best Today', ticker: bestChange },
                    { label: '💰 Most Undervalued (P/E)', ticker: lowestPE },
                    { label: '⚡ Strongest Momentum', ticker: highestRSI },
                  ].map(({ label, ticker }) => {
                    const idx = tickers.indexOf(ticker);
                    return (
                      <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs"
                        style={{ borderColor: COLORS[idx] + '40', backgroundColor: COLORS[idx] + '10', color: COLORS[idx] }}>
                        <span className="text-slate-400">{label}:</span>
                        <span className="font-bold">{ticker}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Compare;