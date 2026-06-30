import {NextResponse} from 'next/server';
import {callFrappe, getPortalSession, FrappeAuthError} from '@/lib/frappe';
import {cookies} from 'next/headers';

export async function GET() {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error: 'Not authenticated'}, {status: 401});
  try {
    const session = await getPortalSession(sid);
    if (!session) return NextResponse.json({error: 'Session invalid'}, {status: 401});

    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();
    const co    = 'Greenfield School India';

    const [dashRes, calRes, pendRes] = await Promise.all([
      callFrappe(
        `/api/method/school_os.api.leave_api.get_leave_dashboard?company=${encodeURIComponent(co)}`,
        {}, sid,
      ),
      callFrappe(
        `/api/method/school_os.api.leave_api.get_leave_calendar?month=${month}&year=${year}&company=${encodeURIComponent(co)}`,
        {}, sid,
      ),
      callFrappe(
        `/api/method/frappe.client.get_list?doctype=Leave%20Application&fields=["name","employee","employee_name","leave_type","from_date","to_date","reason","total_leave_days"]&filters=[["status","=","Open"],["docstatus","!=",2]]&order_by=from_date%20asc&limit=50`,
        {}, sid,
      ),
    ]);

    return NextResponse.json({
      dashboard:    dashRes.message ?? {},
      calendar:     calRes.message  ?? [],
      pending_apps: pendRes.message ?? [],
    });
  } catch (e) {
    if (e instanceof FrappeAuthError) return NextResponse.json({error: 'Auth'}, {status: 401});
    return NextResponse.json({error: String(e)}, {status: 500});
  }
}
