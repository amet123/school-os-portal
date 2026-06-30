'use client';
import {useEffect, useState} from 'react';
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

interface Event {
  name:string; title:string; event_type:string;
  start_date:string; end_date:string; all_day:number;
  location:string; audience:string; color:string;
}

interface Props { backHref: string; backLabel: string; apiPath: string; heading: string; gradientFrom: string; gradientTo: string; }

export default function CalendarView({backHref, backLabel, apiPath, heading, gradientFrom, gradientTo}: Props) {
  const locale = useLocale();
  const [events,  setEvents]  = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('');

  useEffect(() => {
    fetch(apiPath).then(r=>r.json())
      .then(d => { setEvents(d.events ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [apiPath]);

  const fmtDate = (d:string) => d?.slice(0,10)||'';
  const fmtRange = (s:string,e:string) => s===e ? fmtDate(s) : `${fmtDate(s)} – ${fmtDate(e)}`;

  const filtered = filter ? events.filter(e=>e.event_type===filter) : events;
  const types    = Array.from(new Set(events.map(e=>e.event_type)));

  // Group by month
  const grouped: Record<string, Event[]> = {};
  for (const ev of filtered) {
    const m = ev.start_date.slice(0,7);
    (grouped[m] = grouped[m]||[]).push(ev);
  }
  const months = Object.keys(grouped).sort();

  const monthLabel = (m: string) => new Date(m+'-01').toLocaleDateString('en-GB',{month:'long',year:'numeric'});

  return (
    <div className="min-h-screen bg-slate-50">
      <header className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white px-6 py-4 flex items-center gap-4 shadow`}>
        <Link href={`/${locale}${backHref}`} className="text-white/70 hover:text-white text-sm">{backLabel}</Link>
        <h1 className="font-bold text-lg flex-1">{heading}</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Filter */}
        <select value={filter} onChange={e=>setFilter(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
          <option value="">All Events</option>
          {types.map(t=><option key={t} value={t}>{ICONS[t]||'📅'} {t}</option>)}
        </select>

        {loading ? (
          <>{[1,2,3].map(i=><div key={i} className="h-16 bg-white rounded-2xl border animate-pulse mb-2"/>)}</>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border p-10 text-center">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-slate-400 text-sm">No events to show.</p>
          </div>
        ) : months.map(m=>(
          <section key={m}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{monthLabel(m)}</p>
            {grouped[m].map(ev=>{
              const clr = EVENT_COLORS[ev.color] ?? EVENT_COLORS.blue;
              return (
                <div key={ev.name} className={`rounded-xl border p-3 mb-2 ${clr.bg}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${clr.text}`}>{ICONS[ev.event_type]||'📅'} {ev.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {fmtRange(ev.start_date, ev.end_date)}
                        {ev.location ? ` · ${ev.location}` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{ev.audience}</span>
                  </div>
                </div>
              );
            })}
          </section>
        ))}
      </main>
    </div>
  );
}
