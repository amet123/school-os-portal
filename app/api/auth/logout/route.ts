import {NextRequest, NextResponse} from 'next/server';

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({success: true});
  response.cookies.set('school_sid', '', {httpOnly: true, path: '/', maxAge: 0});
  return response;
}
