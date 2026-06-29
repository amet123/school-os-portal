import {NextRequest, NextResponse} from 'next/server';
import {frappeLogin, getPortalSession} from '@/lib/frappe';

export async function POST(request: NextRequest) {
  try {
    const {usr, pwd} = (await request.json()) as {usr: string; pwd: string};

    const sid = await frappeLogin(usr, pwd);
    const session = await getPortalSession(sid);

    if (!session) {
      return NextResponse.json({error: 'Not authorized for portal'}, {status: 403});
    }

    const response = NextResponse.json({success: true, session});
    response.cookies.set('school_sid', sid, {
      httpOnly: true,
      path:     '/',
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 7,
    });
    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json({error: msg}, {status: 401});
  }
}
