'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Scholarship {
  name: string; scholarship_name: string; scholarship_type: string;
  discount_type: string; discount_value: number; max_discount_cap: number;
  description: string;
}
interface Concession {
  name: string; scholarship: string; academic_year: string;
  from_date: string; status: string; total_discount_applied: number; remarks: string;
}

const STATUS_CLR: Record<string, string> = {
  Pending:  'bg-amber-100 text-amber-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-rose-100 text-rose-700',
  Revoked:  'bg-slate-100 text-slate-500',
};

export default function StudentScholarships() {
  const locale  = useLocale();
  const [scholarships, setScholarships]   = useState<Scholarship[]>([]);
  const [concessions,  setConcessions]    = useState<Concession[]>([]);
  const [loading,      setLoading]        = useState(true);
  const [applying,     setApplying]       = useState<string | null>(null);
  const [success,      setSuccess]        = useState('');
  const [error,        setError]          = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/student/scholarships').then(r => r.json()),
      fetch('/api/student/concessions').then(r => r.json()),
    ]).then(([sc, co]) => {
      setScholarships(sc.scholarships ?? []);
      setConcessions(co.concessions ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function apply(scholarshipName: string) {
    setApplying(scholarshipName); setError(''); setSuccess('');
    const r = await fetch('/api/student/scholarships/apply', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({scholarship: scholarshipName}),
    });
    const d = await r.json();
    if (!r.ok) setError(d.error || 'Failed to apply');
    else { setSuccess(`Application submitted: ${d.name}`); load(); }
    setApplying(null);
  }

  const alreadyApplied = new Set(concessions.filter(c => c.status !== 'Rejected' && c.status !== 'Revoked').map(c => c.scholarship));
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-violet-700 to-indigo-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/student`} className="text-violet-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg">Scholarships & Concessions</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {error   && <p className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">{error}</p>}
        {success && <p className="text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">{success}</p>}

        {/* My concessions */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">My Concessions</h2>
          {loading ? (
            <>{[1,2].map(i => <div key={i} className="h-16 bg-white rounded-2xl border animate-pulse mb-2"/>)}</>
          ) : concessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
              <p className="text-slate-400 text-sm">No concession applications yet.</p>
            </div>
          ) : concessions.map(c => (
            <div key={c.name} className="bg-white rounded-2xl border border-slate-200 p-4 mb-2 flex items-center justify-between shadow-sm">
              <div>
                <p className="font-semibold text-slate-800">{c.scholarship}</p>
                <p className="text-xs text-slate-500 mt-0.5">{c.academic_year} · From {fmt(c.from_date)}</p>
                {c.total_discount_applied > 0 && (
                  <p className="text-xs text-emerald-600 mt-0.5 font-medium">Saved: ₹{c.total_discount_applied.toLocaleString()}</p>
                )}
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CLR[c.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {c.status}
              </span>
            </div>
          ))}
        </section>

        {/* Available scholarships */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Available Scholarships</h2>
          {loading ? (
            <div className="grid gap-3">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl border animate-pulse"/>)}
            </div>
          ) : scholarships.length === 0 ? (
            <p className="text-slate-400 text-sm">No scholarships available.</p>
          ) : (
            <div className="grid gap-3">
              {scholarships.map(sc => {
                const applied = alreadyApplied.has(sc.name);
                return (
                  <div key={sc.name} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">{sc.scholarship_name}</p>
                        <p className="text-xs text-indigo-600 font-medium mt-0.5">{sc.scholarship_type}</p>
                        {sc.description && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{sc.description}</p>}
                        <p className="text-sm font-bold text-violet-700 mt-2">
                          {sc.discount_type === 'Percentage' ? `${sc.discount_value}% off` : `₹${sc.discount_value} off`}
                          {sc.max_discount_cap > 0 && <span className="text-xs font-normal text-slate-400 ml-1">(max ₹{sc.max_discount_cap})</span>}
                        </p>
                      </div>
                      <button
                        disabled={applied || applying === sc.name}
                        onClick={() => apply(sc.name)}
                        className={`shrink-0 text-xs font-semibold px-4 py-2 rounded-xl transition ${
                          applied
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50'
                        }`}
                      >
                        {applied ? 'Applied' : applying === sc.name ? '…' : 'Apply'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
