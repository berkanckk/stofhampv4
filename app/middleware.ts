import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { withAuth } from 'next-auth/middleware'
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

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req })
    const isAuth = !!token
    const isAuthPage = 
      req.nextUrl.pathname.startsWith('/login') || 
      req.nextUrl.pathname.startsWith('/register')
      
    const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
    
    // Admin olmayan kullanıcıları admin sayfalarından yönlendir
    if (isAdminPage) {
      if (!isAuth) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
      
      if (token?.userType !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL('/', req.url))
      }
      return null
    }

    const path = req.nextUrl.pathname

    // API routes that need rate limiting
    if (
      path.startsWith('/api/contact') ||
      path.startsWith('/api/auth/register')
    ) {
      try {
        // IP adresini headers'dan al
        const forwardedFor = req.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';
        
        if (ratelimit) {
          const { success } = await ratelimit.limit(ip)
          
          if (!success) {
            return new NextResponse("Too Many Requests", { status: 429 })
          }
        }
      } catch (error) {
        console.log('Rate limiting error:', error)
      }
    }

    // API rotaları doğrulama gerektiriyor
    if (
      path.startsWith('/api/profile') ||
      path.startsWith('/api/listings/user') ||
      path.startsWith('/api/listings/create') ||
      path.startsWith('/api/messages') ||
      path.startsWith('/api/favorites')
    ) {
      if (!token) {
        return new NextResponse('Unauthorized', { status: 401 })
      }
    }

    return NextResponse.next()
  }
)

// Middleware'in hangi path'lerde çalışacağını belirt
export const config = {
  matcher: [
    '/api/contact/:path*',
    '/api/auth/register/:path*',
    '/api/profile/:path*',
    '/api/listings/user/:path*',
    '/api/listings/create/:path*',
    '/api/messages/:path*',
    '/api/favorites/:path*',
    '/login',
    '/register',
    '/admin/:path*'
  ],
} 