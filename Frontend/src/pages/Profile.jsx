import React, { useState } from 'react';
import { User, Mail, Shield, Wallet, Calendar, CheckCircle, AlertCircle, X, Eye, EyeOff, RefreshCw, Trash2, LogOut } from 'lucide-react';
import { API } from '../utils/app';

const Toast = ({ message, type, onClose }) => {
  React.useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md animate-fade-in ${
      type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-300' : 'bg-rose-900/90 border-rose-500/50 text-rose-300'
    }`}>
      {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
};

const Profile = ({ user, onUserUpdate, onLogout }) => {
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetting, setResetting] = useState(false);

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });
  const fmt = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSaveProfile = async () => {
    if (!name.trim()) { showToast('Name cannot be empty.', 'error'); return; }
    setSavingProfile(true);
    try {
      const res = await fetch(`${API}/user/update-profile`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, name: name.trim() })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast('Profile updated! ✅');
        if (onUserUpdate) onUserUpdate({ ...user, name: name.trim() });
      } else { showToast('Failed to update profile.', 'error'); }
    } catch (e) { showToast('Failed to update profile.', 'error'); }
    finally { setSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { showToast('Fill all password fields.', 'error'); return; }
    if (newPassword !== confirmPassword) { showToast('Passwords do not match.', 'error'); return; }
    if (newPassword.length < 6) { showToast('Min 6 characters required.', 'error'); return; }
    setSavingPassword(true);
    try {
      const res = await fetch(`${API}/user/change-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, current_password: currentPassword, new_password: newPassword })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast('Password changed! 🔐');
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      } else { showToast(data.detail || 'Current password incorrect.', 'error'); }
    } catch (e) { showToast('Failed to change password.', 'error'); }
    finally { setSavingPassword(false); }
  };

  const handleResetBalance = async () => {
    if (resetConfirm !== 'RESET') { showToast('Type RESET to confirm.', 'error'); return; }
    setResetting(true);
    try {
      const res = await fetch(`${API}/user/reset-balance`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast('Balance reset to ₹10,00,000! 💰');
        setResetConfirm('');
        if (onUserUpdate) onUserUpdate({ ...user, balance: 1000000 });
      } else { showToast('Reset failed.', 'error'); }
    } catch (e) { showToast('Reset failed.', 'error'); }
    finally { setResetting(false); }
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })
    : 'N/A';

  return (
    <div className="space-y-6 pb-24">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Profile & Settings</h1>
        <p className="text-cyan-400 text-sm mt-0.5 font-medium">Manage your account</p>
      </div>

      {/* Profile Card */}
      <div className="glass-panel p-6 rounded-2xl flex items-center gap-5">
        <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
          <User size={28} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{user?.name || 'Trader'}</h2>
          <p className="text-slate-400 text-sm">{user?.email}</p>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><Calendar size={12} /> {memberSince}</span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400"><Wallet size={12} /> ₹{fmt(user?.balance)}</span>
            <span className="text-xs text-cyan-400 capitalize bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">{user?.provider || 'email'}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'profile', label: 'Profile', icon: User },
          { key: 'security', label: 'Security', icon: Shield },
          { key: 'danger', label: 'Danger Zone', icon: Trash2 },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === key
                ? key === 'danger' ? 'bg-rose-500 text-white' : 'bg-cyan-500 text-slate-900'
                : 'glass-panel text-slate-400 hover:text-white'
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="glass-panel p-6 rounded-2xl space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Personal Information</h3>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-2">Display Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
              className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-2">Email Address</label>
            <input type="email" value={user?.email || ''} disabled
              className="w-full px-4 py-3 bg-slate-900/30 border border-slate-700/30 rounded-xl text-slate-500 text-sm cursor-not-allowed" />
            <p className="text-xs text-slate-600 mt-1">Email cannot be changed.</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Balance', value: `₹${(user?.balance / 100000).toFixed(1)}L`, color: 'text-cyan-400' },
              { label: 'Since', value: new Date(user?.created_at || Date.now()).getFullYear().toString(), color: 'text-white' },
              { label: 'Type', value: 'Paper', color: 'text-emerald-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 bg-slate-800/40 rounded-xl text-center border border-slate-700/30">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-sm font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <button onClick={handleSaveProfile} disabled={savingProfile || name === user?.name}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm">
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="glass-panel p-6 rounded-2xl space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Change Password</h3>
          {user?.provider !== 'email' ? (
            <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-xl">
              <p className="text-yellow-400 text-sm">⚠️ You signed in with {user?.provider}. Password change is not available for social logins.</p>
            </div>
          ) : (
            <>
              {[
                { label: 'Current Password', value: currentPassword, onChange: setCurrentPassword },
                { label: 'New Password', value: newPassword, onChange: setNewPassword },
                { label: 'Confirm New Password', value: confirmPassword, onChange: setConfirmPassword },
              ].map(({ label, value, onChange }) => (
                <div key={label}>
                  <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-2">{label}</label>
                  <div className="relative">
                    <input type={showPasswords ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-12 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all text-sm" />
                    <button type="button" onClick={() => setShowPasswords(p => !p)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-white">
                      {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}
              {newPassword && (
                <div className="space-y-1">
                  {[
                    { check: newPassword.length >= 6, label: 'At least 6 characters' },
                    { check: newPassword === confirmPassword && confirmPassword.length > 0, label: 'Passwords match' },
                  ].map(({ check, label }) => (
                    <div key={label} className={`flex items-center gap-2 text-xs ${check ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${check ? 'bg-emerald-400' : 'bg-slate-600'}`}></div>
                      {label}
                    </div>
                  ))}
                </div>
              )}
              <button onClick={handleChangePassword} disabled={savingPassword}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm">
                {savingPassword ? 'Updating...' : '🔐 Update Password'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Danger Zone Tab */}
      {activeTab === 'danger' && (
        <div className="space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 bg-rose-900/5">
            <h3 className="text-base font-bold text-rose-400 flex items-center gap-2 mb-2">
              <RefreshCw size={16} /> Reset Virtual Balance
            </h3>
            <p className="text-slate-400 text-sm mb-4">Reset your balance to ₹10,00,000. Trade history is kept.</p>
            <div className="flex gap-3">
              <input type="text" value={resetConfirm} onChange={e => setResetConfirm(e.target.value.toUpperCase())}
                placeholder='Type "RESET" to confirm'
                className="flex-1 px-4 py-2.5 bg-slate-900/60 border border-rose-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-all text-sm" />
              <button onClick={handleResetBalance} disabled={resetting || resetConfirm !== 'RESET'}
                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all">
                {resetting ? '...' : 'Reset'}
              </button>
            </div>
          </div>
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2"><LogOut size={16} /> Sign Out</h3>
            <p className="text-slate-400 text-sm mb-4">Sign out from EquiDash on this device.</p>
            <button onClick={onLogout}
              className="px-6 py-2.5 glass-panel border border-slate-700 text-slate-300 hover:text-white font-bold rounded-xl text-sm transition-all">
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;