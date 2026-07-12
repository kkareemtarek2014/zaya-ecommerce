import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { FEATURES } from '@/config/features.config';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Iterate through features to see if any disabled feature blocks this route
  for (const feature of Object.values(FEATURES)) {
    if (!feature.enabled && feature.routes) {
      // Check if the current pathname starts with any of the feature's routes
      const isRouteDisabled = feature.routes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      );

      if (isRouteDisabled) {
        // Render the app's not-found UI with a real 404 status. Rewriting to a
        // non-existent path triggers not-found.tsx; the init forces the status.
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
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
