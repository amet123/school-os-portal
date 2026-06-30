import {NextRequest, NextResponse} from 'next/server';
import {callFrappe, getPortalSession, FrappeAuthError} from '@/lib/frappe';
import {cookies} from 'next/headers';

export async function POST(
  request: NextRequest,
  {params}: {params: {name: string}},
) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error: 'Not authenticated'}, {status: 401});
  try {
    const session = await getPortalSession(sid);
    if (!session) return NextResponse.json({error: 'Session invalid'}, {status: 401});
    const {action, reason} = await request.json() as {action: string; reason?: string};
    const {name} = params;

    let endpoint: string;
    let body: Record<string, string>;

    if (action === 'approve') {
      endpoint = '/api/method/school_os.api.concession_api.approve_concession';
      body     = {name};
    } else if (action === 'reject') {
      endpoint = '/api/method/school_os.api.concession_api.reject_concession';
      body     = {name, reason: reason ?? ''};
    } else {
      return NextResponse.json({error: 'Unknown action'}, {status: 400});
    }

    const data = await callFrappe(
      endpoint,
      {method: 'POST', body: JSON.stringify(body)},
      sid,
    );
    return NextResponse.json(data.message ?? {});
  } catch (e) {
    if (e instanceof FrappeAuthError) return NextResponse.json({error: 'Auth'}, {status: 401});
    return NextResponse.json({error: String(e)}, {status: 500});
  }
}
