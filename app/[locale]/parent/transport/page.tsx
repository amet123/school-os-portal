'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface StopDetail { stop_name: string; pickup_time: string; drop_time: string; }
interface Vehicle    { registration_number: string; make_model: string; driver_name: string; driver_phone: string; }
interface Transport  {
  assigned: boolean;
  route_name?: string; source?: string; destination?: string;
  stop_name?: string; monthly_fee?: number; student?: string;
  stop_details?: StopDetail; vehicle?: Vehicle;
}

export default function ParentTransport() {
  const locale = useLocale();
  const [data, setData]       = useState<Transport|null>(null);
  const [loading, setLoading] = useState(true);
  const [childName, setName]  = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(d => {
      const s = d.session?.student;
      if (s?.name) setName(s.student_name || s.name);
      fetch(`/api/transport/my${s?.name ? `?student=${encodeURIComponent(s.name)}` : ''}`).then(r=>r.json()).then(td => {
        setData(td); setLoading(false);
      }).catch(() => setLoading(false));
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-violet-700 to-purple-800 text-white px-6 py-4">
        <h1 className="font-bold text-lg">Transport</h1>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6 space-y-3">
        {[1,2,3].map(i=><div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-slate-200"/>)}
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-violet-700 to-purple-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/parent`} className="text-violet-200 hover:text-white text-sm">← Back</Link>
        <div>
          <h1 className="font-bold text-lg">Transport</h1>
          {childName && <p className="text-violet-200 text-xs">{childName}</p>}
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">
        {!data?.assigned ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="text-5xl mb-3">🚌</div>
            <p className="text-slate-500">No transport assigned for this term.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-2xl p-5 shadow-lg">
              <p className="text-violet-200 text-xs font-medium uppercase tracking-wide mb-1">Bus Route</p>
              <p className="font-bold text-xl">{data.route_name}</p>
              <p className="text-violet-200 text-sm mt-1">{data.source} → {data.destination}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3">Boarding Stop</p>
              <span className="bg-violet-100 text-violet-700 text-sm font-bold px-3 py-1.5 rounded-xl">
                {data.stop_name}
              </span>
              {data.stop_details && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-xs text-green-600 font-medium">Pickup</p>
                    <p className="font-bold text-green-800">{String(data.stop_details.pickup_time||'').slice(0,5)}</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3">
                    <p className="text-xs text-orange-600 font-medium">Drop</p>
                    <p className="font-bold text-orange-800">{String(data.stop_details.drop_time||'').slice(0,5)}</p>
                  </div>
                </div>
              )}
              {(data.monthly_fee || 0) > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between">
                  <span className="text-sm text-slate-500">Monthly Transport Fee</span>
                  <span className="font-bold text-slate-800">{Number(data.monthly_fee).toLocaleString()}</span>
                </div>
              )}
            </div>

            {data.vehicle && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3">Bus Details</p>
                <div className="space-y-2 text-sm">
                  <Row label="Vehicle"      value={data.vehicle.registration_number}/>
                  <Row label="Type"         value={data.vehicle.make_model}/>
                  <Row label="Driver"       value={data.vehicle.driver_name}/>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Emergency</span>
                    <a href={`tel:${data.vehicle.driver_phone}`}
                       className="font-semibold text-violet-600">{data.vehicle.driver_phone}</a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Row({label, value}: {label:string; value?:string}) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}
