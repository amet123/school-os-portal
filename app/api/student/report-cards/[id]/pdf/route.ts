import {NextResponse} from 'next/server';
import {callFrappe} from '@/lib/frappe';
import {cookies} from 'next/headers';

export async function GET(_req:Request, {params}:{params:{id:string}}) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error:'Not authenticated'},{status:401});
  try {
    const data = await callFrappe(
      `/api/method/school_os.api.report_cards.download_pdf?report_card=${encodeURIComponent(params.id)}`,
      {},
      sid);
    const {filename, content} = data.message as {filename:string; content:string};
    const buf = Buffer.from(content, 'base64');
    return new NextResponse(buf, {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    });
  } catch(e:any) {
    return NextResponse.json({error: e.message},{status:500});
  }
}
