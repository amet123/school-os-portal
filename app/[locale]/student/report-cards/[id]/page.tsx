'use client';
import {useEffect, useState} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import Link from 'next/link';

interface Subject {
  course_name: string; marks_obtained: number; max_marks: number;
  grade: string; grade_points: number; remarks: string;
}
interface RC {
  name: string; student_name: string; academic_year: string;
  academic_term: string; board: string; percentage: number;
  overall_grade: string; total_marks: number; total_max: number;
  teacher_remarks: string; subjects: Subject[];
}

export default function ReportCardDetail({params}:{params:{id:string}}) {
  const t      = useTranslations('report_cards');
  const tc     = useTranslations('common');
  const locale = useLocale();
  const [rc, setRc]         = useState<RC | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/student/report-cards/${params.id}`)
      .then(r => r.json())
      .then(d => { setRc(d as RC); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">{tc('loading')}</div>;
  if (!rc) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Not found</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/student/report-cards`} className="text-blue-200 hover:text-white text-sm">{tc('back')}</Link>
        <h1 className="font-bold text-lg">{rc.academic_term}</h1>
        <a href={`/api/student/report-cards/${rc.name}/pdf`} target="_blank" rel="noreferrer"
           className="ms-auto bg-white text-blue-700 text-xs font-semibold px-3 py-1 rounded-full hover:bg-blue-50">
          {t('download_pdf')}
        </a>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5 flex gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-blue-700">{rc.percentage?.toFixed(1)}%</p>
            <p className="text-xs text-slate-400 mt-1">{t('percentage')}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-indigo-700">{rc.overall_grade}</p>
            <p className="text-xs text-slate-400 mt-1">{t('overall_grade')}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-700">{rc.total_marks}/{rc.total_max}</p>
            <p className="text-xs text-slate-400 mt-1">{t('marks')}</p>
          </div>
        </div>
        {/* Subjects table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-5">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-start font-semibold text-slate-700">{t('subject')}</th>
                <th className="px-3 py-3 text-center font-semibold text-slate-700">{t('marks')}</th>
                <th className="px-3 py-3 text-center font-semibold text-slate-700">{t('grade')}</th>
                <th className="px-3 py-3 text-start font-semibold text-slate-700">{t('remarks')}</th>
              </tr>
            </thead>
            <tbody>
              {rc.subjects?.map((s, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-800">{s.course_name}</td>
                  <td className="px-3 py-3 text-center text-slate-600">{s.marks_obtained}/{s.max_marks}</td>
                  <td className="px-3 py-3 text-center font-bold text-blue-700">{s.grade}</td>
                  <td className="px-3 py-3 text-slate-500 text-xs">{s.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rc.teacher_remarks && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
            <strong>{t('teacher_remarks')}:</strong> {rc.teacher_remarks}
          </div>
        )}
      </main>
    </div>
  );
}
