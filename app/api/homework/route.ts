import {NextResponse} from 'next/server';
import {callFrappe} from '@/lib/frappe';
import {cookies} from 'next/headers';

export async function GET(req: Request) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error:'Not authenticated'},{status:401});
  const {searchParams} = new URL(req.url);
  const student = searchParams.get('student') || '';
  const term    = searchParams.get('term')    || '';
  try {
    const data = await callFrappe(
      `/api/method/school_os.api.homework_api.get_my_homework?student=${encodeURIComponent(student)}&academic_term=${encodeURIComponent(term)}`,
      {}, sid);
    return NextResponse.json(data.message ?? []);
  } catch(e:any) {
    return NextResponse.json({error:e.message},{status:500});
  }
}
