/**
 * usePushAlerts — browser push notifications for price alerts
 *
 * • Requests notification permission on first call
 * • Polls /api/alerts/check-push/:userId every 60 seconds
 * • Fires a browser Notification when an alert triggers
 * • Works even when the tab is in the background
 *
 * Usage:
 *   const { permitted, checking } = usePushAlerts(user?.id);
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { API } from './app';

const POLL_MS = 60_000; // check every 60 seconds

const usePushAlerts = (userId) => {
  const [permitted, setPermitted] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [checking,  setChecking]  = useState(false);
  const [lastFired, setLastFired] = useState([]);
  const timerRef  = useRef(null);
  const mountedRef= useRef(true);

  /* ── Request permission ── */
  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'unsupported';
    if (Notification.permission === 'granted') { setPermitted('granted'); return 'granted'; }
    if (Notification.permission === 'denied')  { setPermitted('denied');  return 'denied'; }
    const result = await Notification.requestPermission();
    setPermitted(result);
    return result;
  }, []);

  /* ── Fire a browser notification ── */
  const notify = useCallback((alert) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const dir  = alert.condition === 'above' ? 'rose above' : 'fell below';
    const note = new Notification(`🔔 ${alert.ticker} Alert Triggered!`, {
      body: `${alert.ticker} has ${dir} ₹${alert.target_price.toLocaleString('en-IN')}.\nCurrent price: ₹${alert.triggered_price.toLocaleString('en-IN')}${alert.note ? `\n${alert.note}` : ''}`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `alert-${alert.ticker}-${alert.target_price}`,  // dedup same alert
      requireInteraction: true,  // stays until dismissed
    });
    note.onclick = () => { window.focus(); note.close(); };
  }, []);

  /* ── Poll the server ── */
  const checkNow = useCallback(async () => {
    if (!userId || !mountedRef.current) return;
    setChecking(true);
    try {
      const r = await fetch(`${API}/alerts/check-push/${userId}`);
      if (!r.ok) return;
      const d = await r.json();
      if (d.triggered?.length) {
        d.triggered.forEach(a => notify(a));
        if (mountedRef.current) setLastFired(d.triggered);
      }
    } catch {}
    finally { if (mountedRef.current) setChecking(false); }
  }, [userId, notify]);

  /* ── Auto-request + start polling ── */
  useEffect(() => {
    mountedRef.current = true;
    if (!userId) return;

    /* Auto-request permission silently on mount */
    requestPermission();

    /* Initial check after 5s, then every 60s */
    const init = setTimeout(() => { checkNow(); }, 5_000);
    timerRef.current = setInterval(checkNow, POLL_MS);

    return () => {
      mountedRef.current = false;
      clearTimeout(init);
      clearInterval(timerRef.current);
    };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { permitted, checking, lastFired, requestPermission, checkNow };
};

export default usePushAlerts;