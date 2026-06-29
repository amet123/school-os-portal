import {NextResponse} from 'next/server';
import {callFrappe} from '@/lib/frappe';
import {cookies} from 'next/headers';

export async function GET(req: Request) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error:'Not authenticated'},{status:401});
  const {searchParams} = new URL(req.url);
  const group = searchParams.get('group') || '';
  const term  = searchParams.get('term')  || '';
  try {
    const data = await callFrappe(
      `/api/method/school_os.api.homework_api.get_class_homework?student_group=${encodeURIComponent(group)}&academic_term=${encodeURIComponent(term)}`,
      {}, sid);
    return NextResponse.json(data.message ?? []);
  } catch(e:any) {
    return NextResponse.json({error:e.message},{status:500});
  }
}
