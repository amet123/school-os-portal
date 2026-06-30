'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Appointment {
  name: string; ptm_session: string; student_name: string;
  guardian_name: string; slot_time: string; status: string; parent_notes: string;
}

const STATUS_CLR: Record<string, string> = {
  Booked:    'bg-amber-100 text-amber-700',
  Confirmed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-rose-100 text-rose-700',
  Completed: 'bg-slate-100 text-slate-600',
};

export default function TeacherPTM() {
  const locale = useLocale();
  const [appointments, setAppts] = useState<Appointment[]>([]);
  const [loading,      setLoad]  = useState(true);
  const [acting,       setAct]   = useState<string | null>(null);
  const [notes,        setNotes] = useState<Record<string, string>>({});

  const load = () => {
    setLoad(true);
    fetch('/api/teacher/ptm')
      .then(r => r.json())
      .then(d => { setAppts(d.appointments ?? []); setLoad(false); })
      .catch(() => setLoad(false));
  };

  useEffect(() => { load(); }, []);

  async function act(name: string, action: 'confirm' | 'complete', note?: string) {
    setAct(name);
    await fetch(`/api/teacher/ptm/${encodeURIComponent(name)}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({action, teacher_notes: note || ''}),
    });
    setAct(null); load();
  }

  const fmtTime = (t: string) => t?.slice(0,5) || t;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-teal-700 to-emerald-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/teacher`} className="text-teal-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg">My PTM Appointments</h1>
        <span className="ml-auto text-teal-200 text-sm">{appointments.length} upcoming</span>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <>{[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl border animate-pulse mb-3"/>)}</>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-slate-500 text-sm">No PTM appointments scheduled.</p>
          </div>
        ) : appointments.map(a => (
          <div key={a.name} className="bg-white rounded-2xl border border-slate-200 p-4 mb-3 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-slate-800">{fmtTime(a.slot_time)}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CLR[a.status] ?? ''}`}>{a.status}</span>
                </div>
                <p className="font-medium text-slate-700">{a.student_name}</p>
                {a.guardian_name && <p className="text-xs text-slate-500">Parent: {a.guardian_name}</p>}
                {a.parent_notes  && <p className="text-xs text-slate-400 italic mt-1">"{a.parent_notes}"</p>}
              </div>
              {a.status === 'Booked' && (
                <button disabled={acting === a.name} onClick={() => act(a.name, 'confirm')}
                  className="shrink-0 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                  Confirm
                </button>
              )}
              {a.status === 'Confirmed' && (
                <div className="shrink-0 flex flex-col gap-1">
                  <input
                    value={notes[a.name] || ''}
                    onChange={e => setNotes(n => ({...n, [a.name]: e.target.value}))}
                    placeholder="Brief note…"
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 w-36 focus:outline-none focus:ring-1 focus:ring-teal-400"
                  />
                  <button disabled={acting === a.name} onClick={() => act(a.name, 'complete', notes[a.name])}
                    className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                    Mark Done
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
