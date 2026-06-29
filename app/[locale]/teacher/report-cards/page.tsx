'use client';
import {useEffect, useState, useCallback} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import Link from 'next/link';

interface ClassMember {
  student: string; student_name: string;
  card?: {name: string; status: string; percentage: number; overall_grade: string};
}

const GROUPS = [
  {label: 'Class VI — 2025-26 (India)',  group: 'Class VI — 2025-26'},
  {label: 'Grade 6 — 2025-26 (Qatar)',   group: 'Grade 6 — 2025-26 QA'},
];

export default function TeacherReportCards() {
  const t      = useTranslations('report_cards');
  const tc     = useTranslations('common');
  const locale = useLocale();
  const [selectedGroup, setSelectedGroup] = useState(GROUPS[0].group);
  const [term,  setTerm]    = useState('');
  const [terms, setTerms]   = useState<{name:string;term_name:string}[]>([]);
  const [members,setMembers] = useState<ClassMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy,   setBusy]    = useState<string|null>(null);
  const [msg,    setMsg]     = useState('');

  useEffect(() => {
    // Fetch academic terms
    fetch('/api/teacher/terms')
      .then(r=>r.json())
      .then(d => { setTerms(d||[]); if(d?.length) setTerm(d[0].name); })
      .catch(()=>{});
  }, []);

  const loadCards = useCallback(() => {
    if (!term) return;
    setLoading(true);
    fetch(`/api/teacher/report-cards?group=${encodeURIComponent(selectedGroup)}&term=${encodeURIComponent(term)}`)
      .then(r=>r.json())
      .then(d => { setMembers(Array.isArray(d)?d:[]); setLoading(false); })
      .catch(()=>setLoading(false));
  }, [selectedGroup, term]);

  useEffect(() => { loadCards(); }, [loadCards]);

  async function generate(studentId: string) {
    setBusy(studentId); setMsg('');
    const r = await fetch('/api/teacher/report-cards/generate', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({student: studentId, academic_term: term}),
    });
    const d = await r.json();
    if (d.name) { setMsg(`Generated: ${d.name}`); loadCards(); }
    else        { setMsg(`Error: ${d.error}`); }
    setBusy(null);
  }

  async function publish(rcName: string) {
    setBusy(rcName); setMsg('');
    const r = await fetch('/api/teacher/report-cards/publish', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({report_card: rcName}),
    });
    const d = await r.json();
    setMsg(d.status === 'published' ? 'Published!' : d.status || d.error);
    loadCards(); setBusy(null);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/teacher`} className="text-emerald-200 hover:text-white text-sm">{tc('back')}</Link>
        <h1 className="font-bold text-lg">{t('title')}</h1>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <select className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
            value={selectedGroup} onChange={e=>setSelectedGroup(e.target.value)}>
            {GROUPS.map(g=><option key={g.group} value={g.group}>{g.label}</option>)}
          </select>
          <select className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
            value={term} onChange={e=>setTerm(e.target.value)}>
            {terms.map(t=><option key={t.name} value={t.name}>{t.term_name}</option>)}
          </select>
        </div>
        {msg && <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">{msg}</div>}
        {loading ? (
          <p className="text-slate-400 text-center py-10">{tc('loading')}</p>
        ) : (
          <div className="space-y-3">
            {members.map(m => (
              <div key={m.student} className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-800">{m.student_name}</p>
                  <p className="text-xs text-slate-400">{m.student}</p>
                </div>
                <div className="flex items-center gap-3">
                  {m.card ? (
                    <>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${m.card.status==='Published'?'bg-green-100 text-green-800':'bg-amber-100 text-amber-800'}`}>
                        {m.card.status}
                      </span>
                      {m.card.overall_grade && (
                        <span className="text-sm font-bold text-blue-700">{m.card.overall_grade} · {m.card.percentage?.toFixed(1)}%</span>
                      )}
                      {m.card.status === 'Draft' && (
                        <button onClick={()=>publish(m.card!.name)}
                          disabled={busy===m.card.name}
                          className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                          {busy===m.card.name ? '…' : t('publish')}
                        </button>
                      )}
                    </>
                  ) : (
                    <button onClick={()=>generate(m.student)}
                      disabled={busy===m.student}
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      {busy===m.student ? '…' : t('generate')}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {members.length === 0 && <p className="text-center text-slate-400 py-10">{t('no_cards')}</p>}
          </div>
        )}
      </main>
    </div>
  );
}
