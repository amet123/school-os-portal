import {NextRequest, NextResponse} from 'next/server';
import {callFrappe, getPortalSession, FrappeAuthError} from '@/lib/frappe';
import {cookies} from 'next/headers';

export async function POST(
  request: NextRequest,
  {params}: {params: {appId: string}},
) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error: 'Not authenticated'}, {status: 401});
  try {
    const session = await getPortalSession(sid);
    if (!session) return NextResponse.json({error: 'Session invalid'}, {status: 401});
    const body   = await request.json();
    const {action, ...rest} = body;
    const methodMap: Record<string, string> = {
      move:   'school_os.api.admissions_api.move_application',
      offer:  'school_os.api.admissions_api.send_offer',
      enroll: 'school_os.api.admissions_api.enroll_from_offer',
    };
    const method = methodMap[action];
    if (!method) return NextResponse.json({error: `Unknown action: ${action}`}, {status: 400});

    // Map params to the right argument names per action
    let callParams: Record<string, string> = {};
    if (action === 'move')   callParams = {application_id: params.appId, new_status: rest.new_status};
    if (action === 'offer')  callParams = {application_id: params.appId, ...(rest.acceptance_deadline ? {acceptance_deadline: rest.acceptance_deadline} : {})};
    if (action === 'enroll') callParams = {offer_id: rest.offer_id ?? params.appId};

    const data = await callFrappe(`/api/method/${method}`, callParams, sid);
    return NextResponse.json(data.message ?? {});
  } catch (e) {
    if (e instanceof FrappeAuthError) return NextResponse.json({error: 'Auth'}, {status: 401});
    return NextResponse.json({error: String(e)}, {status: 500});
  }
}
