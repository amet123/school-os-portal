import {NextResponse} from 'next/server';
import {callFrappe} from '@/lib/frappe';
import {cookies} from 'next/headers';

export async function GET(_req:Request, {params}:{params:{id:string}}) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error:'Not authenticated'},{status:401});
  try {
    const data = await callFrappe(
      `/api/method/school_os.api.report_cards.get_report_card?report_card=${encodeURIComponent(params.id)}`,
      {},
      sid);
    return NextResponse.json(data.message);
  } catch(e:any) {
    return NextResponse.json({error: e.message},{status:500});
  }
}
