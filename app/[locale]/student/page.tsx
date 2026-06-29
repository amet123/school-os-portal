'use client';
import {useEffect, useState} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import Link from 'next/link';

interface Session {
  role: string;
  display_name: string;
  student?: {name: string; student_name: string; region_company: string};
}

export default function StudentDashboard() {
  const t      = useTranslations('student');
  const tn     = useTranslations('nav');
  const locale = useLocale();
  const [session, setSession] = useState<Session | null>(null);
  const [stats,   setStats]   = useState<{total: number; present: number; attendance_pct: number} | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.session) setSession(d.session as Session);
    });
    fetch('/api/student/attendance').then(r => r.json()).then(d => {
      if (d.total !== undefined) setStats(d as {total: number; present: number; attendance_pct: number});
    });
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', {method: 'POST'});
    window.location.href = `/${locale}/login`;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏫</span>
          <span className="font-bold text-lg">{tn('student')}</span>
        </div>
        <button onClick={logout} className="text-sm text-blue-200 hover:text-white transition-colors">
          {tn('logout')}
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {t('welcome', {name: session?.display_name ?? '…'})}
        </h1>
        <p className="text-slate-500 mb-8 text-sm">{session?.student?.region_company}</p>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t('pct_label')}</p>
            <p className="text-3xl font-bold text-blue-600">
              {stats ? `${stats.attendance_pct}%` : '—'}
            </p>
            <p className="text-xs text-slate-400 mt-1">{stats?.total ?? 0} days</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t('balance')}</p>
            <p className="text-3xl font-bold text-emerald-600">—</p>
            <p className="text-xs text-slate-400 mt-1">updated now</p>
          </div>
        </div>

        {/* Nav cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href={`/${locale}/student/attendance`}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition group">
            <div className="text-3xl mb-2">📅</div>
            <h3 className="font-semibold text-slate-800 group-hover:text-blue-600">{t('attendance')}</h3>
          </Link>
          <Link href={`/${locale}/student/fees`}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition group">
            <div className="text-3xl mb-2">💳</div>
            <h3 className="font-semibold text-slate-800 group-hover:text-blue-600">{t('fees')}</h3>
          </Link>
          <Link href={`/${locale}/student/report-cards`}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition group">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-semibold text-slate-800 group-hover:text-blue-600">{t('report_cards')}</h3>
          </Link>
        </div>
      </main>
    </div>
  );
}
