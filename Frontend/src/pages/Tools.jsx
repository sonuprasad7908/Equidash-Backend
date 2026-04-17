import React, { useState, useEffect, useRef } from 'react';
import { Calculator, Newspaper, TrendingUp, BarChart2, Percent,
  ExternalLink, Clock, RefreshCw, AlertCircle, Wrench, Zap, Activity } from 'lucide-react';
import { API } from '../utils/app';

const A = '#fb923c';
const fmtN = n => Math.round(n).toLocaleString('en-IN');

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Syne:wght@700;800&family=Inter:wght@400;500;600;700;800;900&display=swap');
  .tp{font-family:'Inter',sans-serif;color:#e2e8f0;min-height:100vh;background:#030712;}
  .tp *{box-sizing:border-box;}
  .tp .M{font-family:'IBM Plex Mono',monospace!important;}
  .tp .S{font-family:'Syne',sans-serif!important;}
  .tp::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
    background-image:linear-gradient(rgba(251,146,60,0.02) 1px,transparent 1px),
                     linear-gradient(90deg,rgba(251,146,60,0.02) 1px,transparent 1px);
    background-size:52px 52px;
    mask-image:radial-gradient(ellipse 100% 60% at 50% 0%,black 20%,transparent 100%);}
  .tp::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
    background:radial-gradient(ellipse 55% 50% at 5% 5%,rgba(251,146,60,0.06) 0%,transparent 60%),
               radial-gradient(ellipse 45% 55% at 95% 95%,rgba(245,158,11,0.04) 0%,transparent 60%);
    animation:tmesh 10s ease-in-out infinite alternate;}
  @keyframes tmesh{0%{opacity:0.7}100%{opacity:1}}

  /* Card */
  .tc{background:rgba(9,15,28,0.86);border:1px solid rgba(255,255,255,0.07);
      backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:18px;
      transform-style:preserve-3d;
      transition:transform 0.26s cubic-bezier(0.22,1,0.36,1),box-shadow 0.26s ease,border-color 0.26s ease;
      will-change:transform;}
  .tc:hover{border-color:rgba(251,146,60,0.18);box-shadow:0 20px 56px rgba(0,0,0,0.5),0 0 28px rgba(251,146,60,0.07);}

  /* Tab btn */
  .ttab{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:13px;
    font-size:12px;font-weight:800;cursor:pointer;border:none;position:relative;
    transition:all 0.22s cubic-bezier(0.34,1.2,0.64,1);}
  .ttab:hover:not(.ttab-on){transform:translateY(-2px);}
  .ttab-on::after{content:'';position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);
    height:2.5px;width:30px;border-radius:99px;background:#fb923c;box-shadow:0 0 10px #fb923c;}

  /* Slider */
  input[type=range].tslider{width:100%;height:4px;border-radius:99px;
    appearance:none;-webkit-appearance:none;cursor:pointer;outline:none;}
  input[type=range].tslider::-webkit-slider-thumb{-webkit-appearance:none;
    width:16px;height:16px;border-radius:50%;background:#fb923c;cursor:pointer;
    box-shadow:0 0 8px rgba(251,146,60,0.5);border:2px solid #030712;transition:transform 0.15s;}
  input[type=range].tslider::-webkit-slider-thumb:hover{transform:scale(1.2);}

  /* Row hover */
  .thow{transition:background 0.12s;}
  .thow:hover{background:rgba(251,146,60,0.04)!important;}

  /* News card */
  .ncard{transition:all 0.22s cubic-bezier(0.22,1,0.36,1);text-decoration:none;display:flex;flex-direction:column;}
  .ncard:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,0.55)!important;}

  /* Animations */
  @keyframes tin {from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes ttab{from{opacity:0;transform:translateY(10px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes tpx {0%,100%{opacity:1}50%{opacity:0.35}}
  @keyframes trot{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  @keyframes tscan{0%{top:-1px}100%{top:calc(100% + 1px)}}

  .t-in  {animation:tin  0.5s cubic-bezier(0.22,1,0.36,1) both;}
  .t-tab {animation:ttab 0.3s cubic-bezier(0.34,1.2,0.64,1) both;}
  .t-px  {animation:tpx  1.5s ease-in-out infinite;}
  .t-spin{animation:trot 0.75s linear infinite;}
  .tscan{position:absolute;left:0;right:0;height:1px;
    background:linear-gradient(90deg,transparent,rgba(251,146,60,0.25),transparent);
    animation:tscan 5s ease-in-out infinite;pointer-events:none;z-index:2;}

  .tp ::-webkit-scrollbar{width:4px;height:4px;}
  .tp ::-webkit-scrollbar-track{background:transparent;}
  .tp ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.09);border-radius:8px;}

  /* ── Responsive ── */
  @media(max-width:768px){
    .tp{padding:16px 12px!important;}
    .tc[data-calc-grid]{grid-template-columns:1fr!important;}
  }
  @media(max-width:600px){
    .tc[data-calc-types]{grid-template-columns:repeat(2,1fr)!important;}
  }
`;

/* ─── Tilt hook ─── */
const useTilt=(str=10)=>{
  const r=useRef(null);
  const mm=e=>{const el=r.current;if(!el)return;
    const{left,top,width,height}=el.getBoundingClientRect();
    const x=(e.clientX-left)/width-0.5,y=(e.clientY-top)/height-0.5;
    el.style.transform=`perspective(700px) rotateY(${x*str}deg) rotateX(${-y*str}deg) translateZ(6px)`;
    el.style.boxShadow=`${-x*16}px ${-y*16}px 38px rgba(0,0,0,0.5),0 0 0 1px rgba(251,146,60,${0.06+Math.abs(x+y)*0.08})`;
  };
  const ml=()=>{const el=r.current;if(!el)return;el.style.transform='';el.style.boxShadow='';};
  return{ref:r,onMouseMove:mm,onMouseLeave:ml};
};

/* ─── TabBtn ─── */
const TabBtn=({active,onClick,icon:Icon,label})=>{
  const ref=useRef(null);
  const mm=e=>{const el=ref.current;if(!el||active)return;
    const{left,top,width,height}=el.getBoundingClientRect();
    const x=(e.clientX-left)/width-0.5,y=(e.clientY-top)/height-0.5;
    el.style.transform=`perspective(400px) rotateY(${x*16}deg) rotateX(${-y*16}deg) translateY(-2px)`;
  };
  const ml=()=>{const el=ref.current;if(!el||active)return;el.style.transform='';};
  return(
    <button ref={ref} onClick={onClick} onMouseMove={mm} onMouseLeave={ml}
      className={active?'ttab ttab-on':'ttab'}
      style={{background:active?'rgba(251,146,60,0.13)':'rgba(255,255,255,0.03)',
        border:`1px solid ${active?'rgba(251,146,60,0.3)':'rgba(255,255,255,0.07)'}`,
        color:active?A:'#4b5563',boxShadow:active?'0 0 20px rgba(251,146,60,0.18),inset 0 1px 0 rgba(251,146,60,0.12)':'none',
        transformStyle:'preserve-3d'}}>
      <Icon size={13}/>{label}
    </button>
  );
};

/* ─── Slider ─── */
const Slider=({label,value,onChange,min,max,step=1,prefix='',suffix=''})=>{
  const pct=((value-min)/(max-min))*100;
  return(
    <div style={{marginBottom:22}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <label style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.15em',fontWeight:800,color:'#475569'}}>{label}</label>
        <span className="M" style={{fontSize:13,fontWeight:700,color:'#f1f5f9'}}>{prefix}{value.toLocaleString('en-IN')}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(Number(e.target.value))} className="tslider"
        style={{background:`linear-gradient(to right,${A} ${pct}%,rgba(255,255,255,0.08) ${pct}%)`}}/>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:5}}>
        <span className="M" style={{fontSize:9,color:'#334155'}}>{prefix}{min.toLocaleString()}{suffix}</span>
        <span className="M" style={{fontSize:9,color:'#334155'}}>{prefix}{max.toLocaleString()}{suffix}</span>
      </div>
    </div>
  );
};

/* ─── Result row ─── */
const RRow=({label,value,color='#94a3b8',hl=false})=>(
  <div className={hl?'':'thow'} style={{
    display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px 0',
    borderBottom:hl?'none':'1px solid rgba(255,255,255,0.04)',
    ...(hl?{background:'rgba(251,146,60,0.06)',border:'1px solid rgba(251,146,60,0.14)',
      borderRadius:11,padding:'11px 14px',margin:'4px -14px'}:{})}}>
    <span style={{fontSize:12,color:'#64748b'}}>{label}</span>
    <span className="M" style={{fontSize:14,fontWeight:700,color}}>{value}</span>
  </div>
);

/* ─── Hero result ─── */
const Hero=({label,value,accent})=>(
  <div style={{padding:20,borderRadius:14,textAlign:'center',marginBottom:18,position:'relative',overflow:'hidden',
    background:`${accent}08`,border:`1px solid ${accent}20`}}>
    <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',height:1,width:140,
      background:`linear-gradient(90deg,transparent,${accent},transparent)`}}/>
    <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.16em',fontWeight:800,color:'#475569',marginBottom:8}}>{label}</p>
    <p className="M S" style={{fontSize:30,fontWeight:700,color:'#f8fafc',letterSpacing:'-0.04em'}}>{value}</p>
  </div>
);

/* ══════════════════════════════════
   CALCULATOR TAB
══════════════════════════════════ */
const calcTypes=[
  {key:'SIP',     icon:TrendingUp, color:'#22d3ee', desc:'Monthly SIP Returns'},
  {key:'Lumpsum', icon:BarChart2,  color:'#6366f1', desc:'One-time Investment'},
  {key:'Brokerage',icon:Calculator,color:'#f59e0b', desc:'Trade Cost Breakdown'},
  {key:'Margin',  icon:Percent,    color:'#8b5cf6', desc:'Leverage Calculator'},
];

/* ─── Calc type button (extracted so useRef is legal) ─── */
const CalcTypeBtn=({cKey,Icon,color,desc,isActive,onClick})=>{
  const ref=useRef(null);
  const mm=e=>{const el=ref.current;if(!el||isActive)return;
    const{left,top,width,height}=el.getBoundingClientRect();
    const x=(e.clientX-left)/width-0.5,y=(e.clientY-top)/height-0.5;
    el.style.transform=`perspective(500px) rotateY(${x*14}deg) rotateX(${-y*14}deg) translateZ(6px)`;};
  const ml=()=>{const el=ref.current;if(!el||isActive)return;el.style.transform='';};
  return(
    <button ref={ref} onClick={onClick} onMouseMove={mm} onMouseLeave={ml}
      className="tc" style={{padding:'14px 12px',textAlign:'center',cursor:'pointer',border:'none',
        borderColor:isActive?`${color}30`:'rgba(255,255,255,0.07)',
        background:isActive?`${color}12`:'rgba(9,15,28,0.86)',
        boxShadow:isActive?`0 0 20px ${color}20`:'none',transformStyle:'preserve-3d'}}>
      <div style={{width:36,height:36,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',
        background:`${color}15`,border:`1px solid ${color}25`,margin:'0 auto 10px'}}>
        <Icon size={16} style={{color}}/>
      </div>
      <p style={{fontSize:12,fontWeight:900,color:isActive?color:'#94a3b8',marginBottom:3}}>{cKey}</p>
      <p style={{fontSize:9,color:'#334155',lineHeight:1.3}}>{desc}</p>
    </button>
  );
};

const CalculatorTab=()=>{
  const [active,setActive]=useState('SIP');
  const [sipAmount,setSipAmount]=useState(5000);const [sipRate,setSipRate]=useState(12);const [sipYears,setSipYears]=useState(10);
  const [lumpAmount,setLumpAmount]=useState(100000);const [lumpRate,setLumpRate]=useState(12);const [lumpYears,setLumpYears]=useState(10);
  const [buyPrice,setBuyPrice]=useState(1000);const [qty,setQty]=useState(100);const [sellPrice,setSellPrice]=useState(1100);
  const [mPrice,setMPrice]=useState(1000);const [mQty,setMQty]=useState(100);const [mPct,setMPct]=useState(20);

  const sipM=sipYears*12,sipMR=sipRate/100/12;
  const sipFV=sipAmount*((Math.pow(1+sipMR,sipM)-1)/sipMR)*(1+sipMR);
  const sipInv=sipAmount*sipM;
  const lumpFV=lumpAmount*Math.pow(1+lumpRate/100,lumpYears);
  const bv=buyPrice*qty,sv=sellPrice*qty;
  const brok=0.0003,bB=Math.min(bv*brok,20),sB=Math.min(sv*brok,20);
  const stt=sv*0.001,stamp=bv*0.00015,sebi=(bv+sv)*0.000001;
  const charges=bB+sB+stt+stamp+sebi;
  const gross=sv-bv,net=gross-charges;
  const mTotal=mPrice*mQty,mReq=mTotal*(mPct/100),lev=mTotal/mReq;
  const cfg=calcTypes.find(t=>t.key===active);
  const tilt=useTilt(5);

  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* Calc type selector */}
      <div data-calc-types style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        {calcTypes.map(({key,icon:Icon,color,desc})=>(
          <CalcTypeBtn key={key} cKey={key} Icon={Icon} color={color} desc={desc}
            isActive={active===key} onClick={()=>setActive(key)}/>
        ))}
      </div>

      {/* Input + Result */}
      <div data-calc-grid style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        {/* Inputs */}
        <div ref={tilt.ref} onMouseMove={tilt.onMouseMove} onMouseLeave={tilt.onMouseLeave}
          className="tc" style={{padding:22,position:'relative',overflow:'hidden'}}>
          <div className="tscan"/>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20,position:'relative',zIndex:1}}>
            <div style={{width:36,height:36,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',
              background:`${cfg.color}15`,border:`1px solid ${cfg.color}25`}}>
              <cfg.icon size={16} style={{color:cfg.color}}/>
            </div>
            <div>
              <p style={{fontSize:14,fontWeight:900,color:'#f8fafc'}}>{active} Calculator</p>
              <p style={{fontSize:10,color:'#475569'}}>{cfg.desc}</p>
            </div>
          </div>
          <div style={{position:'relative',zIndex:1}}>
            {active==='SIP'&&<>
              <Slider label="Monthly Investment" value={sipAmount} onChange={setSipAmount} min={500} max={100000} step={500} prefix="₹"/>
              <Slider label="Expected Return Rate" value={sipRate} onChange={setSipRate} min={1} max={30} suffix="% p.a."/>
              <Slider label="Time Period" value={sipYears} onChange={setSipYears} min={1} max={40} suffix=" yrs"/>
            </>}
            {active==='Lumpsum'&&<>
              <Slider label="Investment Amount" value={lumpAmount} onChange={setLumpAmount} min={1000} max={10000000} step={1000} prefix="₹"/>
              <Slider label="Expected Return Rate" value={lumpRate} onChange={setLumpRate} min={1} max={30} suffix="% p.a."/>
              <Slider label="Time Period" value={lumpYears} onChange={setLumpYears} min={1} max={40} suffix=" yrs"/>
            </>}
            {active==='Brokerage'&&<>
              <Slider label="Buy Price" value={buyPrice} onChange={setBuyPrice} min={10} max={100000} step={10} prefix="₹"/>
              <Slider label="Quantity" value={qty} onChange={setQty} min={1} max={10000}/>
              <Slider label="Sell Price" value={sellPrice} onChange={setSellPrice} min={10} max={100000} step={10} prefix="₹"/>
            </>}
            {active==='Margin'&&<>
              <Slider label="Stock Price" value={mPrice} onChange={setMPrice} min={10} max={100000} step={10} prefix="₹"/>
              <Slider label="Quantity" value={mQty} onChange={setMQty} min={1} max={10000}/>
              <Slider label="Margin Required" value={mPct} onChange={setMPct} min={5} max={100} suffix="%"/>
            </>}
          </div>
        </div>

        {/* Results */}
        <div className="tc" style={{padding:22,display:'flex',flexDirection:'column',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',
            background:`radial-gradient(circle,${cfg.color}12 0%,transparent 70%)`,pointerEvents:'none'}}/>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18,position:'relative',zIndex:1}}>
            <TrendingUp size={16} style={{color:'#34d399'}}/>
            <p style={{fontSize:14,fontWeight:900,color:'#f8fafc'}}>Results</p>
          </div>
          <div style={{position:'relative',zIndex:1}}>
            {active==='SIP'&&<>
              <Hero label="Future Value" value={`₹${fmtN(sipFV)}`} accent="#22d3ee"/>
              <RRow label="Total Invested"    value={`₹${fmtN(sipInv)}`}/>
              <RRow label="Total Returns"     value={`₹${fmtN(sipFV-sipInv)}`}     color="#34d399"/>
              <RRow label="Return %"          value={`${((sipFV-sipInv)/sipInv*100).toFixed(1)}%`} color="#34d399" hl/>
              <RRow label="Duration"          value={`${sipYears} years`}/>
            </>}
            {active==='Lumpsum'&&<>
              <Hero label="Future Value" value={`₹${fmtN(lumpFV)}`} accent="#6366f1"/>
              <RRow label="Amount Invested"   value={`₹${fmtN(lumpAmount)}`}/>
              <RRow label="Total Returns"     value={`₹${fmtN(lumpFV-lumpAmount)}`} color="#34d399"/>
              <RRow label="Return %"          value={`${((lumpFV-lumpAmount)/lumpAmount*100).toFixed(1)}%`} color="#34d399" hl/>
              <RRow label="CAGR"              value={`${lumpRate}%`}/>
            </>}
            {active==='Brokerage'&&<>
              <Hero label="Net P&L" value={`${net>=0?'+':''}₹${fmtN(net)}`} accent={net>=0?'#34d399':'#fb7185'}/>
              <RRow label="Buy Value"         value={`₹${fmtN(bv)}`}/>
              <RRow label="Sell Value"        value={`₹${fmtN(sv)}`}/>
              <RRow label="Gross P&L"         value={`${gross>=0?'+':''}₹${fmtN(gross)}`} color={gross>=0?'#34d399':'#fb7185'} hl/>
              <RRow label="Total Charges"     value={`₹${charges.toFixed(2)}`} color="#fb7185"/>
              <RRow label="STT"               value={`₹${stt.toFixed(2)}`}/>
              <RRow label="Brokerage"         value={`₹${(bB+sB).toFixed(2)}`}/>
            </>}
            {active==='Margin'&&<>
              <Hero label="Margin Required" value={`₹${fmtN(mReq)}`} accent="#8b5cf6"/>
              <RRow label="Total Position"    value={`₹${fmtN(mTotal)}`}/>
              <RRow label="Leverage"          value={`${lev.toFixed(1)}x`} color="#fbbf24" hl/>
              <RRow label="Margin %"          value={`${mPct}%`}/>
              <RRow label="Free Capital"      value={`₹${fmtN(mTotal-mReq)}`} color="#34d399"/>
            </>}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════
   NEWS TAB
══════════════════════════════════ */
const sentCfg={
  positive:{color:'#34d399',bg:'rgba(52,211,153,0.07)',border:'rgba(52,211,153,0.2)',label:'Bullish'},
  negative:{color:'#fb7185',bg:'rgba(251,113,133,0.07)',border:'rgba(251,113,133,0.2)',label:'Bearish'},
  neutral: {color:'#94a3b8',bg:'rgba(148,163,184,0.05)',border:'rgba(148,163,184,0.1)', label:'Neutral'},
};

const NewsTab=()=>{
  const [news,setNews]=useState([]);const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);const [filter,setFilter]=useState('all');const [refreshing,setRefreshing]=useState(false);

  const load=async(isR=false)=>{
    try{if(isR)setRefreshing(true);else setLoading(true);setError(null);
      const r=await fetch(`${API}/market/news`);if(!r.ok)throw new Error();
      const d=await r.json();setNews(Array.isArray(d)?d:d.news||[]);}
    catch{setError('Unable to connect to news server.');}
    finally{setLoading(false);setRefreshing(false);}
  };
  useEffect(()=>{load();},[]);

  const filtered=filter==='all'?news:news.filter(n=>n.sentiment===filter);
  const counts={all:news.length,positive:news.filter(n=>n.sentiment==='positive').length,
    neutral:news.filter(n=>n.sentiment==='neutral').length,negative:news.filter(n=>n.sentiment==='negative').length};

  if(loading)return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:160,gap:12}}>
      <div style={{width:28,height:28,borderRadius:'50%',border:`2px solid ${A}`,borderTopColor:'transparent',animation:'trot 0.75s linear infinite'}}/>
      <p className="M" style={{fontSize:11,color:A,textTransform:'uppercase',letterSpacing:'0.14em',animation:'tpx 1.5s infinite'}}>Loading feeds…</p>
    </div>
  );

  if(error)return(
    <div className="tc" style={{padding:40,textAlign:'center',borderColor:'rgba(251,113,133,0.2)',background:'rgba(251,113,133,0.04)'}}>
      <AlertCircle size={28} style={{color:'#fb7185',margin:'0 auto 12px'}}/>
      <p style={{fontSize:14,fontWeight:800,color:'#f8fafc',marginBottom:6}}>Feed Disconnected</p>
      <p style={{fontSize:12,color:'#94a3b8',marginBottom:16}}>{error}</p>
      <button onClick={()=>load()} style={{padding:'9px 22px',borderRadius:11,background:'linear-gradient(135deg,#dc2626,#b91c1c)',border:'none',color:'#fff',fontSize:13,fontWeight:800,cursor:'pointer'}}>Reconnect</button>
    </div>
  );

  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* Sentiment bar */}
      <div className="tc" style={{padding:16,display:'flex',alignItems:'center',gap:14}}>
        <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.15em',fontWeight:800,color:'#475569',flexShrink:0}}>Sentiment</p>
        <div style={{flex:1,display:'flex',gap:2,height:6,borderRadius:99,overflow:'hidden'}}>
          {counts.positive>0&&<div style={{width:`${(counts.positive/counts.all)*100}%`,background:'#34d399',borderRadius:'99px 0 0 99px'}}/>}
          {counts.neutral>0&&<div style={{width:`${(counts.neutral/counts.all)*100}%`,background:'#64748b'}}/>}
          {counts.negative>0&&<div style={{width:`${(counts.negative/counts.all)*100}%`,background:'#fb7185',borderRadius:'0 99px 99px 0'}}/>}
        </div>
        <div style={{display:'flex',gap:12,flexShrink:0}}>
          <span className="M" style={{fontSize:11,fontWeight:700,color:'#34d399'}}>↑{counts.positive}</span>
          <span className="M" style={{fontSize:11,fontWeight:700,color:'#94a3b8'}}>—{counts.neutral}</span>
          <span className="M" style={{fontSize:11,fontWeight:700,color:'#fb7185'}}>↓{counts.negative}</span>
        </div>
        <button onClick={()=>load(true)} disabled={refreshing}
          style={{padding:7,borderRadius:9,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',
            color:refreshing?A:'#4b5563',cursor:'pointer',display:'flex',flexShrink:0,transition:'color 0.15s'}}
          onMouseEnter={e=>e.currentTarget.style.color=A} onMouseLeave={e=>e.currentTarget.style.color='#4b5563'}>
          <RefreshCw size={13} style={{animation:refreshing?'trot 0.75s linear infinite':'none'}}/>
        </button>
      </div>

      {/* Filter */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        {[['all',`All (${counts.all})`],['positive',`Bullish (${counts.positive})`],['neutral',`Neutral (${counts.neutral})`],['negative',`Bearish (${counts.negative})`]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)}
            style={{padding:'7px 14px',borderRadius:11,fontSize:11,fontWeight:800,cursor:'pointer',border:'none',transition:'all 0.18s',
              background:filter===k?`linear-gradient(135deg,${A},#ea580c)`:'rgba(255,255,255,0.04)',
              color:filter===k?'#030712':'#64748b',boxShadow:filter===k?'0 0 12px rgba(251,146,60,0.3)':'none'}}>
            {l}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length>0?(
        <div style={{display:'grid',gap:12,gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))'}}>
          {filtered.map((item,i)=>{
            const cfg=sentCfg[item.sentiment]||sentCfg.neutral;
            return(
              <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                className="tc ncard" style={{padding:16,border:`1px solid rgba(255,255,255,0.07)`,
                  animation:`tin 0.3s ease ${Math.min(i,12)*30}ms both`}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=cfg.border;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:10}}>
                    <span className="M" style={{fontSize:9,fontWeight:800,padding:'3px 8px',borderRadius:7,
                      color:'#22d3ee',background:'rgba(34,211,238,0.08)',border:'1px solid rgba(34,211,238,0.15)'}}>
                      {item.source||'Market Sync'}
                    </span>
                    <span style={{fontSize:9,fontWeight:800,padding:'3px 9px',borderRadius:7,flexShrink:0,
                      color:cfg.color,background:cfg.bg,border:`1px solid ${cfg.border}`}}>
                      {cfg.label}
                    </span>
                  </div>
                  <p style={{fontSize:13,fontWeight:700,color:'#e2e8f0',lineHeight:1.55,
                    display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                    {item.title}
                  </p>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                  marginTop:12,paddingTop:10,borderTop:'1px solid rgba(255,255,255,0.05)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:5,fontSize:10,color:'#334155'}}>
                    <Clock size={10}/>{item.published?.split(' ').slice(1,4).join(' ')||'Recent'}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:5,fontSize:10,fontWeight:700,color:'#475569'}}>
                    Read <ExternalLink size={10}/>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      ):(
        <div className="tc" style={{padding:56,textAlign:'center',border:'1px dashed rgba(255,255,255,0.07)'}}>
          <Newspaper size={24} style={{color:'#334155',margin:'0 auto 12px'}}/>
          <p style={{fontSize:14,fontWeight:800,color:'#475569',marginBottom:4}}>No articles</p>
          <p style={{fontSize:12,color:'#334155'}}>{filter!=='all'?`No ${filter} news. Try another filter.`:'Feed is quiet.'}</p>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════
   MAIN TOOLS
══════════════════════════════════ */
const Tools=()=>{
  const [tab,setTab]=useState('calculator');
  const tabs=[{key:'calculator',label:'Calculators',icon:Calculator},{key:'news',label:'News Feed',icon:Newspaper}];

  return(
    <div className="tp t-in" style={{padding:28,paddingBottom:80,position:'relative',zIndex:1}}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16,marginBottom:26}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:46,height:46,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',
            background:'linear-gradient(135deg,#f59e0b,#ea580c)',boxShadow:'0 0 24px rgba(245,158,11,0.4)',flexShrink:0}}>
            <Wrench size={20} color="#fff"/>
          </div>
          <div>
            <h1 className="S" style={{fontSize:32,fontWeight:800,color:'#f8fafc',letterSpacing:'-0.04em',lineHeight:1,
              textShadow:'0 0 40px rgba(251,146,60,0.2)'}}>Tools</h1>
            <p style={{fontSize:13,color:A,marginTop:4,fontWeight:500}}>Utilities to make smarter decisions</p>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:7,padding:'8px 16px',borderRadius:12,
          background:'rgba(251,146,60,0.06)',border:'1px solid rgba(251,146,60,0.18)'}}>
          <Zap size={13} style={{color:A}}/>
          <span style={{fontSize:11,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',color:A}}>Live Calculators</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:8,marginBottom:24}}>
        {tabs.map(t=><TabBtn key={t.key} active={tab===t.key} onClick={()=>setTab(t.key)} icon={t.icon} label={t.label}/>)}
      </div>

      {/* Content */}
      <div key={tab} className="t-tab">
        {tab==='calculator'&&<CalculatorTab/>}
        {tab==='news'      &&<NewsTab/>}
      </div>
    </div>
  );
};
export default Tools;