'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Ann { name: string; title: string; body: string; priority: string; published_on: string; }

export default function TeacherAnnouncements() {
  const locale = useLocale();
  const [anns, setAnns]       = useState<Ann[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setForm]   = useState(false);
  const [form, setForm2]      = useState({title:'',body:'',audience:'All',priority:'Normal'});
  const [saving, setSaving]   = useState(false);
  const [expanded, setExp]    = useState<string|null>(null);

  useEffect(() => { loadAnns(); }, []);
  function loadAnns() {
    fetch('/api/announcements?audience=All').then(r=>r.json()).then(d => {
      setAnns(Array.isArray(d)?d:[]); setLoading(false);
    });
  }

  function saveAnn() {
    if (!form.title || !form.body) return;
    setSaving(true);
    fetch('/api/announcements/create', {method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(form)
    }).then(r=>r.json()).then(() => {
      setForm(false); setForm2({title:'',body:'',audience:'All',priority:'Normal'});
      setSaving(false); loadAnns();
    }).catch(() => setSaving(false));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-teal-700 to-emerald-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/teacher`} className="text-teal-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg flex-1">Announcements</h1>
        <button onClick={() => setForm(!showForm)}
                className="text-sm bg-white text-teal-700 font-semibold px-3 py-1.5 rounded-lg">
          + New
        </button>
      </header>

      {showForm && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="font-semibold text-slate-700 mb-3">New Announcement</p>
            <input value={form.title} onChange={e=>setForm2({...form,title:e.target.value})}
                   placeholder="Title" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-teal-400"/>
            <textarea value={form.body} onChange={e=>setForm2({...form,body:e.target.value})}
                      placeholder="Message body…" rows={4}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400"/>
            <div className="flex gap-2 mb-3">
              <select value={form.audience} onChange={e=>setForm2({...form,audience:e.target.value})}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                {['All','Students','Parents','Teachers','Class'].map(o=><option key={o}>{o}</option>)}
              </select>
              <select value={form.priority} onChange={e=>setForm2({...form,priority:e.target.value})}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                {['Normal','Important','Urgent'].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={saveAnn} disabled={saving}
                      className="bg-teal-600 text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50">
                {saving?'Saving…':'Publish'}
              </button>
              <button onClick={() => setForm(false)} className="text-sm text-slate-400">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="bg-white rounded-xl h-16 animate-pulse border border-slate-200"/>)}</div>
        ) : anns.map(a => (
          <div key={a.name} className="bg-white rounded-xl border border-slate-200 mb-2 shadow-sm">
            <div className="p-4 cursor-pointer flex items-start gap-3"
                 onClick={() => setExp(expanded===a.name?null:a.name)}>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm">{a.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{a.published_on} · {a.priority}</p>
              </div>
              <span className="text-slate-400 text-sm">{expanded===a.name?'▲':'▼'}</span>
            </div>
            {expanded===a.name && (
              <div className="px-4 pb-4 text-sm text-slate-700 whitespace-pre-line border-t border-slate-100 pt-3">
                {a.body}
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
