import {NextResponse} from 'next/server';
import {callFrappe} from '@/lib/frappe';
import {cookies} from 'next/headers';
export async function GET(req: Request) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error:'Not authenticated'},{status:401});
  const {searchParams} = new URL(req.url);
  const route = searchParams.get('route') || '';
  const ay    = searchParams.get('academic_year') || '';
  const term  = searchParams.get('academic_term') || '';
  try {
    const qs = new URLSearchParams({route});
    if (ay)   qs.set('academic_year', ay);
    if (term) qs.set('academic_term', term);
    const data = await callFrappe(
      `/api/method/school_os.api.transport_api.get_transport_roster?${qs}`,
      {}, sid);
    return NextResponse.json(data.message ?? []);
  } catch(e:any) { return NextResponse.json({error:e.message},{status:500}); }
}
