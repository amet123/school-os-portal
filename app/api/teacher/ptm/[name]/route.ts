import {NextRequest, NextResponse} from 'next/server';
import {callFrappe, getPortalSession, FrappeAuthError} from '@/lib/frappe';
import {cookies} from 'next/headers';

export async function POST(req: NextRequest, {params}: {params: {name: string}}) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error:'Not authenticated'},{status:401});
  try {
    const session = await getPortalSession(sid);
    if (!session) return NextResponse.json({error:'Session invalid'},{status:401});
    const {action, teacher_notes} = await req.json() as {action:string; teacher_notes?:string};
    const {name} = params;
    let endpoint: string; let body: Record<string, string>;
    if (action === 'confirm') {
      endpoint = '/api/method/school_os.api.ptm_api.confirm_appointment';
      body = {name};
    } else if (action === 'complete') {
      endpoint = '/api/method/school_os.api.ptm_api.complete_appointment';
      body = {name, teacher_notes: teacher_notes ?? ''};
    } else {
      return NextResponse.json({error:'Unknown action'},{status:400});
    }
    const res = await callFrappe(endpoint, {method:'POST', body: JSON.stringify(body)}, sid);
    return NextResponse.json(res.message ?? {});
  } catch(e) {
    if (e instanceof FrappeAuthError) return NextResponse.json({error:'Auth'},{status:401});
    return NextResponse.json({error:String(e)},{status:500});
  }
}
