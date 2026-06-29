'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Exam { name: string; exam_name: string; course: string; exam_date: string; start_time: string; duration_mins: number; max_marks: number; room: string; }
interface Result { exam: string; exam_name: string; course: string; exam_date: string; marks_obtained: number; max_marks: number; grade: string; pass_fail: string; absent: number; }

const GRADE_COLOR: Record<string, string> = {
  'A+': 'bg-emerald-100 text-emerald-700',
  A:    'bg-green-100   text-green-700',
  'B+': 'bg-blue-100    text-blue-700',
  B:    'bg-blue-50     text-blue-600',
  C:    'bg-amber-100   text-amber-700',
  D:    'bg-orange-100  text-orange-700',
  F:    'bg-red-100     text-red-700',
  '?':  'bg-slate-100   text-slate-600',
};

export default function StudentExams() {
  const locale = useLocale();
  const [student, setStudent]   = useState('');
  const [upcoming, setUpcoming] = useState<Exam[]>([]);
  const [results, setResults]   = useState<Result[]>([]);
  const [tab, setTab]           = useState<'upcoming'|'results'>('upcoming');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(d => {
      const s = d.session?.student?.name;
      if (!s) return;
      setStudent(s);
      Promise.all([
        fetch(`/api/exams/upcoming?student=${encodeURIComponent(s)}`).then(r=>r.json()),
        fetch(`/api/exams/results?student=${encodeURIComponent(s)}`).then(r=>r.json()),
      ]).then(([up, res]) => {
        setUpcoming(Array.isArray(up) ? up : []);
        setResults(Array.isArray(res) ? res : []);
        setLoading(false);
      }).catch(() => setLoading(false));
    });
  }, []);

  function fmtTime(t: string) {
    if (!t) return '';
    const p = String(t).split(':'); const h = parseInt(p[0]);
    return `${h%12||12}:${p[1]} ${h>=12?'PM':'AM'}`;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/student`} className="text-blue-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg flex-1">Exams & Results</h1>
        <div className="flex gap-2 text-sm">
          {(['upcoming','results'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
                    className={`px-3 py-1 rounded-full transition ${tab===t?'bg-white text-blue-700 font-semibold':'text-blue-200 hover:text-white'}`}>
              {t === 'upcoming' ? 'Upcoming' : 'Results'}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="bg-white rounded-xl h-16 animate-pulse border border-slate-200"/>)}</div>
        ) : tab === 'upcoming' ? (
          upcoming.length === 0 ? (
            <p className="text-center text-slate-400 py-16">No upcoming exams.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map(ex => (
                <div key={ex.name} className="bg-white rounded-xl border border-blue-100 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-slate-800">{ex.exam_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{ex.course}</p>
                      {ex.room && <p className="text-xs text-slate-400">Room: {ex.room}</p>}
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p className="font-medium text-slate-700">{new Date(ex.exam_date+'T00:00:00').toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric'})}</p>
                      {ex.start_time && <p>{fmtTime(ex.start_time)}</p>}
                      <p>{ex.duration_mins} min · {ex.max_marks} marks</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          results.length === 0 ? (
            <p className="text-center text-slate-400 py-16">No results yet.</p>
          ) : (
            <div className="space-y-3">
              {results.map(r => (
                <div key={r.exam} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{r.exam_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{r.course}</p>
                    {r.exam_date && <p className="text-xs text-slate-400">{new Date(r.exam_date+'T00:00:00').toLocaleDateString()}</p>}
                  </div>
                  {r.absent ? (
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">Absent</span>
                  ) : (
                    <div className="text-right">
                      <span className={`text-sm font-bold px-2 py-1 rounded-lg ${GRADE_COLOR[r.grade]||GRADE_COLOR['?']}`}>
                        {r.grade}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">{r.marks_obtained}/{r.max_marks}</p>
                      <p className={`text-xs font-medium ${r.pass_fail==='Pass'?'text-green-600':'text-red-500'}`}>{r.pass_fail}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}
