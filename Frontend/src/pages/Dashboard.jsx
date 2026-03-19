import CandlestickChart from '../components/CandlestickChart';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Search, Bot, X, TrendingUp, TrendingDown, RefreshCw, AlertCircle, CheckCircle, Globe, Sparkles } from 'lucide-react';
import Chatbot from '../components/Chatbot';
import { API } from '../utils/app';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-fade-in ${type === 'success' ? 'bg-emerald-900/80 border-emerald-500/50 text-emerald-300' : 'bg-rose-900/80 border-rose-500/50 text-rose-300'}`}>
      {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
};

const StatCard = ({ title, value, sub, subColor }) => (
  <div className="glass-panel px-4 py-3 rounded-xl flex flex-col gap-1 transition-all hover:bg-slate-800/50 overflow-hidden">
    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold truncate">{title}</p>
    <p className="text-base font-bold font-mono text-white truncate">{value}</p>
    <p className={`text-xs font-semibold truncate ${subColor || 'text-slate-500'}`}>{sub}</p>
  </div>
);

const SkeletonCard = () => (
  <div className="glass-panel px-4 py-3 rounded-xl animate-pulse">
    <div className="h-2 bg-slate-700 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
    <div className="h-2 bg-slate-700 rounded w-1/3"></div>
  </div>
);

// ── AI Market Summary ──
const AIMarketSummary = ({ marketOverview }) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const indicesText = marketOverview?.indices
        ?.map(i => `${i.name}: ${i.change >= 0 ? '+' : ''}${i.change?.toFixed(2)}%`)
        .join(', ') || 'No data';
      const gainersText = marketOverview?.gainers
        ?.slice(0, 3).map(s => `${s.ticker} +${s.change?.toFixed(2)}%`)
        .join(', ') || 'No data';
      const losersText = marketOverview?.losers
        ?.slice(0, 3).map(s => `${s.ticker} ${s.change?.toFixed(2)}%`)
        .join(', ') || 'No data';

      const res = await axios.post(`${API}/chat`, {
        message: `Give me a brief professional market summary based on this real data:
Indian Indices: ${indicesText}
Top Gainers: ${gainersText}
Top Losers: ${losersText}
Write 2 short paragraphs. Start with overall sentiment, then key movers. Be specific and professional. No markdown.`,
        ticker: 'NIFTY',
        user_id: 'market_summary'
      });
      setSummary(res.data.reply || '');
      setGenerated(true);
    } catch {
      setSummary('Unable to generate summary. Please check your backend connection.');
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center border border-indigo-500/30">
            <Sparkles size={16} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Market Summary</h3>
            <p className="text-[10px] text-slate-500">Powered by Groq LLaMA · Live Data</p>
          </div>
        </div>
        <button onClick={generateSummary} disabled={loading || !marketOverview}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/40 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]">
          <Sparkles size={12} className={loading ? 'animate-pulse' : ''} />
          {loading ? 'Analyzing...' : generated ? 'Regenerate' : 'Generate Summary'}
        </button>
      </div>

      {!generated && !loading && (
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20">
            <Bot size={20} className="text-indigo-400" />
          </div>
          <p className="text-slate-500 text-sm text-center max-w-sm">
            Click Generate for an AI-powered market briefing based on today's live NSE/BSE data
          </p>
        </div>
      )}

      {loading && (
        <div className="space-y-3 py-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-3 bg-slate-700/60 rounded w-full mb-2"></div>
              <div className="h-3 bg-slate-700/60 rounded w-4/5"></div>
            </div>
          ))}
          <p className="text-indigo-400 text-xs animate-pulse text-center">Analyzing live market data...</p>
        </div>
      )}

      {generated && !loading && summary && (
        <div className="space-y-3">
          <div className="h-px bg-indigo-500/20 w-full"></div>
          <p className="text-slate-300 text-sm leading-relaxed">{summary}</p>
          <div className="flex items-center gap-2 pt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <p className="text-[10px] text-slate-500 font-mono">Generated from live NSE/BSE market data</p>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = ({ user }) => {
  const [ticker, setTicker] = useState('RELIANCE');
  const [stockData, setStockData] = useState(null);
  const [marketOverview, setMarketOverview] = useState(null);
  const [globalIndices, setGlobalIndices] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [marketLoading, setMarketLoading] = useState(false);
  const [predictLoading, setPredictLoading] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeAction, setTradeAction] = useState('BUY');
  const [tradeQuantity, setTradeQuantity] = useState('');
  const [showChatbot, setShowChatbot] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTicker, setActiveTicker] = useState('RELIANCE');
  const [indicesTab, setIndicesTab] = useState('indian');

  const tickerRef = useRef(ticker);
  tickerRef.current = ticker;

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });
  const fmt = (n) => n?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const loadMarketOverview = useCallback(async () => {
    setMarketLoading(true);
    try {
      const [overviewRes, globalRes] = await Promise.all([
        axios.get(`${API}/market/overview`),
        axios.get(`${API}/market/global-indices`)
      ]);
      setMarketOverview(overviewRes.data);
      setGlobalIndices(globalRes.data);
    } catch (e) { console.error('Market overview error:', e); }
    finally { setMarketLoading(false); }
  }, []);

  const loadStockData = useCallback(async (t) => {
    const tickerToLoad = t || tickerRef.current;
    setLoading(true);
    setPrediction(null);
    try {
      const res = await axios.get(`${API}/stock/${tickerToLoad}`);
      setStockData(res.data);
      setActiveTicker(tickerToLoad);
    } catch {
      showToast(`"${tickerToLoad}" not found. Try another ticker.`, 'error');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadMarketOverview();
    loadStockData('RELIANCE');
  }, [loadMarketOverview, loadStockData]);

  const handlePrediction = async () => {
    setPredictLoading(true);
    try {
      const res = await axios.get(`${API}/stock/${activeTicker}/predict`);
      setPrediction(res.data);
    } catch { showToast('AI Forecast failed. Try again.', 'error'); }
    finally { setPredictLoading(false); }
  };

  const handleTrade = async () => {
    if (!tradeQuantity || tradeQuantity <= 0) { showToast('Enter a valid quantity.', 'error'); return; }
    try {
      const res = await axios.post(`${API}/trade/execute`, {
        user_id: user.id, action: tradeAction,
        ticker: stockData.ticker, quantity: parseFloat(tradeQuantity), price: stockData.price
      });
      if (res.data.status === 'success') {
        showToast(`${tradeAction} order for ${stockData.ticker} executed! 🎉`);
        setShowTradeModal(false); setTradeQuantity('');
      }
    } catch (e) { showToast('Trade failed: ' + (e.response?.data?.detail || e.message), 'error'); }
  };

  const handleTickerClick = (t) => { setTicker(t); loadStockData(t); };
  const currentIndices = indicesTab === 'indian' ? marketOverview?.indices : globalIndices;

  const recColor = (rec) => {
    if (!rec) return '';
    if (rec.includes('BUY')) return 'bg-emerald-500/20 text-emerald-400';
    if (rec.includes('SELL')) return 'bg-rose-500/20 text-rose-400';
    return 'bg-yellow-500/20 text-yellow-400';
  };

  const predBorderColor = (rec) => {
    if (!rec) return '';
    if (rec.includes('BUY')) return 'bg-emerald-900/10 border-emerald-500/30';
    if (rec.includes('SELL')) return 'bg-rose-900/10 border-rose-500/30';
    return 'bg-yellow-900/10 border-yellow-500/30';
  };

  return (
    <div className="space-y-5 pb-24" data-testid="dashboard-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Market Terminal</h1>
          <p className="text-cyan-400 text-sm mt-0.5 font-medium tracking-wide">AI Insights & Execution Engine</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <input type="text" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && loadStockData()}
              placeholder="Search ticker... e.g. TCS"
              className="pl-10 pr-4 py-2.5 w-full md:w-72 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white text-sm font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              data-testid="ticker-search-input" />
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          </div>
          <button onClick={() => loadStockData()} disabled={loading}
            className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-900 text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-[0_0_12px_rgba(34,211,238,0.3)] hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:-translate-y-0.5"
            data-testid="search-btn">
            {loading ? '...' : 'SEARCH'}
          </button>
        </div>
      </div>

      {/* AI Market Summary */}
      <AIMarketSummary marketOverview={marketOverview} />

      {/* Indices */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => setIndicesTab('indian')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${indicesTab === 'indian' ? 'bg-cyan-500 text-slate-900' : 'glass-panel text-slate-400 hover:text-white'}`}>
            🇮🇳 Indian
          </button>
          <button onClick={() => setIndicesTab('global')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${indicesTab === 'global' ? 'bg-cyan-500 text-slate-900' : 'glass-panel text-slate-400 hover:text-white'}`}>
            <Globe size={12} /> Global
          </button>
          <button onClick={loadMarketOverview} className="ml-auto glass-panel p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 transition-all">
            <RefreshCw size={14} className={marketLoading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar" data-testid="market-indices">
          {marketLoading
            ? [1,2,3,4].map(i => <div key={i} className="flex-1 min-w-[160px]"><SkeletonCard /></div>)
            : currentIndices?.map((idx, i) => (
              <div key={i} className="glass-panel px-4 py-3 rounded-xl flex-1 min-w-[160px] hover:-translate-y-0.5 transition-all">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold truncate">{idx.name}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${idx.change > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {idx.change > 0 ? '▲' : '▼'} {Math.abs(idx.change).toFixed(2)}%
                  </span>
                </div>
                <p className="text-base font-bold font-mono text-white">{idx.currency || '₹'}{fmt(idx.price)}</p>
              </div>
            ))
          }
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">

          {/* Stock Header */}
          {stockData && !loading && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800/80 border border-slate-700/50 rounded-xl flex items-center justify-center">
                  <span className="text-xs font-bold text-cyan-400">{stockData.ticker?.slice(0, 2)}</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">{stockData.name || stockData.ticker}</h2>
                  <p className="text-[11px] text-slate-400 font-mono">{stockData.ticker} · NSE</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setTradeAction('BUY'); setShowTradeModal(true); }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold px-5 py-2 rounded-xl transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:-translate-y-0.5" data-testid="buy-btn">BUY</button>
                <button onClick={() => { setTradeAction('SELL'); setShowTradeModal(true); }}
                  className="bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold px-5 py-2 rounded-xl transition-all shadow-[0_0_10px_rgba(225,29,72,0.3)] hover:-translate-y-0.5" data-testid="sell-btn">SELL</button>
              </div>
            </div>
          )}

          {/* Stat Cards */}
          {loading
            ? <div className="grid grid-cols-3 md:grid-cols-6 gap-3">{[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}</div>
            : stockData && (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3" data-testid="stock-stats">
                <StatCard title="Price" value={`₹${fmt(stockData.price)}`} sub={`${stockData.change >= 0 ? '+' : ''}${stockData.change?.toFixed(2)}%`} subColor={stockData.change >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
                <StatCard title="Mkt Cap" value={`₹${(stockData.market_cap / 10000000).toLocaleString('en-IN', { maximumFractionDigits: 0 })}Cr`} sub="Market Cap" />
                <StatCard title="Volume" value={`${(stockData.volume / 1000000).toFixed(2)}M`} sub="Shares Traded" />
                <StatCard title="P/E Ratio" value={stockData.pe_ratio ? stockData.pe_ratio.toFixed(2) : 'N/A'} sub="Trailing P/E" />
                <StatCard title="52W High" value={stockData.week_52_high ? `₹${fmt(stockData.week_52_high)}` : 'N/A'} sub={stockData.week_52_high ? `${(((stockData.price - stockData.week_52_high) / stockData.week_52_high) * 100).toFixed(1)}% from high` : ''} subColor="text-rose-400" />
                <StatCard title="52W Low" value={stockData.week_52_low ? `₹${fmt(stockData.week_52_low)}` : 'N/A'} sub={stockData.week_52_low ? `+${(((stockData.price - stockData.week_52_low) / stockData.week_52_low) * 100).toFixed(1)}% from low` : ''} subColor="text-emerald-400" />
              </div>
            )
          }

          {/* Chart */}
          <div className="glass-panel p-5 rounded-2xl" data-testid="chart-container">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700/50 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{stockData?.ticker || 'Chart'}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">1 Year Price History</p>
              </div>
              <button onClick={handlePrediction} disabled={predictLoading || !stockData}
                className="bg-indigo-500/10 border border-indigo-500/40 text-indigo-400 hover:bg-indigo-500 hover:text-white flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] disabled:opacity-50"
                data-testid="ai-forecast-btn">
                <Bot size={16} />
                {predictLoading ? 'Analyzing...' : 'AI Forecast'}
              </button>
            </div>
            {loading ? (
              <div className="h-80 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
                <p className="text-slate-400 text-sm animate-pulse">Fetching market data...</p>
              </div>
            ) : stockData ? (
              <div className="h-[360px] w-full"><CandlestickChart chartData={stockData.chart_data} /></div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <p className="text-slate-500 text-sm">Search for a ticker to view charts.</p>
              </div>
            )}

            {prediction && !prediction.error && (
              <div className={`mt-5 p-5 rounded-xl border ${predBorderColor(prediction.recommendation)}`} data-testid="prediction-result">
                <div className="flex items-center gap-2 mb-3">
                  <Bot size={16} className={prediction.recommendation?.includes('BUY') ? 'text-emerald-400' : 'text-rose-400'} />
                  <span className="text-sm font-bold text-white">EquiDash AI Analysis</span>
                  <span className={`ml-auto text-xs font-bold px-2.5 py-0.5 rounded-full ${recColor(prediction.recommendation)}`}>{prediction.recommendation}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[{ label: '7D Target', value: `₹${fmt(prediction.prediction_7d)}` }, { label: '30D Target', value: `₹${fmt(prediction.prediction_30d)}` }, { label: 'Confidence', value: `${prediction.confidence?.toFixed(0)}%` }].map(({ label, value }) => (
                    <div key={label} className="p-3 bg-black/20 rounded-lg text-center">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-sm font-bold font-mono text-white">{value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{prediction.reasoning}</p>
              </div>
            )}
          </div>

          {/* Technical Indicators */}
          {stockData?.indicators && (
            <div className="glass-panel p-5 rounded-2xl" data-testid="technical-indicators">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Technical Indicators</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'RSI (14)', value: stockData.indicators.rsi?.toFixed(2), color: stockData.indicators.rsi > 70 ? 'text-rose-400' : stockData.indicators.rsi < 30 ? 'text-emerald-400' : 'text-white', sub: stockData.indicators.rsi > 70 ? 'Overbought' : stockData.indicators.rsi < 30 ? 'Oversold' : 'Neutral' },
                  { label: 'MACD', value: `${stockData.indicators.macd > 0 ? '+' : ''}${stockData.indicators.macd?.toFixed(2)}`, color: stockData.indicators.macd > 0 ? 'text-emerald-400' : 'text-rose-400', sub: stockData.indicators.macd > 0 ? 'Bullish' : 'Bearish' },
                  { label: 'SMA 20', value: `₹${fmt(stockData.indicators.sma_20)}`, color: 'text-white', sub: stockData.price > stockData.indicators.sma_20 ? 'Price above SMA ↑' : 'Price below SMA ↓' }
                ].map(({ label, value, color, sub }) => (
                  <div key={label} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">{label}</p>
                    <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
                    <p className="text-[11px] mt-1 text-slate-500">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Market Sentiment */}
          {marketOverview && (
            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Market Sentiment</h3>
              {(() => {
                const allStocks = [...(marketOverview.gainers || []), ...(marketOverview.losers || [])];
                const gainCount = allStocks.filter(s => s.change > 0).length;
                const total = allStocks.length;
                const bullPct = total > 0 ? Math.round((gainCount / total) * 100) : 50;
                const isBull = bullPct >= 50;
                return (
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-emerald-400 font-bold">Bull {bullPct}%</span>
                      <span className="text-rose-400 font-bold">Bear {100 - bullPct}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-rose-500/30">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-700"
                        style={{ width: `${bullPct}%` }} />
                    </div>
                    <p className={`text-xs font-bold mt-2 ${isBull ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isBull ? '📈 Bullish Market Today' : '📉 Bearish Market Today'}
                    </p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Top Gainers */}
          {marketOverview && (
            <div className="glass-panel p-5 rounded-2xl" data-testid="top-gainers">
              <div className="flex items-center gap-2 mb-4"><TrendingUp className="text-emerald-400" size={16} /><h3 className="text-sm font-bold text-white uppercase tracking-wider">Top Movers</h3></div>
              <div className="space-y-1">
                {marketOverview.gainers.map((stock, i) => (
                  <div key={i} onClick={() => handleTickerClick(stock.ticker)}
                    className={`flex justify-between items-center px-3 py-2.5 rounded-lg cursor-pointer transition-all border group ${activeTicker === stock.ticker ? 'bg-cyan-500/10 border-cyan-500/30' : 'border-transparent hover:bg-slate-800/60 hover:border-slate-700/40'}`}>
                    <div className="flex items-center gap-2">
                      {activeTicker === stock.ticker && <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full flex-shrink-0"></div>}
                      <span className={`text-sm font-bold ${activeTicker === stock.ticker ? 'text-cyan-400' : 'text-slate-300 group-hover:text-white'}`}>{stock.ticker}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono text-white">₹{fmt(stock.price)}</p>
                      <p className="text-xs font-bold text-emerald-400">+{stock.change?.toFixed(2)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Losers */}
          {marketOverview && (
            <div className="glass-panel p-5 rounded-2xl" data-testid="top-losers">
              <div className="flex items-center gap-2 mb-4"><TrendingDown className="text-rose-400" size={16} /><h3 className="text-sm font-bold text-white uppercase tracking-wider">Highest Drawdowns</h3></div>
              <div className="space-y-1">
                {marketOverview.losers.map((stock, i) => (
                  <div key={i} onClick={() => handleTickerClick(stock.ticker)}
                    className={`flex justify-between items-center px-3 py-2.5 rounded-lg cursor-pointer transition-all border group ${activeTicker === stock.ticker ? 'bg-cyan-500/10 border-cyan-500/30' : 'border-transparent hover:bg-slate-800/60 hover:border-slate-700/40'}`}>
                    <div className="flex items-center gap-2">
                      {activeTicker === stock.ticker && <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full flex-shrink-0"></div>}
                      <span className={`text-sm font-bold ${activeTicker === stock.ticker ? 'text-cyan-400' : 'text-slate-300 group-hover:text-white'}`}>{stock.ticker}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono text-white">₹{fmt(stock.price)}</p>
                      <p className="text-xs font-bold text-rose-400">{stock.change?.toFixed(2)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trade Modal */}
      {showTradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" data-testid="trade-modal">
          <div className="glass-panel bg-slate-900/95 p-7 rounded-2xl border border-slate-700 shadow-2xl w-[380px]">
            <div className="flex justify-between items-center mb-5 border-b border-slate-700/50 pb-4">
              <h2 className="text-xl font-bold text-white">Execute {tradeAction}</h2>
              <button onClick={() => setShowTradeModal(false)} className="text-slate-400 hover:text-white hover:rotate-90 transition-all duration-300"><X size={20} /></button>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl mb-5 border border-slate-700/50">
              <p className="text-cyan-400 text-lg font-bold">{stockData?.ticker}</p>
              {stockData?.name && <p className="text-slate-400 text-xs mt-0.5">{stockData.name}</p>}
              <p className="text-white font-mono text-lg mt-1">₹{fmt(stockData?.price)}</p>
            </div>
            <div className="relative mb-5">
              <span className="absolute left-4 top-3 text-slate-400 text-xs font-bold">QTY</span>
              <input type="number" value={tradeQuantity} onChange={(e) => setTradeQuantity(e.target.value)}
                placeholder="0" min="1"
                className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                data-testid="trade-quantity-input" />
            </div>
            <div className="flex justify-between items-center mb-5 px-1">
              <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Total Value</p>
              <p className="text-white font-mono font-bold text-lg">₹{fmt((stockData?.price * parseFloat(tradeQuantity || 0)) || 0)}</p>
            </div>
            <button onClick={handleTrade}
              className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all hover:-translate-y-0.5 ${tradeAction === 'BUY' ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] text-white' : 'bg-gradient-to-r from-rose-500 to-red-600 hover:shadow-[0_0_20px_rgba(225,29,72,0.4)] text-white'}`}
              data-testid="confirm-trade-btn">CONFIRM {tradeAction}
            </button>
          </div>
        </div>
      )}

      <button onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_30px_rgba(6,182,212,0.8)] text-white hover:scale-110 transition-all duration-300 z-50"
        data-testid="chatbot-toggle">
        <Bot size={24} />
      </button>
      {showChatbot && <Chatbot user={user} onClose={() => setShowChatbot(false)} />}
    </div>
  );
};

export default Dashboard;