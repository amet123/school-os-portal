'use client';
import {useEffect, useState, useRef} from 'react';
import {useParams} from 'next/navigation';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface OrderStatus {
  status: string; amount: number; currency: string; paid_at?: string;
}

export default function PaymentStatus() {
  const {orderId} = useParams<{orderId: string}>();
  const locale    = useLocale();
  const [order,   setOrder]   = useState<OrderStatus | null>(null);
  const [polling, setPolling] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!orderId) return;
    const poll = async () => {
      try {
        const r = await fetch(`/api/payment/status/${encodeURIComponent(orderId)}`);
        const o = await r.json() as OrderStatus;
        setOrder(o);
        if (o.status !== 'Pending') {
          setPolling(false);
          clearInterval(timerRef.current);
        }
      } catch { /* keep polling */ }
    };
    poll();
    timerRef.current = setInterval(poll, 2000);
    return () => clearInterval(timerRef.current);
  }, [orderId]);

  if (polling || !order) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-5"/>
        <p className="text-slate-600 font-medium">Confirming payment…</p>
        <p className="text-slate-400 text-sm mt-1">Please keep this page open.</p>
      </div>
    </div>
  );

  const success = order.status === 'Paid';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className={`bg-white rounded-2xl p-8 max-w-sm w-full text-center border shadow-sm
        ${success ? 'border-emerald-200' : 'border-rose-200'}`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5
          ${success ? 'bg-emerald-100' : 'bg-rose-100'}`}>
          <span className="text-4xl">{success ? '✓' : '✗'}</span>
        </div>

        <h1 className={`text-2xl font-bold mb-2 ${success ? 'text-emerald-700' : 'text-rose-700'}`}>
          {success ? 'Payment Successful' : 'Payment Failed'}
        </h1>

        {success && (
          <p className="text-slate-600 text-sm mb-4">
            {order.currency} {order.amount.toLocaleString()} received
            {order.paid_at ? ` on ${new Date(order.paid_at).toLocaleString()}` : ''}
          </p>
        )}

        {!success && (
          <p className="text-slate-500 text-sm mb-4">
            Status: {order.status}. Please try again or contact the school office.
          </p>
        )}

        <div className="flex flex-col gap-3 mt-6">
          <Link href={`/${locale}/student/fees`}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition">
            View Fee Statement
          </Link>
          <Link href={`/${locale}/student`}
                className="text-slate-400 hover:text-slate-600 text-sm">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
