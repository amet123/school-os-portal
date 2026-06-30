'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface DashData {
  pending: number; approved_this_month: number; rejected_this_month: number;
  leave_type_breakdown: {leave_type: string; count: number}[];
  low_balance_staff: {employee_name: string; leave_type: string; balance: number}[];
}
interface CalEntry {
  name: string; employee_name: string; leave_type: string;
  from_date: string; to_date: string; total_leave_days: number;
}
interface PendingApp {
  name: string; employee: string; employee_name: string;
  leave_type: string; from_date: string; to_date: string;
  reason: string; total_leave_days: number;
}

export default function AdminLeaves() {
  const locale = useLocale();
  const [dash,    setDash]    = useState<DashData | null>(null);
  const [cal,     setCal]     = useState<CalEntry[]>([]);
  const [pending, setPending] = useState<PendingApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/leaves')
      .then(r => r.json())
      .then(d => {
        setDash(d.dashboard ?? null);
        setCal(d.calendar ?? []);
        setPending(d.pending_apps ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function act(appId: string, action: 'approve' | 'reject') {
    setActing(appId);
    await fetch(`/api/admin/leaves/${encodeURIComponent(appId)}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({action}),
    });
    setActing(null);
    load();
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', {day:'2-digit', month:'short'});

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-slate-700 to-indigo-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/admin`} className="text-slate-300 hover:text-white text-sm">← Admin</Link>
        <h1 className="font-bold text-lg">Staff Leaves</h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Stats bar */}
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse"/>)}
          </div>
        ) : dash && (
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Pending" value={dash.pending} color="amber"/>
            <StatCard label="Approved (month)" value={dash.approved_this_month} color="emerald"/>
            <StatCard label="Rejected (month)" value={dash.rejected_this_month} color="rose"/>
          </div>
        )}

        {/* Pending approvals */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Pending Approvals {pending.length > 0 && <span className="text-amber-600">({pending.length})</span>}
          </h2>
          {loading ? (
            <>{[1,2].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse mb-2"/>)}</>
          ) : pending.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-slate-500 text-sm">No pending leave requests.</p>
            </div>
          ) : pending.map(a => (
            <div key={a.name}
              className="bg-white rounded-2xl border border-slate-200 p-4 mb-2 flex items-center justify-between shadow-sm">
              <div>
                <p className="font-semibold text-slate-800">{a.employee_name || a.employee}</p>
                <p className="text-sm text-slate-600">{a.leave_type} · {fmt(a.from_date)} → {fmt(a.to_date)} ({a.total_leave_days}d)</p>
                {a.reason && <p className="text-xs text-slate-400 italic mt-0.5">"{a.reason}"</p>}
              </div>
              <div className="flex gap-2 ml-4 shrink-0">
                <button
                  disabled={acting === a.name}
                  onClick={() => act(a.name, 'approve')}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  disabled={acting === a.name}
                  onClick={() => act(a.name, 'reject')}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* Leave calendar */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Approved Leaves (This Month)</h2>
          {loading ? (
            <div className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse"/>
          ) : cal.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
              <p className="text-slate-400 text-sm">No approved leaves this month.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Staff Member','Leave Type','From','To','Days'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cal.map((r, i) => (
                    <tr key={r.name} className={i % 2 === 0 ? '' : 'bg-slate-50/50'}>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{r.employee_name}</td>
                      <td className="px-4 py-2.5 text-slate-600">{r.leave_type}</td>
                      <td className="px-4 py-2.5 text-slate-500">{fmt(r.from_date)}</td>
                      <td className="px-4 py-2.5 text-slate-500">{fmt(r.to_date)}</td>
                      <td className="px-4 py-2.5 text-slate-600 font-medium">{r.total_leave_days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Low balance staff */}
        {dash && dash.low_balance_staff.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-rose-500 uppercase tracking-wide mb-3">⚠ Low Balance Staff (&lt;5 days Annual)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {dash.low_balance_staff.map((s, i) => (
                <div key={i} className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                  <p className="text-sm font-semibold text-slate-800">{s.employee_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.leave_type}</p>
                  <p className="text-lg font-bold text-rose-600 mt-1">{s.balance} days</p>
                </div>
              ))}
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
