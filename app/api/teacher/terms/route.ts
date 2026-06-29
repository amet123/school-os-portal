import {NextResponse} from 'next/server';
import {callFrappe} from '@/lib/frappe';
import {cookies} from 'next/headers';

export async function GET() {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json([]);
  try {
    const data = await callFrappe(
      '/api/resource/Academic Term?fields=["name","term_name","academic_year"]&limit=20&order_by=name asc',
      {},
      sid);
    return NextResponse.json((data as any).data ?? data.message ?? []);
  } catch {
    return NextResponse.json([]);
  }
}
