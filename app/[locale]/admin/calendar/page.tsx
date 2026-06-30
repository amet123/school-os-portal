'use client';
import {useEffect, useState, useCallback} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

const EVENT_COLORS: Record<string, {bg:string; text:string}> = {
  blue:   {bg:'bg-blue-100',   text:'text-blue-700'},
  green:  {bg:'bg-emerald-100',text:'text-emerald-700'},
  red:    {bg:'bg-rose-100',   text:'text-rose-700'},
  amber:  {bg:'bg-amber-100',  text:'text-amber-700'},
  purple: {bg:'bg-purple-100', text:'text-purple-700'},
  rose:   {bg:'bg-rose-200',   text:'text-rose-800'},
  teal:   {bg:'bg-teal-100',   text:'text-teal-700'},
  orange: {bg:'bg-orange-100', text:'text-orange-700'},
};
const ICONS: Record<string,string> = {
  'Holiday':'🏖️','Examination':'📝','Sports Day':'🏅','Parent Evening':'👨‍👩‍👧',
  'Field Trip':'🚌','Cultural Event':'🎭','Staff Development':'📚',
  'School Closure':'🔒','Term Start':'🔔','Term End':'🎓','Other':'📅',
};
const TYPES = ['Holiday','Examination','Sports Day','Parent Evening','Field Trip',
  'Cultural Event','Staff Development','School Closure','Term Start','Term End','Other'];
const COLORS = ['blue','green','red','amber','purple','rose','teal','orange'];
const AUDIENCES = ['All','Students','Parents','Staff','Students & Parents','Students & Staff'];

interface Event {
  name:string; title:string; event_type:string;
  start_date:string; end_date:string; all_day:number;
  location:string; audience:string; color:string;
}
interface Dash {
  total:number; upcoming:number; holidays:number; exams:number;
  by_type:{type:string;count:number}[];
  next_events:Event[];
}

const EMPTY_FORM = {title:'',event_type:'Other',start_date:'',end_date:'',
  all_day:1,location:'',audience:'All',color:'blue',description:''};

export default function AdminCalendar() {
  const locale = useLocale();
  const [dash,    setDash]    = useState<Dash|null>(null);
  const [events,  setEvents]  = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<'dashboard'|'events'|'create'>('dashboard');
  const [form,    setForm]    = useState<any>({...EMPTY_FORM});
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');
  const [editEvt, setEditEvt] = useState<Event|null>(null);
  const [typeFilter, setTypeFilter] = useState('');

  const loadDash = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/calendar/dashboard').then(r=>r.json())
      .then(d => { setDash(d.dashboard ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const loadEvents = useCallback(() => {
    setLoading(true);
    const q = typeFilter ? `?event_type=${encodeURIComponent(typeFilter)}` : '';
    fetch(`/api/admin/calendar/events${q}`).then(r=>r.json())
      .then(d => { setEvents(d.events ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [typeFilter]);

  useEffect(() => { loadDash(); }, [loadDash]);

  const switchTab = (t: typeof tab) => {
    setTab(t); setMsg('');
    if (t==='dashboard') loadDash();
    if (t==='events')    loadEvents();
    if (t==='create')    { setForm({...EMPTY_FORM}); setEditEvt(null); }
  };

  const handleSave = async () => {
    if (!form.title || !form.start_date) { setMsg('Title and Start Date are required.'); return; }
    setSaving(true); setMsg('');
    try {
      const url  = editEvt ? '/api/admin/calendar/update' : '/api/admin/calendar/create';
      const body = editEvt ? {name: editEvt.name, data: form} : {data: form};
      const r    = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
      const d    = await r.json();
      if (d.name || d.updated) {
        setMsg(editEvt ? 'Event updated!' : 'Event created!');
        setForm({...EMPTY_FORM}); setEditEvt(null);
        setTimeout(() => { setMsg(''); switchTab('events'); }, 800);
      } else {
        setMsg(d.error || 'Error saving event.');
      }
    } catch(e) { setMsg(String(e)); }
    setSaving(false);
  };

  const handleDelete = async (name: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch('/api/admin/calendar/delete', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name})});
    loadEvents();
  };

  const startEdit = (ev: Event) => {
    setForm({
      title: ev.title, event_type: ev.event_type, start_date: ev.start_date,
      end_date: ev.end_date === ev.start_date ? '' : ev.end_date,
      all_day: ev.all_day, location: ev.location, audience: ev.audience, color: ev.color,
    });
    setEditEvt(ev);
    setTab('create');
  };

  const fmtDate = (d:string) => d?.slice(0,10)||'';
  const fmtRange = (s:string,e:string) => s === e ? fmtDate(s) : `${fmtDate(s)} → ${fmtDate(e)}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-violet-700 to-purple-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/admin`} className="text-violet-200 hover:text-white text-sm">← Admin</Link>
        <h1 className="font-bold text-lg flex-1">Academic Calendar</h1>
        <button onClick={() => switchTab('create')}
          className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition">
          + New Event
        </button>
      </header>

      <div className="bg-white border-b border-slate-200 px-6 flex gap-1">
        {(['dashboard','events','create'] as const).map(t=>(
          <button key={t} onClick={() => switchTab(t)}
            className={`px-4 py-3 text-sm font-medium capitalize transition border-b-2 ${
              tab===t ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {t === 'create' ? (editEvt ? 'Edit Event' : 'Create') : t}
          </button>
        ))}
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (loading ? (
          <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i=><div key={i} className="h-20 bg-white rounded-2xl border animate-pulse"/>)}</div>
        ) : dash && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {l:'Total Events', v:dash.total,    c:'violet'},
                {l:'Upcoming',     v:dash.upcoming,  c:'blue'},
                {l:'Holidays',     v:dash.holidays,  c:'amber'},
                {l:'Exams',        v:dash.exams,     c:'rose'},
              ].map(s=>(
                <div key={s.l} className={`rounded-2xl border p-4 text-center bg-${s.c}-50 border-${s.c}-200`}>
                  <p className={`text-xs font-medium text-${s.c}-600 uppercase`}>{s.l}</p>
                  <p className={`text-2xl font-bold text-${s.c}-700 mt-1`}>{s.v}</p>
                </div>
              ))}
            </div>

            {dash.by_type.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Events by Type</p>
                {dash.by_type.map(t=>(
                  <div key={t.type} className="flex items-center gap-2 mb-2">
                    <span className="text-sm w-40 truncate">{ICONS[t.type]||'📅'} {t.type}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div className="bg-violet-500 h-2 rounded-full"
                        style={{width:`${Math.min(100,(t.count/Math.max(...dash.by_type.map(x=>x.count)))*100)}%`}}/>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 w-6 text-right">{t.count}</span>
                  </div>
                ))}
              </div>
            )}

            <section>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Upcoming Events</p>
              {dash.next_events.map(ev => {
                const clr = EVENT_COLORS[ev.color] ?? EVENT_COLORS.blue;
                return (
                  <div key={ev.name} className={`rounded-xl border p-3 mb-2 flex items-center justify-between ${clr.bg}`}>
                    <div>
                      <p className={`text-sm font-semibold ${clr.text}`}>{ICONS[ev.event_type]||'📅'} {ev.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{fmtRange(ev.start_date, ev.end_date)} {ev.location ? `· ${ev.location}` : ''}</p>
                    </div>
                    <span className="text-xs text-slate-500">{ev.audience}</span>
                  </div>
                );
              })}
            </section>
          </>
        ))}

        {/* ── EVENTS LIST ── */}
        {tab === 'events' && (
          <>
            <div className="flex gap-2">
              <select value={typeFilter} onChange={e=>{setTypeFilter(e.target.value);}}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-violet-400">
                <option value="">All Types</option>
                {TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
              <button onClick={loadEvents}
                className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">Filter</button>
            </div>
            {loading ? (
              <>{[1,2,3].map(i=><div key={i} className="h-16 bg-white rounded-2xl border animate-pulse mb-2"/>)}</>
            ) : events.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No events found.</p>
            ) : events.map(ev => {
              const clr = EVENT_COLORS[ev.color] ?? EVENT_COLORS.blue;
              return (
                <div key={ev.name} className={`rounded-xl border p-3 mb-2 flex items-center justify-between ${clr.bg}`}>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${clr.text}`}>{ICONS[ev.event_type]||'📅'} {ev.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{fmtRange(ev.start_date, ev.end_date)} · {ev.audience}</p>
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <button onClick={() => startEdit(ev)}
                      className="text-xs px-2 py-1 rounded-lg bg-white/70 hover:bg-white text-slate-600 border border-slate-200 transition">Edit</button>
                    <button onClick={() => handleDelete(ev.name, ev.title)}
                      className="text-xs px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200 transition">Del</button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ── CREATE / EDIT ── */}
        {tab === 'create' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-slate-800">{editEvt ? 'Edit Event' : 'New School Event'}</h2>
            {msg && <p className={`text-sm rounded-xl px-4 py-2 ${msg.includes('!')?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700'}`}>{msg}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {l:'Title *',   k:'title',      type:'text'},
                {l:'Location',  k:'location',   type:'text'},
                {l:'Start Date *', k:'start_date', type:'date'},
                {l:'End Date',  k:'end_date',   type:'date'},
              ].map(f=>(
                <div key={f.k}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{f.l}</label>
                  <input type={f.type} value={form[f.k]||''} onChange={e=>setForm({...form,[f.k]:e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"/>
                </div>
              ))}
              {[
                {l:'Event Type', k:'event_type', opts:TYPES},
                {l:'Audience',   k:'audience',   opts:AUDIENCES},
                {l:'Color',      k:'color',      opts:COLORS},
              ].map(f=>(
                <div key={f.k}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{f.l}</label>
                  <select value={form[f.k]||''} onChange={e=>setForm({...form,[f.k]:e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                    {f.opts.map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={!!form.all_day} onChange={e=>setForm({...form,all_day:e.target.checked?1:0})}
                  className="rounded"/>
                All Day Event
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
              <textarea value={form.description||''} onChange={e=>setForm({...form,description:e.target.value})}
                rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"/>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition">
                {saving ? 'Saving…' : editEvt ? 'Save Changes' : 'Create Event'}
              </button>
              <button onClick={() => { setForm({...EMPTY_FORM}); setEditEvt(null); setMsg(''); }}
                className="border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-slate-50 transition">
                Reset
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
