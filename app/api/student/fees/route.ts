import {cookies} from 'next/headers';
import {NextRequest, NextResponse} from 'next/server';
import {getFeeStatement, getPortalSession, FrappeAuthError} from '@/lib/frappe';

export async function GET(_request: NextRequest) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error: 'Not authenticated'}, {status: 401});
  try {
    const session = await getPortalSession(sid);
    if (!session || session.role !== 'student' || !session.student) {
      return NextResponse.json({error: 'Not a student'}, {status: 403});
    }
    const data = await getFeeStatement(session.student.name, sid);
    return NextResponse.json(data ?? {entries: [], balance: 0});
  } catch (e) {
    if (e instanceof FrappeAuthError) return NextResponse.json({error: 'Auth'}, {status: 401});
    return NextResponse.json({error: String(e)}, {status: 500});
  }
}
