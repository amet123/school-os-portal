import {cookies} from 'next/headers';
import {NextRequest, NextResponse} from 'next/server';
import {getRoster, getPortalSession, FrappeAuthError} from '@/lib/frappe';

export async function GET(request: NextRequest) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error: 'Not authenticated'}, {status: 401});
  const sg = request.nextUrl.searchParams.get('group') ?? '';
  try {
    const session = await getPortalSession(sid);
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({error: 'Not a teacher'}, {status: 403});
    }
    const data = await getRoster(sg, sid);
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof FrappeAuthError) return NextResponse.json({error: 'Auth'}, {status: 401});
    return NextResponse.json({error: String(e)}, {status: 500});
  }
}
