import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GitCompare, Map, Filter, Landmark, Search, TrendingUp, TrendingDown,
  RefreshCw, Plus, X, ChevronUp, ChevronDown, ChevronsUpDown,
  Play, Square, BarChart2, Activity, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { API } from '../utils/app';

const V = '#a78bfa';
const fmt = n => (n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});

/* ─── CSS ─── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Syne:wght@700;800&family=Inter:wght@400;500;600;700;800;900&display=swap');
  .rp{font-family:'Inter',sans-serif;color:#e2e8f0;min-height:100vh;background:#030712;}
  .rp *{box-sizing:border-box;}
  .rp .M{font-family:'IBM Plex Mono',monospace!important;}
  .rp .S{font-family:'Syne',sans-serif!important;}
  .rp::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
    background-image:linear-gradient(rgba(167,139,250,0.022) 1px,transparent 1px),
                     linear-gradient(90deg,rgba(167,139,250,0.022) 1px,transparent 1px);
    background-size:52px 52px;
    mask-image:radial-gradient(ellipse 100% 60% at 50% 0%,black 20%,transparent 100%);}
  .rp::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
    background:radial-gradient(ellipse 55% 50% at 10% 5%,rgba(139,92,246,0.07) 0%,transparent 60%),
               radial-gradient(ellipse 45% 55% at 90% 95%,rgba(167,139,250,0.05) 0%,transparent 60%);
    animation:rmesh 12s ease-in-out infinite alternate;}
  @keyframes rmesh{0%{opacity:0.7}100%{opacity:1}}

  /* Card */
  .rc{background:rgba(9,15,28,0.86);border:1px solid rgba(255,255,255,0.07);
      backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
      border-radius:18px;transform-style:preserve-3d;
      transition:transform 0.26s cubic-bezier(0.22,1,0.36,1),box-shadow 0.26s ease,border-color 0.26s ease;
      will-change:transform;}
  .rc:hover{border-color:rgba(167,139,250,0.2);
    box-shadow:0 20px 56px rgba(0,0,0,0.5),0 0 28px rgba(139,92,246,0.08);}
  .rc-tilt{cursor:default;}

  /* Tab btn */
  .rtab{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:13px;
    font-size:12px;font-weight:800;cursor:pointer;border:none;position:relative;
    transition:all 0.22s cubic-bezier(0.34,1.2,0.64,1);}
  .rtab:hover:not(.rtab-on){transform:translateY(-2px);}
  .rtab-on::after{content:'';position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);
    height:2.5px;width:30px;border-radius:99px;background:#a78bfa;box-shadow:0 0 10px #a78bfa;}

  /* Heat cell */
  .hcell{transition:transform 0.2s cubic-bezier(0.22,1,0.36,1),box-shadow 0.2s ease;border-radius:13px;cursor:pointer;}
  .hcell:hover{transform:scale(1.08) translateZ(8px);box-shadow:0 12px 28px rgba(0,0,0,0.5);}

  /* Row hover */
  .rhrow{transition:background 0.12s;cursor:pointer;}
  .rhrow:hover{background:rgba(167,139,250,0.04)!important;}

  /* Animations */
  @keyframes rin{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes rtab{from{opacity:0;transform:translateY(10px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes rpx{0%,100%{opacity:1}50%{opacity:0.35}}
  @keyframes rrot{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  @keyframes rscan{0%{top:-1px}100%{top:calc(100% + 1px)}}
  @keyframes rfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  @keyframes rpulse{0%,100%{box-shadow:0 0 0 0 rgba(167,139,250,0.4)}70%{box-shadow:0 0 0 12px rgba(167,139,250,0)}}

  .r-in  {animation:rin   0.5s cubic-bezier(0.22,1,0.36,1) both;}
  .r-tab {animation:rtab  0.3s cubic-bezier(0.34,1.2,0.64,1) both;}
  .r-px  {animation:rpx   1.5s ease-in-out infinite;}
  .r-spin{animation:rrot  0.75s linear infinite;}
  .r-fl  {animation:rfloat 6s ease-in-out infinite;}
  .scan{position:absolute;left:0;right:0;height:1px;
    background:linear-gradient(90deg,transparent,rgba(167,139,250,0.25),transparent);
    animation:rscan 5s ease-in-out infinite;pointer-events:none;z-index:2;}

  .rp ::-webkit-scrollbar{width:4px;height:4px;}
  .rp ::-webkit-scrollbar-track{background:transparent;}
  .rp ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.09);border-radius:8px;}

  /* ── Responsive ── */
  @media(max-width:768px){
    .rp{padding:16px 12px!important;}
    .rc[data-compare-chart]{height:180px!important;}
  }
`;

/* ─── Tilt hook ─── */
const useTilt = (str=10) => {
  const r = useRef(null);
  const mm = e => {
    const el=r.current; if(!el) return;
    const{left,top,width,height}=el.getBoundingClientRect();
    const x=(e.clientX-left)/width-0.5, y=(e.clientY-top)/height-0.5;
    el.style.transform=`perspective(700px) rotateY(${x*str}deg) rotateX(${-y*str}deg) translateZ(6px)`;
    el.style.boxShadow=`${-x*18}px ${-y*18}px 40px rgba(0,0,0,0.5),0 0 0 1px rgba(167,139,250,${0.08+Math.abs(x+y)*0.1})`;
  };
  const ml = () => { const el=r.current; if(!el) return; el.style.transform=''; el.style.boxShadow=''; };
  return {ref:r, onMouseMove:mm, onMouseLeave:ml};
};

/* ─── TabBtn ─── */
const TabBtn = ({active,onClick,icon:Icon,label,count}) => {
  const ref = useRef(null);
  const mm = e => {
    const el=ref.current; if(!el||active) return;
    const{left,top,width,height}=el.getBoundingClientRect();
    const x=(e.clientX-left)/width-0.5, y=(e.clientY-top)/height-0.5;
    el.style.transform=`perspective(400px) rotateY(${x*16}deg) rotateX(${-y*16}deg) translateY(-2px)`;
  };
  const ml = () => { const el=ref.current; if(!el||active) return; el.style.transform=''; };
  return (
    <button ref={ref} onClick={onClick} onMouseMove={mm} onMouseLeave={ml}
      className={active?'rtab rtab-on':'rtab'}
      style={{background:active?'rgba(167,139,250,0.14)':'rgba(255,255,255,0.03)',
        border:`1px solid ${active?'rgba(167,139,250,0.32)':'rgba(255,255,255,0.07)'}`,
        color:active?V:'#4b5563',
        boxShadow:active?'0 0 20px rgba(139,92,246,0.2),inset 0 1px 0 rgba(167,139,250,0.12)':'none',
        transformStyle:'preserve-3d'}}>
      <Icon size={13}/>{label}
      {count!==undefined&&<span style={{fontSize:9,fontWeight:800,padding:'2px 6px',borderRadius:6,
        background:active?'rgba(167,139,250,0.18)':'rgba(255,255,255,0.05)',
        color:active?V:'#334155'}}>{count}</span>}
    </button>
  );
};

/* ─── Skeleton ─── */
const Sk=({w='100%',h=13,r=7})=>(<div className="r-px" style={{width:w,height:h,borderRadius:r,background:'rgba(255,255,255,0.06)'}}/>);

/* ══════════════════════════════════
   SCREENER TAB
══════════════════════════════════ */
const STOCKS=['RELIANCE','TCS','HDFCBANK','ICICIBANK','INFY','SBIN','WIPRO','HCLTECH',
  'BAJFINANCE','MARUTI','SUNPHARMA','ONGC','NTPC','ADANIENT','ITC','HINDUNILVR',
  'TITAN','AXISBANK','KOTAKBANK','BHARTIARTL','TATASTEEL','JSWSTEEL','TECHM',
  'DRREDDY','CIPLA','DIVISLAB','APOLLOHOSP','COALINDIA','BPCL','INDUSINDBK','TMPV','TMCV'];

const ScreenerTab=()=>{
  const [stocks,setStocks]=useState([]);const [loading,setLoading]=useState(false);
  const [progress,setProgress]=useState(0);const [loaded,setLoaded]=useState(false);
  const [search,setSearch]=useState('');const [sortBy,setSortBy]=useState('change');
  const [sortDir,setSortDir]=useState('desc');const [filters,setFilters]=useState({minRsi:0,maxRsi:100,signal:'all'});
  const abort=useRef(false);

  const run=async()=>{
    setLoading(true);setLoaded(false);setStocks([]);setProgress(0);abort.current=false;
    const res=[];
    for(let i=0;i<STOCKS.length;i++){
      if(abort.current)break;
      try{const r=await fetch(`${API}/stock/${STOCKS[i]}`);const d=await r.json();
        if(d.price){res.push({ticker:STOCKS[i],name:d.name,price:d.price,change:d.change,
          market_cap:d.market_cap,volume:d.volume,rsi:d.indicators?.rsi,macd:d.indicators?.macd,
          signal:d.indicators?.macd>0?'BUY':'SELL'});setStocks([...res]);}}
      catch{}setProgress(i+1);}
    setLoading(false);setLoaded(true);
  };

  const handleSort=col=>{if(sortBy===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortBy(col);setSortDir('desc');}};

  const filtered=stocks
    .filter(s=>s.ticker.includes(search.toUpperCase())||s.name?.toLowerCase().includes(search.toLowerCase()))
    .filter(s=>(s.rsi||50)>=filters.minRsi&&(s.rsi||50)<=filters.maxRsi)
    .filter(s=>filters.signal==='all'||s.signal===filters.signal)
    .sort((a,b)=>{const av=a[sortBy]||0,bv=b[sortBy]||0;return sortDir==='asc'?av-bv:bv-av;});

  const tilt=useTilt(4);
  const SH=({col,label})=>{const act=sortBy===col;return(
    <th style={{padding:'12px 14px',textAlign:'right',fontSize:9,fontWeight:800,textTransform:'uppercase',
      letterSpacing:'0.14em',color:act?V:'#334155',cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'}}
      onClick={()=>handleSort(col)}>
      <span style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:4}}>{label}
        {act?(sortDir==='asc'?<ChevronUp size={10}/>:<ChevronDown size={10}/>):<ChevronsUpDown size={10} style={{opacity:0.4}}/>}
      </span>
    </th>);};

  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* Filter card */}
      <div {...tilt} className="rc" style={{padding:20,position:'relative',overflow:'hidden'}}>
        <div className="scan"/>
        <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',
          background:'radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end',position:'relative',zIndex:1}}>
          {/* Min/Max RSI */}
          {[['Min RSI',filters.minRsi,v=>setFilters(f=>({...f,minRsi:v}))],
            ['Max RSI',filters.maxRsi,v=>setFilters(f=>({...f,maxRsi:v}))]].map(([l,val,fn])=>(
            <div key={l}>
              <label style={{fontSize:9,color:'#475569',textTransform:'uppercase',letterSpacing:'0.14em',fontWeight:800,display:'block',marginBottom:6}}>{l}</label>
              <input type="number" value={val} onChange={e=>fn(+e.target.value)} min={0} max={100}
                className="M" style={{width:72,padding:'8px 10px',borderRadius:10,
                  background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',
                  color:'#f1f5f9',fontSize:13,outline:'none'}}/>
            </div>
          ))}
          {/* Signal */}
          <div>
            <label style={{fontSize:9,color:'#475569',textTransform:'uppercase',letterSpacing:'0.14em',fontWeight:800,display:'block',marginBottom:6}}>Signal</label>
            <div style={{display:'flex',gap:4}}>
              {['all','BUY','SELL'].map(s=>(
                <button key={s} onClick={()=>setFilters(f=>({...f,signal:s}))}
                  style={{padding:'8px 12px',borderRadius:9,fontSize:11,fontWeight:800,cursor:'pointer',border:'none',
                    background:filters.signal===s?(s==='BUY'?'rgba(52,211,153,0.15)':s==='SELL'?'rgba(251,113,133,0.15)':'rgba(167,139,250,0.15)'):'rgba(255,255,255,0.04)',
                    color:filters.signal===s?(s==='BUY'?'#34d399':s==='SELL'?'#fb7185':V):'#4b5563',
                    border:`1px solid ${filters.signal===s?(s==='BUY'?'rgba(52,211,153,0.3)':s==='SELL'?'rgba(251,113,133,0.3)':'rgba(167,139,250,0.3)'):'rgba(255,255,255,0.06)'}`}}>
                  {s==='all'?'All':s}
                </button>
              ))}
            </div>
          </div>
          {/* Search */}
          <div style={{flex:1,minWidth:140}}>
            <label style={{fontSize:9,color:'#475569',textTransform:'uppercase',letterSpacing:'0.14em',fontWeight:800,display:'block',marginBottom:6}}>Search</label>
            <div style={{position:'relative'}}>
              <Search size={13} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'#475569',pointerEvents:'none'}}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Ticker or name…"
                style={{width:'100%',paddingLeft:34,paddingRight:12,paddingTop:9,paddingBottom:9,borderRadius:10,
                  background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',
                  color:'#f1f5f9',fontSize:13,outline:'none'}}/>
            </div>
          </div>
          {/* Run/Stop */}
          <div>
            {loading
              ?<button onClick={()=>{abort.current=true;setLoading(false);setLoaded(true);}}
                style={{display:'flex',alignItems:'center',gap:7,padding:'10px 18px',borderRadius:11,fontSize:13,fontWeight:800,color:'#fff',cursor:'pointer',background:'linear-gradient(135deg,#dc2626,#b91c1c)',border:'none',boxShadow:'0 0 16px rgba(220,38,38,0.3)'}}>
                <Square size={13}/> Stop
              </button>
              :<button onClick={run}
                style={{display:'flex',alignItems:'center',gap:7,padding:'10px 22px',borderRadius:11,fontSize:13,fontWeight:800,color:'#030712',cursor:'pointer',background:'linear-gradient(135deg,#8b5cf6,#6d28d9)',border:'none',boxShadow:'0 0 20px rgba(139,92,246,0.35)'}}>
                <Play size={13}/>{loaded?'Refresh':'Run Screener'}
              </button>}
          </div>
        </div>
      </div>

      {/* Progress */}
      {loading&&(
        <div className="rc" style={{padding:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <p style={{fontSize:12,color:'#64748b'}}>Scanning {STOCKS.length} stocks…</p>
            <p className="M" style={{fontSize:12,fontWeight:800,color:V}}>{progress}/{STOCKS.length}</p>
          </div>
          <div style={{height:4,borderRadius:99,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:99,background:'linear-gradient(90deg,#8b5cf6,#6d28d9)',
              width:`${(progress/STOCKS.length)*100}%`,transition:'width 0.2s ease',boxShadow:'0 0 8px rgba(139,92,246,0.6)'}}/>
          </div>
        </div>
      )}

      {/* Table */}
      {stocks.length>0&&(
        <div className="rc" style={{overflow:'hidden'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            <p style={{fontSize:14,fontWeight:900,color:'#f8fafc'}}>Results</p>
            <span className="M" style={{fontSize:10,fontWeight:800,padding:'3px 10px',borderRadius:99,color:V,background:'rgba(167,139,250,0.08)',border:'1px solid rgba(167,139,250,0.15)'}}>{filtered.length} stocks</span>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',whiteSpace:'nowrap'}}>
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,0.05)',background:'rgba(255,255,255,0.01)'}}>
                  <th style={{padding:'12px 14px',paddingLeft:20,textAlign:'left',fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.14em',color:'#334155'}}>Stock</th>
                  <SH col="price" label="Price"/>
                  <SH col="change" label="Change"/>
                  <SH col="rsi" label="RSI"/>
                  <SH col="macd" label="MACD"/>
                  <SH col="market_cap" label="Mkt Cap"/>
                  <th style={{padding:'12px 14px',paddingRight:20,textAlign:'right',fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.14em',color:'#334155'}}>Signal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s,i)=>(
                  <tr key={s.ticker} className="rhrow" style={{borderBottom:'1px solid rgba(255,255,255,0.03)',animation:`rin 0.3s ease ${Math.min(i,15)*25}ms both`}}>
                    <td style={{padding:'12px 14px',paddingLeft:20}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:30,height:30,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:11,fontWeight:900,color:'#fff',flexShrink:0,
                          background:`linear-gradient(135deg,hsl(${(i*47)%360},50%,30%),hsl(${(i*47+60)%360},50%,25%))`}}>
                          {s.ticker[0]}
                        </div>
                        <div>
                          <p style={{fontSize:13,fontWeight:900,color:'#f1f5f9'}}>{s.ticker}</p>
                          {s.name&&<p style={{fontSize:10,color:'#334155',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="M" style={{padding:'12px 14px',fontSize:13,fontWeight:700,color:'#f1f5f9',textAlign:'right'}}>₹{fmt(s.price)}</td>
                    <td style={{padding:'12px 14px',textAlign:'right'}}>
                      <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:13,fontWeight:800,color:s.change>=0?'#34d399':'#fb7185'}}>
                        {s.change>=0?<ChevronUp size={12}/>:<ChevronDown size={12}/>}{s.change>=0?'+':''}{s.change?.toFixed(2)}%
                      </span>
                    </td>
                    <td className="M" style={{padding:'12px 14px',fontSize:13,textAlign:'right',fontWeight:700,
                      color:s.rsi>70?'#fb7185':s.rsi<30?'#34d399':'#94a3b8'}}>{s.rsi?.toFixed(1)||'—'}</td>
                    <td className="M" style={{padding:'12px 14px',fontSize:13,textAlign:'right',fontWeight:700,color:s.macd>0?'#34d399':'#fb7185'}}>
                      {s.macd!==undefined?`${s.macd>0?'+':''}${s.macd.toFixed(2)}`:'—'}
                    </td>
                    <td className="M" style={{padding:'12px 14px',fontSize:13,textAlign:'right',color:'#64748b'}}>
                      {s.market_cap?`₹${(s.market_cap/10000000).toFixed(0)}Cr`:'—'}
                    </td>
                    <td style={{padding:'12px 14px',paddingRight:20,textAlign:'right'}}>
                      <span style={{fontSize:11,fontWeight:800,padding:'3px 10px',borderRadius:99,
                        color:s.signal==='BUY'?'#34d399':'#fb7185',
                        background:s.signal==='BUY'?'rgba(52,211,153,0.1)':'rgba(251,113,133,0.1)',
                        border:`1px solid ${s.signal==='BUY'?'rgba(52,211,153,0.25)':'rgba(251,113,133,0.25)'}`}}>
                        {s.signal}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loaded&&!loading&&(
        <div className="rc" style={{padding:60,textAlign:'center',border:'1px dashed rgba(255,255,255,0.07)'}}>
          <div style={{width:56,height:56,borderRadius:16,background:'rgba(139,92,246,0.08)',border:'1px solid rgba(139,92,246,0.15)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
            <Filter size={24} style={{color:'#4b5563'}}/>
          </div>
          <p style={{fontSize:14,fontWeight:800,color:'#475569',marginBottom:4}}>Ready to Screen</p>
          <p style={{fontSize:12,color:'#334155'}}>Click "Run Screener" to scan {STOCKS.length} NSE stocks live</p>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════
   HEAT MAP TAB
══════════════════════════════════ */
const SECTORS={
  'Banking':['HDFCBANK','ICICIBANK','SBIN','AXISBANK','KOTAKBANK','INDUSINDBK'],
  'IT':['TCS','INFY','WIPRO','HCLTECH','TECHM','LTIM'],
  'Energy':['RELIANCE','ONGC','BPCL','COALINDIA','NTPC','POWERGRID'],
  'Auto':['MARUTI','TMPV','TMCV','BAJAJ-AUTO','HEROMOTOCO','EICHERMOT'],
  'Pharma':['SUNPHARMA','DRREDDY','CIPLA','DIVISLAB','APOLLOHOSP'],
  'FMCG':['HINDUNILVR','ITC','NESTLEIND','BRITANNIA','DABUR'],
  'Metal':['TATASTEEL','JSWSTEEL','HINDALCO','VEDL','SAIL'],
  'Infra':['ADANIENT','ADANIPORTS','LT','ULTRACEMCO','GRASIM'],
};

const heatClr=c=>{
  if(c==null)return{bg:'rgba(20,30,50,0.6)',color:'#334155',border:'rgba(255,255,255,0.03)'};
  if(c>=3)  return{bg:'rgba(22,163,74,0.9)', color:'#dcfce7',border:'rgba(22,163,74,0.5)'};
  if(c>=1.5)return{bg:'rgba(22,163,74,0.6)', color:'#bbf7d0',border:'rgba(22,163,74,0.3)'};
  if(c>=0.5)return{bg:'rgba(22,163,74,0.32)',color:'#86efac',border:'rgba(22,163,74,0.2)'};
  if(c>=0)  return{bg:'rgba(34,211,153,0.14)',color:'#6ee7b7',border:'rgba(34,211,153,0.15)'};
  if(c>-0.5)return{bg:'rgba(244,63,94,0.14)', color:'#fca5a5',border:'rgba(244,63,94,0.15)'};
  if(c>-1.5)return{bg:'rgba(220,38,38,0.32)', color:'#fca5a5',border:'rgba(220,38,38,0.2)'};
  if(c>-3)  return{bg:'rgba(220,38,38,0.6)',  color:'#fecaca',border:'rgba(220,38,38,0.3)'};
  return{bg:'rgba(185,28,28,0.9)',color:'#fee2e2',border:'rgba(185,28,28,0.5)'};
};

const HeatMapTab=()=>{
  const [data,setData]=useState({});const [loading,setLoading]=useState(false);
  const [loaded,setLoaded]=useState(false);const [progress,setProgress]=useState(0);
  const all=Object.values(SECTORS).flat();

  const load=async()=>{
    setLoading(true);setLoaded(false);setData({});setProgress(0);
    const res={};
    for(let i=0;i<all.length;i++){
      const t=all[i];
      try{const r=await fetch(`${API}/stock/${t}`);const d=await r.json();
        if(d.price){res[t]={price:d.price,change:d.change};setData({...res});}}
      catch{}setProgress(i+1);}
    setLoading(false);setLoaded(true);
  };

  const ms=Object.values(data);
  const avg=ms.length>0?(ms.reduce((s,d)=>s+d.change,0)/ms.length).toFixed(2):0;

  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* Controls */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
        {loaded&&ms.length>0&&(
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {[{l:'Scanned',v:ms.length,c:'#94a3b8'},{l:'Gainers',v:ms.filter(s=>s.change>0).length,c:'#34d399'},
              {l:'Losers',v:ms.filter(s=>s.change<0).length,c:'#fb7185'},{l:'Avg',v:`${avg>=0?'+':''}${avg}%`,c:avg>=0?'#34d399':'#fb7185'}
            ].map(({l,v,c})=>(
              <div key={l} className="rc" style={{padding:'10px 16px',textAlign:'center'}}>
                <p style={{fontSize:9,color:'#334155',textTransform:'uppercase',letterSpacing:'0.14em',fontWeight:800,marginBottom:4}}>{l}</p>
                <p className="M" style={{fontSize:14,fontWeight:700,color:c}}>{v}</p>
              </div>
            ))}
          </div>
        )}
        <button onClick={load} disabled={loading}
          style={{display:'flex',alignItems:'center',gap:8,padding:'10px 22px',borderRadius:12,fontSize:13,fontWeight:800,
            color:'#030712',cursor:'pointer',background:'linear-gradient(135deg,#8b5cf6,#6d28d9)',border:'none',
            boxShadow:'0 0 20px rgba(139,92,246,0.35)',opacity:loading?0.7:1}}>
          <RefreshCw size={14} style={{animation:loading?'rrot 0.75s linear infinite':'none'}}/>
          {loading?`${progress}/${all.length}…`:loaded?'Refresh':'Load Heat Map'}
        </button>
      </div>

      {/* Progress bar */}
      {loading&&(
        <div style={{height:4,borderRadius:99,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
          <div style={{height:'100%',borderRadius:99,background:'linear-gradient(90deg,#8b5cf6,#a78bfa)',
            width:`${(progress/all.length)*100}%`,transition:'width 0.2s ease',boxShadow:'0 0 8px rgba(139,92,246,0.6)'}}/>
        </div>
      )}

      {/* Legend */}
      {(loaded||loading)&&ms.length>0&&(
        <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
          <p style={{fontSize:9,color:'#334155',textTransform:'uppercase',letterSpacing:'0.14em',fontWeight:800}}>Scale</p>
          {[['rgba(22,163,74,0.9)','>3%'],['rgba(22,163,74,0.5)','+1.5%'],['rgba(34,211,153,0.14)','~0%'],['rgba(220,38,38,0.5)','-1.5%'],['rgba(185,28,28,0.9)','<-3%']].map(([bg,l])=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:5}}>
              <div style={{width:12,height:12,borderRadius:3,background:bg}}/>
              <span style={{fontSize:10,color:'#475569'}}>{l}</span>
            </div>
          ))}
        </div>
      )}

      {/* Sectors */}
      {Object.keys(data).length>0&&(
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {Object.entries(SECTORS).map(([sector,tickers])=>{
            const ss=tickers.filter(t=>data[t]);
            if(ss.length===0&&!loading)return null;
            const sAvg=ss.length>0?(ss.reduce((s,t)=>s+(data[t]?.change||0),0)/ss.length):0;
            const sc=heatClr(sAvg);
            return(
              <div key={sector} className="rc" style={{padding:16,position:'relative',overflow:'hidden'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:3,height:18,borderRadius:99,background:sAvg>=0?'#34d399':'#fb7185'}}/>
                    <p style={{fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.12em',color:'#94a3b8'}}>{sector}</p>
                  </div>
                  <span className="M" style={{fontSize:10,fontWeight:800,padding:'3px 10px',borderRadius:99,
                    color:sAvg>=0?'#34d399':'#fb7185',
                    background:sAvg>=0?'rgba(52,211,153,0.1)':'rgba(251,113,133,0.1)',
                    border:`1px solid ${sAvg>=0?'rgba(52,211,153,0.2)':'rgba(251,113,133,0.2)'}`}}>
                    {sAvg>=0?'+':''}{sAvg.toFixed(2)}%
                  </span>
                </div>
                <div style={{display:'grid',gap:8,gridTemplateColumns:`repeat(${Math.min(tickers.length,6)},1fr)`}}>
                  {tickers.map(t=>{
                    const d=data[t];const h=heatClr(d?.change);
                    return(
                      <div key={t} className="hcell" style={{minHeight:68,display:'flex',flexDirection:'column',
                        alignItems:'center',justifyContent:'center',padding:'10px 6px',
                        background:d?h.bg:'rgba(15,23,42,0.5)',border:`1px solid ${d?h.border:'rgba(255,255,255,0.04)'}`}}>
                        {d?(
                          <>
                            <p style={{fontSize:11,fontWeight:800,textAlign:'center',color:h.color,lineHeight:1.2}}>
                              {t.replace('BAJAJ-AUTO','BAJ-A').replace('HEROMOTOCO','HERO')}
                            </p>
                            <p className="M" style={{fontSize:12,fontWeight:700,color:h.color,marginTop:4,opacity:0.9}}>
                              {d.change>=0?'+':''}{d.change?.toFixed(1)}%
                            </p>
                          </>
                        ):(
                          <div className="r-px" style={{width:20,height:20,borderRadius:4,background:'rgba(255,255,255,0.06)'}}/>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loaded&&!loading&&(
        <div className="rc" style={{padding:60,textAlign:'center',border:'1px dashed rgba(255,255,255,0.07)'}}>
          <div style={{width:56,height:56,borderRadius:16,background:'rgba(139,92,246,0.08)',border:'1px solid rgba(139,92,246,0.15)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
            <Map size={24} style={{color:'#4b5563'}}/>
          </div>
          <p style={{fontSize:14,fontWeight:800,color:'#475569',marginBottom:4}}>Market Heat Map</p>
          <p style={{fontSize:12,color:'#334155'}}>Click "Load Heat Map" to visualise NSE sector performance</p>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════
   COMPARE TAB
══════════════════════════════════ */
const COLORS=['#22d3ee','#f59e0b','#a855f7'];

const CompareTab=()=>{
  const [tickers,setTickers]=useState(['RELIANCE','TCS']);
  const [input,setInput]=useState('');const [stocksData,setStocksData]=useState({});
  const [loading,setLoading]=useState(false);const [loaded,setLoaded]=useState(false);const [error,setError]=useState('');

  const addTicker=()=>{
    const t=input.trim().toUpperCase();if(!t)return;
    if(tickers.includes(t)){setError('Already added');return;}
    if(tickers.length>=3){setError('Max 3 stocks');return;}
    setTickers(p=>[...p,t]);setInput('');setError('');
  };

  const load=async()=>{
    if(tickers.length<2){setError('Add at least 2 stocks');return;}
    setLoading(true);setLoaded(false);setError('');const results={};
    await Promise.all(tickers.map(async t=>{
      try{const r=await fetch(`${API}/stock/${t}`);const d=await r.json();if(d.price)results[t]=d;else setError(`${t} not found`);}
      catch{setError(`Failed: ${t}`);}
    }));
    setStocksData(results);setLoading(false);setLoaded(true);
  };

  const chartData=(()=>{
    if(!loaded)return[];
    const dates=new Set();
    Object.values(stocksData).forEach(s=>s.chart_data?.dates?.forEach(d=>dates.add(d)));
    return Array.from(dates).sort().slice(-90).map(date=>{
      const pt={date:date.slice(5)};
      tickers.forEach(t=>{const s=stocksData[t];if(s?.chart_data){
        const idx=s.chart_data.dates.indexOf(date);
        if(idx!==-1){const f=s.chart_data.close[0];pt[t]=parseFloat(((s.chart_data.close[idx]-f)/f*100).toFixed(2));}
      }});return pt;
    });
  })();

  const tilt=useTilt(4);

  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* Selector */}
      <div {...tilt} className="rc" style={{padding:20,position:'relative',overflow:'hidden'}}>
        <div className="scan"/>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:14}}>
          {tickers.map((t,i)=>(
            <div key={t} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 12px',borderRadius:11,fontSize:13,fontWeight:800,
              background:`${COLORS[i]}14`,border:`1px solid ${COLORS[i]}40`,color:COLORS[i]}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:COLORS[i],flexShrink:0}}/>{t}
              {tickers.length>2&&<button onClick={()=>{setTickers(p=>p.filter(s=>s!==t));setStocksData(p=>{const n={...p};delete n[t];return n;})}}
                style={{opacity:0.6,background:'none',border:'none',color:'inherit',cursor:'pointer',display:'flex',marginLeft:2}}
                onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.6}>
                <X size={12}/>
              </button>}
            </div>
          ))}
        </div>
        {tickers.length<3&&(
          <div style={{display:'flex',gap:8,marginBottom:12}}>
            <div style={{position:'relative',flex:1}}>
              <Search size={13} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'#475569',pointerEvents:'none'}}/>
              <input value={input} onChange={e=>setInput(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&addTicker()}
                placeholder="Add ticker… e.g. INFY" className="M"
                style={{width:'100%',paddingLeft:34,paddingRight:12,paddingTop:9,paddingBottom:9,borderRadius:10,
                  background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#f1f5f9',fontSize:13,outline:'none'}}/>
            </div>
            <button onClick={addTicker}
              style={{display:'flex',alignItems:'center',gap:6,padding:'9px 16px',borderRadius:10,fontSize:12,fontWeight:800,cursor:'pointer',
                background:'rgba(167,139,250,0.1)',border:'1px solid rgba(167,139,250,0.25)',color:V}}
              onMouseEnter={e=>{e.currentTarget.style.background=V;e.currentTarget.style.color='#030712';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(167,139,250,0.1)';e.currentTarget.style.color=V;}}>
              <Plus size={12}/>Add
            </button>
          </div>
        )}
        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>
          {['HDFCBANK','INFY','SBIN','WIPRO','ITC','ADANIENT'].filter(t=>!tickers.includes(t)).map(t=>(
            <button key={t} onClick={()=>setInput(t)} className="M"
              style={{fontSize:10,padding:'4px 10px',borderRadius:8,background:'rgba(255,255,255,0.03)',
                border:'1px solid rgba(255,255,255,0.07)',color:'#475569',cursor:'pointer',transition:'all 0.14s'}}
              onMouseEnter={e=>{e.currentTarget.style.color=V;e.currentTarget.style.borderColor='rgba(167,139,250,0.3)';}}
              onMouseLeave={e=>{e.currentTarget.style.color='#475569';e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';}}>
              {t}
            </button>
          ))}
        </div>
        {error&&<p style={{fontSize:11,color:'#fb7185',marginBottom:10}}>⚠ {error}</p>}
        <button onClick={load} disabled={loading||tickers.length<2}
          style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'12px 0',borderRadius:12,
            fontSize:13,fontWeight:800,color:'#030712',cursor:'pointer',
            background:'linear-gradient(135deg,#8b5cf6,#6d28d9)',border:'none',
            boxShadow:'0 0 20px rgba(139,92,246,0.3)',opacity:(loading||tickers.length<2)?0.5:1}}>
          <RefreshCw size={14} style={{animation:loading?'rrot 0.75s linear infinite':'none'}}/>
          {loading?'Loading…':loaded?'Refresh':'Compare Stocks'}
        </button>
      </div>

      {/* Chart */}
      {loaded&&Object.keys(stocksData).length>=2&&(
        <>
          <div className="rc" style={{padding:20}}>
            <p style={{fontSize:14,fontWeight:900,color:'#f8fafc',marginBottom:3}}>Price Performance — Last 90 Days</p>
            <p style={{fontSize:11,color:'#475569',marginBottom:16}}>Normalised % return from start date</p>
            <div style={{height:220}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                  <XAxis dataKey="date" tick={{fill:'#475569',fontSize:10}} tickLine={false} interval={14}/>
                  <YAxis tick={{fill:'#475569',fontSize:10}} tickLine={false} tickFormatter={v=>`${v}%`}/>
                  <Tooltip contentStyle={{background:'rgba(9,15,28,0.97)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:12,fontSize:12}}
                    labelStyle={{color:'#94a3b8'}} formatter={(v,n)=>[`${v}%`,n]}/>
                  {tickers.map((t,i)=>stocksData[t]&&<Line key={t} type="monotone" dataKey={t} stroke={COLORS[i]} strokeWidth={2.5} dot={false} activeDot={{r:5,fill:COLORS[i],strokeWidth:2,stroke:'#030712'}}/>)}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Metrics table */}
          <div className="rc" style={{overflow:'hidden'}}>
            <div style={{padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <div style={{display:'flex'}}>
                <div style={{flex:1}}/>
                {tickers.map((t,i)=>(
                  <div key={t} style={{padding:'0 14px',textAlign:'right',minWidth:100}}>
                    <p className="M" style={{fontSize:14,fontWeight:700,color:COLORS[i]}}>{t}</p>
                    <p style={{fontSize:10,color:'#334155'}}>{stocksData[t]?.name?.split(' ').slice(0,2).join(' ')}</p>
                  </div>
                ))}
              </div>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <tbody>
                {[
                  {l:'Current Price',   fn:t=>stocksData[t]?.price,         fmt2:v=>`₹${fmt(v)}`,        clr:false},
                  {l:'Day Change %',    fn:t=>stocksData[t]?.change,        fmt2:v=>`${v>=0?'+':''}${v?.toFixed(2)}%`, clr:true},
                  {l:'Market Cap',      fn:t=>stocksData[t]?.market_cap,    fmt2:v=>`₹${(v/10000000).toFixed(0)}Cr`,  clr:false},
                  {l:'P/E Ratio',       fn:t=>stocksData[t]?.pe_ratio,      fmt2:v=>v?.toFixed(2)||'N/A', clr:false},
                  {l:'52-Week High',    fn:t=>stocksData[t]?.week_52_high,  fmt2:v=>`₹${fmt(v)}`,        clr:false},
                  {l:'52-Week Low',     fn:t=>stocksData[t]?.week_52_low,   fmt2:v=>`₹${fmt(v)}`,        clr:false},
                  {l:'RSI (14)',        fn:t=>stocksData[t]?.indicators?.rsi, fmt2:v=>v?.toFixed(1),     clr:true},
                  {l:'MACD',           fn:t=>stocksData[t]?.indicators?.macd,fmt2:v=>v?.toFixed(2),     clr:true},
                  {l:'Volume',         fn:t=>stocksData[t]?.volume,         fmt2:v=>`${(v/1000000).toFixed(2)}M`, clr:false},
                ].map(({l,fn,fmt2,clr},ri)=>(
                  <tr key={l} className="rhrow" style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                    <td style={{padding:'11px 20px',fontSize:12,color:'#64748b'}}>{l}</td>
                    {tickers.map((t,i)=>{const v=fn(t);const f=v!=null?fmt2(v):'N/A';return(
                      <td key={t} className="M" style={{padding:'11px 14px',fontSize:13,fontWeight:700,textAlign:'right',
                        color:clr&&typeof v==='number'?(v>=0?'#34d399':'#fb7185'):'#f1f5f9'}}>
                        {f}
                      </td>
                    );})}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

/* ══════════════════════════════════
   IPO TAB
══════════════════════════════════ */
const IPO_DATA={
  open:[
    {name:'Ola Electric Mobility',symbol:'OLAELEC',price_band:'72-76',open:'2024-08-02',close:'2024-08-06',lot_size:195,issue_size:'6145.6 Cr',gmp:15,type:'Mainboard',status:'OPEN'},
    {name:'Brainbees Solutions (FirstCry)',symbol:'FIRSTCRY',price_band:'440-465',open:'2024-08-06',close:'2024-08-08',lot_size:32,issue_size:'4193.7 Cr',gmp:40,type:'Mainboard',status:'OPEN'},
  ],
  upcoming:[
    {name:'Swiggy',symbol:'SWIGGY',price_band:'TBD',open:'Q4 2024',close:'TBD',lot_size:'TBD',issue_size:'~10000 Cr',gmp:null,type:'Mainboard',status:'UPCOMING'},
    {name:'Hyundai India',symbol:'HYUNDAI',price_band:'TBD',open:'Oct 2024',close:'TBD',lot_size:'TBD',issue_size:'~25000 Cr',gmp:null,type:'Mainboard',status:'UPCOMING'},
    {name:'Bajaj Housing Finance',symbol:'BAJAJHFL',price_band:'66-70',open:'2024-09-09',close:'2024-09-11',lot_size:214,issue_size:'6560 Cr',gmp:25,type:'Mainboard',status:'UPCOMING'},
  ],
  recent:[
    {name:'TBO Tek',symbol:'TBOTEK',price_band:'875-920',listing_price:920,current:1426,gain:55},
    {name:'Awfis Space',symbol:'AWFIS',price_band:'364-383',listing_price:383,current:432,gain:12.8},
    {name:'Indegene',symbol:'INDEGENE',price_band:'430-452',listing_price:452,current:742,gain:64},
    {name:'Go Digit',symbol:'GODIGIT',price_band:'258-272',listing_price:272,current:368,gain:35},
  ],
};

const IPOTab=()=>{
  const [sub,setSub]=useState('open');
  const subs=[{k:'open',l:'Open',c:'#34d399'},{k:'upcoming',l:'Upcoming',c:'#fbbf24'},{k:'recent',l:'Recent Listed',c:'#22d3ee'}];

  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* Sub tabs */}
      <div style={{display:'flex',gap:8}}>
        {subs.map(({k,l,c,count})=>(
          <button key={k} onClick={()=>setSub(k)}
            style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',borderRadius:12,fontSize:12,fontWeight:800,cursor:'pointer',
              background:sub===k?`${c}14`:'rgba(255,255,255,0.03)',
              border:`1px solid ${sub===k?c+'30':'rgba(255,255,255,0.07)'}`,
              color:sub===k?c:'#4b5563',transition:'all 0.18s'}}>
            {l}
            <span style={{fontSize:9,fontWeight:800,padding:'2px 6px',borderRadius:6,
              background:sub===k?`${c}20`:'rgba(255,255,255,0.05)',color:sub===k?c:'#334155'}}>
              {IPO_DATA[k].length}
            </span>
          </button>
        ))}
      </div>

      {(sub==='open'||sub==='upcoming')&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:16}}>
          {IPO_DATA[sub].map((ipo,i)=>{
            const isOpen=ipo.status==='OPEN';const c=isOpen?'#34d399':'#fbbf24';
            return(
              <div key={i} className="rc" style={{padding:0,overflow:'hidden',
                animation:`rin 0.4s ease ${i*80}ms both`}}>
                <div style={{height:2,background:`linear-gradient(90deg,transparent,${c},transparent)`}}/>
                <div style={{padding:20}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
                    <div>
                      <p style={{fontSize:15,fontWeight:900,color:'#f8fafc',marginBottom:3}}>{ipo.name}</p>
                      <p className="M" style={{fontSize:10,color:'#475569'}}>{ipo.symbol} · {ipo.type}</p>
                    </div>
                    <span style={{display:'flex',alignItems:'center',gap:5,fontSize:9,fontWeight:800,padding:'4px 10px',borderRadius:8,textTransform:'uppercase',letterSpacing:'0.1em',
                      color:c,background:`${c}14`,border:`1px solid ${c}25`}}>
                      {isOpen&&<span style={{width:6,height:6,borderRadius:'50%',background:c,animation:'rpx 1.5s infinite'}}/>}
                      {ipo.status}
                    </span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
                    {[['Price Band',`₹${ipo.price_band}`],['Issue Size',ipo.issue_size],['Lot Size',ipo.lot_size?.toString()||'TBD'],['Opens',ipo.open],['Closes',ipo.close],['GMP',ipo.gmp!=null?`+₹${ipo.gmp}`:'TBD']].map(([l,v])=>(
                      <div key={l} style={{padding:'10px 12px',borderRadius:11,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.05)'}}>
                        <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:800,color:'#334155',marginBottom:4}}>{l}</p>
                        <p style={{fontSize:12,fontWeight:700,color:l==='GMP'&&ipo.gmp?'#34d399':'#f1f5f9'}}>{v}</p>
                      </div>
                    ))}
                  </div>
                  {ipo.lot_size!=='TBD'&&ipo.price_band!=='TBD'&&(
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',borderRadius:11,background:'rgba(34,211,238,0.04)',border:'1px solid rgba(34,211,238,0.12)'}}>
                      <p style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:800,color:'#475569'}}>Min Investment</p>
                      <p className="M" style={{fontSize:14,fontWeight:700,color:'#22d3ee'}}>
                        ₹{(parseInt(ipo.price_band.split('-')[1])*(typeof ipo.lot_size==='number'?ipo.lot_size:0)).toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sub==='recent'&&(
        <div className="rc" style={{overflow:'hidden'}}>
          <div style={{padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <p style={{fontSize:14,fontWeight:900,color:'#f8fafc'}}>Recently Listed</p>
            <p style={{fontSize:10,color:'#334155'}}>Issue Price → Current</p>
          </div>
          {IPO_DATA.recent.map((ipo,i)=>(
            <div key={i} className="rhrow" style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px',
              borderBottom:i<IPO_DATA.recent.length-1?'1px solid rgba(255,255,255,0.04)':'none',
              animation:`rin 0.35s ease ${i*70}ms both`}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:38,height:38,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',
                  background:'rgba(52,211,153,0.1)',border:'1px solid rgba(52,211,153,0.2)',flexShrink:0}}>
                  <TrendingUp size={16} style={{color:'#34d399'}}/>
                </div>
                <div>
                  <p style={{fontSize:13,fontWeight:800,color:'#f1f5f9'}}>{ipo.name}</p>
                  <p className="M" style={{fontSize:10,color:'#475569'}}>{ipo.symbol} · ₹{ipo.price_band}</p>
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <p className="M" style={{fontSize:13,fontWeight:700,color:'#f1f5f9'}}>₹{ipo.listing_price} → ₹{ipo.current}</p>
                <p className="M" style={{fontSize:11,fontWeight:800,color:'#34d399',marginTop:2}}>+{ipo.gain}% gain</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════
   MAIN RESEARCH
══════════════════════════════════ */
const Research=()=>{
  const [tab,setTab]=useState('screener');
  const tabs=[
    {key:'screener',label:'Screener',  icon:Filter,   count:'32 stocks'},
    {key:'heatmap', label:'Heat Map',  icon:Map,      count:'8 sectors'},
    {key:'compare', label:'Compare',   icon:GitCompare,count:'up to 3'},
    {key:'ipo',     label:'IPO Centre',icon:Landmark, count:`${IPO_DATA.open.length} open`},
  ];

  return(
    <div className="rp r-in" style={{padding:28,paddingBottom:80,position:'relative',zIndex:1}}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16,marginBottom:26}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:46,height:46,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',
            background:'linear-gradient(135deg,#8b5cf6,#6d28d9)',boxShadow:'0 0 24px rgba(139,92,246,0.4)',flexShrink:0}}>
            <Search size={20} color="#fff"/>
          </div>
          <div>
            <h1 className="S" style={{fontSize:32,fontWeight:800,color:'#f8fafc',letterSpacing:'-0.04em',lineHeight:1,
              textShadow:'0 0 40px rgba(167,139,250,0.25)'}}>Research</h1>
            <p style={{fontSize:13,color:V,marginTop:4,fontWeight:500}}>Analyse & discover market opportunities</p>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:7,padding:'8px 16px',borderRadius:12,
          background:'rgba(167,139,250,0.06)',border:'1px solid rgba(167,139,250,0.18)'}}>
          <Activity size={13} style={{color:V}}/>
          <span style={{fontSize:11,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',color:V}}>NSE · BSE Live</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:24}}>
        {tabs.map(t=><TabBtn key={t.key} active={tab===t.key} onClick={()=>setTab(t.key)} icon={t.icon} label={t.label} count={t.count}/>)}
      </div>

      {/* Content */}
      <div key={tab} className="r-tab">
        {tab==='screener'&&<ScreenerTab/>}
        {tab==='heatmap' &&<HeatMapTab/>}
        {tab==='compare' &&<CompareTab/>}
        {tab==='ipo'     &&<IPOTab/>}
      </div>
    </div>
  );
};
export default Research;