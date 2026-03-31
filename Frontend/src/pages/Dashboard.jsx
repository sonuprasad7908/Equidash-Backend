import CandlestickChart from '../components/CandlestickChart';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Bot, X, TrendingUp, TrendingDown, RefreshCw,
  AlertCircle, CheckCircle, Sparkles, Activity,
  BarChart2, Zap, ChevronUp, ChevronDown,
  ArrowUpRight, ArrowDownRight, Target
} from 'lucide-react';
import Chatbot from '../components/Chatbot';
import { API } from '../utils/app';
import useLivePrices from '../utils/useLivePrices';
import usePushAlerts from '../utils/usePushAlerts';

/* ── Simple in-memory API cache (survives tab switches, resets on reload) ── */
const _cache = {};
const _inflight = {};
const cachedFetch = (url, ttlMs = 60_000) => {
  const now = Date.now();
  if (_cache[url] && now - _cache[url].ts < ttlMs) {
    return Promise.resolve(_cache[url].data);
  }
  if (_inflight[url]) return _inflight[url];
  _inflight[url] = fetch(url)
    .then(r => r.json())
    .then(data => {
      _cache[url] = { data, ts: Date.now() };
      delete _inflight[url];
      return data;
    })
    .catch(e => { delete _inflight[url]; throw e; });
  return _inflight[url];
};

/* ─── Tokens ─── */
const T={cyan:'#22d3ee',green:'#34d399',red:'#fb7185',amber:'#fbbf24',violet:'#a78bfa',indigo:'#818cf8',border:'rgba(255,255,255,0.07)'};
const fmt=n=>n?.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtCr=n=>n?(n/10000000).toLocaleString('en-IN',{maximumFractionDigits:0})+'Cr':'N/A';
const fmtM=n=>n?(n/1000000).toFixed(2)+'M':'N/A';

/* ─── Global CSS ─── */
const CSS=`
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Syne:wght@700;800&family=Inter:wght@400;500;600;700;800;900&display=swap');
  .dp{font-family:'Inter',sans-serif;color:#e2e8f0;}
  .dp .M{font-family:'IBM Plex Mono',monospace!important;}
  .dp .S{font-family:'Syne',sans-serif!important;letter-spacing:-0.03em;}
  .dp *{box-sizing:border-box;}

  /* 3D card base */
  .c3{
    background:rgba(9,15,28,0.82);
    border:1px solid rgba(255,255,255,0.07);
    backdrop-filter:blur(24px);
    -webkit-backdrop-filter:blur(24px);
    border-radius:18px;
    transform-style:preserve-3d;
    transition:transform 0.28s cubic-bezier(0.22,1,0.36,1), box-shadow 0.28s ease, border-color 0.28s ease;
    will-change:transform;
  }
  .c3:hover{
    border-color:rgba(34,211,238,0.18);
    box-shadow:0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,211,238,0.08), 0 0 40px rgba(34,211,238,0.06);
  }
  /* SC transition for smooth tilt */
  .SC:hover{
    border-color:rgba(34,211,238,0.2);
  }

  /* Floating 3D animation on cards */
  .c3.float1{animation:float1 6s ease-in-out infinite;}
  .c3.float2{animation:float2 7s ease-in-out infinite;}
  .c3.float3{animation:float3 8s ease-in-out infinite;}
  @keyframes float1{0%,100%{transform:translateY(0) rotateX(0) rotateY(0)} 33%{transform:translateY(-3px) rotateX(0.4deg) rotateY(0.3deg)} 66%{transform:translateY(-1px) rotateX(-0.2deg) rotateY(-0.4deg)}}
  @keyframes float2{0%,100%{transform:translateY(0) rotateX(0) rotateY(0)} 40%{transform:translateY(-4px) rotateX(0.3deg) rotateY(-0.4deg)} 70%{transform:translateY(-2px) rotateX(-0.4deg) rotateY(0.2deg)}}
  @keyframes float3{0%,100%{transform:translateY(0) rotateX(0) rotateY(0)} 50%{transform:translateY(-2px) rotateX(-0.3deg) rotateY(0.5deg)}}

  /* Animations */
  @keyframes dp-up{
    from{opacity:0;transform:translateY(14px)}
    to  {opacity:1;transform:translateY(0)}
  }
  @keyframes dp-sl{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
  @keyframes dp-px{0%,100%{opacity:1}50%{opacity:0.35}}
  @keyframes dp-rot{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  @keyframes dp-scan{0%{top:-2px}100%{top:calc(100% + 2px)}}
  @keyframes dp-fab{0%{box-shadow:0 0 0 0 rgba(34,211,238,0.55)}70%{box-shadow:0 0 0 18px rgba(34,211,238,0)}100%{box-shadow:0 0 0 0 rgba(34,211,238,0)}}
  @keyframes glow-pulse{0%,100%{box-shadow:0 0 20px rgba(34,211,238,0.15)}50%{box-shadow:0 0 40px rgba(34,211,238,0.35)}}
  @keyframes border-glow{0%,100%{border-color:rgba(34,211,238,0.12)}50%{border-color:rgba(34,211,238,0.28)}}

  .A1{animation:dp-up 0.55s cubic-bezier(0.22,1,0.36,1) both;}
  .A2{animation:dp-up 0.45s cubic-bezier(0.22,1,0.36,1) both;}
  .spin{animation:dp-rot 0.75s linear infinite;}
  .px{animation:dp-px 1.4s ease-in-out infinite;}
  .fab-btn{animation:dp-fab 2.8s ease-out infinite;}
  /* Floating cards: wrap content, not the card itself */
  .fw1{animation:float1 6s ease-in-out 0.5s infinite;}
  .fw2{animation:float2 7s ease-in-out 0.5s infinite;}
  .fw3{animation:float3 8s ease-in-out 0.5s infinite;}

  /* Hover rows */
  .HRow{transition:all 0.14s;cursor:pointer;border-radius:12px;border:1px solid transparent;}
  .HRow:hover{background:rgba(34,211,238,0.045)!important;border-color:rgba(34,211,238,0.14)!important;transform:translateX(3px);}

  /* Button hover */
  .HBtn{transition:filter 0.15s,transform 0.15s;}
  .HBtn:hover{filter:brightness(1.14);transform:translateY(-1px);}

  /* Scan line */
  .scan{position:absolute;left:0;right:0;height:1px;
    background:linear-gradient(90deg,transparent,rgba(34,211,238,0.2),transparent);
    animation:dp-scan 6s ease-in-out infinite;pointer-events:none;}

  /* Index card */
  .ICard{transition:all 0.22s cubic-bezier(0.22,1,0.36,1);}
  .ICard:hover{transform:perspective(400px) translateY(-4px) rotateX(2deg);border-color:rgba(255,255,255,0.15)!important;box-shadow:0 12px 32px rgba(0,0,0,0.4);}

  /* Stat card 3D */
  .SC{transition:transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease, border-color 0.25s ease;}

  /* Scrollbar */
  .dp ::-webkit-scrollbar{width:4px;height:4px;}
  .dp ::-webkit-scrollbar-track{background:transparent;}
  .dp ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:8px;}

  /* ── Responsive ── */
  @media(max-width:900px){
    .dp [data-grid="2col"]{grid-template-columns:1fr!important;}
    .dp [data-grid="3col"]{grid-template-columns:repeat(2,1fr)!important;}
    .dp [data-grid="stats"]{grid-template-columns:repeat(2,1fr)!important;}
  }
  @media(max-width:600px){
    .dp [data-grid="3col"]{grid-template-columns:1fr!important;}
    .dp [data-grid="stats"]{grid-template-columns:1fr!important;}
    .dp [data-grid="indices"]{flex-direction:column!important;}
  }
`;

/* ─── 3D Tilt hook ─── */
const useTilt=(str=10)=>{
  const r=useRef(null);
  const mm=e=>{
    try{
      const el=r.current;if(!el)return;
      const rect=el.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      const x=(e.clientX-rect.left)/rect.width-0.5;
      const y=(e.clientY-rect.top)/rect.height-0.5;
      el.style.transform=`perspective(700px) rotateY(${x*str}deg) rotateX(${-y*str}deg) translateZ(4px)`;
      el.style.boxShadow=`${-x*14}px ${-y*14}px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(34,211,238,${0.06+Math.abs(x+y)*0.1})`;
    }catch(e){}
  };
  const ml=()=>{
    try{const el=r.current;if(!el)return;el.style.transform='';el.style.boxShadow='';}catch(e){}
  };
  return{ref:r,onMouseMove:mm,onMouseLeave:ml};
};

/* ─── Canvas particle background ─── */
const ParticleBG=()=>{
  const canvasRef=useRef(null);
  const mountedRef=useRef(true);
  useEffect(()=>{mountedRef.current=true;return()=>{mountedRef.current=false;};},[]);
  useEffect(()=>{
    const c=canvasRef.current;if(!c)return;
    const ctx=c.getContext('2d');
    let W=c.width=window.innerWidth,H=c.height=window.innerHeight;
    const resize=()=>{if(!mountedRef.current)return;W=c.width=window.innerWidth;H=c.height=window.innerHeight;};
    window.addEventListener('resize',resize);

    /* Particles */
    const N=80;
    const pts=Array.from({length:N},()=>({
      x:Math.random()*W,y:Math.random()*H,
      vx:(Math.random()-0.5)*0.3,vy:(Math.random()-0.5)*0.3,
      r:Math.random()*1.5+0.3,
      color:['#22d3ee','#a78bfa','#34d399'][Math.floor(Math.random()*3)],
      alpha:Math.random()*0.4+0.1,
    }));

    let raf;
    const draw=()=>{
      ctx.clearRect(0,0,W,H);
      /* Move */
      pts.forEach(p=>{
        p.x+=p.vx;p.y+=p.vy;
        if(p.x<0||p.x>W)p.vx*=-1;
        if(p.y<0||p.y>H)p.vy*=-1;
      });
      /* Connections */
      for(let i=0;i<N;i++){
        for(let j=i+1;j<N;j++){
          const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y;
          const dist=Math.sqrt(dx*dx+dy*dy);
          if(dist<120){
            ctx.beginPath();
            ctx.moveTo(pts[i].x,pts[i].y);
            ctx.lineTo(pts[j].x,pts[j].y);
            ctx.strokeStyle=`rgba(34,211,238,${(1-dist/120)*0.07})`;
            ctx.lineWidth=0.6;
            ctx.stroke();
          }
        }
      }
      /* Dots */
      pts.forEach(p=>{
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=p.color;
        ctx.globalAlpha=p.alpha;
        ctx.fill();
        ctx.globalAlpha=1;
      });
      if(mountedRef.current)raf=requestAnimationFrame(draw);
    };
    draw();
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);};
  },[]);
  return <canvas ref={canvasRef} style={{position:'fixed',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0,opacity:0.35}}/>;
};

/* ─── Toast ─── */
const Toast=({message,type,onClose})=>{
  useEffect(()=>{const t=setTimeout(onClose,3200);return()=>clearTimeout(t);},[onClose]);
  const ok=type==='success';
  return(
    <div className="A2" style={{position:'fixed',top:22,right:22,zIndex:300,display:'flex',alignItems:'center',gap:10,
      padding:'11px 18px',borderRadius:16,backdropFilter:'blur(24px)',
      background:ok?'rgba(4,22,14,0.97)':'rgba(22,4,4,0.97)',
      border:`1px solid ${ok?'rgba(52,211,153,0.4)':'rgba(251,113,133,0.4)'}`,
      color:ok?T.green:T.red,boxShadow:'0 8px 36px rgba(0,0,0,0.65)'}}>
      {ok?<CheckCircle size={15}/>:<AlertCircle size={15}/>}
      <span style={{fontSize:13,fontWeight:600}}>{message}</span>
      <button onClick={onClose} style={{marginLeft:4,opacity:0.45,background:'none',border:'none',color:'inherit',cursor:'pointer',display:'flex'}}
        onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.45}><X size={13}/></button>
    </div>
  );
};

const Label=({icon:Icon,text,color=T.cyan,mb=14})=>(
  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:mb}}>
    <div style={{width:26,height:26,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:`${color}14`,border:`1px solid ${color}28`,flexShrink:0}}><Icon size={12} style={{color}}/></div>
    <span style={{fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.14em',color:'#64748b'}}>{text}</span>
  </div>
);

const Sk=({w='100%',h=13,r=7})=>(<div className="px" style={{width:w,height:h,borderRadius:r,background:'rgba(255,255,255,0.06)'}}/>);

/* ─── AI Summary ─── */
const AISummary=({marketOverview})=>{
  const [txt,setTxt]=useState('');const [load,setLoad]=useState(false);const [done,setDone]=useState(false);
  const {ref,onMouseMove,onMouseLeave}=useTilt(4);
  const gen=async()=>{
    setLoad(true);
    try{
      const idx=marketOverview?.indices?.map(i=>`${i.name}: ${i.change>=0?'+':''}${i.change?.toFixed(2)}%`).join(', ')||'N/A';
      const g=marketOverview?.gainers?.slice(0,3).map(s=>`${s.ticker} +${s.change?.toFixed(2)}%`).join(', ')||'N/A';
      const l=marketOverview?.losers?.slice(0,3).map(s=>`${s.ticker} ${s.change?.toFixed(2)}%`).join(', ')||'N/A';
      const res=await fetch(`${API}/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:`Professional market summary in 2 short paragraphs.\nIndices: ${idx}\nGainers: ${g}\nLosers: ${l}\nNo markdown.`,ticker:'NIFTY',user_id:'market_summary'})});
      const resData=await res.json();
      setTxt(resData.reply||'');setDone(true);
    }catch{setTxt('Unable to generate summary. Check backend connection.');setDone(true);}
    finally{setLoad(false);}
  };
  return(
    <div ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
      className="c3" style={{padding:22,position:'relative',overflow:'hidden',borderColor:'rgba(129,140,248,0.2)'}}>
      <div style={{position:'absolute',top:-80,right:-60,width:260,height:260,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 65%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:-40,left:-40,width:180,height:180,borderRadius:'50%',background:'radial-gradient(circle,rgba(34,211,238,0.06) 0%,transparent 65%)',pointerEvents:'none'}}/>
      <div className="scan"/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:done||load?18:0,position:'relative',zIndex:1}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:40,height:40,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(129,140,248,0.14)',border:'1px solid rgba(129,140,248,0.3)',animation:'glow-pulse 3s ease-in-out infinite'}}>
            <Sparkles size={18} style={{color:T.indigo}}/>
          </div>
          <div>
            <p className="S" style={{fontSize:16,fontWeight:800,color:'#f8fafc'}}>AI Market Summary</p>
            <p style={{fontSize:10,color:'#475569',marginTop:2}}>Groq LLaMA · Live NSE/BSE Data</p>
          </div>
        </div>
        <button onClick={gen} disabled={load||!marketOverview} className="HBtn"
          style={{display:'flex',alignItems:'center',gap:6,padding:'9px 18px',borderRadius:11,fontSize:12,
            fontWeight:700,cursor:(load||!marketOverview)?'not-allowed':'pointer',
            background:'rgba(129,140,248,0.1)',border:'1px solid rgba(129,140,248,0.32)',
            color:T.indigo,opacity:!marketOverview?0.4:1,whiteSpace:'nowrap',transition:'all 0.18s'}}
          onMouseEnter={e=>{if(!load&&marketOverview){e.currentTarget.style.background=T.indigo;e.currentTarget.style.color='#030712';}}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(129,140,248,0.1)';e.currentTarget.style.color=T.indigo;}}>
          <Sparkles size={12} style={{animation:load?'dp-px 0.9s infinite':'none'}}/>{load?'Analyzing…':done?'Regenerate':'Generate'}
        </button>
      </div>
      {!done&&!load&&(<div style={{display:'flex',alignItems:'center',gap:10,padding:'14px 0',position:'relative',zIndex:1}}>
        <div style={{width:42,height:42,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(129,140,248,0.07)',border:'1px solid rgba(129,140,248,0.15)',flexShrink:0}}><Bot size={18} style={{color:T.indigo,opacity:0.55}}/></div>
        <p style={{fontSize:12,color:'#4b5563',lineHeight:1.6}}>Click Generate for an AI briefing from today's live NSE/BSE data</p>
      </div>)}
      {load&&(<div style={{display:'flex',flexDirection:'column',gap:9,position:'relative',zIndex:1}}>
        <Sk w="100%" h={11}/><Sk w="88%" h={11}/><Sk w="70%" h={11}/>
        <p style={{fontSize:11,color:T.indigo,textAlign:'center',marginTop:6,animation:'dp-px 1s infinite'}}>Analyzing live market data…</p>
      </div>)}
      {done&&!load&&txt&&(<div style={{position:'relative',zIndex:1}}>
        <div style={{height:1,background:'linear-gradient(90deg,transparent,rgba(129,140,248,0.25),transparent)',marginBottom:14}}/>
        <p style={{fontSize:13,color:'#cbd5e1',lineHeight:1.8}}>{txt}</p>
        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:12}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:T.green,flexShrink:0,animation:'dp-px 2s infinite'}}/>
          <p className="M" style={{fontSize:10,color:'#334155'}}>Generated from live NSE/BSE market data</p>
        </div>
      </div>)}
    </div>
  );
};

/* ─── Index card ─── */
const IdxCard=({idx,delay=0})=>{
  const {ref,onMouseMove,onMouseLeave}=useTilt(8);
  const up=idx.change>=0;
  return(
    <div ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
      className="c3 ICard" style={{flex:'1 1 0',minWidth:0,padding:'14px 16px',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:-20,right:-20,width:80,height:80,borderRadius:'50%',background:`radial-gradient(circle,${up?'rgba(52,211,153,0.08)':'rgba(251,113,133,0.08)'} 0%,transparent 70%)`,pointerEvents:'none'}}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,gap:6}}>
        <p style={{fontSize:9,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.14em',fontWeight:700,lineHeight:1.2}}>{idx.name}</p>
        <span style={{fontSize:10,fontWeight:800,padding:'3px 8px',borderRadius:7,flexShrink:0,
          background:up?'rgba(52,211,153,0.12)':'rgba(251,113,133,0.12)',
          border:`1px solid ${up?'rgba(52,211,153,0.25)':'rgba(251,113,133,0.25)'}`,
          color:up?T.green:T.red,display:'flex',alignItems:'center',gap:3}}>
          {up?<ChevronUp size={9}/>:<ChevronDown size={9}/>}{Math.abs(idx.change).toFixed(2)}%
        </span>
      </div>
      <p className="M" style={{fontSize:17,fontWeight:700,color:'#f8fafc',letterSpacing:'-0.02em',lineHeight:1}}>
        {idx.currency||'₹'}{fmt(idx.price)}
      </p>
    </div>
  );
};

/* ─── Stat card ─── */
const StatCard=({icon:Icon,label,value,sub,subColor,accent=T.cyan,delay=0})=>{
  const {ref,onMouseMove,onMouseLeave}=useTilt(10);
  return(
    <div ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
      className="c3 SC" style={{padding:'16px 18px',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:-30,right:-30,width:100,height:100,borderRadius:'50%',background:`radial-gradient(circle,${accent}10 0%,transparent 70%)`,pointerEvents:'none'}}/>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <div style={{width:24,height:24,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',background:`${accent}16`,border:`1px solid ${accent}28`,flexShrink:0}}>
          <Icon size={11} style={{color:accent}}/>
        </div>
        <p style={{fontSize:9,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.14em',fontWeight:700}}>{label}</p>
      </div>
      <p className="M" style={{fontSize:16,fontWeight:700,color:'#f8fafc',letterSpacing:'-0.01em',marginBottom:4,wordBreak:'break-all'}}>{value}</p>
      <p style={{fontSize:10,fontWeight:600,color:subColor||'#334155'}}>{sub||'—'}</p>
    </div>
  );
};

/* ─── Mover row ─── */
const MRow=({stock,active,onClick,isGainer,isLive=false,delay=0})=>(
  <div className="HRow" onClick={onClick}
    style={{display:'flex',justifyContent:'space-between',alignItems:'center',
      padding:'9px 10px',marginBottom:2,borderRadius:11,
      background:active?'rgba(34,211,238,0.06)':'transparent',
      border:`1px solid ${active?'rgba(34,211,238,0.18)':'transparent'}`,
      transition:'all 0.15s'}}>
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <span style={{width:7,height:7,borderRadius:'50%',flexShrink:0,
        background:active?T.cyan:(isGainer?T.green:T.red),
        boxShadow:active?`0 0 8px ${T.cyan}`:'none',
        animation:isLive&&!active?'dp-px 2s ease-in-out infinite':'none'}}/>
      <span style={{fontSize:13,fontWeight:800,color:active?T.cyan:'#e2e8f0'}}>{stock.ticker}</span>
      {isLive&&<span style={{fontSize:8,fontWeight:900,color:T.green,opacity:0.7,letterSpacing:'0.08em'}}>●</span>}
    </div>
    <div style={{textAlign:'right'}}>
      <p className="M" style={{fontSize:13,fontWeight:700,color:'#f8fafc',letterSpacing:'-0.01em'}}>₹{fmt(stock.price)}</p>
      <p className="M" style={{fontSize:11,fontWeight:800,
        color:isGainer?T.green:T.red}}>{isGainer?'+':''}{stock.change?.toFixed(2)}%</p>
    </div>
  </div>
);

/* ─── Tech card ─── */
const TechBox=({label,value,sub,color,barPct,delay=0})=>{
  const {ref,onMouseMove,onMouseLeave}=useTilt(8);
  return(
    <div ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
      className="c3 SC" style={{padding:'18px 16px',textAlign:'center'}}>
      <p style={{fontSize:9,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.15em',fontWeight:700,marginBottom:12}}>{label}</p>
      <p className="M" style={{fontSize:24,fontWeight:700,color,marginBottom:8,letterSpacing:'-0.02em'}}>{value}</p>
      {barPct!==undefined&&(
        <div style={{height:4,borderRadius:99,background:'rgba(255,255,255,0.07)',overflow:'hidden',marginBottom:8}}>
          <div style={{height:'100%',borderRadius:99,background:`linear-gradient(90deg,${color},${color}aa)`,width:`${barPct}%`,transition:'width 1.2s cubic-bezier(0.22,1,0.36,1)',boxShadow:`0 0 8px ${color}80`}}/>
        </div>
      )}
      <p style={{fontSize:11,color:'#475569',fontWeight:600}}>{sub}</p>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════ */
const Dashboard=({user})=>{
  const [ticker,setTicker]=useState('RELIANCE');
  const [stockData,setStockData]=useState(null);
  const [marketOverview,setMarketOverview]=useState(null);
  const [globalIndices,setGlobalIndices]=useState(null);
  const [prediction,setPrediction]=useState(null);
  const [loading,setLoading]=useState(false);
  const [mktLoad,setMktLoad]=useState(false);
  const [predLoad,setPredLoad]=useState(false);
  const [showModal,setShowModal]=useState(false);
  const [tradeAction,setTradeAction]=useState('BUY');
  const [tradeQty,setTradeQty]=useState('');
  const [showBot,setShowBot]=useState(false);
  const [toast,setToast]=useState(null);
  const [active,setActive]=useState('RELIANCE');
  const [iTab,setITab]=useState('indian');
  const [sFocus,setSFocus]=useState(false);
  const [chartPeriod,setChartPeriod]=useState('1Y');
  const searchRef=useRef(null);

  /* ── Keyboard shortcut Ctrl+K / Cmd+K to focus search ── */
  useEffect(()=>{
    const handler=e=>{
      if((e.ctrlKey||e.metaKey)&&e.key==='k'){
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown',handler);
    return()=>window.removeEventListener('keydown',handler);
  },[]);

  /* ── Real-time prices (SSE → polling fallback) ── */
  const WATCH_TICKERS=['RELIANCE','TCS','HDFCBANK','ICICIBANK','INFY','SBIN','BHARTIARTL','ITC'];
  const {prices:livePrices, connected:liveConnected} = useLivePrices(WATCH_TICKERS);

  /* ── Push alert notifications ── */
  usePushAlerts(user?.id);
  const tickRef=useRef(ticker);tickRef.current=ticker;
  const say=(msg,type='success')=>setToast({message:msg,type});

  const {ref:chartRef,onMouseMove:chartMM,onMouseLeave:chartML}=useTilt(3);
  const {ref:heroRef,onMouseMove:heroMM,onMouseLeave:heroML}=useTilt(4);

  const loadMkt=useCallback(async()=>{
    setMktLoad(true);
    try{const[ov,gl]=await Promise.all([cachedFetch(`${API}/market/overview`,60_000),cachedFetch(`${API}/market/global-indices`,60_000)]);
      setMarketOverview(ov);setGlobalIndices(gl);}
    catch{}finally{setMktLoad(false);}
  },[]);

  const loadStock=useCallback(async t=>{
    const sym=(t||tickRef.current).trim().toUpperCase();
    setLoading(true);setPrediction(null);
    try{const d=await cachedFetch(`${API}/stock/${sym}`,30_000);setStockData(d);setActive(sym);}
    catch{say(`"${sym}" not found`,'error');}
    finally{setLoading(false);}
  },[]);

  /* ── Live market SSE — declared after loadMkt so it's in scope ── */
  const mktSseRef = useRef(null);
  useEffect(()=>{
    const url=`${API}/stream/market`;
    const open=()=>{
      if(mktSseRef.current) mktSseRef.current.close();
      const es=new EventSource(url);
      mktSseRef.current=es;
      es.onmessage=e=>{try{const d=JSON.parse(e.data);setMarketOverview(d);}catch{}};
      es.onerror=()=>{es.close();mktSseRef.current=null;};
    };
    loadMkt();   // initial REST load
    open();      // then SSE takes over live updates
    return()=>{if(mktSseRef.current)mktSseRef.current.close();};
  },[loadMkt]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{loadStock('RELIANCE');},[]);

  const doPred=async()=>{
    setPredLoad(true);
    try{const r=await fetch(`${API}/stock/${active}/predict`);const d=await r.json();setPrediction(d);}
    catch{say('AI Forecast failed','error');}
    finally{setPredLoad(false);}
  };

  const doTrade=async()=>{
    if(!tradeQty||tradeQty<=0){say('Enter a valid quantity','error');return;}
    try{
      const r=await fetch(`${API}/trade/execute`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:user.id,action:tradeAction,ticker:stockData.ticker,quantity:parseFloat(tradeQty),price:stockData.price})});
      const rd=await r.json();
      if(rd.status==='success'){say(`${tradeAction} executed! 🎉`);setShowModal(false);setTradeQty('');}
    }catch(e){say('Trade failed: '+(e.response?.data?.detail||e.message),'error');}
  };

  const clickTicker=t=>{setTicker(t);loadStock(t);};
  const indices=iTab==='indian'?marketOverview?.indices:globalIndices;
  const up=(stockData?.change||0)>=0;
  const recClr=rec=>{if(!rec)return T.cyan;if(rec.includes('BUY'))return T.green;if(rec.includes('SELL'))return T.red;return T.amber;};
  const sentiment=(()=>{
    if(!marketOverview)return null;
    const all=[...(marketOverview.gainers||[]),...(marketOverview.losers||[])];
    const n=all.filter(s=>s.change>0).length;
    const pct=all.length?Math.round((n/all.length)*100):50;
    return{pct,isBull:pct>=50};
  })();

  return(
    <div className="dp A1" style={{paddingBottom:100,position:'relative'}}>
      <style>{CSS}</style>
      <ParticleBG/>
      {toast&&<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}

      {/* ── HEADER ── */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16,marginBottom:28,position:'relative',zIndex:2}}>
        <div>
          <h1 className="S" style={{fontSize:34,fontWeight:800,color:'#f8fafc',lineHeight:1,marginBottom:5,
            textShadow:'0 0 40px rgba(34,211,238,0.2)'}}>Market Terminal</h1>
          <div style={{display:'flex',alignItems:'center',gap:8,marginTop:5}}>
            <p style={{fontSize:13,color:T.cyan,fontWeight:500,letterSpacing:'0.01em'}}>AI Insights & Execution Engine</p>
            <div style={{display:'flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:99,
              background:liveConnected?'rgba(52,211,153,0.1)':'rgba(255,255,255,0.04)',
              border:`1px solid ${liveConnected?'rgba(52,211,153,0.25)':'rgba(255,255,255,0.08)'}`}}>
              <span style={{width:5,height:5,borderRadius:'50%',background:liveConnected?T.green:'#475569',
                animation:liveConnected?'dp-px 1.5s infinite':'none'}}/>
              <span style={{fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.12em',
                color:liveConnected?T.green:'#475569'}}>{liveConnected?'Live':'Delayed'}</span>
            </div>
          </div>
        </div>
        <div style={{display:'flex',gap:8,flex:'0 1 440px',minWidth:0}}>
          <div style={{position:'relative',flex:1,minWidth:0}}>
            <Search size={14} style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:sFocus?T.cyan:'#4b5563',transition:'color 0.18s',pointerEvents:'none'}}/>
            <input ref={searchRef} value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())}
              onKeyPress={e=>e.key==='Enter'&&loadStock()}
              onFocus={()=>setSFocus(true)} onBlur={()=>setSFocus(false)}
              placeholder="Ticker… e.g. TCS" className="M"
              style={{width:'100%',paddingLeft:38,paddingRight:60,paddingTop:10,paddingBottom:10,
                borderRadius:12,background:'rgba(8,14,26,0.9)',
                border:`1px solid ${sFocus?'rgba(34,211,238,0.5)':T.border}`,
                color:'#f8fafc',fontSize:13,outline:'none',
                boxShadow:sFocus?'0 0 0 4px rgba(34,211,238,0.09)':'none',
                transition:'all 0.18s',caretColor:T.cyan}}/>
            {/* Keyboard hint */}
            <div style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',
              display:'flex',alignItems:'center',gap:2,opacity:sFocus?0:0.4,transition:'opacity 0.18s'}}>
              <kbd style={{fontSize:9,fontFamily:'inherit',padding:'2px 5px',borderRadius:4,
                background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',color:'#475569'}}>⌘K</kbd>
            </div>
          </div>
          <button onClick={()=>loadStock()} disabled={loading} className="HBtn"
            style={{padding:'10px 22px',borderRadius:12,fontWeight:900,fontSize:13,
              letterSpacing:'0.06em',color:'#030712',cursor:'pointer',
              background:'linear-gradient(135deg,#22d3ee,#3b82f6)',border:'none',
              boxShadow:'0 0 20px rgba(34,211,238,0.35)',opacity:loading?0.55:1,whiteSpace:'nowrap'}}>
            {loading?'…':'SEARCH'}
          </button>
        </div>
      </div>

      {/* ── AI SUMMARY ── */}
      <div style={{marginBottom:24,position:'relative',zIndex:2}}>
        <AISummary marketOverview={marketOverview}/>
      </div>

      {/* ── INDICES ── */}
      <div style={{marginBottom:26,position:'relative',zIndex:2}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
          {[['indian','🇮🇳 Indian'],['global','🌐 Global']].map(([k,l])=>(
            <button key={k} onClick={()=>setITab(k)} className="HBtn"
              style={{fontSize:11,fontWeight:800,padding:'6px 14px',borderRadius:9,cursor:'pointer',border:'none',
                background:iTab===k?'linear-gradient(135deg,#22d3ee,#3b82f6)':'rgba(255,255,255,0.05)',
                color:iTab===k?'#030712':'#64748b',transition:'all 0.15s'}}>{l}</button>
          ))}
          <button onClick={loadMkt} className="HBtn"
            style={{marginLeft:'auto',width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',
              borderRadius:9,background:'rgba(255,255,255,0.04)',border:`1px solid ${T.border}`,
              color:'#4b5563',cursor:'pointer',transition:'color 0.15s'}}
            onMouseEnter={e=>e.currentTarget.style.color=T.cyan}
            onMouseLeave={e=>e.currentTarget.style.color='#4b5563'}>
            <RefreshCw size={13} className={mktLoad?'spin':''}/>
          </button>
        </div>
        <div data-grid='indices' style={{display:'flex',gap:10}}>
          {mktLoad?[1,2,3,4].map(i=>(
            <div key={i} className="c3" style={{flex:'1 1 0',padding:'16px 18px'}}>
              <Sk w="55%" h={10}/><div style={{height:10}}/><Sk w="75%" h={17}/>
            </div>
          )):indices?.map((idx,i)=><IdxCard key={idx.name+i} idx={idx} delay={i*55}/>)}
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div data-grid='2col' style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 260px',gap:18,alignItems:'start',position:'relative',zIndex:2}}>

        {/* LEFT */}
        <div style={{display:'flex',flexDirection:'column',gap:18,minWidth:0}}>

          {/* Stock hero */}
          {(stockData||loading)&&(
            <div ref={heroRef} onMouseMove={heroMM} onMouseLeave={heroML}
              className="c3" style={{padding:0,overflow:'hidden',
                borderColor:!loading?(up?'rgba(52,211,153,0.2)':'rgba(251,113,133,0.2)'):T.border}}>
              <div style={{height:3,background:!loading
                ?(up?'linear-gradient(90deg,transparent,#34d399 50%,#22d3ee)':'linear-gradient(90deg,transparent,#fb7185 50%,#f97316)')
                :'rgba(255,255,255,0.06)'}}/>
              <div style={{padding:'20px 22px'}}>
                {loading?(
                  <div style={{display:'flex',gap:16,alignItems:'center'}}>
                    <div style={{width:52,height:52,borderRadius:14,background:'rgba(255,255,255,0.06)'}} className="px"/>
                    <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}><Sk w="45%" h={18}/><Sk w="25%" h={11}/></div>
                    <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end'}}><Sk w={80} h={22}/><Sk w={60} h={11}/></div>
                  </div>
                ):(
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
                      <div style={{display:'flex',alignItems:'center',gap:14,flex:'1 1 220px',minWidth:0}}>
                        <div style={{width:54,height:54,borderRadius:15,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
                          background:'linear-gradient(135deg,rgba(34,211,238,0.18),rgba(59,130,246,0.1))',
                          border:'1px solid rgba(34,211,238,0.28)',fontSize:15,fontWeight:900,color:T.cyan,
                          fontFamily:'IBM Plex Mono,monospace',boxShadow:'0 0 20px rgba(34,211,238,0.2)',
                          animation:'glow-pulse 3s ease-in-out infinite'}}>
                          {stockData.ticker?.slice(0,2)}
                        </div>
                        <div style={{minWidth:0}}>
                          <h2 className="S" style={{fontSize:19,fontWeight:800,color:'#f8fafc',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginBottom:3}}>{stockData.name||stockData.ticker}</h2>
                          <p className="M" style={{fontSize:11,color:'#4b5563'}}>{stockData.ticker} · NSE</p>
                        </div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:14,flexShrink:0}}>
                        <div style={{textAlign:'right'}}>
                          {(()=>{
                            const lp=livePrices[stockData?.ticker];
                            const dp=lp?.price||stockData.price;
                            const dc=lp?.change??stockData.change;
                            const dup=dc>=0;
                            return(<>
                              <div style={{display:'flex',alignItems:'baseline',gap:6}}>
                                <p className="M" style={{fontSize:28,fontWeight:700,color:'#f8fafc',letterSpacing:'-0.04em',lineHeight:1}}>₹{fmt(dp)}</p>
                                {lp&&<span style={{fontSize:9,fontWeight:800,padding:'2px 6px',borderRadius:99,color:T.green,background:'rgba(52,211,153,0.1)',border:'1px solid rgba(52,211,153,0.2)',animation:'dp-px 2s infinite'}}>LIVE</span>}
                              </div>
                              <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:4,marginTop:5}}>
                                {dup?<ArrowUpRight size={14} style={{color:T.green}}/>:<ArrowDownRight size={14} style={{color:T.red}}/>}
                                <span className="M" style={{fontSize:13,fontWeight:800,color:dup?T.green:T.red}}>{dup?'+':''}{dc?.toFixed(2)}%</span>
                              </div>
                            </>);
                          })()}
                        </div>
                        <button onClick={()=>{setTradeAction('BUY');setShowModal(true);}} className="HBtn"
                          style={{padding:'11px 22px',borderRadius:11,fontWeight:900,fontSize:13,letterSpacing:'0.05em',border:'none',cursor:'pointer',color:'#fff',background:'linear-gradient(135deg,#15803d,#16a34a)',boxShadow:'0 0 20px rgba(22,163,74,0.42)'}}>▲ BUY</button>
                        <button onClick={()=>{setTradeAction('SELL');setShowModal(true);}} className="HBtn"
                          style={{padding:'11px 22px',borderRadius:11,fontWeight:900,fontSize:13,letterSpacing:'0.05em',border:'none',cursor:'pointer',color:'#fff',background:'linear-gradient(135deg,#b91c1c,#dc2626)',boxShadow:'0 0 20px rgba(220,38,38,0.42)'}}>▼ SELL</button>
                      </div>
                    </div>
                    {/* Day Range Bar */}
                    {stockData.week_52_low&&stockData.week_52_high&&(()=>{
                      const lo=stockData.week_52_low,hi=stockData.week_52_high,cur=stockData.price;
                      const pct=Math.min(100,Math.max(0,((cur-lo)/(hi-lo))*100));
                      return(
                        <div style={{marginTop:14,padding:'10px 14px',borderRadius:12,background:'rgba(255,255,255,0.025)',border:`1px solid ${T.border}`}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:7}}>
                            <span style={{fontSize:9,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:700}}>52W Range</span>
                            <span className="M" style={{fontSize:10,color:'#64748b'}}>₹{fmt(cur)} ({pct.toFixed(1)}%)</span>
                          </div>
                          <div style={{height:5,borderRadius:99,background:'rgba(255,255,255,0.07)',overflow:'visible',position:'relative'}}>
                            <div style={{height:'100%',borderRadius:99,width:`${pct}%`,background:`linear-gradient(90deg,${T.red},${T.amber},${T.green})`,transition:'width 1.2s cubic-bezier(0.22,1,0.36,1)'}}/>
                            <div style={{position:'absolute',top:'50%',left:`${pct}%`,transform:'translate(-50%,-50%)',
                              width:11,height:11,borderRadius:'50%',background:'#f8fafc',border:`2px solid ${up?T.green:T.red}`,
                              boxShadow:`0 0 8px ${up?T.green:T.red}`,transition:'left 1.2s cubic-bezier(0.22,1,0.36,1)'}}/>
                          </div>
                          <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
                            <span className="M" style={{fontSize:10,color:T.red}}>₹{fmt(lo)}</span>
                            <span className="M" style={{fontSize:10,color:T.green}}>₹{fmt(hi)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3×2 Stat grid */}
          {!loading&&stockData&&(
            <div data-grid='stats' style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
              <StatCard icon={TrendingUp} label="Current Price" accent={up?T.green:T.red} value={`₹${fmt(stockData.price)}`} sub={`${stockData.change>=0?'+':''}${stockData.change?.toFixed(2)}% today`} subColor={stockData.change>=0?T.green:T.red} delay={0}/>
              <StatCard icon={BarChart2} label="Market Cap" accent={T.cyan} value={`₹${fmtCr(stockData.market_cap)}`} sub="Total capitalisation" delay={60}/>
              <StatCard icon={Activity} label="Volume" accent={T.violet} value={fmtM(stockData.volume)} sub="Shares traded today" delay={120}/>
              <StatCard icon={Target} label="P/E Ratio" accent={T.amber} value={stockData.pe_ratio?stockData.pe_ratio.toFixed(2):'N/A'} sub="Trailing price/earnings" delay={180}/>
              <StatCard icon={ChevronUp} label="52W High" accent={T.green} value={stockData.week_52_high?`₹${fmt(stockData.week_52_high)}`:'N/A'} sub={stockData.week_52_high?`${(((stockData.price-stockData.week_52_high)/stockData.week_52_high)*100).toFixed(1)}% from high`:''} subColor={T.red} delay={240}/>
              <StatCard icon={ChevronDown} label="52W Low" accent={T.red} value={stockData.week_52_low?`₹${fmt(stockData.week_52_low)}`:'N/A'} sub={stockData.week_52_low?`+${(((stockData.price-stockData.week_52_low)/stockData.week_52_low)*100).toFixed(1)}% from low`:''} subColor={T.green} delay={300}/>
            </div>
          )}
          {loading&&(<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
            {[1,2,3,4,5,6].map(i=>(<div key={i} className="c3" style={{padding:'16px 18px'}}><Sk w="55%" h={10}/><div style={{height:10}}/><Sk h={16}/><div style={{height:7}}/><Sk w="65%" h={10}/></div>))}
          </div>)}

          {/* Chart */}
          <div ref={chartRef} onMouseMove={chartMM} onMouseLeave={chartML} className="c3" style={{overflow:'hidden'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px 14px',borderBottom:`1px solid ${T.border}`,flexWrap:'wrap',gap:10}}>
              <div style={{display:'flex',alignItems:'center',gap:14,flex:1,minWidth:0}}>
                <div>
                  <p className="S" style={{fontSize:16,fontWeight:800,color:'#f8fafc'}}>{stockData?.ticker||'Chart'}</p>
                  <p style={{fontSize:10,color:'#334155',marginTop:3}}>Candlestick · {chartPeriod}</p>
                </div>
                {/* Period selector */}
                <div style={{display:'flex',gap:3,padding:'3px',borderRadius:9,background:'rgba(255,255,255,0.04)',border:`1px solid ${T.border}`}}>
                  {['1W','1M','3M','1Y'].map(p=>(
                    <button key={p} onClick={()=>setChartPeriod(p)} className="HBtn"
                      style={{fontSize:10,fontWeight:800,padding:'4px 9px',borderRadius:6,cursor:'pointer',border:'none',
                        background:chartPeriod===p?'linear-gradient(135deg,rgba(34,211,238,0.2),rgba(59,130,246,0.15))':'transparent',
                        color:chartPeriod===p?T.cyan:'#4b5563',
                        boxShadow:chartPeriod===p?`0 0 8px ${T.cyan}40`:'none',
                        transition:'all 0.15s'}}>{p}</button>
                  ))}
                </div>
              </div>
              <button onClick={doPred} disabled={predLoad||!stockData} className="HBtn"
                style={{display:'flex',alignItems:'center',gap:7,padding:'8px 16px',borderRadius:10,fontSize:12,fontWeight:700,cursor:(!stockData||predLoad)?'not-allowed':'pointer',background:'rgba(129,140,248,0.09)',border:'1px solid rgba(129,140,248,0.28)',color:T.indigo,opacity:!stockData?0.4:1,transition:'all 0.18s',flexShrink:0}}
                onMouseEnter={e=>{if(stockData&&!predLoad){e.currentTarget.style.background=T.indigo;e.currentTarget.style.color='#030712';}}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(129,140,248,0.09)';e.currentTarget.style.color=T.indigo;}}>
                <Bot size={13} style={{animation:predLoad?'dp-px 0.8s infinite':'none'}}/>{predLoad?'Analyzing…':'AI Forecast'}
              </button>
            </div>
            <div style={{padding:'0 4px 4px'}}>
              {loading?(<div style={{height:340,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14}}>
                <div className="spin" style={{width:32,height:32,borderRadius:'50%',border:'2px solid rgba(34,211,238,0.14)',borderTopColor:T.cyan}}/>
                <p className="px" style={{fontSize:12,color:'#4b5563'}}>Fetching market data…</p>
              </div>):stockData?(<div style={{height:340}}><CandlestickChart chartData={stockData.chart_data}/></div>)
              :(<div style={{height:340,display:'flex',alignItems:'center',justifyContent:'center'}}><p style={{fontSize:13,color:'#334155'}}>Search for a ticker to view charts</p></div>)}
            </div>
            {prediction&&!prediction.error&&(
              <div style={{margin:'0 20px 20px',padding:20,borderRadius:16,background:`${recClr(prediction.recommendation)}07`,border:`1px solid ${recClr(prediction.recommendation)}22`,animation:'dp-up 0.4s ease both'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                  <Bot size={15} style={{color:recClr(prediction.recommendation)}}/>
                  <span style={{fontSize:13,fontWeight:700,color:'#f8fafc'}}>EquiDash AI Analysis</span>
                  <span style={{marginLeft:'auto',fontSize:11,fontWeight:900,padding:'3px 11px',borderRadius:99,background:`${recClr(prediction.recommendation)}16`,border:`1px solid ${recClr(prediction.recommendation)}32`,color:recClr(prediction.recommendation)}}>{prediction.recommendation}</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:14}}>
                  {[{l:'7D Target',v:`₹${fmt(prediction.prediction_7d)}`},{l:'30D Target',v:`₹${fmt(prediction.prediction_30d)}`},{l:'Confidence',v:`${prediction.confidence?.toFixed(0)}%`}].map(({l,v})=>(
                    <div key={l} style={{padding:'12px 8px',borderRadius:10,background:'rgba(0,0,0,0.22)',textAlign:'center'}}>
                      <p style={{fontSize:9,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:700,marginBottom:6}}>{l}</p>
                      <p className="M" style={{fontSize:14,fontWeight:700,color:'#f8fafc'}}>{v}</p>
                    </div>
                  ))}
                </div>
                {/* Confidence bar */}
                {prediction.confidence&&(
                  <div style={{marginBottom:14}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                      <span style={{fontSize:10,color:'#4b5563',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em'}}>Confidence</span>
                      <span className="M" style={{fontSize:11,fontWeight:700,color:recClr(prediction.recommendation)}}>{prediction.confidence.toFixed(1)}%</span>
                    </div>
                    <div style={{height:6,borderRadius:99,background:'rgba(255,255,255,0.07)',overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:99,width:`${prediction.confidence}%`,
                        background:`linear-gradient(90deg,${recClr(prediction.recommendation)},${recClr(prediction.recommendation)}bb)`,
                        boxShadow:`0 0 10px ${recClr(prediction.recommendation)}60`,
                        transition:'width 1.2s cubic-bezier(0.22,1,0.36,1)'}}/>
                    </div>
                  </div>
                )}
                <p style={{fontSize:13,color:'#cbd5e1',lineHeight:1.72}}>{prediction.reasoning}</p>
              </div>
            )}
          </div>

          {/* Technical Indicators */}
          {stockData?.indicators&&(
            <div>
              <Label icon={Activity} text="Technical Indicators" color={T.violet}/>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                <TechBox label="RSI (14)" value={stockData.indicators.rsi?.toFixed(1)} color={stockData.indicators.rsi>70?T.red:stockData.indicators.rsi<30?T.green:'#f8fafc'} sub={stockData.indicators.rsi>70?'Overbought':stockData.indicators.rsi<30?'Oversold':'Neutral'} barPct={Math.min(100,stockData.indicators.rsi||50)} delay={0}/>
                <TechBox label="MACD" value={`${stockData.indicators.macd>0?'+':''}${stockData.indicators.macd?.toFixed(2)}`} color={stockData.indicators.macd>0?T.green:T.red} sub={stockData.indicators.macd>0?'Bullish Signal':'Bearish Signal'} delay={80}/>
                <TechBox label="SMA 20" value={`₹${fmt(stockData.indicators.sma_20)}`} color="#f8fafc" sub={stockData.price>stockData.indicators.sma_20?'Price above SMA ↑':'Price below SMA ↓'} delay={160}/>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{display:'flex',flexDirection:'column',gap:14,minWidth:0}}>
          {sentiment&&(
            <div className="c3" style={{padding:18,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:2,
                background:`linear-gradient(90deg,transparent,${sentiment.isBull?T.green:T.red},transparent)`,
                opacity:0.6}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                <Label icon={Zap} text="Sentiment" color={sentiment.isBull?T.green:T.red}/>
                {liveConnected&&<span style={{fontSize:8,fontWeight:800,padding:'2px 6px',borderRadius:99,
                  color:T.green,background:'rgba(52,211,153,0.1)',border:'1px solid rgba(52,211,153,0.2)',
                  textTransform:'uppercase',letterSpacing:'0.1em',animation:'dp-px 2s infinite'}}>live</span>}
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:7}}>
                <span className="M" style={{fontSize:12,fontWeight:800,color:T.green}}>▲ {sentiment.pct}%</span>
                <span className="M" style={{fontSize:12,fontWeight:800,color:T.red}}>▼ {100-sentiment.pct}%</span>
              </div>
              <div style={{height:8,borderRadius:99,background:'rgba(251,113,133,0.18)',overflow:'hidden',marginBottom:10,position:'relative'}}>
                <div style={{height:'100%',borderRadius:99,
                  width:`${sentiment.pct}%`,
                  background:`linear-gradient(90deg,${T.green},${T.cyan})`,
                  transition:'width 1.4s cubic-bezier(0.22,1,0.36,1)',
                  boxShadow:`0 0 12px ${T.cyan}50`}}/>
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:16}}>{sentiment.isBull?'📈':'📉'}</span>
                  <p style={{fontSize:12,fontWeight:800,color:sentiment.isBull?T.green:T.red}}>
                    {sentiment.isBull?'Bullish':'Bearish'} today
                  </p>
                </div>
                <div style={{display:'flex',gap:10}}>
                  {[{l:'Bull',v:sentiment.pct+'%',c:T.green},{l:'Bear',v:(100-sentiment.pct)+'%',c:T.red}].map(({l,v,c})=>(
                    <div key={l} style={{textAlign:'center'}}>
                      <p style={{fontSize:8,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:700}}>{l}</p>
                      <p className="M" style={{fontSize:12,fontWeight:700,color:c}}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {marketOverview&&(
            <div className="c3" style={{padding:18}}>
              <Label icon={TrendingUp} text="Top Movers" color={T.green}/>
              {marketOverview.gainers.map((s,i)=>{
                const lp=livePrices[s.ticker];
                const stock=lp?{...s,price:lp.price,change:lp.change}:s;
                const maxChange=Math.max(...marketOverview.gainers.map(g=>Math.abs(g.change||0)),0.1);
                const barW=Math.min(100,(Math.abs(stock.change||0)/maxChange)*100);
                return(
                  <div key={s.ticker} style={{position:'relative',marginBottom:2}}>
                    {/* Mini % bar behind row */}
                    <div style={{position:'absolute',inset:0,borderRadius:11,background:T.green,opacity:0.04,width:`${barW}%`,transition:'width 0.8s ease',pointerEvents:'none'}}/>
                    <MRow stock={stock} active={active===s.ticker} onClick={()=>clickTicker(s.ticker)} isGainer={true} isLive={!!lp} delay={i*40}/>
                  </div>
                );
              })}
            </div>
          )}
          {marketOverview&&(
            <div className="c3" style={{padding:18}}>
              <Label icon={TrendingDown} text="Highest Drawdowns" color={T.red}/>
              {marketOverview.losers.map((s,i)=>{
                const lp=livePrices[s.ticker];
                const stock=lp?{...s,price:lp.price,change:lp.change}:s;
                const maxChange=Math.max(...marketOverview.losers.map(g=>Math.abs(g.change||0)),0.1);
                const barW=Math.min(100,(Math.abs(stock.change||0)/maxChange)*100);
                return(
                  <div key={s.ticker} style={{position:'relative',marginBottom:2}}>
                    <div style={{position:'absolute',inset:0,borderRadius:11,background:T.red,opacity:0.04,width:`${barW}%`,transition:'width 0.8s ease',pointerEvents:'none'}}/>
                    <MRow stock={stock} active={active===s.ticker} onClick={()=>clickTicker(s.ticker)} isGainer={false} isLive={!!lp} delay={i*40}/>
                  </div>
                );
              })}
            </div>
          )}
          {stockData&&!loading&&(
            <div className="c3" style={{padding:18}}>
              <Label icon={BarChart2} text="Quick Stats" color={T.cyan}/>
              {[{l:'Market Cap',v:`₹${fmtCr(stockData.market_cap)}`},{l:'Volume',v:fmtM(stockData.volume)},{l:'P/E Ratio',v:stockData.pe_ratio?.toFixed(2)||'N/A'},{l:'52-Week High',v:`₹${fmt(stockData.week_52_high)}`},{l:'52-Week Low',v:`₹${fmt(stockData.week_52_low)}`}].map(({l,v},i)=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<4?`1px solid ${T.border}`:'none'}}>
                  <span style={{fontSize:11,color:'#4b5563'}}>{l}</span>
                  <span className="M" style={{fontSize:12,fontWeight:700,color:'#f8fafc'}}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TRADE MODAL */}
      {showModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(12px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}} onClick={e=>{if(e.target===e.currentTarget)setShowModal(false);}}>
          <div className="c3" style={{width:370,overflow:'hidden',border:`1px solid ${tradeAction==='BUY'?'rgba(52,211,153,0.3)':'rgba(251,113,133,0.3)'}`}}>
            <div style={{height:3,background:tradeAction==='BUY'?'linear-gradient(90deg,#15803d,#22d3ee)':'linear-gradient(90deg,#b91c1c,#f97316)'}}/>
            <div style={{padding:'22px 24px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                <p className="S" style={{fontSize:18,fontWeight:800,color:'#f8fafc'}}>Execute {tradeAction}</p>
                <button onClick={()=>setShowModal(false)} style={{width:30,height:30,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.05)',border:`1px solid ${T.border}`,color:'#4b5563',cursor:'pointer',transition:'all 0.18s'}}
                  onMouseEnter={e=>{e.currentTarget.style.color='#f8fafc';e.currentTarget.style.transform='rotate(90deg)';}} onMouseLeave={e=>{e.currentTarget.style.color='#4b5563';e.currentTarget.style.transform='rotate(0)';}}><X size={15}/></button>
              </div>
              <div style={{padding:'14px 16px',borderRadius:13,background:'rgba(255,255,255,0.025)',border:`1px solid ${T.border}`,marginBottom:18}}>
                <p className="M" style={{fontSize:15,fontWeight:700,color:T.cyan,marginBottom:2}}>{stockData?.ticker}</p>
                {stockData?.name&&<p style={{fontSize:11,color:'#4b5563',marginBottom:7}}>{stockData.name}</p>}
                <p className="M" style={{fontSize:22,fontWeight:700,color:'#f8fafc'}}>₹{fmt(stockData?.price)}</p>
              </div>
              <label style={{fontSize:10,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.13em',fontWeight:700,display:'block',marginBottom:8}}>Quantity</label>
              <input type="number" value={tradeQty} onChange={e=>setTradeQty(e.target.value)} placeholder="0" min="1" className="M"
                style={{width:'100%',padding:'13px 16px',borderRadius:11,background:'rgba(8,14,26,0.9)',border:`1px solid ${T.border}`,color:'#f8fafc',fontSize:20,fontWeight:700,textAlign:'center',outline:'none',transition:'border-color 0.18s',marginBottom:14}}
                onFocus={e=>e.target.style.borderColor=tradeAction==='BUY'?'rgba(52,211,153,0.5)':'rgba(251,113,133,0.5)'}
                onBlur={e=>e.target.style.borderColor=T.border}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px 14px',borderRadius:11,marginBottom:18,background:`${tradeAction==='BUY'?T.green:T.red}09`,border:`1px solid ${tradeAction==='BUY'?T.green:T.red}22`}}>
                <span style={{fontSize:12,color:'#4b5563'}}>Total Value</span>
                <span className="M" style={{fontSize:17,fontWeight:800,color:tradeAction==='BUY'?T.green:T.red}}>₹{fmt((stockData?.price*parseFloat(tradeQty||0))||0)}</span>
              </div>
              <button onClick={doTrade} className="HBtn"
                style={{width:'100%',padding:'14px 0',borderRadius:13,fontWeight:900,fontSize:15,letterSpacing:'0.06em',border:'none',color:'#fff',cursor:'pointer',
                  background:tradeAction==='BUY'?'linear-gradient(135deg,#15803d,#16a34a)':'linear-gradient(135deg,#b91c1c,#dc2626)',
                  boxShadow:tradeAction==='BUY'?'0 0 28px rgba(22,163,74,0.45)':'0 0 28px rgba(220,38,38,0.45)'}}>
                CONFIRM {tradeAction}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHATBOT FAB */}
      <button onClick={()=>setShowBot(p=>!p)} className="fab-btn HBtn"
        style={{position:'fixed',bottom:34,right:34,width:58,height:58,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',border:'none',cursor:'pointer',background:'linear-gradient(135deg,#22d3ee,#3b82f6)',color:'#fff',zIndex:100,boxShadow:'0 4px 24px rgba(34,211,238,0.38)'}}>
        <Bot size={24}/>
      </button>
      {showBot&&<Chatbot user={user} onClose={()=>setShowBot(false)}/>}
    </div>
  );
};
export default Dashboard;