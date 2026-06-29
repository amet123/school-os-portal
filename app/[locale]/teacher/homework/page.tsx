'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface HW { name: string; title: string; course: string; due_date: string; status: string; submission_count: number; graded_count: number; }

export default function TeacherHomework() {
  const locale = useLocale();
  const [groups, setGroups] = useState<{name: string}[]>([]);
  const [group, setGroup]   = useState('');
  const [hwList, setHwList] = useState<HW[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/teacher/groups').then(r => r.json()).then(d => setGroups(d ?? []));
  }, []);

  useEffect(() => {
    if (!group) return;
    setLoading(true);
    fetch(`/api/homework/class?group=${encodeURIComponent(group)}`)
      .then(r => r.json())
      .then(d => { setHwList(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [group]);

  const overdue = (due: string, status: string) =>
    status === 'Open' && new Date(due) < new Date();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-teal-700 to-emerald-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/teacher`} className="text-teal-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg">Homework</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-4">
          <select value={group} onChange={e => setGroup(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="">Select student group…</option>
            {groups.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
          </select>
        </div>

        {!group ? (
          <p className="text-center text-slate-400 py-12">Select a group to view homework.</p>
        ) : loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-20 animate-pulse border border-slate-200" />)}</div>
        ) : hwList.length === 0 ? (
          <p className="text-center text-slate-400 py-10">No homework found for this group.</p>
        ) : (
          <div className="space-y-3">
            {hwList.map(hw => (
              <div key={hw.name}
                   className={`bg-white rounded-xl border p-5 ${overdue(hw.due_date, hw.status) ? 'border-orange-200' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{hw.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{hw.course}</p>
                    <p className="text-xs text-slate-400 mt-1">Due: {new Date(hw.due_date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${hw.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {hw.status}
                    </span>
                    <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                      <p>{hw.submission_count} submitted</p>
                      <p>{hw.graded_count} graded</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
