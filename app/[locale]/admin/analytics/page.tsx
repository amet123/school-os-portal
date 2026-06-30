'use client';
import {useEffect, useState, useCallback} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

/* ── Types ── */
interface Overview {
  academic_year:string; total_students:number; total_staff:number;
  attendance_pct:number|null; fee_charged:number; fee_collected:number;
  fee_collection_pct:number; open_incidents:number; pending_admits:number; pending_certs:number;
}
interface EnrolmentStats {
  total_students:number;
  by_company:{company:string;count:number}[];
  by_program:{program:string;count:number}[];
  monthly_trend:{month:string;count:number}[];
}
interface AttStats {
  overall_pct:number; total_records:number;
  by_program:{program:string;pct:number}[];
  weekly_trend:{week:string;pct:number}[];
}
interface FeeStats {
  currency:string; total_charged:number; total_collected:number;
  outstanding:number; collection_pct:number;
  by_company:{company:string;charged:number;collected:number;pct:number}[];
  monthly_trend:{month:string;charged:number;collected:number}[];
}
interface ExamStats {
  total_results:number; pass_count:number; pass_pct:number;
  grade_dist:{grade:string;count:number}[];
  top_performers:{student_name:string;avg_pct:number;exams:number}[];
}
interface AdmStats {
  total:number;
  by_status:{status:string;count:number}[];
  funnel:{applied:number;interviewed:number;offered:number;enrolled:number};
}
interface DisciplineStats {
  total:number; open:number;
  by_type:{type:string;count:number}[];
  by_severity:{severity:string;count:number}[];
  monthly_trend:{month:string;count:number}[];
}

/* ── Mini helpers ── */
const fmt = (n:number, cur='') =>
  cur ? `${cur} ${n.toLocaleString('en-IN',{maximumFractionDigits:0})}` : n.toLocaleString('en-IN');
const pct = (n:number|null) => n == null ? '—' : `${n}%`;
const BAR_COLORS = ['bg-indigo-500','bg-violet-500','bg-blue-500','bg-emerald-500',
                    'bg-amber-500','bg-rose-500','bg-teal-500','bg-orange-500'];
const GRADE_COLORS: Record<string,string> = {
  'A+':'bg-emerald-600','A':'bg-emerald-500','B+':'bg-blue-500','B':'bg-blue-400',
  'C':'bg-amber-500','D':'bg-orange-500','F':'bg-rose-600',
};
const SEV_COLORS: Record<string,string> = {
  Minor:'text-amber-700 bg-amber-100', Moderate:'text-orange-700 bg-orange-100',
  Severe:'text-rose-700 bg-rose-100',
};

function BarChart({data, labelKey, valueKey, colors=BAR_COLORS, suffix=''}:{
  data:{[k:string]:any}[]; labelKey:string; valueKey:string; colors?:string[]; suffix?:string;
}) {
  const max = Math.max(...data.map(d=>d[valueKey]), 1);
  return (
    <div className="space-y-2">
      {data.map((d,i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-28 text-right text-slate-500 truncate shrink-0">{d[labelKey]}</span>
          <div className="flex-1 bg-slate-100 rounded-full h-3">
            <div className={`${colors[i%colors.length]} h-3 rounded-full transition-all`}
              style={{width:`${Math.round(d[valueKey]/max*100)}%`}}/>
          </div>
          <span className="w-12 text-slate-700 font-medium">{d[valueKey]}{suffix}</span>
        </div>
      ))}
    </div>
  );
}

function LineSparkline({data, valueKey, label=''}:{data:{[k:string]:any}[]; valueKey:string; label?:string}) {
  if (!data.length) return <p className="text-xs text-slate-400">No data</p>;
  const vals = data.map(d=>Number(d[valueKey])||0);
  const max = Math.max(...vals,1);
  const W = 200, H = 48;
  const pts = vals.map((v,i) => [
    Math.round(i/(vals.length-1||1)*(W-8))+4,
    Math.round(H - (v/max)*(H-8)) + 4,
  ]);
  const d = pts.map((p,i)=>`${i===0?'M':'L'}${p[0]},${p[1]}`).join(' ');
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H+8}`} className="w-full h-10">
        <path d={d} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round"/>
        {pts.map(([x,y],i)=><circle key={i} cx={x} cy={y} r="2" fill="#6366f1"/>)}
      </svg>
      <div className="flex justify-between text-xs text-slate-400 mt-0.5">
        <span>{data[0]?.[label||Object.keys(data[0])[0]]}</span>
        <span>{data[data.length-1]?.[label||Object.keys(data[0])[0]]}</span>
      </div>
    </div>
  );
}

type Tab = 'overview'|'enrolment'|'attendance'|'fees'|'exams'|'admissions'|'discipline';
const TABS: {id:Tab; label:string; icon:string}[] = [
  {id:'overview',   label:'Overview',   icon:'📊'},
  {id:'enrolment',  label:'Enrolment',  icon:'🎓'},
  {id:'attendance', label:'Attendance', icon:'✅'},
  {id:'fees',       label:'Fees',       icon:'💰'},
  {id:'exams',      label:'Exams',      icon:'📝'},
  {id:'admissions', label:'Admissions', icon:'📋'},
  {id:'discipline', label:'Discipline', icon:'⚠️'},
];

export default function AdminAnalytics() {
  const locale = useLocale();
  const [tab, setTab] = useState<Tab>('overview');
  const [overview,    setOverview]    = useState<Overview|null>(null);
  const [enrolment,   setEnrolment]   = useState<EnrolmentStats|null>(null);
  const [attendance,  setAttendance]  = useState<AttStats|null>(null);
  const [fees,        setFees]        = useState<FeeStats|null>(null);
  const [exams,       setExams]       = useState<ExamStats|null>(null);
  const [admissions,  setAdmissions]  = useState<AdmStats|null>(null);
  const [discipline,  setDiscipline]  = useState<DisciplineStats|null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (t: Tab) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/analytics/${t}`);
      const d = await r.json();
      if (t==='overview')    setOverview(d.data);
      if (t==='enrolment')   setEnrolment(d.data);
      if (t==='attendance')  setAttendance(d.data);
      if (t==='fees')        setFees(d.data);
      if (t==='exams')       setExams(d.data);
      if (t==='admissions')  setAdmissions(d.data);
      if (t==='discipline')  setDiscipline(d.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load('overview'); }, []);

  const switchTab = (t: Tab) => {
    setTab(t);
    load(t);
  };

  const Skeleton = () => (
    <div className="space-y-4">
      {[1,2,3].map(i=><div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse"/>)}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-indigo-700 to-violet-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/admin`} className="text-indigo-200 hover:text-white text-sm">← Admin</Link>
        <h1 className="font-bold text-lg flex-1">School Analytics</h1>
        {overview && <span className="text-indigo-200 text-xs">{overview.academic_year}</span>}
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-slate-200 px-4 flex gap-0.5 overflow-x-auto scrollbar-hide">
        {TABS.map(t=>(
          <button key={t.id} onClick={() => switchTab(t.id)}
            className={`flex items-center gap-1 px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
              tab===t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading && <Skeleton/>}
        {!loading && (
          <>
            {/* ── OVERVIEW ── */}
            {tab==='overview' && overview && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    {l:'Students',   v:overview.total_students,   icon:'🎓', c:'indigo'},
                    {l:'Staff',      v:overview.total_staff,      icon:'👥', c:'violet'},
                    {l:'Attendance', v:pct(overview.attendance_pct), icon:'✅', c:'emerald'},
                    {l:'Collection', v:`${overview.fee_collection_pct}%`, icon:'💰', c:'amber'},
                    {l:'Open Issues',v:overview.open_incidents,   icon:'⚠️', c:'rose'},
                  ].map(s=>(
                    <div key={s.l} className={`bg-white rounded-2xl border p-4 shadow-sm border-${s.c}-100`}>
                      <p className="text-xl">{s.icon}</p>
                      <p className={`text-2xl font-bold text-${s.c}-700 mt-1`}>{s.v}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.l}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                    <p className="text-xs text-amber-600 font-medium">Pending Admissions</p>
                    <p className="text-3xl font-bold text-amber-700 mt-1">{overview.pending_admits}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
                    <p className="text-xs text-blue-600 font-medium">Pending Certificates</p>
                    <p className="text-3xl font-bold text-blue-700 mt-1">{overview.pending_certs}</p>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center">
                    <p className="text-xs text-rose-600 font-medium">Open Incidents</p>
                    <p className="text-3xl font-bold text-rose-700 mt-1">{overview.open_incidents}</p>
                  </div>
                </div>

                {/* Fee summary */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Fee Collection Progress</p>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">{fmt(overview.fee_collected)} collected</span>
                    <span className="text-slate-400">of {fmt(overview.fee_charged)}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full">
                    <div className="h-3 bg-emerald-500 rounded-full transition-all"
                      style={{width:`${Math.min(100,overview.fee_collection_pct)}%`}}/>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">{overview.fee_collection_pct}% collected</p>
                </div>
              </div>
            )}

            {/* ── ENROLMENT ── */}
            {tab==='enrolment' && enrolment && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl border p-5 shadow-sm text-center">
                    <p className="text-xs text-slate-400 uppercase">Total Students</p>
                    <p className="text-4xl font-bold text-indigo-700 mt-2">{enrolment.total_students}</p>
                  </div>
                  <div className="bg-white rounded-2xl border p-5 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-3">By School</p>
                    <BarChart data={enrolment.by_company} labelKey="company" valueKey="count"/>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-3">By Programme</p>
                  <BarChart data={enrolment.by_program.slice(0,8)} labelKey="program" valueKey="count"/>
                </div>
                <div className="bg-white rounded-2xl border p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Enrolment Trend (12 months)</p>
                  <LineSparkline data={enrolment.monthly_trend} valueKey="count" label="month"/>
                </div>
              </div>
            )}

            {/* ── ATTENDANCE ── */}
            {tab==='attendance' && attendance && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border p-5 shadow-sm text-center">
                  <p className="text-xs text-slate-400 uppercase">Overall Attendance</p>
                  <p className={`text-5xl font-bold mt-2 ${attendance.overall_pct>=75?'text-emerald-600':'text-rose-600'}`}>
                    {attendance.overall_pct}%
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{attendance.total_records.toLocaleString()} records</p>
                  <div className="mt-3 h-2 bg-slate-100 rounded-full max-w-xs mx-auto">
                    <div className={`h-2 rounded-full ${attendance.overall_pct>=75?'bg-emerald-500':'bg-rose-500'}`}
                      style={{width:`${Math.min(100,attendance.overall_pct)}%`}}/>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Attendance by Programme</p>
                  <BarChart data={attendance.by_program} labelKey="program" valueKey="pct" suffix="%"/>
                </div>
                <div className="bg-white rounded-2xl border p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Weekly Trend</p>
                  <LineSparkline data={attendance.weekly_trend} valueKey="pct" label="week"/>
                </div>
              </div>
            )}

            {/* ── FEES ── */}
            {tab==='fees' && fees && (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {l:'Charged',   v:fmt(fees.total_charged, fees.currency),   c:'slate'},
                    {l:'Collected', v:fmt(fees.total_collected, fees.currency),  c:'emerald'},
                    {l:'Outstanding',v:fmt(fees.outstanding, fees.currency),     c:'amber'},
                  ].map(s=>(
                    <div key={s.l} className={`bg-white rounded-2xl border p-4 shadow-sm text-center border-${s.c}-200`}>
                      <p className={`text-xs text-${s.c}-600 font-medium uppercase`}>{s.l}</p>
                      <p className={`text-base font-bold text-${s.c}-700 mt-1`}>{s.v}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl border p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Collection Rate: {fees.collection_pct}%</p>
                  <div className="h-3 bg-slate-100 rounded-full">
                    <div className="h-3 bg-emerald-500 rounded-full" style={{width:`${Math.min(100,fees.collection_pct)}%`}}/>
                  </div>
                </div>
                {fees.by_company.length > 0 && (
                  <div className="bg-white rounded-2xl border p-5 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-3">By School</p>
                    {fees.by_company.map((c,i)=>(
                      <div key={i} className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-slate-700">{c.company}</span>
                          <span className="text-slate-500">{c.pct}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full">
                          <div className="h-2 bg-indigo-500 rounded-full" style={{width:`${Math.min(100,c.pct)}%`}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="bg-white rounded-2xl border p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Monthly Trend</p>
                  <LineSparkline data={fees.monthly_trend} valueKey="collected" label="month"/>
                </div>
              </div>
            )}

            {/* ── EXAMS ── */}
            {tab==='exams' && exams && (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {l:'Total Results', v:exams.total_results, c:'indigo'},
                    {l:'Pass',          v:exams.pass_count,    c:'emerald'},
                    {l:'Pass Rate',     v:`${exams.pass_pct}%`,c:'blue'},
                  ].map(s=>(
                    <div key={s.l} className="bg-white rounded-2xl border p-4 shadow-sm text-center">
                      <p className="text-xs text-slate-400 uppercase">{s.l}</p>
                      <p className={`text-2xl font-bold text-${s.c}-700 mt-1`}>{s.v}</p>
                    </div>
                  ))}
                </div>
                {exams.grade_dist.length > 0 && (
                  <div className="bg-white rounded-2xl border p-5 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Grade Distribution</p>
                    <div className="flex gap-2 flex-wrap">
                      {exams.grade_dist.map(g=>(
                        <div key={g.grade} className={`${GRADE_COLORS[g.grade]||'bg-slate-400'} text-white rounded-xl px-3 py-2 text-center min-w-[48px]`}>
                          <p className="text-base font-bold">{g.grade}</p>
                          <p className="text-xs opacity-80">{g.count}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {exams.top_performers.length > 0 && (
                  <div className="bg-white rounded-2xl border p-5 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Top Performers</p>
                    {exams.top_performers.map((p,i)=>(
                      <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">{i+1}</span>
                          <span className="text-sm font-medium text-slate-800">{p.student_name}</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-700">{p.avg_pct}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ADMISSIONS ── */}
            {tab==='admissions' && admissions && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-4">Admissions Funnel</p>
                  <div className="space-y-3">
                    {[
                      {l:'Applied',     v:admissions.funnel.applied,     w:100, c:'bg-indigo-500'},
                      {l:'Interviewed', v:admissions.funnel.interviewed, w:admissions.funnel.applied?Math.round(admissions.funnel.interviewed/admissions.funnel.applied*100):0, c:'bg-blue-500'},
                      {l:'Offered',     v:admissions.funnel.offered,     w:admissions.funnel.applied?Math.round(admissions.funnel.offered/admissions.funnel.applied*100):0, c:'bg-violet-500'},
                      {l:'Enrolled',    v:admissions.funnel.enrolled,    w:admissions.funnel.applied?Math.round(admissions.funnel.enrolled/admissions.funnel.applied*100):0, c:'bg-emerald-500'},
                    ].map(step=>(
                      <div key={step.l}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-slate-700">{step.l}</span>
                          <span className="text-slate-500">{step.v}</span>
                        </div>
                        <div className="h-4 bg-slate-100 rounded-full">
                          <div className={`${step.c} h-4 rounded-full transition-all`} style={{width:`${step.w}%`}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {admissions.by_status.length > 0 && (
                  <div className="bg-white rounded-2xl border p-5 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-3">By Status</p>
                    <BarChart data={admissions.by_status} labelKey="status" valueKey="count"/>
                  </div>
                )}
              </div>
            )}

            {/* ── DISCIPLINE ── */}
            {tab==='discipline' && discipline && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl border p-5 text-center shadow-sm">
                    <p className="text-xs text-slate-400 uppercase">Total Incidents</p>
                    <p className="text-3xl font-bold text-slate-700 mt-1">{discipline.total}</p>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center shadow-sm">
                    <p className="text-xs text-rose-600 uppercase">Open</p>
                    <p className="text-3xl font-bold text-rose-700 mt-1">{discipline.open}</p>
                  </div>
                </div>
                {discipline.by_severity.length > 0 && (
                  <div className="bg-white rounded-2xl border p-5 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-3">By Severity</p>
                    <div className="flex gap-3 flex-wrap">
                      {discipline.by_severity.map(s=>(
                        <div key={s.severity} className={`${SEV_COLORS[s.severity]||'bg-slate-100 text-slate-700'} rounded-xl px-4 py-2 text-center`}>
                          <p className="text-xs font-medium">{s.severity}</p>
                          <p className="text-xl font-bold">{s.count}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {discipline.by_type.length > 0 && (
                  <div className="bg-white rounded-2xl border p-5 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-3">By Incident Type</p>
                    <BarChart data={discipline.by_type} labelKey="type" valueKey="count"
                      colors={['bg-rose-400','bg-orange-400','bg-amber-400','bg-red-400','bg-rose-600','bg-orange-600','bg-amber-600','bg-red-600']}/>
                  </div>
                )}
                <div className="bg-white rounded-2xl border p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Monthly Trend</p>
                  <LineSparkline data={discipline.monthly_trend} valueKey="count" label="month"/>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
