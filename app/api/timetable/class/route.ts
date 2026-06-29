import {NextResponse} from 'next/server';
import {callFrappe} from '@/lib/frappe';
import {cookies} from 'next/headers';

export async function GET(req: Request) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error:'Not authenticated'},{status:401});
  const {searchParams} = new URL(req.url);
  const group    = searchParams.get('group') || '';
  const dateFrom = searchParams.get('from')  || '';
  const dateTo   = searchParams.get('to')    || '';
  try {
    const data = await callFrappe(
      `/api/method/school_os.api.timetable.get_class_timetable?student_group=${encodeURIComponent(group)}&date_from=${dateFrom}&date_to=${dateTo}`,
      {}, sid);
    return NextResponse.json(data.message ?? []);
  } catch(e:any) {
    return NextResponse.json({error:e.message},{status:500});
  }
}
