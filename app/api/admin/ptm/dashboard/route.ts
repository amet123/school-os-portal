import {NextRequest, NextResponse} from 'next/server';
import {callFrappe, getPortalSession, FrappeAuthError} from '@/lib/frappe';
import {cookies} from 'next/headers';

export async function GET(req: NextRequest) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error:'Not authenticated'},{status:401});
  try {
    const session = await getPortalSession(sid);
    if (!session) return NextResponse.json({error:'Session invalid'},{status:401});
    const s = req.nextUrl.searchParams.get('session') ?? '';
    const url = `/api/method/school_os.api.ptm_api.get_ptm_dashboard${s ? `?session=${encodeURIComponent(s)}` : ''}`;
    const res = await callFrappe(url, {}, sid);
    return NextResponse.json(res.message ?? {});
  } catch(e) {
    if (e instanceof FrappeAuthError) return NextResponse.json({error:'Auth'},{status:401});
    return NextResponse.json({error:String(e)},{status:500});
  }
}
