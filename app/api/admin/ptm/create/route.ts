import {NextRequest, NextResponse} from 'next/server';
import {callFrappe, getPortalSession, FrappeAuthError} from '@/lib/frappe';
import {cookies} from 'next/headers';

export async function POST(req: NextRequest) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error:'Not authenticated'},{status:401});
  try {
    const session = await getPortalSession(sid);
    if (!session) return NextResponse.json({error:'Session invalid'},{status:401});
    const body = await req.json();
    const res = await callFrappe(
      '/api/method/school_os.api.ptm_api.create_ptm_session',
      {method:'POST', body: JSON.stringify({data: JSON.stringify(body)})},
      sid,
    );
    return NextResponse.json(res.message ?? {});
  } catch(e) {
    if (e instanceof FrappeAuthError) return NextResponse.json({error:'Auth'},{status:401});
    return NextResponse.json({error:String(e)},{status:500});
  }
}
