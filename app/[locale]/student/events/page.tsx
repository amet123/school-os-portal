'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Event { name: string; title: string; event_type: string; start_date: string; end_date: string; color: string; }

const TYPE_ICON: Record<string, string> = {
  Holiday: '🏖️', Exam: '📝', Meeting: '👥',
  Sports: '⚽', Cultural: '🎭', Other: '📌',
};
const COLOR_MAP: Record<string, string> = {
  blue:   'border-l-blue-500   bg-blue-50',
  green:  'border-l-green-500  bg-green-50',
  red:    'border-l-red-500    bg-red-50',
  amber:  'border-l-amber-500  bg-amber-50',
  violet: 'border-l-violet-500 bg-violet-50',
  teal:   'border-l-teal-500   bg-teal-50',
};

export default function StudentEvents() {
  const locale  = useLocale();
  const [events, setEvents]   = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear]       = useState(new Date().getFullYear());
  const [month, setMonth]     = useState(new Date().getMonth() + 1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/events?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(d => { setEvents(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [year, month]);

  function prevMonth() { if (month === 1) { setYear(y=>y-1); setMonth(12); } else setMonth(m=>m-1); }
  function nextMonth() { if (month === 12) { setYear(y=>y+1); setMonth(1); } else setMonth(m=>m+1); }

  const MON = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/student`} className="text-blue-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg flex-1">School Events</h1>
        <div className="flex items-center gap-2 text-sm">
          <button onClick={prevMonth} className="text-blue-200 hover:text-white px-2">‹</button>
          <span>{MON[month]} {year}</span>
          <button onClick={nextMonth} className="text-blue-200 hover:text-white px-2">›</button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="bg-white rounded-xl h-16 animate-pulse border border-slate-200"/>)}</div>
        ) : events.length === 0 ? (
          <p className="text-center text-slate-400 py-16">No events in {MON[month]} {year}.</p>
        ) : (
          <div className="space-y-3">
            {events.map(ev => {
              const col = COLOR_MAP[ev.color] || COLOR_MAP.blue;
              const icon = TYPE_ICON[ev.event_type] || TYPE_ICON.Other;
              const sameDay = ev.end_date === ev.start_date || !ev.end_date;
              return (
                <div key={ev.name} className={`border-l-4 rounded-xl p-4 flex gap-3 ${col}`}>
                  <span className="text-2xl flex-shrink-0">{icon}</span>
                  <div>
                    <p className="font-semibold text-slate-800">{ev.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(ev.start_date + 'T00:00:00').toLocaleDateString('en',{month:'short',day:'numeric'})}
                      {!sameDay && ` – ${new Date(ev.end_date+'T00:00:00').toLocaleDateString('en',{month:'short',day:'numeric'})}`}
                      {' · '}{ev.event_type}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
