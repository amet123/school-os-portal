'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Borrowing { name: string; book_title: string; student_name: string; due_date: string; borrowed_date: string; }

export default function TeacherLibrary() {
  const locale = useLocale();
  const [overdue, setOverdue] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/library/overdue').then(r => r.json())
      .then(d => { setOverdue(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const daysLate = (due: string) => {
    const diff = Math.floor((Date.now() - new Date(due).getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-teal-700 to-emerald-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/teacher`} className="text-teal-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg">Library — Overdue</h1>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="bg-white rounded-xl h-16 animate-pulse border border-slate-200"/>)}</div>
        ) : overdue.length === 0 ? (
          <p className="text-center text-slate-400 py-16">No overdue books. 🎉</p>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-4">{overdue.length} overdue borrowing(s)</p>
            <div className="space-y-3">
              {overdue.map(b => (
                <div key={b.name} className="bg-white rounded-xl border border-red-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-slate-800">{b.book_title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{b.student_name}</p>
                      <p className="text-xs text-slate-400">Borrowed: {new Date(b.borrowed_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-1 rounded-full">
                        {daysLate(b.due_date)}d overdue
                      </span>
                      <p className="text-xs text-slate-400 mt-1">Due: {new Date(b.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
