import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Briefcase, History, Star, TrendingUp, TrendingDown,
  DollarSign, BarChart2, ArrowUpRight, ArrowDownRight, Zap, Shield,
  Activity, Search, Plus, Trash2, RefreshCw, X, Home, Bell, Bot,
  Target, ChevronUp, ChevronDown } from 'lucide-react';
import { API } from '../utils/app';
import useLivePrices from '../utils/useLivePrices';
import usePushAlerts from '../utils/usePushAlerts';

const C = { bg:'#030712', card:'rgba(10,16,30,0.85)', border:'rgba(255,255,255,0.07)', cyan:'#22d3ee', green:'#34d399', red:'#fb7185', amber:'#fbbf24', violet:'#a78bfa' };
const card = { background:C.card, border:`1px solid ${C.border}`, backdropFilter:'blur(20px)' };
const fmt = n => (n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Syne:wght@700;800&family=Inter:wght@400;500;600;700;800;900&display=swap');
  .tpage *{box-sizing:border-box;}
  .tpage{font-family:'Inter',sans-serif;color:#e2e8f0;background:#030712;}
  .tpage .mono{font-family:'IBM Plex Mono',monospace!important;}
  .tpage .syne{font-family:'Syne',sans-serif!important;letter-spacing:-0.03em;}
  .tpage::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
    background-image:linear-gradient(rgba(34,211,238,0.02) 1px,transparent 1px),
                     linear-gradient(90deg,rgba(34,211,238,0.02) 1px,transparent 1px);
    background-size:52px 52px;
    mask-image:radial-gradient(ellipse 100% 60% at 50% 0%,black 20%,transparent 100%);}
  .tpage::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
    background:radial-gradient(ellipse 60% 50% at 0% 0%,rgba(34,211,238,0.06) 0%,transparent 60%),
               radial-gradient(ellipse 50% 60% at 100% 100%,rgba(99,102,241,0.05) 0%,transparent 60%);
    animation:mesh-breathe 10s ease-in-out infinite alternate;}
  @keyframes mesh-breathe{0%{opacity:0.7}100%{opacity:1}}
  .card3d{background:rgba(9,15,28,0.86);border:1px solid rgba(255,255,255,0.07);
    backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:18px;
    transform-style:preserve-3d;
    transition:transform 0.26s cubic-bezier(0.22,1,0.36,1),box-shadow 0.26s ease,border-color 0.26s ease;
    will-change:transform;position:relative;}
  .card3d:hover{border-color:rgba(34,211,238,0.18);
    box-shadow:0 22px 56px rgba(0,0,0,0.5),0 0 28px rgba(34,211,238,0.07);}
  .tbtn3{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:12px;
    font-size:12px;font-weight:800;cursor:pointer;border:none;position:relative;
    transition:all 0.2s cubic-bezier(0.34,1.2,0.64,1);white-space:nowrap;flex-shrink:0;}
  .tbtn3:hover:not(.tbtn3-on){transform:translateY(-2px);background:rgba(255,255,255,0.06)!important;}
  .tbtn3-on{transform:translateY(-1px);}
  .tbtn3-on::after{content:'';position:absolute;bottom:-3px;left:50%;transform:translateX(-50%);
    height:3px;width:60%;border-radius:99px;background:currentColor;box-shadow:0 0 12px currentColor;}
  .hrow3{transition:all 0.14s;cursor:pointer;border-radius:11px;border:1px solid transparent;}
  .hrow3:hover{background:rgba(34,211,238,0.05)!important;border-color:rgba(34,211,238,0.1)!important;transform:translateX(3px);}
  .scan3{position:absolute;left:0;right:0;height:1px;
    background:linear-gradient(90deg,transparent,rgba(34,211,238,0.22),transparent);
    animation:scan3-move 5s ease-in-out infinite;pointer-events:none;z-index:2;}
  @keyframes scan3-move{0%{top:-1px}100%{top:calc(100% + 1px)}}
  @keyframes tscroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
  .t-outer{overflow:hidden;flex:1;min-width:0;}
  .t-inner{display:flex;width:max-content;align-items:center;animation:tscroll 38s linear infinite;}
  .t-inner:hover{animation-play-state:paused;}
  .t-item{display:flex;align-items:center;gap:6px;padding:0 22px;white-space:nowrap;font-size:12px;border-right:1px solid rgba(255,255,255,0.04);}
  @keyframes page-in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes tab-in{from{opacity:0;transform:translateY(10px) scale(0.99)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes t3-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes t3-px{0%,100%{opacity:1}50%{opacity:0.35}}
  @keyframes t3-rot{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  @keyframes t3-glow{0%,100%{box-shadow:0 0 14px rgba(34,211,238,0.15)}50%{box-shadow:0 0 28px rgba(34,211,238,0.4)}}
  .page-in{animation:page-in 0.5s cubic-bezier(0.22,1,0.36,1) both;}
  .tab-panel{animation:tab-in 0.3s cubic-bezier(0.34,1.2,0.64,1) both;}
  .t3-up{animation:t3-up 0.4s cubic-bezier(0.22,1,0.36,1) both;}
  .t3-px{animation:t3-px 1.5s ease-in-out infinite;}
  .spin{animation:t3-rot 0.75s linear infinite;}
  .glow-live{animation:t3-glow 2.5s ease-in-out infinite;}
  .tpage ::-webkit-scrollbar{width:4px;height:4px;}
  .tpage ::-webkit-scrollbar-track{background:transparent;}
  .tpage ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.09);border-radius:8px;}
  input[type=number].qty-inp::-webkit-outer-spin-button,
  input[type=number].qty-inp::-webkit-inner-spin-button{-webkit-appearance:none;}
  input[type=number].qty-inp{-moz-appearance:textfield;}

  /* ── Responsive ── */
  @media(max-width:1024px){
    .tpage [data-layout="stats3"]{grid-template-columns:repeat(2,1fr)!important;}
  }
  @media(max-width:768px){
    .tpage{padding:16px 12px!important;}
    .tpage [data-layout="stats3"]{grid-template-columns:1fr!important;}
    .tpage [data-layout="tabs"]{overflow-x:auto;flex-wrap:nowrap!important;padding-bottom:4px;}
    .tpage [data-layout="tabs"]::-webkit-scrollbar{height:2px;}
    .tbtn3{white-space:nowrap;padding:8px 14px!important;}
  }
`;


/* ─── Counter ─── */
const AnimCounter = ({value,prefix='',duration=900}) => {
  const [d,setD]=useState(0); const raf=useRef(null);
  useEffect(()=>{
    const s=performance.now(),from=d;
    const tick=now=>{const t=Math.min(1,(now-s)/duration);setD(from+(value-from)*(1-Math.pow(1-t,4)));if(t<1)raf.current=requestAnimationFrame(tick);};
    raf.current=requestAnimationFrame(tick); return()=>cancelAnimationFrame(raf.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[value]);
  return <span className="mono">{prefix}{d.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>;
};

/* ─── Toast ─── */
const Toast=({message,type,onClose})=>{
  useEffect(()=>{const t=setTimeout(onClose,3500);return()=>clearTimeout(t);},[onClose]);
  return(
    <div className="tab-panel" style={{position:'fixed',top:20,right:20,zIndex:200,display:'flex',alignItems:'center',gap:10,padding:'12px 18px',borderRadius:16,backdropFilter:'blur(20px)',background:type==='success'?'rgba(5,25,15,0.97)':'rgba(25,5,5,0.97)',border:`1px solid ${type==='success'?'rgba(52,211,153,0.4)':'rgba(251,113,133,0.4)'}`,color:type==='success'?C.green:C.red,boxShadow:'0 8px 32px rgba(0,0,0,0.6)'}}>
      {type==='success'?<CheckCircle size={15}/>:<AlertCircle size={15}/>}
      <span style={{fontSize:13,fontWeight:600}}>{message}</span>
      <button onClick={onClose} style={{opacity:0.5,marginLeft:4,background:'none',border:'none',color:'inherit',cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.5}><X size={13}/></button>
    </div>
  );
};

/* ─── FIX 1: Ticker ─── */
const TickerStrip=()=>{
  const trackRef=useRef(null);
  const items=[
    {s:'NIFTY 50',v:'22,411',c:'+0.63%',up:true},{s:'SENSEX',v:'73,847',c:'+0.58%',up:true},
    {s:'BANK NIFTY',v:'47,612',c:'-0.22%',up:false},{s:'RELIANCE',v:'₹2,934',c:'+1.24%',up:true},
    {s:'TCS',v:'₹3,821',c:'-0.45%',up:false},{s:'INFY',v:'₹1,567',c:'+2.11%',up:true},
    {s:'HDFC BANK',v:'₹1,723',c:'+0.87%',up:true},{s:'ITC',v:'₹464',c:'+0.32%',up:true},
    {s:'SBIN',v:'₹812',c:'-0.15%',up:false},{s:'WIPRO',v:'₹541',c:'+1.05%',up:true},
    {s:'ADANIENT',v:'₹2,401',c:'+0.94%',up:true},{s:'BAJFINANCE',v:'₹6,821',c:'-0.38%',up:false},
  ];
  const doubled=[...items,...items];

  /* Inject keyframe into document head — bypasses CSS class conflicts entirely */
  useEffect(()=>{
    const id='ticker-kf';
    if(!document.getElementById(id)){
      const s=document.createElement('style');
      s.id=id;
      s.textContent='@keyframes __ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}';
      document.head.appendChild(s);
    }
    if(trackRef.current){
      trackRef.current.style.cssText=[
        'display:flex',
        'flex-direction:row',
        'flex-wrap:nowrap',
        'width:max-content',
        'align-items:center',
        'animation:__ticker 38s linear infinite',
        'will-change:transform',
      ].join(';');
    }
  },[]);

  const itemStyle={
    display:'inline-flex',alignItems:'center',gap:6,
    paddingLeft:20,paddingRight:20,
    whiteSpace:'nowrap',flexShrink:0,
    borderRight:'1px solid rgba(255,255,255,0.05)',
    height:36,
  };

  return(
    <div style={{
      background:'rgba(6,12,24,0.9)',
      border:`1px solid ${C.border}`,
      borderRadius:14,
      height:36,
      display:'flex',
      flexDirection:'row',
      alignItems:'stretch',
      overflow:'hidden',
    }}>
      {/* LIVE badge — absolutely never wraps */}
      <div style={{
        flexShrink:0,
        width:70,
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        gap:6,
        borderRight:`1px solid ${C.border}`,
      }}>
        <span style={{width:6,height:6,borderRadius:'50%',background:C.green,flexShrink:0,boxShadow:`0 0 5px ${C.green}`}}/>
        <span style={{fontSize:10,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase',color:C.green,whiteSpace:'nowrap'}}>Live</span>
      </div>
      {/* Scroll container — clips the track */}
      <div style={{
        flex:1,
        minWidth:0,
        overflow:'hidden',
        maskImage:'linear-gradient(90deg,transparent,black 2%,black 98%,transparent)',
        WebkitMaskImage:'linear-gradient(90deg,transparent,black 2%,black 98%,transparent)',
      }}>
        <div ref={trackRef}>
          {doubled.map((item,i)=>(
            <span key={i} style={itemStyle}>
              <span style={{fontSize:11,color:'#6b7280',fontWeight:500,whiteSpace:'nowrap'}}>{item.s}</span>
              <span style={{fontSize:11,fontWeight:700,color:'#f9fafb',fontFamily:"'IBM Plex Mono',monospace",whiteSpace:'nowrap'}}>{item.v}</span>
              <span style={{fontSize:11,fontWeight:800,color:item.up?C.green:C.red,fontFamily:"'IBM Plex Mono',monospace",whiteSpace:'nowrap'}}>{item.up?'▲':'▼'} {item.c}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── FIX 2+4: Tab button ─── */
const TabBtn=({active,onClick,icon:Icon,label,accent})=>{
  const ref=useRef(null);
  const mm=e=>{const el=ref.current;if(!el||active)return;
    const{left,top,width,height}=el.getBoundingClientRect();
    const x=(e.clientX-left)/width-0.5,y=(e.clientY-top)/height-0.5;
    el.style.transform=`perspective(400px) rotateY(${x*14}deg) rotateX(${-y*14}deg) translateY(-2px)`;};
  const ml=()=>{const el=ref.current;if(!el||active)return;el.style.transform='';};
  return(
    <button ref={ref} onClick={onClick} onMouseMove={mm} onMouseLeave={ml}
      className={active?'tbtn3 tbtn3-on':'tbtn3'}
      style={{background:active?`${accent}14`:'rgba(255,255,255,0.03)',
        border:`1px solid ${active?accent+'32':'rgba(255,255,255,0.07)'}`,
        color:active?accent:'#4b5563',
        boxShadow:active?`0 0 20px ${accent}22,inset 0 1px 0 ${accent}14`:'none',
        transformStyle:'preserve-3d'}}>
      <Icon size={13}/>{label}
    </button>
  );
};

const StatCard=({label,value,color,icon:Icon,sublabel,delay=0})=>{
  const ref=useRef(null);
  const mm=e=>{const el=ref.current;if(!el)return;
    const{left,top,width,height}=el.getBoundingClientRect();
    const x=(e.clientX-left)/width-0.5,y=(e.clientY-top)/height-0.5;
    el.style.transform=`perspective(500px) rotateY(${x*12}deg) rotateX(${-y*12}deg) translateZ(8px)`;
    el.style.boxShadow=`${-x*16}px ${-y*16}px 36px rgba(0,0,0,0.5),0 0 0 1px ${color}20`;};
  const ml=()=>{const el=ref.current;if(!el)return;el.style.transform='';el.style.boxShadow='';};
  return(
    <div ref={ref} onMouseMove={mm} onMouseLeave={ml} className="card3d"
      style={{padding:16,display:'flex',alignItems:'center',gap:12,
        animation:`t3-up 0.45s ease ${delay}ms both`,overflow:'hidden'}}>
      <div style={{position:'absolute',top:-20,right:-20,width:80,height:80,borderRadius:'50%',
        background:`radial-gradient(circle,${color}18 0%,transparent 70%)`,pointerEvents:'none'}}/>
      <div style={{width:42,height:42,borderRadius:13,display:'flex',alignItems:'center',justifyContent:'center',
        flexShrink:0,background:`${color}15`,border:`1px solid ${color}28`,boxShadow:`0 0 14px ${color}22`,zIndex:1}}>
        <Icon size={17} style={{color}}/>
      </div>
      <div style={{flex:1,minWidth:0,zIndex:1}}>
        <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.15em',fontWeight:800,color:'#4b5563',marginBottom:4}}>{label}</p>
        <p className="mono" style={{fontSize:16,fontWeight:700,color,letterSpacing:'-0.02em',lineHeight:1}}>{value}</p>
        {sublabel&&<p style={{fontSize:10,color:'#1f2d40',marginTop:3}}>{sublabel}</p>}
      </div>
    </div>
  );
};

const ExecuteTab=({user,onTrade})=>{
  const [ticker,setTicker]=useState('RELIANCE');
  const [stockData,setStockData]=useState(null);
  const [loading,setLoading]=useState(false);
  const [action,setAction]=useState('BUY');
  const [qty,setQty]=useState('');
  const [executing,setExecuting]=useState(false);
  const [toast,setToast]=useState(null);

  const loadStock=async t=>{
    const sym=(t||ticker).trim().toUpperCase(); if(!sym)return;
    setLoading(true); setStockData(null);
    try{const r=await fetch(`${API}/stock/${sym}`);const d=await r.json();if(d.price)setStockData(d);else setToast({message:`"${sym}" not found on NSE`,type:'error'});}
    catch{setToast({message:'Backend connection failed',type:'error'});}
    finally{setLoading(false);}
  };

  const executeTrade=async()=>{
    if(!qty||parseFloat(qty)<=0){setToast({message:'Enter a valid quantity',type:'error'});return;}
    if(!stockData){setToast({message:'Search a stock first',type:'error'});return;}
    setExecuting(true);
    try{
      const r=await fetch(`${API}/trade/execute`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:user.id,action,ticker:stockData.ticker,quantity:parseFloat(qty),price:stockData.price})});
      const d=await r.json();
      if(d.status==='success'){setToast({message:`✅ ${action} ${qty} × ${stockData.ticker} @ ₹${fmt(stockData.price)}`,type:'success'});setQty('');if(onTrade)onTrade();}
      else setToast({message:d.detail||'Trade failed',type:'error'});
    }catch{setToast({message:'Trade execution failed',type:'error'});}
    finally{setExecuting(false);}
  };

  const total=(stockData?.price||0)*parseFloat(qty||0);
  const up=(stockData?.change||0)>=0;
  const isBuy=action==='BUY';
  const canAfford=action==='SELL'||total<=(user?.balance||0);
  const quickTickers=['RELIANCE','TCS','INFY','HDFCBANK','SBIN','WIPRO','ITC','ADANIENT'];

  return(
    <div style={{display:'grid',gridTemplateColumns:'1fr 370px',gap:20,alignItems:'start'}}>
      {toast&&<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}

      {/* LEFT */}
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {/* Search */}
        <div style={{display:'flex',gap:8}}>
          <div style={{position:'relative',flex:1}}>
            <Search size={14} style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'#4b5563'}}/>
            <input value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&loadStock()}
              placeholder="Search NSE ticker… e.g. TCS"
              style={{width:'100%',paddingLeft:38,paddingRight:14,paddingTop:10,paddingBottom:10,borderRadius:12,...card,color:'#f9fafb',fontSize:13,fontFamily:"'IBM Plex Mono',monospace",caretColor:C.cyan,outline:'none',transition:'border-color .2s,box-shadow .2s'}}
              onFocus={e=>{e.target.style.borderColor='rgba(34,211,238,0.45)';e.target.style.boxShadow='0 0 0 3px rgba(34,211,238,0.07)';}}
              onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}}/>
          </div>
          <button onClick={()=>loadStock()} disabled={loading}
            style={{padding:'10px 22px',borderRadius:12,fontWeight:900,fontSize:13,color:'#030712',cursor:'pointer',background:'linear-gradient(135deg,#22d3ee,#3b82f6)',border:'none',boxShadow:'0 0 18px rgba(34,211,238,0.28)',transition:'all .2s',opacity:loading?0.6:1,letterSpacing:'0.04em'}}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 0 28px rgba(34,211,238,0.5)';e.currentTarget.style.filter='brightness(1.08)';}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 0 18px rgba(34,211,238,0.28)';e.currentTarget.style.filter='brightness(1)';}}>
            {loading?'…':'SEARCH'}
          </button>
        </div>

        {/* Quick chips */}
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {quickTickers.map(t=>(
            <button key={t} onClick={()=>{setTicker(t);loadStock(t);}}
              style={{fontSize:10,fontFamily:"'IBM Plex Mono',monospace",padding:'5px 10px',borderRadius:8,...card,color:'#4b5563',cursor:'pointer',transition:'all .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.color=C.cyan;e.currentTarget.style.borderColor='rgba(34,211,238,0.35)';e.currentTarget.style.background='rgba(34,211,238,0.06)';}}
              onMouseLeave={e=>{e.currentTarget.style.color='#4b5563';e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.card;}}>
              {t}
            </button>
          ))}
        </div>

        {/* Skeleton */}
        {loading&&(
          <div style={{...card,borderRadius:18,padding:20,display:'flex',gap:16,alignItems:'center'}}>
            <div style={{width:56,height:56,borderRadius:16,background:'rgba(255,255,255,0.06)'}}/>
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}>
              <div style={{height:14,borderRadius:6,width:'55%',background:'rgba(255,255,255,0.06)'}}/>
              <div style={{height:10,borderRadius:6,width:'35%',background:'rgba(255,255,255,0.04)'}}/>
            </div>
          </div>
        )}

        {/* Stock card */}
        {stockData&&!loading&&(
          <div style={{...card,borderRadius:18,padding:20,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',height:1,width:140,background:`linear-gradient(90deg,transparent,${up?C.green:C.red},transparent)`}}/>
            {/* Header */}
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:18}}>
              <div style={{width:52,height:52,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,background:'linear-gradient(135deg,rgba(34,211,238,0.14),rgba(59,130,246,0.08))',border:'1px solid rgba(34,211,238,0.2)',fontSize:15,fontWeight:900,color:C.cyan}}>
                {stockData.ticker?.slice(0,2)}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:16,fontWeight:900,color:'#f9fafb',letterSpacing:'-0.02em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{stockData.name||stockData.ticker}</p>
                <p className="mono" style={{fontSize:11,color:'#4b5563',marginTop:2}}>{stockData.ticker} · NSE</p>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <p className="mono" style={{fontSize:24,fontWeight:900,color:'#f9fafb',letterSpacing:'-0.04em'}}>₹{fmt(stockData.price)}</p>
                <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:4,marginTop:2}}>
                  {up?<ChevronUp size={14} style={{color:C.green}}/>:<ChevronDown size={14} style={{color:C.red}}/>}
                  <span className="mono" style={{fontSize:13,fontWeight:800,color:up?C.green:C.red}}>{up?'+':''}{stockData.change?.toFixed(2)}%</span>
                </div>
              </div>
            </div>
            {/* Metrics */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
              {[
                {l:'Mkt Cap',v:`₹${(stockData.market_cap/10000000).toFixed(0)}Cr`},
                {l:'Volume',v:`${(stockData.volume/1000000).toFixed(1)}M`},
                {l:'P/E',v:stockData.pe_ratio?.toFixed(1)||'N/A'},
                {l:'RSI',v:stockData.indicators?.rsi?.toFixed(1)||'—',color:stockData.indicators?.rsi>70?C.red:stockData.indicators?.rsi<30?C.green:'#94a3b8'},
              ].map(({l,v,color='#94a3b8'})=>(
                <div key={l} style={{padding:'10px 0',borderRadius:10,textAlign:'center',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.04)'}}>
                  <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:800,color:'#1f2d40',marginBottom:4}}>{l}</p>
                  <p className="mono" style={{fontSize:12,fontWeight:700,color}}>{v}</p>
                </div>
              ))}
            </div>
            {/* RSI bar */}
            {stockData.indicators?.rsi&&(
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{flex:1,height:5,borderRadius:99,background:'rgba(255,255,255,0.04)',overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:99,width:`${Math.min(100,stockData.indicators.rsi)}%`,background:stockData.indicators.rsi>70?C.red:stockData.indicators.rsi<30?C.green:C.cyan,transition:'width 1s ease'}}/>
                </div>
                <span style={{fontSize:10,fontWeight:800,color:stockData.indicators.rsi>70?C.red:stockData.indicators.rsi<30?C.green:C.cyan,flexShrink:0}}>
                  {stockData.indicators.rsi>70?'Overbought':stockData.indicators.rsi<30?'Oversold':'Neutral'}
                </span>
              </div>
            )}
          </div>
        )}

        {!stockData&&!loading&&(
          <div style={{...card,borderRadius:18,padding:48,textAlign:'center'}}>
            <Target size={32} style={{color:'#1f2d40',margin:'0 auto 12px'}}/>
            <p style={{fontSize:14,fontWeight:700,color:'#374151'}}>Search a stock to get started</p>
            <p style={{fontSize:11,color:'#1f2d40',marginTop:4}}>Enter any NSE ticker above and press Search</p>
          </div>
        )}
      </div>

      {/* RIGHT — FIX 2: Redesigned order panel */}
      <div style={{position:'sticky',top:0}}>
        <div style={{...card,borderRadius:20,overflow:'hidden'}}>
          {/* Colored top bar */}
          <div style={{height:3,background:isBuy?'linear-gradient(90deg,#15803d,#22d3ee)':'linear-gradient(90deg,#b91c1c,#f97316)',transition:'background 0.3s ease'}}/>
          <div style={{padding:20}}>
            {/* Title */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
              <p style={{fontSize:14,fontWeight:900,color:'#f9fafb'}}>Place Order</p>
              {stockData&&<span className="mono" style={{fontSize:11,fontWeight:700,color:'#4b5563'}}>₹{fmt(stockData.price)} / share</span>}
            </div>

            {/* BUY / SELL toggle — redesigned */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:18,padding:5,borderRadius:16,background:'rgba(255,255,255,0.03)',border:`1px solid ${C.border}`}}>
              {['BUY','SELL'].map(a=>(
                <button key={a} onClick={()=>setAction(a)}
                  style={{padding:'13px 0',borderRadius:12,fontWeight:900,fontSize:14,letterSpacing:'0.08em',cursor:'pointer',border:'none',transition:'all 0.22s cubic-bezier(0.34,1.2,0.64,1)',background:action===a?(a==='BUY'?'linear-gradient(135deg,#15803d,#16a34a)':'linear-gradient(135deg,#b91c1c,#dc2626)'):'transparent',color:action===a?'#fff':'#4b5563',boxShadow:action===a?(a==='BUY'?'0 4px 20px rgba(22,163,74,0.4),inset 0 1px 0 rgba(255,255,255,0.12)':'0 4px 20px rgba(220,38,38,0.4),inset 0 1px 0 rgba(255,255,255,0.12)'):'none',transform:action===a?'scale(1.02)':'scale(1)'}}>
                  {a==='BUY'?'▲ BUY':'▼ SELL'}
                </button>
              ))}
            </div>

            {/* Quantity */}
            <div style={{marginBottom:12}}>
              <label style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.14em',fontWeight:800,color:'#4b5563',display:'block',marginBottom:6}}>Quantity (shares)</label>
              <input type="number" className="qty-input" value={qty} onChange={e=>setQty(e.target.value)} placeholder="0" min="1"
                style={{width:'100%',padding:'12px 14px',borderRadius:12,...card,color:'#f9fafb',fontSize:18,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,outline:'none',transition:'border-color .2s,box-shadow .2s',textAlign:'center'}}
                onFocus={e=>{e.target.style.borderColor=isBuy?'rgba(22,163,74,0.5)':'rgba(220,38,38,0.5)';e.target.style.boxShadow=`0 0 0 3px ${isBuy?'rgba(22,163,74,0.08)':'rgba(220,38,38,0.08)'}`}}
                onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none'}}/>
            </div>

            {/* Quick qty */}
            <div style={{display:'flex',gap:5,marginBottom:16}}>
              {[1,5,10,25,50].map(n=>(
                <button key={n} onClick={()=>setQty(String(n))}
                  style={{flex:1,padding:'6px 0',borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer',background:qty===String(n)?`${isBuy?C.green:C.red}20`:'rgba(255,255,255,0.03)',border:`1px solid ${qty===String(n)?(isBuy?'rgba(52,211,153,0.35)':'rgba(251,113,133,0.35)'):C.border}`,color:qty===String(n)?(isBuy?C.green:C.red):'#4b5563',transition:'all .15s'}}>
                  {n}
                </button>
              ))}
            </div>

            {/* Breakdown */}
            <div style={{borderRadius:12,overflow:'hidden',marginBottom:16,border:`1px solid ${C.border}`}}>
              {[
                {l:'Price per share',v:stockData?`₹${fmt(stockData.price)}`:'—',muted:true},
                {l:'Total value',v:`₹${fmt(total)}`,bold:true,accent:isBuy?C.green:C.red},
                {l:'Balance after',v:stockData&&qty?`₹${fmt((user?.balance||0)-(isBuy?total:-total))}`:'-',muted:true},
              ].map(({l,v,muted,bold,accent})=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 12px',background:bold?`${isBuy?C.green:C.red}08`:'rgba(255,255,255,0.01)',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                  <span style={{fontSize:11,color:muted?'#4b5563':'#94a3b8'}}>{l}</span>
                  <span className="mono" style={{fontSize:bold?14:12,fontWeight:bold?900:600,color:accent||(muted?'#6b7280':'#f9fafb')}}>{v}</span>
                </div>
              ))}
            </div>

            {/* Confirm */}
            <button onClick={executeTrade} disabled={executing||!stockData||!qty||!canAfford}
              style={{width:'100%',padding:'14px 0',borderRadius:14,fontWeight:900,fontSize:15,letterSpacing:'0.06em',cursor:(executing||!stockData||!qty)?'not-allowed':'pointer',border:'none',color:'#fff',background:!canAfford?'rgba(251,113,133,0.25)':isBuy?'linear-gradient(135deg,#15803d,#16a34a)':'linear-gradient(135deg,#b91c1c,#dc2626)',boxShadow:(!stockData||!qty||!canAfford)?'none':isBuy?'0 0 24px rgba(22,163,74,0.4)':'0 0 24px rgba(220,38,38,0.4)',opacity:(executing||!stockData||!qty)?0.5:1,transition:'all 0.2s ease'}}
              onMouseEnter={e=>{if(!e.currentTarget.disabled)e.currentTarget.style.filter='brightness(1.1)';}}
              onMouseLeave={e=>{e.currentTarget.style.filter='brightness(1)';}}>
              {!canAfford?'⚠ Insufficient Balance':executing?'Executing…':`CONFIRM ${action}`}
            </button>
            {!stockData&&<p style={{textAlign:'center',fontSize:11,color:'#1f2d40',marginTop:10}}>Search a stock to enable trading</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── HISTORY TAB ─── */
const HistoryTab=({user})=>{
  const [trades,setTrades]=useState([]);const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');const [filter,setFilter]=useState('all');const [sortBy,setSortBy]=useState('newest');
  const load=useCallback(async()=>{setLoading(true);try{const r=await fetch(`${API}/transactions/${user.id}`);const d=await r.json();setTrades(d.trades||[]);}catch{setTrades([]);}finally{setLoading(false);};},[user.id]);
  useEffect(()=>{load();},[load]);
  const filtered=trades.filter(t=>filter==='all'||t.action===filter).filter(t=>t.ticker?.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>sortBy==='newest'?new Date(b.timestamp)-new Date(a.timestamp):sortBy==='oldest'?new Date(a.timestamp)-new Date(b.timestamp):sortBy==='highest'?b.total_amount-a.total_amount:a.total_amount-b.total_amount);
  const buys=trades.filter(t=>t.action==='BUY');const sells=trades.filter(t=>t.action==='SELL');
  if(loading)return(<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:160,gap:12}}><div className="spin" style={{width:28,height:28,borderRadius:'50%',border:`2px solid ${C.cyan}`,borderTopColor:'transparent'}}/><p style={{fontSize:11,color:C.cyan,fontFamily:"'IBM Plex Mono',monospace",textTransform:'uppercase',letterSpacing:'0.1em'}}>Loading…</p></div>);
  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        {[{l:'Total',v:trades.length,c:C.cyan,icon:BarChart2},{l:'Buys',v:buys.length,c:C.green,icon:ArrowUpRight},{l:'Sells',v:sells.length,c:C.red,icon:ArrowDownRight},{l:'Invested',v:`₹${fmt(buys.reduce((s,t)=>s+t.total_amount,0))}`,c:C.violet,icon:DollarSign}].map(({l,v,c,icon:Icon})=>(
          <div key={l} style={{...card,borderRadius:14,padding:'12px 14px',display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:34,height:34,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:`${c}15`,border:`1px solid ${c}25`,flexShrink:0}}><Icon size={14} style={{color:c}}/></div>
            <div><p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:700,color:'#4b5563'}}>{l}</p><p className="mono" style={{fontSize:13,fontWeight:900,color:c}}>{v}</p></div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{position:'relative',flex:'1 1 160px'}}>
          <Search size={13} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#4b5563'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search ticker…" style={{width:'100%',paddingLeft:34,paddingRight:12,paddingTop:8,paddingBottom:8,borderRadius:10,...card,color:'#f9fafb',fontSize:13,outline:'none',transition:'border-color .2s'}} onFocus={e=>e.target.style.borderColor='rgba(34,211,238,0.4)'} onBlur={e=>e.target.style.borderColor=C.border}/>
        </div>
        <div style={{display:'flex',gap:5}}>
          {['all','BUY','SELL'].map(f=>(<button key={f} onClick={()=>setFilter(f)} style={{padding:'7px 14px',borderRadius:9,fontSize:11,fontWeight:800,cursor:'pointer',transition:'all .15s',background:filter===f?(f==='BUY'?'rgba(52,211,153,0.15)':f==='SELL'?'rgba(251,113,133,0.15)':'rgba(34,211,238,0.15)'):'rgba(255,255,255,0.03)',border:`1px solid ${filter===f?(f==='BUY'?'rgba(52,211,153,0.3)':f==='SELL'?'rgba(251,113,133,0.3)':'rgba(34,211,238,0.3)'):C.border}`,color:filter===f?(f==='BUY'?C.green:f==='SELL'?C.red:C.cyan):'#4b5563'}}>{f==='all'?'All':f}</button>))}
        </div>
        <div style={{display:'flex',gap:5}}>
          {[['newest','Newest'],['highest','Highest']].map(([v,l])=>(<button key={v} onClick={()=>setSortBy(v)} style={{padding:'7px 12px',borderRadius:9,fontSize:11,fontWeight:700,cursor:'pointer',background:sortBy===v?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.03)',border:`1px solid ${sortBy===v?'rgba(255,255,255,0.15)':C.border}`,color:sortBy===v?'#f9fafb':'#4b5563',transition:'all .15s'}}>{l}</button>))}
        </div>
      </div>
      <div style={{...card,borderRadius:18,overflow:'hidden'}}>
        <div style={{padding:'12px 20px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <p style={{fontSize:13,fontWeight:900,color:'#f9fafb'}}>Transactions</p>
          <span className="mono" style={{fontSize:10,fontWeight:800,padding:'3px 10px',borderRadius:99,color:C.cyan,background:'rgba(34,211,238,0.08)',border:'1px solid rgba(34,211,238,0.15)'}}>{filtered.length} records</span>
        </div>
        {filtered.length===0?(
          <div style={{padding:60,textAlign:'center'}}><BarChart2 size={28} style={{color:'#1f2d40',margin:'0 auto 10px'}}/><p style={{fontSize:13,fontWeight:700,color:'#374151'}}>No transactions</p><p style={{fontSize:11,color:'#1f2d40',marginTop:4}}>{search||filter!=='all'?'Try different filters':'Execute your first trade!'}</p></div>
        ):(
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',whiteSpace:'nowrap'}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`,background:'rgba(255,255,255,0.01)'}}>
                {['Type','Ticker','Qty','Price','Total','Date'].map((h,i)=>(<th key={h} style={{padding:'10px 14px',fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.12em',color:'#1f2d40',textAlign:i===0?'left':'right',paddingLeft:i===0?20:14,paddingRight:i===5?20:14}}>{h}</th>))}
              </tr></thead>
              <tbody>
                {filtered.map((trade,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.03)',transition:'background .15s'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{padding:'11px 14px',paddingLeft:20}}><span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,fontWeight:800,padding:'3px 8px',borderRadius:6,background:trade.action==='BUY'?'rgba(52,211,153,0.1)':'rgba(251,113,133,0.1)',border:`1px solid ${trade.action==='BUY'?'rgba(52,211,153,0.25)':'rgba(251,113,133,0.25)'}`,color:trade.action==='BUY'?C.green:C.red}}>{trade.action==='BUY'?<TrendingUp size={10}/>:<TrendingDown size={10}/>} {trade.action}</span></td>
                    <td className="mono" style={{padding:'11px 14px',fontSize:13,fontWeight:900,color:'#f9fafb',textAlign:'right'}}>{trade.ticker}</td>
                    <td className="mono" style={{padding:'11px 14px',fontSize:12,color:'#6b7280',textAlign:'right'}}>{trade.quantity}</td>
                    <td className="mono" style={{padding:'11px 14px',fontSize:12,color:'#6b7280',textAlign:'right'}}>₹{fmt(trade.price)}</td>
                    <td className="mono" style={{padding:'11px 14px',fontSize:13,fontWeight:800,color:trade.action==='BUY'?C.green:C.red,textAlign:'right'}}>{trade.action==='BUY'?'-':'+'}₹{fmt(trade.total_amount)}</td>
                    <td style={{padding:'11px 14px',paddingRight:20,textAlign:'right'}}><p style={{fontSize:12,color:'#94a3b8'}}>{new Date(trade.timestamp).toLocaleDateString('en-IN')}</p><p className="mono" style={{fontSize:10,color:'#374151'}}>{new Date(trade.timestamp).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</p></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{padding:'10px 20px',borderTop:'1px solid rgba(255,255,255,0.03)',display:'flex',justifyContent:'space-between',background:'rgba(255,255,255,0.01)'}}>
              <span style={{fontSize:10,color:'#1f2d40'}}>{filtered.length} records</span>
              <div style={{display:'flex',gap:16,fontSize:11,fontFamily:"'IBM Plex Mono',monospace",fontWeight:800}}>
                <span style={{color:C.green}}>Bought: ₹{fmt(filtered.filter(t=>t.action==='BUY').reduce((s,t)=>s+t.total_amount,0))}</span>
                <span style={{color:C.red}}>Sold: ₹{fmt(filtered.filter(t=>t.action==='SELL').reduce((s,t)=>s+t.total_amount,0))}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── WATCHLIST TAB ─── */
const WatchlistTab=({user})=>{
  const [watchlist,setWatchlist]=useState([]);const [stockPrices,setStockPrices]=useState({});
  const [loading,setLoading]=useState(true);const [refreshing,setRefreshing]=useState(false);
  const [newTicker,setNewTicker]=useState('');const [adding,setAdding]=useState(false);
  const POPULAR=['RELIANCE','TCS','HDFCBANK','INFY','SBIN','WIPRO','ITC','BHARTIARTL'];
  const colors=['#22d3ee','#6366f1','#8b5cf6','#f59e0b','#10b981','#f43f5e','#0ea5e9','#ec4899'];
  const fetchPrices=async list=>{setRefreshing(true);const prices={};await Promise.all(list.map(async item=>{try{const r=await fetch(`${API}/stock/${item.ticker}`);const d=await r.json();prices[item.ticker]={price:d.price,change:d.change,name:d.name};}catch{prices[item.ticker]=null;}}));setStockPrices(prices);setRefreshing(false);};
  const load=useCallback(async()=>{try{const r=await fetch(`${API}/watchlist/${user.id}`);const d=await r.json();setWatchlist(d);await fetchPrices(d);}catch{}finally{setLoading(false);};},[user.id]);
  useEffect(()=>{load();},[load]);
  const handleAdd=async()=>{if(!newTicker.trim())return;setAdding(true);try{await fetch(`${API}/watchlist/${user.id}/add/${newTicker.toUpperCase()}`,{method:'POST'});setNewTicker('');await load();}catch{}finally{setAdding(false);};};
  const handleRemove=async ticker=>{try{await fetch(`${API}/watchlist/${user.id}/remove/${ticker}`,{method:'DELETE'});await load();}catch{};};
  if(loading)return(<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:120,gap:12}}><div className="spin" style={{width:24,height:24,borderRadius:'50%',border:`2px solid ${C.cyan}`,borderTopColor:'transparent'}}/></div>);
  return(
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{...card,borderRadius:18,padding:16}}>
        <div style={{display:'flex',gap:8,marginBottom:10}}>
          <div style={{position:'relative',flex:1}}>
            <Search size={13} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#4b5563'}}/>
            <input value={newTicker} onChange={e=>setNewTicker(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&handleAdd()} placeholder="Add NSE ticker…" style={{width:'100%',paddingLeft:34,paddingRight:12,paddingTop:9,paddingBottom:9,borderRadius:10,...card,color:'#f9fafb',fontSize:13,fontFamily:"'IBM Plex Mono',monospace",outline:'none',transition:'border-color .2s'}} onFocus={e=>e.target.style.borderColor='rgba(34,211,238,0.4)'} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          <button onClick={handleAdd} disabled={adding||!newTicker.trim()} style={{padding:'9px 16px',borderRadius:10,fontWeight:800,fontSize:12,color:'#030712',cursor:'pointer',background:'linear-gradient(135deg,#22d3ee,#3b82f6)',border:'none',opacity:(adding||!newTicker.trim())?0.5:1,display:'flex',alignItems:'center',gap:5}}><Plus size={13}/>Add</button>
          <button onClick={()=>fetchPrices(watchlist)} disabled={refreshing} style={{padding:'9px 12px',borderRadius:10,...card,cursor:'pointer',color:'#4b5563',transition:'all .15s'}} onMouseEnter={e=>{e.currentTarget.style.color=C.cyan;e.currentTarget.style.borderColor='rgba(34,211,238,0.35)';}} onMouseLeave={e=>{e.currentTarget.style.color='#4b5563';e.currentTarget.style.borderColor=C.border;}}><RefreshCw size={13} className={refreshing?'spin':''}/></button>
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
          {POPULAR.filter(t=>!watchlist.find(w=>w.ticker===t)).map(t=>(<button key={t} onClick={()=>setNewTicker(t)} style={{fontSize:10,fontFamily:"'IBM Plex Mono',monospace",padding:'4px 9px',borderRadius:7,...card,color:'#4b5563',cursor:'pointer',transition:'all .15s'}} onMouseEnter={e=>{e.currentTarget.style.color=C.cyan;e.currentTarget.style.borderColor='rgba(34,211,238,0.3)';}} onMouseLeave={e=>{e.currentTarget.style.color='#4b5563';e.currentTarget.style.borderColor=C.border;}}>{t}</button>))}
        </div>
      </div>
      <div style={{...card,borderRadius:18,overflow:'hidden'}}>
        <div style={{padding:'12px 20px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}><Star size={13} style={{color:C.amber}}/><p style={{fontSize:13,fontWeight:900,color:'#f9fafb'}}>My Watchlist</p></div>
          <div style={{display:'flex',alignItems:'center',gap:7}}><span style={{width:7,height:7,borderRadius:'50%',background:refreshing?C.amber:C.green,display:'block'}}/><span style={{fontSize:10,color:'#1f2d40'}}>{refreshing?'Refreshing…':'Live prices'}</span></div>
        </div>
        {watchlist.length===0?(
          <div style={{padding:48,textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:10}}><Star size={24} style={{color:'#1f2d40'}}/><p style={{fontSize:13,fontWeight:700,color:'#374151'}}>Watchlist is empty</p></div>
        ):watchlist.map((item,i)=>{
          const s=stockPrices[item.ticker];const up=(s?.change||0)>=0;
          return(
            <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.03)',transition:'background .15s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.02)';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:38,height:38,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,background:`${colors[i%colors.length]}20`,border:`1px solid ${colors[i%colors.length]}30`,color:colors[i%colors.length]}}>{item.ticker.slice(0,2)}</div>
                <div><p style={{fontSize:13,fontWeight:900,color:'#f9fafb'}}>{item.ticker}</p><p style={{fontSize:10,color:'#4b5563',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s?.name||'—'}</p></div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                {s?(<div style={{textAlign:'right'}}><p className="mono" style={{fontSize:14,fontWeight:900,color:'#f9fafb'}}>₹{fmt(s.price)}</p><div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:4,marginTop:2}}>{up?<ArrowUpRight size={11} style={{color:C.green}}/>:<ArrowDownRight size={11} style={{color:C.red}}/>}<span className="mono" style={{fontSize:11,fontWeight:800,color:up?C.green:C.red}}>{up?'+':''}{s.change?.toFixed(2)}%</span></div></div>):(<div style={{width:60,height:32,borderRadius:8,background:'rgba(255,255,255,0.04)'}}/>)}
                <button onClick={()=>handleRemove(item.ticker)} className="remove-btn" style={{padding:6,borderRadius:8,border:'none',background:'transparent',cursor:'pointer',color:'#4b5563'}} onMouseEnter={e=>{e.currentTarget.style.color=C.red;e.currentTarget.style.background='rgba(251,113,133,0.08)';}} onMouseLeave={e=>{e.currentTarget.style.color='#4b5563';e.currentTarget.style.background='transparent';}}><Trash2 size={13}/></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── OVERVIEW TAB ─── */
const OverviewTab=({user})=>{
  const [portfolio,setPortfolio]=useState(null);const [loading,setLoading]=useState(true);
  const colors=['#22d3ee','#6366f1','#8b5cf6','#f59e0b','#10b981','#f43f5e'];
  useEffect(()=>{(async()=>{try{const r=await fetch(`${API}/portfolio/${user.id}`);setPortfolio(await r.json());}catch{}finally{setLoading(false);}})();},[user.id]);
  const pnl=portfolio?.summary?.total_pnl||0,invested=portfolio?.summary?.total_invested||0,current=portfolio?.summary?.current_value||0,pnlPct=invested>0?(pnl/invested)*100:0,up=pnl>=0;
  if(loading)return(<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:120,gap:12}}><div className="spin" style={{width:24,height:24,borderRadius:'50%',border:`2px solid ${C.cyan}`,borderTopColor:'transparent'}}/></div>);
  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{...card,borderRadius:20,padding:24,position:'relative',overflow:'hidden',border:`1px solid ${up?'rgba(52,211,153,0.2)':'rgba(251,113,133,0.2)'}`}}>
        <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',height:1,width:200,background:`linear-gradient(90deg,transparent,${up?C.green:C.red},transparent)`}}/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:24}}>
          {[{l:'Available',v:`₹${fmt(portfolio?.balance)}`,c:C.cyan},{l:'Invested',v:`₹${fmt(invested)}`,c:'#f9fafb'},{l:'Current Value',v:`₹${fmt(current)}`,c:'#f9fafb'},{l:'Net P&L',v:`${up?'+':''}₹${fmt(pnl)}`,c:up?C.green:C.red,sub:`${up?'+':''}${pnlPct.toFixed(2)}%`}].map(({l,v,c,sub})=>(
            <div key={l}><p style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:700,color:'#4b5563',marginBottom:6}}>{l}</p><p className="mono" style={{fontSize:18,fontWeight:900,color:c,letterSpacing:'-0.03em'}}>{v}</p>{sub&&<p className="mono" style={{fontSize:11,fontWeight:800,color:c,opacity:0.7,marginTop:2}}>{sub}</p>}</div>
          ))}
        </div>
      </div>
      {portfolio?.positions?.length>0?(
        <div style={{...card,borderRadius:18,overflow:'hidden'}}>
          <div style={{padding:'12px 20px',borderBottom:`1px solid ${C.border}`}}><p style={{fontSize:13,fontWeight:900,color:'#f9fafb'}}>Open Positions</p></div>
          <div style={{padding:'12px 20px',borderBottom:`1px solid ${C.border}`}}>
            <div style={{display:'flex',height:6,borderRadius:99,overflow:'hidden',gap:2}}>
              {portfolio.positions.map((p,i)=>(<div key={i} style={{borderRadius:3,width:`${current>0?(p.current_value/current)*100:0}%`,background:colors[i%colors.length],transition:'width 1s ease'}}/>))}
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:12,marginTop:8}}>
              {portfolio.positions.map((p,i)=>(<span key={i} style={{display:'flex',alignItems:'center',gap:5,fontSize:10,fontWeight:800,color:colors[i%colors.length]}}><span style={{width:6,height:6,borderRadius:'50%',background:colors[i%colors.length],display:'block'}}/>{p.ticker} {current>0?((p.current_value/current)*100).toFixed(1):0}%</span>))}
            </div>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',whiteSpace:'nowrap'}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`,background:'rgba(255,255,255,0.01)'}}>{['Stock','Qty','Avg','LTP','Value','P&L'].map((h,i)=>(<th key={h} style={{padding:'9px 14px',fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.12em',color:'#1f2d40',textAlign:i===0?'left':'right',paddingLeft:i===0?20:14,paddingRight:i===5?20:14}}>{h}</th>))}</tr></thead>
              <tbody>
                {portfolio.positions.map((p,i)=>{const posUp=p.pnl>=0,pct=(p.pnl/(p.avg_price*p.quantity))*100;return(
                  <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.03)',transition:'background .15s'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{padding:'12px 14px',paddingLeft:20}}><div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:28,height:28,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,background:`${colors[i%colors.length]}20`,color:colors[i%colors.length]}}>{p.ticker[0]}</div><span style={{fontSize:13,fontWeight:900,color:'#f9fafb'}}>{p.ticker}</span></div></td>
                    <td className="mono" style={{padding:'12px 14px',fontSize:12,color:'#6b7280',textAlign:'right'}}>{p.quantity}</td>
                    <td className="mono" style={{padding:'12px 14px',fontSize:12,color:'#6b7280',textAlign:'right'}}>₹{fmt(p.avg_price)}</td>
                    <td className="mono" style={{padding:'12px 14px',fontSize:13,fontWeight:800,color:'#f9fafb',textAlign:'right'}}>₹{fmt(p.current_price)}</td>
                    <td className="mono" style={{padding:'12px 14px',fontSize:12,color:'#6b7280',textAlign:'right'}}>₹{fmt(p.current_value)}</td>
                    <td style={{padding:'12px 14px',paddingRight:20,textAlign:'right'}}><p className="mono" style={{fontSize:13,fontWeight:900,color:posUp?C.green:C.red}}>{posUp?'+':''}₹{fmt(p.pnl)}</p><p className="mono" style={{fontSize:10,fontWeight:800,color:posUp?'#059669':'#e11d48'}}>{posUp?'+':''}{pct.toFixed(2)}%</p></td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
      ):(
        <div style={{...card,borderRadius:18,padding:60,textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:10,border:'1px dashed rgba(255,255,255,0.07)'}}><Briefcase size={28} style={{color:'#1f2d40'}}/><p style={{fontSize:13,fontWeight:700,color:'#374151'}}>No open positions</p><p style={{fontSize:11,color:'#1f2d40'}}>Switch to Execute tab to place your first trade</p></div>
      )}
    </div>
  );
};

/* ─── MAIN ─── */

/* ════════════════════════════════════════════════
   DASHBOARD TAB  — market terminal inside Trading
════════════════════════════════════════════════ */
const DashboardTab=({user})=>{
  const [ticker,setTicker]=useState('RELIANCE');
  const [stockData,setStockData]=useState(null);
  const [marketOverview,setMarketOverview]=useState(null);
  const [prediction,setPrediction]=useState(null);
  const [loading,setLoading]=useState(false);
  const [mktLoad,setMktLoad]=useState(false);
  const [predLoad,setPredLoad]=useState(false);
  const [showModal,setShowModal]=useState(false);
  const [tradeAction,setTradeAction]=useState('BUY');
  const [tradeQty,setTradeQty]=useState('');
  const [activeT,setActiveT]=useState('RELIANCE');
  const [iTab,setITab]=useState('indian');
  const [sFocus,setSFocus]=useState(false);
  const tickRef=useRef(ticker);tickRef.current=ticker;

  /* ── Live prices via SSE ── */
  const {prices:livePrices, connected:liveConnected} = useLivePrices(
    ['RELIANCE','TCS','HDFCBANK','ICICIBANK','INFY','SBIN','BHARTIARTL','ITC']
  );

  const loadMkt=useCallback(async()=>{
    setMktLoad(true);
    try{const r=await fetch(`${API}/market/overview`);const d=await r.json();setMarketOverview(d);}
    catch{}finally{setMktLoad(false);}
  },[]);
  const loadStock=useCallback(async t=>{
    const sym=(t||tickRef.current).trim().toUpperCase();
    setLoading(true);setPrediction(null);
    try{const r=await fetch(`${API}/stock/${sym}`);const d=await r.json();setStockData(d);setActiveT(sym);}
    catch{}finally{setLoading(false);}
  },[]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{loadMkt();loadStock('RELIANCE');},[]);

  const doPred=async()=>{
    setPredLoad(true);
    try{const r=await fetch(`${API}/stock/${activeT}/predict`);setPrediction(await r.json());}
    catch{}finally{setPredLoad(false);}
  };
  const doTrade=async()=>{
    if(!tradeQty||tradeQty<=0)return;
    try{
      const r=await fetch(`${API}/trade/execute`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:user.id,action:tradeAction,ticker:stockData.ticker,quantity:parseFloat(tradeQty),price:stockData.price})});
      const d=await r.json();
      if(d.status==='success'){setShowModal(false);setTradeQty('');}
    }catch{}
  };

  const up=(stockData?.change||0)>=0;
  const indices=iTab==='indian'?marketOverview?.indices:[];
  const sentiment=(()=>{
    if(!marketOverview)return null;
    const all=[...(marketOverview.gainers||[]),...(marketOverview.losers||[])];
    const n=all.filter(s=>s.change>0).length;
    const pct=all.length?Math.round((n/all.length)*100):50;
    return{pct,isBull:pct>=50};
  })();

  const InfoCard=({label,value,sub,color})=>(
    <div style={{...card,borderRadius:14,padding:'14px 16px'}}>
      <p style={{fontSize:9,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.14em',fontWeight:700,marginBottom:5}}>{label}</p>
      <p className="mono" style={{fontSize:15,fontWeight:700,color,letterSpacing:'-0.02em',marginBottom:3}}>{value}</p>
      <p style={{fontSize:10,color:'#334155'}}>{sub}</p>
    </div>
  );

  return(
    <div style={{display:'flex',flexDirection:'column',gap:18}}>
      {/* Search */}
      <div style={{display:'flex',gap:8}}>
        <div style={{position:'relative',flex:1}}>
          <Search size={14} style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:sFocus?C.cyan:'#4b5563',pointerEvents:'none'}}/>
          <input value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())}
            onKeyPress={e=>e.key==='Enter'&&loadStock()} onFocus={()=>setSFocus(true)} onBlur={()=>setSFocus(false)}
            placeholder="Search ticker… e.g. TCS"
            style={{width:'100%',paddingLeft:38,paddingRight:12,paddingTop:10,paddingBottom:10,borderRadius:12,...card,color:'#f9fafb',fontSize:13,fontFamily:"'IBM Plex Mono',monospace",outline:'none',transition:'all 0.18s',caretColor:C.cyan,borderColor:sFocus?'rgba(34,211,238,0.4)':undefined}}/>
        </div>
        <button onClick={()=>loadStock()} disabled={loading}
          style={{padding:'10px 22px',borderRadius:12,fontWeight:900,fontSize:13,color:'#030712',cursor:'pointer',background:'linear-gradient(135deg,#22d3ee,#3b82f6)',border:'none',boxShadow:'0 0 16px rgba(34,211,238,0.3)',opacity:loading?0.6:1}}>
          {loading?'…':'SEARCH'}
        </button>
      </div>

      {/* Indices */}
      <div>
        <div style={{display:'flex',gap:8,marginBottom:10}}>
          {[['indian','🇮🇳 Indian'],['global','🌐 Global']].map(([k,l])=>(
            <button key={k} onClick={()=>setITab(k)}
              style={{fontSize:11,fontWeight:800,padding:'5px 12px',borderRadius:8,cursor:'pointer',border:'none',background:iTab===k?'linear-gradient(135deg,#22d3ee,#3b82f6)':'rgba(255,255,255,0.05)',color:iTab===k?'#030712':'#64748b'}}>
              {l}
            </button>
          ))}
          <button onClick={loadMkt} style={{marginLeft:'auto',padding:6,borderRadius:8,...card,color:'#4b5563',cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.color=C.cyan} onMouseLeave={e=>e.currentTarget.style.color='#4b5563'}>
            <RefreshCw size={13} style={{animation:mktLoad?'tscroll 0.8s linear infinite':'none'}}/>
          </button>
        </div>
        <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:4}}>
          {(marketOverview?.indices||[]).slice(0,6).map((idx,i)=>{
            const up2=idx.change>=0;
            return(
              <div key={i} style={{...card,borderRadius:14,padding:'12px 16px',minWidth:140,flex:'1 1 0'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:7}}>
                  <p style={{fontSize:9,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:700}}>{idx.name}</p>
                  <span style={{fontSize:9,fontWeight:800,padding:'2px 6px',borderRadius:5,background:up2?'rgba(52,211,153,0.1)':'rgba(251,113,133,0.1)',color:up2?C.green:C.red}}>{up2?'+':''}{idx.change?.toFixed(2)}%</span>
                </div>
                <p className="mono" style={{fontSize:16,fontWeight:700,color:'#f9fafb'}}>₹{fmt(idx.price)}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:18,alignItems:'start'}}>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {/* Stock hero */}
          {stockData&&!loading&&(
            <div style={{...card,borderRadius:18,padding:18,position:'relative',overflow:'hidden',borderColor:up?'rgba(52,211,153,0.2)':'rgba(251,113,133,0.2)'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${up?C.green:C.red},transparent)`}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:48,height:48,borderRadius:13,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(34,211,238,0.12)',border:'1px solid rgba(34,211,238,0.22)',fontSize:14,fontWeight:900,color:C.cyan,fontFamily:"'IBM Plex Mono',monospace"}}>{stockData.ticker?.slice(0,2)}</div>
                  <div>
                    <p style={{fontSize:17,fontWeight:900,color:'#f9fafb',letterSpacing:'-0.02em'}}>{stockData.name||stockData.ticker}</p>
                    <p className="mono" style={{fontSize:11,color:'#4b5563'}}>{stockData.ticker} · NSE</p>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{textAlign:'right'}}>
                    <p className="mono" style={{fontSize:26,fontWeight:700,color:'#f9fafb',letterSpacing:'-0.04em',lineHeight:1}}>₹{fmt(stockData.price)}</p>
                    <p className="mono" style={{fontSize:13,fontWeight:800,color:up?C.green:C.red,marginTop:3}}>{up?'+':''}{stockData.change?.toFixed(2)}%</p>
                  </div>
                  <button onClick={()=>{setTradeAction('BUY');setShowModal(true);}} style={{padding:'10px 18px',borderRadius:11,fontWeight:900,fontSize:13,border:'none',cursor:'pointer',color:'#fff',background:'linear-gradient(135deg,#15803d,#16a34a)',boxShadow:'0 0 16px rgba(22,163,74,0.4)'}}>▲ BUY</button>
                  <button onClick={()=>{setTradeAction('SELL');setShowModal(true);}} style={{padding:'10px 18px',borderRadius:11,fontWeight:900,fontSize:13,border:'none',cursor:'pointer',color:'#fff',background:'linear-gradient(135deg,#b91c1c,#dc2626)',boxShadow:'0 0 16px rgba(220,38,38,0.4)'}}>▼ SELL</button>
                </div>
              </div>
              {/* Stat row */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginTop:14}}>
                {[{l:'Mkt Cap',v:`₹${(stockData.market_cap/10000000).toFixed(0)}Cr`},{l:'Volume',v:`${(stockData.volume/1000000).toFixed(1)}M`},{l:'P/E',v:stockData.pe_ratio?.toFixed(1)||'N/A'},{l:'RSI',v:stockData.indicators?.rsi?.toFixed(1)||'—'}].map(({l,v})=>(
                  <div key={l} style={{padding:'8px 0',textAlign:'center',background:'rgba(255,255,255,0.02)',borderRadius:9,border:'1px solid rgba(255,255,255,0.04)'}}>
                    <p style={{fontSize:9,color:'#1f2d40',textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:700,marginBottom:3}}>{l}</p>
                    <p className="mono" style={{fontSize:12,fontWeight:700,color:'#94a3b8'}}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {loading&&(<div style={{...card,borderRadius:18,padding:24,display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:48,height:48,borderRadius:13,background:'rgba(255,255,255,0.06)',animation:'dp-px 1.5s infinite'}}/>
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}>
              <div style={{height:14,borderRadius:5,width:'50%',background:'rgba(255,255,255,0.06)',animation:'dp-px 1.5s infinite'}}/>
              <div style={{height:10,borderRadius:5,width:'30%',background:'rgba(255,255,255,0.04)',animation:'dp-px 1.5s infinite'}}/>
            </div>
          </div>)}

          {/* Technical indicators */}
          {stockData?.indicators&&(
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
              {[
                {l:'RSI (14)',v:stockData.indicators.rsi?.toFixed(1),c:stockData.indicators.rsi>70?C.red:stockData.indicators.rsi<30?C.green:'#f9fafb',s:stockData.indicators.rsi>70?'Overbought':stockData.indicators.rsi<30?'Oversold':'Neutral'},
                {l:'MACD',v:`${stockData.indicators.macd>0?'+':''}${stockData.indicators.macd?.toFixed(2)}`,c:stockData.indicators.macd>0?C.green:C.red,s:stockData.indicators.macd>0?'Bullish':'Bearish'},
                {l:'SMA 20',v:`₹${fmt(stockData.indicators.sma_20)}`,c:'#f9fafb',s:stockData.price>stockData.indicators.sma_20?'Above SMA ↑':'Below SMA ↓'},
              ].map(({l,v,c,s})=>(
                <div key={l} style={{...card,borderRadius:13,padding:14,textAlign:'center'}}>
                  <p style={{fontSize:9,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.14em',fontWeight:700,marginBottom:8}}>{l}</p>
                  <p className="mono" style={{fontSize:20,fontWeight:700,color:c,marginBottom:5}}>{v}</p>
                  <p style={{fontSize:10,color:'#475569'}}>{s}</p>
                </div>
              ))}
            </div>
          )}

          {/* AI Forecast */}
          {stockData&&(
            <div style={{display:'flex',justifyContent:'flex-end'}}>
              <button onClick={doPred} disabled={predLoad}
                style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',borderRadius:11,fontSize:12,fontWeight:700,cursor:'pointer',background:'rgba(129,140,248,0.09)',border:'1px solid rgba(129,140,248,0.28)',color:'#818cf8',transition:'all 0.18s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='#818cf8';e.currentTarget.style.color='#030712';}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(129,140,248,0.09)';e.currentTarget.style.color='#818cf8';}}>
                <Bot size={13} style={{animation:predLoad?'dp-px 0.8s infinite':'none'}}/>{predLoad?'Analyzing…':'AI Forecast'}
              </button>
            </div>
          )}
          {prediction&&!prediction.error&&(
            <div style={{...card,borderRadius:14,padding:16,border:'1px solid rgba(52,211,153,0.2)'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <Bot size={14} style={{color:C.green}}/><span style={{fontSize:13,fontWeight:700,color:'#f9fafb'}}>AI Analysis</span>
                <span style={{marginLeft:'auto',fontSize:11,fontWeight:800,padding:'2px 10px',borderRadius:99,background:'rgba(52,211,153,0.12)',color:C.green}}>{prediction.recommendation}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
                {[{l:'7D Target',v:`₹${fmt(prediction.prediction_7d)}`},{l:'30D Target',v:`₹${fmt(prediction.prediction_30d)}`},{l:'Confidence',v:`${prediction.confidence?.toFixed(0)}%`}].map(({l,v})=>(
                  <div key={l} style={{padding:10,borderRadius:9,background:'rgba(0,0,0,0.2)',textAlign:'center'}}>
                    <p style={{fontSize:9,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:700,marginBottom:4}}>{l}</p>
                    <p className="mono" style={{fontSize:13,fontWeight:700,color:'#f9fafb'}}>{v}</p>
                  </div>
                ))}
              </div>
              <p style={{fontSize:12,color:'#cbd5e1',lineHeight:1.7}}>{prediction.reasoning}</p>
            </div>
          )}
        </div>

        {/* Right: Sentiment + Movers */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {sentiment&&(
            <div style={{...card,borderRadius:14,padding:16}}>
              <p style={{fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.12em',color:'#64748b',marginBottom:12}}>Market Sentiment</p>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span className="mono" style={{fontSize:11,fontWeight:700,color:C.green}}>Bull {sentiment.pct}%</span>
                <span className="mono" style={{fontSize:11,fontWeight:700,color:C.red}}>Bear {100-sentiment.pct}%</span>
              </div>
              <div style={{height:6,borderRadius:99,background:'rgba(251,113,133,0.15)',overflow:'hidden',marginBottom:8}}>
                <div style={{height:'100%',borderRadius:99,width:`${sentiment.pct}%`,background:`linear-gradient(90deg,${C.green},${C.cyan})`,transition:'width 1s ease'}}/>
              </div>
              <p style={{fontSize:11,fontWeight:700,color:sentiment.isBull?C.green:C.red}}>{sentiment.isBull?'📈 Bullish today':'📉 Bearish today'}</p>
            </div>
          )}
          {marketOverview&&(
            <div style={{...card,borderRadius:14,padding:16}}>
              <p style={{fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.12em',color:'#64748b',marginBottom:10}}>Top Movers</p>
              {[...(marketOverview.gainers||[]),...(marketOverview.losers||[])].slice(0,6).map((s,i)=>{
                const live=livePrices[s.ticker];
                const price=live?.price||s.price;
                const chg=live?.change??s.change;
                const g=(chg||0)>=0;
                return(
                  <div key={i} onClick={()=>{setTicker(s.ticker);loadStock(s.ticker);}}
                    style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 8px',borderRadius:9,marginBottom:2,cursor:'pointer',background:activeT===s.ticker?'rgba(34,211,238,0.05)':'transparent',transition:'background 0.14s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                    onMouseLeave={e=>e.currentTarget.style.background=activeT===s.ticker?'rgba(34,211,238,0.05)':'transparent'}>
                    <div style={{display:'flex',alignItems:'center',gap:7}}>
                      <span style={{width:6,height:6,borderRadius:'50%',background:g?C.green:C.red,flexShrink:0}}/>
                      <span style={{fontSize:12,fontWeight:800,color:activeT===s.ticker?C.cyan:'#e2e8f0'}}>{s.ticker}</span>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <p className="mono" style={{fontSize:12,color:'#f9fafb'}}>₹{fmt(price)}</p>
                      <p className="mono" style={{fontSize:10,fontWeight:800,color:g?C.green:C.red}}>{g?'+':''}{chg?.toFixed(2)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Trade Modal */}
      {showModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300}} onClick={e=>{if(e.target===e.currentTarget)setShowModal(false);}}>
          <div style={{...card,borderRadius:22,width:360,overflow:'hidden',border:`1px solid ${tradeAction==='BUY'?'rgba(52,211,153,0.3)':'rgba(251,113,133,0.3)'}`}}>
            <div style={{height:3,background:tradeAction==='BUY'?'linear-gradient(90deg,#15803d,#22d3ee)':'linear-gradient(90deg,#b91c1c,#f97316)'}}/>
            <div style={{padding:'20px 22px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
                <p style={{fontSize:17,fontWeight:900,color:'#f9fafb'}}>Execute {tradeAction}</p>
                <button onClick={()=>setShowModal(false)} style={{padding:6,borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#4b5563',cursor:'pointer',transition:'all 0.18s'}} onMouseEnter={e=>{e.currentTarget.style.color='#f9fafb';e.currentTarget.style.transform='rotate(90deg)';}} onMouseLeave={e=>{e.currentTarget.style.color='#4b5563';e.currentTarget.style.transform='rotate(0)';}}>
                  <X size={14}/>
                </button>
              </div>
              <div style={{padding:'12px 14px',borderRadius:12,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',marginBottom:16}}>
                <p className="mono" style={{fontSize:14,fontWeight:700,color:C.cyan,marginBottom:2}}>{stockData?.ticker}</p>
                <p className="mono" style={{fontSize:20,fontWeight:700,color:'#f9fafb'}}>₹{fmt(stockData?.price)}</p>
              </div>
              <input type="number" value={tradeQty} onChange={e=>setTradeQty(e.target.value)} placeholder="Quantity" min="1"
                style={{width:'100%',padding:'12px 14px',borderRadius:11,background:'rgba(8,14,26,0.9)',border:'1px solid rgba(255,255,255,0.07)',color:'#f9fafb',fontSize:18,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,textAlign:'center',outline:'none',marginBottom:12}}/>
              <div style={{display:'flex',justifyContent:'space-between',padding:'9px 12px',borderRadius:10,background:`${tradeAction==='BUY'?C.green:C.red}09`,border:`1px solid ${tradeAction==='BUY'?C.green:C.red}22`,marginBottom:16}}>
                <span style={{fontSize:11,color:'#4b5563'}}>Total</span>
                <span className="mono" style={{fontSize:15,fontWeight:800,color:tradeAction==='BUY'?C.green:C.red}}>₹{fmt((stockData?.price*parseFloat(tradeQty||0))||0)}</span>
              </div>
              <button onClick={doTrade} style={{width:'100%',padding:'13px 0',borderRadius:12,fontWeight:900,fontSize:14,border:'none',color:'#fff',cursor:'pointer',background:tradeAction==='BUY'?'linear-gradient(135deg,#15803d,#16a34a)':'linear-gradient(135deg,#b91c1c,#dc2626)',boxShadow:tradeAction==='BUY'?'0 0 24px rgba(22,163,74,0.4)':'0 0 24px rgba(220,38,38,0.4)'}}>CONFIRM {tradeAction}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════
   PORTFOLIO TAB
════════════════════════════════════════════════ */
const PortfolioTab=({user})=>{
  const [data,setData]=useState(null);const [loading,setLoading]=useState(true);const [err,setErr]=useState(null);
  const load=useCallback(async()=>{
    setLoading(true);setErr(null);
    try{const r=await fetch(`${API}/portfolio/${user.id}`);if(!r.ok)throw new Error();setData(await r.json());}
    catch{setErr('Unable to load portfolio. Check backend.');}
    finally{setLoading(false);}
  },[user.id]);

  /* ── Auto-refresh every 30s for live P&L ── */
  useEffect(()=>{
    load();
    const iv=setInterval(load,30_000);
    return()=>clearInterval(iv);
  },[load]); // eslint-disable-line react-hooks/exhaustive-deps

  if(loading)return(<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:200,gap:12}}>
    <div style={{width:32,height:32,borderRadius:'50%',border:`2px solid ${C.cyan}`,borderTopColor:'transparent',animation:'tscroll 0.8s linear infinite'}}/>
    <p className="mono" style={{fontSize:11,color:C.cyan,textTransform:'uppercase',letterSpacing:'0.1em',animation:'dp-px 1.5s infinite'}}>Synchronizing Assets…</p>
  </div>);

  if(err)return(<div style={{...card,borderRadius:18,padding:40,textAlign:'center',border:'1px solid rgba(251,113,133,0.2)'}}>
    <p style={{fontSize:14,fontWeight:700,color:'#f9fafb',marginBottom:6}}>Connection Error</p>
    <p style={{fontSize:12,color:'#4b5563',marginBottom:16}}>{err}</p>
    <button onClick={load} style={{padding:'8px 20px',borderRadius:10,background:'rgba(251,113,133,0.15)',border:'1px solid rgba(251,113,133,0.3)',color:C.red,fontSize:13,fontWeight:700,cursor:'pointer'}}>Retry</button>
  </div>);

  const invested=data?.summary?.total_invested||0;const current=data?.summary?.current_value||0;
  const pnl=data?.summary?.total_pnl||0;const pct=invested>0?(pnl/invested)*100:0;const up=pnl>=0;
  const colors=['#22d3ee','#6366f1','#8b5cf6','#f59e0b','#10b981','#f43f5e'];

  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* Summary */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        {[
          {l:'Total Invested',v:`₹${fmt(invested)}`,c:'#f9fafb',s:`${data?.positions?.length||0} positions`},
          {l:'Current Value',v:`₹${fmt(current)}`,c:'#f9fafb',s:'Mark-to-market'},
          {l:'Net P&L',v:`${up&&invested>0?'+':''}₹${fmt(pnl)}`,c:invested===0?'#f9fafb':up?C.green:C.red,s:`${up&&invested>0?'+':''}${pct.toFixed(2)}%`},
        ].map(({l,v,c,s})=>(
          <div key={l} style={{...card,borderRadius:16,padding:'16px 18px'}}>
            <p style={{fontSize:9,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.14em',fontWeight:700,marginBottom:8}}>{l}</p>
            <p className="mono" style={{fontSize:18,fontWeight:700,color:c,letterSpacing:'-0.02em',marginBottom:4}}>{v}</p>
            <p style={{fontSize:10,color:'#334155'}}>{s}</p>
          </div>
        ))}
      </div>

      {/* Balance */}
      <div style={{...card,borderRadius:14,padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <p style={{fontSize:12,color:'#4b5563'}}>Available Balance</p>
        <p className="mono" style={{fontSize:15,fontWeight:700,color:C.cyan}}>₹{fmt(data?.balance)}</p>
      </div>

      {/* Positions */}
      <div style={{...card,borderRadius:18,overflow:'hidden'}}>
        <div style={{padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <p style={{fontSize:14,fontWeight:900,color:'#f9fafb'}}>Open Positions</p>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <span className="mono" style={{fontSize:10,fontWeight:800,padding:'3px 10px',borderRadius:99,color:C.cyan,background:'rgba(34,211,238,0.08)',border:'1px solid rgba(34,211,238,0.15)'}}>{data?.positions?.length||0} assets</span>
            <span style={{fontSize:9,fontWeight:800,padding:'2px 8px',borderRadius:99,color:'#34d399',background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)',animation:'t3-px 2s infinite',letterSpacing:'0.1em',textTransform:'uppercase'}}>Auto ↻ 30s</span>
            <button onClick={load} style={{padding:6,borderRadius:8,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',color:'#4b5563',cursor:'pointer',transition:'color 0.15s'}} onMouseEnter={e=>e.currentTarget.style.color=C.cyan} onMouseLeave={e=>e.currentTarget.style.color='#4b5563'}>
              <RefreshCw size={13}/>
            </button>
          </div>
        </div>

        {(!data?.positions||data.positions.length===0)?(
          <div style={{padding:60,textAlign:'center'}}>
            <Briefcase size={28} style={{color:'#1f2d40',margin:'0 auto 12px'}}/>
            <p style={{fontSize:14,fontWeight:700,color:'#374151',marginBottom:4}}>No Holdings Yet</p>
            <p style={{fontSize:12,color:'#1f2d40'}}>Head to Execute tab to place your first trade</p>
          </div>
        ):(
          <>
            {/* Allocation bar */}
            <div style={{padding:'10px 20px',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <p style={{fontSize:9,color:'#334155',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Portfolio Allocation</p>
              <div style={{display:'flex',height:5,borderRadius:99,overflow:'hidden',gap:2}}>
                {data.positions.map((p,i)=>{const pct2=current>0?(p.current_value/current)*100:0;return <div key={i} style={{width:`${pct2}%`,background:colors[i%colors.length],borderRadius:2}}/>;})  }
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:10,marginTop:6}}>
                {data.positions.map((p,i)=>{const pct2=current>0?((p.current_value/current)*100).toFixed(1):0;return <span key={i} className="mono" style={{fontSize:10,fontWeight:800,color:colors[i%colors.length]}}>{p.ticker} {pct2}%</span>;})}
              </div>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',whiteSpace:'nowrap'}}>
                <thead><tr style={{borderBottom:'1px solid rgba(255,255,255,0.05)',background:'rgba(255,255,255,0.01)'}}>
                  {['Ticker','Qty','Avg Price','LTP','Value','P&L'].map((h,i)=>(
                    <th key={h} style={{padding:'10px 14px',fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.12em',color:'#1f2d40',textAlign:i===0?'left':'right',paddingLeft:i===0?20:14,paddingRight:i===5?20:14}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {data.positions.map((p,i)=>{
                    const pp=p.pnl>=0;const ppct=(p.pnl/(p.avg_price*p.quantity))*100;
                    return(<tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.03)',transition:'background 0.14s'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{padding:'12px 14px',paddingLeft:20}}><div style={{display:'flex',alignItems:'center',gap:9}}><div style={{width:6,height:20,borderRadius:99,background:colors[i%colors.length]}}/><span style={{fontSize:13,fontWeight:900,color:'#f9fafb'}}>{p.ticker}</span></div></td>
                      <td className="mono" style={{padding:'12px 14px',fontSize:12,color:'#6b7280',textAlign:'right'}}>{p.quantity}</td>
                      <td className="mono" style={{padding:'12px 14px',fontSize:12,color:'#6b7280',textAlign:'right'}}>₹{fmt(p.avg_price)}</td>
                      <td className="mono" style={{padding:'12px 14px',fontSize:13,fontWeight:700,color:'#f9fafb',textAlign:'right'}}>₹{fmt(p.current_price)}</td>
                      <td className="mono" style={{padding:'12px 14px',fontSize:12,color:'#6b7280',textAlign:'right'}}>₹{fmt(p.current_value)}</td>
                      <td style={{padding:'12px 14px',paddingRight:20,textAlign:'right'}}>
                        <p className="mono" style={{fontSize:13,fontWeight:900,color:pp?C.green:C.red}}>{pp?'+':''}₹{fmt(p.pnl)}</p>
                        <p className="mono" style={{fontSize:10,fontWeight:700,color:pp?'#059669':'#e11d48'}}>{pp?'+':''}{ppct.toFixed(2)}%</p>
                      </td>
                    </tr>);
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

/* ════════════════════════════════════════════════
   PRICE ALERTS TAB
════════════════════════════════════════════════ */
const AlertsTab=({user})=>{
  const [alerts,setAlerts]=useState([]);const [loading,setLoading]=useState(true);const [checking,setChecking]=useState(false);
  const [showForm,setShowForm]=useState(false);const [adding,setAdding]=useState(false);
  const [ticker,setTicker]=useState('');const [targetPrice,setTargetPrice]=useState('');const [condition,setCondition]=useState('above');const [note,setNote]=useState('');

  const load=useCallback(async()=>{
    try{const r=await fetch(`${API}/alerts/${user.id}`);const d=await r.json();setAlerts(d.alerts||[]);}
    catch{}finally{setLoading(false);}
  },[user.id]);

  const check=async()=>{
    setChecking(true);
    try{const r=await fetch(`${API}/alerts/check/${user.id}`);await r.json();}
    catch{}finally{setChecking(false);}
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{load();setTimeout(()=>check(),1000);},[]);

  const create=async()=>{
    if(!ticker||!targetPrice)return;setAdding(true);
    try{
      await fetch(`${API}/alerts/create`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:user.id,ticker:ticker.toUpperCase(),target_price:parseFloat(targetPrice),condition,note})});
      setShowForm(false);setTicker('');setTargetPrice('');setNote('');await load();
    }catch{}finally{setAdding(false);}
  };

  const del=async id=>{
    try{await fetch(`${API}/alerts/${id}`,{method:'DELETE'});await load();}catch{}
  };

  if(loading)return(<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:120,gap:12}}>
    <div style={{width:24,height:24,borderRadius:'50%',border:`2px solid ${C.amber}`,borderTopColor:'transparent',animation:'tscroll 0.8s linear infinite'}}/>
    <p className="mono" style={{fontSize:11,color:C.amber,textTransform:'uppercase',letterSpacing:'0.1em',animation:'dp-px 1.5s infinite'}}>Loading Alerts…</p>
  </div>);

  return(
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <Bell size={16} style={{color:C.amber}}/>
          <span style={{fontSize:14,fontWeight:800,color:'#f9fafb'}}>Price Alerts</span>
          <span className="mono" style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:99,color:C.amber,background:'rgba(251,191,36,0.1)',border:'1px solid rgba(251,191,36,0.2)'}}>{alerts.length}</span>
          {/* Notification permission status */}
          {typeof Notification!=='undefined'&&(
            <button
              onClick={()=>Notification.requestPermission()}
              style={{display:'flex',alignItems:'center',gap:4,padding:'3px 9px',borderRadius:99,fontSize:9,fontWeight:800,cursor:'pointer',border:'none',textTransform:'uppercase',letterSpacing:'0.1em',
                background:Notification.permission==='granted'?'rgba(52,211,153,0.1)':'rgba(251,191,36,0.1)',
                color:Notification.permission==='granted'?C.green:C.amber}}>
              <Bell size={9}/>{Notification.permission==='granted'?'Notifications On':'Enable Notifications'}
            </button>
          )}
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={check} disabled={checking}
            style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:10,fontSize:11,fontWeight:700,...card,color:'#4b5563',cursor:'pointer',border:'1px solid rgba(255,255,255,0.07)'}}
            onMouseEnter={e=>e.currentTarget.style.color=C.cyan} onMouseLeave={e=>e.currentTarget.style.color='#4b5563'}>
            <RefreshCw size={12} style={{animation:checking?'tscroll 0.8s linear infinite':'none'}}/>{checking?'Checking…':'Check Now'}
          </button>
          <button onClick={()=>setShowForm(p=>!p)}
            style={{display:'flex',alignItems:'center',gap:6,padding:'7px 16px',borderRadius:10,fontSize:11,fontWeight:800,cursor:'pointer',background:'linear-gradient(135deg,#f59e0b,#d97706)',border:'none',color:'#030712'}}>
            <Plus size={12}/> New Alert
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm&&(
        <div style={{...card,borderRadius:18,padding:18,border:'1px solid rgba(251,191,36,0.2)'}}>
          <p style={{fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.12em',color:'#64748b',marginBottom:14}}>Create Alert</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
            <div>
              <label style={{fontSize:9,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:700,display:'block',marginBottom:5}}>Ticker</label>
              <input value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} placeholder="e.g. RELIANCE"
                style={{width:'100%',padding:'9px 12px',borderRadius:10,...card,color:'#f9fafb',fontSize:13,fontFamily:"'IBM Plex Mono',monospace",outline:'none',border:'1px solid rgba(255,255,255,0.07)'}}/>
            </div>
            <div>
              <label style={{fontSize:9,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:700,display:'block',marginBottom:5}}>Target Price (₹)</label>
              <input type="number" value={targetPrice} onChange={e=>setTargetPrice(e.target.value)} placeholder="0.00"
                style={{width:'100%',padding:'9px 12px',borderRadius:10,...card,color:'#f9fafb',fontSize:13,fontFamily:"'IBM Plex Mono',monospace",outline:'none',border:'1px solid rgba(255,255,255,0.07)'}}/>
            </div>
            <div>
              <label style={{fontSize:9,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:700,display:'block',marginBottom:5}}>Condition</label>
              <div style={{display:'flex',gap:5}}>
                {['above','below'].map(c=>(
                  <button key={c} onClick={()=>setCondition(c)}
                    style={{flex:1,padding:'9px 0',borderRadius:10,fontSize:11,fontWeight:700,cursor:'pointer',border:'none',
                      background:condition===c?(c==='above'?'rgba(52,211,153,0.15)':'rgba(251,113,133,0.15)'):'rgba(255,255,255,0.04)',
                      color:condition===c?(c==='above'?C.green:C.red):'#4b5563'}}>
                    {c==='above'?'↑ Above':'↓ Below'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)"
            style={{width:'100%',padding:'9px 12px',borderRadius:10,...card,color:'#f9fafb',fontSize:13,outline:'none',border:'1px solid rgba(255,255,255,0.07)',marginBottom:12}}/>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button onClick={()=>setShowForm(false)} style={{padding:'8px 16px',borderRadius:9,...card,color:'#4b5563',fontSize:12,fontWeight:600,cursor:'pointer',border:'1px solid rgba(255,255,255,0.07)'}}>Cancel</button>
            <button onClick={create} disabled={adding||!ticker||!targetPrice}
              style={{padding:'8px 20px',borderRadius:9,background:'linear-gradient(135deg,#f59e0b,#d97706)',border:'none',color:'#030712',fontSize:12,fontWeight:800,cursor:'pointer',opacity:(adding||!ticker||!targetPrice)?0.5:1}}>
              {adding?'Creating…':'Create Alert'}
            </button>
          </div>
        </div>
      )}

      {/* Alerts list */}
      {alerts.length===0?(
        <div style={{...card,borderRadius:18,padding:60,textAlign:'center',border:'1px dashed rgba(255,255,255,0.06)'}}>
          <Bell size={28} style={{color:'#1f2d40',margin:'0 auto 12px'}}/>
          <p style={{fontSize:14,fontWeight:700,color:'#374151',marginBottom:4}}>No Alerts Set</p>
          <p style={{fontSize:12,color:'#1f2d40'}}>Click "New Alert" to get notified when a stock hits your target</p>
        </div>
      ):(
        <div style={{...card,borderRadius:18,overflow:'hidden'}}>
          {alerts.map((a,i)=>{
            const isAbove=a.condition==='above';const triggered=a.triggered;
            return(
              <div key={a.id||i} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 20px',borderBottom:i<alerts.length-1?'1px solid rgba(255,255,255,0.04)':'none',transition:'background 0.14s'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:triggered?'rgba(52,211,153,0.1)':'rgba(251,191,36,0.1)',border:`1px solid ${triggered?'rgba(52,211,153,0.25)':'rgba(251,191,36,0.25)'}`,flexShrink:0}}>
                  <Bell size={15} style={{color:triggered?C.green:C.amber}}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                    <span style={{fontSize:14,fontWeight:900,color:'#f9fafb'}}>{a.ticker}</span>
                    <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:6,background:isAbove?'rgba(52,211,153,0.1)':'rgba(251,113,133,0.1)',color:isAbove?C.green:C.red}}>
                      {isAbove?'↑ above':'↓ below'} ₹{fmt(a.target_price)}
                    </span>
                    {triggered&&<span style={{fontSize:10,fontWeight:800,padding:'2px 7px',borderRadius:6,background:'rgba(52,211,153,0.15)',color:C.green,border:'1px solid rgba(52,211,153,0.25)'}}>✓ Triggered</span>}
                  </div>
                  {a.note&&<p style={{fontSize:11,color:'#4b5563'}}>{a.note}</p>}
                </div>
                <button onClick={()=>del(a.id||a._id)}
                  style={{padding:7,borderRadius:8,background:'transparent',border:'none',color:'#4b5563',cursor:'pointer',flexShrink:0,transition:'all 0.14s'}}
                  onMouseEnter={e=>{e.currentTarget.style.color=C.red;e.currentTarget.style.background='rgba(251,113,133,0.08)';}}
                  onMouseLeave={e=>{e.currentTarget.style.color='#4b5563';e.currentTarget.style.background='transparent';}}>
                  <Trash2 size={14}/>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ─── MAIN Trading page ─── */
const Trading=({user})=>{
  const [tab,setTab]=useState('dashboard');const [refreshKey,setRefreshKey]=useState(0);
  /* ── Push notifications for price alerts ── */
  usePushAlerts(user?.id);

  const tabs=[
    {key:'dashboard', label:'Dashboard',   icon:Home,     accent:C.cyan},
    {key:'portfolio', label:'Portfolio',   icon:Briefcase,accent:C.violet},
    {key:'history',   label:'Transactions',icon:History,  accent:C.amber},
    {key:'watchlist', label:'Watchlist',   icon:Star,     accent:'#f59e0b'},
    {key:'alerts',    label:'Price Alerts',icon:Bell,     accent:C.red},
    {key:'execute',   label:'Execute',     icon:Zap,      accent:C.green},
  ];

  return(
    <div className="tpage page-in" style={{minHeight:'100vh',background:'#030712',color:'#f9fafb',padding:'20px 24px',paddingBottom:60,position:'relative',zIndex:1}}>
      <style>{STYLES}</style>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:44,height:44,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#06b6d4,#3b82f6)',boxShadow:'0 0 22px rgba(34,211,238,0.35)',flexShrink:0}}><TrendingUp size={20} color="#fff"/></div>
          <div><h1 className="syne" style={{fontSize:32,fontWeight:800,color:'#f9fafb',letterSpacing:'-0.04em',lineHeight:1,textShadow:'0 0 40px rgba(34,211,238,0.2)'}}>Trading</h1><p style={{fontSize:13,color:C.cyan,marginTop:4,fontWeight:500}}>Your complete trading workspace</p></div>
        </div>
        <div className="card3d glow-badge" style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px'}}>
          <span style={{width:8,height:8,borderRadius:'50%',background:C.green,flexShrink:0,animation:'p3-px 1.5s ease-in-out infinite'}}/>
          <span style={{fontSize:11,fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',color:C.green}}>Markets Open</span>
          <span style={{fontSize:9,fontWeight:800,padding:'1px 6px',borderRadius:99,
            background:'rgba(52,211,153,0.15)',border:'1px solid rgba(52,211,153,0.25)',color:C.green,
            animation:'t3-px 2s infinite',marginLeft:2}}>SSE</span>
        </div>
      </div>
      <div style={{marginBottom:18}}><TickerStrip/></div>
      <div data-layout='tabs' style={{display:'flex',gap:5,marginBottom:12,overflowX:'auto',flexWrap:'nowrap',paddingBottom:3,scrollbarWidth:'none'}}>
        {tabs.map(t=>(<TabBtn key={t.key} active={tab===t.key} onClick={()=>setTab(t.key)} icon={t.icon} label={t.label} accent={t.accent}/>))}
      </div>
      <div key={tab} className="tab-panel">
        {tab==='dashboard' &&<DashboardTab  user={user} key={refreshKey}/>}
        {tab==='portfolio' &&<PortfolioTab  user={user}/>}
        {tab==='history'   &&<HistoryTab    user={user}/>}
        {tab==='watchlist' &&<WatchlistTab  user={user}/>}
        {tab==='alerts'    &&<AlertsTab     user={user}/>}
        {tab==='execute'   &&<ExecuteTab    user={user} onTrade={()=>setRefreshKey(k=>k+1)}/>}
      </div>
    </div>
  );
};
export default Trading;