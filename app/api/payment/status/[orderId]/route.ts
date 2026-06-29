import {NextRequest, NextResponse} from 'next/server';
import {callFrappe, getPortalSession, FrappeAuthError} from '@/lib/frappe';
import {cookies} from 'next/headers';

export async function GET(
  _request: NextRequest,
  {params}: {params: {orderId: string}},
) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error: 'Not authenticated'}, {status: 401});
  try {
    const session = await getPortalSession(sid);
    if (!session) return NextResponse.json({error: 'Session invalid'}, {status: 401});

    const {orderId} = params;
    const data = await callFrappe(
      `/api/method/school_os.api.payment_api.get_payment_status?order_name=${encodeURIComponent(orderId)}`,
      {}, sid,
    );
    return NextResponse.json(data.message ?? {});
  } catch (e) {
    if (e instanceof FrappeAuthError) return NextResponse.json({error: 'Auth'}, {status: 401});
    return NextResponse.json({error: String(e)}, {status: 500});
  }
}
