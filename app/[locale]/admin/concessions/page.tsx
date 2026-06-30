'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Dash {
  pending: number; approved: number; rejected: number;
  breakdown: {scholarship: string; count: number; total_saved: number}[];
  pending_list: PendingItem[];
}
interface PendingItem {
  name: string; student: string; student_name: string;
  scholarship: string; academic_year: string; from_date: string; remarks: string;
}

export default function AdminConcessions() {
  const locale = useLocale();
  const [dash,    setDash]    = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/concessions')
      .then(r => r.json())
      .then(d => { setDash(d ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function act(name: string, action: 'approve' | 'reject') {
    setActing(name);
    await fetch(`/api/admin/concessions/${encodeURIComponent(name)}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({action}),
    });
    setActing(null);
    load();
  }

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}) : '–';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-indigo-700 to-violet-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/admin`} className="text-indigo-200 hover:text-white text-sm">← Admin</Link>
        <h1 className="font-bold text-lg">Fee Concessions</h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Stat bar */}
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse"/>)}
          </div>
        ) : dash && (
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Pending"  value={dash.pending}  color="amber"/>
            <StatCard label="Approved" value={dash.approved} color="emerald"/>
            <StatCard label="Rejected" value={dash.rejected} color="rose"/>
          </div>
        )}

        {/* Pending approvals */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Pending Approvals
            {dash && dash.pending > 0 && <span className="text-amber-600 ml-1">({dash.pending})</span>}
          </h2>
          {loading ? (
            <>{[1,2].map(i => <div key={i} className="h-20 bg-white rounded-2xl border animate-pulse mb-2"/>)}</>
          ) : !dash || dash.pending_list.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-slate-500 text-sm">No pending concession requests.</p>
            </div>
          ) : dash.pending_list.map(a => (
            <div key={a.name} className="bg-white rounded-2xl border border-slate-200 p-4 mb-2 flex items-center justify-between shadow-sm">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800">{a.student_name || a.student}</p>
                <p className="text-sm text-slate-600">{a.scholarship} · {a.academic_year}</p>
                <p className="text-xs text-slate-400 mt-0.5">Applied: {fmt(a.from_date)}
                  {a.remarks && <span className="italic"> — "{a.remarks}"</span>}
                </p>
              </div>
              <div className="flex gap-2 ml-4 shrink-0">
                <button disabled={acting === a.name} onClick={() => act(a.name, 'approve')}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                  Approve
                </button>
                <button disabled={acting === a.name} onClick={() => act(a.name, 'reject')}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* Scholarship breakdown */}
        {dash && dash.breakdown.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Approved — by Scholarship</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Scholarship', 'Beneficiaries', 'Total Saved'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dash.breakdown.map((r, i) => (
                    <tr key={r.scholarship} className={i % 2 === 0 ? '' : 'bg-slate-50/50'}>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{r.scholarship}</td>
                      <td className="px-4 py-2.5 text-slate-600">{r.count}</td>
                      <td className="px-4 py-2.5 text-emerald-700 font-semibold">
                        {r.total_saved > 0 ? `₹${r.total_saved.toLocaleString()}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function StatCard({label, value, color}: {label: string; value: number; color: string}) {
  const cls = {
    amber:   'bg-amber-50 border-amber-200 text-amber-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    rose:    'bg-rose-50 border-rose-200 text-rose-700',
  }[color] ?? 'bg-slate-50 border-slate-200 text-slate-700';
  return (
    <div className={`rounded-2xl border p-4 text-center ${cls}`}>
      <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
