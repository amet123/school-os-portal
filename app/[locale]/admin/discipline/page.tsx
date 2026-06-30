'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Incident {
  name: string; incident_date: string; student_name: string; reporter_name: string;
  incident_type: string; severity: string; status: string; parent_notified: number; location: string;
}
interface Dash {
  total: number; open: number; under_review: number; resolved: number;
  severe: number; severe_unnotified: number;
  by_type: {type:string;severity:string;count:number}[];
  repeat_students: {student:string;name:string;count:number}[];
  recent: Incident[];
}
interface Detail {
  name:string; student:string; student_name:string; reporter_name:string;
  incident_date:string; incident_type:string; severity:string; status:string;
  description:string; location:string; witnesses:string; parent_notified:number;
  resolution_notes:string;
  actions:{name:string;action_type:string;action_date:string;duration_days:number;status:string;notes:string}[];
}

const SEV_CLR: Record<string,string> = {
  Minor:'bg-yellow-100 text-yellow-700', Moderate:'bg-orange-100 text-orange-700', Severe:'bg-rose-100 text-rose-700',
};
const STA_CLR: Record<string,string> = {
  Open:'bg-slate-100 text-slate-600','Under Review':'bg-amber-100 text-amber-700',
  Resolved:'bg-emerald-100 text-emerald-700', Escalated:'bg-rose-100 text-rose-700',
};
const ACTION_TYPES = ['Verbal Warning','Written Warning','Detention','Parent Meeting','Suspension','Expulsion'];

export default function AdminDiscipline() {
  const locale = useLocale();
  const [dash,       setDash]       = useState<Dash|null>(null);
  const [incidents,  setIncidents]  = useState<Incident[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [detail,     setDetail]     = useState<Detail|null>(null);
  const [actionForm, setActionForm] = useState({action_type:'Verbal Warning', action_date: new Date().toISOString().slice(0,10), duration_days:'', notes:''});
  const [acting,     setActing]     = useState(false);
  const [resolveNote,setResolveNote]= useState('');

  const load = (sf=statusFilter) => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/discipline/dashboard').then(r=>r.json()),
      fetch(`/api/admin/discipline/incidents${sf?`?status=${encodeURIComponent(sf)}`:''}`).then(r=>r.json()),
    ]).then(([d,i]) => {
      setDash(d.dashboard ?? d ?? null);
      setIncidents(i.incidents ?? []);
      setLoading(false);
    }).catch(()=>setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (name: string) => {
    const r = await fetch(`/api/admin/discipline/incident/${encodeURIComponent(name)}`);
    const d = await r.json();
    setDetail(d.incident ?? null);
    setResolveNote('');
  };

  const statusAction = async (name: string, status: string, notes = '') => {
    setActing(true);
    await fetch('/api/admin/discipline/update-status', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({name, status, resolution_notes: notes}),
    });
    setActing(false); setDetail(null); load();
  };

  const notifyParent = async (name: string) => {
    setActing(true);
    await fetch('/api/admin/discipline/notify-parent', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name}),
    });
    setActing(false);
    if (detail) openDetail(detail.name);
    load();
  };

  const addAction = async () => {
    if (!detail) return;
    setActing(true);
    await fetch('/api/admin/discipline/add-action', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({...actionForm, incident_report: detail.name, duration_days: Number(actionForm.duration_days||0)}),
    });
    setActing(false);
    openDetail(detail.name); load();
  };

  const fmtDate = (d:string) => d?.slice(0,10)||'';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-rose-700 to-slate-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/admin`} className="text-rose-200 hover:text-white text-sm">← Admin</Link>
        <h1 className="font-bold text-lg flex-1">Discipline Management</h1>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stat bar */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[1,2,3,4,5,6].map(i=><div key={i} className="h-20 bg-white rounded-2xl border animate-pulse"/>)}
          </div>
        ) : dash && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              {label:'Total',     val:dash.total,            col:'slate'},
              {label:'Open',      val:dash.open,             col:'slate'},
              {label:'Review',    val:dash.under_review,     col:'amber'},
              {label:'Resolved',  val:dash.resolved,         col:'emerald'},
              {label:'Severe',    val:dash.severe,           col:'rose'},
              {label:'🔔 Pending', val:dash.severe_unnotified, col:'orange'},
            ].map(c=>(
              <div key={c.label} className={`rounded-2xl border p-3 text-center bg-${c.col}-50 border-${c.col}-200`}>
                <p className={`text-xs font-medium text-${c.col}-600 uppercase truncate`}>{c.label}</p>
                <p className={`text-2xl font-bold text-${c.col}-700 mt-1`}>{c.val}</p>
              </div>
            ))}
          </div>
        )}

        {/* Repeat students */}
        {dash && dash.repeat_students.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-rose-700 mb-2">Repeat Incidents</p>
            <div className="flex flex-wrap gap-2">
              {dash.repeat_students.map(s=>(
                <span key={s.student} className="bg-rose-100 text-rose-800 text-xs font-medium px-3 py-1 rounded-full">
                  {s.name} ({s.count}×)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Incident list */}
        <section>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Incidents</h2>
            <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value); load(e.target.value);}}
              className="ml-auto text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400">
              <option value="">All status</option>
              {['Open','Under Review','Resolved','Escalated'].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {loading ? (
            <>{[1,2,3].map(i=><div key={i} className="h-16 bg-white rounded-2xl border animate-pulse mb-2"/>)}</>
          ) : incidents.length === 0 ? (
            <div className="bg-white rounded-2xl border p-10 text-center">
              <p className="text-slate-400 text-sm">No incidents found.</p>
            </div>
          ) : incidents.map(inc=>(
            <button key={inc.name} onClick={()=>openDetail(inc.name)}
              className="w-full text-left bg-white rounded-2xl border border-slate-200 p-4 mb-2 shadow-sm hover:border-rose-300 hover:shadow-md transition">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{inc.student_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {fmtDate(inc.incident_date)} · {inc.incident_type}
                    {inc.reporter_name ? ` · by ${inc.reporter_name}` : ''}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SEV_CLR[inc.severity]??''}`}>{inc.severity}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STA_CLR[inc.status]??''}`}>{inc.status}</span>
                </div>
              </div>
            </button>
          ))}
        </section>
      </main>

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 px-2 sm:px-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl">
              <h2 className="font-bold text-slate-800">{detail.incident_type}</h2>
              <button onClick={()=>setDetail(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${SEV_CLR[detail.severity]??''}`}>{detail.severity}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STA_CLR[detail.status]??''}`}>{detail.status}</span>
                {detail.parent_notified
                  ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">✓ Parent Notified</span>
                  : <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Parent Not Notified</span>}
              </div>
              <div className="text-sm text-slate-700 space-y-1">
                <p><span className="font-medium">Student:</span> {detail.student_name}</p>
                <p><span className="font-medium">Date:</span> {fmtDate(detail.incident_date)}{detail.location ? ` · ${detail.location}` : ''}</p>
                {detail.reporter_name && <p><span className="font-medium">Reported by:</span> {detail.reporter_name}</p>}
              </div>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{detail.description}</p>
              {detail.witnesses && <p className="text-xs text-slate-400">Witnesses: {detail.witnesses}</p>}

              {/* Actions taken */}
              {detail.actions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Actions Taken</p>
                  {detail.actions.map(a=>(
                    <div key={a.name} className="bg-slate-50 rounded-xl p-3 mb-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-800">{a.action_type}</span>
                        <span className="text-slate-500 text-xs">{fmtDate(a.action_date)}{a.duration_days ? ` · ${a.duration_days}d` : ''}</span>
                      </div>
                      {a.notes && <p className="text-xs text-slate-500 mt-1">{a.notes}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Add action */}
              {detail.status !== 'Resolved' && (
                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Add Disciplinary Action</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-1">Action</label>
                      <select value={actionForm.action_type}
                        onChange={e=>setActionForm(x=>({...x,action_type:e.target.value}))}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400">
                        {ACTION_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-1">Date</label>
                      <input type="date" value={actionForm.action_date}
                        onChange={e=>setActionForm(x=>({...x,action_date:e.target.value}))}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"/>
                    </div>
                  </div>
                  <input type="text" value={actionForm.notes} placeholder="Notes…"
                    onChange={e=>setActionForm(x=>({...x,notes:e.target.value}))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"/>
                  <button disabled={acting} onClick={addAction}
                    className="w-full bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition">
                    Add Action
                  </button>
                </div>
              )}

              {/* Status actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                {!detail.parent_notified && (
                  <button disabled={acting} onClick={()=>notifyParent(detail.name)}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-2 rounded-lg border border-amber-200 transition disabled:opacity-50">
                    Notify Parent
                  </button>
                )}
                {detail.status === 'Open' && (
                  <button disabled={acting} onClick={()=>statusAction(detail.name,'Under Review')}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-2 rounded-lg border border-blue-200 transition disabled:opacity-50">
                    Mark Under Review
                  </button>
                )}
                {detail.status !== 'Resolved' && (
                  <div className="flex gap-2 w-full mt-1">
                    <input value={resolveNote} onChange={e=>setResolveNote(e.target.value)}
                      placeholder="Resolution note…"
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
                    <button disabled={acting} onClick={()=>statusAction(detail.name,'Resolved',resolveNote)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition disabled:opacity-50">
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
