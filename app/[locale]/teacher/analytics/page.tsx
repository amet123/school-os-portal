'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface SubjectRow { course_name: string; class_avg: number; max_marks: number; }
interface Analytics {
  class_average: number; highest: number; lowest: number; pass_pct: number;
  total_students: number; with_card: number;
  distribution: Record<string, number>;
  subject_breakdown: SubjectRow[];
}

export default function TeacherAnalytics() {
  const locale = useLocale();
  const [groups, setGroups]   = useState<{name: string}[]>([]);
  const [terms, setTerms]     = useState<{name: string; term_name: string}[]>([]);
  const [group, setGroup]     = useState('');
  const [term, setTerm]       = useState('');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/teacher/groups').then(r => r.json()).then(d => setGroups(d ?? []));
    fetch('/api/teacher/terms').then(r => r.json()).then(d => setTerms(d ?? []));
  }, []);

  const load = () => {
    if (!group || !term) return;
    setLoading(true);
    fetch(`/api/analytics/class?group=${encodeURIComponent(group)}&term=${encodeURIComponent(term)}`)
      .then(r => r.json())
      .then(d => { setAnalytics(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const pctBar = (pct: number) => Math.max(2, Math.round(pct));
  const barCol = (pct: number) => pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-blue-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-teal-700 to-emerald-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/teacher`} className="text-teal-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg">Class Analytics</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs text-slate-500 block mb-1">Student Group</label>
            <select
              value={group} onChange={e => setGroup(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">Select group…</option>
              {groups.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs text-slate-500 block mb-1">Academic Term</label>
            <select
              value={term} onChange={e => setTerm(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">Select term…</option>
              {terms.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
            </select>
          </div>
          <button
            onClick={load}
            disabled={!group || !term || loading}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition"
          >
            {loading ? 'Loading…' : 'Load'}
          </button>
        </div>

        {analytics && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                {label: 'Class Average', value: `${analytics.class_average}%`, color: 'text-teal-700'},
                {label: 'Highest', value: `${analytics.highest.toFixed(1)}%`, color: 'text-green-700'},
                {label: 'Lowest', value: `${analytics.lowest.toFixed(1)}%`, color: 'text-red-700'},
                {label: 'Pass Rate', value: `${analytics.pass_pct}%`, color: 'text-blue-700'},
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mb-4 text-right">
              {analytics.with_card} of {analytics.total_students} students have report cards
            </p>

            {/* Subject breakdown */}
            {analytics.subject_breakdown.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                  Subject-wise Class Average
                </h2>
                <div className="space-y-3">
                  {analytics.subject_breakdown.map(s => (
                    <div key={s.course_name}>
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>{s.course_name}</span>
                        <span className="font-semibold">{s.class_avg} / {s.max_marks}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barCol(s.class_avg)}`}
                          style={{width: `${pctBar(s.class_avg)}%`}}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grade distribution */}
            {Object.keys(analytics.distribution).length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                  Grade Distribution
                </h2>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(analytics.distribution)
                    .sort(([a],[b]) => a.localeCompare(b))
                    .map(([grade, count]) => (
                    <div key={grade} className="text-center bg-slate-50 rounded-lg py-3">
                      <p className="text-xl font-bold text-slate-700">{count}</p>
                      <p className="text-xs text-slate-500">Grade {grade}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
