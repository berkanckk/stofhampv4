import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Redis bağlantısını ve rate limiter'ı try-catch içinde oluştur
let ratelimit: Ratelimit;
try {
  const redis = Redis.fromEnv();
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'),
    analytics: true,
    prefix: 'api_ratelimit',
  });
} catch (error) {
  console.error('Redis connection error:', error);
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // API routes that need rate limiting
  if (path.startsWith('/api/')) {
    try {
      if (!ratelimit) {
        console.warn('Rate limiter not initialized, skipping rate limit check');
        return NextResponse.next();
      }

      // IP adresini headers'dan al
      const forwardedFor = request.headers.get('x-forwarded-for');
      const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';
      
      const { success, limit, reset, remaining } = await ratelimit.limit(
        `ratelimit_${ip}`
      )

      if (!success) {
        return new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        })
      }
    } catch (error) {
      console.error('Rate limit error:', error)
      // Rate limiting hatası durumunda isteği engelleme
      return NextResponse.next();
    }
  }

  // Protected API routes
  if (
    path.startsWith('/api/listings/create') ||
    path.startsWith('/api/messages') ||
    path.startsWith('/api/favorites')
  ) {
    const token = await getToken({ req: request })
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  return NextResponse.next()
}

// Middleware'in hangi path'lerde çalışacağını belirt
export const config = {
  matcher: [
    '/api/:path*',
    '/api/listings/create/:path*',
    '/api/messages/:path*',
    '/api/favorites/:path*'
  ],
} 