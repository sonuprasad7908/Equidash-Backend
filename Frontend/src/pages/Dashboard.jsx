import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Search, Bot, X } from 'lucide-react';
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
        // Reload user balance
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
    <div className="space-y-6" data-testid="dashboard-container">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Market Overview</h1>
          <p className="text-gray-400 mt-1">AI Insights & Paper Trading</p>
        </div>

        {/* Search Box */}
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && loadStockData()}
              placeholder="Enter ticker (e.g., RELIANCE)"
              className="pl-10 pr-4 py-3 w-80 bg-[#1e293b] border border-gray-700 rounded-lg"
              data-testid="ticker-search-input"
            />
            <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
          </div>
          <button
            onClick={loadStockData}
            className="btn-primary"
            data-testid="search-btn"
          >
            SEARCH
          </button>
        </div>
      </div>

      {/* Market Indices */}
      {marketOverview && (
        <div className="flex gap-4 overflow-x-auto pb-2" data-testid="market-indices">
          {marketOverview.indices.map((index, i) => (
            <div key={i} className="card min-w-[200px]">
              <p className="text-xs text-gray-400 uppercase">{index.name}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xl font-bold">₹{index.price.toFixed(2)}</span>
                <span className={`text-sm ${index.color === 'green' ? 'text-green-500' : 'text-red-500'}`}>
                  {index.change > 0 ? '+' : ''}{index.change.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stock Stats */}
          {stockData && (
            <div className="grid grid-cols-4 gap-4" data-testid="stock-stats">
              <div className="card">
                <h3 className="text-xs text-gray-400 uppercase">Price</h3>
                <h1 className="text-2xl font-bold mt-2" data-testid="stock-price">
                  ₹{stockData.price.toFixed(2)}
                </h1>
                <span className={`text-sm ${stockData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)}%
                </span>
              </div>
              <div className="card">
                <h3 className="text-xs text-gray-400 uppercase">Market Cap</h3>
                <h1 className="text-2xl font-bold mt-2">
                  ₹{(stockData.market_cap / 10000000).toFixed(0)}Cr
                </h1>
              </div>
              <div className="card">
                <h3 className="text-xs text-gray-400 uppercase">Volume</h3>
                <h1 className="text-2xl font-bold mt-2">
                  {(stockData.volume / 1000000).toFixed(2)}M
                </h1>
              </div>
              <div className="card">
                <h3 className="text-xs text-gray-400 uppercase mb-2">Action</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setTradeAction('BUY');
                      setShowTradeModal(true);
                    }}
                    className="btn-success text-sm px-3 py-2"
                    data-testid="buy-btn"
                  >
                    BUY
                  </button>
                  <button
                    onClick={() => {
                      setTradeAction('SELL');
                      setShowTradeModal(true);
                    }}
                    className="btn-danger text-sm px-3 py-2"
                    data-testid="sell-btn"
                  >
                    SELL
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="card" data-testid="chart-container">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Price Action</h3>
              <button
                onClick={handlePrediction}
                disabled={predictLoading || !stockData}
                className="btn-primary flex items-center gap-2"
                data-testid="ai-forecast-btn"
              >
                <Bot size={18} />
                {predictLoading ? 'Loading...' : 'AI Forecast'}
              </button>
            </div>

            {loading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="spinner"></div>
              </div>
            ) : stockData ? (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={formatChartData()}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-400">
                Search for a stock to view chart
              </div>
            )}

            {/* Prediction Display */}
            {prediction && !prediction.error && (
              <div className="mt-6 p-4 bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg" data-testid="prediction-result">
                <h4 className="font-bold mb-2">AI Prediction</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">7-Day Prediction</p>
                    <p className="text-xl font-bold">₹{prediction.prediction_7d?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">30-Day Prediction</p>
                    <p className="text-xl font-bold">₹{prediction.prediction_30d?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Confidence</p>
                    <p className="text-xl font-bold">{prediction.confidence?.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Recommendation</p>
                    <p className={`text-xl font-bold ${
                      prediction.recommendation === 'BUY' ? 'text-green-500' :
                      prediction.recommendation === 'SELL' ? 'text-red-500' : 'text-yellow-500'
                    }`}>
                      {prediction.recommendation}
                    </p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-3">{prediction.reasoning}</p>
              </div>
            )}
          </div>

          {/* Technical Indicators */}
          {stockData?.indicators && (
            <div className="card" data-testid="technical-indicators">
              <h3 className="text-xl font-bold mb-4">Technical Indicators</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-400">RSI (14)</p>
                  <p className="text-2xl font-bold">{stockData.indicators.rsi?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">MACD</p>
                  <p className="text-2xl font-bold">{stockData.indicators.macd?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">SMA 20</p>
                  <p className="text-2xl font-bold">₹{stockData.indicators.sma_20?.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Trending */}
        <div className="space-y-6">
          {/* Top Gainers */}
          {marketOverview && (
            <div className="card" data-testid="top-gainers">
              <h3 className="text-lg font-bold mb-4 text-green-500">Top Gainers</h3>
              <div className="space-y-3">
                {marketOverview.gainers.map((stock, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setTicker(stock.ticker);
                      loadStockData();
                    }}
                    className="flex justify-between items-center p-2 hover:bg-gray-800 rounded cursor-pointer"
                  >
                    <span className="font-semibold">{stock.ticker}</span>
                    <div className="text-right">
                      <p className="font-bold">₹{stock.price.toFixed(2)}</p>
                      <p className="text-sm text-green-500">+{stock.change.toFixed(2)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Losers */}
          {marketOverview && (
            <div className="card" data-testid="top-losers">
              <h3 className="text-lg font-bold mb-4 text-red-500">Top Losers</h3>
              <div className="space-y-3">
                {marketOverview.losers.map((stock, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setTicker(stock.ticker);
                      loadStockData();
                    }}
                    className="flex justify-between items-center p-2 hover:bg-gray-800 rounded cursor-pointer"
                  >
                    <span className="font-semibold">{stock.ticker}</span>
                    <div className="text-right">
                      <p className="font-bold">₹{stock.price.toFixed(2)}</p>
                      <p className="text-sm text-red-500">{stock.change.toFixed(2)}%</p>
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
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" data-testid="trade-modal">
          <div className="bg-[#1e293b] p-8 rounded-2xl w-96 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{tradeAction} Stock</h2>
              <button onClick={() => setShowTradeModal(false)}>
                <X size={24} />
              </button>
            </div>
            <p className="text-cyan-400 text-lg mb-4">{stockData?.ticker}</p>
            <p className="text-gray-400 mb-2">Price: ₹{stockData?.price.toFixed(2)}</p>
            <input
              type="number"
              value={tradeQuantity}
              onChange={(e) => setTradeQuantity(e.target.value)}
              placeholder="Quantity"
              min="1"
              className="w-full mb-4"
              data-testid="trade-quantity-input"
            />
            <p className="text-gray-400 mb-6">
              Total: ₹{(stockData?.price * tradeQuantity || 0).toFixed(2)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleTrade}
                className={`flex-1 py-3 rounded-lg font-bold ${
                  tradeAction === 'BUY' ? 'btn-success' : 'btn-danger'
                }`}
                data-testid="confirm-trade-btn"
              >
                CONFIRM
              </button>
              <button
                onClick={() => setShowTradeModal(false)}
                className="flex-1 py-3 bg-gray-700 rounded-lg font-bold"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chatbot Button */}
      <button
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition z-50"
        data-testid="chatbot-toggle"
      >
        <Bot size={28} />
      </button>

      {/* Chatbot */}
      {showChatbot && <Chatbot user={user} onClose={() => setShowChatbot(false)} />}
    </div>
  );
};

export default Dashboard;
