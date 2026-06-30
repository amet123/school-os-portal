'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface LedgerRow {
  name:string; posting_date:string; entry_type:string;
  fee_category:string; academic_term:string; amount:number; currency:string;
}
interface Child {
  student:string; student_name:string; charged:number; paid:number;
  balance:number; currency:string;
  ledger: LedgerRow[];
  payments: {name:string;payment_date:string;amount:number;currency:string;payment_gateway:string;status:string}[];
}

const ENTRY_CLR: Record<string,string> = {
  'Fee':        'text-rose-600',
  'Payment':    'text-emerald-600',
  'Concession': 'text-blue-600',
  'Adjustment': 'text-amber-600',
};

export default function ParentFees() {
  const locale = useLocale();
  const [data,      setData]      = useState<{children:Child[]}|null>(null);
  const [loading,   setLoading]   = useState(true);
  const [selChild,  setSelChild]  = useState(0);
  const [activeTab, setActiveTab] = useState<'ledger'|'payments'>('ledger');

  useEffect(() => {
    fetch('/api/parent/fees/statement')
      .then(r=>r.json())
      .then(d => { setData(d ?? {children:[]}); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const child = data?.children[selChild];
  const fmtDate = (d:string) => d?.slice(0,10)||'';
  const fmtAmt  = (amt:number, cur:string) => {
    const abs = Math.abs(amt);
    return (amt < 0 ? '−' : '') + abs.toLocaleString('en-IN', {minimumFractionDigits:2});
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-indigo-700 to-violet-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/parent`} className="text-indigo-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg flex-1">Fee Statement</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {loading ? (
          <>{[1,2].map(i=><div key={i} className="h-24 bg-white rounded-2xl border animate-pulse"/>)}</>
        ) : !data || data.children.length === 0 ? (
          <div className="bg-white rounded-2xl border p-10 text-center">
            <p className="text-3xl mb-2">💸</p>
            <p className="text-slate-500 text-sm">No fee records found for your children.</p>
          </div>
        ) : (
          <>
            {/* Child selector */}
            {data.children.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {data.children.map((c,i) => (
                  <button key={c.student} onClick={() => { setSelChild(i); setActiveTab('ledger'); }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                      selChild===i ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                    }`}>
                    {c.student_name}
                  </button>
                ))}
              </div>
            )}

            {child && (
              <>
                {/* Balance cards */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {label:'Total Charged', val:child.charged, col:'rose'},
                    {label:'Total Paid',    val:child.paid,    col:'emerald'},
                    {label:'Outstanding',   val:child.balance, col: child.balance > 0 ? 'amber' : 'emerald'},
                  ].map(c=>(
                    <div key={c.label} className={`rounded-2xl border p-4 text-center bg-${c.col}-50 border-${c.col}-200`}>
                      <p className={`text-xs font-medium text-${c.col}-600 uppercase`}>{c.label}</p>
                      <p className={`text-xl font-bold text-${c.col}-700 mt-1`}>
                        {child.currency} {c.val.toLocaleString('en-IN', {minimumFractionDigits:2})}
                      </p>
                    </div>
                  ))}
                </div>

                {child.balance > 0 && (
                  <Link href={`/${locale}/student/payment`}
                    className="block text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-2xl transition text-sm">
                    Pay Now → {child.currency} {child.balance.toLocaleString('en-IN', {minimumFractionDigits:2})}
                  </Link>
                )}

                {/* Tabs */}
                <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
                  {(['ledger','payments'] as const).map(t=>(
                    <button key={t} onClick={() => setActiveTab(t)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition ${
                        activeTab===t ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
                      }`}>
                      {t === 'ledger' ? 'Fee Ledger' : 'Payments'}
                    </button>
                  ))}
                </div>

                {activeTab === 'ledger' && (
                  child.ledger.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-6">No ledger entries.</p>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            {['Date','Category','Type','Amount'].map(h=>(
                              <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-2.5">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {child.ledger.map((r,i)=>(
                            <tr key={r.name} className={i%2===0?'':'bg-slate-50/40'}>
                              <td className="px-4 py-2.5 text-slate-500 text-xs">{fmtDate(r.posting_date)}</td>
                              <td className="px-4 py-2.5 text-slate-700">{r.fee_category}</td>
                              <td className="px-4 py-2.5 text-xs text-slate-500">{r.entry_type}</td>
                              <td className={`px-4 py-2.5 font-semibold ${ENTRY_CLR[r.entry_type]??'text-slate-700'}`}>
                                {r.amount < 0 ? '−' : '+'}{child.currency} {Math.abs(r.amount).toLocaleString('en-IN',{minimumFractionDigits:2})}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}

                {activeTab === 'payments' && (
                  child.payments.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-6">No payment records.</p>
                  ) : (
                    <div className="space-y-2">
                      {child.payments.map(p=>(
                        <div key={p.name} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between shadow-sm">
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {p.currency} {flt(p.amount).toLocaleString('en-IN',{minimumFractionDigits:2})}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{fmtDate(p.payment_date)} · {p.payment_gateway}</p>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">{p.status}</span>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function flt(v: any): number { return parseFloat(v) || 0; }
