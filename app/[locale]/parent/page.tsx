'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Child {
  student: string; student_name: string; region_company: string; board: string;
}
interface Session { role: string; display_name: string; children?: Child[]; }

const QUICK_LINKS = [
  {href: 'announcements', icon: '📢', label: 'Announcements', color: 'hover:text-sky-600'},
  {href: 'messages',      icon: '💬', label: 'Messages',      color: 'hover:text-violet-600'},
  {href: 'ptm',       icon: '📅', label: 'PT Meetings',   color: 'hover:text-teal-600'},
  {href: 'transport',     icon: '🚌', label: 'Transport',     color: 'hover:text-lime-600'},
] as const;

export default function ParentDashboard() {
  const locale = useLocale();
  const [session,  setSession]  = useState<Session | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.session) setSession(d.session);
    });
    fetch('/api/parent/children')
      .then(r => r.json())
      .then(d => { setChildren(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', {method: 'POST'});
    window.location.href = `/${locale}/login`;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-violet-700 to-purple-800 text-white px-6 py-4 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👨‍👩‍👧‍👦</span>
          <span className="font-bold text-lg">Parent Portal</span>
        </div>
        <button onClick={logout} className="text-sm text-purple-200 hover:text-white transition-colors">
          Logout
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">
          Welcome, {session?.display_name ?? '…'}
        </h1>
        <p className="text-slate-400 text-sm mb-8">Your children&apos;s school overview</p>

        {/* Children list */}
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3">My Children</p>
        {loading ? (
          <div className="space-y-3 mb-8">
            {[1,2].map(i => (
              <div key={i} className="bg-white rounded-xl h-20 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : children.length === 0 ? (
          <p className="text-center text-slate-400 py-8 mb-8">No students linked to your account.</p>
        ) : (
          <div className="space-y-3 mb-8">
            {children.map(child => (
              <Link
                key={child.student}
                href={`/${locale}/parent/${child.student}`}
                className="block bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-base group-hover:text-violet-700">
                      {child.student_name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{child.region_company}</p>
                    {child.board && (
                      <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full mt-2 inline-block">
                        {child.board}
                      </span>
                    )}
                  </div>
                  <span className="text-violet-400 group-hover:text-violet-700 text-2xl">›</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Quick links */}
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3">Quick Access</p>
        <div className="grid grid-cols-3 gap-3">
          {QUICK_LINKS.map(({href, icon, label, color}) => (
            <Link
              key={href}
              href={`/${locale}/parent/${href}`}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition group flex flex-col items-center gap-2 text-center"
            >
              <span className="text-2xl">{icon}</span>
              <span className={`font-semibold text-slate-700 text-xs group-hover:${color.replace('hover:','')}`}>
                {label}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
