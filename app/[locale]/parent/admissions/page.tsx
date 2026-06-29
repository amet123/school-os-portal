'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Application {
  name: string;
  applicant_name: string;
  program: string;
  status: string;
  application_date: string;
  company: string;
}

const STATUS_STYLE: Record<string, string> = {
  'Draft':        'bg-slate-100 text-slate-600',
  'Submitted':    'bg-blue-100 text-blue-700',
  'Under Review': 'bg-amber-100 text-amber-700',
  'Shortlisted':  'bg-indigo-100 text-indigo-700',
  'Waitlisted':   'bg-orange-100 text-orange-700',
  'Offer Sent':   'bg-violet-100 text-violet-700',
  'Enrolled':     'bg-emerald-100 text-emerald-700',
  'Rejected':     'bg-rose-100 text-rose-700',
};

export default function ParentAdmissions() {
  const locale = useLocale();
  const [apps,    setApps]    = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admissions')
      .then(r => r.json())
      .then(d => { setApps(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-6 py-4 shadow">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/parent`} className="text-emerald-200 hover:text-white text-sm">← Back</Link>
            <h1 className="font-bold text-lg">Admissions</h1>
          </div>
          <Link href={`/${locale}/parent/admissions/new`}
            className="bg-white text-emerald-700 text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-emerald-50 transition">
            + New Application
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        {loading ? (
          <>{[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-slate-200"/>
          ))}</>
        ) : apps.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
            <p className="text-4xl mb-3">🎒</p>
            <p className="text-slate-500 font-medium">No applications yet.</p>
            <p className="text-xs text-slate-400 mt-1">Start a new application to enrol your child.</p>
            <Link href={`/${locale}/parent/admissions/new`}
              className="mt-4 inline-block bg-emerald-600 text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-emerald-700 transition">
              Apply Now
            </Link>
          </div>
        ) : apps.map(a => (
          <div key={a.name} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm
                                        hover:border-emerald-300 hover:shadow-md transition">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-800">{a.applicant_name}</p>
                <p className="text-sm text-slate-500 mt-0.5">{a.program} · {a.company}</p>
                <p className="text-xs text-slate-400 mt-1">{a.application_date}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${STATUS_STYLE[a.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {a.status}
              </span>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
