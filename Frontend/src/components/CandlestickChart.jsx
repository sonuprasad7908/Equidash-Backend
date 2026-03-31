import React, { useEffect, useRef, useCallback } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';

const CandlestickChart = ({ chartData, height = 340 }) => {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);
  const roRef        = useRef(null);

  /* ── Build / update chart ── */
  const initChart = useCallback(() => {
    const el = containerRef.current;
    if (!el || !chartData?.dates?.length) return;

    /* destroy old instance */
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    const w = el.clientWidth || 600;

    chartRef.current = createChart(el, {
      width: w,
      height,
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#64748b',
        fontSize: 11,
        fontFamily: "'IBM Plex Mono', monospace",
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)', style: 1 },
        horzLines: { color: 'rgba(255,255,255,0.04)', style: 1 },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'rgba(34,211,238,0.5)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#0c1a2e',
        },
        horzLine: {
          color: 'rgba(34,211,238,0.3)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#0c1a2e',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        textColor: '#64748b',
        scaleMargins: { top: 0.06, bottom: 0.06 },
        borderVisible: true,
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        textColor: '#64748b',
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale:  { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
    });

    seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
      upColor:       '#22d3ee',
      downColor:     '#fb7185',
      borderVisible: false,
      wickUpColor:   '#22d3ee',
      wickDownColor: '#fb7185',
      // Filled body colors
      upColor:       '#34d399',
      downColor:     '#fb7185',
    });

    const data = chartData.dates.map((date, i) => ({
      time:  date,
      open:  chartData.open[i]  ?? chartData.close[i],
      high:  chartData.high[i]  ?? chartData.close[i],
      low:   chartData.low[i]   ?? chartData.close[i],
      close: chartData.close[i] ?? 0,
    })).filter(d => d.close > 0);

    seriesRef.current.setData(data);
    chartRef.current.timeScale().fitContent();
  }, [chartData, height]);

  /* ── Init on data change ── */
  useEffect(() => {
    initChart();
    return () => {
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
    };
  }, [initChart]);

  /* ── ResizeObserver — reacts to container width changes ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    roRef.current = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w && chartRef.current) {
        chartRef.current.applyOptions({ width: w });
        chartRef.current.timeScale().fitContent();
      }
    });
    roRef.current.observe(el);

    return () => roRef.current?.disconnect();
  }, []);

  if (!chartData?.dates?.length) {
    return (
      <div style={{
        height, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12,
        color: '#334155', fontFamily: "'IBM Plex Mono', monospace",
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M3 3v18h18"/><path d="m7 16 4-4 4 4 4-8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p style={{ fontSize: 12 }}>No chart data available</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height, overflow: 'hidden', borderRadius: 8 }} />
  );
};

export default CandlestickChart;