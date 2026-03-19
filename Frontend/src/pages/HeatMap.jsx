import React, { useState } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API } from '../utils/app';

const SECTORS = {
  'Banking': ['HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK', 'INDUSINDBK'],
  'IT': ['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM', 'LTIM'],
  'Energy': ['RELIANCE', 'ONGC', 'BPCL', 'COALINDIA', 'NTPC', 'POWERGRID'],
  'Auto': ['MARUTI', 'TMPV', 'TMCV', 'BAJAJ-AUTO', 'HEROMOTOCO', 'EICHERMOT'],
  'Pharma': ['SUNPHARMA', 'DRREDDY', 'CIPLA', 'DIVISLAB', 'APOLLOHOSP'],
  'FMCG': ['HINDUNILVR', 'ITC', 'NESTLEIND', 'BRITANNIA', 'DABUR'],
  'Metal': ['TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'VEDL', 'SAIL'],
  'Infra': ['ADANIENT', 'ADANIPORTS', 'LT', 'ULTRACEMCO', 'GRASIM'],
};

const getColor = (change) => {
  if (change === null || change === undefined) return { bg: 'bg-slate-800', text: 'text-slate-500', border: 'border-slate-700' };
  if (change >= 3) return { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-500' };
  if (change >= 1.5) return { bg: 'bg-emerald-500/80', text: 'text-white', border: 'border-emerald-400' };
  if (change >= 0.5) return { bg: 'bg-emerald-500/50', text: 'text-white', border: 'border-emerald-500/50' };
  if (change >= 0) return { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/20' };
  if (change >= -0.5) return { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/20' };
  if (change >= -1.5) return { bg: 'bg-rose-500/50', text: 'text-white', border: 'border-rose-400' };
  if (change >= -3) return { bg: 'bg-rose-500/80', text: 'text-white', border: 'border-rose-500' };
  return { bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-600' };
};

const HeatMap = () => {
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [tooltip, setTooltip] = useState(null);
  const navigate = useNavigate();

  const allStocks = Object.values(SECTORS).flat();

  const loadHeatMap = async () => {
    setLoading(true);
    setLoaded(false);
    setStockData({});
    setProgress(0);
    setTotal(allStocks.length);

    const results = {};
    for (let i = 0; i < allStocks.length; i++) {
      const ticker = allStocks[i];
      try {
        const res = await fetch(`${API}/stock/${ticker}`);
        const data = await res.json();
        if (data.price) {
          results[ticker] = { price: data.price, change: data.change, name: data.name, market_cap: data.market_cap };
          setStockData({ ...results });
        }
      } catch (e) {}
      setProgress(i + 1);
    }
    setLoading(false);
    setLoaded(true);
  };

  const marketSummary = Object.values(stockData);
  const gainers = marketSummary.filter(s => s.change > 0).length;
  const losers = marketSummary.filter(s => s.change < 0).length;
  const avgChange = marketSummary.length > 0
    ? (marketSummary.reduce((s, d) => s + d.change, 0) / marketSummary.length).toFixed(2)
    : 0;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Market Heat Map</h1>
          <p className="text-cyan-400 text-sm mt-0.5 font-medium">Visual overview of NSE stock performance by sector</p>
        </div>
        <button onClick={loadHeatMap} disabled={loading}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-900 font-bold px-5 py-2.5 rounded-xl transition-all text-sm shadow-[0_0_12px_rgba(34,211,238,0.3)]">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? `Loading ${progress}/${total}...` : loaded ? 'Refresh' : 'Load Heat Map'}
        </button>
      </div>

      {/* Progress */}
      {loading && (
        <div className="glass-panel p-4 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-slate-400">Fetching market data...</p>
            <p className="text-sm font-bold text-cyan-400">{progress}/{total}</p>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${(progress / total) * 100}%` }}></div>
          </div>
        </div>
      )}

      {/* Market Summary */}
      {loaded && marketSummary.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Stocks Loaded', value: marketSummary.length, color: 'text-white' },
            { label: 'Gainers', value: gainers, color: 'text-emerald-400', icon: TrendingUp },
            { label: 'Losers', value: losers, color: 'text-rose-400', icon: TrendingDown },
            { label: 'Avg Change', value: `${avgChange >= 0 ? '+' : ''}${avgChange}%`, color: avgChange >= 0 ? 'text-emerald-400' : 'text-rose-400' },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="glass-panel p-4 rounded-xl text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      {loaded && (
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Legend:</p>
          {[
            { label: '> +3%', bg: 'bg-emerald-600' },
            { label: '+1.5%', bg: 'bg-emerald-500/80' },
            { label: '+0.5%', bg: 'bg-emerald-500/50' },
            { label: '~0%', bg: 'bg-emerald-500/20' },
            { label: '-0.5%', bg: 'bg-rose-500/20' },
            { label: '-1.5%', bg: 'bg-rose-500/50' },
            { label: '-3%', bg: 'bg-rose-500/80' },
            { label: '< -3%', bg: 'bg-rose-600' },
          ].map(({ label, bg }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded ${bg}`}></div>
              <span className="text-[10px] text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loaded && !loading && (
        <div className="glass-panel p-16 rounded-2xl text-center">
          <div className="grid grid-cols-8 gap-1 max-w-xs mx-auto mb-6 opacity-30">
            {Array(32).fill(0).map((_, i) => (
              <div key={i} className={`h-8 rounded ${i % 3 === 0 ? 'bg-emerald-500' : i % 5 === 0 ? 'bg-rose-500' : 'bg-slate-700'}`}></div>
            ))}
          </div>
          <h3 className="text-lg font-bold text-slate-300 mb-2">Market Heat Map</h3>
          <p className="text-slate-500 text-sm mb-4">Click "Load Heat Map" to see live NSE stock performance by sector</p>
          <p className="text-xs text-slate-600">~{allStocks.length} stocks across {Object.keys(SECTORS).length} sectors</p>
        </div>
      )}

      {/* Heat Map Grid */}
      {(loaded || loading) && Object.keys(stockData).length > 0 && (
        <div className="space-y-4">
          {Object.entries(SECTORS).map(([sector, tickers]) => {
            const sectorStocks = tickers.filter(t => stockData[t]);
            if (sectorStocks.length === 0 && !loading) return null;
            const sectorAvg = sectorStocks.length > 0
              ? sectorStocks.reduce((s, t) => s + (stockData[t]?.change || 0), 0) / sectorStocks.length
              : 0;
            const sectorColors = getColor(sectorAvg);

            return (
              <div key={sector} className="glass-panel p-4 rounded-2xl">
                {/* Sector Header */}
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">{sector}</h3>
                  {sectorStocks.length > 0 && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${sectorColors.border} ${sectorColors.bg} ${sectorColors.text}`}>
                      {sectorAvg >= 0 ? '+' : ''}{sectorAvg.toFixed(2)}% avg
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500 ml-auto">{sectorStocks.length}/{tickers.length} loaded</span>
                </div>

                {/* Stock Tiles */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {tickers.map(ticker => {
                    const stock = stockData[ticker];
                    const colors = getColor(stock?.change);
                    return (
                      <div
                        key={ticker}
                        onClick={() => stock && navigate(`/?ticker=${ticker}`)}
                        onMouseEnter={() => stock && setTooltip({ ticker, ...stock })}
                        onMouseLeave={() => setTooltip(null)}
                        className={`relative p-3 rounded-xl border cursor-pointer transition-all hover:scale-105 hover:z-10 ${colors.bg} ${colors.border} ${stock ? 'hover:brightness-110' : 'opacity-40'}`}
                      >
                        <p className={`text-xs font-bold truncate ${colors.text}`}>{ticker}</p>
                        {stock ? (
                          <>
                            <p className={`text-[10px] font-mono mt-0.5 ${colors.text} opacity-80`}>
                              ₹{stock.price?.toFixed(0)}
                            </p>
                            <p className={`text-[10px] font-bold ${colors.text}`}>
                              {stock.change >= 0 ? '+' : ''}{stock.change?.toFixed(2)}%
                            </p>
                          </>
                        ) : (
                          <div className="h-2 bg-slate-700 rounded animate-pulse mt-1"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 glass-panel px-5 py-3 rounded-2xl border border-slate-600 shadow-2xl flex items-center gap-4">
          <div>
            <p className="text-white font-bold">{tooltip.ticker}</p>
            <p className="text-xs text-slate-400 truncate max-w-[200px]">{tooltip.name}</p>
          </div>
          <div className="text-right">
            <p className="text-white font-mono font-bold">₹{tooltip.price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className={`text-sm font-bold ${tooltip.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {tooltip.change >= 0 ? '+' : ''}{tooltip.change?.toFixed(2)}%
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Info size={12} /> Click to view chart
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatMap;