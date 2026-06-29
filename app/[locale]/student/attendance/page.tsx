'use client';
import {useEffect, useState} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import Link from 'next/link';

interface AttendanceRecord {status: string; date: string; student_group: string}

export default function StudentAttendancePage() {
  const t      = useTranslations('student');
  const tn     = useTranslations('nav');
  const tc     = useTranslations('common');
  const locale = useLocale();
  const [data,    setData]    = useState<{records?: AttendanceRecord[]; attendance_pct?: number} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/attendance')
      .then(r => r.json())
      .then(d => { setData(d as typeof data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statusColor = (s: string) =>
    s === 'Present' ? 'bg-green-100 text-green-700'
    : s === 'Absent'  ? 'bg-red-100 text-red-700'
    : 'bg-amber-100 text-amber-700';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/student`} className="text-blue-200 hover:text-white text-sm">{tc('back')}</Link>
        <h1 className="font-bold text-lg">{t('attendance')}</h1>
        <span className="ms-auto text-blue-200 text-sm">{tn('student')}</span>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <p className="text-center text-slate-400 py-16">{tc('loading')}</p>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 text-center">
              <p className="text-4xl font-bold text-blue-600">{data?.attendance_pct ?? 0}%</p>
              <p className="text-slate-500 text-sm mt-1">{t('pct_label')}</p>
            </div>
            <div className="space-y-2">
              {(!data?.records || data.records.length === 0) ? (
                <p className="text-center text-slate-400 py-8">{t('no_records')}</p>
              ) : data.records.map((r, i) => (
                <div key={i} className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{r.date}</p>
                    <p className="text-xs text-slate-400">{r.student_group}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(r.status)}`}>
                    {r.status === 'Present' ? t('present') : r.status === 'Absent' ? t('absent') : t('late')}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
