import React, { useState } from 'react';
import { Calculator, TrendingUp, DollarSign, BarChart2 } from 'lucide-react';

const tabs = ['SIP', 'Lumpsum', 'Brokerage', 'Margin'];

const Calculator_Page = () => {
  const [activeTab, setActiveTab] = useState('SIP');
  const fmt = (n) => Math.round(n).toLocaleString('en-IN');

  // SIP State
  const [sipAmount, setSipAmount] = useState(5000);
  const [sipRate, setSipRate] = useState(12);
  const [sipYears, setSipYears] = useState(10);

  // Lumpsum State
  const [lumpAmount, setLumpAmount] = useState(100000);
  const [lumpRate, setLumpRate] = useState(12);
  const [lumpYears, setLumpYears] = useState(10);

  // Brokerage State
  const [brokerBuyPrice, setBrokerBuyPrice] = useState(1000);
  const [brokerQty, setBrokerQty] = useState(100);
  const [brokerSellPrice, setBrokerSellPrice] = useState(1100);

  // Margin State
  const [marginPrice, setMarginPrice] = useState(1000);
  const [marginQty, setMarginQty] = useState(100);
  const [marginPercent, setMarginPercent] = useState(20);

  // ── SIP Calculation ──
  const sipMonths = sipYears * 12;
  const sipMonthlyRate = sipRate / 100 / 12;
  const sipFutureValue = sipAmount * ((Math.pow(1 + sipMonthlyRate, sipMonths) - 1) / sipMonthlyRate) * (1 + sipMonthlyRate);
  const sipInvested = sipAmount * sipMonths;
  const sipReturns = sipFutureValue - sipInvested;

  // ── Lumpsum Calculation ──
  const lumpFutureValue = lumpAmount * Math.pow(1 + lumpRate / 100, lumpYears);
  const lumpReturns = lumpFutureValue - lumpAmount;

  // ── Brokerage Calculation ──
  const buyValue = brokerBuyPrice * brokerQty;
  const sellValue = brokerSellPrice * brokerQty;
  const brokerageRate = 0.0003; // 0.03%
  const buyBrokerage = Math.min(buyValue * brokerageRate, 20);
  const sellBrokerage = Math.min(sellValue * brokerageRate, 20);
  const stt = sellValue * 0.001;
  const stampDuty = buyValue * 0.00015;
  const sebiCharges = (buyValue + sellValue) * 0.000001;
  const totalCharges = buyBrokerage + sellBrokerage + stt + stampDuty + sebiCharges;
  const grossPnl = sellValue - buyValue;
  const netPnl = grossPnl - totalCharges;

  // ── Margin Calculation ──
  const totalValue = marginPrice * marginQty;
  const marginRequired = totalValue * (marginPercent / 100);
  const leverage = totalValue / marginRequired;

  const SliderInput = ({ label, value, onChange, min, max, step = 1, prefix = '', suffix = '' }) => (
    <div className="mb-5">
      <div className="flex justify-between mb-2">
        <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{label}</label>
        <span className="text-sm font-bold font-mono text-cyan-400">{prefix}{value.toLocaleString('en-IN')}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500" />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-slate-600">{prefix}{min.toLocaleString()}{suffix}</span>
        <span className="text-[10px] text-slate-600">{prefix}{max.toLocaleString()}{suffix}</span>
      </div>
    </div>
  );

  const ResultRow = ({ label, value, color = 'text-white', large = false }) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`font-bold font-mono ${large ? 'text-xl' : 'text-sm'} ${color}`}>{value}</span>
    </div>
  );

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Calculators</h1>
        <p className="text-cyan-400 text-sm mt-0.5 font-medium">Plan your investments & estimate charges</p>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'bg-cyan-500 text-slate-900 shadow-[0_0_12px_rgba(34,211,238,0.4)]' : 'glass-panel text-slate-400 hover:text-white'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
            <Calculator size={18} className="text-cyan-400" /> {activeTab} Calculator
          </h3>

          {activeTab === 'SIP' && <>
            <SliderInput label="Monthly Investment" value={sipAmount} onChange={setSipAmount} min={500} max={100000} step={500} prefix="₹" />
            <SliderInput label="Expected Return Rate" value={sipRate} onChange={setSipRate} min={1} max={30} suffix="% p.a." />
            <SliderInput label="Time Period" value={sipYears} onChange={setSipYears} min={1} max={40} suffix=" years" />
          </>}

          {activeTab === 'Lumpsum' && <>
            <SliderInput label="Investment Amount" value={lumpAmount} onChange={setLumpAmount} min={1000} max={10000000} step={1000} prefix="₹" />
            <SliderInput label="Expected Return Rate" value={lumpRate} onChange={setLumpRate} min={1} max={30} suffix="% p.a." />
            <SliderInput label="Time Period" value={lumpYears} onChange={setLumpYears} min={1} max={40} suffix=" years" />
          </>}

          {activeTab === 'Brokerage' && <>
            <SliderInput label="Buy Price" value={brokerBuyPrice} onChange={setBrokerBuyPrice} min={10} max={100000} step={10} prefix="₹" />
            <SliderInput label="Quantity" value={brokerQty} onChange={setBrokerQty} min={1} max={10000} />
            <SliderInput label="Sell Price" value={brokerSellPrice} onChange={setBrokerSellPrice} min={10} max={100000} step={10} prefix="₹" />
          </>}

          {activeTab === 'Margin' && <>
            <SliderInput label="Stock Price" value={marginPrice} onChange={setMarginPrice} min={10} max={100000} step={10} prefix="₹" />
            <SliderInput label="Quantity" value={marginQty} onChange={setMarginQty} min={1} max={10000} />
            <SliderInput label="Margin Required" value={marginPercent} onChange={setMarginPercent} min={5} max={100} suffix="%" />
          </>}
        </div>

        {/* Result Panel */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-400" /> Results
          </h3>

          {activeTab === 'SIP' && <>
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl mb-4 text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Future Value</p>
              <p className="text-3xl font-bold font-mono text-cyan-400">₹{fmt(sipFutureValue)}</p>
            </div>
            <ResultRow label="Total Invested" value={`₹${fmt(sipInvested)}`} />
            <ResultRow label="Total Returns" value={`₹${fmt(sipReturns)}`} color="text-emerald-400" />
            <ResultRow label="Return %" value={`${((sipReturns / sipInvested) * 100).toFixed(1)}%`} color="text-emerald-400" />
            <ResultRow label="Monthly SIP" value={`₹${fmt(sipAmount)}`} />
            <ResultRow label="Duration" value={`${sipYears} years`} />
          </>}

          {activeTab === 'Lumpsum' && <>
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl mb-4 text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Future Value</p>
              <p className="text-3xl font-bold font-mono text-cyan-400">₹{fmt(lumpFutureValue)}</p>
            </div>
            <ResultRow label="Amount Invested" value={`₹${fmt(lumpAmount)}`} />
            <ResultRow label="Total Returns" value={`₹${fmt(lumpReturns)}`} color="text-emerald-400" />
            <ResultRow label="Return %" value={`${((lumpReturns / lumpAmount) * 100).toFixed(1)}%`} color="text-emerald-400" />
            <ResultRow label="CAGR" value={`${lumpRate}%`} />
          </>}

          {activeTab === 'Brokerage' && <>
            <div className={`p-4 ${netPnl >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'} border rounded-xl mb-4 text-center`}>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Net P&L</p>
              <p className={`text-3xl font-bold font-mono ${netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{netPnl >= 0 ? '+' : ''}₹{fmt(netPnl)}</p>
            </div>
            <ResultRow label="Buy Value" value={`₹${fmt(buyValue)}`} />
            <ResultRow label="Sell Value" value={`₹${fmt(sellValue)}`} />
            <ResultRow label="Gross P&L" value={`₹${fmt(grossPnl)}`} color={grossPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
            <ResultRow label="Total Charges" value={`₹${totalCharges.toFixed(2)}`} color="text-rose-400" />
            <ResultRow label="STT" value={`₹${stt.toFixed(2)}`} />
            <ResultRow label="Brokerage" value={`₹${(buyBrokerage + sellBrokerage).toFixed(2)}`} />
          </>}

          {activeTab === 'Margin' && <>
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl mb-4 text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Margin Required</p>
              <p className="text-3xl font-bold font-mono text-cyan-400">₹{fmt(marginRequired)}</p>
            </div>
            <ResultRow label="Total Position Value" value={`₹${fmt(totalValue)}`} />
            <ResultRow label="Leverage" value={`${leverage.toFixed(1)}x`} color="text-yellow-400" />
            <ResultRow label="Margin %" value={`${marginPercent}%`} />
            <ResultRow label="Free Capital" value={`₹${fmt(totalValue - marginRequired)}`} color="text-emerald-400" />
          </>}
        </div>
      </div>
    </div>
  );
};

export default Calculator_Page;