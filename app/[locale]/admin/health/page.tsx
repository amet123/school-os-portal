'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Dash {
  total_profiles: number; total_visits: number; visits_today: number;
  sent_home: number; emergencies: number; follow_up_due: number; unnotified: number;
  by_category: {category:string;count:number}[];
  recent_visits: {name:string;visit_date:string;visit_time:string;student_name:string;complaint:string;outcome:string;parent_notified:number}[];
  allergic_students: {student_name:string;allergies:string;emergency_contact_phone:string}[];
}
interface Profile {
  name:string; student:string; student_name:string; blood_group:string;
  allergies:string; chronic_conditions:string;
  emergency_contact_name:string; emergency_contact_phone:string;
}

const OUTCOME_CLR: Record<string,string> = {
  'Returned to Class': 'bg-emerald-100 text-emerald-700',
  'Sent Home':         'bg-amber-100 text-amber-700',
  'Referred to Doctor':'bg-blue-100 text-blue-700',
  'Emergency Response':'bg-rose-100 text-rose-700',
  'Observation':       'bg-slate-100 text-slate-600',
};

export default function AdminHealth() {
  const locale = useLocale();
  const [tab,       setTab]      = useState<'dashboard'|'profiles'|'visits'>('dashboard');
  const [dash,      setDash]     = useState<Dash|null>(null);
  const [profiles,  setProfiles] = useState<Profile[]>([]);
  const [visits,    setVisits]   = useState<any[]>([]);
  const [loading,   setLoading]  = useState(true);
  const [search,    setSearch]   = useState('');

  const loadDash = () => {
    setLoading(true);
    fetch('/api/admin/health/dashboard').then(r=>r.json())
      .then(d => { setDash(d.dashboard ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  };
  const loadProfiles = (q='') => {
    setLoading(true);
    fetch(`/api/admin/health/profiles${q?`?search=${encodeURIComponent(q)}`:''}`).then(r=>r.json())
      .then(d => { setProfiles(d.profiles ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };
  const loadVisits = () => {
    setLoading(true);
    fetch('/api/admin/health/visits').then(r=>r.json())
      .then(d => { setVisits(d.visits ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadDash(); }, []);

  const switchTab = (t: typeof tab) => {
    setTab(t);
    if (t === 'dashboard') loadDash();
    if (t === 'profiles')  loadProfiles();
    if (t === 'visits')    loadVisits();
  };

  const fmtDate = (d:string) => d?.slice(0,10)||'';
  const fmtTime = (t:string) => t?.slice(0,5)||'';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-teal-600 to-emerald-700 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/admin`} className="text-teal-200 hover:text-white text-sm">← Admin</Link>
        <h1 className="font-bold text-lg flex-1">Health Records</h1>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 flex gap-1">
        {(['dashboard','profiles','visits'] as const).map(t => (
          <button key={t} onClick={() => switchTab(t)}
            className={`px-4 py-3 text-sm font-medium capitalize transition border-b-2 ${
              tab===t ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {t}
          </button>
        ))}
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (loading ? (
          <div className="grid grid-cols-4 gap-3">{[1,2,3,4,5,6,7].map(i=><div key={i} className="h-20 bg-white rounded-2xl border animate-pulse"/>)}</div>
        ) : dash && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {label:'Total Profiles', val:dash.total_profiles, col:'teal'},
                {label:'Total Visits',   val:dash.total_visits,   col:'emerald'},
                {label:'Today',          val:dash.visits_today,   col:'blue'},
                {label:'Follow-ups Due', val:dash.follow_up_due,  col:'amber'},
                {label:'Sent Home',      val:dash.sent_home,      col:'orange'},
                {label:'Emergencies',    val:dash.emergencies,    col:'rose'},
                {label:'🔔 Unnotified',  val:dash.unnotified,     col:'red'},
              ].map(c=>(
                <div key={c.label} className={`rounded-2xl border p-3 text-center bg-${c.col}-50 border-${c.col}-200`}>
                  <p className={`text-xs font-medium text-${c.col}-600 uppercase truncate`}>{c.label}</p>
                  <p className={`text-2xl font-bold text-${c.col}-700 mt-1`}>{c.val}</p>
                </div>
              ))}
            </div>

            {/* Allergy alert */}
            {dash.allergic_students.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-sm font-semibold text-amber-800 mb-2">⚠️ Students with Allergies ({dash.allergic_students.length})</p>
                <div className="space-y-1.5">
                  {dash.allergic_students.map(s=>(
                    <div key={s.student_name} className="flex justify-between text-sm">
                      <span className="font-medium text-amber-900">{s.student_name}</span>
                      <span className="text-amber-700 text-xs">{s.allergies}</span>
                      {s.emergency_contact_phone && <span className="text-amber-600 text-xs">{s.emergency_contact_phone}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* By category */}
            {dash.by_category.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Visits by Category</p>
                {dash.by_category.map(c=>(
                  <div key={c.category} className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-slate-700 w-44 truncate">{c.category}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div className="bg-teal-500 h-2 rounded-full" style={{width:`${Math.min(100,(c.count/Math.max(...dash.by_category.map(x=>x.count)))*100)}%`}}/>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 w-6 text-right">{c.count}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Recent visits */}
            <section>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Recent Visits</p>
              {dash.recent_visits.map(v=>(
                <div key={v.name} className="bg-white rounded-xl border border-slate-200 p-3 mb-2 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{v.student_name}</p>
                    <p className="text-xs text-slate-500">{fmtDate(v.visit_date)} {fmtTime(v.visit_time)} · {v.complaint}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${OUTCOME_CLR[v.outcome]??'bg-slate-100 text-slate-600'}`}>{v.outcome}</span>
                    {!v.parent_notified && v.outcome === 'Sent Home' && <span className="text-xs text-amber-600">🔔 notify</span>}
                  </div>
                </div>
              ))}
            </section>
          </>
        ))}

        {/* ── PROFILES ── */}
        {tab === 'profiles' && (
          <>
            <div className="flex gap-2">
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search by student name…"
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"/>
              <button onClick={()=>loadProfiles(search)}
                className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">Search</button>
            </div>
            {loading ? (
              <>{[1,2,3].map(i=><div key={i} className="h-20 bg-white rounded-2xl border animate-pulse mb-2"/>)}</>
            ) : profiles.length === 0 ? (
              <p className="text-slate-400 text-sm">No profiles found.</p>
            ) : profiles.map(p=>(
              <div key={p.name} className="bg-white rounded-2xl border border-slate-200 p-4 mb-2 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{p.student_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Blood: {p.blood_group || 'Unknown'}</p>
                    {p.allergies && p.allergies !== 'None' && (
                      <p className="text-xs text-amber-700 mt-0.5">⚠️ {p.allergies}</p>
                    )}
                    {p.chronic_conditions && p.chronic_conditions !== 'None' && (
                      <p className="text-xs text-blue-700 mt-0.5">⚕️ {p.chronic_conditions}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-slate-600">{p.emergency_contact_name}</p>
                    <p className="text-xs text-slate-400">{p.emergency_contact_phone}</p>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── VISITS ── */}
        {tab === 'visits' && (
          loading ? (
            <>{[1,2,3,4].map(i=><div key={i} className="h-16 bg-white rounded-2xl border animate-pulse mb-2"/>)}</>
          ) : visits.length === 0 ? (
            <p className="text-slate-400 text-sm">No visits recorded.</p>
          ) : visits.map((v:any) => (
            <div key={v.name} className="bg-white rounded-xl border border-slate-200 p-3 mb-2 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-sm font-medium text-slate-800">{v.student_name}</p>
                <p className="text-xs text-slate-500">{fmtDate(v.visit_date)} · {v.complaint}</p>
                {v.follow_up_required ? <p className="text-xs text-amber-600 mt-0.5">Follow-up: {fmtDate(v.follow_up_date)}</p> : null}
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${OUTCOME_CLR[v.outcome]??'bg-slate-100 text-slate-600'}`}>{v.outcome}</span>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
