'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Session {
  name: string; session_title: string; ptm_date: string;
  time_from: string; time_to: string; location: string; status: string;
}
interface Instructor { name: string; instructor_name: string; department: string; slots_free: number; }
interface Slot { time: string; booked: boolean; }
interface Appointment {
  name: string; ptm_session: string; instructor_name: string;
  student_name: string; slot_time: string; status: string; parent_notes: string;
}

const STATUS_CLR: Record<string, string> = {
  Booked:    'bg-amber-100 text-amber-700',
  Confirmed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-rose-100 text-rose-700',
  Completed: 'bg-slate-100 text-slate-600',
};

export default function ParentPTM() {
  const locale = useLocale();
  const [sessions,      setSessions]      = useState<Session[]>([]);
  const [appointments,  setAppointments]  = useState<Appointment[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [modal,         setModal]         = useState(false);
  const [selSession,    setSelSession]    = useState('');
  const [instructors,   setInstructors]   = useState<Instructor[]>([]);
  const [selInstructor, setSelInstructor] = useState('');
  const [slots,         setSlots]         = useState<Slot[]>([]);
  const [selSlot,       setSelSlot]       = useState('');
  const [notes,         setNotes]         = useState('');
  const [students,      setStudents]      = useState<{name: string; student_name: string}[]>([]);
  const [selStudent,    setSelStudent]    = useState('');
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/parent/ptm/sessions').then(r => r.json()),
      fetch('/api/parent/ptm/appointments').then(r => r.json()),
      fetch('/api/parent/ptm/students').then(r => r.json()),
    ]).then(([s, a, st]) => {
      setSessions(s.sessions ?? []);
      setAppointments(a.appointments ?? []);
      setStudents(st.students ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function loadInstructors(sess: string) {
    setSelSession(sess); setSelInstructor(''); setSlots([]); setSelSlot('');
    if (!sess) return;
    const r = await fetch(`/api/parent/ptm/instructors?session=${encodeURIComponent(sess)}`);
    const d = await r.json();
    setInstructors(d.instructors ?? []);
  }

  async function loadSlots(inst: string) {
    setSelInstructor(inst); setSlots([]); setSelSlot('');
    if (!selSession || !inst) return;
    const r = await fetch(`/api/parent/ptm/slots?session=${encodeURIComponent(selSession)}&instructor=${encodeURIComponent(inst)}`);
    const d = await r.json();
    setSlots((d.slots ?? []).filter((s: Slot) => !s.booked));
  }

  async function submitBooking() {
    setSubmitting(true); setError(''); setSuccess('');
    const r = await fetch('/api/parent/ptm/book', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        ptm_session: selSession, instructor: selInstructor,
        student: selStudent, slot_time: selSlot, parent_notes: notes,
      }),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error || 'Booking failed'); }
    else {
      setSuccess(`Booked: ${d.name}`);
      setModal(false);
      setSelSession(''); setSelInstructor(''); setSlots([]); setSelSlot(''); setNotes('');
      load();
    }
    setSubmitting(false);
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', {weekday:'short', day:'2-digit', month:'short', year:'numeric'});
  const fmtTime = (t: string) => t?.slice(0, 5) || t;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-teal-700 to-emerald-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/parent`} className="text-teal-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg">Parent-Teacher Meetings</h1>
        <button onClick={() => { setModal(true); setError(''); setSuccess(''); }}
          className="ml-auto bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-1.5 rounded-lg font-medium transition">
          + Book Meeting
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {success && <p className="text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">{success}</p>}

        {/* My Appointments */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">My Bookings</h2>
          {loading ? (
            <>{[1,2].map(i => <div key={i} className="h-16 bg-white rounded-2xl border animate-pulse mb-2"/>)}</>
          ) : appointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-slate-500 text-sm">No PTM appointments booked yet.</p>
            </div>
          ) : appointments.map(a => (
            <div key={a.name} className="bg-white rounded-2xl border border-slate-200 p-4 mb-2 flex items-center justify-between shadow-sm">
              <div>
                <p className="font-semibold text-slate-800">{a.instructor_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{a.student_name} · Slot {fmtTime(a.slot_time)}</p>
                {a.parent_notes && <p className="text-xs text-slate-400 italic mt-0.5">"{a.parent_notes}"</p>}
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CLR[a.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {a.status}
              </span>
            </div>
          ))}
        </section>

        {/* Upcoming Sessions */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Upcoming Sessions</h2>
          {loading ? (
            <div className="h-24 bg-white rounded-2xl border animate-pulse"/>
          ) : sessions.length === 0 ? (
            <p className="text-slate-400 text-sm">No open PTM sessions.</p>
          ) : sessions.map(s => (
            <div key={s.name} className="bg-white rounded-2xl border border-slate-200 p-4 mb-2 shadow-sm">
              <p className="font-semibold text-slate-800">{s.session_title}</p>
              <p className="text-sm text-slate-500 mt-0.5">{fmtDate(s.ptm_date)} · {fmtTime(s.time_from)}–{fmtTime(s.time_to)}</p>
              {s.location && <p className="text-xs text-slate-400 mt-0.5">📍 {s.location}</p>}
            </div>
          ))}
        </section>
      </main>

      {/* Booking Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-slate-800">Book a PTM Slot</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            {error && <p className="text-rose-600 text-sm mb-3">{error}</p>}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">PTM Session</label>
                <select value={selSession} onChange={e => loadInstructors(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Select session…</option>
                  {sessions.map(s => <option key={s.name} value={s.name}>{s.session_title} ({s.ptm_date?.slice(0,10)})</option>)}
                </select>
              </div>

              {instructors.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Teacher</label>
                  <select value={selInstructor} onChange={e => loadSlots(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">Select teacher…</option>
                    {instructors.map(i => (
                      <option key={i.name} value={i.name} disabled={i.slots_free === 0}>
                        {i.instructor_name}{i.department ? ` — ${i.department}` : ''} ({i.slots_free} slots free)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {slots.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Time Slot</label>
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map(s => (
                      <button key={s.time} onClick={() => setSelSlot(s.time)}
                        className={`text-xs font-medium py-2 rounded-lg border transition ${
                          selSlot === s.time
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                        }`}>
                        {s.time.slice(0,5)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {students.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Child</label>
                  <select value={selStudent} onChange={e => setSelStudent(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">Select child…</option>
                    {students.map(s => <option key={s.name} value={s.name}>{s.student_name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Agenda / Notes (optional)</label>
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  placeholder="Topics you'd like to discuss…"/>
              </div>

              <button
                disabled={!selSession || !selInstructor || !selSlot || !selStudent || submitting}
                onClick={submitBooking}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                {submitting ? 'Booking…' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
