import {NextRequest, NextResponse} from 'next/server';
import {callFrappe, getPortalSession, FrappeAuthError} from '@/lib/frappe';
import {cookies} from 'next/headers';

export async function POST(request: NextRequest) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error: 'Not authenticated'}, {status: 401});
  try {
    const session = await getPortalSession(sid);
    if (!session) return NextResponse.json({error: 'Session invalid'}, {status: 401});

    const body = await request.json();
    const {student, company, academic_year, academic_term, fee_entry_names} = body;

    if (!student || !company) {
      return NextResponse.json({error: 'student and company required'}, {status: 400});
    }

    const qs = new URLSearchParams({student, company});
    if (academic_year)   qs.set('academic_year', academic_year);
    if (academic_term)   qs.set('academic_term', academic_term);
    if (fee_entry_names) qs.set('fee_entry_names', JSON.stringify(fee_entry_names));

    const data = await callFrappe(
      `/api/method/school_os.api.payment_api.initiate_payment?${qs}`,
      {method: 'POST'}, sid,
    );
    return NextResponse.json(data.message ?? {});
  } catch (e) {
    if (e instanceof FrappeAuthError) return NextResponse.json({error: 'Auth'}, {status: 401});
    return NextResponse.json({error: String(e)}, {status: 500});
  }
}
