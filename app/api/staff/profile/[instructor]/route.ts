import {NextRequest, NextResponse} from 'next/server';
import {callFrappe, getPortalSession, FrappeAuthError} from '@/lib/frappe';
import {cookies} from 'next/headers';
export async function GET(_req: NextRequest, {params}: {params:{instructor:string}}) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error:'Not authenticated'},{status:401});
  try {
    const session = await getPortalSession(sid);
    if (!session) return NextResponse.json({error:'Session invalid'},{status:401});
    const qs = new URLSearchParams({instructor: params.instructor}).toString();
    const res = await callFrappe(`/api/method/school_os.api.directory_api.get_staff_profile?${qs}`, {}, sid);
    return NextResponse.json({profile: (res as any).message ?? {}});
  } catch(e) {
    if (e instanceof FrappeAuthError) return NextResponse.json({error:'Auth'},{status:401});
    return NextResponse.json({error:String(e)},{status:500});
  }
}
