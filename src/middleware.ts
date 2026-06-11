import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory token bucket rate limiter
const rateLimitMap = new Map<string, { tokens: number; lastRefilled: number }>();

const BUCKET_CAPACITY = 10;
const REFILL_RATE_MS = 6000; // Refill 1 token every 6 seconds (10 tokens per minute)

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Rate limit POST logins and any document generation endpoints
  const isAuthPost = pathname === '/api/auth' && request.method === 'POST';
  const isDocGen = pathname.startsWith('/api/documents/generate-');

  if (isAuthPost || isDocGen) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const cleanIp = ip.split(',')[0].trim();

    const now = Date.now();
    const limit = rateLimitMap.get(cleanIp) || { tokens: BUCKET_CAPACITY, lastRefilled: now };

    // Calculate how many tokens should be refilled since last refilled
    const msPassed = now - limit.lastRefilled;
    const tokensToRefill = Math.floor(msPassed / REFILL_RATE_MS);

    if (tokensToRefill > 0) {
      limit.tokens = Math.min(BUCKET_CAPACITY, limit.tokens + tokensToRefill);
      limit.lastRefilled = limit.lastRefilled + tokensToRefill * REFILL_RATE_MS;
    }

    if (limit.tokens <= 0) {
      // Out of tokens
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

    // Deduct 1 token
    limit.tokens -= 1;
    rateLimitMap.set(cleanIp, limit);
  }

  return NextResponse.next();
}

// Config matcher targeting authentication and document generation paths
export const config = {
  matcher: ['/api/auth', '/api/documents/:path*'],
};
