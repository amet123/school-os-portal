import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {getPortalSession} from '@/lib/frappe';

export async function GET() {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error: 'Not authenticated'}, {status: 401});

  const session = await getPortalSession(sid);
  if (!session) return NextResponse.json({error: 'Session invalid'}, {status: 401});

  return NextResponse.json({session});
}
