import {NextResponse} from 'next/server';
import {callFrappe} from '@/lib/frappe';
import {cookies} from 'next/headers';

export async function POST(req:Request) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error:'Not authenticated'},{status:401});
  const {student, academic_term} = await req.json();
  try {
    const data = await callFrappe(
      `/api/method/school_os.api.report_cards.generate_report_card?student=${encodeURIComponent(student)}&academic_term=${encodeURIComponent(academic_term)}`,
      {},
      sid);
    return NextResponse.json({name: data.message});
  } catch(e:any) {
    return NextResponse.json({error: e.message},{status:500});
  }
}
