import {cookies} from 'next/headers';
import {NextRequest, NextResponse} from 'next/server';
import {getStudentAttendance, getPortalSession, FrappeAuthError} from '@/lib/frappe';

export async function GET(_request: NextRequest) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error: 'Not authenticated'}, {status: 401});
  try {
    const session = await getPortalSession(sid);
    if (!session || session.role !== 'student' || !session.student) {
      return NextResponse.json({error: 'Not a student'}, {status: 403});
    }
    const data = await getStudentAttendance(session.student.name, sid);
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof FrappeAuthError) return NextResponse.json({error: 'Auth'}, {status: 401});
    return NextResponse.json({error: String(e)}, {status: 500});
  }
}
