import React, { useState } from 'react';
import { ExternalLink, Calendar, TrendingUp, Info } from 'lucide-react';

const IPO_DATA = {
  open: [
    { name: 'Ola Electric Mobility', symbol: 'OLAELEC', price_band: '72-76', open: '2024-08-02', close: '2024-08-06', lot_size: 195, issue_size: '6145.6 Cr', gmp: 15, type: 'Mainboard', status: 'OPEN' },
    { name: 'Brainbees Solutions (FirstCry)', symbol: 'FIRSTCRY', price_band: '440-465', open: '2024-08-06', close: '2024-08-08', lot_size: 32, issue_size: '4193.7 Cr', gmp: 40, type: 'Mainboard', status: 'OPEN' },
  ],
  upcoming: [
    { name: 'Swiggy', symbol: 'SWIGGY', price_band: 'TBD', open: 'Q4 2024', close: 'TBD', lot_size: 'TBD', issue_size: '~10000 Cr', gmp: null, type: 'Mainboard', status: 'UPCOMING' },
    { name: 'Hyundai India', symbol: 'HYUNDAI', price_band: 'TBD', open: 'Oct 2024', close: 'TBD', lot_size: 'TBD', issue_size: '~25000 Cr', gmp: null, type: 'Mainboard', status: 'UPCOMING' },
    { name: 'NSE India', symbol: 'NSE', price_band: 'TBD', open: 'TBD', close: 'TBD', lot_size: 'TBD', issue_size: 'TBD', gmp: null, type: 'Mainboard', status: 'UPCOMING' },
    { name: 'Bajaj Housing Finance', symbol: 'BAJAJHFL', price_band: '66-70', open: '2024-09-09', close: '2024-09-11', lot_size: 214, issue_size: '6560 Cr', gmp: 25, type: 'Mainboard', status: 'UPCOMING' },
  ],
  recent: [
    { name: 'TBO Tek', symbol: 'TBOTEK', price_band: '875-920', listing_price: 920, current: 1426, gain: 55, type: 'Mainboard' },
    { name: 'Awfis Space', symbol: 'AWFIS', price_band: '364-383', listing_price: 383, current: 432, gain: 12.8, type: 'Mainboard' },
    { name: 'Indegene', symbol: 'INDEGENE', price_band: '430-452', listing_price: 452, current: 742, gain: 64, type: 'Mainboard' },
    { name: 'Aadhar Housing Finance', symbol: 'AADHARHFL', price_band: '300-315', listing_price: 315, current: 375, gain: 19, type: 'Mainboard' },
    { name: 'Go Digit General Insurance', symbol: 'GODIGIT', price_band: '258-272', listing_price: 272, current: 368, gain: 35, type: 'Mainboard' },
  ]
};

const StatusBadge = ({ status }) => {
  const styles = {
    OPEN: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    UPCOMING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    LISTED: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles[status]}`}>{status}</span>;
};

const InfoCard = ({ label, value }) => (
  <div className="p-2.5 bg-slate-800/40 rounded-lg">
    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
    <p className="text-sm font-bold text-white">{value}</p>
  </div>
);

const IPO = () => {
  const [tab, setTab] = useState('open');

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">IPO Centre</h1>
          <p className="text-cyan-400 text-sm mt-0.5 font-medium">Track open, upcoming & recently listed IPOs</p>
        </div>
        <div className="flex items-center gap-2 glass-panel px-3 py-2 rounded-xl text-xs text-slate-400">
          <Info size={12} />
          <span>Data is indicative. Apply via SEBI registered broker.</span>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2">
        {[
          { key: 'open', label: `Open (${IPO_DATA.open.length})` },
          { key: 'upcoming', label: `Upcoming (${IPO_DATA.upcoming.length})` },
          { key: 'recent', label: `Recently Listed (${IPO_DATA.recent.length})` }
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === key ? 'bg-cyan-500 text-slate-900 shadow-[0_0_12px_rgba(34,211,238,0.4)]' : 'glass-panel text-slate-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Open & Upcoming IPO Cards */}
      {(tab === 'open' || tab === 'upcoming') && (
        <div className="grid gap-4 md:grid-cols-2">
          {IPO_DATA[tab].map((ipo, i) => (
            <div key={i} className="glass-panel p-5 rounded-2xl hover:-translate-y-0.5 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-white">{ipo.name}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{ipo.symbol} · {ipo.type}</p>
                </div>
                <StatusBadge status={ipo.status} />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <InfoCard label="Price Band" value={`₹${ipo.price_band}`} />
                <InfoCard label="Issue Size" value={ipo.issue_size} />
                <InfoCard label="Lot Size" value={ipo.lot_size?.toString() || 'TBD'} />
                <InfoCard label="Open Date" value={ipo.open} />
                <InfoCard label="Close Date" value={ipo.close} />
                <div className="p-2.5 bg-slate-800/40 rounded-lg">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">GMP</p>
                  <p className={`text-sm font-bold ${ipo.gmp !== null ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {ipo.gmp !== null ? `+₹${ipo.gmp}` : 'TBD'}
                  </p>
                </div>
              </div>

              {/* Min Investment */}
              {ipo.lot_size !== 'TBD' && ipo.price_band !== 'TBD' && (
                <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl mb-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Min Investment</p>
                  <p className="text-sm font-bold text-cyan-400 mt-0.5">
                    ₹{(parseInt(ipo.price_band.split('-')[1]) * (typeof ipo.lot_size === 'number' ? ipo.lot_size : 0)).toLocaleString('en-IN')}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2 py-1 bg-slate-800/60 text-slate-400 rounded-lg border border-slate-700/50">{ipo.type}</span>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar size={12} />
                  <span>Closes {ipo.close}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recently Listed */}
      {tab === 'recent' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
            <h2 className="text-base font-bold text-white">Recently Listed IPOs</h2>
            <span className="text-xs text-slate-500">Issue price → Current price</span>
          </div>
          <div className="divide-y divide-slate-700/30">
            {IPO_DATA.recent.map((ipo, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <TrendingUp size={14} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{ipo.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{ipo.symbol} · ₹{ipo.price_band}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white font-mono">₹{ipo.listing_price} → ₹{ipo.current}</p>
                  <p className="text-xs font-bold text-emerald-400">+{ipo.gain}% listing gain</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 border-t border-slate-700/50 bg-slate-800/20">
            <p className="text-xs text-slate-500 text-center">⚠️ Past performance is not indicative of future returns. Invest wisely.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IPO;