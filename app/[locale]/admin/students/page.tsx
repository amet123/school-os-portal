'use client';
import {useEffect, useState, useCallback} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface SearchResult {name:string; student_name:string; region_company:string;}
interface Profile {
  student:string; student_name:string; student_email_id:string; region_company:string;
  enrollment:{program:string;academic_year:string}|null;
  guardians:{guardian_name:string;relation:string;phone:string;email:string}[];
  attendance_pct:number|null; attendance_total:number; attendance_present:number;
  health:{blood_group:string;allergies:string;chronic_conditions:string;
          emergency_contact_name:string;emergency_contact_phone:string;current_medications:string};
  recent_visits:{visit_date:string;complaint:string;outcome:string}[];
  fee_balance:number|null; fee_currency:string;
  recent_results:{exam:string;marks_obtained:number;total_marks:number;grade:string;pct:number}[];
  open_incidents:{name:string;incident_date:string;incident_type:string;severity:string;status:string}[];
  transport:{route:string;stop:string}|null;
}

const SEVERITY_CLR: Record<string,string> = {
  'Minor':'bg-amber-100 text-amber-700','Moderate':'bg-orange-100 text-orange-700',
  'Severe':'bg-rose-100 text-rose-700',
};
const GRADE_CLR: Record<string,string> = {
  'A+':'text-emerald-700','A':'text-emerald-600','B+':'text-blue-600',
  'B':'text-blue-500','C':'text-amber-600','D':'text-orange-600','F':'text-rose-600',
};

export default function StudentProfileLookup() {
  const locale = useLocale();
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [profile, setProfile] = useState<Profile|null>(null);
  const [loading, setLoading] = useState(false);
  const [profLoad,setProfLoad]= useState(false);

  const search = useCallback(() => {
    if (!query.trim()) return;
    setLoading(true);
    fetch(`/api/admin/students/search?q=${encodeURIComponent(query)}`)
      .then(r=>r.json())
      .then(d => { setResults(d.students ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [query]);

  const openProfile = async (name: string) => {
    setProfLoad(true); setProfile(null);
    const r = await fetch(`/api/admin/students/profile/${encodeURIComponent(name)}`);
    const d = await r.json();
    setProfile(d.profile ?? null);
    setProfLoad(false);
  };

  const fmtDate = (d:string) => d?.slice(0,10)||'';
  const initials = (n:string) => n.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-indigo-700 to-violet-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/admin`} className="text-indigo-200 hover:text-white text-sm">← Admin</Link>
        <h1 className="font-bold text-lg flex-1">Student Profile Lookup</h1>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5 space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <input value={query} onChange={e=>setQuery(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&search()}
            placeholder="Search student by name…"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"/>
          <button onClick={search} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition">
            {loading ? '…' : 'Search'}
          </button>
        </div>

        <div className={`flex gap-4 ${profile || profLoad ? '' : ''}`}>
          {/* Results */}
          {results.length > 0 && (
            <div className={profile ? 'w-64 shrink-0' : 'flex-1'}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{results.length} student{results.length!==1?'s':''}</p>
              {results.map(s=>(
                <button key={s.name} onClick={() => openProfile(s.name)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border mb-1.5 transition ${
                    profile?.student===s.name
                      ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}>
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold shrink-0">
                    {initials(s.student_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{s.student_name}</p>
                    {s.region_company && <p className="text-xs text-slate-400 truncate">{s.region_company}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 360 Profile panel */}
          {(profile || profLoad) && (
            <div className="flex-1 min-w-0">
              {profLoad ? (
                <div className="space-y-3">{[1,2,3,4].map(i=><div key={i} className="h-24 bg-white rounded-2xl border animate-pulse"/>)}</div>
              ) : profile && (
                <div className="space-y-4">
                  {/* Identity */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                        {initials(profile.student_name)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-lg">{profile.student_name}</p>
                        <p className="text-xs text-slate-500">{profile.student_email_id}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-400 font-medium">School</p>
                        <p className="text-slate-700">{profile.region_company || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Program</p>
                        <p className="text-slate-700">{profile.enrollment?.program || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Attendance */}
                    <div className={`rounded-2xl border p-3 text-center ${
                      profile.attendance_pct == null ? 'bg-slate-50 border-slate-200'
                      : profile.attendance_pct >= 75 ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-rose-50 border-rose-200'
                    }`}>
                      <p className="text-xs text-slate-500 font-medium uppercase">Attendance</p>
                      <p className={`text-xl font-bold mt-1 ${
                        profile.attendance_pct == null ? 'text-slate-400'
                        : profile.attendance_pct >= 75 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {profile.attendance_pct != null ? `${profile.attendance_pct}%` : '—'}
                      </p>
                    </div>
                    {/* Fee */}
                    <div className={`rounded-2xl border p-3 text-center ${
                      profile.fee_balance == null ? 'bg-slate-50 border-slate-200'
                      : profile.fee_balance > 0 ? 'bg-amber-50 border-amber-200'
                      : 'bg-emerald-50 border-emerald-200'
                    }`}>
                      <p className="text-xs text-slate-500 font-medium uppercase">Fee Balance</p>
                      <p className={`text-base font-bold mt-1 ${
                        profile.fee_balance == null ? 'text-slate-400'
                        : profile.fee_balance > 0 ? 'text-amber-700' : 'text-emerald-700'
                      }`}>
                        {profile.fee_balance == null ? '—' : profile.fee_balance === 0 ? 'Paid' : `${profile.fee_currency} ${profile.fee_balance.toLocaleString('en-IN')}`}
                      </p>
                    </div>
                    {/* Incidents */}
                    <div className={`rounded-2xl border p-3 text-center ${
                      profile.open_incidents.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <p className="text-xs text-slate-500 font-medium uppercase">Open Incidents</p>
                      <p className={`text-xl font-bold mt-1 ${profile.open_incidents.length > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                        {profile.open_incidents.length}
                      </p>
                    </div>
                  </div>

                  {/* Health alert */}
                  {(profile.health.allergies && profile.health.allergies !== 'None') && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                      <p className="text-xs font-semibold text-amber-800 mb-1">⚠️ Health Alert</p>
                      <p className="text-sm text-amber-800"><span className="font-medium">Allergies:</span> {profile.health.allergies}</p>
                      {profile.health.chronic_conditions && profile.health.chronic_conditions !== 'None' && (
                        <p className="text-sm text-amber-700 mt-0.5"><span className="font-medium">Conditions:</span> {profile.health.chronic_conditions}</p>
                      )}
                      {profile.health.emergency_contact_phone && (
                        <p className="text-xs text-amber-600 mt-1">Emergency: {profile.health.emergency_contact_name} · {profile.health.emergency_contact_phone}</p>
                      )}
                    </div>
                  )}

                  {/* Guardians */}
                  {profile.guardians.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Guardians</p>
                      {profile.guardians.map((g,i)=>(
                        <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{g.guardian_name}</p>
                            <p className="text-xs text-slate-400">{g.relation}</p>
                          </div>
                          <div className="text-right text-xs text-slate-500">
                            {g.phone && <p>{g.phone}</p>}
                            {g.email && <p className="text-indigo-600">{g.email}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recent results */}
                  {profile.recent_results.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Recent Exam Results</p>
                      {profile.recent_results.map((r,i)=>(
                        <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                          <p className="text-sm text-slate-700 truncate">{r.exam}</p>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-xs text-slate-500">{r.marks_obtained}/{r.total_marks}</span>
                            <span className={`text-sm font-bold ${GRADE_CLR[r.grade]||'text-slate-700'}`}>{r.grade||`${r.pct}%`}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Open incidents */}
                  {profile.open_incidents.length > 0 && (
                    <div className="bg-white rounded-2xl border border-rose-200 p-4 shadow-sm">
                      <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mb-2">Open Incidents</p>
                      {profile.open_incidents.map(inc=>(
                        <div key={inc.name} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                          <div>
                            <p className="text-sm text-slate-800">{inc.incident_type}</p>
                            <p className="text-xs text-slate-400">{fmtDate(inc.incident_date)} · {inc.status}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SEVERITY_CLR[inc.severity]||''}`}>{inc.severity}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Transport */}
                  {profile.transport && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-sm">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Transport</p>
                      <p className="text-slate-700">Route: <span className="font-medium">{profile.transport.route}</span></p>
                      <p className="text-slate-700">Stop: <span className="font-medium">{profile.transport.stop}</span></p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
