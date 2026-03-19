import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, CheckCircle, AlertCircle, X, RefreshCw } from 'lucide-react';
import { API } from '../utils/app';

// ── Toast ──
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-fade-in max-w-md ${
      type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-300' :
      type === 'alert' ? 'bg-yellow-900/90 border-yellow-500/50 text-yellow-300' :
      'bg-rose-900/90 border-rose-500/50 text-rose-300'
    }`}>
      {type === 'success' ? <CheckCircle size={18} /> : <Bell size={18} />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
};

const Alerts = ({ user }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [ticker, setTicker] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState('above');
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);

  const showToast = (message, type = 'success') => setToast({ message, type });
  const fmt = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const loadAlerts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/alerts/${user.id}`);
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user.id]);

  const checkAlerts = async () => {
    setChecking(true);
    try {
      const res = await fetch(`${API}/alerts/check/${user.id}`);
      const data = await res.json();
      if (data.triggered?.length > 0) {
        data.triggered.forEach(alert => {
          showToast(
            `🔔 ${alert.ticker} is ${alert.condition} ₹${fmt(alert.target_price)}! Current: ₹${fmt(alert.triggered_price)}`,
            'alert'
          );
        });
        await loadAlerts();
      } else {
        showToast(`✅ Checked ${data.checked} alerts — no triggers yet.`, 'success');
      }
    } catch (e) {
      showToast('Failed to check alerts.', 'error');
    } finally { setChecking(false); }
  };

  useEffect(() => {
    loadAlerts();
    // Auto-check alerts on page load
    setTimeout(() => checkAlerts(), 1000);
  }, [loadAlerts]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!ticker || !targetPrice) return;
    setAdding(true);
    try {
      const res = await fetch(`${API}/alerts/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          ticker: ticker.toUpperCase(),
          target_price: parseFloat(targetPrice),
          condition,
          note
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast(`Alert set for ${ticker.toUpperCase()} ${condition} ₹${fmt(parseFloat(targetPrice))}! 🔔`);
        setTicker(''); setTargetPrice(''); setNote(''); setShowForm(false);
        await loadAlerts();
      }
    } catch (e) {
      showToast('Failed to create alert.', 'error');
    } finally { setAdding(false); }
  };

  const handleDelete = async (alertId) => {
    try {
      await fetch(`${API}/alerts/${user.id}/${alertId}`, { method: 'DELETE' });
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      showToast('Alert deleted.', 'success');
    } catch (e) {
      showToast('Failed to delete alert.', 'error');
    }
  };

  const activeAlerts = alerts.filter(a => !a.triggered);
  const triggeredAlerts = alerts.filter(a => a.triggered);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-14 h-14 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
      <p className="text-cyan-400 font-mono text-sm animate-pulse uppercase tracking-widest">Loading Alerts...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-24">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Header ── */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Price Alerts</h1>
          <p className="text-cyan-400 text-sm mt-0.5 font-medium">Get notified when stocks hit your target price</p>
        </div>
        <div className="flex gap-2">
          <button onClick={checkAlerts} disabled={checking}
            className="flex items-center gap-2 glass-panel px-4 py-2.5 rounded-xl text-slate-400 hover:text-cyan-400 text-sm font-bold transition-all">
            <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
            {checking ? 'Checking...' : 'Check Now'}
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_12px_rgba(34,211,238,0.3)]">
            <Plus size={16} />
            New Alert
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Alerts', value: activeAlerts.length, color: 'text-cyan-400', icon: Bell },
          { label: 'Triggered', value: triggeredAlerts.length, color: 'text-emerald-400', icon: CheckCircle },
          { label: 'Total Created', value: alerts.length, color: 'text-white', icon: AlertCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="glass-panel p-4 rounded-xl flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-800/50`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
              <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Create Alert Form ── */}
      {showForm && (
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Bell size={16} className="text-cyan-400" /> Set New Price Alert
          </h3>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Ticker */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Stock Ticker</label>
                <input type="text" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())}
                  placeholder="e.g. RELIANCE" required
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all text-sm" />
              </div>

              {/* Target Price */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Target Price (₹)</label>
                <input type="number" value={targetPrice} onChange={e => setTargetPrice(e.target.value)}
                  placeholder="e.g. 1500" required min="1"
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all text-sm" />
              </div>

              {/* Condition */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Condition</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setCondition('above')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      condition === 'above'
                        ? 'bg-emerald-500 text-white'
                        : 'glass-panel text-slate-400 hover:text-white'
                    }`}>
                    <TrendingUp size={14} /> Above
                  </button>
                  <button type="button" onClick={() => setCondition('below')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      condition === 'below'
                        ? 'bg-rose-500 text-white'
                        : 'glass-panel text-slate-400 hover:text-white'
                    }`}>
                    <TrendingDown size={14} /> Below
                  </button>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Note (optional)</label>
                <input type="text" value={note} onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Buy signal target"
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all text-sm" />
              </div>
            </div>

            {/* Preview */}
            {ticker && targetPrice && (
              <div className={`p-3 rounded-xl mb-4 border text-sm font-medium ${
                condition === 'above'
                  ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-900/20 border-rose-500/30 text-rose-400'
              }`}>
                🔔 Alert when <strong>{ticker}</strong> goes <strong>{condition}</strong> ₹{fmt(parseFloat(targetPrice) || 0)}
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={adding}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 text-sm">
                {adding ? 'Creating...' : '🔔 Create Alert'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-3 glass-panel text-slate-400 hover:text-white font-bold rounded-xl transition-all text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Active Alerts ── */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell className="text-cyan-400" size={16} />
            <h2 className="text-base font-bold text-white">Active Alerts</h2>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/50">
            {activeAlerts.length} alerts
          </span>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700">
              <Bell className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-300 mb-2">No Active Alerts</h3>
            <p className="text-slate-500 text-sm mb-4">Click "New Alert" to set your first price alert.</p>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 px-4 py-2 rounded-xl text-sm font-bold transition-all">
              <Plus size={14} /> Create Alert
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {activeAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/20 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    alert.condition === 'above' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                  }`}>
                    {alert.condition === 'above'
                      ? <TrendingUp size={18} className="text-emerald-400" />
                      : <TrendingDown size={18} className="text-rose-400" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{alert.ticker}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        alert.condition === 'above'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {alert.condition === 'above' ? '▲ Above' : '▼ Below'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 font-mono">₹{fmt(alert.target_price)}</p>
                    {alert.note && <p className="text-xs text-slate-500 mt-0.5">{alert.note}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-slate-500 hidden md:block">
                    {new Date(alert.created_at).toLocaleDateString('en-IN')}
                  </p>
                  <button onClick={() => handleDelete(alert.id)}
                    className="text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Triggered Alerts ── */}
      {triggeredAlerts.length > 0 && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-emerald-500/20">
          <div className="px-6 py-4 border-b border-emerald-500/20 flex justify-between items-center bg-emerald-900/10">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-emerald-400" size={16} />
              <h2 className="text-base font-bold text-white">Triggered Alerts</h2>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              {triggeredAlerts.length} triggered
            </span>
          </div>
          <div className="divide-y divide-slate-700/30">
            {triggeredAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/20 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10">
                    <CheckCircle size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{alert.ticker}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                        ✅ Triggered
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 font-mono">
                      Target: ₹{fmt(alert.target_price)} · Hit: ₹{fmt(alert.triggered_price)}
                    </p>
                    {alert.triggered_at && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(alert.triggered_at).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={() => handleDelete(alert.id)}
                  className="text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;