import {NextResponse} from 'next/server';
import {callFrappe} from '@/lib/frappe';
import {cookies} from 'next/headers';

export async function GET(req: Request) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error:'Not authenticated'},{status:401});
  const {searchParams} = new URL(req.url);
  const student   = searchParams.get('student') || '';
  const week      = searchParams.get('week') || new Date().toISOString().slice(0,10);
  // week_start -> add 6 days for week_end
  const d = new Date(week); d.setDate(d.getDate() + 6);
  const weekEnd = d.toISOString().slice(0, 10);
  try {
    const data = await callFrappe(
      `/api/method/school_os.api.timetable.get_week_timetable?student=${encodeURIComponent(student)}&week_start=${week}`,
      {}, sid);
    return NextResponse.json(data.message ?? {by_day:{}, total_slots:0});
  } catch(e:any) {
    return NextResponse.json({error:e.message},{status:500});
  }
}
