import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { conversationId } = await request.json()

    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    // Sohbetteki okunmamış mesajları okundu olarak işaretle
    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return Response.json({
      success: true,
      message: 'Mesajlar okundu olarak işaretlendi',
    })
  } catch (error) {
    console.error('Mark messages as read error:', error)
    return Response.json(
      { success: false, message: 'Mesajlar işaretlenirken bir hata oluştu' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 