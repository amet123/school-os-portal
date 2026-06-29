import {NextResponse} from 'next/server';
import {callFrappe} from '@/lib/frappe';
import {cookies} from 'next/headers';
export async function GET(req: Request) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error:'Not authenticated'},{status:401});
  const {searchParams} = new URL(req.url);
  const group = searchParams.get('group') || '';
  try {
    const data = await callFrappe(
      `/api/method/frappe.client.get_list?doctype=Exam&filters=${encodeURIComponent(JSON.stringify({student_group:group}))}&fields=${encodeURIComponent(JSON.stringify(["name","exam_name","course","exam_date","status"]))}&order_by=exam_date+desc`,
      {}, sid);
    return NextResponse.json(data.message ?? []);
  } catch(e:any) { return NextResponse.json({error:e.message},{status:500}); }
}
