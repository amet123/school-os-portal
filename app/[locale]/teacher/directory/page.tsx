'use client';
import {useEffect, useState, useCallback} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Staff {
  name:string; instructor_name:string; department:string;
  designation:string; email:string; phone:string; subjects:string[];
}
interface Profile {
  name:string; instructor_name:string; department:string; designation:string;
  email:string; phone:string;
  groups:{name:string;student_group_name:string;program:string}[];
  today_schedule:{course:string;from_time:string;to_time:string;room:string}[];
}

export default function StaffDirectory() {
  const locale  = useLocale();
  const [staff,   setStaff]   = useState<Staff[]>([]);
  const [depts,   setDepts]   = useState<string[]>([]);
  const [search,  setSearch]  = useState('');
  const [dept,    setDept]    = useState('');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile|null>(null);
  const [profLoad,setProfLoad]= useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (dept)   qs.set('department', dept);
    fetch(`/api/staff/directory${qs.toString()?`?${qs}`:''}`)
      .then(r=>r.json())
      .then(d => { setStaff(d.staff ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, dept]);

  useEffect(() => {
    load();
    fetch('/api/staff/departments').then(r=>r.json()).then(d => setDepts(d.departments ?? []));
  }, []);

  const openProfile = async (name: string) => {
    setProfLoad(true); setProfile(null);
    const r = await fetch(`/api/staff/profile/${encodeURIComponent(name)}`);
    const d = await r.json();
    setProfile(d.profile ?? null);
    setProfLoad(false);
  };

  const initials = (n:string) => n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const DEPT_COLORS = ['bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700',
    'bg-purple-100 text-purple-700','bg-amber-100 text-amber-700','bg-rose-100 text-rose-700'];
  const deptColor = (d:string) => DEPT_COLORS[d.charCodeAt(0)%DEPT_COLORS.length];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/teacher`} className="text-slate-300 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg flex-1">Staff Directory</h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5">
        {/* Search bar */}
        <div className="flex gap-2 mb-5">
          <input value={search} onChange={e=>setSearch(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&load()}
            placeholder="Search by name…"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"/>
          <select value={dept} onChange={e=>setDept(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white">
            <option value="">All Departments</option>
            {depts.map(d=><option key={d}>{d}</option>)}
          </select>
          <button onClick={load}
            className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
            Search
          </button>
        </div>

        <div className="flex gap-4">
          {/* Staff list */}
          <div className={`${profile?'w-1/2':'w-full'} transition-all`}>
            {loading ? (
              <>{[1,2,3,4].map(i=><div key={i} className="h-20 bg-white rounded-2xl border animate-pulse mb-2"/>)}</>
            ) : staff.length === 0 ? (
              <div className="bg-white rounded-2xl border p-10 text-center">
                <p className="text-3xl mb-2">👥</p>
                <p className="text-slate-400 text-sm">No staff found.</p>
              </div>
            ) : staff.map(s=>(
              <button key={s.name} onClick={() => openProfile(s.name)}
                className={`w-full text-left bg-white rounded-2xl border mb-2 p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition ${
                  profile?.name===s.name ? 'ring-2 ring-slate-500 border-slate-300' : 'border-slate-200'
                }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {initials(s.instructor_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{s.instructor_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.designation}</p>
                  </div>
                  {s.department && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${deptColor(s.department)}`}>
                      {s.department}
                    </span>
                  )}
                </div>
                {s.subjects.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2 ml-13">
                    {s.subjects.slice(0,3).map(sub=>(
                      <span key={sub} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{sub}</span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Profile panel */}
          {(profile || profLoad) && (
            <div className="w-1/2 shrink-0">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-4 p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold">
                      {profile ? initials(profile.instructor_name) : '…'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{profile?.instructor_name}</p>
                      <p className="text-xs text-slate-500">{profile?.designation}</p>
                    </div>
                  </div>
                  <button onClick={() => setProfile(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
                </div>

                {profLoad ? <div className="h-32 bg-slate-50 rounded-xl animate-pulse"/> : profile && (
                  <div className="space-y-4">
                    {profile.email && (
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Email</p>
                        <a href={`mailto:${profile.email}`} className="text-sm text-indigo-600 hover:underline">{profile.email}</a>
                      </div>
                    )}
                    {profile.phone && (
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Phone</p>
                        <a href={`tel:${profile.phone}`} className="text-sm text-slate-700">{profile.phone}</a>
                      </div>
                    )}

                    {profile.today_schedule.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 font-medium mb-1.5">Today's Schedule</p>
                        {profile.today_schedule.map((s,i)=>(
                          <div key={i} className="flex justify-between text-xs bg-slate-50 rounded-lg px-3 py-1.5 mb-1">
                            <span className="font-medium text-slate-700">{s.course}</span>
                            <span className="text-slate-500">{s.from_time}–{s.to_time} {s.room?`· ${s.room}`:''}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {profile.groups.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 font-medium mb-1.5">Student Groups</p>
                        {profile.groups.slice(0,5).map(g=>(
                          <div key={g.name} className="text-xs bg-slate-50 rounded-lg px-3 py-1.5 mb-1 text-slate-700">
                            {g.student_group_name} {g.program ? `· ${g.program}`:``}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
