'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Child {
  student: string; student_name: string; region_company: string; board: string;
}
interface Session {
  role: string; display_name: string; children?: Child[];
}

export default function ParentDashboard() {
  const locale = useLocale();
  const [session, setSession] = useState<Session | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.session) {
        setSession(d.session);
        setChildren(d.session.children ?? []);
      }
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
        <p className="text-slate-500 text-sm mb-8">Your children&apos;s school overview</p>

        {loading ? (
          <div className="space-y-3">
            {[1,2].map(i => (
              <div key={i} className="bg-white rounded-xl h-24 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : children.length === 0 ? (
          <p className="text-center text-slate-400 py-16">No students linked to your account.</p>
        ) : (
          <div className="space-y-4">
            {children.map(child => (
              <Link
                key={child.student}
                href={`/${locale}/parent/${child.student}`}
                className="block bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-lg group-hover:text-violet-700">
                      {child.student_name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{child.region_company}</p>
                    {child.board && (
                      <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full mt-2 inline-block">
                        {child.board}
                      </span>
                    )}
                  </div>
                  <div className="text-violet-400 group-hover:text-violet-700 text-2xl">›</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
