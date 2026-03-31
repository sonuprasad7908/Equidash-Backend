import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API } from '../utils/app';

const PaymentSuccess = ({ onBalanceUpdate }) => {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const userId = params.get('user_id');
    const virtualAmount = params.get('virtual_amount');

    if (!sessionId || !userId || !virtualAmount) {
      setStatus('error');
      setMessage('Invalid payment session.');
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await fetch(
          `${API}/payment/verify-session?session_id=${sessionId}&user_id=${userId}&virtual_amount=${virtualAmount}`
        );
        const data = await res.json();

        if (data.status === 'success') {
          setStatus('success');
          setMessage(`₹${parseInt(virtualAmount).toLocaleString('en-IN')} virtual balance added!`);
          if (onBalanceUpdate) onBalanceUpdate(data.new_balance);
        } else {
          setStatus('error');
          setMessage('Payment verification failed.');
        }
      } catch (e) {
        setStatus('error');
        setMessage('Something went wrong. Contact support.');
      }
    };

    verifyPayment();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="glass-panel p-10 rounded-2xl w-[400px] text-center border border-slate-700/50 shadow-2xl">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-white mb-2">Verifying Payment...</h2>
            <p className="text-slate-400 text-sm">Please wait while we confirm your payment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-emerald-400" size={36} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Successful! 🎉</h2>
            <p className="text-emerald-400 font-semibold mb-6">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl transition-all hover:-translate-y-0.5"
            >
              Start Trading 🚀
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="text-rose-400" size={36} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Failed</h2>
            <p className="text-slate-400 text-sm mb-6">{message}</p>
            <button
              onClick={() => navigate('/pricing')}
              className="w-full py-3 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl transition-all"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;