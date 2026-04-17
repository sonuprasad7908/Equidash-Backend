import React, { useState } from 'react';
import { Wallet, CreditCard, Shield, CheckCircle, AlertCircle, X, Zap, TrendingUp, Star } from 'lucide-react';
import { API } from '../utils/app';

const fmt = n => (n || 0).toLocaleString('en-IN');

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Syne:wght@700;800&family=Inter:wght@400;500;600;700;800;900&display=swap');
  .prp{font-family:'Inter',sans-serif;color:#e2e8f0;padding-bottom:80px;}
  .prp *{box-sizing:border-box;}
  .prp .M{font-family:'IBM Plex Mono',monospace!important;}
  .prp .S{font-family:'Syne',sans-serif!important;}

  /* 3D card */
  .prc{background:rgba(9,15,28,0.86);border:1px solid rgba(255,255,255,0.07);
    backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:18px;
    transform-style:preserve-3d;
    transition:transform 0.25s cubic-bezier(0.22,1,0.36,1),box-shadow 0.25s ease,border-color 0.25s ease;
    will-change:transform;position:relative;overflow:hidden;cursor:pointer;}
  .prc:hover{transform:translateY(-4px);
    box-shadow:0 20px 52px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.1);}
  .prc.selected{transform:translateY(-4px);}

  /* Plan card tilt */
  .plan-tilt{transition:transform 0.25s cubic-bezier(0.22,1,0.36,1),box-shadow 0.25s ease;}

  /* Input */
  .pr-inp{width:100%;padding:11px 14px;border-radius:12px;
    background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
    color:#f1f5f9;font-size:14px;font-family:'IBM Plex Mono',monospace;outline:none;
    transition:border-color 0.18s,box-shadow 0.18s;}
  .pr-inp:focus{border-color:rgba(34,211,238,0.45);box-shadow:0 0 0 3px rgba(34,211,238,0.07);}
  .pr-inp::placeholder{color:#334155;}

  /* Animations */
  @keyframes pr-up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pr-px{0%,100%{opacity:1}50%{opacity:0.4}}
  @keyframes pr-rot{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  @keyframes pr-scan{0%{top:-1px}100%{top:calc(100%+1px)}}
  @keyframes pr-glow{0%,100%{box-shadow:0 0 0 0 rgba(34,211,238,0.4)}70%{box-shadow:0 0 0 10px rgba(34,211,238,0)}100%{box-shadow:0 0 0 0 rgba(34,211,238,0)}}

  .pr-in {animation:pr-up 0.5s cubic-bezier(0.22,1,0.36,1) both;}
  .pr-px {animation:pr-px 1.5s ease-in-out infinite;}
  .pr-spin{animation:pr-rot 0.75s linear infinite;}
  .pr-scan{position:absolute;left:0;right:0;height:1px;
    background:linear-gradient(90deg,transparent,rgba(34,211,238,0.22),transparent);
    animation:pr-scan 5s ease-in-out infinite;pointer-events:none;z-index:2;}

  /* Responsive */
  @media(max-width:900px){.prp [data-grid="plans"]{grid-template-columns:repeat(2,1fr)!important;}}
  @media(max-width:600px){.prp [data-grid="plans"]{grid-template-columns:1fr!important;}
    .prp [data-grid="methods"]{grid-template-columns:repeat(2,1fr)!important;}}

  .prp ::-webkit-scrollbar{width:4px;}
  .prp ::-webkit-scrollbar-track{background:transparent;}
  .prp ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.09);border-radius:8px;}
`;

const PLANS = [
  { amount:  99, virtual:   500000, label:'₹5 Lakh',   tag:'Starter', accent:'#64748b', icon:'🚀' },
  { amount: 199, virtual:  1500000, label:'₹15 Lakh',  tag:'Popular', accent:'#22d3ee', icon:'⭐', popular:true },
  { amount: 499, virtual:  5000000, label:'₹50 Lakh',  tag:'Pro',     accent:'#6366f1', icon:'💎' },
  { amount: 999, virtual: 10000000, label:'₹1 Crore',  tag:'Elite',   accent:'#f59e0b', icon:'👑' },
];

const Pricing = ({ user, onBalanceUpdate }) => {
  const [selected, setSelected] = useState(PLANS[1]);
  const [custom, setCustom]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState(null);

  const say = (msg, type='success') => setToast({ message:msg, type });

  const loadStripe = () => new Promise(resolve => {
    if (window.Stripe) { resolve(window.Stripe); return; }
    const s = document.createElement('script');
    s.src = 'https://js.stripe.com/v3/';
    s.onload = () => resolve(window.Stripe);
    s.onerror = () => resolve(null);
    document.body.appendChild(s);
  });

  const pay = async () => {
    const amount = custom ? parseInt(custom) : selected?.amount;
    const virtual = custom ? Math.round(parseInt(custom)*5000) : selected?.virtual;
    if (!amount || amount < 10) { say('Minimum amount is ₹10','error'); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API}/payment/create-intent`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount,user_id:user.id,virtual_amount:virtual})});
      const d = await r.json();
      if (!d.client_secret) { say('Failed to initiate payment.','error'); setLoading(false); return; }
      const SC = await loadStripe();
      if (!SC) { say('Failed to load Stripe.','error'); setLoading(false); return; }
      const stripe = SC('pk_test_51TB9OrAY1eLPY7upFAsdaOAJTH51SfLIWxWo6XpdPQ2MNZuCcqKBfThSmZBXjfr9DZrOSygxh0Wr7SGhOvpc6xCJ00hgFDQMId');
      const result = await stripe.redirectToCheckout({ sessionId: d.session_id });
      if (result.error) { say(result.error.message,'error'); setLoading(false); }
    } catch { say('Payment failed. Try again.','error'); setLoading(false); }
  };

  const payAmount  = custom ? parseInt(custom)||0  : selected?.amount||0;
  const payVirtual = custom ? (parseInt(custom)||0)*5000 : selected?.virtual||0;
  const newBalance = (user?.balance||0) + payVirtual;
  const accent     = custom ? '#22d3ee' : selected?.accent || '#22d3ee';

  return (
    <div className="prp pr-in">
      <style>{CSS}</style>

      {toast && <div className="pr-in" style={{position:'fixed',top:22,left:'50%',transform:'translateX(-50%)',zIndex:300,display:'flex',alignItems:'center',gap:10,padding:'11px 18px',borderRadius:16,backdropFilter:'blur(24px)',background:toast.type==='success'?'rgba(4,22,14,0.97)':'rgba(22,4,4,0.97)',border:`1px solid ${toast.type==='success'?'rgba(52,211,153,0.35)':'rgba(251,113,133,0.35)'}`,color:toast.type==='success'?'#34d399':'#fb7185',boxShadow:'0 8px 32px rgba(0,0,0,0.6)',whiteSpace:'nowrap'}}>
        {toast.type==='success'?<CheckCircle size={15}/>:<AlertCircle size={15}/>}
        <span style={{fontSize:13,fontWeight:600}}>{toast.message}</span>
        <button onClick={()=>setToast(null)} style={{opacity:0.45,background:'none',border:'none',color:'inherit',cursor:'pointer',display:'flex',marginLeft:4}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.45}><X size={13}/></button>
      </div>}

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16,marginBottom:28}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:46,height:46,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#06b6d4,#3b82f6)',boxShadow:'0 0 24px rgba(34,211,238,0.38)',flexShrink:0}}>
            <Wallet size={20} color="#fff"/>
          </div>
          <div>
            <h1 className="S" style={{fontSize:32,fontWeight:800,color:'#f8fafc',letterSpacing:'-0.04em',lineHeight:1,textShadow:'0 0 40px rgba(34,211,238,0.18)'}}>Add Funds</h1>
            <p style={{fontSize:13,color:'#22d3ee',marginTop:4,fontWeight:500}}>Top up your virtual trading wallet</p>
          </div>
        </div>

        {/* Balance badge */}
        <div className="prc" style={{cursor:'default',padding:'14px 20px',borderColor:'rgba(34,211,238,0.2)',background:'rgba(34,211,238,0.04)'}}>
          <div className="pr-scan"/>
          <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.15em',fontWeight:800,color:'#475569',marginBottom:5}}>Current Balance</p>
          <p className="M" style={{fontSize:20,fontWeight:700,color:'#22d3ee'}}>₹{fmt(user?.balance)}</p>
          <div style={{display:'flex',alignItems:'center',gap:5,marginTop:5}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'#34d399',animation:'pr-px 1.5s infinite'}}/>
            <span style={{fontSize:10,fontWeight:700,color:'#34d399',textTransform:'uppercase',letterSpacing:'0.1em'}}>Paper Trading</span>
          </div>
        </div>
      </div>

      {/* Plans grid */}
      <div style={{marginBottom:20}}>
        <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.15em',fontWeight:800,color:'#334155',marginBottom:14}}>Choose a Plan</p>
        <div data-grid="plans" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {PLANS.map((plan,i) => {
            const isSelected = selected?.amount===plan.amount && !custom;
            return (
              <div key={plan.amount} className="prc" onClick={()=>{setSelected(plan);setCustom('');}}
                style={{padding:18,borderColor:isSelected?`${plan.accent}45`:'rgba(255,255,255,0.07)',
                  background:isSelected?`${plan.accent}10`:'rgba(9,15,28,0.86)',
                  boxShadow:isSelected?`0 0 24px ${plan.accent}22`:'none',
                  animation:`pr-up 0.4s ease ${i*60}ms both`}}>
                {plan.popular && <div style={{position:'absolute',top:-1,left:'50%',transform:'translateX(-50%)',fontSize:9,fontWeight:800,padding:'3px 10px',borderRadius:'0 0 8px 8px',background:'#22d3ee',color:'#030712',textTransform:'uppercase',letterSpacing:'0.1em',whiteSpace:'nowrap'}}>Most Popular</div>}
                <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${plan.accent},transparent)`,opacity:isSelected?1:0.4}}/>
                <p style={{fontSize:16,marginBottom:8,marginTop:plan.popular?8:0}}>{plan.icon}</p>
                <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.14em',fontWeight:800,color:'#475569',marginBottom:6}}>{plan.tag}</p>
                <p className="M" style={{fontSize:20,fontWeight:700,color:isSelected?plan.accent:'#f8fafc',letterSpacing:'-0.02em',marginBottom:4}}>₹{fmt(plan.amount)}</p>
                <p style={{fontSize:11,fontWeight:700,color:plan.accent}}>→ {plan.label} virtual</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom amount */}
      <div className="prc" style={{padding:20,marginBottom:20,cursor:'default',borderColor:custom?'rgba(34,211,238,0.22)':'rgba(255,255,255,0.07)'}}>
        <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.15em',fontWeight:800,color:'#334155',marginBottom:12}}>Or Enter Custom Amount</p>
        <div style={{position:'relative'}}>
          <span className="M" style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#475569',fontWeight:700,fontSize:14}}>₹</span>
          <input type="number" value={custom} onChange={e=>{setCustom(e.target.value);setSelected(null);}}
            placeholder="Enter amount (min ₹10)" min="10" className="pr-inp"
            style={{paddingLeft:32}}/>
        </div>
        {custom&&parseInt(custom)>=10&&(
          <p style={{fontSize:12,color:'#22d3ee',marginTop:8,fontWeight:700}}>→ You'll receive ₹{fmt(parseInt(custom)*5000)} virtual balance</p>
        )}
      </div>

      {/* Payment methods */}
      <div className="prc" style={{padding:20,marginBottom:20,cursor:'default'}}>
        <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.15em',fontWeight:800,color:'#334155',marginBottom:14}}>Accepted Payment Methods</p>
        <div data-grid="methods" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          {[['💳','Cards','Visa, Mastercard, RuPay'],['📱','UPI','GPay, PhonePe, Paytm'],['🏦','Net Banking','All major banks'],['👛','Wallets','Paytm, Amazon Pay']].map(([icon,l,sub])=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:12,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.06)'}}>
              <span style={{fontSize:20,flexShrink:0}}>{icon}</span>
              <div>
                <p style={{fontSize:12,fontWeight:800,color:'#f1f5f9'}}>{l}</p>
                <p style={{fontSize:10,color:'#334155'}}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order summary */}
      <div className="prc" style={{padding:20,marginBottom:22,cursor:'default',borderColor:`${accent}20`,background:`${accent}06`}}>
        <div className="pr-scan"/>
        <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.15em',fontWeight:800,color:'#334155',marginBottom:14}}>Order Summary</p>
        {[
          {l:'You Pay',              v:`₹${fmt(payAmount)}`,  c:'#f8fafc'},
          {l:'Virtual Balance Added',v:`₹${fmt(payVirtual)}`, c:'#22d3ee'},
          {l:'New Balance',          v:`₹${fmt(newBalance)}`,  c:'#34d399', hl:true},
        ].map(({l,v,c,hl})=>(
          <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
            padding:hl?'12px 14px':'9px 0',
            borderTop:hl?'1px solid rgba(255,255,255,0.06)':'none',
            marginTop:hl?8:0,
            background:hl?'rgba(52,211,153,0.06)':undefined,
            borderRadius:hl?10:0,
            ...(hl?{border:'1px solid rgba(52,211,153,0.14)'}:{})}}>
            <span style={{fontSize:12,color:'#64748b'}}>{l}</span>
            <span className="M" style={{fontSize:14,fontWeight:700,color:c}}>{v}</span>
          </div>
        ))}
      </div>

      {/* Pay button */}
      <button onClick={pay} disabled={loading||(!selected&&!custom)}
        style={{width:'100%',padding:'15px 0',borderRadius:15,border:'none',
          fontSize:15,fontWeight:900,letterSpacing:'0.05em',color:'#030712',cursor:'pointer',
          background:`linear-gradient(135deg,#06b6d4,#3b82f6)`,
          boxShadow:'0 0 28px rgba(34,211,238,0.35)',
          transition:'filter 0.18s,transform 0.18s,box-shadow 0.18s',
          opacity:loading||(!selected&&!custom)?0.5:1,marginBottom:14}}
        onMouseEnter={e=>{if(!loading){e.currentTarget.style.filter='brightness(1.12)';e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 0 44px rgba(34,211,238,0.55)';}}}
        onMouseLeave={e=>{e.currentTarget.style.filter='brightness(1)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 0 28px rgba(34,211,238,0.35)';}}>
        {loading
          ?<span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              <span style={{width:15,height:15,borderRadius:'50%',border:'2px solid rgba(0,0,0,0.2)',borderTopColor:'#030712',animation:'pr-rot 0.7s linear infinite',display:'inline-block'}}/>
              Redirecting to Stripe…
            </span>
          :<span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              <CreditCard size={18}/> Pay ₹{fmt(payAmount)} via Stripe
            </span>}
      </button>

      {/* Security note */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
        <Shield size={12} style={{color:'#334155'}}/>
        <p style={{fontSize:11,color:'#334155'}}>Secured by Stripe · 256-bit SSL · Test mode active</p>
      </div>
    </div>
  );
};

export default Pricing;