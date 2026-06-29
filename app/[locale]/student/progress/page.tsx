'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Progress {
  name: string; academic_term: string; academic_year: string;
  percentage: number; overall_grade: string; published_at: string;
}

export default function StudentProgress() {
  const locale = useLocale();
  const [data, setData]     = useState<Progress[]>([]);
  const [student, setStudent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      const s = d.session?.student?.name;
      if (!s) return;
      setStudent(s);
      fetch(`/api/analytics/progress?student=${encodeURIComponent(s)}`)
        .then(r => r.json())
        .then(rows => { setData(Array.isArray(rows) ? rows : []); setLoading(false); })
        .catch(() => setLoading(false));
    });
  }, []);

  const maxPct = data.length > 0 ? Math.max(...data.map(d => d.percentage ?? 0)) : 100;

  const gradeColor = (g: string) => {
    if (['A1','A2','A*','A','7','6'].includes(g)) return 'text-green-600';
    if (['B1','B2','B','5','4'].includes(g))       return 'text-blue-600';
    if (['C1','C2','C','3'].includes(g))           return 'text-yellow-600';
    return 'text-red-600';
  };

  const barColor = (pct: number) => {
    if (pct >= 80) return '#22c55e';
    if (pct >= 60) return '#3b82f6';
    if (pct >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/student`} className="text-blue-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg">My Progress</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="bg-white rounded-xl h-64 animate-pulse border border-slate-200" />
        ) : data.length === 0 ? (
          <p className="text-center text-slate-400 py-16">No report cards published yet.</p>
        ) : (
          <>
            {/* Bar chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Marks % per Term
              </h2>
              <div className="flex items-end gap-3 h-40">
                {data.map(row => {
                  const h = Math.max(4, Math.round((row.percentage / Math.max(maxPct, 1)) * 140));
                  return (
                    <div key={row.name} className="flex-1 flex flex-col items-center gap-1">
                      <p className={`text-xs font-bold ${gradeColor(row.overall_grade)}`}>
                        {row.overall_grade}
                      </p>
                      <div
                        style={{height: h, backgroundColor: barColor(row.percentage)}}
                        className="w-full rounded-t-md transition-all"
                        title={`${row.percentage?.toFixed(1)}%`}
                      />
                      <p className="text-xs text-slate-400 text-center leading-tight">
                        {row.academic_term.split(' ')[0]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Term</th>
                    <th className="text-right px-4 py-3 text-slate-500 font-medium">%</th>
                    <th className="text-center px-4 py-3 text-slate-500 font-medium">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data].reverse().map(row => (
                    <tr key={row.name} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 text-slate-700">
                        <p className="font-medium">{row.academic_term}</p>
                        <p className="text-xs text-slate-400">{row.academic_year}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">
                        {row.percentage?.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold ${gradeColor(row.overall_grade)}`}>
                          {row.overall_grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
