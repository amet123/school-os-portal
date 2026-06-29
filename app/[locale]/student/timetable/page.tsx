'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Slot {
  name: string; course: string; from_time: string; to_time: string;
  schedule_date: string; room: string; class_schedule_color: string;
}
interface WeekData { week_start: string; week_end: string; by_day: Record<string, Slot[]>; total_slots: number; }

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-100 border-blue-400 text-blue-800',
  green: 'bg-green-100 border-green-400 text-green-800',
  amber: 'bg-amber-100 border-amber-400 text-amber-800',
  teal: 'bg-teal-100 border-teal-400 text-teal-800',
  violet: 'bg-violet-100 border-violet-400 text-violet-800',
  cyan: 'bg-cyan-100 border-cyan-400 text-cyan-800',
  red: 'bg-red-100 border-red-400 text-red-800',
  orange: 'bg-orange-100 border-orange-400 text-orange-800',
  pink: 'bg-pink-100 border-pink-400 text-pink-800',
  purple: 'bg-purple-100 border-purple-400 text-purple-800',
};

function getMondayOf(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d); mon.setDate(d.getDate() + diff); return mon;
}
function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function fmtTime(t: string) {
  const parts = t.split(':');
  const h = parseInt(parts[0]); const m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m} ${ampm}`;
}
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function StudentTimetable() {
  const locale = useLocale();
  const [student, setStudent] = useState('');
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [weekStart, setWeekStart] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mon = getMondayOf(new Date());
    const ws  = fmtDate(mon);
    setWeekStart(ws);
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      const s = d.session?.student?.name;
      if (!s) return;
      setStudent(s);
      loadWeek(s, ws);
    });
  }, []);

  function loadWeek(s: string, ws: string) {
    setLoading(true);
    fetch(`/api/timetable/student?student=${encodeURIComponent(s)}&week=${ws}`)
      .then(r => r.json())
      .then(d => { setWeekData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }

  function prevWeek() {
    if (!student || !weekStart) return;
    const d = new Date(weekStart); d.setDate(d.getDate() - 7);
    const ws = fmtDate(d); setWeekStart(ws); loadWeek(student, ws);
  }
  function nextWeek() {
    if (!student || !weekStart) return;
    const d = new Date(weekStart); d.setDate(d.getDate() + 7);
    const ws = fmtDate(d); setWeekStart(ws); loadWeek(student, ws);
  }

  const allDays = weekStart
    ? Array.from({length: 5}, (_, i) => {
        const d = new Date(weekStart); d.setDate(d.getDate() + i);
        return fmtDate(d);
      })
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/student`} className="text-blue-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg flex-1">My Timetable</h1>
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="text-blue-200 hover:text-white px-2">‹</button>
          <span className="text-sm">{weekStart && new Date(weekStart).toLocaleDateString('en', {month:'short',day:'numeric'})}</span>
          <button onClick={nextWeek} className="text-blue-200 hover:text-white px-2">›</button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-20 animate-pulse border border-slate-200" />)}
          </div>
        ) : !weekData || weekData.total_slots === 0 ? (
          <p className="text-center text-slate-400 py-16">No classes scheduled this week.</p>
        ) : (
          <div className="space-y-4">
            {allDays.map((day, i) => {
              const slots = weekData.by_day[day] || [];
              return (
                <div key={day}>
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                    {DAYS[i]} — {new Date(day + 'T00:00:00').toLocaleDateString('en', {month:'short', day:'numeric'})}
                  </h2>
                  {slots.length === 0 ? (
                    <div className="bg-slate-100 rounded-lg px-4 py-3 text-slate-400 text-sm">No class</div>
                  ) : (
                    <div className="space-y-2">
                      {slots.map(slot => {
                        const col = COLOR_MAP[slot.class_schedule_color] || COLOR_MAP.blue;
                        return (
                          <div key={slot.name}
                               className={`border-l-4 rounded-lg px-4 py-3 flex items-center justify-between ${col}`}>
                            <div>
                              <p className="font-semibold text-sm">{slot.course}</p>
                              {slot.room && <p className="text-xs opacity-70 mt-0.5">{slot.room}</p>}
                            </div>
                            <p className="text-xs font-medium">
                              {fmtTime(String(slot.from_time))} – {fmtTime(String(slot.to_time))}
                            </p>
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
