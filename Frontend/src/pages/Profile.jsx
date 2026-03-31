import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Shield, Wallet, Calendar, CheckCircle, AlertCircle, X,
  Eye, EyeOff, RefreshCw, Trash2, LogOut, Lock, Sparkles } from 'lucide-react';
import { API } from '../utils/app';

const fmt = n => (n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Syne:wght@700;800&family=Inter:wght@400;500;600;700;800;900&display=swap');
  .pp{font-family:'Inter',sans-serif;color:#e2e8f0;min-height:100vh;background:#030712;padding:28px;padding-bottom:80px;}
  .pp *{box-sizing:border-box;}
  .pp .M{font-family:'IBM Plex Mono',monospace!important;}
  .pp .S{font-family:'Syne',sans-serif!important;}
  .pp::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
    background-image:linear-gradient(rgba(34,211,238,0.02) 1px,transparent 1px),
                     linear-gradient(90deg,rgba(34,211,238,0.02) 1px,transparent 1px);
    background-size:52px 52px;
    mask-image:radial-gradient(ellipse 100% 60% at 50% 0%,black 20%,transparent 100%);}
  .pp::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
    background:radial-gradient(ellipse 60% 50% at 5% 0%,rgba(6,182,212,0.06) 0%,transparent 60%),
               radial-gradient(ellipse 50% 60% at 95% 95%,rgba(99,102,241,0.05) 0%,transparent 60%);}

  /* Card */
  .pc{background:rgba(9,15,28,0.86);border:1px solid rgba(255,255,255,0.07);
    backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:18px;
    transform-style:preserve-3d;
    transition:transform 0.26s cubic-bezier(0.22,1,0.36,1),box-shadow 0.26s ease,border-color 0.26s ease;
    will-change:transform;}
  .pc:hover:not(.no-hover){border-color:rgba(34,211,238,0.14);box-shadow:0 20px 52px rgba(0,0,0,0.5);}

  /* Tab btn */
  .ptab{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:13px;
    font-size:12px;font-weight:800;cursor:pointer;border:none;position:relative;
    transition:all 0.2s cubic-bezier(0.34,1.2,0.64,1);white-space:nowrap;}
  .ptab:hover:not(.ptab-on){transform:translateY(-2px);background:rgba(255,255,255,0.06)!important;}
  .ptab-on{transform:translateY(-1px);}
  .ptab-on::after{content:'';position:absolute;bottom:-3px;left:50%;transform:translateX(-50%);
    height:3px;width:60%;border-radius:99px;background:currentColor;box-shadow:0 0 12px currentColor;}

  /* Input */
  .p-inp{width:100%;padding:11px 14px;border-radius:12px;
    background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
    color:#f1f5f9;font-size:13px;font-family:'Inter',sans-serif;outline:none;
    transition:border-color 0.18s,box-shadow 0.18s;}
  .p-inp:focus{border-color:rgba(34,211,238,0.45);box-shadow:0 0 0 3px rgba(34,211,238,0.07);}
  .p-inp:disabled{opacity:0.35;cursor:not-allowed;}

  /* Animations */
  @keyframes pp-in{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pp-tab{from{opacity:0;transform:translateY(10px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes pp-px{0%,100%{opacity:1}50%{opacity:0.35}}
  @keyframes pp-pulse{0%,100%{box-shadow:0 0 20px rgba(34,211,238,0.25)}50%{box-shadow:0 0 40px rgba(34,211,238,0.55)}}
  @keyframes pp-ping{0%{transform:scale(1);opacity:1}100%{transform:scale(2.4);opacity:0}}
  @keyframes pp-rot{from{transform:rotate(0)}to{transform:rotate(360deg)}}

  .pp-in {animation:pp-in  0.5s cubic-bezier(0.22,1,0.36,1) both;}
  .pp-tab{animation:pp-tab 0.3s cubic-bezier(0.34,1.2,0.64,1) both;}
  .pp-px {animation:pp-px  1.5s ease-in-out infinite;}
  .avatar-glow{animation:pp-pulse 3s ease-in-out infinite;}

  /* Responsive */
  @media(max-width:768px){
    .pp{padding:16px 12px!important;}
    .pp [data-profile-grid]{grid-template-columns:1fr!important;}
  }

  .pp ::-webkit-scrollbar{width:4px;}
  .pp ::-webkit-scrollbar-track{background:transparent;}
  .pp ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.09);border-radius:8px;}
`;

/* ── Toast ── */
const Toast=({message,type,onClose})=>{
  useEffect(()=>{const t=setTimeout(onClose,3200);return()=>clearTimeout(t);},[onClose]);
  const ok=type==='success';
  return(
    <div className="pp-in" style={{position:'fixed',top:22,right:22,zIndex:300,display:'flex',alignItems:'center',gap:10,
      padding:'11px 18px',borderRadius:16,backdropFilter:'blur(24px)',
      background:ok?'rgba(4,22,14,0.97)':'rgba(22,4,4,0.97)',
      border:`1px solid ${ok?'rgba(52,211,153,0.35)':'rgba(251,113,133,0.35)'}`,
      color:ok?'#34d399':'#fb7185',boxShadow:'0 8px 32px rgba(0,0,0,0.6)'}}>
      {ok?<CheckCircle size={15}/>:<AlertCircle size={15}/>}
      <span style={{fontSize:13,fontWeight:600}}>{message}</span>
      <button onClick={onClose} style={{opacity:0.45,background:'none',border:'none',color:'inherit',cursor:'pointer',display:'flex',marginLeft:4}}
        onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.45}><X size={13}/></button>
    </div>
  );
};

/* ── TabBtn ── */
const TabBtn=({active,onClick,icon:Icon,label,danger=false})=>{
  const ref=useRef(null);
  const ac=danger?'#fb7185':active?'#22d3ee':'#22d3ee';
  const mm=e=>{const el=ref.current;if(!el||active)return;
    const{left,top,width,height}=el.getBoundingClientRect();
    const x=(e.clientX-left)/width-0.5,y=(e.clientY-top)/height-0.5;
    el.style.transform=`perspective(400px) rotateY(${x*14}deg) rotateX(${-y*14}deg) translateY(-2px)`;};
  const ml=()=>{const el=ref.current;if(!el||active)return;el.style.transform='';};
  return(
    <button ref={ref} onClick={onClick} onMouseMove={mm} onMouseLeave={ml}
      className={active?'ptab ptab-on':'ptab'}
      style={{background:active?`${ac}14`:'rgba(255,255,255,0.03)',
        border:`1px solid ${active?ac+'32':'rgba(255,255,255,0.07)'}`,
        color:active?ac:danger?'rgba(251,113,133,0.6)':'#4b5563',
        transformStyle:'preserve-3d'}}>
      <Icon size={13}/>{label}
    </button>
  );
};

/* ── Labeled input ── */
const Field=({label,value,onChange,disabled,placeholder,type='text',hint})=>{
  const [show,setShow]=useState(false);const isPwd=type==='password';
  return(
    <div>
      <label style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.15em',fontWeight:800,color:'#475569',display:'block',marginBottom:7}}>{label}</label>
      <div style={{position:'relative'}}>
        <input type={isPwd&&show?'text':type} value={value} onChange={onChange}
          disabled={disabled} placeholder={placeholder} className="p-inp"
          style={{paddingRight:isPwd?40:14}}/>
        {isPwd&&<button type="button" onClick={()=>setShow(p=>!p)}
          style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#475569',cursor:'pointer',display:'flex',transition:'color 0.15s'}}
          onMouseEnter={e=>e.currentTarget.style.color='#f1f5f9'} onMouseLeave={e=>e.currentTarget.style.color='#475569'}>
          {show?<EyeOff size={14}/>:<Eye size={14}/>}
        </button>}
      </div>
      {hint&&<p style={{fontSize:10,color:'#334155',marginTop:5}}>{hint}</p>}
    </div>
  );
};

/* ── Main Profile ── */
const Profile=({user,onUserUpdate,onLogout})=>{
  const [toast,setToast]=useState(null);
  const [tab,setTab]=useState('profile');
  const [name,setName]=useState(user?.name||'');
  const [savingP,setSavingP]=useState(false);
  const [curPwd,setCurPwd]=useState('');const [newPwd,setNewPwd]=useState('');const [conPwd,setConPwd]=useState('');
  const [savingS,setSavingS]=useState(false);
  const [resetC,setResetC]=useState('');const [resetting,setResetting]=useState(false);

  const say=(msg,type='success')=>setToast({message:msg,type});
  const initials=(user?.name||'T').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const since=user?.created_at?new Date(user.created_at).toLocaleDateString('en-IN',{year:'numeric',month:'long'}):'N/A';

  const saveProfile=async()=>{
    if(!name.trim()){say('Name cannot be empty','error');return;}
    setSavingP(true);
    try{const r=await fetch(`${API}/user/update-profile`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:user.id,name:name.trim()})});
      const d=await r.json();
      if(d.status==='success'){say('Profile updated!');onUserUpdate?.({...user,name:name.trim()});}
      else say('Failed to update','error');}
    catch{say('Failed to update','error');}
    finally{setSavingP(false);}
  };

  const changePwd=async()=>{
    if(!curPwd||!newPwd||!conPwd){say('Fill all fields','error');return;}
    if(newPwd!==conPwd){say('Passwords do not match','error');return;}
    if(newPwd.length<6){say('Min 6 characters','error');return;}
    setSavingS(true);
    try{const r=await fetch(`${API}/user/change-password`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:user.id,current_password:curPwd,new_password:newPwd})});
      const d=await r.json();
      if(d.status==='success'){say('Password changed!');setCurPwd('');setNewPwd('');setConPwd('');}
      else say(d.detail||'Current password incorrect','error');}
    catch{say('Failed','error');}
    finally{setSavingS(false);}
  };

  const resetBalance=async()=>{
    if(resetC!=='RESET'){say('Type RESET to confirm','error');return;}
    setResetting(true);
    try{const r=await fetch(`${API}/user/reset-balance`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:user.id})});
      const d=await r.json();
      if(d.status==='success'){say('Balance reset to ₹10,00,000!');setResetC('');onUserUpdate?.({...user,balance:1000000});}
      else say('Reset failed','error');}
    catch{say('Reset failed','error');}
    finally{setResetting(false);}
  };

  const Btn=({onClick,loading,disabled,children,variant='primary',full=false})=>{
    const bg=variant==='danger'?'linear-gradient(135deg,#dc2626,#b91c1c)':'linear-gradient(135deg,#06b6d4,#6366f1)';
    const sh=variant==='danger'?'0 0 20px rgba(220,38,38,0.3)':'0 0 20px rgba(6,182,212,0.25)';
    return(
      <button onClick={onClick} disabled={loading||disabled}
        style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,
          padding:'12px 24px',width:full?'100%':undefined,borderRadius:13,
          fontSize:13,fontWeight:800,color:'#fff',cursor:'pointer',border:'none',
          background:bg,boxShadow:sh,
          opacity:loading||disabled?0.45:1,transition:'filter 0.15s,transform 0.15s'}}
        onMouseEnter={e=>{if(!loading&&!disabled){e.currentTarget.style.filter='brightness(1.12)';e.currentTarget.style.transform='translateY(-1px)';}}}
        onMouseLeave={e=>{e.currentTarget.style.filter='brightness(1)';e.currentTarget.style.transform='translateY(0)';}}>
        {loading?<><span style={{width:13,height:13,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',animation:'pp-px 0.75s linear infinite',display:'inline-block'}}/>Loading…</>:children}
      </button>
    );
  };

  return(
    <div className="pp pp-in" style={{position:'relative',zIndex:1}}>
      <style>{CSS}</style>
      {toast&&<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:26}}>
        <div style={{width:46,height:46,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',
          background:'linear-gradient(135deg,#06b6d4,#6366f1)',boxShadow:'0 0 24px rgba(6,182,212,0.38)',flexShrink:0}}>
          <User size={20} color="#fff"/>
        </div>
        <div>
          <h1 className="S" style={{fontSize:32,fontWeight:800,color:'#f8fafc',letterSpacing:'-0.04em',lineHeight:1,
            textShadow:'0 0 40px rgba(34,211,238,0.18)'}}>Profile</h1>
          <p style={{fontSize:13,color:'#22d3ee',marginTop:4,fontWeight:500}}>Manage your account & settings</p>
        </div>
      </div>

      {/* Hero card */}
      <div className="pc" style={{padding:24,marginBottom:20,position:'relative',overflow:'hidden',borderColor:'rgba(34,211,238,0.15)'}}>
        <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',height:1,width:220,
          background:'linear-gradient(90deg,transparent,rgba(34,211,238,0.45),transparent)'}}/>
        <div style={{position:'absolute',top:-80,right:-80,width:240,height:240,borderRadius:'50%',
          background:'radial-gradient(circle,rgba(99,102,241,0.09) 0%,transparent 70%)',pointerEvents:'none'}}/>

        <div style={{display:'flex',alignItems:'flex-start',gap:20,flexWrap:'wrap'}}>
          {/* Avatar */}
          <div style={{position:'relative',flexShrink:0}}>
            <div className="avatar-glow" style={{width:76,height:76,borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',
              background:'linear-gradient(135deg,#06b6d4,#6366f1)',fontSize:24,fontWeight:900,color:'#fff',
              letterSpacing:'-0.02em'}}>
              {initials}
            </div>
            {/* Online dot */}
            <div style={{position:'absolute',bottom:-2,right:-2,width:18,height:18,borderRadius:'50%',
              background:'rgba(9,15,28,0.95)',border:'2px solid rgba(9,15,28,0.95)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{position:'relative',width:10,height:10}}>
                <div style={{position:'absolute',inset:0,borderRadius:'50%',background:'#34d399',animation:'pp-ping 1.5s ease-out infinite'}}/>
                <div style={{position:'absolute',inset:0,borderRadius:'50%',background:'#34d399'}}/>
              </div>
            </div>
          </div>

          {/* Info */}
          <div style={{flex:1,minWidth:0}}>
            <h2 className="S" style={{fontSize:22,fontWeight:800,color:'#f8fafc',marginBottom:4,
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.name||'Trader'}</h2>
            <p style={{fontSize:13,color:'#475569',marginBottom:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.email}</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
              {[
                {icon:Wallet,   label:`₹${fmt(user?.balance)}`,  color:'#22d3ee', bg:'rgba(34,211,238,0.08)',  border:'rgba(34,211,238,0.18)'},
                {icon:Calendar, label:since,                      color:'#94a3b8', bg:'rgba(255,255,255,0.04)', border:'rgba(255,255,255,0.08)'},
                {icon:Sparkles, label:user?.provider||'email',    color:'#a78bfa', bg:'rgba(167,139,250,0.08)', border:'rgba(167,139,250,0.18)'},
              ].map(({icon:Icon,label,color,bg,border})=>(
                <span key={label} style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,
                  padding:'4px 10px',borderRadius:99,color,background:bg,border:`1px solid ${border}`}}>
                  <Icon size={10}/>{label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div data-profile-grid style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginTop:18}}>
          {[
            {l:'Balance',      v:`₹${((user?.balance||0)/100000).toFixed(1)}L`, c:'#22d3ee', a:'rgba(34,211,238,0.08)'},
            {l:'Member Since', v:new Date(user?.created_at||Date.now()).getFullYear().toString(), c:'#f8fafc', a:'rgba(255,255,255,0.03)'},
            {l:'Account Type', v:'Paper', c:'#34d399', a:'rgba(52,211,153,0.07)'},
          ].map(({l,v,c,a})=>(
            <div key={l} style={{padding:'12px 14px',borderRadius:13,background:a,
              border:`1px solid ${c}22`,textAlign:'center',transition:'transform 0.2s'}}>
              <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.14em',fontWeight:800,color:'#475569',marginBottom:6}}>{l}</p>
              <p className="M" style={{fontSize:15,fontWeight:700,color:c,letterSpacing:'-0.01em'}}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}>
        <TabBtn active={tab==='profile'}  onClick={()=>setTab('profile')}  icon={User}   label="Profile"/>
        <TabBtn active={tab==='security'} onClick={()=>setTab('security')} icon={Shield} label="Security"/>
        <TabBtn active={tab==='danger'}   onClick={()=>setTab('danger')}   icon={Trash2} label="Danger Zone" danger/>
      </div>

      {/* Profile tab */}
      {tab==='profile'&&(
        <div key="profile" className="pc pp-tab no-hover" style={{padding:22}}>
          <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.15em',fontWeight:800,color:'#334155',marginBottom:18}}>Personal Information</p>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <Field label="Display Name"  value={name}         onChange={e=>setName(e.target.value)} placeholder="Your name"/>
            <Field label="Email Address" value={user?.email||''} disabled hint="Email cannot be changed"/>
          </div>
          <div style={{marginTop:20}}>
            <Btn onClick={saveProfile} loading={savingP} disabled={name===user?.name} full>Save Changes</Btn>
          </div>
        </div>
      )}

      {/* Security tab */}
      {tab==='security'&&(
        <div key="security" className="pc pp-tab no-hover" style={{padding:22}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:18}}>
            <Lock size={14} style={{color:'#22d3ee'}}/><p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.15em',fontWeight:800,color:'#334155'}}>Change Password</p>
          </div>
          {user?.provider!=='email'?(
            <div style={{padding:16,borderRadius:13,background:'rgba(251,191,36,0.06)',border:'1px solid rgba(251,191,36,0.2)'}}>
              <p style={{fontSize:13,color:'#fbbf24'}}>⚠ You signed in with {user?.provider}. Password change is not available for social logins.</p>
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <Field label="Current Password"     type="password" value={curPwd} onChange={e=>setCurPwd(e.target.value)} placeholder="••••••••"/>
              <Field label="New Password"          type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="••••••••"/>
              <Field label="Confirm New Password"  type="password" value={conPwd} onChange={e=>setConPwd(e.target.value)} placeholder="••••••••"/>
              {newPwd&&(
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {[{ok:newPwd.length>=6,l:'At least 6 characters'},{ok:newPwd===conPwd&&conPwd.length>0,l:'Passwords match'}].map(({ok,l})=>(
                    <div key={l} style={{display:'flex',alignItems:'center',gap:7,fontSize:11,color:ok?'#34d399':'#475569'}}>
                      <span style={{width:6,height:6,borderRadius:'50%',flexShrink:0,background:ok?'#34d399':'#334155'}}/>
                      {l}
                    </div>
                  ))}
                </div>
              )}
              <Btn onClick={changePwd} loading={savingS} full>🔐 Update Password</Btn>
            </div>
          )}
        </div>
      )}

      {/* Danger zone */}
      {tab==='danger'&&(
        <div key="danger" className="pp-tab" style={{display:'flex',flexDirection:'column',gap:14}}>
          {/* Reset balance */}
          <div className="pc no-hover" style={{padding:22,borderColor:'rgba(251,113,133,0.2)',background:'rgba(251,113,133,0.04)'}}>
            <div style={{height:1,background:'linear-gradient(90deg,transparent,rgba(251,113,133,0.4),transparent)',marginBottom:16}}/>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <RefreshCw size={14} style={{color:'#fb7185'}}/><p style={{fontSize:13,fontWeight:800,color:'#fb7185'}}>Reset Virtual Balance</p>
            </div>
            <p style={{fontSize:13,color:'#64748b',marginBottom:16}}>Resets your balance to ₹10,00,000. Trade history is preserved.</p>
            <div style={{display:'flex',gap:8}}>
              <input value={resetC} onChange={e=>setResetC(e.target.value.toUpperCase())} placeholder='Type "RESET" to confirm'
                className="p-inp" style={{flex:1,borderColor:'rgba(251,113,133,0.2)'}}
                onFocus={e=>e.target.style.borderColor='rgba(251,113,133,0.45)'}
                onBlur={e=>e.target.style.borderColor='rgba(251,113,133,0.2)'}/>
              <Btn onClick={resetBalance} loading={resetting} disabled={resetC!=='RESET'} variant="danger">Reset</Btn>
            </div>
          </div>

          {/* Sign out */}
          <div className="pc no-hover" style={{padding:22}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <LogOut size={14} style={{color:'#94a3b8'}}/><p style={{fontSize:13,fontWeight:800,color:'#f8fafc'}}>Sign Out</p>
            </div>
            <p style={{fontSize:13,color:'#64748b',marginBottom:16}}>Sign out from EquiDash on this device.</p>
            <button onClick={onLogout}
              style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 20px',borderRadius:12,
                background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',
                color:'#94a3b8',fontSize:13,fontWeight:700,cursor:'pointer',transition:'all 0.18s'}}
              onMouseEnter={e=>{e.currentTarget.style.color='#fb7185';e.currentTarget.style.borderColor='rgba(251,113,133,0.28)';}}
              onMouseLeave={e=>{e.currentTarget.style.color='#94a3b8';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';}}>
              <LogOut size={14}/> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;