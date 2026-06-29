import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {getStudentGroups, getPortalSession} from '@/lib/frappe';

export async function GET() {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error: 'Not authenticated'}, {status: 401});
  try {
    const session = await getPortalSession(sid);
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({error: 'Not a teacher'}, {status: 403});
    }
    const groups = await getStudentGroups(sid);
    return NextResponse.json(groups);
  } catch (e) {
    return NextResponse.json({error: String(e)}, {status: 500});
  }
}
