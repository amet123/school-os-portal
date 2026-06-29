'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Pipeline {[status: string]: number}
interface DashboardData {pipeline: Pipeline; total: number}

const COLS = ['Submitted','Under Review','Shortlisted','Offer Sent','Enrolled','Rejected'];
const COL_STYLE: Record<string, string> = {
  'Submitted':    'border-blue-300   bg-blue-50',
  'Under Review': 'border-amber-300  bg-amber-50',
  'Shortlisted':  'border-indigo-300 bg-indigo-50',
  'Offer Sent':   'border-violet-300 bg-violet-50',
  'Enrolled':     'border-emerald-300 bg-emerald-50',
  'Rejected':     'border-rose-300   bg-rose-50',
};
const BADGE_STYLE: Record<string, string> = {
  'Submitted':    'bg-blue-100   text-blue-700',
  'Under Review': 'bg-amber-100  text-amber-700',
  'Shortlisted':  'bg-indigo-100 text-indigo-700',
  'Offer Sent':   'bg-violet-100 text-violet-700',
  'Enrolled':     'bg-emerald-100 text-emerald-700',
  'Rejected':     'bg-rose-100   text-rose-700',
};

export default function AdminAdmissions() {
  const locale = useLocale();
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/admissions')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const pipeline = data?.pipeline ?? {};
  const total    = data?.total ?? 0;
  const enrolled = pipeline['Enrolled'] ?? 0;
  const rejected = pipeline['Rejected'] ?? 0;
  const rejRate  = total > 0 ? Math.round((rejected / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-6 py-4 shadow">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href={`/${locale}/admin`} className="text-emerald-200 hover:text-white text-sm">← Dashboard</Link>
          <h1 className="font-bold text-lg">Admissions Pipeline</h1>
        </div>
      </header>

      {/* Stats bar */}
      <div className="max-w-7xl mx-auto px-4 pt-5 pb-3">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total Applications" value={total}   color="slate"/>
          <StatCard label="Enrolled"            value={enrolled} color="emerald"/>
          <StatCard label="Rejection Rate"      value={`${rejRate}%`} color="rose"/>
        </div>
      </div>

      {/* Kanban */}
      <div className="max-w-7xl mx-auto px-4 pb-10 overflow-x-auto">
        {loading ? (
          <div className="flex gap-3 mt-4">
            {COLS.map(c => <div key={c} className="w-48 h-48 bg-white rounded-xl animate-pulse border border-slate-200 flex-shrink-0"/>)}
          </div>
        ) : (
          <div className="flex gap-3 mt-4 min-w-max">
            {COLS.map(col => (
              <div key={col} className={`w-52 rounded-xl border-2 ${COL_STYLE[col]} p-3 flex-shrink-0`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${BADGE_STYLE[col]}`}>{col}</span>
                  <span className="text-lg font-bold text-slate-700">{pipeline[col] ?? 0}</span>
                </div>
                {(pipeline[col] ?? 0) === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">No applications</p>
                )}
                {(pipeline[col] ?? 0) > 0 && (
                  <p className="text-xs text-slate-500 text-center py-2">
                    {pipeline[col]} application{pipeline[col] !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({label, value, color}: {label: string; value: number | string; color: string}) {
  const cls = {
    slate:   'bg-slate-50   text-slate-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose:    'bg-rose-50    text-rose-700',
  }[color] ?? 'bg-slate-50 text-slate-700';
  return (
    <div className={`rounded-xl p-4 border border-slate-200 ${cls}`}>
      <p className="text-xs font-medium opacity-60 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
