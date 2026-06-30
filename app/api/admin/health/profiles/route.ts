import {NextRequest, NextResponse} from 'next/server';
import {callFrappe, getPortalSession, FrappeAuthError} from '@/lib/frappe';
import {cookies} from 'next/headers';
export async function GET(req: NextRequest) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error:'Not authenticated'},{status:401});
  try {
    const session = await getPortalSession(sid);
    if (!session) return NextResponse.json({error:'Session invalid'},{status:401});
    const q = req.nextUrl.searchParams.get('search') ?? '';
    const url = `/api/method/school_os.api.health_api.get_all_health_profiles${q?`?search=${encodeURIComponent(q)}`:''}`;
    const res = await callFrappe(url, {}, sid);
    return NextResponse.json({profiles: res.message ?? []});
  } catch(e) {
    if (e instanceof FrappeAuthError) return NextResponse.json({error:'Auth'},{status:401});
    return NextResponse.json({error:String(e)},{status:500});
  }
}
