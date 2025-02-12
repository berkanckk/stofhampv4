import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'

const prisma = new PrismaClient()

// Mesajları getir
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await context.params

    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    const conversationId = resolvedParams.id

    // Kullanıcının bu sohbete erişim yetkisi var mı kontrol et
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        users: {
          some: {
            id: session.user.id
          }
        }
      }
    })

    if (!conversation) {
      return Response.json(
        { success: false, message: 'Sohbet bulunamadı' },
        { status: 404 }
      )
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return Response.json({ success: true, data: messages })
  } catch (error) {
    console.error('Get messages error:', error)
    return Response.json(
      { success: false, message: 'Mesajlar alınırken bir hata oluştu' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// Yeni mesaj gönder
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await context.params

    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    const conversationId = resolvedParams.id
    const body = await request.json()
    const { content } = body

    if (!content?.trim()) {
      return Response.json(
        { success: false, message: 'Mesaj içeriği gerekli' },
        { status: 400 }
      )
    }

    // Sohbeti ve diğer kullanıcıyı bul
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        users: {
          some: {
            id: session.user.id
          }
        }
      },
      include: {
        users: true
      }
    })

    if (!conversation) {
      return Response.json(
        { success: false, message: 'Sohbet bulunamadı' },
        { status: 404 }
      )
    }

    // Alıcıyı belirle (sohbetteki diğer kullanıcı)
    const receiver = conversation.users.find(user => user.id !== session.user.id)

    if (!receiver) {
      return Response.json(
        { success: false, message: 'Alıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Mesajı oluştur
    const message = await prisma.message.create({
      data: {
        content,
        senderId: session.user.id,
        receiverId: receiver.id,
        conversationId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        }
      }
    })

    // Sohbetin son güncelleme zamanını güncelle
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    return Response.json({
      success: true,
      message: 'Mesaj gönderildi',
      data: message
    })
  } catch (error) {
    console.error('Send message error:', error)
    return Response.json(
      { success: false, message: 'Mesaj gönderilirken bir hata oluştu' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}