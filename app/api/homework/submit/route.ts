import {NextResponse} from 'next/server';
import {callFrappe} from '@/lib/frappe';
import {cookies} from 'next/headers';

export async function POST(req: Request) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error:'Not authenticated'},{status:401});
  const {homework, student, attachment} = await req.json();
  try {
    const data = await callFrappe(
      `/api/method/school_os.api.homework_api.submit_homework?homework=${encodeURIComponent(homework)}&student=${encodeURIComponent(student)}&attachment=${encodeURIComponent(attachment||'')}`,
      {}, sid);
    return NextResponse.json(data.message);
  } catch(e:any) {
    return NextResponse.json({error:e.message},{status:500});
  }
}
