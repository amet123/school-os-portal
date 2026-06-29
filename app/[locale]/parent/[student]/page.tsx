'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Att  { present: number; absent: number; leave: number; total: number; pct: number; }
interface RC   { name: string; percentage: number; overall_grade: string; published_at: string; }
interface Summary {
  student: string; attendance: Att; report_card: RC | null;
  fee_balance: number; rc_count: number;
}

export default function ParentChildPage({params}: {params: {locale: string; student: string}}) {
  const locale = useLocale();
  const {student} = params;
  const [summary, setSummary]   = useState<Summary | null>(null);
  const [childName, setChildName] = useState('');
  const [loading, setLoading]   = useState(true);
  const [term, setTerm]         = useState('');

  useEffect(() => {
    // Get most recent term from progress data
    fetch(`/api/analytics/progress?student=${encodeURIComponent(student)}`)
      .then(r => r.json())
      .then(rows => {
        if (Array.isArray(rows) && rows.length > 0) {
          const latest = rows[rows.length - 1];
          setTerm(latest.academic_term);
          return fetch(`/api/parent/child/${encodeURIComponent(student)}?term=${encodeURIComponent(latest.academic_term)}`);
        }
      })
      .then(r => r?.json())
      .then(d => { if (d) setSummary(d); setLoading(false); })
      .catch(() => setLoading(false));

    fetch('/api/parent/children')
      .then(r => r.json())
      .then((kids: {student: string; student_name: string}[]) => {
        const kid = kids.find(k => k.student === student);
        if (kid) setChildName(kid.student_name);
      });
  }, [student]);

  const att = summary?.attendance;
  const rc  = summary?.report_card;

  const gradeColor = (g: string) => {
    if (['A1','A2','A*','A','7','6'].includes(g)) return 'bg-green-100 text-green-800';
    if (['B1','B2','B','5','4'].includes(g))       return 'bg-blue-100 text-blue-800';
    if (['C1','C2','C','3'].includes(g))           return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-violet-700 to-purple-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/parent`} className="text-purple-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg">{childName || 'Child Overview'}</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-20 animate-pulse border border-slate-200" />)}
          </div>
        ) : !summary ? (
          <p className="text-center text-slate-400 py-16">No data found.</p>
        ) : (
          <>
            {term && <p className="text-xs text-slate-400 mb-4">Term: {term}</p>}

            {/* Attendance card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Attendance</h2>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-violet-600">{att?.pct ?? 0}%</p>
                  <p className="text-xs text-slate-400 mt-1">{att?.total ?? 0} days</p>
                </div>
                <div className="flex-1 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-green-50 rounded-lg py-2">
                    <p className="font-bold text-green-700">{att?.present ?? 0}</p>
                    <p className="text-slate-500">Present</p>
                  </div>
                  <div className="bg-red-50 rounded-lg py-2">
                    <p className="font-bold text-red-700">{att?.absent ?? 0}</p>
                    <p className="text-slate-500">Absent</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg py-2">
                    <p className="font-bold text-yellow-700">{att?.leave ?? 0}</p>
                    <p className="text-slate-500">Leave</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Report card card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Latest Report Card
              </h2>
              {rc ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{rc.percentage?.toFixed(1)}%</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {summary.rc_count} card{summary.rc_count !== 1 ? 's' : ''} total
                    </p>
                  </div>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${gradeColor(rc.overall_grade)}`}>
                    {rc.overall_grade}
                  </span>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No published report card yet.</p>
              )}
            </div>

            {/* Fee balance */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Fee Balance
              </h2>
              <p className={`text-2xl font-bold ${summary.fee_balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {summary.fee_balance > 0
                  ? `Outstanding: ${summary.fee_balance.toFixed(2)}`
                  : 'No outstanding balance'}
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
