import React, { useState } from 'react';
import { ExternalLink, Calendar, TrendingUp, Info, ArrowUpRight, Landmark } from 'lucide-react';

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
    OPEN: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    UPCOMING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };
  return (
    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider ${styles[status]}`}>
      {status === 'OPEN' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1 mb-0.5"></span>}
      {status}
    </span>
  );
};

const InfoPill = ({ label, value }) => (
  <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06]">
    <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-0.5 font-bold">{label}</p>
    <p className="text-xs font-black text-white">{value}</p>
  </div>
);

const IPO = () => {
  const [tab, setTab] = useState('open');

  return (
    <div className="space-y-5 pb-24">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">IPO Centre</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track open, upcoming & recently listed IPOs</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.07] bg-white/[0.02] text-[10px] text-slate-600">
          <Info size={11} />
          Apply via SEBI registered broker
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'open', label: `Open`, count: IPO_DATA.open.length, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { key: 'upcoming', label: `Upcoming`, count: IPO_DATA.upcoming.length, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
          { key: 'recent', label: `Recent`, count: IPO_DATA.recent.length, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
        ].map(({ key, label, count, color }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all border ${
              tab === key ? color : 'border-white/[0.07] bg-white/[0.02] text-slate-500 hover:text-slate-300'
            }`}>
            {label}
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${tab === key ? 'bg-white/15' : 'bg-white/[0.05]'}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Open & Upcoming */}
      {(tab === 'open' || tab === 'upcoming') && (
        <div className="grid gap-4 md:grid-cols-2">
          {IPO_DATA[tab].map((ipo, i) => (
            <div key={i} className="p-5 rounded-2xl border bg-white/[0.02] border-white/[0.07] hover:border-white/15 hover:-translate-y-0.5 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-black text-white text-sm">{ipo.name}</h3>
                  <p className="text-[10px] text-slate-600 font-mono mt-0.5">{ipo.symbol} · {ipo.type}</p>
                </div>
                <StatusBadge status={ipo.status} />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <InfoPill label="Price Band" value={`₹${ipo.price_band}`} />
                <InfoPill label="Issue Size" value={ipo.issue_size} />
                <InfoPill label="Lot Size" value={ipo.lot_size?.toString() || 'TBD'} />
                <InfoPill label="Opens" value={ipo.open} />
                <InfoPill label="Closes" value={ipo.close} />
                <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                  <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-0.5 font-bold">GMP</p>
                  <p className={`text-xs font-black ${ipo.gmp !== null ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {ipo.gmp !== null ? `+₹${ipo.gmp}` : 'TBD'}
                  </p>
                </div>
              </div>

              {ipo.lot_size !== 'TBD' && ipo.price_band !== 'TBD' && (
                <div className="flex items-center justify-between p-3 rounded-xl border border-cyan-500/15 bg-cyan-500/5 mb-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Min Investment</p>
                  <p className="text-sm font-black text-cyan-400">
                    ₹{(parseInt(ipo.price_band.split('-')[1]) * (typeof ipo.lot_size === 'number' ? ipo.lot_size : 0)).toLocaleString('en-IN')}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-600 bg-white/[0.04] px-2 py-1 rounded-lg border border-white/[0.06] font-bold">{ipo.type}</span>
                <div className="flex items-center gap-1 text-[10px] text-slate-600">
                  <Calendar size={10} /> Closes {ipo.close}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recently Listed */}
      {tab === 'recent' && (
        <div className="rounded-2xl border bg-white/[0.02] border-white/[0.07] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.06] flex justify-between items-center">
            <h2 className="text-sm font-black text-white">Recently Listed IPOs</h2>
            <span className="text-[10px] text-slate-600">Issue → Current</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {IPO_DATA.recent.map((ipo, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp size={14} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-black text-white text-sm">{ipo.name}</p>
                    <p className="text-[10px] text-slate-600 font-mono">{ipo.symbol} · ₹{ipo.price_band}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white font-mono">₹{ipo.listing_price} → ₹{ipo.current}</p>
                  <div className="flex items-center justify-end gap-0.5 text-[11px] font-black text-emerald-400">
                    <ArrowUpRight size={11} />+{ipo.gain}% gain
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-white/[0.05] bg-white/[0.01]">
            <p className="text-[10px] text-slate-700 text-center">Past performance is not indicative of future returns.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IPO;