'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface CertRow {
  name:string; student:string; student_name:string; certificate_type:string;
  status:string; requested_on:string; issued_on:string; purpose:string;
}
interface Dash {
  total:number; pending:number; issued:number;
  by_type:{type:string;count:number}[];
  recent: CertRow[];
}
const STATUS_CLR: Record<string,string> = {
  'Pending':'bg-amber-100 text-amber-700','Approved':'bg-blue-100 text-blue-700',
  'Issued':'bg-emerald-100 text-emerald-700','Rejected':'bg-rose-100 text-rose-700',
};

export default function AdminCertificates() {
  const locale = useLocale();
  const [dash,     setDash]    = useState<Dash|null>(null);
  const [certs,    setCerts]   = useState<CertRow[]>([]);
  const [loading,  setLoading] = useState(true);
  const [tab,      setTab]     = useState<'dashboard'|'all'>('dashboard');
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState<string|null>(null);

  const loadDash = () => {
    setLoading(true);
    fetch('/api/admin/certificates/dashboard').then(r=>r.json())
      .then(d => { setDash(d.dashboard ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  };
  const loadAll = (sf='') => {
    setLoading(true);
    fetch(`/api/admin/certificates${sf?`?status=${encodeURIComponent(sf)}`:''}`).then(r=>r.json())
      .then(d => { setCerts(d.certificates ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadDash(); }, []);

  const switchTab = (t: typeof tab) => {
    setTab(t);
    if (t==='dashboard') loadDash();
    if (t==='all') loadAll(statusFilter);
  };

  const updateStatus = async (name: string, status: string) => {
    setUpdating(name);
    await fetch('/api/admin/certificates/update', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({name, status}),
    });
    setUpdating(null);
    if (tab==='all') loadAll(statusFilter);
    else loadDash();
  };

  const fmtDate = (d:string) => d?.slice(0,10)||'—';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-indigo-700 to-violet-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/admin`} className="text-indigo-200 hover:text-white text-sm">← Admin</Link>
        <h1 className="font-bold text-lg flex-1">Certificates</h1>
      </header>

      <div className="bg-white border-b border-slate-200 px-6 flex gap-1">
        {(['dashboard','all'] as const).map(t=>(
          <button key={t} onClick={() => switchTab(t)}
            className={`px-4 py-3 text-sm font-medium capitalize transition border-b-2 ${
              tab===t ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {t === 'all' ? 'All Requests' : 'Dashboard'}
          </button>
        ))}
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {tab === 'dashboard' && (loading ? (
          <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i=><div key={i} className="h-20 bg-white rounded-2xl border animate-pulse"/>)}</div>
        ) : dash && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[
                {l:'Total',   v:dash.total,   c:'indigo'},
                {l:'Pending', v:dash.pending, c:'amber'},
                {l:'Issued',  v:dash.issued,  c:'emerald'},
              ].map(s=>(
                <div key={s.l} className={`rounded-2xl border p-4 text-center bg-${s.c}-50 border-${s.c}-200`}>
                  <p className={`text-xs font-medium text-${s.c}-600 uppercase`}>{s.l}</p>
                  <p className={`text-2xl font-bold text-${s.c}-700 mt-1`}>{s.v}</p>
                </div>
              ))}
            </div>
            <section>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Recent Requests</p>
              {dash.recent.map(c=>(
                <div key={c.name} className="bg-white rounded-xl border border-slate-200 p-3 mb-2 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{c.student_name} — {c.certificate_type}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Requested {fmtDate(c.requested_on)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CLR[c.status]??''}`}>{c.status}</span>
                    {c.status === 'Pending' && (
                      <button onClick={() => updateStatus(c.name, 'Approved')} disabled={updating===c.name}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded-lg transition disabled:opacity-50">
                        Approve
                      </button>
                    )}
                    {c.status === 'Approved' && (
                      <button onClick={() => updateStatus(c.name, 'Issued')} disabled={updating===c.name}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded-lg transition disabled:opacity-50">
                        Issue
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </section>
          </>
        ))}

        {tab === 'all' && (
          <>
            <div className="flex gap-2">
              <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="">All Statuses</option>
                {['Pending','Approved','Issued','Rejected'].map(s=><option key={s}>{s}</option>)}
              </select>
              <button onClick={() => loadAll(statusFilter)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">Filter</button>
            </div>
            {loading ? (
              <>{[1,2,3].map(i=><div key={i} className="h-16 bg-white rounded-2xl border animate-pulse mb-2"/>)}</>
            ) : certs.map(c=>(
              <div key={c.name} className="bg-white rounded-xl border border-slate-200 p-3 mb-2 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-sm font-medium text-slate-800">{c.student_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.certificate_type} · {fmtDate(c.requested_on)}</p>
                  {c.purpose && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{c.purpose}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CLR[c.status]??''}`}>{c.status}</span>
                  {c.status === 'Pending' && (
                    <button onClick={() => updateStatus(c.name, 'Approved')} disabled={updating===c.name}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded-lg transition disabled:opacity-50">Approve</button>
                  )}
                  {c.status === 'Approved' && (
                    <button onClick={() => updateStatus(c.name, 'Issued')} disabled={updating===c.name}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded-lg transition disabled:opacity-50">Issue</button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
