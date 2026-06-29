'use client';
import {useState, FormEvent} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {useTranslations, useLocale} from 'next-intl';

export default function LoginPage() {
  const t       = useTranslations('login');
  const locale  = useLocale();
  const router  = useRouter();
  const params  = useSearchParams();
  const [usr, setUsr]     = useState('');
  const [pwd, setPwd]     = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: {'Content-Type': 'application/json'},
        body:    JSON.stringify({usr, pwd}),
      });
      const data = await res.json() as {error?: string; session?: {role: string}};
      if (!res.ok || data.error) {
        setError(data.error || t('error'));
        return;
      }
      const role     = data.session?.role ?? 'student';
      const redirect = params.get('redirect') || `/${locale}/${role}`;
      router.push(redirect);
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 to-indigo-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏫</div>
          <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
          <p className="text-blue-200 mt-1">{t('subtitle')}</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('email')}
            </label>
            <input
              type="email" required value={usr} onChange={e => setUsr(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@school.os"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('password')}
            </label>
            <input
              type="password" required value={pwd} onChange={e => setPwd(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                       text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? t('loading') : t('submit')}
          </button>
        </form>
        <p className="text-center text-blue-200 text-xs mt-6 opacity-70">School OS v0.1</p>
      </div>
    </div>
  );
}
