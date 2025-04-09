import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prismadb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import { globalCache } from '@/app/lib/cache'

const CACHE_KEY_PREFIX = 'unread_count_'
const CACHE_TTL = 30 * 1000 // 30 saniye

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Okunmamış mesaj sayısını hesapla
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    })

    return NextResponse.json({
      success: true,
      count: unreadCount
    })
  } catch (error) {
    console.error('Error getting unread message count:', error)
    return NextResponse.json(
      { success: false, message: 'Okunmamış mesaj sayısı alınırken bir hata oluştu' },
      { status: 500 }
    )
  }
} 