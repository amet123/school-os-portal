import {NextResponse} from 'next/server';
import {callFrappe, getPortalSession, FrappeAuthError} from '@/lib/frappe';
import {cookies} from 'next/headers';

export async function GET() {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error: 'Not authenticated'}, {status: 401});
  try {
    const session = await getPortalSession(sid);
    if (!session) return NextResponse.json({error: 'Session invalid'}, {status: 401});
    const [balRes, appRes] = await Promise.all([
      callFrappe('/api/method/school_os.api.leave_api.get_my_leave_balance', {}, sid),
      callFrappe('/api/method/school_os.api.leave_api.get_my_leave_applications', {}, sid),
    ]);
    return NextResponse.json({
      balance:      balRes.message ?? [],
      applications: appRes.message ?? [],
    });
  } catch (e) {
    if (e instanceof FrappeAuthError) return NextResponse.json({error: 'Auth'}, {status: 401});
    return NextResponse.json({error: String(e)}, {status: 500});
  }
}
