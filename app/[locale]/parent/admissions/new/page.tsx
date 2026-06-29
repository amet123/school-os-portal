'use client';
import {useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

const STEPS = ['Child Details', 'Academic Preferences', 'Guardian & Submit'];

export default function NewAdmission() {
  const locale = useLocale();
  const [step, setStep]     = useState(0);
  const [done, setDone]     = useState(false);
  const [appId, setAppId]   = useState('');
  const [error, setError]   = useState('');
  const [submitting, setSub] = useState(false);

  const [form, setForm] = useState({
    applicant_name: '', dob: '', gender: '', nationality: '',
    program: '', academic_year: '', company: '',
    guardian_name: '', relationship: '', guardian_phone: '',
  });

  const set = (k: string, v: string) => setForm(f => ({...f, [k]: v}));

  async function submit() {
    setSub(true); setError('');
    try {
      const r = await fetch('/api/admissions', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Submission failed');
      setAppId(d.name);
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSub(false);
    }
  }

  if (done) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center shadow">
        <p className="text-5xl mb-4">🎉</p>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Application Submitted!</h2>
        <p className="text-slate-500 text-sm mb-1">Your application ID is:</p>
        <p className="text-lg font-mono font-bold text-emerald-700 mb-5">{appId}</p>
        <Link href={`/${locale}/parent/admissions`}
          className="inline-block bg-emerald-600 text-white text-sm font-semibold px-6 py-2 rounded-full hover:bg-emerald-700 transition">
          Track Status
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-6 py-4 shadow">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <Link href={`/${locale}/parent/admissions`} className="text-emerald-200 hover:text-white text-sm">← Back</Link>
          <h1 className="font-bold text-lg">New Application</h1>
        </div>
      </header>

      {/* Step indicator */}
      <div className="max-w-xl mx-auto px-4 pt-6">
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i === step ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? 'bg-emerald-400' : 'bg-slate-200'}`}/>}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 pb-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">

          {step === 0 && <>
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Child Details</h2>
            <Field label="Full Name *" value={form.applicant_name} onChange={v => set('applicant_name', v)}/>
            <Field label="Date of Birth *" type="date" value={form.dob} onChange={v => set('dob', v)}/>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Gender *</label>
              <select value={form.gender} onChange={e => set('gender', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Select…</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <Field label="Nationality" value={form.nationality} onChange={v => set('nationality', v)}/>
          </>}

          {step === 1 && <>
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Academic Preferences</h2>
            <Field label="Company / School *" value={form.company} onChange={v => set('company', v)} placeholder="e.g. Greenfield School India"/>
            <Field label="Program *" value={form.program} onChange={v => set('program', v)} placeholder="e.g. Class I"/>
            <Field label="Academic Year *" value={form.academic_year} onChange={v => set('academic_year', v)} placeholder="e.g. 2026-27"/>
          </>}

          {step === 2 && <>
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Guardian Information</h2>
            <Field label="Guardian Name *" value={form.guardian_name} onChange={v => set('guardian_name', v)}/>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Relationship</label>
              <select value={form.relationship} onChange={e => set('relationship', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Select…</option>
                <option>Father</option><option>Mother</option><option>Guardian</option>
              </select>
            </div>
            <Field label="Phone" value={form.guardian_phone} onChange={v => set('guardian_phone', v)} placeholder="+91 …"/>
            {error && <p className="text-rose-500 text-sm">{error}</p>}
          </>}

          <div className="flex justify-between pt-2">
            {step > 0
              ? <button onClick={() => setStep(s => s - 1)}
                  className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg border border-slate-200">
                  ← Back
                </button>
              : <div/>}
            {step < STEPS.length - 1
              ? <button onClick={() => setStep(s => s + 1)}
                  className="bg-emerald-600 text-white text-sm font-semibold px-6 py-2 rounded-full hover:bg-emerald-700 transition">
                  Next →
                </button>
              : <button onClick={submit} disabled={submitting}
                  className="bg-emerald-600 text-white text-sm font-semibold px-6 py-2 rounded-full hover:bg-emerald-700 disabled:opacity-50 transition">
                  {submitting ? 'Submitting…' : 'Submit Application'}
                </button>}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({label, value, onChange, type='text', placeholder=''}:
  {label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string}) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"/>
    </div>
  );
}
