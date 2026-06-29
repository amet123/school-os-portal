'use client';
import {useEffect, useState} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import Link from 'next/link';

interface Group {name: string; student_group_name: string}
interface Student {student: string; student_name: string}

export default function TeacherAttendancePage() {
  const t      = useTranslations('teacher');
  const tc     = useTranslations('common');
  const locale = useLocale();

  const [groups,  setGroups]  = useState<Group[]>([]);
  const [group,   setGroup]   = useState('');
  const [date,    setDate]    = useState(new Date().toISOString().slice(0, 10));
  const [roster,  setRoster]  = useState<Student[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/teacher/groups')
      .then(r => r.json())
      .then((d: unknown) => {
        const arr = Array.isArray(d) ? d as Group[] : [];
        setGroups(arr);
      });
  }, []);

  useEffect(() => {
    if (!group) return;
    fetch(`/api/teacher/roster?group=${encodeURIComponent(group)}`)
      .then(r => r.json())
      .then((d: unknown) => {
        const arr = Array.isArray(d)
          ? (d as {student: string; student_name?: string}[]).map(s => ({
              student: s.student,
              student_name: s.student_name ?? s.student,
            }))
          : [];
        setRoster(arr);
        const init: Record<string, string> = {};
        arr.forEach(s => { init[s.student] = 'Present'; });
        setStatuses(init);
      });
  }, [group]);

  async function submit() {
    setLoading(true); setSaved(false);
    const attendance = Object.entries(statuses).map(([student, status]) => ({student, status}));
    await fetch('/api/teacher/attendance', {
      method:  'POST',
      headers: {'Content-Type': 'application/json'},
      body:    JSON.stringify({student_group: group, date, attendance}),
    });
    setLoading(false); setSaved(true);
  }

  const STATUS_OPTIONS = ['Present', 'Absent', 'Late'] as const;
  const labelFor = (s: string) =>
    s === 'Present' ? t('present') : s === 'Absent' ? t('absent') : t('late');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-indigo-700 to-violet-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/teacher`} className="text-indigo-200 hover:text-white text-sm">{tc('back')}</Link>
        <h1 className="font-bold text-lg">{t('mark_attend')}</h1>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{t('select_group')}</label>
            <select value={group} onChange={e => setGroup(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">—</option>
              {groups.map(g => (
                <option key={g.name} value={g.name}>{g.student_group_name || g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{t('select_date')}</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
                   className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {/* Roster */}
        {roster.length > 0 && (
          <div className="space-y-2">
            {roster.map(s => (
              <div key={s.student}
                   className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center justify-between">
                <p className="font-medium text-slate-800 text-sm">{s.student_name}</p>
                <div className="flex gap-1">
                  {STATUS_OPTIONS.map(opt => (
                    <button key={opt}
                      onClick={() => setStatuses(prev => ({...prev, [s.student]: opt}))}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                        statuses[s.student] === opt
                          ? opt === 'Present' ? 'bg-green-100 border-green-400 text-green-700 font-semibold'
                          : opt === 'Absent'  ? 'bg-red-100 border-red-400 text-red-700 font-semibold'
                          : 'bg-amber-100 border-amber-400 text-amber-700 font-semibold'
                          : 'border-slate-200 text-slate-400 hover:border-slate-400'
                      }`}>
                      {labelFor(opt)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={submit} disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50
                               text-white font-semibold py-2.5 rounded-lg mt-2 transition-colors">
              {loading ? tc('loading') : t('submit')}
            </button>
            {saved && (
              <p className="text-center text-green-600 font-medium text-sm">{t('saved')}</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
