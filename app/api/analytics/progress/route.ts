import {NextResponse} from 'next/server';
import {callFrappe} from '@/lib/frappe';
import {cookies} from 'next/headers';

export async function GET(req:Request) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error:'Not authenticated'},{status:401});
  const {searchParams} = new URL(req.url);
  const student = searchParams.get('student') || '';
  if (!student) return NextResponse.json({error:'Missing student'},{status:400});
  try {
    const data = await callFrappe(
      `/api/method/school_os.api.analytics.get_student_progress?student=${encodeURIComponent(student)}`,
      {}, sid);
    return NextResponse.json(data.message ?? []);
  } catch(e:any) {
    return NextResponse.json({error:e.message},{status:500});
  }
}
