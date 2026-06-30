import {NextResponse} from 'next/server';
import {callFrappe, getPortalSession, FrappeAuthError} from '@/lib/frappe';
import {cookies} from 'next/headers';
export async function POST(req: Request) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error:'Not authenticated'},{status:401});
  try {
    const session = await getPortalSession(sid);
    if (!session) return NextResponse.json({error:'Session invalid'},{status:401});
    const {session_name, message} = await req.json();
    const params = new URLSearchParams({session_name, message});
    const res = await callFrappe(
      `/api/method/school_os.api.tutor_api.chat?${params}`,
      {method:'POST'}, sid
    );
    return NextResponse.json({data: (res as any).message ?? {}});
  } catch(e) {
    if (e instanceof FrappeAuthError) return NextResponse.json({error:'Auth'},{status:401});
    return NextResponse.json({error:String(e)},{status:500});
  }
}
