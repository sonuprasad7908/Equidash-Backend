import React, { useState } from 'react';
import { Wallet, CreditCard, Shield, CheckCircle, AlertCircle, X, Plus } from 'lucide-react';
import { API } from '../utils/app';

// ── Toast ──
const Toast = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md animate-fade-in ${
      type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-300' : 'bg-rose-900/90 border-rose-500/50 text-rose-300'
    }`}>
      {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 ml-1"><X size={14} /></button>
    </div>
  );
};

const PLANS = [
  { amount: 99, virtual: 500000, label: '₹5 Lakh', tag: 'Starter', color: 'border-slate-700/50' },
  { amount: 199, virtual: 1500000, label: '₹15 Lakh', tag: 'Popular', popular: true, color: 'border-cyan-500/50' },
  { amount: 499, virtual: 5000000, label: '₹50 Lakh', tag: 'Pro', color: 'border-indigo-500/50' },
  { amount: 999, virtual: 10000000, label: '₹1 Crore', tag: 'Elite', color: 'border-yellow-500/50' },
];

const Pricing = ({ user, onBalanceUpdate }) => {
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [addedBalance, setAddedBalance] = useState(0);

  const showToast = (message, type = 'success') => setToast({ message, type });
  const fmt = (n) => (n || 0).toLocaleString('en-IN');

  const loadStripe = () => {
    return new Promise((resolve) => {
      if (window.Stripe) { resolve(window.Stripe); return; }
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => resolve(window.Stripe);
      script.onerror = () => resolve(null);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    const amount = customAmount ? parseInt(customAmount) : selectedPlan?.amount;
    const virtualAmount = customAmount
      ? Math.round(parseInt(customAmount) * 5000)
      : selectedPlan?.virtual;

    if (!amount || amount < 10) {
      showToast('Minimum amount is ₹10', 'error');
      return;
    }

    setLoading(true);

    try {
      // Create payment intent from backend
      const res = await fetch(`${API}/payment/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          user_id: user.id,
          virtual_amount: virtualAmount
        })
      });
      const data = await res.json();

      if (!data.client_secret) {
        showToast('Failed to initiate payment. Try again.', 'error');
        setLoading(false);
        return;
      }

      // Load Stripe
      const StripeConstructor = await loadStripe();
      if (!StripeConstructor) {
        showToast('Failed to load Stripe. Check internet.', 'error');
        setLoading(false);
        return;
      }

      const stripe = StripeConstructor('pk_test_51TB9OrAY1eLPY7upFAsdaOAJTH51SfLIWxWo6XpdPQ2MNZuCcqKBfThSmZBXjfr9DZrOSygxh0Wr7SGhOvpc6xCJ00hgFDQMId');

      // Confirm card payment using Stripe's hosted UI
      const result = await stripe.redirectToCheckout({
        sessionId: data.session_id
      });

      if (result.error) {
        showToast(result.error.message, 'error');
        setLoading(false);
      }

    } catch (error) {
      console.error('Payment error:', error);
      showToast('Payment failed. Try again.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Add Funds</h1>
        <p className="text-cyan-400 text-sm mt-0.5 font-medium">Top up your virtual trading wallet</p>
      </div>

      {/* Current Balance */}
      <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center">
            <Wallet className="text-cyan-400" size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Balance</p>
            <p className="text-2xl font-bold font-mono text-cyan-400">₹{fmt(user?.balance)}</p>
          </div>
        </div>
        <span className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
          Paper Trading
        </span>
      </div>

      {/* Plans */}
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-3">Choose a Plan</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PLANS.map((plan) => (
            <div
              key={plan.amount}
              onClick={() => { setSelectedPlan(plan); setCustomAmount(''); }}
              className={`relative glass-panel p-4 rounded-2xl cursor-pointer transition-all border-2 hover:-translate-y-0.5 ${
                selectedPlan?.amount === plan.amount && !customAmount
                  ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                  : plan.color + ' hover:border-slate-500/70'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2.5 py-0.5 bg-cyan-500 text-slate-900 rounded-full uppercase tracking-wider whitespace-nowrap">
                  Popular
                </span>
              )}
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">{plan.tag}</p>
              <p className="text-xl font-bold font-mono text-white mt-1">₹{fmt(plan.amount)}</p>
              <p className="text-xs text-cyan-400 font-semibold mt-1">→ {plan.label} virtual</p>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-3">Or Enter Custom Amount</p>
        <div className="relative">
          <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-sm">₹</span>
          <input
            type="number"
            value={customAmount}
            onChange={(e) => { setCustomAmount(e.target.value); setSelectedPlan(null); }}
            placeholder="Enter amount (min ₹10)"
            min="10"
            className="w-full pl-8 pr-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500 transition-all placeholder-slate-500 text-sm"
          />
        </div>
        {customAmount && parseInt(customAmount) >= 10 && (
          <p className="text-xs text-cyan-400 mt-2 font-semibold">
            → You'll receive ₹{fmt(parseInt(customAmount) * 5000)} virtual balance
          </p>
        )}
      </div>

      {/* Payment Methods */}
      <div className="glass-panel p-5 rounded-2xl">
        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-4">Accepted Payment Methods</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: '💳', label: 'Cards', sub: 'Visa, Mastercard, RuPay' },
            { icon: '📱', label: 'UPI', sub: 'GPay, PhonePe, Paytm' },
            { icon: '🏦', label: 'Net Banking', sub: 'All major banks' },
            { icon: '👛', label: 'Wallets', sub: 'Paytm, Amazon Pay' },
          ].map(({ icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/30">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="text-sm font-bold text-white">{label}</p>
                <p className="text-[10px] text-slate-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="glass-panel p-5 rounded-2xl">
        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-4">Order Summary</p>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-400 text-sm">You Pay</span>
            <span className="text-white font-bold font-mono">₹{fmt(customAmount ? parseInt(customAmount) || 0 : selectedPlan?.amount || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 text-sm">Virtual Balance Added</span>
            <span className="text-cyan-400 font-bold font-mono">₹{fmt(customAmount ? (parseInt(customAmount) || 0) * 5000 : selectedPlan?.virtual || 0)}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-slate-700/50">
            <span className="text-slate-400 text-sm">New Balance</span>
            <span className="text-emerald-400 font-bold font-mono">₹{fmt((user?.balance || 0) + (customAmount ? (parseInt(customAmount) || 0) * 5000 : selectedPlan?.virtual || 0))}</span>
          </div>
        </div>
      </div>

      {/* Pay Button */}
      <button
        onClick={handlePayment}
        disabled={loading || (!selectedPlan && !customAmount)}
        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:-translate-y-0.5 disabled:opacity-50 text-lg"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Redirecting to Stripe...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <CreditCard size={20} />
            Pay ₹{fmt(customAmount ? parseInt(customAmount) || 0 : selectedPlan?.amount || 0)} via Stripe
          </span>
        )}
      </button>

      {/* Security */}
      <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
        <Shield size={14} />
        <span>Secured by Stripe · 256-bit SSL · Test mode active</span>
      </div>
    </div>
  );
};

export default Pricing;