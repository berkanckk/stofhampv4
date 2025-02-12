import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    // Okunmamış mesaj sayısını getir
    const count = await prisma.message.count({
      where: {
        receiverId: session.user.id,
        isRead: false,
      },
    })

    return Response.json({
      success: true,
      count,
    })
  } catch (error) {
    console.error('Get unread count error:', error)
    return Response.json(
      { success: false, message: 'Okunmamış mesaj sayısı alınamadı' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 