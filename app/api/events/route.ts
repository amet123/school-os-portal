import {NextResponse} from 'next/server';
import {callFrappe} from '@/lib/frappe';
import {cookies} from 'next/headers';

export async function GET(req: Request) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error:'Not authenticated'},{status:401});
  const {searchParams} = new URL(req.url);
  const year  = searchParams.get('year')  || String(new Date().getFullYear());
  const month = searchParams.get('month') || String(new Date().getMonth()+1);
  try {
    const data = await callFrappe(
      `/api/method/school_os.api.events.get_month_events?year=${year}&month=${month}`,
      {}, sid);
    return NextResponse.json(data.message ?? []);
  } catch(e:any) { return NextResponse.json({error:e.message},{status:500}); }
}
