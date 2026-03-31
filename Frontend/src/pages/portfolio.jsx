import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Briefcase, TrendingUp, TrendingDown, Wallet, Activity, PieChart, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';
import { API } from '../utils/app';

/* ─── Animated counter ─── */
const AnimatedNumber = ({ value, prefix = '', suffix = '', decimals = 2, duration = 1000, color }) => {
  const [display, setDisplay] = useState(0);
  const start = useRef(0);
  const raf = useRef(null);

  useEffect(() => {
    const from = start.current;
    const to = value;
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - t, 4);
      setDisplay(from + (to - from) * ease);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else start.current = to;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  const formatted = display.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <span style={{ color }}>{prefix}{formatted}{suffix}</span>;
};

/* ─── Donut chart ─── */
const DonutChart = ({ positions, totalValue }) => {
  const colors = ['#22d3ee', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#f59e0b'];
  const size = 140, stroke = 22, r = (size - stroke) / 2, circumference = 2 * Math.PI * r;
  let cumulative = 0;
  const [animate, setAnimate] = useState(false);

  useEffect(() => { const t = setTimeout(() => setAnimate(true), 200); return () => clearTimeout(t); }, []);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
      {positions.map((pos, i) => {
        const pct = totalValue > 0 ? pos.current_value / totalValue : 0;
        const dash = pct * circumference;
        const offset = -cumulative * circumference;
        cumulative += pct;
        return (
          <circle key={i} cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={colors[i % colors.length]} strokeWidth={stroke}
            strokeDasharray={`${animate ? dash : 0} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: `stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.12}s` }} />
        );
      })}
    </svg>
  );
};

/* ─── Summary Card ─── */
const SummaryCard = ({ icon: Icon, iconColor, label, value, sub, subColor, glowColor, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <div className="relative rounded-2xl p-5 overflow-hidden transition-all duration-300 group cursor-default"
      style={{
        background: 'rgba(15,23,42,0.6)',
        border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(16px)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms, box-shadow 0.3s ease`,
      }}
      onMouseEnter={e => { if (glowColor) e.currentTarget.style.boxShadow = `0 0 24px ${glowColor}`; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}>
      {/* Top glow */}
      {glowColor && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:120, height:1, background:`linear-gradient(90deg,transparent,${glowColor},transparent)` }} />}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${iconColor}18`, border: `1px solid ${iconColor}25` }}>
          <Icon size={15} style={{ color: iconColor }} />
        </div>
        <p className="text-[11px] uppercase tracking-[0.12em] font-bold" style={{ color: '#64748b' }}>{label}</p>
      </div>
      <p className="text-2xl font-black font-mono mb-1" style={{ letterSpacing: '-0.03em' }}>{value}</p>
      <p className="text-xs" style={{ color: subColor || '#475569' }}>{sub}</p>
    </div>
  );
};

/* ─── Position Row ─── */
const PositionRow = ({ pos, index, colors }) => {
  const [visible, setVisible] = useState(false);
  const isPosProfit = pos.pnl >= 0;
  const pnlPct = (pos.pnl / (pos.avg_price * pos.quantity)) * 100;
  const fmt = n => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  useEffect(() => { const t = setTimeout(() => setVisible(true), index * 80 + 400); return () => clearTimeout(t); }, [index]);

  return (
    <tr className="border-b group transition-all duration-200"
      style={{
        borderColor: 'rgba(255,255,255,0.04)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-12px)',
        transition: `opacity 0.4s ease ${index * 80 + 400}ms, transform 0.4s ease ${index * 80 + 400}ms`,
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <td className="py-4 pl-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
            style={{ background: colors[index % colors.length] }}>
            {pos.ticker[0]}
          </div>
          <span className="font-bold text-sm" style={{ color: '#f1f5f9' }}>{pos.ticker}</span>
        </div>
      </td>
      <td className="py-4 px-4 font-mono text-sm text-right" style={{ color: '#94a3b8' }}>{pos.quantity}</td>
      <td className="py-4 px-4 font-mono text-sm text-right" style={{ color: '#94a3b8' }}>₹{fmt(pos.avg_price)}</td>
      <td className="py-4 px-4 font-mono font-bold text-sm text-right" style={{ color: '#f1f5f9' }}>₹{fmt(pos.current_price)}</td>
      <td className="py-4 px-4 font-mono text-sm text-right" style={{ color: '#94a3b8' }}>₹{fmt(pos.current_value)}</td>
      <td className="py-4 pr-6 text-right">
        <div className="flex flex-col items-end">
          <span className="flex items-center gap-1 font-black font-mono text-sm" style={{ color: isPosProfit ? '#34d399' : '#fb7185' }}>
            {isPosProfit ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {isPosProfit ? '+' : ''}₹{fmt(pos.pnl)}
          </span>
          <span className="text-xs font-mono mt-0.5" style={{ color: isPosProfit ? '#059669' : '#e11d48' }}>
            {isPosProfit ? '+' : ''}{pnlPct.toFixed(2)}%
          </span>
        </div>
      </td>
    </tr>
  );
};

/* ─── Main Portfolio ─── */
const Portfolio = ({ user }) => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadPortfolio = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      setError(null);
      const response = await fetch(`${API}/portfolio/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch portfolio');
      const data = await response.json();
      setPortfolioData(data);
    } catch (err) {
      setError('Unable to load portfolio. Check if your backend is running.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [user.id]);

  useEffect(() => { if (user?.id) loadPortfolio(); }, [user.id, loadPortfolio]);

  const fmt = n => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totalInvested = portfolioData?.summary?.total_invested || 0;
  const totalCurrent = portfolioData?.summary?.current_value || 0;
  const totalPnL = portfolioData?.summary?.total_pnl || 0;
  const pnlPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const isPositive = totalPnL >= 0;
  const colors = ['#22d3ee','#3b82f6','#8b5cf6','#ec4899','#f97316','#10b981','#f59e0b'];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-5">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
        <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 border-cyan-500/10 animate-spin" />
        <div className="absolute inset-3 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,211,238,0.05)' }}>
          <Briefcase size={18} className="text-cyan-400" />
        </div>
      </div>
      <p className="text-sm font-mono uppercase tracking-widest text-cyan-400 animate-pulse">Syncing Portfolio...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="p-8 rounded-2xl max-w-md text-center" style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.2)' }}>
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Connection Error</h3>
        <p className="text-sm mb-5" style={{ color: '#94a3b8' }}>{error}</p>
        <button onClick={() => loadPortfolio()} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)' }}>Retry</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-24">
      <style>{`
        @keyframes fadeSlide { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmerBar { from { background-position:-200% 0; } to { background-position:200% 0; } }
      `}</style>

      {/* ── Header ── */}
      <div className="flex justify-between items-start" style={{ animation: 'fadeSlide 0.5s ease both' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.2))', border: '1px solid rgba(139,92,246,0.3)' }}>
              <Briefcase size={15} className="text-violet-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight" style={{ color: '#f8fafc', letterSpacing: '-0.03em' }}>Portfolio Hub</h1>
          </div>
          <p className="text-sm font-medium" style={{ color: '#22d3ee', paddingLeft: 40 }}>Live Asset Tracking & P&L</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Wallet size={14} className="text-cyan-400" />
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#475569' }}>Available</p>
              <p className="font-black font-mono text-sm" style={{ color: '#f1f5f9' }}>₹{fmt(portfolioData?.balance)}</p>
            </div>
          </div>
          <button onClick={() => loadPortfolio(true)} disabled={refreshing}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748b' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#22d3ee'; e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard icon={PieChart} iconColor="#818cf8" label="Total Invested" glowColor="rgba(99,102,241,0.2)"
          value={<AnimatedNumber value={totalInvested} prefix="₹" color="#f1f5f9" />}
          sub={`${portfolioData?.positions?.length || 0} open positions`} delay={0} />
        <SummaryCard icon={Activity} iconColor="#38bdf8" label="Current Value" glowColor="rgba(56,189,248,0.2)"
          value={<AnimatedNumber value={totalCurrent} prefix="₹" color="#f1f5f9" />}
          sub="Mark-to-market value" delay={100} />
        <SummaryCard
          icon={isPositive ? TrendingUp : TrendingDown}
          iconColor={totalInvested === 0 ? '#64748b' : isPositive ? '#34d399' : '#fb7185'}
          glowColor={totalInvested > 0 ? (isPositive ? 'rgba(52,211,153,0.15)' : 'rgba(251,113,133,0.15)') : undefined}
          label="Net P&L"
          value={<>
            <AnimatedNumber value={totalPnL} prefix={isPositive && totalInvested > 0 ? '+₹' : '₹'}
              color={totalInvested === 0 ? '#f1f5f9' : isPositive ? '#34d399' : '#fb7185'} />
          </>}
          sub={totalInvested > 0 ? `${isPositive ? '+' : ''}${pnlPct.toFixed(2)}% return` : 'Unrealized gain/loss'}
          subColor={totalInvested > 0 ? (isPositive ? '#059669' : '#e11d48') : '#475569'}
          delay={200} />
      </div>

      {/* ── Positions ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(9,15,28,0.7)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
        <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <h2 className="text-base font-black" style={{ color: '#f8fafc' }}>Open Positions</h2>
          <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-cyan-400" />
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full"
              style={{ color: '#22d3ee', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)' }}>
              {portfolioData?.positions?.length || 0} Assets
            </span>
          </div>
        </div>

        {(!portfolioData?.positions || portfolioData.positions.length === 0) ? (
          <div className="p-16 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Briefcase size={24} style={{ color: '#334155' }} />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: '#94a3b8' }}>No Holdings Yet</h3>
              <p className="text-sm max-w-xs mx-auto" style={{ color: '#475569' }}>Head to the Dashboard to execute your first trade.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Donut + Allocation */}
            <div className="px-6 py-5 flex items-center gap-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="relative flex-shrink-0">
                <DonutChart positions={portfolioData.positions} totalValue={totalCurrent} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#475569' }}>Total</p>
                  <p className="text-sm font-black font-mono" style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                    ₹{(totalCurrent / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-[0.15em] font-bold mb-3" style={{ color: '#475569' }}>Portfolio Allocation</p>
                <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5 mb-3">
                  {portfolioData.positions.map((pos, i) => {
                    const pct = totalCurrent > 0 ? (pos.current_value / totalCurrent) * 100 : 0;
                    return <div key={i} className="rounded-sm transition-all duration-1000" style={{ width: `${pct}%`, background: colors[i % colors.length] }} title={`${pos.ticker}: ${pct.toFixed(1)}%`} />;
                  })}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {portfolioData.positions.map((pos, i) => {
                    const pct = totalCurrent > 0 ? (pos.current_value / totalCurrent) * 100 : 0;
                    return (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors[i % colors.length] }} />
                        <span className="text-[11px] font-mono font-bold" style={{ color: colors[i % colors.length] }}>{pos.ticker}</span>
                        <span className="text-[11px]" style={{ color: '#475569' }}>{pct.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
                    {['Ticker', 'Qty', 'Avg Price', 'LTP', 'Value', 'P&L'].map((h, i) => (
                      <th key={h} className={`py-3 font-black text-[10px] uppercase tracking-[0.12em] ${i === 0 ? 'pl-6' : 'px-4'} ${i > 1 ? 'text-right' : ''} ${i === 5 ? 'pr-6' : ''}`}
                        style={{ color: '#334155' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {portfolioData.positions.map((pos, i) => (
                    <PositionRow key={i} pos={pos} index={i} colors={colors} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Portfolio;