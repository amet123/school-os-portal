'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Profile {
  student_name:string; blood_group:string; allergies:string;
  chronic_conditions:string; emergency_contact_name:string; emergency_contact_phone:string;
}
interface Visit {
  name:string; visit_date:string; student_name:string;
  complaint:string; complaint_category:string; outcome:string; parent_notified:number;
}

const OUTCOME_CLR: Record<string,string> = {
  'Returned to Class':'bg-emerald-100 text-emerald-700',
  'Sent Home':        'bg-amber-100 text-amber-700',
  'Referred to Doctor':'bg-blue-100 text-blue-700',
  'Emergency Response':'bg-rose-100 text-rose-700',
};

export default function ParentHealth() {
  const locale = useLocale();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [visits,   setVisits]   = useState<Visit[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetch('/api/parent/health')
      .then(r=>r.json())
      .then(d => {
        setProfiles(d.profiles ?? []);
        setVisits(d.visits ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const fmtDate = (d:string) => d?.slice(0,10)||'';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-teal-600 to-emerald-700 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/parent`} className="text-teal-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg">Child Health Records</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <>{[1,2].map(i=><div key={i} className="h-28 bg-white rounded-2xl border animate-pulse"/>)}</>
        ) : (
          <>
            {/* Health profiles */}
            {profiles.length === 0 ? (
              <div className="bg-white rounded-2xl border p-8 text-center">
                <p className="text-3xl mb-2">⚕️</p>
                <p className="text-slate-500 text-sm">No health profile on file yet.</p>
              </div>
            ) : profiles.map((p,i)=>(
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <p className="font-bold text-slate-800 mb-3">{p.student_name}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    {label:'Blood Group',      val: p.blood_group || 'Unknown'},
                    {label:'Emergency Contact', val: p.emergency_contact_name || '—'},
                    {label:'Contact Phone',     val: p.emergency_contact_phone || '—'},
                  ].map(r=>(
                    <div key={r.label}>
                      <p className="text-xs text-slate-400 font-medium">{r.label}</p>
                      <p className="text-slate-700 font-medium mt-0.5">{r.val}</p>
                    </div>
                  ))}
                </div>
                {p.allergies && p.allergies !== 'None' && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-sm text-amber-800">
                    ⚠️ <span className="font-semibold">Allergies:</span> {p.allergies}
                  </div>
                )}
                {p.chronic_conditions && p.chronic_conditions !== 'None' && (
                  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-sm text-blue-800">
                    ⚕️ <span className="font-semibold">Conditions:</span> {p.chronic_conditions}
                  </div>
                )}
              </div>
            ))}

            {/* Nurse visits */}
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Nurse Visit History</h2>
              {visits.length === 0 ? (
                <p className="text-slate-400 text-sm">No nurse visits recorded.</p>
              ) : visits.map(v=>(
                <div key={v.name} className="bg-white rounded-2xl border border-slate-200 p-4 mb-2 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{v.student_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{fmtDate(v.visit_date)} · {v.complaint}</p>
                    {v.parent_notified
                      ? <p className="text-xs text-emerald-600 mt-0.5">School notified you</p>
                      : null}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${OUTCOME_CLR[v.outcome]??'bg-slate-100 text-slate-600'}`}>
                    {v.outcome}
                  </span>
                </div>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
