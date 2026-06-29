import {NextResponse} from 'next/server';
import {callFrappe} from '@/lib/frappe';
import {cookies} from 'next/headers';

export async function GET(req: Request) {
  const sid = cookies().get('school_sid')?.value;
  if (!sid) return NextResponse.json({error:'Not authenticated'},{status:401});
  const {searchParams} = new URL(req.url);
  const q   = searchParams.get('q')   || '';
  const cat = searchParams.get('cat') || '';
  const avail = searchParams.get('avail') || '0';
  try {
    const data = await callFrappe(
      `/api/method/school_os.api.library.search_books?query=${encodeURIComponent(q)}&category=${encodeURIComponent(cat)}&available_only=${avail}`,
      {}, sid);
    return NextResponse.json(data.message ?? []);
  } catch(e:any) { return NextResponse.json({error:e.message},{status:500}); }
}
