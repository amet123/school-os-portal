'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface SalarySlip {
  name: string; start_date: string; end_date: string;
  gross_pay: number; total_deduction: number; net_pay: number;
}
interface SlipDetail {
  name: string; start_date: string; end_date: string;
  gross_pay: number; net_pay: number; total_deduction: number;
  earnings: {component: string; abbr: string; amount: number}[];
  deductions: {component: string; abbr: string; amount: number}[];
}

export default function TeacherPayslip() {
  const locale = useLocale();
  const [slips,    setSlips]    = useState<SalarySlip[]>([]);
  const [selected, setSelected] = useState<SlipDetail | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [detailLoading, setDL]  = useState(false);

  useEffect(() => {
    fetch('/api/teacher/payslip')
      .then(r => r.json())
      .then(d => { setSlips(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function loadDetail(name: string) {
    setDL(true);
    try {
      const r = await fetch(`/api/teacher/payslip/${encodeURIComponent(name)}`);
      const d = await r.json();
      setSelected(d);
    } catch { /* ignore */ }
    setDL(false);
  }

  const fmt = (n: number) => n.toLocaleString('en-IN', {maximumFractionDigits: 0});
  const monthLabel = (d: string) => new Date(d).toLocaleString('default', {month: 'long', year: 'numeric'});

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/teacher`} className="text-emerald-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg">My Payslips</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <>{[1,2,3].map(i=><div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-slate-200"/>)}</>
        ) : slips.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
            <p className="text-4xl mb-3">💼</p>
            <p className="text-slate-500">No payslips found for your account.</p>
            <p className="text-xs text-slate-400 mt-2">Contact HR if you believe this is an error.</p>
          </div>
        ) : slips.map(s => (
          <button key={s.name} onClick={() => loadDetail(s.name)}
            className="w-full bg-white rounded-2xl border border-slate-200 p-5 shadow-sm
                       hover:border-emerald-300 hover:shadow-md transition text-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">{monthLabel(s.start_date)}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.start_date} – {s.end_date}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-700">₹ {fmt(s.net_pay)}</p>
                <p className="text-xs text-slate-400">net pay</p>
              </div>
            </div>
            <div className="flex gap-4 mt-3 text-xs text-slate-500">
              <span>Gross: ₹{fmt(s.gross_pay)}</span>
              <span>Deductions: ₹{fmt(s.total_deduction)}</span>
            </div>
          </button>
        ))}

        {/* Detail panel */}
        {(selected || detailLoading) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            {detailLoading ? (
              <div className="animate-pulse space-y-2">
                {[1,2,3,4].map(i=><div key={i} className="h-4 bg-slate-100 rounded"/>)}
              </div>
            ) : selected && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-slate-800">{monthLabel(selected.start_date)} Details</h2>
                  <button onClick={() => setSelected(null)}
                    className="text-slate-400 hover:text-slate-600 text-sm">✕ Close</button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  <Stat label="Gross" value={fmt(selected.gross_pay)} color="blue"/>
                  <Stat label="Deductions" value={fmt(selected.total_deduction)} color="rose"/>
                  <Stat label="Net Pay" value={fmt(selected.net_pay)} color="emerald"/>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Earnings</p>
                    {selected.earnings.map((e,i) => (
                      <div key={i} className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-600">{e.component}</span>
                        <span className="font-medium text-slate-800">{fmt(e.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Deductions</p>
                    {selected.deductions.length === 0
                      ? <p className="text-slate-400 text-xs">None</p>
                      : selected.deductions.map((d,i) => (
                        <div key={i} className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-600">{d.component}</span>
                          <span className="font-medium text-rose-600">{fmt(d.amount)}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({label, value, color}: {label: string; value: string; color: string}) {
  const cls = {
    blue:    'bg-blue-50 text-blue-700',
    rose:    'bg-rose-50 text-rose-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  }[color] ?? 'bg-slate-50 text-slate-700';
  return (
    <div className={`rounded-xl p-3 text-center ${cls}`}>
      <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
      <p className="font-bold mt-0.5">{value}</p>
    </div>
  );
}
