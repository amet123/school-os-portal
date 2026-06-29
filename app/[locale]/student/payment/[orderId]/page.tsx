'use client';
import {useEffect, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface OrderStatus {
  order_name: string; status: string; gateway: string;
  amount: number; currency: string; gateway_order_id: string;
}

export default function PaymentCheckout() {
  const {orderId} = useParams<{orderId: string}>();
  const locale    = useLocale();
  const router    = useRouter();
  const [order,   setOrder]   = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState('Loading payment details…');
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/payment/status/${encodeURIComponent(orderId)}`)
      .then(r => r.json())
      .then(async (o: OrderStatus) => {
        setOrder(o);
        setLoading(false);

        if (o.status === 'Paid') {
          router.replace(`/${locale}/student/payment/${encodeURIComponent(orderId)}/status`);
          return;
        }

        if (o.gateway === 'mock') {
          setMsg('Simulating payment… please wait.');
          try {
            await fetch(`/api/payment/simulate/${encodeURIComponent(orderId)}`, {method: 'POST'});
          } catch { /* ignore */ }
          router.replace(`/${locale}/student/payment/${encodeURIComponent(orderId)}/status`);
          return;
        }

        if (o.gateway === 'razorpay') {
          setMsg('Opening Razorpay checkout…');
          // Razorpay flow: key_id comes from checkout_meta (not stored here for security)
          // For now, show manual instructions
          setMsg('Razorpay sandbox: complete payment in the modal that opens.');
        }

        if (o.gateway === 'dibsy') {
          setMsg('Redirecting to Dibsy checkout…');
        }
      })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, [orderId, locale, router]);

  if (loading || !order) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
        <p className="text-slate-500">{msg}</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center border border-slate-200">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="text-slate-700 font-semibold mb-2">Payment Error</p>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <Link href={`/${locale}/student/fees`}
              className="text-blue-600 hover:underline text-sm">← Back to Fees</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800 mb-2">Complete Payment</h1>
        <p className="text-slate-500 text-sm mb-6">{msg}</p>

        <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Amount</span>
            <span className="font-bold text-slate-800">{order.currency} {order.amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Gateway</span>
            <span className="font-medium capitalize text-slate-700">{order.gateway}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Reference</span>
            <span className="font-mono text-xs text-slate-600">{order.gateway_order_id}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
          <p className="text-sm text-slate-500">Processing, please wait…</p>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <Link href={`/${locale}/student/fees`}
                className="text-slate-400 hover:text-slate-600 text-xs">Cancel — Back to Fees</Link>
        </div>
      </div>
    </div>
  );
}
