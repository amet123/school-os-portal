'use client';
import {useEffect, useState} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import Link from 'next/link';

interface Session {role: string; display_name: string; user: string}

const NAV = [
  {href: 'attendance',    icon: '📋', label: 'Mark Attendance', color: 'hover:text-blue-600'},
  {href: 'timetable',    icon: '🗓️', label: 'Timetable',       color: 'hover:text-indigo-600'},
  {href: 'homework',      icon: '📝', label: 'Homework',        color: 'hover:text-orange-600'},
  {href: 'exams',         icon: '📊', label: 'Exams',           color: 'hover:text-red-600'},
  {href: 'report-cards',  icon: '📋', label: 'Report Cards',    color: 'hover:text-violet-600'},
  {href: 'analytics',     icon: '📈', label: 'Analytics',       color: 'hover:text-teal-600'},
  {href: 'library',       icon: '📚', label: 'Library',         color: 'hover:text-amber-600'},
  {href: 'announcements', icon: '📢', label: 'Announcements',   color: 'hover:text-sky-600'},
  {href: 'messages',      icon: '💬', label: 'Parent Messages', color: 'hover:text-emerald-600'},
] as const;

export default function TeacherDashboard() {
  const t      = useTranslations('teacher');
  const tn     = useTranslations('nav');
  const locale = useLocale();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.session) setSession(d.session as Session);
    });
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', {method: 'POST'});
    window.location.href = `/${locale}/login`;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-teal-700 to-emerald-800 text-white px-6 py-4 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👩‍🏫</span>
          <span className="font-bold text-lg">{tn('teacher')}</span>
        </div>
        <button onClick={logout} className="text-sm text-teal-100 hover:text-white transition-colors">
          {tn('logout')}
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">{t('dashboard')}</h1>
        <p className="text-slate-400 text-sm mb-8">{session?.display_name || session?.user || '…'}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {NAV.map(({href, icon, label, color}) => (
            <Link
              key={href}
              href={`/${locale}/teacher/${href}`}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition group flex flex-col gap-2"
            >
              <span className="text-3xl">{icon}</span>
              <span className={`font-semibold text-slate-700 text-sm group-hover:${color.replace('hover:','')}`}>
                {label}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
