import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, Search, TrendingUp, TrendingDown, DollarSign, BarChart2 } from 'lucide-react';
import { API } from '../utils/app';

const Transactions = ({ user }) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const fmt = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const loadTrades = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ BUG FIX: correct API endpoint
      const res = await fetch(`${API}/transactions/${user.id}`);
      const data = await res.json();
      setTrades(data.trades || []);
    } catch (e) {
      console.error(e);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { loadTrades(); }, [loadTrades]);

  const filtered = trades
    .filter(t => filter === 'all' || t.action === filter)
    .filter(t => t.ticker?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.timestamp) - new Date(a.timestamp);
      if (sortBy === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp);
      if (sortBy === 'highest') return b.total_amount - a.total_amount;
      if (sortBy === 'lowest') return a.total_amount - b.total_amount;
      return 0;
    });

  const totalBuys = trades.filter(t => t.action === 'BUY');
  const totalSells = trades.filter(t => t.action === 'SELL');
  const totalInvested = totalBuys.reduce((s, t) => s + t.total_amount, 0);

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'highest', label: 'Highest Value' },
    { value: 'lowest', label: 'Lowest Value' },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-14 h-14 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
      <p className="text-cyan-400 font-mono text-sm animate-pulse uppercase tracking-widest">Loading Transactions...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Transaction History</h1>
          <p className="text-cyan-400 text-sm mt-0.5 font-medium">All your buy & sell orders</p>
        </div>
        <button onClick={loadTrades} className="glass-panel p-2.5 rounded-xl text-slate-400 hover:text-cyan-400 transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Trades', value: trades.length, icon: BarChart2, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { label: 'Buy Orders', value: totalBuys.length, icon: ArrowUpCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Sell Orders', value: totalSells.length, icon: ArrowDownCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          { label: 'Total Invested', value: `₹${fmt(totalInvested)}`, icon: DollarSign, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass-panel p-4 rounded-xl flex items-center gap-3">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
              <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by ticker..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all" />
        </div>

        {/* Action Filter Buttons */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'BUY', label: 'BUY' },
            { key: 'SELL', label: 'SELL' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                filter === key
                  ? key === 'BUY' ? 'bg-emerald-500 text-white'
                  : key === 'SELL' ? 'bg-rose-500 text-white'
                  : 'bg-cyan-500 text-slate-900'
                  : 'glass-panel text-slate-400 hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ✅ BUG FIX: Sort dropdown replaced with buttons to avoid browser styling issue */}
        <div className="flex gap-2">
          {sortOptions.map(({ value, label }) => (
            <button key={value} onClick={() => setSortBy(value)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                sortBy === value
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'glass-panel text-slate-400 hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
          <h2 className="text-base font-bold text-white">Transactions</h2>
          <span className="text-xs font-mono text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/50">
            {filtered.length} records
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700">
              <BarChart2 className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-300 mb-2">No Transactions Found</h3>
            <p className="text-slate-500 text-sm">
              {search || filter !== 'all' ? 'Try changing your filters.' : 'Execute your first trade from the Dashboard!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-slate-900/40 border-b border-slate-700/50 text-[10px] uppercase tracking-widest text-slate-400">
                  <th className="py-3 pl-6 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Ticker</th>
                  <th className="py-3 px-4 font-semibold text-right">Qty</th>
                  <th className="py-3 px-4 font-semibold text-right">Price</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Value</th>
                  <th className="py-3 pr-6 font-semibold text-right">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((trade, i) => (
                  <tr key={i} className="border-b border-slate-700/20 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 pl-6">
                      <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full w-fit ${
                        trade.action === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {trade.action === 'BUY' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {trade.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white text-sm">{trade.ticker}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300 text-right text-sm">{trade.quantity}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300 text-right text-sm">₹{fmt(trade.price)}</td>
                    <td className={`py-3.5 px-4 font-mono font-bold text-right text-sm ${trade.action === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trade.action === 'BUY' ? '-' : '+'}₹{fmt(trade.total_amount)}
                    </td>
                    <td className="py-3.5 pr-6 text-right">
                      <p className="text-sm text-white">{new Date(trade.timestamp).toLocaleDateString('en-IN')}</p>
                      <p className="text-xs text-slate-500">{new Date(trade.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-700/50 flex justify-between items-center bg-slate-800/20">
            <p className="text-xs text-slate-500">{filtered.length} transactions shown</p>
            <div className="flex gap-4 text-xs font-mono">
              <span className="text-emerald-400">Bought: ₹{fmt(filtered.filter(t => t.action === 'BUY').reduce((s, t) => s + t.total_amount, 0))}</span>
              <span className="text-rose-400">Sold: ₹{fmt(filtered.filter(t => t.action === 'SELL').reduce((s, t) => s + t.total_amount, 0))}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;