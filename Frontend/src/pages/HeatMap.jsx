import CandlestickChart from '../components/CandlestickChart';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Search, Bot, X, TrendingUp, TrendingDown, RefreshCw,
  AlertCircle, CheckCircle, Globe, Sparkles, Activity,
  BarChart2, Zap, ChevronUp, ChevronDown, ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import Chatbot from '../components/Chatbot';
import { API } from '../utils/app';

const T = {
  bg:'#030712', card:'rgba(8,14,26,0.9)', border:'rgba(255,255,255,0.06)',
  cyan:'#22d3ee', green:'#34d399', red:'#fb7185', amber:'#fbbf24', violet:'#a78bfa', indigo:'#818cf8',
};

const DASH_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Syne:wght@700;800&family=Inter:wght@400;500;600;700;800;900&display=swap');
  .dash *{box-sizing:border-box}
  .dash{font-family:'Inter',sans-serif}
  .dash .mono{font-family:'IBM Plex Mono',monospace!important}
  .dash .syne{font-family:'Syne',sans-serif!important}
  @keyframes d-in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes d-card{from{opacity:0;transform:translateY(10px) scale(0.99)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes d-pulse{0%,100%{opacity:1}50%{opacity:0.4}}
  @keyframes d-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes d-slide{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
  @keyframes d-scan{0%{transform:translateY(-100%)}100%{transform:translateY(600%)}}
  @keyframes fab-pulse{0%{box-shadow:0 0 0 0 rgba(34,211,238,0.5)}70%{box-shadow:0 0 0 14px rgba(34,211,238,0)}100%{box-shadow:0 0 0 0 rgba(34,211,238,0)}}
  .dash .page-in{animation:d-in 0.5s cubic-bezier(0.22,1,0.36,1) both}
  .dash .card-in{animation:d-card 0.4s cubic-bezier(0.22,1,0.36,1) both}
  .dash .spin{animation:d-spin 0.8s linear infinite}
  .gcard{background:rgba(8,14,26,0.85);border:1px solid rgba(255,255,255,0.06);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
  .hover-row{transition:background 0.15s ease;cursor:pointer}
  .hover-row:hover{background:rgba(34,211,238,0.04)!important}
  .idx-card{transition:all 0.2s ease}
  .idx-card:hover{transform:translateY(-2px);border-color:rgba(255,255,255,0.12)!important}
  .dash ::-webkit-scrollbar{width:4px;height:4px}
  .dash ::-webkit-scrollbar-track{background:transparent}
  .dash ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:8px}
  .fab-btn{animation:fab-pulse 2.5s ease-out infinite}
  .scan-line{position:absolute;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(34,211,238,0.12),transparent);animation:d-scan 5s ease-in-out infinite;pointer-events:none}
`;

const fmt = n => n?.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});

const Toast=({message,type,onClose})=>{
  useEffect(()=>{const t=setTimeout(onClose,3000);return()=>clearTimeout(t);},[onClose]);
  return(
    <div className="card-in" style={{position:'fixed',top:24,right:24,zIndex:200,display:'flex',alignItems:'center',gap:10,padding:'12px 18px',borderRadius:16,backdropFilter:'blur(20px)',background:type==='success'?'rgba(5,25,15,0.97)':'rgba(25,5,5,0.97)',border:`1px solid ${type==='success'?'rgba(52,211,153,0.4)':'rgba(251,113,133,0.4)'}`,color:type==='success'?T.green:T.red,boxShadow:'0 8px 32px rgba(0,0,0,0.6)'}}>
      {type==='success'?<CheckCircle size={15}/>:<AlertCircle size={15}/>}
      <span style={{fontSize:13,fontWeight:600}}>{message}</span>
      <button onClick={onClose} style={{marginLeft:4,opacity:0.5,background:'none',border:'none',color:'inherit',cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.5}><X size={13}/></button>
    </div>
  );
};

const SectionHead=({icon:Icon,label,color=T.cyan,right})=>(
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <div style={{width:28,height:28,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:`${color}15`,border:`1px solid ${color}25`}}><Icon size={13} style={{color}}/></div>
      <span style={{fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.12em',color:'#94a3b8'}}>{label}</span>
    </div>
    {right}
  </div>
);

const Skel=({w='100%',h=14,r=8})=>(<div style={{width:w,height:h,borderRadius:r,background:'rgba(255,255,255,0.05)',animation:'d-pulse 1.5s ease-in-out infinite'}}/>);

const AIMarketSummary=({marketOverview})=>{
  const [summary,setSummary]=useState('');const [loading,setLoading]=useState(false);const [generated,setGenerated]=useState(false);
  const generate=async()=>{
    setLoading(true);
    try{
      const indicesText=marketOverview?.indices?.map(i=>`${i.name}: ${i.change>=0?'+':''}${i.change?.toFixed(2)}%`).join(', ')||'No data';
      const gainersText=marketOverview?.gainers?.slice(0,3).map(s=>`${s.ticker} +${s.change?.toFixed(2)}%`).join(', ')||'No data';
      const losersText=marketOverview?.losers?.slice(0,3).map(s=>`${s.ticker} ${s.change?.toFixed(2)}%`).join(', ')||'No data';
      const res=await axios.post(`${API}/chat`,{message:`Give me a brief professional market summary based on this real data:\nIndian Indices: ${indicesText}\nTop Gainers: ${gainersText}\nTop Losers: ${losersText}\nWrite 2 short paragraphs. Start with overall sentiment, then key movers. Be specific and professional. No markdown.`,ticker:'NIFTY',user_id:'market_summary'});
      setSummary(res.data.reply||'');setGenerated(true);
    }catch{setSummary('Unable to generate summary. Please check your backend connection.');setGenerated(true);}
    finally{setLoading(false);}
  };
  return(
    <div className="gcard" style={{borderRadius:20,padding:22,position:'relative',overflow:'hidden',borderColor:'rgba(129,140,248,0.15)'}}>
      <div style={{position:'absolute',top:-60,right:-40,width:220,height:220,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.07) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div className="scan-line"/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:36,height:36,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(129,140,248,0.12)',border:'1px solid rgba(129,140,248,0.25)'}}><Sparkles size={16} style={{color:T.indigo}}/></div>
          <div>
            <p className="syne" style={{fontSize:15,fontWeight:800,color:'#f9fafb',letterSpacing:'-0.01em'}}>AI Market Summary</p>
            <p style={{fontSize:10,color:'#475569',marginTop:1}}>Groq LLaMA · Live NSE/BSE Data</p>
          </div>
        </div>
        <button onClick={generate} disabled={loading||!marketOverview}
          style={{display:'flex',alignItems:'center',gap:7,padding:'8px 16px',borderRadius:11,fontSize:12,fontWeight:700,cursor:(loading||!marketOverview)?'not-allowed':'pointer',transition:'all 0.2s',background:'rgba(129,140,248,0.1)',border:'1px solid rgba(129,140,248,0.3)',color:T.indigo,opacity:!marketOverview?0.4:1}}
          onMouseEnter={e=>{if(!loading&&marketOverview){e.currentTarget.style.background=T.indigo;e.currentTarget.style.color='#030712';}}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(129,140,248,0.1)';e.currentTarget.style.color=T.indigo;}}>
          <Sparkles size={12} style={{animation:loading?'d-pulse 1s infinite':'none'}}/>{loading?'Analyzing…':generated?'Regenerate':'Generate'}
        </button>
      </div>
      {!generated&&!loading&&(<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'24px 0',gap:10}}><div style={{width:44,height:44,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(129,140,248,0.08)',border:'1px solid rgba(129,140,248,0.15)'}}><Bot size={20} style={{color:T.indigo,opacity:0.6}}/></div><p style={{fontSize:12,color:'#475569',textAlign:'center',maxWidth:340,lineHeight:1.6}}>Click Generate for an AI briefing based on today's live market data</p></div>)}
      {loading&&(<div style={{display:'flex',flexDirection:'column',gap:10,padding:'8px 0'}}>{[1,0.8,0.6].map((w,i)=><Skel key={i} w={`${w*100}%`} h={12}/>)}<p style={{fontSize:11,color:T.indigo,textAlign:'center',marginTop:4,animation:'d-pulse 1s infinite'}}>Analyzing live market data…</p></div>)}
      {generated&&!loading&&summary&&(<div style={{display:'flex',flexDirection:'column',gap:12}}><div style={{height:1,background:'linear-gradient(90deg,transparent,rgba(129,140,248,0.2),transparent)'}}/><p style={{fontSize:13,color:'#cbd5e1',lineHeight:1.75}}>{summary}</p><div style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:6,height:6,borderRadius:'50%',background:T.green,display:'block',animation:'d-pulse 2s infinite'}}/><p className="mono" style={{fontSize:10,color:'#334155'}}>Generated from live NSE/BSE market data</p></div></div>)}
    </div>
  );
};

const IndexCard=({idx,delay=0})=>{
  const up=idx.change>=0;
  return(
    <div className="gcard idx-card" style={{borderRadius:16,padding:'14px 16px',minWidth:160,flex:'1 1 160px',opacity:0,animation:`d-card 0.4s ease ${delay}ms both`}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <p style={{fontSize:10,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:700}}>{idx.name}</p>
        <span style={{fontSize:10,fontWeight:800,padding:'2px 7px',borderRadius:6,background:up?'rgba(52,211,153,0.1)':'rgba(251,113,133,0.1)',border:`1px solid ${up?'rgba(52,211,153,0.2)':'rgba(251,113,133,0.2)'}`,color:up?T.green:T.red,display:'flex',alignItems:'center',gap:3}}>
          {up?<ChevronUp size={9}/>:<ChevronDown size={9}/>}{Math.abs(idx.change).toFixed(2)}%
        </span>
      </div>
      <p className="mono" style={{fontSize:18,fontWeight:700,color:'#f9fafb',letterSpacing:'-0.02em'}}>{idx.currency||'₹'}{fmt(idx.price)}</p>
    </div>
  );
};

const StatPill=({label,value,sub,subColor,delay=0})=>(
  <div className="gcard" style={{borderRadius:14,padding:'12px 16px',opacity:0,animation:`d-card 0.4s ease ${delay}ms both`}}>
    <p style={{fontSize:9,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.14em',fontWeight:700,marginBottom:5}}>{label}</p>
    <p className="mono" style={{fontSize:15,fontWeight:700,color:'#f9fafb',letterSpacing:'-0.02em',marginBottom:3}}>{value}</p>
    <p style={{fontSize:10,fontWeight:600,color:subColor||'#334155'}}>{sub}</p>
  </div>
);

const MoverRow=({stock,active,onClick,isGainer,delay=0})=>(
  <div className="hover-row" onClick={onClick}
    style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',borderRadius:11,marginBottom:3,opacity:0,animation:`d-slide 0.35s ease ${delay}ms both`,background:active?'rgba(34,211,238,0.05)':'transparent',border:`1px solid ${active?'rgba(34,211,238,0.15)':'transparent'}`,transition:'all 0.15s ease'}}>
    <div style={{display:'flex',alignItems:'center',gap:9}}>
      <div style={{width:7,height:7,borderRadius:'50%',background:active?T.cyan:(isGainer?T.green:T.red),flexShrink:0,boxShadow:active?`0 0 6px ${T.cyan}`:'none'}}/>
      <span style={{fontSize:13,fontWeight:800,color:active?T.cyan:'#e2e8f0'}}>{stock.ticker}</span>
    </div>
    <div style={{textAlign:'right'}}>
      <p className="mono" style={{fontSize:13,fontWeight:700,color:'#f9fafb'}}>₹{fmt(stock.price)}</p>
      <p className="mono" style={{fontSize:11,fontWeight:800,color:isGainer?T.green:T.red}}>{isGainer?'+':''}{stock.change?.toFixed(2)}%</p>
    </div>
  </div>
);

const TechCard=({label,value,sub,color,barPct,delay=0})=>(
  <div className="gcard" style={{borderRadius:14,padding:16,textAlign:'center',opacity:0,animation:`d-card 0.4s ease ${delay}ms both`}}>
    <p style={{fontSize:9,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.14em',fontWeight:700,marginBottom:10}}>{label}</p>
    <p className="mono" style={{fontSize:22,fontWeight:700,color,marginBottom:6}}>{value}</p>
    {barPct!==undefined&&(<div style={{height:3,borderRadius:99,background:'rgba(255,255,255,0.06)',overflow:'hidden',marginBottom:8}}><div style={{height:'100%',borderRadius:99,width:`${barPct}%`,background:color,transition:'width 1s ease'}}/></div>)}
    <p style={{fontSize:10,color:'#475569',fontWeight:600}}>{sub}</p>
  </div>
);

const Dashboard=({user})=>{
  const [ticker,setTicker]=useState('RELIANCE');
  const [stockData,setStockData]=useState(null);
  const [marketOverview,setMarketOverview]=useState(null);
  const [globalIndices,setGlobalIndices]=useState(null);
  const [prediction,setPrediction]=useState(null);
  const [loading,setLoading]=useState(false);
  const [marketLoading,setMarketLoading]=useState(false);
  const [predictLoading,setPredictLoading]=useState(false);
  const [showTradeModal,setShowTradeModal]=useState(false);
  const [tradeAction,setTradeAction]=useState('BUY');
  const [tradeQuantity,setTradeQuantity]=useState('');
  const [showChatbot,setShowChatbot]=useState(false);
  const [toast,setToast]=useState(null);
  const [activeTicker,setActiveTicker]=useState('RELIANCE');
  const [indicesTab,setIndicesTab]=useState('indian');
  const [searchFocus,setSearchFocus]=useState(false);
  const tickerRef=useRef(ticker);tickerRef.current=ticker;
  const showToast=(msg,type='success')=>setToast({message:msg,type});

  const loadMarket=useCallback(async()=>{
    setMarketLoading(true);
    try{const[ov,gl]=await Promise.all([axios.get(`${API}/market/overview`),axios.get(`${API}/market/global-indices`)]);setMarketOverview(ov.data);setGlobalIndices(gl.data);}
    catch{}finally{setMarketLoading(false);}
  },[]);

  const loadStock=useCallback(async t=>{
    const sym=(t||tickerRef.current).trim().toUpperCase();
    setLoading(true);setPrediction(null);
    try{const res=await axios.get(`${API}/stock/${sym}`);setStockData(res.data);setActiveTicker(sym);}
    catch{showToast(`"${sym}" not found`,'error');}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{loadMarket();loadStock('RELIANCE');},[loadMarket,loadStock]);

  const handlePrediction=async()=>{
    setPredictLoading(true);
    try{const res=await axios.get(`${API}/stock/${activeTicker}/predict`);setPrediction(res.data);}
    catch{showToast('AI Forecast failed','error');}
    finally{setPredictLoading(false);}
  };

  const handleTrade=async()=>{
    if(!tradeQuantity||tradeQuantity<=0){showToast('Enter a valid quantity','error');return;}
    try{
      const res=await axios.post(`${API}/trade/execute`,{user_id:user.id,action:tradeAction,ticker:stockData.ticker,quantity:parseFloat(tradeQuantity),price:stockData.price});
      if(res.data.status==='success'){showToast(`${tradeAction} order executed! 🎉`);setShowTradeModal(false);setTradeQuantity('');}
    }catch(e){showToast('Trade failed: '+(e.response?.data?.detail||e.message),'error');}
  };

  const handleTickerClick=t=>{setTicker(t);loadStock(t);};
  const currentIndices=indicesTab==='indian'?marketOverview?.indices:globalIndices;
  const up=(stockData?.change||0)>=0;
  const recColor=rec=>{if(!rec)return T.cyan;if(rec.includes('BUY'))return T.green;if(rec.includes('SELL'))return T.red;return T.amber;};

  return(
    <div className="dash page-in" style={{minHeight:'100vh',paddingBottom:80}}>
      <style>{DASH_CSS}</style>
      {toast&&<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}

      {/* HEADER */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16,marginBottom:28}}>
        <div>
          <h1 className="syne" style={{fontSize:32,fontWeight:800,color:'#f9fafb',letterSpacing:'-0.04em',lineHeight:1,marginBottom:4}}>Market Terminal</h1>
          <p style={{fontSize:13,color:T.cyan,fontWeight:500}}>AI Insights & Execution Engine</p>
        </div>
        <div style={{display:'flex',gap:8,flex:'0 1 420px'}}>
          <div style={{position:'relative',flex:1}}>
            <Search size={14} style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:searchFocus?T.cyan:'#4b5563',transition:'color 0.2s'}}/>
            <input value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} onKeyPress={e=>e.key==='Enter'&&loadStock()} onFocus={()=>setSearchFocus(true)} onBlur={()=>setSearchFocus(false)} placeholder="Search ticker… e.g. TCS"
              style={{width:'100%',paddingLeft:40,paddingRight:14,paddingTop:10,paddingBottom:10,borderRadius:12,background:'rgba(8,14,26,0.9)',border:`1px solid ${searchFocus?'rgba(34,211,238,0.45)':'rgba(255,255,255,0.07)'}`,color:'#f9fafb',fontSize:13,fontFamily:'IBM Plex Mono,monospace',outline:'none',transition:'all 0.2s',boxShadow:searchFocus?'0 0 0 3px rgba(34,211,238,0.07)':'none',caretColor:T.cyan}}/>
          </div>
          <button onClick={()=>loadStock()} disabled={loading}
            style={{padding:'10px 20px',borderRadius:12,fontWeight:900,fontSize:13,letterSpacing:'0.05em',color:'#030712',cursor:'pointer',background:'linear-gradient(135deg,#22d3ee,#3b82f6)',border:'none',boxShadow:'0 0 16px rgba(34,211,238,0.3)',transition:'all 0.2s',opacity:loading?0.6:1}}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 0 28px rgba(34,211,238,0.55)';e.currentTarget.style.filter='brightness(1.1)';}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 0 16px rgba(34,211,238,0.3)';e.currentTarget.style.filter='brightness(1)';}}>
            {loading?'…':'SEARCH'}
          </button>
        </div>
      </div>

      {/* AI SUMMARY */}
      <div style={{marginBottom:24}}><AIMarketSummary marketOverview={marketOverview}/></div>

      {/* INDICES */}
      <div style={{marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
          {[['indian','🇮🇳 Indian'],['global','🌐 Global']].map(([key,label])=>(
            <button key={key} onClick={()=>setIndicesTab(key)} style={{fontSize:11,fontWeight:800,padding:'6px 14px',borderRadius:9,cursor:'pointer',transition:'all 0.15s',border:'none',background:indicesTab===key?'linear-gradient(135deg,#22d3ee,#3b82f6)':'rgba(255,255,255,0.04)',color:indicesTab===key?'#030712':'#64748b'}}>{label}</button>
          ))}
          <button onClick={loadMarket} style={{marginLeft:'auto',padding:7,borderRadius:9,background:'rgba(255,255,255,0.03)',border:`1px solid ${T.border}`,color:'#4b5563',cursor:'pointer',transition:'color 0.2s'}} onMouseEnter={e=>e.currentTarget.style.color=T.cyan} onMouseLeave={e=>e.currentTarget.style.color='#4b5563'}>
            <RefreshCw size={13} className={marketLoading?'spin':''}/>
          </button>
        </div>
        <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:4}}>
          {marketLoading?[1,2,3,4].map(i=>(<div key={i} className="gcard" style={{borderRadius:16,padding:'14px 16px',minWidth:160,flex:'1 1 160px'}}><Skel w="60%" h={10}/><div style={{height:8}}/><Skel w="80%" h={18}/></div>)):currentIndices?.map((idx,i)=><IndexCard key={i} idx={idx} delay={i*60}/>)}
        </div>
      </div>

      {/* MAIN GRID */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:20}}>

        {/* LEFT */}
        <div style={{display:'flex',flexDirection:'column',gap:20}}>

          {/* Stock header */}
          {stockData&&!loading&&(
            <div className="gcard card-in" style={{borderRadius:20,padding:20,position:'relative',overflow:'hidden',borderColor:up?'rgba(52,211,153,0.15)':'rgba(251,113,133,0.15)'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${up?T.green:T.red},transparent)`}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                <div style={{display:'flex',alignItems:'center',gap:14}}>
                  <div style={{width:48,height:48,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,rgba(34,211,238,0.15),rgba(59,130,246,0.08))',border:'1px solid rgba(34,211,238,0.2)',fontSize:14,fontWeight:900,color:T.cyan,fontFamily:'IBM Plex Mono,monospace'}}>{stockData.ticker?.slice(0,2)}</div>
                  <div>
                    <h2 className="syne" style={{fontSize:20,fontWeight:800,color:'#f9fafb',letterSpacing:'-0.02em',marginBottom:2}}>{stockData.name||stockData.ticker}</h2>
                    <p className="mono" style={{fontSize:11,color:'#4b5563'}}>{stockData.ticker} · NSE</p>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{textAlign:'right',marginRight:4}}>
                    <p className="mono" style={{fontSize:26,fontWeight:700,color:'#f9fafb',letterSpacing:'-0.04em',lineHeight:1}}>₹{fmt(stockData.price)}</p>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:4,marginTop:4}}>
                      {up?<ArrowUpRight size={14} style={{color:T.green}}/>:<ArrowDownRight size={14} style={{color:T.red}}/>}
                      <span className="mono" style={{fontSize:13,fontWeight:800,color:up?T.green:T.red}}>{up?'+':''}{stockData.change?.toFixed(2)}%</span>
                    </div>
                  </div>
                  <button onClick={()=>{setTradeAction('BUY');setShowTradeModal(true);}} style={{padding:'10px 20px',borderRadius:12,fontWeight:900,fontSize:13,letterSpacing:'0.05em',border:'none',cursor:'pointer',color:'#fff',background:'linear-gradient(135deg,#15803d,#16a34a)',boxShadow:'0 0 16px rgba(22,163,74,0.35)',transition:'all 0.2s'}} onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.1)'} onMouseLeave={e=>e.currentTarget.style.filter='brightness(1)'}>▲ BUY</button>
                  <button onClick={()=>{setTradeAction('SELL');setShowTradeModal(true);}} style={{padding:'10px 20px',borderRadius:12,fontWeight:900,fontSize:13,letterSpacing:'0.05em',border:'none',cursor:'pointer',color:'#fff',background:'linear-gradient(135deg,#b91c1c,#dc2626)',boxShadow:'0 0 16px rgba(220,38,38,0.35)',transition:'all 0.2s'}} onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.1)'} onMouseLeave={e=>e.currentTarget.style.filter='brightness(1)'}>▼ SELL</button>
                </div>
              </div>
            </div>
          )}

          {/* Stat pills */}
          {loading?(<div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10}}>{[1,2,3,4,5,6].map(i=>(<div key={i} className="gcard" style={{borderRadius:14,padding:'12px 16px'}}><Skel w="50%" h={9}/><div style={{height:8}}/><Skel h={15}/><div style={{height:6}}/><Skel w="60%" h={9}/></div>))}</div>)
          :stockData&&(
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10}}>
              <StatPill label="Price"    value={`₹${fmt(stockData.price)}`}                                                                               sub={`${stockData.change>=0?'+':''}${stockData.change?.toFixed(2)}%`} subColor={stockData.change>=0?T.green:T.red} delay={0}/>
              <StatPill label="Mkt Cap"  value={`₹${(stockData.market_cap/10000000).toLocaleString('en-IN',{maximumFractionDigits:0})}Cr`}               sub="Market Cap"       delay={50}/>
              <StatPill label="Volume"   value={`${(stockData.volume/1000000).toFixed(2)}M`}                                                              sub="Shares Traded"    delay={100}/>
              <StatPill label="P/E"      value={stockData.pe_ratio?stockData.pe_ratio.toFixed(2):'N/A'}                                                   sub="Trailing P/E"     delay={150}/>
              <StatPill label="52W High" value={stockData.week_52_high?`₹${fmt(stockData.week_52_high)}`:'N/A'}                                           sub={stockData.week_52_high?`${(((stockData.price-stockData.week_52_high)/stockData.week_52_high)*100).toFixed(1)}% from high`:''} subColor={T.red}   delay={200}/>
              <StatPill label="52W Low"  value={stockData.week_52_low?`₹${fmt(stockData.week_52_low)}`:'N/A'}                                             sub={stockData.week_52_low?`+${(((stockData.price-stockData.week_52_low)/stockData.week_52_low)*100).toFixed(1)}% from low`:''} subColor={T.green} delay={250}/>
            </div>
          )}

          {/* Chart */}
          <div className="gcard" style={{borderRadius:20,padding:20,position:'relative',overflow:'hidden'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${T.border}`}}>
              <div>
                <p className="syne" style={{fontSize:16,fontWeight:800,color:'#f9fafb'}}>{stockData?.ticker||'Chart'}</p>
                <p style={{fontSize:10,color:'#334155',marginTop:2}}>1 Year · Candlestick</p>
              </div>
              <button onClick={handlePrediction} disabled={predictLoading||!stockData}
                style={{display:'flex',alignItems:'center',gap:7,padding:'8px 16px',borderRadius:11,fontSize:12,fontWeight:700,cursor:(!stockData||predictLoading)?'not-allowed':'pointer',transition:'all 0.2s',background:'rgba(129,140,248,0.08)',border:'1px solid rgba(129,140,248,0.25)',color:T.indigo,opacity:!stockData?0.4:1}}
                onMouseEnter={e=>{if(stockData&&!predictLoading){e.currentTarget.style.background=T.indigo;e.currentTarget.style.color='#030712';}}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(129,140,248,0.08)';e.currentTarget.style.color=T.indigo;}}>
                <Bot size={13} style={{animation:predictLoading?'d-pulse 0.8s infinite':'none'}}/>{predictLoading?'Analyzing…':'AI Forecast'}
              </button>
            </div>
            {loading?(<div style={{height:340,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}><div className="spin" style={{width:32,height:32,borderRadius:'50%',border:'2px solid rgba(34,211,238,0.15)',borderTopColor:T.cyan}}/><p style={{fontSize:12,color:'#4b5563',animation:'d-pulse 1.5s infinite'}}>Fetching market data…</p></div>)
            :stockData?(<div style={{height:340,width:'100%'}}><CandlestickChart chartData={stockData.chart_data}/></div>)
            :(<div style={{height:340,display:'flex',alignItems:'center',justifyContent:'center'}}><p style={{fontSize:13,color:'#334155'}}>Search for a ticker to view charts</p></div>)}
            {prediction&&!prediction.error&&(
              <div style={{marginTop:20,padding:18,borderRadius:14,background:`${recColor(prediction.recommendation)}08`,border:`1px solid ${recColor(prediction.recommendation)}25`,animation:'d-card 0.4s ease both'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                  <Bot size={15} style={{color:recColor(prediction.recommendation)}}/>
                  <span style={{fontSize:13,fontWeight:700,color:'#f9fafb'}}>EquiDash AI Analysis</span>
                  <span style={{marginLeft:'auto',fontSize:11,fontWeight:900,padding:'3px 10px',borderRadius:99,background:`${recColor(prediction.recommendation)}18`,border:`1px solid ${recColor(prediction.recommendation)}35`,color:recColor(prediction.recommendation)}}>{prediction.recommendation}</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:14}}>
                  {[{l:'7D Target',v:`₹${fmt(prediction.prediction_7d)}`},{l:'30D Target',v:`₹${fmt(prediction.prediction_30d)}`},{l:'Confidence',v:`${prediction.confidence?.toFixed(0)}%`}].map(({l,v})=>(
                    <div key={l} style={{padding:12,borderRadius:10,background:'rgba(0,0,0,0.25)',textAlign:'center'}}><p style={{fontSize:9,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:700,marginBottom:5}}>{l}</p><p className="mono" style={{fontSize:14,fontWeight:700,color:'#f9fafb'}}>{v}</p></div>
                  ))}
                </div>
                <p style={{fontSize:13,color:'#cbd5e1',lineHeight:1.7}}>{prediction.reasoning}</p>
              </div>
            )}
          </div>

          {/* Technical indicators */}
          {stockData?.indicators&&(
            <div>
              <SectionHead icon={Activity} label="Technical Indicators" color={T.violet}/>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                <TechCard label="RSI (14)" value={stockData.indicators.rsi?.toFixed(2)} color={stockData.indicators.rsi>70?T.red:stockData.indicators.rsi<30?T.green:'#f9fafb'} sub={stockData.indicators.rsi>70?'Overbought':stockData.indicators.rsi<30?'Oversold':'Neutral'} barPct={Math.min(100,stockData.indicators.rsi)} delay={0}/>
                <TechCard label="MACD" value={`${stockData.indicators.macd>0?'+':''}${stockData.indicators.macd?.toFixed(2)}`} color={stockData.indicators.macd>0?T.green:T.red} sub={stockData.indicators.macd>0?'Bullish signal':'Bearish signal'} delay={80}/>
                <TechCard label="SMA 20" value={`₹${fmt(stockData.indicators.sma_20)}`} color="#f9fafb" sub={stockData.price>stockData.indicators.sma_20?'Price above SMA ↑':'Price below SMA ↓'} delay={160}/>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {marketOverview&&(()=>{
            const all=[...(marketOverview.gainers||[]),...(marketOverview.losers||[])];
            const bull=all.filter(s=>s.change>0).length;
            const pct=all.length>0?Math.round((bull/all.length)*100):50;
            const isBull=pct>=50;
            return(
              <div className="gcard card-in" style={{borderRadius:18,padding:18}}>
                <SectionHead icon={Zap} label="Market Sentiment" color={isBull?T.green:T.red}/>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                  <span className="mono" style={{fontSize:12,fontWeight:800,color:T.green}}>Bullish {pct}%</span>
                  <span className="mono" style={{fontSize:12,fontWeight:800,color:T.red}}>Bearish {100-pct}%</span>
                </div>
                <div style={{height:6,borderRadius:99,background:'rgba(251,113,133,0.2)',overflow:'hidden',marginBottom:10}}>
                  <div style={{height:'100%',borderRadius:99,width:`${pct}%`,background:`linear-gradient(90deg,${T.green},${T.cyan})`,transition:'width 1s ease'}}/>
                </div>
                <p style={{fontSize:12,fontWeight:700,color:isBull?T.green:T.red}}>{isBull?'📈 Bullish today':'📉 Bearish today'}</p>
              </div>
            );
          })()}

          {marketOverview&&(
            <div className="gcard card-in" style={{borderRadius:18,padding:18}}>
              <SectionHead icon={TrendingUp} label="Top Movers" color={T.green}/>
              {marketOverview.gainers.map((s,i)=>(<MoverRow key={s.ticker} stock={s} active={activeTicker===s.ticker} onClick={()=>handleTickerClick(s.ticker)} isGainer={true} delay={i*50}/>))}
            </div>
          )}

          {marketOverview&&(
            <div className="gcard card-in" style={{borderRadius:18,padding:18}}>
              <SectionHead icon={TrendingDown} label="Highest Drawdowns" color={T.red}/>
              {marketOverview.losers.map((s,i)=>(<MoverRow key={s.ticker} stock={s} active={activeTicker===s.ticker} onClick={()=>handleTickerClick(s.ticker)} isGainer={false} delay={i*50}/>))}
            </div>
          )}

          {stockData&&!loading&&(
            <div className="gcard card-in" style={{borderRadius:18,padding:18}}>
              <SectionHead icon={BarChart2} label="Quick Stats" color={T.cyan}/>
              {[{l:'Market Cap',v:`₹${(stockData.market_cap/10000000).toFixed(0)}Cr`},{l:'Volume',v:`${(stockData.volume/1000000).toFixed(2)}M shares`},{l:'P/E Ratio',v:stockData.pe_ratio?.toFixed(2)||'N/A'},{l:'52W High',v:`₹${fmt(stockData.week_52_high)}`},{l:'52W Low',v:`₹${fmt(stockData.week_52_low)}`}].map(({l,v},i)=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<4?'1px solid rgba(255,255,255,0.04)':'none',opacity:0,animation:`d-slide 0.3s ease ${i*60}ms both`}}>
                  <span style={{fontSize:11,color:'#4b5563'}}>{l}</span>
                  <span className="mono" style={{fontSize:12,fontWeight:700,color:'#f9fafb'}}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TRADE MODAL */}
      {showTradeModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div className="gcard card-in" style={{borderRadius:24,padding:28,width:380,position:'relative',overflow:'hidden',border:`1px solid ${tradeAction==='BUY'?'rgba(52,211,153,0.25)':'rgba(251,113,133,0.25)'}`}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:tradeAction==='BUY'?'linear-gradient(90deg,#15803d,#22d3ee)':'linear-gradient(90deg,#b91c1c,#f97316)'}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <p className="syne" style={{fontSize:18,fontWeight:800,color:'#f9fafb'}}>Execute {tradeAction}</p>
              <button onClick={()=>setShowTradeModal(false)} style={{padding:6,borderRadius:8,background:'rgba(255,255,255,0.04)',border:`1px solid ${T.border}`,color:'#4b5563',cursor:'pointer',transition:'all 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.color='#f9fafb';e.currentTarget.style.transform='rotate(90deg)';}} onMouseLeave={e=>{e.currentTarget.style.color='#4b5563';e.currentTarget.style.transform='rotate(0deg)';}}>
                <X size={16}/>
              </button>
            </div>
            <div style={{padding:16,borderRadius:14,background:'rgba(255,255,255,0.02)',border:`1px solid ${T.border}`,marginBottom:20}}>
              <p className="mono" style={{fontSize:16,fontWeight:700,color:T.cyan,marginBottom:2}}>{stockData?.ticker}</p>
              {stockData?.name&&<p style={{fontSize:11,color:'#4b5563',marginBottom:6}}>{stockData.name}</p>}
              <p className="mono" style={{fontSize:20,fontWeight:700,color:'#f9fafb'}}>₹{fmt(stockData?.price)}</p>
            </div>
            <label style={{fontSize:10,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:700,display:'block',marginBottom:8}}>Quantity</label>
            <input type="number" value={tradeQuantity} onChange={e=>setTradeQuantity(e.target.value)} placeholder="0" min="1"
              style={{width:'100%',padding:'12px 16px',borderRadius:12,background:'rgba(8,14,26,0.9)',border:`1px solid ${T.border}`,color:'#f9fafb',fontSize:18,fontFamily:'IBM Plex Mono,monospace',fontWeight:700,textAlign:'center',outline:'none',transition:'border-color 0.2s',marginBottom:16}}
              onFocus={e=>e.target.style.borderColor=tradeAction==='BUY'?'rgba(52,211,153,0.5)':'rgba(251,113,133,0.5)'}
              onBlur={e=>e.target.style.borderColor=T.border}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',borderRadius:11,background:`${tradeAction==='BUY'?T.green:T.red}08`,border:`1px solid ${tradeAction==='BUY'?T.green:T.red}20`,marginBottom:18}}>
              <span style={{fontSize:12,color:'#4b5563'}}>Total Value</span>
              <span className="mono" style={{fontSize:16,fontWeight:800,color:tradeAction==='BUY'?T.green:T.red}}>₹{fmt((stockData?.price*parseFloat(tradeQuantity||0))||0)}</span>
            </div>
            <button onClick={handleTrade} style={{width:'100%',padding:'14px 0',borderRadius:14,fontWeight:900,fontSize:15,letterSpacing:'0.06em',border:'none',color:'#fff',cursor:'pointer',background:tradeAction==='BUY'?'linear-gradient(135deg,#15803d,#16a34a)':'linear-gradient(135deg,#b91c1c,#dc2626)',boxShadow:tradeAction==='BUY'?'0 0 24px rgba(22,163,74,0.4)':'0 0 24px rgba(220,38,38,0.4)',transition:'all 0.2s'}} onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.1)'} onMouseLeave={e=>e.currentTarget.style.filter='brightness(1)'}>
              CONFIRM {tradeAction}
            </button>
          </div>
        </div>
      )}

      {/* CHATBOT FAB */}
      <button onClick={()=>setShowChatbot(!showChatbot)} className="fab-btn"
        style={{position:'fixed',bottom:32,right:32,width:56,height:56,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',border:'none',cursor:'pointer',background:'linear-gradient(135deg,#22d3ee,#3b82f6)',color:'#fff',transition:'transform 0.3s ease',zIndex:50}}
        onMouseEnter={e=>e.currentTarget.style.transform='scale(1.12)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
        <Bot size={24}/>
      </button>
      {showChatbot&&<Chatbot user={user} onClose={()=>setShowChatbot(false)}/>}
    </div>
  );
};
export default Dashboard;