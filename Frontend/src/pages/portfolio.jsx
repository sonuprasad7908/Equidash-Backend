import React, { useEffect, useState, useCallback } from 'react';
import { Briefcase, TrendingUp, TrendingDown, Wallet, Loader2, Activity, PieChart } from 'lucide-react';

const Portfolio = ({ user }) => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8001/api/portfolio/${user.id}`);
      const data = await response.json();
      setPortfolioData(data);
    } catch (error) {
      console.error("Error loading portfolio:", error);
    } finally {
      setLoading(false);
    }
  }, [user.id]); // The function only changes if the user ID changes

  useEffect(() => {
    if (user?.id) {
      loadPortfolio();
    }
  }, [user.id, loadPortfolio]); // Now including loadPortfolio is safe and warning-free!

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-cyan-500 animate-pulse" />
          </div>
        </div>
        <p className="text-cyan-400 font-mono animate-pulse tracking-widest uppercase text-sm">Synchronizing Assets...</p>
      </div>
    );
  }

  // Calculate overall P&L Percentage
  const totalInvested = portfolioData?.summary?.total_invested || 0;
  const totalCurrent = portfolioData?.summary?.current_value || 0;
  const totalPnL = portfolioData?.summary?.total_pnl || 0;
  const pnlPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const isPositive = totalPnL >= 0;

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700" data-testid="portfolio-container">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-md">Portfolio Hub</h1>
          <p className="text-cyan-400 mt-1 font-medium tracking-wide">Live Asset Tracking & P&L</p>
        </div>
        
        {/* Virtual Balance Pill */}
        <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-3 border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
          <Wallet className="w-5 h-5 text-cyan-400" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Available Margin</p>
            <span className="font-bold font-mono text-white tracking-wide">
              ₹{(portfolioData?.balance || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
          </div>
        </div>
      </div>

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Invested */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between transition-all hover:bg-slate-800/40 hover:-translate-y-1 hover:shadow-xl group">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Total Invested</h3>
          </div>
          <h1 className="text-3xl font-bold font-mono text-white truncate">
            ₹{totalInvested.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </h1>
        </div>

        {/* Current Value */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between transition-all hover:bg-slate-800/40 hover:-translate-y-1 hover:shadow-xl group">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Current Value</h3>
          </div>
          <h1 className="text-3xl font-bold font-mono text-white truncate">
            ₹{totalCurrent.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </h1>
        </div>

        {/* Total P&L */}
        <div className={`glass-panel p-6 rounded-2xl flex flex-col justify-between transition-all hover:-translate-y-1 relative overflow-hidden ${
          totalInvested === 0 ? 'hover:bg-slate-800/40' :
          isPositive ? 'bg-emerald-900/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                     : 'bg-rose-900/10 border-rose-500/30 shadow-[0_0_20px_rgba(225,29,72,0.1)]'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            {totalInvested === 0 ? <Briefcase className="w-5 h-5 text-slate-400" /> :
             isPositive ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-rose-400" />}
            <h3 className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Net P&L</h3>
          </div>
          <div className="flex items-end justify-between">
            <h1 className={`text-3xl font-bold font-mono truncate drop-shadow-md ${
              totalInvested === 0 ? 'text-white' : isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {isPositive && totalInvested > 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </h1>
            {totalInvested > 0 && (
              <span className={`text-lg font-mono font-bold px-2 py-1 rounded-lg bg-opacity-20 ${
                isPositive ? 'text-emerald-400 bg-emerald-500' : 'text-rose-400 bg-rose-500'
              }`}>
                {isPositive ? '+' : ''}{pnlPercentage.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white tracking-tight">Open Positions</h2>
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
            {portfolioData?.positions?.length || 0} Assets
          </span>
        </div>
        
        {(!portfolioData?.positions || portfolioData.positions.length === 0) ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700">
              <Briefcase className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-300 mb-2">No Holdings Yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Your portfolio is currently empty. Head over to the Dashboard to analyze and execute your first trade.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700/50 text-xs uppercase tracking-wider text-slate-400">
                  <th className="py-4 pl-6 font-semibold">Asset / Ticker</th>
                  <th className="py-4 px-4 font-semibold text-right">Quantity</th>
                  <th className="py-4 px-4 font-semibold text-right">Avg Buy Price</th>
                  <th className="py-4 px-4 font-semibold text-right">LTP (Current)</th>
                  <th className="py-4 px-4 font-semibold text-right">Total Value</th>
                  <th className="py-4 pr-6 font-semibold text-right">Unrealized P&L</th>
                </tr>
              </thead>
              <tbody>
                {portfolioData.positions.map((pos, i) => {
                  const isPosProfit = pos.pnl >= 0;
                  const pnlPercent = (pos.pnl / (pos.avg_price * pos.quantity)) * 100;
                  
                  return (
                    <tr key={i} className="border-b border-slate-700/30 transition-colors hover:bg-slate-800/40 group">
                      <td className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-8 rounded-full bg-slate-700 group-hover:bg-cyan-500 transition-colors"></div>
                          <span className="font-bold text-white tracking-wide">{pos.ticker}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-300 text-right">{pos.quantity}</td>
                      <td className="py-4 px-4 font-mono text-slate-300 text-right">
                        ₹{pos.avg_price.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-white text-right">
                        ₹{pos.current_price.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-300 text-right">
                        ₹{pos.current_value.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className="py-4 pr-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`font-mono font-bold drop-shadow-md ${isPosProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPosProfit ? '+' : ''}₹{pos.pnl.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </span>
                          <span className={`text-xs font-mono font-bold ${isPosProfit ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                            {isPosProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;