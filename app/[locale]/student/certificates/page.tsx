'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

const CERT_TYPES = [
  'Transfer Certificate','Bonafide Certificate','Character Certificate',
  'Migration Certificate','Provisional Certificate',
];

interface Cert {
  name:string; certificate_type:string; status:string;
  requested_on:string; issued_on:string; purpose:string; remarks:string;
}

const STATUS_CLR: Record<string,string> = {
  'Pending':  'bg-amber-100 text-amber-700',
  'Approved': 'bg-blue-100 text-blue-700',
  'Issued':   'bg-emerald-100 text-emerald-700',
  'Rejected': 'bg-rose-100 text-rose-700',
};

export default function StudentCertificates() {
  const locale = useLocale();
  const [certs,   setCerts]   = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState({certificate_type: CERT_TYPES[0], purpose: ''});
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/student/certificates').then(r=>r.json())
      .then(d => { setCerts(d.certificates ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRequest = async () => {
    if (!form.certificate_type) { setMsg('Select certificate type.'); return; }
    setSaving(true); setMsg('');
    try {
      const r = await fetch('/api/student/certificates/request', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d.name) {
        setMsg('Certificate requested!');
        setShowForm(false);
        setForm({certificate_type: CERT_TYPES[0], purpose: ''});
        load();
      } else {
        setMsg(d.error || 'Error submitting request.');
      }
    } catch(e) { setMsg(String(e)); }
    setSaving(false);
  };

  const fmtDate = (d:string) => d?.slice(0,10)||'—';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/student`} className="text-blue-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg flex-1">Certificates</h1>
        <button onClick={() => { setShowForm(!showForm); setMsg(''); }}
          className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition">
          {showForm ? 'Cancel' : '+ Request'}
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {msg && <p className={`text-sm rounded-xl px-4 py-2 ${msg.includes('!')?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700'}`}>{msg}</p>}

        {showForm && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="font-semibold text-slate-800">Request Certificate</h2>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Certificate Type</label>
              <select value={form.certificate_type} onChange={e=>setForm({...form,certificate_type:e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                {CERT_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Purpose (optional)</label>
              <textarea value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})} rows={2}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="e.g. bank account opening, scholarship…"/>
            </div>
            <button onClick={handleRequest} disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition w-full">
              {saving ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        )}

        {loading ? (
          <>{[1,2,3].map(i=><div key={i} className="h-20 bg-white rounded-2xl border animate-pulse"/>)}</>
        ) : certs.length === 0 ? (
          <div className="bg-white rounded-2xl border p-10 text-center">
            <p className="text-3xl mb-2">🎓</p>
            <p className="text-slate-400 text-sm">No certificate requests yet.</p>
            <button onClick={() => setShowForm(true)}
              className="mt-3 text-indigo-600 text-sm font-medium hover:underline">Request one →</button>
          </div>
        ) : certs.map(c=>(
          <div key={c.name} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-800">{c.certificate_type}</p>
                {c.purpose && <p className="text-xs text-slate-500 mt-0.5">{c.purpose}</p>}
                <p className="text-xs text-slate-400 mt-1">Requested: {fmtDate(c.requested_on)}</p>
                {c.issued_on && <p className="text-xs text-emerald-600 mt-0.5">Issued: {fmtDate(c.issued_on)}</p>}
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CLR[c.status]??'bg-slate-100 text-slate-600'}`}>
                {c.status}
              </span>
            </div>
            {c.remarks && <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-1.5">{c.remarks}</p>}
          </div>
        ))}
      </main>
    </div>
  );
}
