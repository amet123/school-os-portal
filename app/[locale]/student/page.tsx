'use client';
import {useEffect, useState} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import Link from 'next/link';

interface Session {
  role: string;
  display_name: string;
  student?: {name: string; student_name: string; region_company: string};
}
interface Stats { total: number; present: number; attendance_pct: number; }

const NAV = [
  {href: 'attendance',   icon: '📅', label: 'attendance',    color: 'hover:text-blue-600'},
  {href: 'fees',         icon: '💳', label: 'fees',           color: 'hover:text-emerald-600'},
  {href: 'timetable',   icon: '🗓️', label: 'timetable',      color: 'hover:text-indigo-600'},
  {href: 'homework',     icon: '📝', label: 'homework',       color: 'hover:text-orange-600'},
  {href: 'exams',        icon: '📊', label: 'exams',          color: 'hover:text-red-600'},
  {href: 'report-cards', icon: '📋', label: 'report_cards',   color: 'hover:text-violet-600'},
  {href: 'progress',     icon: '📈', label: 'progress',       color: 'hover:text-teal-600'},
  {href: 'library',      icon: '📚', label: 'library',        color: 'hover:text-amber-600'},
  {href: 'events',       icon: '🎉', label: 'events',         color: 'hover:text-pink-600'},
  {href: 'announcements',icon: '📢', label: 'announcements',  color: 'hover:text-sky-600'},
  {href: 'transport',    icon: '🚌', label: 'transport',      color: 'hover:text-lime-600'},
] as const;

export default function StudentDashboard() {
  const t      = useTranslations('student');
  const tn     = useTranslations('nav');
  const locale = useLocale();
  const [session, setSession] = useState<Session | null>(null);
  const [stats,   setStats]   = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.session) setSession(d.session as Session);
    });
    fetch('/api/student/attendance').then(r => r.json()).then(d => {
      if (d.total !== undefined) setStats(d as Stats);
    }).catch(() => {});
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', {method: 'POST'});
    window.location.href = `/${locale}/login`;
  }

  return (
    <div className="min-h-screen bg-slate-50">
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
        <h1 className="text-2xl font-bold text-slate-800 mb-1">
          {t('welcome', {name: session?.display_name ?? '…'})}
        </h1>
        <p className="text-slate-400 text-sm mb-8">{session?.student?.region_company}</p>

        {/* Stat strip */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t('pct_label')}</p>
            <p className="text-3xl font-bold text-blue-600">
              {stats ? `${stats.attendance_pct}%` : '—'}
            </p>
            <p className="text-xs text-slate-400 mt-1">{stats?.total ?? 0} days recorded</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t('balance')}</p>
            <p className="text-3xl font-bold text-emerald-600">—</p>
            <p className="text-xs text-slate-400 mt-1">
              <Link href={`/${locale}/student/fees`} className="underline hover:text-emerald-600">
                View fee statement
              </Link>
            </p>
          </div>
        </div>

        {/* Full nav grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {NAV.map(({href, icon, label, color}) => (
            <Link
              key={href}
              href={`/${locale}/student/${href}`}
              className={`bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition group flex flex-col gap-2`}
            >
              <span className="text-3xl">{icon}</span>
              <span className={`font-semibold text-slate-700 text-sm ${color} group-hover:${color.replace('hover:','')}`}>
                {(t as any)(label, {defaultValue: label.replace(/_/g,' ')})}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
