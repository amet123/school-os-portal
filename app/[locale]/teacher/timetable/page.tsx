'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Slot { name: string; course: string; from_time: string; to_time: string; schedule_date: string; room: string; class_schedule_color: string; }

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-100 border-blue-400 text-blue-800',
  green: 'bg-green-100 border-green-400 text-green-800',
  amber: 'bg-amber-100 border-amber-400 text-amber-800',
  teal: 'bg-teal-100 border-teal-400 text-teal-800',
  violet: 'bg-violet-100 border-violet-400 text-violet-800',
  cyan: 'bg-cyan-100 border-cyan-400 text-cyan-800',
};

function getMondayOf(d: Date) {
  const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d); mon.setDate(d.getDate() + diff); return mon;
}
function fmtDate(d: Date) { return d.toISOString().slice(0, 10); }
function fmtTime(t: string) {
  const p = String(t).split(':'); const h = parseInt(p[0]); const m = p[1];
  return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
}
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function TeacherTimetable() {
  const locale = useLocale();
  const [groups, setGroups]     = useState<{name: string}[]>([]);
  const [group, setGroup]       = useState('');
  const [weekStart, setWeekStart] = useState(fmtDate(getMondayOf(new Date())));
  const [slots, setSlots]       = useState<Slot[]>([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    fetch('/api/teacher/groups').then(r => r.json()).then(d => setGroups(d ?? []));
  }, []);

  useEffect(() => {
    if (!group) return;
    loadTimetable();
  }, [group, weekStart]);

  function loadTimetable() {
    if (!group) return;
    setLoading(true);
    const we = fmtDate(new Date(new Date(weekStart).getTime() + 4 * 86400000));
    fetch(`/api/timetable/class?group=${encodeURIComponent(group)}&from=${weekStart}&to=${we}`)
      .then(r => r.json())
      .then(d => { setSlots(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  const byDay = Object.fromEntries(
    Array.from({length: 5}, (_, i) => {
      const d = new Date(weekStart); d.setDate(d.getDate() + i);
      const k = fmtDate(d);
      return [k, slots.filter(s => String(s.schedule_date) === k)];
    })
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-teal-700 to-emerald-800 text-white px-6 py-4 flex items-center gap-3 shadow">
        <Link href={`/${locale}/teacher`} className="text-teal-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg flex-1">Class Timetable</h1>
        <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate()-7); setWeekStart(fmtDate(d)); }}
                className="text-teal-200 hover:text-white px-2">‹</button>
        <span className="text-sm">{new Date(weekStart).toLocaleDateString('en',{month:'short',day:'numeric'})}</span>
        <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate()+7); setWeekStart(fmtDate(d)); }}
                className="text-teal-200 hover:text-white px-2">›</button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-4">
          <select value={group} onChange={e => setGroup(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="">Select student group…</option>
            {groups.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
          </select>
        </div>

        {!group ? (
          <p className="text-center text-slate-400 py-12">Select a group to view timetable.</p>
        ) : loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-16 animate-pulse border border-slate-200" />)}</div>
        ) : (
          <div className="space-y-4">
            {Array.from({length: 5}, (_, i) => {
              const d = new Date(weekStart); d.setDate(d.getDate() + i);
              const k = fmtDate(d); const daySlots = byDay[k] || [];
              return (
                <div key={k}>
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                    {DAYS[i]} — {d.toLocaleDateString('en', {month:'short', day:'numeric'})}
                  </h2>
                  {daySlots.length === 0 ? (
                    <div className="bg-slate-100 rounded-lg px-4 py-2 text-slate-400 text-sm">No class</div>
                  ) : (
                    <div className="space-y-2">
                      {daySlots.map(slot => {
                        const col = COLOR_MAP[slot.class_schedule_color] || COLOR_MAP.blue;
                        return (
                          <div key={slot.name} className={`border-l-4 rounded-lg px-4 py-2 flex justify-between items-center ${col}`}>
                            <p className="font-semibold text-sm">{slot.course}</p>
                            <p className="text-xs">{fmtTime(String(slot.from_time))} – {fmtTime(String(slot.to_time))}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
