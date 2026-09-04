import { NextRequest, NextResponse } from 'next/server';

const publicPaths = ['/login', '/privacy'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('accessToken')?.value;

  const isPublicPath = publicPaths.includes(pathname);

  // Redirect to login if not authenticated and trying to access protected route
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to dashboard if authenticated and trying to access login
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
