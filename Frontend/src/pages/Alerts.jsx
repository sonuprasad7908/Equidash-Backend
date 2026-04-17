import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, CheckCircle, AlertCircle, X, RefreshCw, Target, Zap } from 'lucide-react';
import { API } from '../utils/app';

const S = { card: { background:'rgba(9,15,28,0.75)', border:'1px solid rgba(255,255,255,0.05)', backdropFilter:'blur(16px)' } };

const Toast = ({ message, type, onClose }) => {
  useEffect(()=>{ const t=setTimeout(onClose,5000); return ()=>clearTimeout(t); },[onClose]);
  const cfg = type==='alert'?{bg:'rgba(251,191,36,0.08)',border:'rgba(251,191,36,0.3)',color:'#fbbf24'}
    :type==='success'?{bg:'rgba(52,211,153,0.08)',border:'rgba(52,211,153,0.3)',color:'#34d399'}
    :{bg:'rgba(251,113,133,0.08)',border:'rgba(251,113,133,0.3)',color:'#fb7185'};
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl max-w-md backdrop-blur-xl"
      style={{background:cfg.bg,border:`1px solid ${cfg.border}`,color:cfg.color}}>
      {type==='alert'?<Bell size={15}/>:type==='success'?<CheckCircle size={15}/>:<AlertCircle size={15}/>}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X size={13}/></button>
    </div>
  );
};

const AlertCard = ({ alert, onDelete, index }) => {
  const [vis, setVis] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fmt = n=>(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});

  useEffect(()=>{ const t=setTimeout(()=>setVis(true),index*70+200); return ()=>clearTimeout(t); },[index]);

  const isTriggered = alert.triggered;
  const isAbove = alert.condition==='above';

  return (
    <div className="rounded-2xl p-5 transition-all duration-300 relative overflow-hidden group"
      style={{
        ...S.card,
        opacity:vis?1:0,
        transform:vis?'translateX(0)':'translateX(-16px)',
        transition:`opacity .4s ease ${index*70+200}ms, transform .4s ease ${index*70+200}ms, box-shadow .2s ease, border-color .2s ease`,
        border:isTriggered?'1px solid rgba(52,211,153,0.25)':'1px solid rgba(255,255,255,0.05)',
        ...(isTriggered?{boxShadow:'0 0 20px rgba(52,211,153,0.08)'}:{}),
      }}
      onMouseEnter={e=>{ if(!isTriggered){e.currentTarget.style.borderColor='rgba(255,255,255,0.1)';} }}
      onMouseLeave={e=>{ if(!isTriggered){e.currentTarget.style.borderColor='rgba(255,255,255,0.05)';} }}>

      {/* Top glow for triggered */}
      {isTriggered&&<div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',height:1,width:160,background:'linear-gradient(90deg,transparent,rgba(52,211,153,0.6),transparent)'}}/>}

      {/* Pulsing dot for active */}
      {!isTriggered&&(
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{boxShadow:'0 0 6px rgba(34,211,238,0.8)'}}/>
          <span className="text-[10px] font-black uppercase tracking-widest" style={{color:'#22d3ee'}}>Active</span>
        </div>
      )}
      {isTriggered&&(
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <CheckCircle size={12} className="text-emerald-400"/>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Triggered</span>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{background:isTriggered?'rgba(52,211,153,0.12)':isAbove?'rgba(34,211,238,0.1)':'rgba(251,113,133,0.1)',border:isTriggered?'1px solid rgba(52,211,153,0.2)':isAbove?'1px solid rgba(34,211,238,0.2)':'1px solid rgba(251,113,133,0.2)'}}>
          {isTriggered?<CheckCircle size={18} className="text-emerald-400"/>:isAbove?<TrendingUp size={18} className="text-cyan-400"/>:<TrendingDown size={18} className="text-rose-400"/>}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-black" style={{color:'#f8fafc',letterSpacing:'-0.02em'}}>{alert.ticker}</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{background:isAbove?'rgba(34,211,238,0.1)':'rgba(251,113,133,0.1)',color:isAbove?'#22d3ee':'#fb7185',border:`1px solid ${isAbove?'rgba(34,211,238,0.2)':'rgba(251,113,133,0.2)'}`}}>
              {isAbove?'↑ Above':'↓ Below'}
            </span>
          </div>
          <p className="text-sm font-black font-mono mb-1.5" style={{color:isAbove?'#22d3ee':'#fb7185'}}>
            Target: ₹{fmt(alert.target_price)}
          </p>
          {alert.note&&<p className="text-xs" style={{color:'#475569'}}>{alert.note}</p>}
          {isTriggered&&alert.triggered_price&&(
            <p className="text-xs font-black mt-1 text-emerald-400">Triggered @ ₹{fmt(alert.triggered_price)}</p>
          )}
          <p className="text-[10px] mt-2 font-mono" style={{color:'#334155'}}>
            {new Date(alert.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
          </p>
        </div>

        {/* Delete */}
        <button onClick={()=>{ setDeleting(true); onDelete(alert.id); }}
          disabled={deleting}
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-30"
          style={{background:'rgba(251,113,133,0.08)',border:'1px solid rgba(251,113,133,0.15)',color:'#fb7185'}}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(251,113,133,0.2)';}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(251,113,133,0.08)';}}>
          <Trash2 size={13}/>
        </button>
      </div>
    </div>
  );
};

const Alerts = ({ user }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [ticker, setTicker] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState('above');
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);

  const showToast=(msg,type='success')=>setToast({message:msg,type});
  const fmt=n=>(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});

  const loadAlerts=useCallback(async()=>{
    try{ const r=await fetch(`${API}/alerts/${user.id}`); const d=await r.json(); setAlerts(d.alerts||[]); }
    catch(e){} finally{setLoading(false);}
  },[user.id]);

  const checkAlerts=async()=>{
    setChecking(true);
    try{
      const r=await fetch(`${API}/alerts/check/${user.id}`); const d=await r.json();
      if(d.triggered?.length>0){ d.triggered.forEach(a=>showToast(`🔔 ${a.ticker} hit ₹${fmt(a.target_price)}! Now ₹${fmt(a.triggered_price)}`,'alert')); await loadAlerts(); }
      else showToast(`✅ Checked ${d.checked} alerts — no triggers yet.`);
    }catch{showToast('Failed to check alerts.','error');}
    finally{setChecking(false);}
  };

  useEffect(()=>{ loadAlerts(); setTimeout(()=>checkAlerts(),1000); },[loadAlerts]);

  const handleCreate=async(e)=>{
    e.preventDefault(); if(!ticker||!targetPrice)return; setAdding(true);
    try{
      const r=await fetch(`${API}/alerts/create`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:user.id,ticker:ticker.toUpperCase(),target_price:parseFloat(targetPrice),condition,note})});
      const d=await r.json();
      if(d.status==='success'){ showToast(`Alert set for ${ticker.toUpperCase()} ${condition} ₹${fmt(parseFloat(targetPrice))}! 🔔`); setTicker('');setTargetPrice('');setNote('');setShowForm(false); await loadAlerts(); }
    }catch{showToast('Failed to create alert.','error');}
    finally{setAdding(false);}
  };

  const handleDelete=async(id)=>{
    try{ await fetch(`${API}/alerts/${user.id}/${id}`,{method:'DELETE'}); setAlerts(p=>p.filter(a=>a.id!==id)); showToast('Alert deleted.'); }
    catch{showToast('Failed to delete.','error');}
  };

  const active=alerts.filter(a=>!a.triggered);
  const triggered=alerts.filter(a=>a.triggered);

  const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm font-mono outline-none transition-all duration-200";
  const inputStyle = { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', color:'#f1f5f9' };

  if(loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-5">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping"/>
        <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 border-cyan-500/10 animate-spin"/>
        <div className="absolute inset-3 flex items-center justify-center" style={{background:'rgba(34,211,238,0.05)',borderRadius:'50%'}}>
          <Bell size={18} className="text-cyan-400"/>
        </div>
      </div>
      <p className="text-sm font-mono uppercase tracking-widest text-cyan-400 animate-pulse">Loading Alerts…</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-24">
      <style>{`
        @keyframes al-fade { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes al-bell { 0%,100%{transform:rotate(0)} 10%{transform:rotate(-12deg)} 20%{transform:rotate(12deg)} 30%{transform:rotate(-8deg)} 40%{transform:rotate(8deg)} 50%{transform:rotate(0)} }
        .bell-ring { animation: al-bell 1s ease 0.5s 1; }
      `}</style>
      {toast&&<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}

      {/* Header */}
      <div className="flex justify-between items-start" style={{animation:'al-fade .5s ease both'}}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{background:'linear-gradient(135deg,rgba(251,191,36,0.2),rgba(251,113,133,0.1))',border:'1px solid rgba(251,191,36,0.25)'}}>
            <Bell size={18} className="text-amber-400 bell-ring"/>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight" style={{color:'#f8fafc',letterSpacing:'-0.03em'}}>Price Alerts</h1>
            <p className="text-sm font-medium" style={{color:'#22d3ee'}}>Get notified when stocks hit your target</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={checkAlerts} disabled={checking}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all duration-200 disabled:opacity-40"
            style={S.card}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(34,211,238,0.3)';e.currentTarget.style.color='#22d3ee';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.05)';e.currentTarget.style.color='';}} >
            <RefreshCw size={14} className={checking?'animate-spin text-cyan-400':'text-slate-500'}/>{checking?'Checking…':'Check Now'}
          </button>
          <button onClick={()=>setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-slate-900 transition-all duration-200"
            style={{background:'linear-gradient(135deg,#22d3ee,#3b82f6)',boxShadow:'0 0 16px rgba(34,211,238,0.3)'}}>
            <Plus size={15}/> New Alert
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[{l:'Active',v:active.length,c:'#22d3ee',icon:Bell},{l:'Triggered',v:triggered.length,c:'#34d399',icon:CheckCircle},{l:'Total',v:alerts.length,c:'#94a3b8',icon:Target}].map(({l,v,c,icon:Icon},i)=>(
          <div key={l} className="p-4 rounded-2xl flex items-center gap-3" style={{...S.card,animation:`al-fade .5s ease ${i*80}ms both`}}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`${c}15`,border:`1px solid ${c}25`}}>
              <Icon size={16} style={{color:c}}/>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest font-bold" style={{color:'#475569'}}>{l}</p>
              <p className="text-2xl font-black font-mono" style={{color:c,letterSpacing:'-0.04em'}}>{v}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showForm&&(
        <div className="p-6 rounded-2xl relative overflow-hidden" style={{background:'rgba(9,15,28,0.85)',border:'1px solid rgba(34,211,238,0.15)',backdropFilter:'blur(20px)'}}>
          <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',height:1,width:160,background:'linear-gradient(90deg,transparent,rgba(34,211,238,0.6),transparent)'}}/>
          <div className="flex items-center gap-2 mb-5">
            <Zap size={14} className="text-cyan-400"/>
            <h3 className="text-sm font-black uppercase tracking-widest" style={{color:'#94a3b8'}}>Set New Price Alert</h3>
          </div>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] font-black mb-1.5" style={{color:'#475569'}}>Stock Ticker</label>
                <input type="text" value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} placeholder="e.g. RELIANCE" required
                  className={inputCls} style={inputStyle}
                  onFocus={e=>{e.target.style.borderColor='rgba(34,211,238,0.4)';e.target.style.boxShadow='0 0 0 3px rgba(34,211,238,0.06)';}}
                  onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)';e.target.style.boxShadow='none';}}/>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] font-black mb-1.5" style={{color:'#475569'}}>Target Price (₹)</label>
                <input type="number" value={targetPrice} onChange={e=>setTargetPrice(e.target.value)} placeholder="0.00" step="0.01" min="0" required
                  className={inputCls} style={inputStyle}
                  onFocus={e=>{e.target.style.borderColor='rgba(34,211,238,0.4)';e.target.style.boxShadow='0 0 0 3px rgba(34,211,238,0.06)';}}
                  onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)';e.target.style.boxShadow='none';}}/>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] font-black mb-1.5" style={{color:'#475569'}}>Condition</label>
                <div className="flex gap-2">
                  {['above','below'].map(c=>(
                    <button key={c} type="button" onClick={()=>setCondition(c)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200"
                      style={condition===c?{background:c==='above'?'rgba(34,211,238,0.15)':'rgba(251,113,133,0.15)',border:`1px solid ${c==='above'?'rgba(34,211,238,0.35)':'rgba(251,113,133,0.35)'}`,color:c==='above'?'#22d3ee':'#fb7185'}:{...inputStyle,color:'#475569'}}>
                      {c==='above'?'↑ Above':'↓ Below'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] font-black mb-1.5" style={{color:'#475569'}}>Note (optional)</label>
                <input type="text" value={note} onChange={e=>setNote(e.target.value)} placeholder="Reason for alert…"
                  className={inputCls} style={inputStyle}
                  onFocus={e=>{e.target.style.borderColor='rgba(34,211,238,0.4)';}}
                  onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.07)';}}/>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={adding}
                className="flex-1 py-3 rounded-xl font-black text-sm text-slate-900 transition-all disabled:opacity-50"
                style={{background:'linear-gradient(135deg,#22d3ee,#3b82f6)',boxShadow:'0 0 16px rgba(34,211,238,0.25)'}}>
                {adding?'Creating…':'🔔 Set Alert'}
              </button>
              <button type="button" onClick={()=>setShowForm(false)}
                className="px-5 py-3 rounded-xl font-black text-sm transition-all" style={{...S.card,color:'#64748b'}}
                onMouseEnter={e=>e.currentTarget.style.color='#f1f5f9'} onMouseLeave={e=>e.currentTarget.style.color='#64748b'}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Alerts */}
      {active.length>0&&(
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{boxShadow:'0 0 6px rgba(34,211,238,0.8)'}}/>
            <h2 className="text-xs font-black uppercase tracking-[0.15em]" style={{color:'#334155'}}>Active Alerts ({active.length})</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {active.map((a,i)=><AlertCard key={a.id} alert={a} onDelete={handleDelete} index={i}/>)}
          </div>
        </div>
      )}

      {/* Triggered Alerts */}
      {triggered.length>0&&(
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={12} className="text-emerald-400"/>
            <h2 className="text-xs font-black uppercase tracking-[0.15em]" style={{color:'#334155'}}>Triggered ({triggered.length})</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {triggered.map((a,i)=><AlertCard key={a.id} alert={a} onDelete={handleDelete} index={i}/>)}
          </div>
        </div>
      )}

      {alerts.length===0&&(
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl" style={{...S.card,border:'1px dashed rgba(255,255,255,0.08)'}}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
            <Bell size={24} style={{color:'#334155'}}/>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-black mb-1" style={{color:'#475569'}}>No Alerts Yet</h3>
            <p className="text-sm max-w-xs" style={{color:'#334155'}}>Create your first alert to get notified when a stock hits your target price.</p>
          </div>
          <button onClick={()=>setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-slate-900"
            style={{background:'linear-gradient(135deg,#22d3ee,#3b82f6)'}}>
            <Plus size={14}/> Create Alert
          </button>
        </div>
      )}
    </div>
  );
};

export default Alerts;