import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prismadb'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/options'
import { globalCache } from '@/app/lib/cache'

const CACHE_KEY_PREFIX = 'unread_count_'
const CACHE_TTL = 30 * 1000 // 30 saniye

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { unreadCount: 0 },
        { status: 200 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { unreadCount: 0 },
        { status: 200 }
      )
    }

    // Cache anahtarını oluştur
    const cacheKey = `${CACHE_KEY_PREFIX}${user.id}`

    // Cache'den kontrol et
    let unreadCount = globalCache.get<number>(cacheKey)

    // Cache'de yoksa veya süresi dolmuşsa
    if (unreadCount === null) {
      unreadCount = await prisma.message.count({
        where: {
          receiverId: user.id,
          isRead: false
        }
      })

      // Cache'e kaydet (30 saniyelik TTL ile)
      globalCache.set(cacheKey, unreadCount, CACHE_TTL)
    }

    return NextResponse.json({ unreadCount })
    
  } catch (error) {
    console.error('Unread count error:', error)
    return NextResponse.json(
      { error: 'Okunmamış mesaj sayısı alınamadı', unreadCount: 0 },
      { status: 200 }
    )
  }
} 