'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface LeaveBalance {
  leave_type: string; allocated: number; taken: number; balance: number;
}
interface LeaveApp {
  name: string; leave_type: string; from_date: string; to_date: string;
  status: string; reason: string; total_leave_days: number;
}
interface LeaveData { balance: LeaveBalance[]; applications: LeaveApp[]; }

const STATUS_COLORS: Record<string, string> = {
  Open:     'bg-amber-100 text-amber-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-rose-100 text-rose-700',
};

export default function TeacherLeave() {
  const locale = useLocale();
  const [data,    setData]    = useState<LeaveData>({balance: [], applications: []});
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState({leave_type: '', from_date: '', to_date: '', half_day: false, reason: ''});
  const [submitting, setSub]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/teacher/leave')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function submitLeave(e: React.FormEvent) {
    e.preventDefault();
    setSub(true); setError(''); setSuccess('');
    try {
      const r = await fetch('/api/teacher/leave/apply', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({...form, half_day: form.half_day ? 1 : 0}),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Failed to apply'); }
      else {
        setSuccess(`Leave applied: ${d.name}`);
        setModal(false);
        setForm({leave_type: '', from_date: '', to_date: '', half_day: false, reason: ''});
        load();
      }
    } catch { setError('Network error'); }
    setSub(false);
  }

  const leaveTypes = data.balance.map(b => b.leave_type);
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/teacher`} className="text-emerald-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg">My Leaves</h1>
        <button
          onClick={() => setModal(true)}
          className="ml-auto bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-1.5 rounded-lg font-medium transition"
        >
          + Apply Leave
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Balance cards */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Leave Balance</h2>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse"/>)}
            </div>
          ) : data.balance.length === 0 ? (
            <p className="text-slate-400 text-sm">No leave balances found for your account.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {data.balance.map(b => (
                <div key={b.leave_type}
                  className={`rounded-2xl border p-4 text-center ${b.balance > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  <p className="text-xs font-medium text-slate-500 leading-tight mb-1">{b.leave_type}</p>
                  <p className={`text-2xl font-bold ${b.balance > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{b.balance}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{b.taken} / {b.allocated} taken</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Application list */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">My Applications</h2>
          {loading ? (
            <>{[1,2].map(i => <div key={i} className="h-16 bg-white rounded-2xl border border-slate-200 animate-pulse mb-2"/>)}</>
          ) : data.applications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <p className="text-3xl mb-2">🏖️</p>
              <p className="text-slate-500 text-sm">No leave applications yet.</p>
            </div>
          ) : data.applications.map(a => (
            <div key={a.name} className="bg-white rounded-2xl border border-slate-200 p-4 mb-2 flex items-center justify-between shadow-sm">
              <div>
                <p className="font-medium text-slate-800">{a.leave_type}</p>
                <p className="text-xs text-slate-500 mt-0.5">{fmt(a.from_date)} → {fmt(a.to_date)} · {a.total_leave_days} day(s)</p>
                {a.reason && <p className="text-xs text-slate-400 mt-0.5 italic">"{a.reason}"</p>}
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[a.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {a.status}
              </span>
            </div>
          ))}
        </section>
      </main>

      {/* Apply Leave Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-slate-800">Apply for Leave</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            {error   && <p className="text-rose-600 text-sm mb-3">{error}</p>}
            {success && <p className="text-emerald-600 text-sm mb-3">{success}</p>}
            <form onSubmit={submitLeave} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Leave Type</label>
                <select
                  required
                  value={form.leave_type}
                  onChange={e => setForm(f => ({...f, leave_type: e.target.value}))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select type…</option>
                  {leaveTypes.map(lt => <option key={lt} value={lt}>{lt}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">From Date</label>
                  <input type="date" required value={form.from_date}
                    onChange={e => setForm(f => ({...f, from_date: e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">To Date</label>
                  <input type="date" required value={form.to_date}
                    onChange={e => setForm(f => ({...f, to_date: e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={form.half_day}
                  onChange={e => setForm(f => ({...f, half_day: e.target.checked}))}
                  className="rounded border-slate-300"/>
                Half Day
              </label>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Reason</label>
                <textarea rows={2} value={form.reason}
                  onChange={e => setForm(f => ({...f, reason: e.target.value}))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Optional reason…"/>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                {submitting ? 'Submitting…' : 'Apply Leave'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
