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
    const qs = new URLSearchParams({name: body.name, data: JSON.stringify(body.data)}).toString();
    const res = await callFrappe(`/api/method/school_os.api.calendar_api.update_event?${qs}`, {}, sid);
    return NextResponse.json({updated: (res as any).message?.name});
  } catch(e) {
    if (e instanceof FrappeAuthError) return NextResponse.json({error:'Auth'},{status:401});
    return NextResponse.json({error:String(e)},{status:500});
  }
}
