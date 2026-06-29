'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Sub { name: string; status: string; score: number | null; }
interface HW  { name: string; title: string; course: string; due_date: string; description: string; submission: Sub | null; }

const STATUS_STYLE: Record<string, string> = {
  Submitted: 'bg-blue-100 text-blue-700',
  Graded:    'bg-green-100 text-green-700',
  Pending:   'bg-yellow-100 text-yellow-700',
};

export default function StudentHomework() {
  const locale = useLocale();
  const [student, setStudent] = useState('');
  const [hwList, setHwList]   = useState<HW[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      const s = d.session?.student?.name;
      if (!s) return;
      setStudent(s);
      fetch(`/api/homework?student=${encodeURIComponent(s)}`)
        .then(r => r.json())
        .then(d => { setHwList(Array.isArray(d) ? d : []); setLoading(false); })
        .catch(() => setLoading(false));
    });
  }, []);

  async function handleSubmit(hwName: string) {
    if (!student) return;
    setSubmitting(hwName);
    const r = await fetch('/api/homework/submit', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({homework: hwName, student}),
    });
    const data = await r.json();
    setSubmitting(null);
    if (data.name) {
      setMsg('Submitted!');
      setHwList(prev => prev.map(h =>
        h.name === hwName ? {...h, submission: {name: data.name, status: data.status, score: null}} : h
      ));
    }
  }

  const overdue = (due: string) => new Date(due) < new Date();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/student`} className="text-blue-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg">Homework</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {msg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2 mb-4">{msg}</div>}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-24 animate-pulse border border-slate-200" />)}
          </div>
        ) : hwList.length === 0 ? (
          <p className="text-center text-slate-400 py-16">No open homework assigned.</p>
        ) : (
          <div className="space-y-3">
            {hwList.map(hw => {
              const sub = hw.submission;
              const late = overdue(hw.due_date) && !sub;
              return (
                <div key={hw.name}
                     className={`bg-white rounded-xl border p-5 ${late ? 'border-red-200' : 'border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-slate-800">{hw.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{hw.course}</p>
                    </div>
                    {sub ? (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${STATUS_STYLE[sub.status] || 'bg-slate-100 text-slate-600'}`}>
                        {sub.status}{sub.score != null ? ` · ${sub.score}` : ''}
                      </span>
                    ) : (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${late ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                        {late ? 'Overdue' : 'Pending'}
                      </span>
                    )}
                  </div>
                  {hw.description && (
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{hw.description.replace(/<[^>]+>/g,'')}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">Due: {new Date(hw.due_date).toLocaleDateString()}</p>
                    {!sub && (
                      <button
                        onClick={() => handleSubmit(hw.name)}
                        disabled={submitting === hw.name}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        {submitting === hw.name ? 'Submitting…' : 'Mark Submitted'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
