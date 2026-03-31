import React, { useState, useEffect } from 'react';
import { Newspaper, TrendingUp, TrendingDown, AlertCircle, ExternalLink, Clock, RefreshCw, Zap, Minus } from 'lucide-react';
import { API } from '../utils/app';

const S = { card: { background:'rgba(9,15,28,0.75)', border:'1px solid rgba(255,255,255,0.05)', backdropFilter:'blur(16px)' } };

const sentimentCfg = {
  positive: { color:'#34d399', bg:'rgba(52,211,153,0.08)', border:'rgba(52,211,153,0.2)', icon: TrendingUp, label:'Bullish' },
  negative:  { color:'#fb7185', bg:'rgba(251,113,133,0.08)', border:'rgba(251,113,133,0.2)', icon: TrendingDown, label:'Bearish' },
  neutral:   { color:'#94a3b8', bg:'rgba(148,163,184,0.06)', border:'rgba(148,163,184,0.1)', icon: Minus, label:'Neutral' },
};

const NewsCard = ({ item, index }) => {
  const [vis, setVis] = useState(false);
  const [hovered, setHovered] = useState(false);
  const cfg = sentimentCfg[item.sentiment] || sentimentCfg.neutral;
  const Icon = cfg.icon;

  useEffect(()=>{ const t=setTimeout(()=>setVis(true), index*60+100); return ()=>clearTimeout(t); },[index]);

  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer"
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      className="flex flex-col justify-between rounded-2xl p-5 no-underline relative overflow-hidden"
      style={{
        ...S.card,
        opacity: vis?1:0,
        transform: vis?(hovered?'translateY(-4px) scale(1.01)':'translateY(0)'):'translateY(16px)',
        transition: `opacity .4s ease ${index*60}ms, transform ${hovered?.2:.4}s ease${!vis?` ${index*60}ms`:''}`,
        boxShadow: hovered?`0 16px 40px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.08)`:'none',
        borderColor: hovered?`${cfg.border}`:'rgba(255,255,255,0.05)',
      }}>

      {/* Sentiment glow on hover */}
      {hovered&&<div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',height:1,width:120,background:`linear-gradient(90deg,transparent,${cfg.color},transparent)`}}/>}

      {/* Top row */}
      <div>
        <div className="flex justify-between items-start gap-3 mb-3">
          <span className="text-[10px] font-black font-mono uppercase tracking-widest px-2 py-1 rounded-lg flex-shrink-0"
            style={{color:'#22d3ee',background:'rgba(34,211,238,0.08)',border:'1px solid rgba(34,211,238,0.15)'}}>
            {item.source||'Market Sync'}
          </span>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg flex-shrink-0"
            style={{background:cfg.bg,border:`1px solid ${cfg.border}`}}>
            <Icon size={11} style={{color:cfg.color}}/>
            <span className="text-[10px] font-black uppercase tracking-wider" style={{color:cfg.color}}>{cfg.label}</span>
          </div>
        </div>

        <h3 className="text-sm font-black leading-snug line-clamp-3 transition-colors duration-200"
          style={{color:hovered?'#22d3ee':'#e2e8f0',letterSpacing:'-0.01em'}}>
          {item.title}
        </h3>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 flex justify-between items-center" style={{borderTop:'1px solid rgba(255,255,255,0.04)'}}>
        <div className="flex items-center gap-1.5 text-xs font-mono" style={{color:'#334155'}}>
          <Clock size={11}/>
          <span>{item.published?.split(' ').slice(1,4).join(' ')||'Recent'}</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-black uppercase tracking-wider transition-all duration-200"
          style={{color:hovered?'#22d3ee':'#334155',transform:hovered?'translateX(2px)':'translateX(0)'}}>
          Read <ExternalLink size={11} className="ml-1"/>
        </div>
      </div>
    </a>
  );
};

const FilterBtn = ({ k, label, active, onClick }) => (
  <button onClick={()=>onClick(k)}
    className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200"
    style={active?{background:'linear-gradient(135deg,#22d3ee,#3b82f6)',color:'#030712',boxShadow:'0 0 12px rgba(34,211,238,0.3)'}:{...S.card,color:'#64748b'}}
    onMouseEnter={e=>{if(!active)e.currentTarget.style.color='#f1f5f9';}}
    onMouseLeave={e=>{if(!active)e.currentTarget.style.color='#64748b';}}>
    {label}
  </button>
);

const News = ({ user }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadNews = async (isRefresh=false) => {
    try {
      if(isRefresh) setRefreshing(true); else setLoading(true);
      setError(null);
      const r = await fetch(`${API}/market/news`);
      if(!r.ok) throw new Error('Server error');
      const d = await r.json();
      setNews(Array.isArray(d)?d:d.news||[]);
    } catch(err) { setError('Unable to connect to the news server.'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(()=>{ loadNews(); },[]);

  const filtered = filter==='all'?news:news.filter(n=>n.sentiment===filter);
  const counts = { all:news.length, positive:news.filter(n=>n.sentiment==='positive').length, neutral:news.filter(n=>n.sentiment==='neutral').length, negative:news.filter(n=>n.sentiment==='negative').length };

  if(loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-5">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping"/>
        <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 border-cyan-500/10 animate-spin"/>
        <div className="absolute inset-3 flex items-center justify-center" style={{background:'rgba(34,211,238,0.05)',borderRadius:'50%'}}>
          <Newspaper size={18} className="text-cyan-400"/>
        </div>
      </div>
      <p className="text-sm font-mono uppercase tracking-widest text-cyan-400 animate-pulse">Scanning Global Feeds…</p>
    </div>
  );

  if(error) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="p-8 rounded-2xl max-w-md text-center" style={{background:'rgba(251,113,133,0.05)',border:'1px solid rgba(251,113,133,0.2)'}}>
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3"/>
        <h3 className="text-lg font-black text-white mb-2">Feed Disconnected</h3>
        <p className="text-sm mb-5" style={{color:'#94a3b8'}}>{error}</p>
        <button onClick={()=>loadNews()} className="px-6 py-2.5 rounded-xl font-black text-sm text-white" style={{background:'linear-gradient(135deg,#dc2626,#b91c1c)'}}>Reconnect</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-24">
      <style>{`@keyframes nw-fade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" style={{animation:'nw-fade .5s ease both'}}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{background:'linear-gradient(135deg,rgba(34,211,238,0.15),rgba(59,130,246,0.1))',border:'1px solid rgba(34,211,238,0.2)'}}>
            <Newspaper size={18} className="text-cyan-400"/>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight" style={{color:'#f8fafc',letterSpacing:'-0.03em'}}>Market Intelligence</h1>
            <p className="text-sm font-medium" style={{color:'#22d3ee'}}>Real-time Global Financial Feeds</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={S.card}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{boxShadow:'0 0 6px rgba(52,211,153,0.8)'}}/>
            <span className="text-xs font-black font-mono uppercase tracking-widest text-emerald-400">Live</span>
          </div>
          <button onClick={()=>loadNews(true)} disabled={refreshing}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-40"
            style={S.card}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(34,211,238,0.3)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.05)';}}>
            <RefreshCw size={14} className={refreshing?'animate-spin text-cyan-400':'text-slate-500'}/>
          </button>
        </div>
      </div>

      {/* Sentiment summary bar */}
      <div className="p-4 rounded-2xl flex items-center gap-4" style={{...S.card,animation:'nw-fade .5s ease 0.1s both'}}>
        <div className="flex items-center gap-1.5">
          <Zap size={12} className="text-cyan-400"/>
          <span className="text-[10px] font-black uppercase tracking-[0.15em]" style={{color:'#475569'}}>Sentiment</span>
        </div>
        <div className="flex-1 flex gap-1 h-1.5 rounded-full overflow-hidden">
          {counts.positive>0&&<div className="rounded-full transition-all duration-700" style={{width:`${(counts.positive/counts.all)*100}%`,background:'#34d399'}}/>}
          {counts.neutral>0&&<div className="rounded-full transition-all duration-700" style={{width:`${(counts.neutral/counts.all)*100}%`,background:'#64748b'}}/>}
          {counts.negative>0&&<div className="rounded-full transition-all duration-700" style={{width:`${(counts.negative/counts.all)*100}%`,background:'#fb7185'}}/>}
        </div>
        <div className="flex gap-4 text-[11px] font-black">
          <span style={{color:'#34d399'}}>↑ {counts.positive}</span>
          <span style={{color:'#94a3b8'}}>— {counts.neutral}</span>
          <span style={{color:'#fb7185'}}>↓ {counts.negative}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <FilterBtn k="all"      label={`All (${counts.all})`}            active={filter==='all'}      onClick={setFilter}/>
        <FilterBtn k="positive" label={`Bullish (${counts.positive})`}   active={filter==='positive'} onClick={setFilter}/>
        <FilterBtn k="neutral"  label={`Neutral (${counts.neutral})`}    active={filter==='neutral'}  onClick={setFilter}/>
        <FilterBtn k="negative" label={`Bearish (${counts.negative})`}   active={filter==='negative'} onClick={setFilter}/>
      </div>

      {/* News grid */}
      {filtered.length>0?(
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item,i)=><NewsCard key={i} item={item} index={i}/>)}
        </div>
      ):(
        <div className="py-24 text-center rounded-2xl flex flex-col items-center gap-4" style={{...S.card,border:'1px dashed rgba(255,255,255,0.08)'}}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
            <Newspaper size={24} style={{color:'#334155'}}/>
          </div>
          <div>
            <h3 className="text-lg font-black mb-1" style={{color:'#475569'}}>No Articles Found</h3>
            <p className="text-sm" style={{color:'#334155'}}>{filter!=='all'?`No ${filter} news. Try another filter.`:'The market feed is quiet. Check back shortly.'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;