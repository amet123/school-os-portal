'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Incident {
  name: string; incident_date: string; student_name: string;
  incident_type: string; severity: string; status: string; parent_notified: number;
}

const SEV_CLR: Record<string,string> = {
  Minor:'bg-yellow-100 text-yellow-700', Moderate:'bg-orange-100 text-orange-700', Severe:'bg-rose-100 text-rose-700',
};
const STA_CLR: Record<string,string> = {
  Open:'bg-slate-100 text-slate-600','Under Review':'bg-amber-100 text-amber-700',
  Resolved:'bg-emerald-100 text-emerald-700',
};

export default function ParentDiscipline() {
  const locale = useLocale();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    fetch('/api/parent/discipline')
      .then(r=>r.json())
      .then(d => { setIncidents(d.incidents ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const fmtDate = (d:string) => d?.slice(0,10)||'';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-rose-700 to-orange-700 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/parent`} className="text-rose-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg">Discipline Records</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <>{[1,2].map(i=><div key={i} className="h-16 bg-white rounded-2xl border animate-pulse mb-3"/>)}</>
        ) : incidents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-slate-500 text-sm">No discipline records on file.</p>
          </div>
        ) : (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4 text-sm text-amber-800">
              Please contact the school for details on any incident below.
            </div>
            {incidents.map(inc=>(
              <div key={inc.name} className="bg-white rounded-2xl border border-slate-200 p-4 mb-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{inc.student_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{fmtDate(inc.incident_date)} · {inc.incident_type}</p>
                    {inc.parent_notified
                      ? <p className="text-xs text-emerald-600 mt-0.5">School has notified you about this incident.</p>
                      : <p className="text-xs text-amber-600 mt-0.5">Notification pending.</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SEV_CLR[inc.severity]??''}`}>{inc.severity}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STA_CLR[inc.status]??''}`}>{inc.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
