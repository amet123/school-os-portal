'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface Dash {
  student: string|null; student_name: string; company: string;
  attendance_pct: number|null; fee_balance: number|null; fee_currency: string;
  upcoming_events: {title:string;event_type:string;start_date:string;color:string}[];
  homework_due:    {title:string;due_date:string;subject:string}[];
  next_class:      {course:string;from_time:string;to_time:string;room:string}|null;
  recent_results:  {exam:string;marks_obtained:number;total_marks:number;grade:string;pct:number}[];
  books_on_loan:   {article:string;transaction_date:string}[];
  pending_certs:   {name:string;certificate_type:string;status:string;requested_on:string}[];
}

const EVENT_COLORS: Record<string,string> = {
  blue:'bg-blue-100 text-blue-700', green:'bg-emerald-100 text-emerald-700',
  red:'bg-rose-100 text-rose-700',  amber:'bg-amber-100 text-amber-700',
  purple:'bg-purple-100 text-purple-700', teal:'bg-teal-100 text-teal-700',
  orange:'bg-orange-100 text-orange-700', rose:'bg-rose-200 text-rose-800',
};
const GRADE_CLR: Record<string,string> = {
  'A+':'text-emerald-700','A':'text-emerald-600','B+':'text-blue-600',
  'B':'text-blue-500','C':'text-amber-600','D':'text-orange-600','F':'text-rose-600',
};

export default function StudentHome() {
  const locale = useLocale();
  const [dash,    setDash]    = useState<Dash|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/dashboard')
      .then(r=>r.json())
      .then(d => { setDash(d.dashboard ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const fmtDate = (d:string) => d?.slice(0,10)||'';
  const fmtPct  = (p:number|null) => p == null ? '—' : `${p}%`;

  if (loading) return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto space-y-3">
        {[1,2,3,4].map(i=><div key={i} className="h-24 bg-white rounded-2xl border animate-pulse"/>)}
      </div>
    </div>
  );

  if (!dash) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-400">Could not load dashboard.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-5 shadow">
        <p className="text-blue-200 text-xs mb-0.5">Welcome back</p>
        <h1 className="text-xl font-bold">{dash.student_name}</h1>
        {dash.company && <p className="text-blue-300 text-xs mt-0.5">{dash.company}</p>}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase">Attendance</p>
            <p className={`text-2xl font-bold mt-1 ${
              dash.attendance_pct == null ? 'text-slate-400'
              : dash.attendance_pct >= 75 ? 'text-emerald-600' : 'text-rose-600'
            }`}>{fmtPct(dash.attendance_pct)}</p>
            {dash.attendance_pct != null && (
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full">
                <div className={`h-1.5 rounded-full ${dash.attendance_pct >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{width:`${Math.min(100,dash.attendance_pct)}%`}}/>
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-400 uppercase">Fee Balance</p>
            {dash.fee_balance == null ? (
              <p className="text-2xl font-bold text-slate-400 mt-1">—</p>
            ) : dash.fee_balance === 0 ? (
              <p className="text-2xl font-bold text-emerald-600 mt-1">Paid ✓</p>
            ) : (
              <>
                <p className="text-xl font-bold text-amber-600 mt-1">
                  {dash.fee_currency} {dash.fee_balance.toLocaleString('en-IN',{minimumFractionDigits:2})}
                </p>
                <Link href={`/${locale}/student/payment`}
                  className="mt-1 text-xs text-indigo-600 font-medium hover:underline">Pay now →</Link>
              </>
            )}
          </div>
        </div>

        {/* Next class */}
        {dash.next_class && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-indigo-500 uppercase mb-1">Next Class Today</p>
            <p className="font-semibold text-indigo-800">{dash.next_class.course}</p>
            <p className="text-xs text-indigo-600 mt-0.5">
              {dash.next_class.from_time} – {dash.next_class.to_time}
              {dash.next_class.room ? ` · ${dash.next_class.room}` : ''}
            </p>
          </div>
        )}

        {/* Homework due */}
        {dash.homework_due.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Homework Due (7 days)</p>
              <Link href={`/${locale}/student/homework`} className="text-xs text-indigo-600 hover:underline">View all</Link>
            </div>
            {dash.homework_due.map((h,i)=>(
              <div key={i} className="bg-white rounded-xl border border-amber-200 p-3 mb-2 flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-sm font-medium text-slate-800">{h.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{h.subject}</p>
                </div>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  Due {fmtDate(h.due_date)}
                </span>
              </div>
            ))}
          </section>
        )}

        {/* Upcoming events */}
        {dash.upcoming_events.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Upcoming Events</p>
              <Link href={`/${locale}/student/calendar`} className="text-xs text-indigo-600 hover:underline">Calendar</Link>
            </div>
            {dash.upcoming_events.map((ev,i)=>(
              <div key={i} className={`rounded-xl px-3 py-2.5 mb-1.5 text-sm font-medium ${EVENT_COLORS[ev.color]??'bg-slate-100 text-slate-700'}`}>
                {ev.title} <span className="font-normal opacity-70 text-xs ml-1">· {fmtDate(ev.start_date)}</span>
              </div>
            ))}
          </section>
        )}

        {/* Recent exam results */}
        {dash.recent_results.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recent Results</p>
              <Link href={`/${locale}/student/exams`} className="text-xs text-indigo-600 hover:underline">All results</Link>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {dash.recent_results.map((r,i)=>(
                <div key={i} className={`flex items-center justify-between px-4 py-3 ${i>0?'border-t border-slate-100':''}`}>
                  <div>
                    <p className="text-sm font-medium text-slate-800 truncate max-w-[200px]">{r.exam}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{r.marks_obtained}/{r.total_marks} marks</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-bold ${GRADE_CLR[r.grade]??'text-slate-700'}`}>{r.grade || `${r.pct}%`}</p>
                    <p className="text-xs text-slate-400">{r.pct}%</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Books on loan */}
        {dash.books_on_loan.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Library — Books on Loan</p>
            {dash.books_on_loan.map((b,i)=>(
              <div key={i} className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 mb-1.5 flex justify-between text-sm shadow-sm">
                <span className="text-slate-800 truncate">{b.article}</span>
                <span className="text-xs text-slate-400 shrink-0 ml-2">Issued {fmtDate(b.transaction_date)}</span>
              </div>
            ))}
          </section>
        )}

        {/* Pending certificates */}
        {dash.pending_certs.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Certificates</p>
              <Link href={`/${locale}/student/certificates`} className="text-xs text-indigo-600 hover:underline">Manage</Link>
            </div>
            {dash.pending_certs.map(c=>(
              <div key={c.name} className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 mb-1.5 flex justify-between text-sm shadow-sm">
                <span className="text-slate-800">{c.certificate_type}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  c.status==='Issued' ? 'bg-emerald-100 text-emerald-700'
                  : c.status==='Approved' ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700'
                }`}>{c.status}</span>
              </div>
            ))}
          </section>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {[
            {href:'timetable', icon:'📅', label:'Timetable'},
            {href:'report-card', icon:'📊', label:'Report Card'},
            {href:'attendance', icon:'✅', label:'Attendance'},
            {href:'library', icon:'📚', label:'Library'},
            {href:'exams', icon:'📝', label:'Exams'},
            {href:'certificates', icon:'🎓', label:'Certificates'},
          ].map(l=>(
            <Link key={l.href} href={`/${locale}/student/${l.href}`}
              className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-sm hover:shadow-md hover:border-indigo-300 transition">
              <p className="text-xl mb-1">{l.icon}</p>
              <p className="text-xs font-medium text-slate-600">{l.label}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
