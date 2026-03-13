import CandlestickChart from '../components/CandlestickChart';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Search, Bot, X, TrendingUp, TrendingDown } from 'lucide-react';
import Chatbot from '../components/Chatbot';
import { API } from '../utils/app';

const Dashboard = ({ user }) => {
  const [ticker, setTicker] = useState('RELIANCE');
  const [stockData, setStockData] = useState(null);
  const [marketOverview, setMarketOverview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predictLoading, setPredictLoading] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeAction, setTradeAction] = useState('BUY');
  const [tradeQuantity, setTradeQuantity] = useState('');
  const [showChatbot, setShowChatbot] = useState(false);

  const fetchPrediction = async () => {
      setPredictLoading(true);
      try {
          // Fetch data from your Python backend using the current ticker
          const response = await fetch(`http://localhost:8001/api/stock/${ticker}/predict`);
          const data = await response.json();
          setPrediction(data); // Save the real data to state!
      } catch (error) {
          console.error("Failed to fetch AI forecast", error);
      } finally {
          setPredictLoading(false);
      }
  };

  useEffect(() => {
    loadMarketOverview();
    loadStockData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const loadMarketOverview = async () => {
    try {
      const response = await axios.get(`${API}/market/overview`);
      setMarketOverview(response.data);
    } catch (error) {
      console.error('Market overview error:', error);
    }
  };

  const loadStockData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/stock/${ticker}`);
      setStockData(response.data);
    } catch (error) {
      console.error('Stock data error:', error);
      alert('Stock not found. Please try another ticker.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrediction = async () => {
    setPredictLoading(true);
    try {
      const response = await axios.get(`${API}/stock/${ticker}/predict`);
      setPrediction(response.data);
    } catch (error) {
      console.error('Prediction error:', error);
      alert('Prediction failed. Please try again.');
    } finally {
      setPredictLoading(false);
    }
  };

  const handleTrade = async () => {
    if (!tradeQuantity || tradeQuantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    try {
      const response = await axios.post(`${API}/trade/execute`, {
        user_id: user.id,
        action: tradeAction,
        ticker: stockData.ticker,
        quantity: parseFloat(tradeQuantity),
        price: stockData.price
      });

      if (response.data.status === 'success') {
        alert(response.data.message);
        setShowTradeModal(false);
        setTradeQuantity('');
        window.location.reload();
      }
    } catch (error) {
      alert('Trade failed: ' + error.message);
    }
  };

  const formatChartData = () => {
    if (!stockData?.chart_data) return [];
    return stockData.chart_data.dates.map((date, index) => ({
      date,
      price: stockData.chart_data.close[index],
      volume: stockData.chart_data.volume[index]
    }));
  };

  return (
    // FIX: Added pb-24 so content doesn't hide behind the chatbot
    <div className="space-y-8 pb-24" data-testid="dashboard-container">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-md">Market Terminal</h1>
          <p className="text-cyan-400 mt-1 font-medium tracking-wide">AI Insights & Execution Engine</p>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && loadStockData()}
              placeholder="Enter ticker (e.g., RELIANCE)"
              className="pl-11 pr-4 py-3 w-80 bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
              data-testid="ticker-search-input"
            />
            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
          </div>
          <button
            onClick={loadStockData}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold px-6 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] hover:-translate-y-0.5"
            data-testid="search-btn"
          >
            SEARCH
          </button>
        </div>
      </div>

      {/* Market Indices */}
      {marketOverview && (
        <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar" data-testid="market-indices">
          {marketOverview.indices.map((index, i) => (
            <div key={i} className="glass-panel p-5 rounded-2xl flex-1 min-w-[220px] transition-all duration-300 hover:-translate-y-1 hover:border-slate-500/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] group">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">{index.name}</p>
              <div className="flex justify-between items-end mt-3">
                {/* FIX: Added maximumFractionDigits: 2 to prevent 3-decimal glitch */}
                <span className="text-2xl font-bold font-mono text-white">₹{index.price.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                <span className={`flex items-center gap-1 text-sm font-bold font-mono px-2 py-1 rounded-md bg-opacity-10 ${
                  index.change > 0 
                  ? 'text-emerald-400 bg-emerald-500 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' 
                  : 'text-rose-400 bg-rose-500 drop-shadow-[0_0_5px_rgba(251,113,133,0.5)]'
                }`}>
                  {index.change > 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                  {Math.abs(index.change).toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column - Chart & Stats */}
        <div className="xl:col-span-2 space-y-8">
          
         {/* Stock Stats */}
          {stockData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="stock-stats">
              
              {/* 1. Price Action */}
              <div className="glass-panel p-4 xl:p-5 rounded-2xl flex flex-col justify-between transition-all hover:bg-slate-800/40 overflow-hidden">
                <h3 className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Price Action</h3>
                <div className="mt-1">
                  <h1 className="text-lg xl:text-xl 2xl:text-2xl font-bold font-mono text-white truncate" data-testid="stock-price">
                    ₹{stockData.price.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </h1>
                  <span className={`text-sm font-mono font-bold block mt-1 ${stockData.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)}%
                  </span>
                </div>
              </div>
              
              {/* 2. Market Cap */}
              <div className="glass-panel p-4 xl:p-5 rounded-2xl flex flex-col justify-between transition-all hover:bg-slate-800/40 overflow-hidden">
                <h3 className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Market Cap</h3>
                <div className="mt-1">
                  <h1 className="text-lg xl:text-xl 2xl:text-2xl font-bold font-mono text-white truncate" title={`₹${(stockData.market_cap / 10000000).toLocaleString('en-IN', {maximumFractionDigits: 0})}Cr`}>
                    ₹{(stockData.market_cap / 10000000).toLocaleString('en-IN', {maximumFractionDigits: 0})}Cr
                  </h1>
                  {/* Matches the Price Action percentage perfectly */}
                  <span className={`text-sm font-mono font-bold block mt-1 ${stockData.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)}%
                  </span>
                </div>
              </div>
              
              {/* 3. Volume (24h) */}
              <div className="glass-panel p-4 xl:p-5 rounded-2xl flex flex-col justify-between transition-all hover:bg-slate-800/40 overflow-hidden">
                <h3 className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Volume (24h)</h3>
                <div className="mt-1">
                  <h1 className="text-lg xl:text-xl 2xl:text-2xl font-bold font-mono text-white truncate">
                    {(stockData.volume / 1000000).toFixed(2)}M
                  </h1>
                  {/* Gray sub-text to keep the card height perfectly matched */}
                  <span className="text-sm font-mono font-bold block mt-1 text-slate-500">
                    Shares Traded
                  </span>
                </div>
              </div>
              
              {/* 4. Execute Trade */}
              <div className="glass-panel p-4 xl:p-5 rounded-2xl flex flex-col justify-between">
                <h3 className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">Execute</h3>
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => { setTradeAction('BUY'); setShowTradeModal(true); }}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]"
                    data-testid="buy-btn"
                  >BUY</button>
                  <button
                    onClick={() => { setTradeAction('SELL'); setShowTradeModal(true); }}
                    className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-bold py-1.5 xl:py-2 rounded-xl text-xs xl:text-sm transition-all shadow-[0_0_10px_rgba(225,29,72,0.3)] hover:shadow-[0_0_20px_rgba(225,29,72,0.6)]"
                    data-testid="sell-btn"
                  >SELL</button>
                </div>
              </div>
              
            </div>
          )}

          {/* Chart */}
          <div className="glass-panel p-6 rounded-2xl" data-testid="chart-container">
            <div className="flex justify-between items-center mb-8 border-b border-slate-700/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-2 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                <h3 className="text-2xl font-bold text-white tracking-tight">{stockData?.ticker || 'Chart'}</h3>
              </div>
              <button
                onClick={handlePrediction}
                disabled={predictLoading || !stockData}
                className="bg-indigo-500/10 border border-indigo-500/50 text-indigo-400 hover:bg-indigo-500 hover:text-white flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50"
                data-testid="ai-forecast-btn"
              >
                <Bot size={18} />
                <span className="font-semibold">{predictLoading ? 'Analyzing...' : 'AI Forecast'}</span>
              </button>
            </div>

            {loading ? (
              <div className="h-96 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-mono animate-pulse">Fetching market data...</p>
              </div>
           ) : stockData ? (
            <div className="h-[400px] w-full">
                <CandlestickChart chartData={stockData.chart_data} />
            </div>
        ) : (
            <div className="text-slate-500 text-center mt-20">
                Search for a ticker to view technical charts.
            </div>
        )}

            {/* AI Prediction Display */}
            {prediction && !prediction.error && (
              <div className={`mt-8 p-6 rounded-2xl border backdrop-blur-md relative overflow-hidden ${
                prediction.recommendation === 'BUY' ? 'bg-emerald-900/10 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]' :
                prediction.recommendation === 'SELL' ? 'bg-rose-900/10 border-rose-500/30 shadow-[0_0_30px_rgba(225,29,72,0.1)]' : 
                'bg-yellow-900/10 border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.1)]'
              }`} data-testid="prediction-result">
                
                <div className="flex items-center gap-2 mb-4">
                  <Bot size={20} className={prediction.recommendation === 'BUY' ? 'text-emerald-400' : 'text-rose-400'} />
                  <h4 className="font-bold text-white tracking-wide">Emergent AI Analysis</h4>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm mb-4">
                  <div>
                    <p className="text-slate-400 mb-1 text-xs uppercase tracking-wider">7D Target</p>
                    <p className="text-xl font-bold font-mono text-white">₹{prediction.prediction_7d?.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1 text-xs uppercase tracking-wider">30D Target</p>
                    <p className="text-xl font-bold font-mono text-white">₹{prediction.prediction_30d?.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1 text-xs uppercase tracking-wider">Confidence</p>
                    <p className="text-xl font-bold font-mono text-white">{prediction.confidence?.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1 text-xs uppercase tracking-wider">Signal</p>
                    <p className={`text-2xl font-black tracking-widest drop-shadow-md ${
                      prediction.recommendation === 'BUY' ? 'text-emerald-400' :
                      prediction.recommendation === 'SELL' ? 'text-rose-400' : 'text-yellow-400'
                    }`}>
                      {prediction.recommendation}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                  <p className="text-slate-300 leading-relaxed font-medium">{prediction.reasoning}</p>
                </div>
              </div>
            )}
          </div>

          {/* Technical Indicators */}
          {stockData?.indicators && (
            <div className="glass-panel p-6 rounded-2xl" data-testid="technical-indicators">
              <h3 className="text-lg font-bold text-white mb-6 tracking-tight">Technical Indicators</h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">RSI (14)</p>
                  <p className={`text-2xl font-bold font-mono ${stockData.indicators.rsi > 70 ? 'text-rose-400' : stockData.indicators.rsi < 30 ? 'text-emerald-400' : 'text-white'}`}>
                    {stockData.indicators.rsi?.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">MACD</p>
                  <p className={`text-2xl font-bold font-mono ${stockData.indicators.macd > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {stockData.indicators.macd > 0 ? '+' : ''}{stockData.indicators.macd?.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">SMA 20</p>
                  <p className="text-2xl font-bold font-mono text-white">₹{stockData.indicators.sma_20?.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Trending */}
        <div className="space-y-8">
          
          {/* Top Gainers */}
          {marketOverview && (
            <div className="glass-panel p-6 rounded-2xl" data-testid="top-gainers">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="text-emerald-400" size={24} />
                <h3 className="text-xl font-bold text-white tracking-tight">Top Movers</h3>
              </div>
              <div className="space-y-2">
                {marketOverview.gainers.map((stock, i) => (
                  <div
                    key={i}
                    onClick={() => { setTicker(stock.ticker); loadStockData(); }}
                    className="flex justify-between items-center p-3 hover:bg-slate-800/60 rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-700/50 group"
                  >
                    <span className="font-bold text-slate-300 group-hover:text-white transition-colors">{stock.ticker}</span>
                    <div className="text-right">
                      {/* FIX: maximumFractionDigits: 2 */}
                      <p className="font-bold font-mono text-white">₹{stock.price.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                      <p className="text-sm font-mono font-bold text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]">+{stock.change.toFixed(2)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Losers */}
          {marketOverview && (
            <div className="glass-panel p-6 rounded-2xl" data-testid="top-losers">
              <div className="flex items-center gap-2 mb-6">
                <TrendingDown className="text-rose-400" size={24} />
                <h3 className="text-xl font-bold text-white tracking-tight">Highest Drawdowns</h3>
              </div>
              <div className="space-y-2">
                {marketOverview.losers.map((stock, i) => (
                  <div
                    key={i}
                    onClick={() => { setTicker(stock.ticker); loadStockData(); }}
                    className="flex justify-between items-center p-3 hover:bg-slate-800/60 rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-700/50 group"
                  >
                    <span className="font-bold text-slate-300 group-hover:text-white transition-colors">{stock.ticker}</span>
                    <div className="text-right">
                      {/* FIX: maximumFractionDigits: 2 */}
                      <p className="font-bold font-mono text-white">₹{stock.price.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                      <p className="text-sm font-mono font-bold text-rose-400 drop-shadow-[0_0_5px_rgba(251,113,133,0.3)]">{stock.change.toFixed(2)}%</p>
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
          <div className="glass-panel bg-slate-900/90 p-8 rounded-3xl w-96 border border-slate-700 shadow-2xl transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6 border-b border-slate-700/50 pb-4">
              <h2 className="text-2xl font-bold text-white tracking-tight">Execute {tradeAction}</h2>
              <button onClick={() => setShowTradeModal(false)} className="text-slate-400 hover:text-white hover:rotate-90 transition-all duration-300">
                <X size={24} />
              </button>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-xl mb-6 border border-slate-700/50">
              <p className="text-cyan-400 text-xl font-bold tracking-wider">{stockData?.ticker}</p>
              <p className="text-slate-300 font-mono text-lg mt-1">₹{stockData?.price.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>

            <div className="relative mb-6">
              <span className="absolute left-4 top-3.5 text-slate-400 text-sm font-bold">QTY</span>
              <input
                type="number"
                value={tradeQuantity}
                onChange={(e) => setTradeQuantity(e.target.value)}
                placeholder="0"
                min="1"
                className="w-full pl-14 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-lg focus:outline-none focus:border-cyan-500 transition-colors"
                data-testid="trade-quantity-input"
              />
            </div>

            <div className="flex justify-between items-center mb-8 px-2">
              <p className="text-slate-400 text-sm uppercase tracking-wider font-semibold">Total Value</p>
              <p className="text-white font-mono font-bold text-xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                ₹{((stockData?.price * tradeQuantity) || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleTrade}
                className={`flex-1 py-3.5 rounded-xl font-bold tracking-wide transition-all shadow-lg hover:-translate-y-1 ${
                  tradeAction === 'BUY' 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] text-white' 
                  : 'bg-gradient-to-r from-rose-500 to-red-600 hover:shadow-[0_0_20px_rgba(225,29,72,0.4)] text-white'
                }`}
                data-testid="confirm-trade-btn"
              >
                CONFIRM {tradeAction}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chatbot Button */}
      <button
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:shadow-[0_0_35px_rgba(6,182,212,0.8)] text-white hover:scale-110 transition-all duration-300 z-50 group"
        data-testid="chatbot-toggle"
      >
        <Bot size={28} className="group-hover:animate-pulse" />
      </button>

      {showChatbot && <Chatbot user={user} onClose={() => setShowChatbot(false)} />}
    </div>
  );
};

export default Dashboard;