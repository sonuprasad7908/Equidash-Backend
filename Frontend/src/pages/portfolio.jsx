import React, { useEffect, useState, useCallback } from 'react';
import { Briefcase, TrendingUp, TrendingDown, Wallet, Activity, PieChart, RefreshCw, AlertCircle } from 'lucide-react';
import { API } from '../utils/app';

const Portfolio = ({ user }) => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API}/portfolio/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch portfolio');
      const data = await response.json();
      setPortfolioData(data);
    } catch (err) {
      console.error('Portfolio error:', err);
      setError('Unable to load portfolio. Check if your backend is running.');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (user?.id) loadPortfolio();
  }, [user.id, loadPortfolio]);

  const fmt = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalInvested = portfolioData?.summary?.total_invested || 0;
  const totalCurrent = portfolioData?.summary?.current_value || 0;
  const totalPnL = portfolioData?.summary?.total_pnl || 0;
  const pnlPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const isPositive = totalPnL >= 0;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="relative">
        <div className="w-14 h-14 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-cyan-500" />
        </div>
      </div>
      <p className="text-cyan-400 font-mono text-sm animate-pulse uppercase tracking-widest">Synchronizing Assets...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="glass-panel p-8 rounded-2xl max-w-md text-center bg-rose-900/10 border-rose-500/30">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Connection Error</h3>
        <p className="text-slate-400 text-sm mb-5">{error}</p>
        <button onClick={loadPortfolio} className="px-6 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl transition-all text-sm">
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-24" data-testid="portfolio-container">

      {/* ── Header ── */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Portfolio Hub</h1>
          <p className="text-cyan-400 text-sm mt-0.5 font-medium">Live Asset Tracking & P&L</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-panel px-5 py-2.5 rounded-xl flex items-center gap-2">
            <Wallet className="w-4 h-4 text-cyan-400" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Available</p>
              <p className="font-bold font-mono text-white text-sm">₹{fmt(portfolioData?.balance)}</p>
            </div>
          </div>
          <button
            onClick={loadPortfolio}
            className="glass-panel p-2.5 rounded-xl text-slate-400 hover:text-cyan-400 transition-all"
            title="Refresh portfolio"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Total Invested */}
        <div className="glass-panel p-5 rounded-2xl hover:bg-slate-800/40 transition-all hover:-translate-y-0.5">
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="w-4 h-4 text-indigo-400" />
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Invested</p>
          </div>
          <p className="text-2xl font-bold font-mono text-white">₹{fmt(totalInvested)}</p>
          <p className="text-xs text-slate-500 mt-1">{portfolioData?.positions?.length || 0} open positions</p>
        </div>

        {/* Current Value */}
        <div className="glass-panel p-5 rounded-2xl hover:bg-slate-800/40 transition-all hover:-translate-y-0.5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Value</p>
          </div>
          <p className="text-2xl font-bold font-mono text-white">₹{fmt(totalCurrent)}</p>
          <p className="text-xs text-slate-500 mt-1">Mark-to-market value</p>
        </div>

        {/* Net P&L */}
        <div className={`glass-panel p-5 rounded-2xl transition-all hover:-translate-y-0.5 ${
          totalInvested === 0 ? '' :
          isPositive ? 'bg-emerald-900/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.08)]'
                     : 'bg-rose-900/10 border-rose-500/30 shadow-[0_0_20px_rgba(225,29,72,0.08)]'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {isPositive ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Net P&L</p>
            {totalInvested > 0 && (
              <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {isPositive ? '+' : ''}{pnlPct.toFixed(2)}%
              </span>
            )}
          </div>
          <p className={`text-2xl font-bold font-mono ${
            totalInvested === 0 ? 'text-white' : isPositive ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {isPositive && totalInvested > 0 ? '+' : ''}₹{fmt(totalPnL)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Unrealized gain/loss</p>
        </div>
      </div>

      {/* ── Positions Table ── */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
          <h2 className="text-base font-bold text-white">Open Positions</h2>
          <span className="text-xs font-mono text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/50">
            {portfolioData?.positions?.length || 0} Assets
          </span>
        </div>

        {(!portfolioData?.positions || portfolioData.positions.length === 0) ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700">
              <Briefcase className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-300 mb-2">No Holdings Yet</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Your portfolio is empty. Head to the Dashboard to execute your first trade.
            </p>
          </div>
        ) : (
          <>
            {/* Allocation bar */}
            <div className="px-6 py-3 border-b border-slate-700/30">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Portfolio Allocation</p>
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                {portfolioData.positions.map((pos, i) => {
                  const pct = totalCurrent > 0 ? (pos.current_value / totalCurrent) * 100 : 0;
                  const colors = ['bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500'];
                  return <div key={i} className={`${colors[i % colors.length]} rounded-sm transition-all`} style={{ width: `${pct}%` }} title={`${pos.ticker}: ${pct.toFixed(1)}%`}></div>;
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {portfolioData.positions.map((pos, i) => {
                  const pct = totalCurrent > 0 ? (pos.current_value / totalCurrent) * 100 : 0;
                  const colors = ['text-cyan-400', 'text-blue-400', 'text-indigo-400', 'text-violet-400', 'text-purple-400', 'text-pink-400', 'text-rose-400'];
                  return (
                    <span key={i} className={`text-[10px] font-mono font-bold ${colors[i % colors.length]}`}>
                      {pos.ticker} {pct.toFixed(1)}%
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-900/40 border-b border-slate-700/50 text-[10px] uppercase tracking-widest text-slate-400">
                    <th className="py-3 pl-6 font-semibold">Ticker</th>
                    <th className="py-3 px-4 font-semibold text-right">Qty</th>
                    <th className="py-3 px-4 font-semibold text-right">Avg Price</th>
                    <th className="py-3 px-4 font-semibold text-right">LTP</th>
                    <th className="py-3 px-4 font-semibold text-right">Value</th>
                    <th className="py-3 pr-6 font-semibold text-right">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioData.positions.map((pos, i) => {
                    const isPosProfit = pos.pnl >= 0;
                    const pnlPct = (pos.pnl / (pos.avg_price * pos.quantity)) * 100;
                    return (
                      <tr key={i} className="border-b border-slate-700/20 hover:bg-slate-800/30 transition-colors group">
                        <td className="py-3.5 pl-6">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 rounded-full bg-slate-700 group-hover:bg-cyan-500 transition-colors"></div>
                            <span className="font-bold text-white text-sm">{pos.ticker}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300 text-right text-sm">{pos.quantity}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-300 text-right text-sm">₹{fmt(pos.avg_price)}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-white text-right text-sm">₹{fmt(pos.current_price)}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-300 text-right text-sm">₹{fmt(pos.current_value)}</td>
                        <td className="py-3.5 pr-6 text-right">
                          <p className={`font-mono font-bold text-sm ${isPosProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPosProfit ? '+' : ''}₹{fmt(pos.pnl)}
                          </p>
                          <p className={`text-xs font-mono ${isPosProfit ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                            {isPosProfit ? '+' : ''}{pnlPct.toFixed(2)}%
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Portfolio;