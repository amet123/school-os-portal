'use client';
import {useEffect, useState} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import Link from 'next/link';

interface Session {role: string; display_name: string; user: string}

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
      <header className="bg-gradient-to-r from-indigo-700 to-violet-800 text-white px-6 py-4 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👩‍🏫</span>
          <span className="font-bold text-lg">{tn('teacher')}</span>
        </div>
        <button onClick={logout} className="text-sm text-indigo-200 hover:text-white transition-colors">
          {tn('logout')}
        </button>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">{t('dashboard')}</h1>
        <p className="text-slate-500 mb-8 text-sm">{session?.display_name ?? session?.user ?? '…'}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href={`/${locale}/teacher/attendance`}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition group">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600">{t('mark_attend')}</h3>
          </Link>
          <Link href={`/${locale}/teacher/report-cards`}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition group">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600">Report Cards</h3>
          </Link>
          <div className="bg-white rounded-xl border border-slate-200 p-6 opacity-50 cursor-not-allowed">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold text-slate-500">{t('roster')}</h3>
            <p className="text-xs text-slate-400 mt-1">Coming soon</p>
          </div>
        </div>
      </main>
    </div>
  );
}
