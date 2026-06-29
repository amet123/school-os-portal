import createMiddleware from 'next-intl/middleware';
import {NextRequest, NextResponse} from 'next/server';

const LOCALES  = ['en', 'hi', 'ar'] as const;
const PROTECTED = ['/student', '/teacher', '/parent'];

const intlMiddleware = createMiddleware({
  locales:       LOCALES,
  defaultLocale: 'en',
  localePrefix:  'always',
});

export default function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;

  // Skip Next.js internals and API routes
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Auth guard: check school_sid cookie for protected paths
  const localePrefix = LOCALES.find(l => pathname.startsWith(`/${l}/`) || pathname === `/${l}`);
  const withoutLocale = localePrefix ? pathname.slice(localePrefix.length + 1) : pathname;
  const isProtected   = PROTECTED.some(p => ('/' + withoutLocale).startsWith(p));

  if (isProtected && !request.cookies.get('school_sid')?.value) {
    const locale = localePrefix || 'en';
    const url    = new URL(`/${locale}/login`, request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!_next|.*\..*).*)'],
};
