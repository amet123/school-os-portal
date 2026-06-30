'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Session { name: string; session_title: string; ptm_date: string; status: string; }
interface Dash {
  total: number; booked: number; confirmed: number; cancelled: number; completed: number;
  teacher_breakdown: {instructor_name: string; total: number; active: number}[];
  upcoming: {name: string; instructor_name: string; student_name: string; slot_time: string; status: string}[];
}

export default function AdminPTM() {
  const locale = useLocale();
  const [sessions,    setSessions]  = useState<Session[]>([]);
  const [selSess,     setSelSess]   = useState('');
  const [dash,        setDash]      = useState<Dash | null>(null);
  const [loading,     setLoading]   = useState(true);
  const [showCreate,  setShowCreate]= useState(false);
  const [form, setForm] = useState({session_title:'', ptm_date:'', time_from:'09:00', time_to:'12:00', slot_duration_mins:'10', location:''});
  const [creating,    setCreating]  = useState(false);
  const [createErr,   setCreateErr] = useState('');

  const loadSessions = () =>
    fetch('/api/admin/ptm/sessions').then(r=>r.json()).then(d => setSessions(d.sessions ?? []));

  const loadDash = (sess: string) => {
    setLoading(true);
    fetch(`/api/admin/ptm/dashboard${sess ? `?session=${encodeURIComponent(sess)}` : ''}`)
      .then(r=>r.json()).then(d => { setDash(d ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadSessions().then(() => loadDash('')); }, []);

  async function createSession() {
    setCreating(true); setCreateErr('');
    const r = await fetch('/api/admin/ptm/create', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({...form, slot_duration_mins: Number(form.slot_duration_mins)}),
    });
    const d = await r.json();
    if (!r.ok) setCreateErr(d.error || 'Failed');
    else { setShowCreate(false); loadSessions(); loadDash(selSess); }
    setCreating(false);
  }

  const fmtTime = (t: string) => t?.slice(0,5) || t;
  const STATUS_CLR: Record<string, string> = {
    Booked:'bg-amber-100 text-amber-700', Confirmed:'bg-emerald-100 text-emerald-700',
    Completed:'bg-slate-100 text-slate-500',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-slate-700 to-indigo-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/admin`} className="text-slate-300 hover:text-white text-sm">← Admin</Link>
        <h1 className="font-bold text-lg flex-1">PTM Management</h1>
        <button onClick={() => setShowCreate(true)}
          className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-1.5 rounded-lg font-medium transition">
          + New Session
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Session filter */}
        <div className="flex gap-2 items-center">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide shrink-0">Session</label>
          <select value={selSess} onChange={e => { setSelSess(e.target.value); loadDash(e.target.value); }}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">All sessions</option>
            {sessions.map(s => <option key={s.name} value={s.name}>{s.session_title}</option>)}
          </select>
        </div>

        {/* Stat bar */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-white rounded-2xl border animate-pulse"/>)}
          </div>
        ) : dash && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {[
              {label:'Total',     value:dash.total,     color:'slate'},
              {label:'Booked',    value:dash.booked,    color:'amber'},
              {label:'Confirmed', value:dash.confirmed, color:'emerald'},
              {label:'Completed', value:dash.completed, color:'blue'},
              {label:'Cancelled', value:dash.cancelled, color:'rose'},
            ].map(c => (
              <div key={c.label} className={`rounded-2xl border p-3 text-center bg-${c.color}-50 border-${c.color}-200`}>
                <p className="text-xs font-medium text-slate-500 uppercase">{c.label}</p>
                <p className={`text-2xl font-bold text-${c.color}-700 mt-1`}>{c.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Teacher breakdown */}
        {dash && dash.teacher_breakdown.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">By Teacher</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Teacher','Bookings','Active'].map(h=>(
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dash.teacher_breakdown.map((r,i) => (
                    <tr key={r.instructor_name} className={i%2===0?'':'bg-slate-50/50'}>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{r.instructor_name}</td>
                      <td className="px-4 py-2.5 text-slate-600">{r.total}</td>
                      <td className="px-4 py-2.5 text-emerald-600 font-semibold">{r.active}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Upcoming appointments */}
        {dash && dash.upcoming.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Upcoming Appointments</h2>
            <div className="space-y-2">
              {dash.upcoming.map(a => (
                <div key={a.name} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{a.student_name} → {a.instructor_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{fmtTime(a.slot_time)}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CLR[a.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Create Session Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-slate-800">New PTM Session</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            {createErr && <p className="text-rose-600 text-sm mb-3">{createErr}</p>}
            <div className="space-y-3">
              {[
                {key:'session_title', label:'Session Title', type:'text', placeholder:'e.g. Term 1 PTM'},
                {key:'ptm_date',      label:'Date',          type:'date', placeholder:''},
                {key:'location',      label:'Location',      type:'text', placeholder:'e.g. School Hall'},
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-slate-600 block mb-1">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} placeholder={f.placeholder}
                    onChange={e => setForm(x => ({...x, [f.key]: e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Start</label>
                  <input type="time" value={form.time_from} onChange={e => setForm(x=>({...x,time_from:e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">End</label>
                  <input type="time" value={form.time_to} onChange={e => setForm(x=>({...x,time_to:e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Slot (min)</label>
                  <input type="number" min={5} max={60} value={form.slot_duration_mins}
                    onChange={e => setForm(x=>({...x,slot_duration_mins:e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
                </div>
              </div>
              <button disabled={creating} onClick={createSession}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                {creating ? 'Creating…' : 'Create Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
