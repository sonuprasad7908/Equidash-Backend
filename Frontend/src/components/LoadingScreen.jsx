import React, { useEffect, useRef, useState } from 'react';

const LABELS = [
  'Initializing systems…',
  'Connecting to NSE/BSE…',
  'Loading AI engine…',
  'Preparing terminal…',
  'Ready',
];

const LoadingScreen = ({ onComplete }) => {
  const canvasRef = useRef(null);
  const mountedRef = useRef(true);  // ← guards all state updates
  const rafRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState('Initializing systems…');



  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Progress ticker — safe
  useEffect(() => {
    const start = Date.now();
    const DURATION = 3200;
    const tick = () => {
      if (!mountedRef.current) return;
      const elapsed = Date.now() - start;
      const p = Math.min(100, Math.round((elapsed / DURATION) * 100));
      setProgress(p);
      setLabel(LABELS[Math.floor((p / 100) * (LABELS.length - 1))]);
      if (p < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          if (mountedRef.current) onComplete();
        }, 500);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [onComplete]);

  // Canvas 3D sphere
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!mountedRef.current) return;
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Sphere particles
    const N = 280;
    const particles = Array.from({ length: N }, (_, i) => {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / N);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      return {
        phi,
        theta,
        r: 0.8 + Math.random() * 1.4,
        speed: 0.0003 + Math.random() * 0.0003,
        color: ['#22d3ee', '#a78bfa', '#34d399'][i % 3],
      };
    });

    // Rings
    const rings = [
      { angle: 0.3, rot: 0, speed: 0.007,  color: '#22d3ee', n: 60, radius: 1.3  },
      { angle: 1.1, rot: 1, speed: -0.005, color: '#a78bfa', n: 50, radius: 1.25 },
      { angle: 0.7, rot: 2, speed: 0.006,  color: '#34d399', n: 40, radius: 1.2  },
    ];

    const rotY = (x, y, z, a) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
    const rotX = (x, y, z, a) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
    const proj = (x, y, z, cx, cy, fov = 600) => {
      const s = fov / (fov + z);
      return [cx + x * s, cy + y * s, s];
    };

    let t = 0;
    let localRaf;

    const draw = () => {
      if (!mountedRef.current) return;
      t += 0.01;
      ctx.clearRect(0, 0, W, H);

      // BG
      const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H));
      bg.addColorStop(0, '#06090f');
      bg.addColorStop(1, '#020408');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Grid floor
      ctx.save();
      const gy = H * 0.78;
      for (let r = 0; r <= 8; r++) {
        const frac = r / 8;
        const xw = W * 0.7 * (1 - frac * 0.65);
        const yy = gy - frac * H * 0.32;
        ctx.beginPath();
        ctx.moveTo(W / 2 - xw, yy);
        ctx.lineTo(W / 2 + xw, yy);
        ctx.strokeStyle = `rgba(34,211,238,${0.04 * (1 - frac)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      for (let c = 0; c <= 16; c++) {
        const fx = (c / 16) * W * 0.7 - W * 0.35;
        ctx.beginPath();
        ctx.moveTo(W / 2 + fx, gy);
        ctx.lineTo(W / 2, H * 0.46);
        ctx.strokeStyle = 'rgba(34,211,238,0.03)';
        ctx.lineWidth = 0.4;
        ctx.stroke();
      }
      ctx.restore();

      const cx = W / 2, cy = H / 2 - 50;
      const R = Math.min(W, H) * 0.2;

      // Sphere
      const pts3d = particles.map(p => {
        const th = p.theta + t * p.speed * 60;
        const sp = Math.sin(p.phi), cp = Math.cos(p.phi);
        let x = R * sp * Math.cos(th);
        let y = R * sp * Math.sin(th);
        let z = R * cp;
        [x, y, z] = rotY(x, y, z, t * 0.4);
        [x, y, z] = rotX(x, y, z, t * 0.2);
        const [px, py, sc] = proj(x, y, z, cx, cy);
        const depth = (z + R) / (2 * R);
        return { px, py, sc, depth, color: p.color, r: p.r };
      });

      // Sort back-to-front
      pts3d.sort((a, b) => a.depth - b.depth);
      pts3d.forEach(({ px, py, sc, depth, color, r }) => {
        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.3, r * sc * 0.8), 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.25 + depth * 0.75;
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Rings
      rings.forEach(ring => {
        ring.rot += ring.speed;
        const rR = R * ring.radius;
        const pts = [];
        for (let i = 0; i <= ring.n; i++) {
          const a = (i / ring.n) * Math.PI * 2;
          let x = rR * Math.cos(a), y = rR * Math.sin(a), z = 0;
          [x, y, z] = rotX(x, y, z, ring.angle);
          [x, y, z] = rotY(x, y, z, ring.rot + t * 0.2);
          const [px, py, sc] = proj(x, y, z, cx, cy);
          pts.push({ px, py, z, sc });
        }
        for (let i = 0; i < ring.n; i++) {
          const a = pts[i], b = pts[i + 1];
          const depth = ((a.z + b.z) / 2 / rR + 1) / 2;
          ctx.beginPath();
          ctx.moveTo(a.px, a.py);
          ctx.lineTo(b.px, b.py);
          ctx.strokeStyle = ring.color;
          ctx.lineWidth = 1.2 * ((a.sc + b.sc) / 2);
          ctx.globalAlpha = 0.15 + depth * 0.85;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      });

      // Core glow
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.7);
      g.addColorStop(0, 'rgba(34,211,238,0.14)');
      g.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.7, 0, Math.PI * 2);
      ctx.fill();

      localRaf = requestAnimationFrame(draw);
    };

    localRaf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(localRaf);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#020408',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
    }}>
      <canvas ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* Logo — centered over sphere */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', marginBottom: 200, pointerEvents: 'none' }}>
        <h1 style={{
          fontSize: 32, fontWeight: 900, letterSpacing: '-0.04em',
          fontFamily: "'Syne', 'Inter', sans-serif",
          color: '#f8fafc',
          textShadow: '0 0 40px rgba(34,211,238,0.5), 0 0 80px rgba(34,211,238,0.2)',
        }}>
          Equi<span style={{ color: '#22d3ee' }}>Dash</span>
        </h1>
        <p style={{ fontSize: 10, color: '#334155', letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 6 }}>
          Trading Intelligence Platform
        </p>
      </div>

      {/* Progress bar — bottom */}
      <div style={{ position: 'absolute', bottom: 48, left: '50%', transform: 'translateX(-50%)', width: 280, textAlign: 'center' }}>
        <div style={{ height: 2, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 12 }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: 'linear-gradient(90deg,#22d3ee,#a78bfa,#34d399)',
            width: `${progress}%`,
            transition: 'width 0.08s linear',
            boxShadow: '0 0 12px rgba(34,211,238,0.7)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 10, color: '#334155', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</p>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#22d3ee', fontFamily: 'monospace' }}>{progress}%</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;