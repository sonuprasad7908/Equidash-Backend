import React, { useState, useRef } from 'react';
import { Filter, TrendingUp, TrendingDown, RefreshCw, Search, Play, Square, Zap, BarChart3, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { API } from '../utils/app';

const STOCKS=['RELIANCE','TCS','HDFCBANK','ICICIBANK','INFY','SBIN','WIPRO','HCLTECH','BAJFINANCE','MARUTI','SUNPHARMA','ONGC','NTPC','ADANIENT','ITC','HINDUNILVR','TITAN','AXISBANK','KOTAKBANK','BHARTIARTL','TATASTEEL','JSWSTEEL','TECHM','DRREDDY','CIPLA','DIVISLAB','APOLLOHOSP','COALINDIA','BPCL','INDUSINDBK','TMPV','TMCV'];

const S = { card:{ background:'rgba(9,15,28,0.75)', border:'1px solid rgba(255,255,255,0.05)', backdropFilter:'blur(16px)' } };

const fmt = n=>(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});

const signalStyle = s=>s==='BUY'
  ?{color:'#34d399',bg:'rgba(52,211,153,0.1)',border:'rgba(52,211,153,0.25)'}
  :{color:'#fb7185',bg:'rgba(251,113,133,0.1)',border:'rgba(251,113,133,0.25)'};

const StockRow = ({ stock, index }) => {
  const [vis, setVis] = useState(false);
  const [hov, setHov] = useState(false);
  const sig = signalStyle(stock.signal);
  const up = stock.change>=0;

  React.useEffect(()=>{ const t=setTimeout(()=>setVis(true),index*40+100); return ()=>clearTimeout(t); },[index]);

  return (
    <tr onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        borderBottom:'1px solid rgba(255,255,255,0.03)',
        background:hov?'rgba(255,255,255,0.025)':'transparent',
        opacity:vis?1:0, transition:`opacity .35s ease ${index*40}ms`,
      }}>
      <td className="py-3.5 pl-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
            style={{background:`hsl(${(index*47)%360},50%,30%)`}}>
            {stock.ticker[0]}
          </div>
          <div>
            <p className="text-sm font-black" style={{color:'#f1f5f9'}}>{stock.ticker}</p>
            {stock.name&&<p className="text-[10px] truncate max-w-[120px]" style={{color:'#334155'}}>{stock.name}</p>}
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4 text-right">
        <p className="text-sm font-black font-mono" style={{color:'#f1f5f9'}}>₹{fmt(stock.price)}</p>
      </td>
      <td className="py-3.5 px-4 text-right">
        <span className="flex items-center justify-end gap-1 text-sm font-black" style={{color:up?'#34d399':'#fb7185'}}>
          {up?<ChevronUp size={12}/>:<ChevronDown size={12}/>}{up?'+':''}{stock.change?.toFixed(2)}%
        </span>
      </td>
      <td className="py-3.5 px-4 text-right font-mono text-sm" style={{color:'#94a3b8'}}>
        {stock.rsi?(
          <span style={{color:stock.rsi>70?'#fb7185':stock.rsi<30?'#34d399':'#94a3b8'}}>{stock.rsi.toFixed(1)}</span>
        ):'—'}
      </td>
      <td className="py-3.5 px-4 text-right font-mono text-sm" style={{color:stock.macd>0?'#34d399':'#fb7185'}}>
        {stock.macd!==undefined?`${stock.macd>0?'+':''}${stock.macd.toFixed(2)}`:'—'}
      </td>
      <td className="py-3.5 px-4 text-right font-mono text-sm" style={{color:'#94a3b8'}}>
        {stock.market_cap?`₹${(stock.market_cap/10000000).toLocaleString('en-IN',{maximumFractionDigits:0})}Cr`:'—'}
      </td>
      <td className="py-3.5 pr-6 text-right">
        <span className="text-[11px] font-black px-2.5 py-1 rounded-full" style={{color:sig.color,background:sig.bg,border:`1px solid ${sig.border}`}}>
          {stock.signal}
        </span>
      </td>
    </tr>
  );
};

const Screener = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('change');
  const [sortDir, setSortDir] = useState('desc');
  const [filters, setFilters] = useState({minRsi:0,maxRsi:100,minChange:-20,maxChange:20,signal:'all'});
  const abortRef = useRef(false);

  const loadScreener = async () => {
    setLoading(true); setLoaded(false); setStocks([]); setProgress(0); abortRef.current=false;
    const results=[];
    for(let i=0;i<STOCKS.length;i++){
      if(abortRef.current) break;
      const t=STOCKS[i];
      try{
        const r=await fetch(`${API}/stock/${t}`); const d=await r.json();
        if(d.price){ results.push({ticker:t,name:d.name,price:d.price,change:d.change,market_cap:d.market_cap,volume:d.volume,pe_ratio:d.pe_ratio,rsi:d.indicators?.rsi,macd:d.indicators?.macd,sma_20:d.indicators?.sma_20,signal:d.indicators?.macd>0?'BUY':'SELL'}); setStocks([...results]); }
      }catch(e){}
      setProgress(i+1);
    }
    setLoading(false); setLoaded(true);
  };

  const stopScreener=()=>{ abortRef.current=true; setLoading(false); setLoaded(true); };

  const handleSort=(col)=>{ if(sortBy===col) setSortDir(d=>d==='asc'?'desc':'asc'); else{setSortBy(col);setSortDir('desc');} };

  const filtered=stocks
    .filter(s=>s.ticker.includes(search.toUpperCase())||s.name?.toLowerCase().includes(search.toLowerCase()))
    .filter(s=>(s.rsi||50)>=filters.minRsi&&(s.rsi||50)<=filters.maxRsi)
    .filter(s=>s.change>=filters.minChange&&s.change<=filters.maxChange)
    .filter(s=>filters.signal==='all'||s.signal===filters.signal)
    .sort((a,b)=>{ const av=a[sortBy]||0,bv=b[sortBy]||0; return sortDir==='asc'?av-bv:bv-av; });

  const SortHeader=({col,label})=>{
    const active=sortBy===col;
    return (
      <th className="py-3 px-4 text-right select-none cursor-pointer transition-colors"
        style={{color:active?'#22d3ee':'#334155',userSelect:'none'}}
        onClick={()=>handleSort(col)}>
        <span className="flex items-center justify-end gap-1 text-[10px] font-black uppercase tracking-[0.12em]">
          {label} {active?(sortDir==='asc'?<ChevronUp size={10}/>:<ChevronDown size={10}/>):<ChevronsUpDown size={10} style={{opacity:0.4}}/>}
        </span>
      </th>
    );
  };

  const inputCls="w-full px-3 py-2 rounded-xl text-sm font-mono outline-none transition-all";
  const inputSt={background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',color:'#f1f5f9'};

  return (
    <div className="space-y-6 pb-24">
      <style>{`@keyframes sc-fade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div className="flex justify-between items-start" style={{animation:'sc-fade .5s ease both'}}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{background:'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.1))',border:'1px solid rgba(99,102,241,0.25)'}}>
            <Filter size={18} className="text-indigo-400"/>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight" style={{color:'#f8fafc',letterSpacing:'-0.03em'}}>Stock Screener</h1>
            <p className="text-sm font-medium" style={{color:'#22d3ee'}}>Filter & discover by technical indicators</p>
          </div>
        </div>
        <div className="flex gap-2">
          {loading?(
            <button onClick={stopScreener}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white transition-all"
              style={{background:'linear-gradient(135deg,#dc2626,#b91c1c)',boxShadow:'0 0 16px rgba(239,68,68,0.3)'}}>
              <Square size={13}/> Stop
            </button>
          ):(
            <button onClick={loadScreener}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-slate-900 transition-all"
              style={{background:'linear-gradient(135deg,#22d3ee,#3b82f6)',boxShadow:'0 0 16px rgba(34,211,238,0.3)'}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 0 24px rgba(34,211,238,0.5)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='0 0 16px rgba(34,211,238,0.3)'}>
              <Play size={13}/>{loaded?'Refresh':'Run Screener'}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="p-5 rounded-2xl relative overflow-hidden" style={S.card}>
        <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',height:1,width:160,background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.6),transparent)'}}/>
        <div className="flex items-center gap-2 mb-4">
          <Zap size={13} className="text-indigo-400"/>
          <p className="text-xs font-black uppercase tracking-[0.15em]" style={{color:'#475569'}}>Filters</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[{l:'Min RSI',k:'minRsi',min:0,max:100},{l:'Max RSI',k:'maxRsi',min:0,max:100},{l:'Min Change %',k:'minChange',min:-20,max:0},{l:'Max Change %',k:'maxChange',min:0,max:20}].map(({l,k,min,max})=>(
            <div key={k}>
              <label className="block text-[10px] uppercase tracking-[0.12em] font-black mb-1.5" style={{color:'#334155'}}>{l}</label>
              <input type="number" value={filters[k]} onChange={e=>setFilters(f=>({...f,[k]:+e.target.value}))} min={min} max={max}
                className={inputCls} style={inputSt}
                onFocus={e=>{e.target.style.borderColor='rgba(99,102,241,0.4)';e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.06)';}}
                onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)';e.target.style.boxShadow='none';}}/>
            </div>
          ))}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.12em] font-black mb-1.5" style={{color:'#334155'}}>Signal</label>
            <div className="flex gap-1">
              {['all','BUY','SELL'].map(s=>(
                <button key={s} onClick={()=>setFilters(f=>({...f,signal:s}))}
                  className="flex-1 py-2 rounded-lg text-[11px] font-black transition-all duration-150"
                  style={filters.signal===s?{background:s==='BUY'?'rgba(52,211,153,0.15)':s==='SELL'?'rgba(251,113,133,0.15)':'rgba(34,211,238,0.15)',border:`1px solid ${s==='BUY'?'rgba(52,211,153,0.3)':s==='SELL'?'rgba(251,113,133,0.3)':'rgba(34,211,238,0.3)'}`,color:s==='BUY'?'#34d399':s==='SELL'?'#fb7185':'#22d3ee'}:{...inputSt,color:'#475569'}}>
                  {s==='all'?'All':s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      {loading&&(
        <div className="p-4 rounded-2xl" style={S.card}>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm" style={{color:'#64748b'}}>Scanning {STOCKS.length} stocks…</p>
            <p className="text-sm font-black font-mono text-indigo-400">{progress}/{STOCKS.length}</p>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.04)'}}>
            <div className="h-full rounded-full transition-all duration-200" style={{width:`${(progress/STOCKS.length)*100}%`,background:'linear-gradient(90deg,#6366f1,#8b5cf6)'}}/>
          </div>
        </div>
      )}

      {/* Search + count */}
      {stocks.length>0&&(
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={13} style={{color:'#475569'}}/>
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search ticker or name…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',color:'#f1f5f9'}}
              onFocus={e=>{e.target.style.borderColor='rgba(34,211,238,0.35)';}}
              onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.06)';}}/>
          </div>
          <span className="text-xs font-black px-3 py-2 rounded-xl" style={{color:'#22d3ee',background:'rgba(34,211,238,0.08)',border:'1px solid rgba(34,211,238,0.15)'}}>
            {filtered.length} results
          </span>
        </div>
      )}

      {/* Table */}
      {stocks.length>0&&(
        <div className="rounded-2xl overflow-hidden" style={S.card}>
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,0.04)',background:'rgba(255,255,255,0.01)'}}>
                  <th className="py-3 pl-6 text-left text-[10px] font-black uppercase tracking-[0.12em]" style={{color:'#334155'}}>Stock</th>
                  <SortHeader col="price"      label="Price"/>
                  <SortHeader col="change"     label="Change"/>
                  <SortHeader col="rsi"        label="RSI"/>
                  <SortHeader col="macd"       label="MACD"/>
                  <SortHeader col="market_cap" label="Mkt Cap"/>
                  <th className="py-3 pr-6 text-right text-[10px] font-black uppercase tracking-[0.12em]" style={{color:'#334155'}}>Signal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length>0
                  ?filtered.map((s,i)=><StockRow key={s.ticker} stock={s} index={i}/>)
                  :<tr><td colSpan={7} className="py-12 text-center text-sm" style={{color:'#334155'}}>No stocks match your filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loaded&&!loading&&(
        <div className="p-16 rounded-2xl text-center flex flex-col items-center gap-4" style={{...S.card,border:'1px dashed rgba(255,255,255,0.07)'}}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
            <BarChart3 size={24} style={{color:'#334155'}}/>
          </div>
          <div>
            <h3 className="text-lg font-black mb-1" style={{color:'#475569'}}>Ready to Screen</h3>
            <p className="text-sm" style={{color:'#334155'}}>Click "Run Screener" to scan {STOCKS.length} NSE stocks by RSI, MACD, and price movement.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Screener;