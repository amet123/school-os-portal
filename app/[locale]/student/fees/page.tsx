'use client';
import {useEffect, useState} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import Link from 'next/link';

interface FeeEntry {
  posting_date: string; entry_type: string; fee_category: string;
  amount: number; tax_amount: number; balance?: number;
}
interface FeeStatement {entries: FeeEntry[]; balance: number; currency: string}

export default function StudentFeesPage() {
  const t      = useTranslations('student');
  const tn     = useTranslations('nav');
  const tc     = useTranslations('common');
  const locale = useLocale();
  const [data,    setData]    = useState<FeeStatement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/fees')
      .then(r => r.json())
      .then(d => { setData(d as FeeStatement); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const typeColor = (type: string) =>
    type === 'Payment' ? 'text-green-600' : type === 'Charge' ? 'text-slate-700' : 'text-amber-600';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/student`} className="text-blue-200 hover:text-white text-sm">{tc('back')}</Link>
        <h1 className="font-bold text-lg">{t('fees')}</h1>
        <span className="ms-auto text-blue-200 text-sm">{tn('student')}</span>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <p className="text-center text-slate-400 py-16">{tc('loading')}</p>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 text-center">
              <p className="text-4xl font-bold text-emerald-600">
                {data?.currency} {Math.abs(data?.balance ?? 0).toLocaleString()}
              </p>
              <p className="text-slate-500 text-sm mt-1">{t('balance')}</p>
            </div>
            <div className="space-y-2">
              {(!data?.entries || data.entries.length === 0) ? (
                <p className="text-center text-slate-400 py-8">{t('no_records')}</p>
              ) : data.entries.map((e, i) => (
                <div key={i} className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{e.fee_category}</p>
                    <p className="text-xs text-slate-400">{e.posting_date} · {e.entry_type}</p>
                  </div>
                  <span className={`font-bold text-sm ${typeColor(e.entry_type)}`}>
                    {e.entry_type === 'Payment' ? '−' : '+'}{data.currency} {Math.abs(e.amount).toLocaleString()}
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
