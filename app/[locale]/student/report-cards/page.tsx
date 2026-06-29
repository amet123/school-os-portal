'use client';
import {useEffect, useState} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import Link from 'next/link';

interface RC {
  name: string; academic_year: string; academic_term: string;
  board: string; percentage: number; overall_grade: string; published_at: string;
}

export default function StudentReportCards() {
  const t      = useTranslations('report_cards');
  const tc     = useTranslations('common');
  const locale = useLocale();
  const [cards, setCards]   = useState<RC[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/report-cards')
      .then(r => r.json())
      .then(d => { setCards(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const gradeColor = (g: string) => {
    if (['A1','A2','A*','A','7','6'].includes(g)) return 'bg-green-100 text-green-800';
    if (['B1','B2','B','5','4'].includes(g))       return 'bg-blue-100 text-blue-800';
    if (['C1','C2','C','3'].includes(g))           return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/student`} className="text-blue-200 hover:text-white text-sm">{tc('back')}</Link>
        <h1 className="font-bold text-lg">{t('title')}</h1>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <p className="text-center text-slate-400 py-16">{tc('loading')}</p>
        ) : cards.length === 0 ? (
          <p className="text-center text-slate-400 py-16">{t('no_cards')}</p>
        ) : (
          <div className="space-y-3">
            {cards.map(rc => (
              <div key={rc.name} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{rc.academic_term}</p>
                  <p className="text-xs text-slate-400">{rc.academic_year} · {rc.board}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {t('published')}: {new Date(rc.published_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${gradeColor(rc.overall_grade)}`}>
                    {rc.overall_grade}
                  </span>
                  <p className="text-xs text-slate-500">{rc.percentage?.toFixed(1)}%</p>
                  <div className="flex gap-2">
                    <Link href={`/${locale}/student/report-cards/${rc.name}`}
                          className="text-xs text-blue-600 hover:underline">{t('view')}</Link>
                    <a href={`/api/student/report-cards/${rc.name}/pdf`}
                       target="_blank" rel="noreferrer"
                       className="text-xs text-indigo-600 hover:underline">{t('download_pdf')}</a>
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
