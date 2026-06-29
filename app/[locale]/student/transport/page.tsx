'use client';
import {useEffect, useState} from 'react';
import {useLocale} from 'next-intl';
import Link from 'next/link';

interface StopDetail { stop_name: string; pickup_time: string; drop_time: string; monthly_fee: number; }
interface Vehicle    { registration_number: string; make_model: string; capacity: number; driver_name: string; driver_phone: string; }
interface Transport  {
  assigned: boolean;
  route?: string; route_name?: string; source?: string; destination?: string;
  stop_name?: string; monthly_fee?: number; academic_year?: string;
  stop_details?: StopDetail; vehicle?: Vehicle;
}

export default function StudentTransport() {
  const locale = useLocale();
  const [data, setData]       = useState<Transport|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/transport/my').then(r=>r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4">
        <h1 className="font-bold text-lg">Transport</h1>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6 space-y-3">
        {[1,2,3].map(i=><div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-slate-200"/>)}
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href={`/${locale}/student`} className="text-blue-200 hover:text-white text-sm">← Back</Link>
        <h1 className="font-bold text-lg">My Transport</h1>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">
        {!data?.assigned ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="text-5xl mb-3">🚌</div>
            <p className="text-slate-500">No transport assigned for this term.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Route card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-5 shadow-lg">
              <p className="text-blue-200 text-xs font-medium uppercase tracking-wide mb-1">Bus Route</p>
              <p className="font-bold text-xl">{data.route_name}</p>
              <p className="text-blue-200 text-sm mt-1">{data.source} → {data.destination}</p>
            </div>

            {/* Stop details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3">Your Stop</p>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-blue-100 text-blue-700 text-sm font-bold px-3 py-1.5 rounded-xl">
                  {data.stop_name}
                </span>
              </div>
              {data.stop_details && (
                <div className="grid grid-cols-2 gap-3">
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
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-sm text-slate-500">Monthly Fee</span>
                  <span className="font-bold text-slate-800">
                    {Number(data.monthly_fee).toLocaleString('en-IN', {minimumFractionDigits:0})}
                  </span>
                </div>
              )}
            </div>

            {/* Vehicle info */}
            {data.vehicle && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3">Bus Details</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle</span>
                    <span className="font-semibold text-slate-800">{data.vehicle.registration_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type</span>
                    <span className="font-medium text-slate-700">{data.vehicle.make_model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Driver</span>
                    <span className="font-medium text-slate-700">{data.vehicle.driver_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Driver Phone</span>
                    <a href={`tel:${data.vehicle.driver_phone}`}
                       className="font-medium text-blue-600">{data.vehicle.driver_phone}</a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Capacity</span>
                    <span className="font-medium text-slate-700">{data.vehicle.capacity} seats</span>
                  </div>
                </div>
              </div>
            )}

            <p className="text-center text-xs text-slate-400 pt-2">
              Academic Year: {data.academic_year}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
