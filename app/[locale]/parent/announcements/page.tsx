'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Ann { name: string; title: string; body: string; priority: string; published_on: string; author_name: string; }

const PRI_BADGE: Record<string, string> = {
  Urgent:    'bg-red-100 text-red-700',
  Important: 'bg-amber-100 text-amber-700',
  Normal:    'bg-blue-50 text-blue-600',
};

export default function ParentAnnouncements() {
  const locale = useLocale();
  const [anns, setAnns]       = useState<Ann[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExp]    = useState<string|null>(null);

  useEffect(() => {
    fetch('/api/announcements?audience=Parents').then(r=>r.json()).then(d => {
      setAnns(Array.isArray(d)?d:[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-violet-700 to-purple-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/parent`} className="text-violet-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg">Announcements</h1>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-3">{[1,2].map(i=><div key={i} className="bg-white rounded-xl h-20 animate-pulse border border-slate-200"/>)}</div>
        ) : anns.length === 0 ? (
          <p className="text-center text-slate-400 py-16">No announcements.</p>
        ) : (
          <div className="space-y-3">
            {anns.map(a => (
              <div key={a.name} className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="p-4 flex items-start gap-3 cursor-pointer"
                     onClick={() => setExp(expanded===a.name?null:a.name)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800">{a.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${PRI_BADGE[a.priority]||PRI_BADGE['Normal']}`}>
                        {a.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{a.author_name||'School'} · {a.published_on}</p>
                  </div>
                  <span className="text-slate-400 text-sm">{expanded===a.name?'▲':'▼'}</span>
                </div>
                {expanded===a.name && (
                  <div className="px-4 pb-4 text-sm text-slate-700 whitespace-pre-line leading-relaxed border-t border-slate-100 pt-3">
                    {a.body}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
