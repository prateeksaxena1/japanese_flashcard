import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect these routes and all their sub-routes
  const protectedPaths = ['/dashboard', '/study', '/progress'];
  
  // Check if the current path starts with any of the protected paths
  const isProtectedRoute = protectedPaths.some((path) => 
    pathname.startsWith(path)
  );

  if (isProtectedRoute) {
    const refreshToken = request.cookies.get('refreshToken');

    if (!refreshToken) {
      // Redirect unauthenticated users to the login page
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      // Optionally preserve the original URL to redirect back after login
      url.searchParams.set('callbackUrl', encodeURI(pathname));
      return NextResponse.redirect(url);
    }
  }

  // Prevent authenticated users from visiting login/register pages
  const authPaths = ['/login', '/register'];
  const isAuthRoute = authPaths.some((path) => pathname.startsWith(path));

  if (isAuthRoute) {
    const refreshToken = request.cookies.get('refreshToken');
    if (refreshToken) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
