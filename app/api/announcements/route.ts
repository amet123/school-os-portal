import {NextResponse} from 'next/server';
import {callFrappe} from '@/lib/frappe';
import {cookies} from 'next/headers';
export async function GET(req: Request) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error:'Not authenticated'},{status:401});
  const {searchParams} = new URL(req.url);
  const audience = searchParams.get('audience') || 'All';
  const group    = searchParams.get('group')    || '';
  try {
    const data = await callFrappe(
      `/api/method/school_os.api.announcement_api.get_announcements?audience=${encodeURIComponent(audience)}&student_group=${encodeURIComponent(group)}`,
      {}, sid);
    return NextResponse.json(data.message ?? []);
  } catch(e:any) { return NextResponse.json({error:e.message},{status:500}); }
}
