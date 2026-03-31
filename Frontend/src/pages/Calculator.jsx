import React, { useState } from 'react';
import { Calculator, TrendingUp, BarChart2, Percent } from 'lucide-react';

const tabs = [
  { key: 'SIP', icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { key: 'Lumpsum', icon: BarChart2, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  { key: 'Brokerage', icon: Calculator, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { key: 'Margin', icon: Percent, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
];

const Calculator_Page = () => {
  const [activeTab, setActiveTab] = useState('SIP');
  const fmt = (n) => Math.round(n).toLocaleString('en-IN');

  const [sipAmount, setSipAmount] = useState(5000);
  const [sipRate, setSipRate] = useState(12);
  const [sipYears, setSipYears] = useState(10);
  const [lumpAmount, setLumpAmount] = useState(100000);
  const [lumpRate, setLumpRate] = useState(12);
  const [lumpYears, setLumpYears] = useState(10);
  const [brokerBuyPrice, setBrokerBuyPrice] = useState(1000);
  const [brokerQty, setBrokerQty] = useState(100);
  const [brokerSellPrice, setBrokerSellPrice] = useState(1100);
  const [marginPrice, setMarginPrice] = useState(1000);
  const [marginQty, setMarginQty] = useState(100);
  const [marginPercent, setMarginPercent] = useState(20);

  const sipMonths = sipYears * 12;
  const sipMonthlyRate = sipRate / 100 / 12;
  const sipFutureValue = sipAmount * ((Math.pow(1 + sipMonthlyRate, sipMonths) - 1) / sipMonthlyRate) * (1 + sipMonthlyRate);
  const sipInvested = sipAmount * sipMonths;
  const sipReturns = sipFutureValue - sipInvested;

  const lumpFutureValue = lumpAmount * Math.pow(1 + lumpRate / 100, lumpYears);
  const lumpReturns = lumpFutureValue - lumpAmount;

  const buyValue = brokerBuyPrice * brokerQty;
  const sellValue = brokerSellPrice * brokerQty;
  const brokerageRate = 0.0003;
  const buyBrokerage = Math.min(buyValue * brokerageRate, 20);
  const sellBrokerage = Math.min(sellValue * brokerageRate, 20);
  const stt = sellValue * 0.001;
  const stampDuty = buyValue * 0.00015;
  const sebiCharges = (buyValue + sellValue) * 0.000001;
  const totalCharges = buyBrokerage + sellBrokerage + stt + stampDuty + sebiCharges;
  const grossPnl = sellValue - buyValue;
  const netPnl = grossPnl - totalCharges;

  const totalValue = marginPrice * marginQty;
  const marginRequired = totalValue * (marginPercent / 100);
  const leverage = totalValue / marginRequired;

  const activeTabConfig = tabs.find(t => t.key === activeTab);

  const SliderInput = ({ label, value, onChange, min, max, step = 1, prefix = '', suffix = '' }) => (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{label}</label>
        <span className="text-sm font-black font-mono text-white">{prefix}{value.toLocaleString('en-IN')}{suffix}</span>
      </div>
      <div className="relative">
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-1 rounded-full appearance-none cursor-pointer accent-cyan-500"
          style={{ background: `linear-gradient(to right, #06b6d4 ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.08) ${((value - min) / (max - min)) * 100}%)` }} />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[9px] text-slate-700 font-mono">{prefix}{min.toLocaleString()}{suffix}</span>
        <span className="text-[9px] text-slate-700 font-mono">{prefix}{max.toLocaleString()}{suffix}</span>
      </div>
    </div>
  );

  const ResultRow = ({ label, value, color = 'text-slate-300', highlight = false }) => (
    <div className={`flex justify-between items-center py-2.5 border-b border-white/[0.05] last:border-0 ${highlight ? 'bg-white/[0.02] -mx-2 px-2 rounded-lg' : ''}`}>
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-sm font-black font-mono ${color}`}>{value}</span>
    </div>
  );

  const HeroValue = ({ label, value, color }) => (
    <div className={`p-5 rounded-2xl border text-center mb-4 ${color}`}>
      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">{label}</p>
      <p className="text-3xl font-black font-mono text-white">{value}</p>
    </div>
  );

  return (
    <div className="space-y-5 pb-24">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Calculators</h1>
        <p className="text-slate-500 text-sm mt-0.5">Plan investments & estimate charges</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(({ key, icon: Icon, color, bg }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all border ${
              activeTab === key ? `${bg} ${color}` : 'border-white/[0.07] bg-white/[0.02] text-slate-500 hover:text-slate-300'
            }`}>
            <Icon size={13} /> {key}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Input Panel */}
        <div className="p-5 rounded-2xl border bg-white/[0.02] border-white/[0.07]">
          <div className="flex items-center gap-2 mb-5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${activeTabConfig?.bg}`}>
              <activeTabConfig.icon size={13} className={activeTabConfig?.color} />
            </div>
            <h3 className="text-sm font-black text-white">{activeTab} Calculator</h3>
          </div>

          {activeTab === 'SIP' && <>
            <SliderInput label="Monthly Investment" value={sipAmount} onChange={setSipAmount} min={500} max={100000} step={500} prefix="₹" />
            <SliderInput label="Expected Return Rate" value={sipRate} onChange={setSipRate} min={1} max={30} suffix="% p.a." />
            <SliderInput label="Time Period" value={sipYears} onChange={setSipYears} min={1} max={40} suffix=" yrs" />
          </>}

          {activeTab === 'Lumpsum' && <>
            <SliderInput label="Investment Amount" value={lumpAmount} onChange={setLumpAmount} min={1000} max={10000000} step={1000} prefix="₹" />
            <SliderInput label="Expected Return Rate" value={lumpRate} onChange={setLumpRate} min={1} max={30} suffix="% p.a." />
            <SliderInput label="Time Period" value={lumpYears} onChange={setLumpYears} min={1} max={40} suffix=" yrs" />
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
        <div className="p-5 rounded-2xl border bg-white/[0.02] border-white/[0.07]">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={15} className="text-emerald-400" />
            <h3 className="text-sm font-black text-white">Results</h3>
          </div>

          {activeTab === 'SIP' && <>
            <HeroValue label="Future Value" value={`₹${fmt(sipFutureValue)}`} color="bg-cyan-500/8 border-cyan-500/15" />
            <ResultRow label="Total Invested" value={`₹${fmt(sipInvested)}`} />
            <ResultRow label="Total Returns" value={`₹${fmt(sipReturns)}`} color="text-emerald-400" />
            <ResultRow label="Return %" value={`${((sipReturns / sipInvested) * 100).toFixed(1)}%`} color="text-emerald-400" highlight />
            <ResultRow label="Monthly SIP" value={`₹${fmt(sipAmount)}`} />
            <ResultRow label="Duration" value={`${sipYears} years`} />
          </>}

          {activeTab === 'Lumpsum' && <>
            <HeroValue label="Future Value" value={`₹${fmt(lumpFutureValue)}`} color="bg-indigo-500/8 border-indigo-500/15" />
            <ResultRow label="Amount Invested" value={`₹${fmt(lumpAmount)}`} />
            <ResultRow label="Total Returns" value={`₹${fmt(lumpReturns)}`} color="text-emerald-400" />
            <ResultRow label="Return %" value={`${((lumpReturns / lumpAmount) * 100).toFixed(1)}%`} color="text-emerald-400" highlight />
            <ResultRow label="CAGR" value={`${lumpRate}%`} />
          </>}

          {activeTab === 'Brokerage' && <>
            <HeroValue label="Net P&L" value={`${netPnl >= 0 ? '+' : ''}₹${fmt(netPnl)}`}
              color={netPnl >= 0 ? 'bg-emerald-500/8 border-emerald-500/15' : 'bg-rose-500/8 border-rose-500/15'} />
            <ResultRow label="Buy Value" value={`₹${fmt(buyValue)}`} />
            <ResultRow label="Sell Value" value={`₹${fmt(sellValue)}`} />
            <ResultRow label="Gross P&L" value={`${grossPnl >= 0 ? '+' : ''}₹${fmt(grossPnl)}`} color={grossPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'} highlight />
            <ResultRow label="Total Charges" value={`₹${totalCharges.toFixed(2)}`} color="text-rose-400" />
            <ResultRow label="STT" value={`₹${stt.toFixed(2)}`} />
            <ResultRow label="Brokerage" value={`₹${(buyBrokerage + sellBrokerage).toFixed(2)}`} />
          </>}

          {activeTab === 'Margin' && <>
            <HeroValue label="Margin Required" value={`₹${fmt(marginRequired)}`} color="bg-violet-500/8 border-violet-500/15" />
            <ResultRow label="Total Position Value" value={`₹${fmt(totalValue)}`} />
            <ResultRow label="Leverage" value={`${leverage.toFixed(1)}x`} color="text-amber-400" highlight />
            <ResultRow label="Margin %" value={`${marginPercent}%`} />
            <ResultRow label="Free Capital" value={`₹${fmt(totalValue - marginRequired)}`} color="text-emerald-400" />
          </>}
        </div>
      </div>
    </div>
  );
};

export default Calculator_Page;