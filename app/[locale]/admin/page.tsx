'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Stats {
  total_students: number; total_teachers: number; total_groups: number;
  total_books: number; active_borrows: number; overdue_borrows: number;
  open_homework: number; upcoming_exams: number; upcoming_events: number;
  fee_collected: number; fee_outstanding: number;
}
interface OvGroup { group: string; present_pct: number; members: number; }

export default function AdminDashboard() {
  const locale = useLocale();
  const [stats, setStats]       = useState<Stats | null>(null);
  const [overview, setOverview] = useState<OvGroup[]>([]);
  const [feeTrend, setFeeTrend] = useState<{month: string; amount: number}[]>([]);
  const [term, setTerm]         = useState('');
  const [terms, setTerms]       = useState<{name: string}[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch('/api/admin/terms').then(r=>r.json()).then(d => {
      const list = Array.isArray(d) ? d : [];
      setTerms(list);
      const first = list[0]?.name || '';
      setTerm(first);
      loadAll(first);
    });
  }, []);

  function loadAll(t: string) {
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/stats?term=${encodeURIComponent(t)}`).then(r=>r.json()),
      fetch(`/api/admin/attendance?term=${encodeURIComponent(t)}`).then(r=>r.json()),
      fetch(`/api/admin/fee-trend?term=${encodeURIComponent(t)}`).then(r=>r.json()),
    ]).then(([s, ov, ft]) => {
      setStats(s);
      setOverview(ov?.groups ?? []);
      setFeeTrend(Array.isArray(ft) ? ft : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  function handleTermChange(t: string) { setTerm(t); loadAll(t); }

  const maxFee = feeTrend.reduce((m, x) => Math.max(m, x.amount), 1);
  const maxAtt = overview.reduce((m, x) => Math.max(m, x.present_pct), 1);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/teacher`} className="text-slate-300 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg flex-1">Admin Dashboard</h1>
        <select value={term} onChange={e => handleTermChange(e.target.value)}
                className="text-sm bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-1.5 focus:outline-none">
          {terms.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
        </select>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1,2,3,4,5,6,7,8].map(i=><div key={i} className="bg-white rounded-xl h-20 animate-pulse border border-slate-200"/>)}
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                {label:"Students",    val: stats?.total_students,   color:"blue"},
                {label:"Teachers",    val: stats?.total_teachers,   color:"teal"},
                {label:"Books",       val: stats?.total_books,      color:"violet"},
                {label:"Borrows",     val: stats?.active_borrows,   color:"amber"},
                {label:"Overdue",     val: stats?.overdue_borrows,  color:"red"},
                {label:"Open HW",     val: stats?.open_homework,    color:"orange"},
                {label:"Upcoming Exams", val: stats?.upcoming_exams, color:"indigo"},
                {label:"Events",      val: stats?.upcoming_events,  color:"green"},
              ].map(c => (
                <div key={c.label} className={`bg-white rounded-xl border border-slate-200 p-4`}>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{c.label}</p>
                  <p className={`text-2xl font-bold mt-1 text-${c.color}-600`}>{c.val ?? '–'}</p>
                </div>
              ))}
            </div>

            {/* Fee cards */}
            {stats && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white rounded-xl border border-green-200 p-4">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Fees Collected</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">₹{stats.fee_collected.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl border border-orange-200 p-4">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Outstanding</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">₹{stats.fee_outstanding.toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Attendance per group */}
            {overview.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
                <h2 className="font-semibold text-slate-700 text-sm mb-4">Attendance by Group</h2>
                <div className="space-y-3">
                  {overview.slice(0,8).map(g => (
                    <div key={g.group}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 truncate pr-2">{g.group}</span>
                        <span className={`font-semibold ${g.present_pct >= 75 ? 'text-green-600' : g.present_pct >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                          {g.present_pct}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${g.present_pct >= 75 ? 'bg-green-500' : g.present_pct >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                             style={{width:`${g.present_pct}%`}} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fee trend bars */}
            {feeTrend.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
                <h2 className="font-semibold text-slate-700 text-sm mb-4">Monthly Fee Collection</h2>
                <div className="flex items-end gap-2 h-24">
                  {feeTrend.map(m => (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-blue-500 rounded-t-sm"
                           style={{height:`${Math.round((m.amount/maxFee)*80)}px`, minHeight:'4px'}} />
                      <p className="text-[10px] text-slate-400 truncate w-full text-center">{m.month.slice(5)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  {href: 'students',     icon: '👤', label: 'Student Lookup', color: 'hover:border-indigo-400 hover:text-indigo-700'},
                  {href: 'certificates', icon: '🎓', label: 'Certificates', color: 'hover:border-indigo-400 hover:text-indigo-700'},
                  {href: 'calendar', icon: '📅', label: 'Calendar',     color: 'hover:border-violet-400 hover:text-violet-700'},
  {href: 'fees',       icon: '💳', label: 'Fee Overview',  color: 'hover:border-indigo-400 hover:text-indigo-700'},
                  {href: 'health',      icon: '⚕️', label: 'Health',       color: 'hover:border-teal-400 hover:text-teal-700'},
                  {href: 'discipline', icon: '🚨', label: 'Discipline',   color: 'hover:border-rose-400 hover:text-rose-700'},
                  {href: 'ptm',        icon: '📅', label: 'PTM',           color: 'hover:border-teal-400 hover:text-teal-700'},
                  {href: 'leaves',      icon: '🏖️', label: 'Staff Leaves',    color: 'hover:border-cyan-400 hover:text-cyan-700'},
                  {href: 'concessions', icon: '🎓', label: 'Concessions',  color: 'hover:border-violet-400 hover:text-violet-700'},
                  {href: 'admissions',  icon: '🎓', label: 'Admissions',       color: 'hover:border-violet-400 hover:text-violet-700'},
                  {href: 'payments',    icon: '💳', label: 'Payments',         color: 'hover:border-green-400 hover:text-green-700'},
                ].map(({href, icon, label, color}) => (
                  <Link key={href} href={`/${locale}/admin/${href}`}
                    className={`bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 transition ${color} group`}>
                    <span className="text-2xl">{icon}</span>
                    <span className="text-sm font-semibold text-slate-700 group-hover:inherit">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
