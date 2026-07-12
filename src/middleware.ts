import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { FEATURES } from '@/config/features.config';

const SESSION_COOKIE = 'zaya_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin cookie gate (Edge — role checked in AdminGuard / requireAdmin)
  if (pathname.startsWith('/admin')) {
    const isPublic =
      pathname === '/admin/login' || pathname.startsWith('/admin/login/');
    const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
    if (!isPublic && !hasSession) {
      const login = new URL('/admin/login', request.url);
      login.searchParams.set('redirect', pathname);
      return NextResponse.redirect(login);
    }
  }

  for (const feature of Object.values(FEATURES)) {
    if (!feature.enabled && feature.routes) {
      const isRouteDisabled = feature.routes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`),
      );

      if (isRouteDisabled) {
        return NextResponse.rewrite(new URL('/_feature-disabled', request.url), {
          status: 404,
        });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
