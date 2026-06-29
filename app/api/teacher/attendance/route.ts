import {cookies} from 'next/headers';
import {NextRequest, NextResponse} from 'next/server';
import {markAttendance, getPortalSession, FrappeAuthError} from '@/lib/frappe';

export async function POST(request: NextRequest) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error: 'Not authenticated'}, {status: 401});
  try {
    const session = await getPortalSession(sid);
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({error: 'Not a teacher'}, {status: 403});
    }
    const {student_group, date, attendance} = await request.json() as {
      student_group: string; date: string;
      attendance: {student: string; status: string}[];
    };
    const result = await markAttendance(student_group, date, attendance, sid);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof FrappeAuthError) return NextResponse.json({error: 'Auth'}, {status: 401});
    return NextResponse.json({error: String(e)}, {status: 500});
  }
}
