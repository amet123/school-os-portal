'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Overview {
  total_charged:number; total_collected:number; total_concession:number;
  outstanding:number; collection_pct:number;
  by_category:{category:string;charged:number;collected:number;outstanding:number}[];
  defaulters:{student:string;student_name:string;balance:number}[];
  monthly_trend:{month:string;collected:number}[];
  total_students_with_balance:number;
}

export default function AdminFees() {
  const locale = useLocale();
  const [ov,      setOv]      = useState<Overview|null>(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selStu,  setSelStu]  = useState('');
  const [stmt,    setStmt]    = useState<any>(null);
  const [stmtLoading, setStmtLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/fees/overview').then(r=>r.json())
      .then(d => { setOv(d.overview ?? null); setLoading(false); })
      .catch(() => setLoading(false));
    fetch('/api/admin/fees/students').then(r=>r.json())
      .then(d => setStudents(d.students ?? []));
  }, []);

  const loadStmt = async (stu: string) => {
    if (!stu) return;
    setSelStu(stu); setStmtLoading(true); setStmt(null);
    const r = await fetch(`/api/admin/fees/statement/${encodeURIComponent(stu)}`);
    const d = await r.json();
    setStmt(d.statement ?? null);
    setStmtLoading(false);
  };

  const fmtDate = (d:string) => d?.slice(0,10)||'';
  const fmt = (n:number) => (n||0).toLocaleString('en-IN',{minimumFractionDigits:2});
  const maxCharged = ov ? Math.max(...(ov.by_category.map(c=>c.charged)||[1])) : 1;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-indigo-700 to-violet-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/admin`} className="text-indigo-200 hover:text-white text-sm">← Admin</Link>
        <h1 className="font-bold text-lg flex-1">Fee Overview</h1>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1,2,3,4,5].map(i=><div key={i} className="h-20 bg-white rounded-2xl border animate-pulse"/>)}
          </div>
        ) : ov && (
          <>
            {/* KPI bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                {label:'Total Billed',    val:fmt(ov.total_charged),   col:'slate'},
                {label:'Collected',       val:fmt(ov.total_collected),  col:'emerald'},
                {label:'Concession',      val:fmt(ov.total_concession), col:'blue'},
                {label:'Outstanding',     val:fmt(ov.outstanding),      col:'amber'},
                {label:'Collection %',    val:`${ov.collection_pct}%`,  col: ov.collection_pct >= 80 ? 'emerald' : 'rose'},
              ].map(c=>(
                <div key={c.label} className={`rounded-2xl border p-3 text-center bg-${c.col}-50 border-${c.col}-200`}>
                  <p className={`text-xs font-medium text-${c.col}-600 uppercase truncate`}>{c.label}</p>
                  <p className={`text-xl font-bold text-${c.col}-700 mt-1`}>{c.val}</p>
                </div>
              ))}
            </div>

            {/* Monthly trend */}
            {ov.monthly_trend.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Monthly Collections</p>
                <div className="flex items-end gap-2 h-24">
                  {ov.monthly_trend.map(t => {
                    const maxC = Math.max(...ov.monthly_trend.map(x=>x.collected), 1);
                    const h = Math.round((t.collected / maxC) * 80);
                    return (
                      <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-slate-500">{fmt(t.collected)}</span>
                        <div className="w-full bg-indigo-500 rounded-t" style={{height:`${h}px`}}/>
                        <span className="text-xs text-slate-400">{t.month.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* By category */}
              {ov.by_category.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">By Fee Category</p>
                  {ov.by_category.map(c=>(
                    <div key={c.category} className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-700 font-medium truncate">{c.category}</span>
                        <span className="text-rose-600 text-xs ml-2 shrink-0">
                          {c.outstanding > 0 ? `₹${fmt(c.outstanding)} due` : '✓'}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-emerald-500 rounded-full"
                          style={{width:`${Math.min(100, c.charged > 0 ? (c.collected/c.charged)*100 : 0)}%`}}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Defaulters */}
              {ov.defaulters.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Outstanding ({ov.total_students_with_balance} students)
                  </p>
                  <div className="space-y-2">
                    {ov.defaulters.slice(0,10).map(d=>(
                      <button key={d.student} onClick={() => loadStmt(d.student)}
                        className="w-full text-left flex justify-between items-center py-2 px-3 rounded-xl hover:bg-slate-50 transition">
                        <span className="text-sm font-medium text-slate-800">{d.student_name}</span>
                        <span className="text-sm font-bold text-amber-600">₹{fmt(d.balance)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Student lookup */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Student Fee Lookup</p>
          <div className="flex gap-2 mb-4">
            <select value={selStu} onChange={e => loadStmt(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="">Select a student…</option>
              {students.map((s:any) => (
                <option key={s.student} value={s.student}>
                  {s.student_name} {s.balance > 0 ? `— ₹${fmt(s.balance)} due` : '— Paid'}
                </option>
              ))}
            </select>
          </div>

          {stmtLoading && <div className="h-24 bg-slate-50 rounded-xl animate-pulse"/>}

          {stmt && !stmtLoading && (
            <div>
              <div className="flex gap-3 mb-4">
                {[
                  {l:'Charged',  v:stmt.charged,  col:'rose'},
                  {l:'Paid',     v:stmt.paid,      col:'emerald'},
                  {l:'Balance',  v:stmt.balance,   col:'amber'},
                ].map(c=>(
                  <div key={c.l} className={`flex-1 rounded-xl p-3 text-center bg-${c.col}-50 border border-${c.col}-200`}>
                    <p className={`text-xs text-${c.col}-600`}>{c.l}</p>
                    <p className={`text-base font-bold text-${c.col}-700`}>₹{fmt(c.v)}</p>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>{['Date','Category','Type','Amount'].map(h=>(
                      <th key={h} className="text-left text-slate-500 font-semibold px-3 py-2">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {stmt.ledger?.map((r:any, i:number)=>(
                      <tr key={r.name} className={i%2===0?'':'bg-slate-50/40'}>
                        <td className="px-3 py-2 text-slate-500">{fmtDate(r.posting_date)}</td>
                        <td className="px-3 py-2 text-slate-700">{r.fee_category}</td>
                        <td className="px-3 py-2 text-slate-500">{r.entry_type}</td>
                        <td className={`px-3 py-2 font-semibold ${r.amount < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {r.amount < 0 ? '−' : '+'}₹{Math.abs(r.amount).toLocaleString('en-IN',{minimumFractionDigits:2})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
