import React, { useEffect, useState } from 'react';

const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);

  const phases = [
    'Initializing Market Data...',
    'Connecting to NSE/BSE...',
    'Loading AI Engine...',
    'Preparing Your Terminal...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete(), 400);
          return 100;
        }
        return prev + 1.2;
      });
    }, 28);
    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    setPhase(Math.min(3, Math.floor(progress / 25)));
  }, [progress]);

  const bars = [
    { h: 40, delay: '0s' },
    { h: 65, delay: '0.1s' },
    { h: 30, delay: '0.2s' },
    { h: 75, delay: '0.3s' },
    { h: 50, delay: '0.4s' },
    { h: 85, delay: '0.5s' },
    { h: 45, delay: '0.6s' },
    { h: 60, delay: '0.7s' },
  ];

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at top, #0f1a2e 0%, #0a0f1e 50%, #000000 100%)' }}>

      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(34,211,238,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', filter: 'blur(40px)' }} />

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-8">

        {/* Logo */}
        <div className="flex items-center gap-3" style={{ animation: 'fadeSlideDown 0.6s ease forwards' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.5)]"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <div>
            <span className="text-4xl font-bold text-white">Equi</span>
            <span className="text-4xl font-bold" style={{ color: '#22d3ee' }}>Dash</span>
          </div>
        </div>

        {/* Animated candle bars */}
        <div className="flex items-end gap-2 h-24" style={{ animation: 'fadeSlideUp 0.6s ease 0.2s both' }}>
          {bars.map((bar, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              {/* Wick top */}
              <div className="w-0.5 rounded-full" style={{
                height: '8px',
                background: i % 2 === 0 ? '#22d3ee' : '#f43f5e',
                animation: `wickGrow 0.5s ease ${bar.delay} both`
              }} />
              {/* Candle body */}
              <div className="w-4 rounded-sm" style={{
                height: `${bar.h}%`,
                maxHeight: '72px',
                minHeight: '16px',
                background: i % 2 === 0
                  ? 'linear-gradient(180deg, #22d3ee, #0e7490)'
                  : 'linear-gradient(180deg, #f43f5e, #9f1239)',
                animation: `barGrow 0.6s ease ${bar.delay} both`,
                boxShadow: i % 2 === 0 ? '0 0 8px rgba(34,211,238,0.4)' : '0 0 8px rgba(244,63,94,0.4)'
              }} />
              {/* Wick bottom */}
              <div className="w-0.5 rounded-full" style={{
                height: '6px',
                background: i % 2 === 0 ? '#22d3ee' : '#f43f5e',
              }} />
            </div>
          ))}
        </div>

        {/* Progress section */}
        <div className="flex flex-col items-center gap-4 w-72" style={{ animation: 'fadeSlideUp 0.6s ease 0.4s both' }}>

          {/* Phase text */}
          <p className="text-sm font-mono tracking-widest uppercase" style={{ color: '#22d3ee' }}>
            {phases[phase]}
          </p>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                boxShadow: '0 0 10px rgba(34,211,238,0.6)'
              }} />
          </div>

          {/* Percentage */}
          <p className="text-xs font-mono text-slate-500">{Math.min(100, Math.floor(progress))}%</p>
        </div>

        {/* Tagline */}
        <p className="text-slate-600 text-xs tracking-widest uppercase" style={{ animation: 'fadeSlideUp 0.6s ease 0.6s both' }}>
          AI-Powered Trading Terminal
        </p>
      </div>

      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes barGrow {
          from { transform: scaleY(0); transform-origin: bottom; opacity: 0; }
          to { transform: scaleY(1); transform-origin: bottom; opacity: 1; }
        }
        @keyframes wickGrow {
          from { opacity: 0; transform: scaleY(0); }
          to { opacity: 1; transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;