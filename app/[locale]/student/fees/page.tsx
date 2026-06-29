'use client';
import {useEffect, useState, useCallback} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';
import {useRouter} from 'next/navigation';

interface FeeEntry {
  name: string; posting_date: string; entry_type: string;
  fee_category: string; amount: number; tax_amount: number;
  is_reversed?: number; gateway_txn_ref?: string;
}
interface FeeStatement {entries: FeeEntry[]; balance: number; currency?: string}

export default function StudentFeesPage() {
  const locale  = useLocale();
  const router  = useRouter();
  const [data,     setData]     = useState<FeeStatement | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [paying,   setPaying]   = useState(false);
  const [payError, setPayError] = useState('');

  const refresh = useCallback(() => {
    setLoading(true);
    fetch('/api/student/fees')
      .then(r => r.json())
      .then(d => { setData(d as FeeStatement); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(refresh, [refresh]);

  const typeColor = (t: string) =>
    t === 'Payment' ? 'text-green-600' : t === 'Reversal' ? 'text-amber-600' : 'text-slate-700';

  const outstanding = (data?.balance ?? 0) > 0;

  async function handlePayNow() {
    setPaying(true);
    setPayError('');
    try {
      const me = await fetch('/api/auth/me').then(r => r.json());
      const student = me.session?.student?.name;
      const company = me.session?.student?.region_company;
      if (!student || !company) throw new Error('Session missing student/company');

      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({student, company}),
      });
      const order = await res.json();
      if (order.error) throw new Error(order.error);
      router.push(`/${locale}/student/payment/${encodeURIComponent(order.order_name)}`);
    } catch (e: unknown) {
      setPayError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  }

  const currency = data?.currency ?? 'INR';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/student`} className="text-blue-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg">My Fees</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i=><div key={i} className="bg-white rounded-xl h-16 animate-pulse border border-slate-200"/>)}
          </div>
        ) : (
          <>
            {/* Balance card */}
            <div className={`rounded-2xl p-6 mb-6 text-center shadow-sm border
              ${outstanding
                ? 'bg-gradient-to-br from-rose-50 to-orange-50 border-rose-200'
                : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'}`}>
              <p className={`text-4xl font-bold ${outstanding ? 'text-rose-600' : 'text-emerald-600'}`}>
                {currency} {Math.abs(data?.balance ?? 0).toLocaleString()}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                {outstanding ? 'Outstanding Balance' : 'No Outstanding Balance'}
              </p>

              {outstanding && (
                <div className="mt-4">
                  <button
                    onClick={handlePayNow}
                    disabled={paying}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold
                               px-8 py-3 rounded-xl shadow transition-all active:scale-95"
                  >
                    {paying ? 'Processing...' : `Pay ${currency} ${(data?.balance ?? 0).toLocaleString()} Now`}
                  </button>
                  {payError && <p className="text-red-500 text-xs mt-2">{payError}</p>}
                </div>
              )}
            </div>

            {/* Transaction history */}
            <div className="space-y-2">
              {(!data?.entries || data.entries.length === 0) ? (
                <p className="text-center text-slate-400 py-8">No fee records found.</p>
              ) : data.entries.map((e, i) => (
                <div key={i} className={`bg-white rounded-xl border px-4 py-3 flex items-center justify-between
                  ${e.is_reversed ? 'opacity-50 border-slate-100' : 'border-slate-200'}`}>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{e.fee_category}</p>
                    <p className="text-xs text-slate-400">
                      {e.posting_date} · {e.entry_type}
                      {e.gateway_txn_ref ? ` · ${e.gateway_txn_ref.slice(0,12)}…` : ''}
                    </p>
                  </div>
                  <span className={`font-bold text-sm ${typeColor(e.entry_type)}`}>
                    {e.entry_type === 'Payment' ? '−' : '+'}{currency} {Math.abs(e.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
