/**
 * useLivePrices — SSE hook for real-time stock price updates
 *
 * Usage:
 *   const prices = useLivePrices(['RELIANCE','TCS','HDFCBANK']);
 *   // prices = { RELIANCE: { price, change, prev }, TCS: { ... } }
 *
 * Falls back to polling every 15s if SSE isn't supported.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { API } from './app';

const useLivePrices = (tickers = []) => {
  const [prices,    setPrices]    = useState({});
  const [connected, setConnected] = useState(false);
  const [lastUpdate,setLastUpdate]= useState(null);
  const esRef   = useRef(null);
  const pollRef = useRef(null);
  const key     = tickers.join(',');

  /* ── Polling fallback (used when SSE unavailable or on disconnect) ── */
  const pollOnce = useCallback(async () => {
    if (!tickers.length) return;
    try {
      const res = await fetch(`${API}/stream/prices?tickers=${key}`);
      // stream/prices is SSE — for polling fallback hit individual stock endpoints
      // Use cachedFetch pattern but with a shorter TTL
      const results = {};
      await Promise.all(
        tickers.map(async t => {
          try {
            const r = await fetch(`${API}/stock/${t}`);
            const d = await r.json();
            if (d.price) results[t] = { ticker:t, price:d.price, change:d.change, prev:d.price };
          } catch {}
        })
      );
      if (Object.keys(results).length) {
        setPrices(p => ({ ...p, ...results }));
        setLastUpdate(Date.now());
      }
    } catch {}
  }, [key, tickers]);

  useEffect(() => {
    if (!tickers.length) return;

    /* ── Try SSE first ── */
    const url = `${API}/stream/prices?tickers=${encodeURIComponent(key)}`;

    const openSSE = () => {
      if (esRef.current) esRef.current.close();

      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        setConnected(true);
        /* clear polling if SSE works */
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      };

      es.onmessage = e => {
        try {
          const data = JSON.parse(e.data);
          setPrices(p => ({ ...p, ...data }));
          setLastUpdate(Date.now());
        } catch {}
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        esRef.current = null;
        /* Fall back to polling every 15s */
        if (!pollRef.current) {
          pollOnce();
          pollRef.current = setInterval(pollOnce, 15_000);
        }
      };
    };

    /* Initial data immediately via poll, then SSE takes over */
    pollOnce();
    openSSE();

    return () => {
      if (esRef.current)   { esRef.current.close();       esRef.current = null; }
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      setConnected(false);
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { prices, connected, lastUpdate };
};

export default useLivePrices;