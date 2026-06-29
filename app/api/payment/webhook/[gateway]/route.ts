import {NextRequest, NextResponse} from 'next/server';

const FRAPPE_URL = process.env.FRAPPE_URL ?? 'http://localhost:8092';

export async function POST(
  request: NextRequest,
  {params}: {params: {gateway: string}},
) {
  const {gateway} = params;
  const body      = await request.arrayBuffer();

  // Forward known signature headers to Frappe
  const sigHeaders: Record<string, string> = {};
  const SIG_HEADERS = [
    'x-razorpay-signature', 'x-dibsy-signature', 'x-webhook-signature',
  ];
  for (const h of SIG_HEADERS) {
    const val = request.headers.get(h);
    if (val) sigHeaders[h] = val;
  }

  const res = await fetch(
    `${FRAPPE_URL}/api/method/school_os.api.payment_api.handle_webhook?gateway=${encodeURIComponent(gateway)}`,
    {method: 'POST', headers: {'Content-Type': 'application/json', ...sigHeaders}, body},
  );

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data.message ?? data, {status: res.ok ? 200 : 500});
}
