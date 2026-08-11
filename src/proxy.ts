import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory token bucket rate limiter
const rateLimitMap = new Map<string, { tokens: number; lastRefilled: number }>();
const BUCKET_CAPACITY = 30;
const REFILL_RATE_MS = 2000; // Refill 1 token every 2 seconds

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow unrestricted access to public paths
  const publicPaths = ['/login', '/api/auth', '/_next', '/favicon.ico', '/manifest.json', '/sw.js', '/janata-bank-logo', '/api/ping'];
  const isPublic = publicPaths.some(p => pathname.startsWith(p));

  // Authentication Check for non-public routes
  if (!isPublic) {
    const token = request.cookies.get('next-auth.session-token') || request.cookies.get('__Secure-next-auth.session-token');
    if (!token && pathname !== '/login') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Rate Limiting for API routes
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '127.0.0.1';
    const now = Date.now();
    const limit = rateLimitMap.get(ip) || { tokens: BUCKET_CAPACITY, lastRefilled: now };

    const msPassed = now - limit.lastRefilled;
    const tokensToRefill = Math.floor(msPassed / REFILL_RATE_MS);

    if (tokensToRefill > 0) {
      limit.tokens = Math.min(BUCKET_CAPACITY, limit.tokens + tokensToRefill);
      limit.lastRefilled = limit.lastRefilled + tokensToRefill * REFILL_RATE_MS;
    }

    if (limit.tokens <= 0) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'too_many_requests', 
          message: 'অতিরিক্ত রিকোয়েস্ট পাঠানো হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।' 
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
        }
      );
    }

    limit.tokens -= 1;
    rateLimitMap.set(ip, limit);
  }

  const response = NextResponse.next();

  // Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|janata-bank-logo).*)',
  ],
};
