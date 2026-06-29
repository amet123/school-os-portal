'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Exam { name: string; exam_name: string; course: string; exam_date: string; status: string; }
interface Summary { exam_name: string; total: number; appeared: number; pass_count: number; class_avg: number; pass_pct: number; distribution: Record<string,number>; }

export default function TeacherExams() {
  const locale = useLocale();
  const [exams, setExams]       = useState<Exam[]>([]);
  const [selected, setSelected] = useState('');
  const [summary, setSummary]   = useState<Summary | null>(null);
  const [groups, setGroups]     = useState<{name:string}[]>([]);
  const [group, setGroup]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    fetch('/api/teacher/groups').then(r=>r.json()).then(d => setGroups(d??[]));
  }, []);

  useEffect(() => {
    if (!group) return;
    fetch(`/api/exams/list?group=${encodeURIComponent(group)}`).then(r=>r.json())
      .then(d => { setExams(Array.isArray(d)?d:[]); setSelected(''); setSummary(null); });
  }, [group]);

  function loadSummary(examName: string) {
    setSelected(examName); setLoading(true);
    fetch(`/api/exams/summary?exam=${encodeURIComponent(examName)}`).then(r=>r.json())
      .then(d => { setSummary(d); setLoading(false); });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-teal-700 to-emerald-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/teacher`} className="text-teal-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg">Exams</h1>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-4">
          <select value={group} onChange={e => setGroup(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="">Select student group…</option>
            {groups.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
          </select>
        </div>
        {exams.length > 0 && (
          <div className="space-y-2 mb-4">
            {exams.map(ex => (
              <button key={ex.name} onClick={() => loadSummary(ex.name)}
                      className={`w-full text-left bg-white rounded-xl border p-4 flex justify-between items-center transition ${selected===ex.name?'border-teal-400 ring-1 ring-teal-300':'border-slate-200 hover:border-teal-300'}`}>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{ex.exam_name}</p>
                  <p className="text-xs text-slate-400">{ex.course} · {new Date(ex.exam_date+'T00:00:00').toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${ex.status==='Completed'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}`}>
                  {ex.status}
                </span>
              </button>
            ))}
          </div>
        )}
        {loading && <div className="bg-white rounded-xl h-32 animate-pulse border border-slate-200"/>}
        {summary && !loading && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-4">{summary.exam_name} — Summary</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                {l:"Appeared",  v: summary.appeared},
                {l:"Pass",      v: summary.pass_count},
                {l:"Avg",       v: `${summary.class_avg}%`},
              ].map(s => (
                <div key={s.l} className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400">{s.l}</p>
                  <p className="text-lg font-bold text-slate-700">{s.v}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.distribution).map(([g,c]) => (
                <span key={g} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                  {g}: {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
