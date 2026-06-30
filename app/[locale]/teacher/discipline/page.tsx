'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Incident {
  name: string; incident_date: string; student_name: string;
  incident_type: string; severity: string; status: string; parent_notified: number;
}

const SEV_CLR: Record<string, string> = {
  Minor:    'bg-yellow-100 text-yellow-700',
  Moderate: 'bg-orange-100 text-orange-700',
  Severe:   'bg-rose-100 text-rose-700',
};
const STA_CLR: Record<string, string> = {
  Open:          'bg-slate-100 text-slate-600',
  'Under Review':'bg-amber-100 text-amber-700',
  Resolved:      'bg-emerald-100 text-emerald-700',
  Escalated:     'bg-rose-100 text-rose-700',
};

const INCIDENT_TYPES = [
  'Bullying','Fighting','Absence without Leave','Property Damage',
  'Disrespect','Cheating/Plagiarism','Mobile Phone Violation','Other',
];
const SEVERITIES = ['Minor','Moderate','Severe'];

export default function TeacherDiscipline() {
  const locale = useLocale();
  const [incidents,  setIncidents]  = useState<Incident[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(false);
  const [students,   setStudents]   = useState<{name:string;student_name:string}[]>([]);
  const [form, setForm] = useState({
    student:'', incident_date: new Date().toISOString().slice(0,10),
    incident_type:'Other', severity:'Minor', location:'', description:'', witnesses:'',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/teacher/discipline').then(r=>r.json()),
      fetch('/api/teacher/discipline/students').then(r=>r.json()),
    ]).then(([i, s]) => {
      setIncidents(i.incidents ?? []);
      setStudents(s.students ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function submit() {
    setSubmitting(true); setError(''); setSuccess('');
    const r = await fetch('/api/teacher/discipline/log', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(form),
    });
    const d = await r.json();
    if (!r.ok) setError(d.error || 'Failed');
    else {
      setSuccess(`Incident logged: ${d.name}`);
      setModal(false);
      setForm({student:'', incident_date: new Date().toISOString().slice(0,10),
               incident_type:'Other', severity:'Minor', location:'', description:'', witnesses:''});
      load();
    }
    setSubmitting(false);
  }

  const fmtDate = (d:string) => d?.slice(0,10) || '';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-rose-700 to-orange-700 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/teacher`} className="text-rose-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg flex-1">Incident Reports</h1>
        <button onClick={() => { setModal(true); setError(''); setSuccess(''); }}
          className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-1.5 rounded-lg font-medium transition">
          + Log Incident
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {success && <p className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm mb-4">{success}</p>}

        {loading ? (
          <>{[1,2,3].map(i=><div key={i} className="h-16 bg-white rounded-2xl border animate-pulse mb-3"/>)}</>
        ) : incidents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-slate-500 text-sm">No incidents reported by you.</p>
          </div>
        ) : incidents.map(inc => (
          <div key={inc.name} className="bg-white rounded-2xl border border-slate-200 p-4 mb-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{inc.student_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{fmtDate(inc.incident_date)} · {inc.incident_type}</p>
                {inc.parent_notified ? <p className="text-xs text-emerald-600 mt-0.5">✓ Parent notified</p>
                  : <p className="text-xs text-amber-600 mt-0.5">Parent not notified</p>}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SEV_CLR[inc.severity]??''}`}>{inc.severity}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STA_CLR[inc.status]??''}`}>{inc.status}</span>
              </div>
            </div>
          </div>
        ))}
      </main>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-slate-800">Log Incident</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            {error && <p className="text-rose-600 text-sm mb-3">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Student</label>
                <select value={form.student} onChange={e=>setForm(x=>({...x,student:e.target.value}))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400">
                  <option value="">Select student…</option>
                  {students.map(s=><option key={s.name} value={s.name}>{s.student_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Date</label>
                  <input type="date" value={form.incident_date} onChange={e=>setForm(x=>({...x,incident_date:e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Location</label>
                  <input type="text" value={form.location} placeholder="e.g. Classroom 3"
                    onChange={e=>setForm(x=>({...x,location:e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"/>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Incident Type</label>
                <select value={form.incident_type} onChange={e=>setForm(x=>({...x,incident_type:e.target.value}))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400">
                  {INCIDENT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Severity</label>
                <div className="flex gap-2">
                  {SEVERITIES.map(s=>(
                    <button key={s} onClick={()=>setForm(x=>({...x,severity:s}))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                        form.severity===s
                          ? s==='Severe' ? 'bg-rose-600 text-white border-rose-600'
                            : s==='Moderate' ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-yellow-400 text-yellow-900 border-yellow-400'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Description *</label>
                <textarea rows={3} value={form.description}
                  onChange={e=>setForm(x=>({...x,description:e.target.value}))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                  placeholder="Describe what happened…"/>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Witnesses (optional)</label>
                <input type="text" value={form.witnesses}
                  onChange={e=>setForm(x=>({...x,witnesses:e.target.value}))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  placeholder="Names of witnesses…"/>
              </div>
              <button disabled={!form.student || !form.description || submitting}
                onClick={submit}
                className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                {submitting ? 'Logging…' : 'Log Incident'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
