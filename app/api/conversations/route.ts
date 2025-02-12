import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../auth/[...nextauth]/options'

const prisma = new PrismaClient()

// Sohbet listesini getir
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        users: {
          some: {
            id: session.user.id
          }
        }
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          }
        },
        listing: {
          select: {
            id: true,
            title: true,
            images: true,
          }
        },
        messages: {
          select: {
            id: true,
            content: true,
            senderId: true,
            isRead: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return Response.json({ success: true, data: conversations })
  } catch (error) {
    console.error('Get conversations error:', error)
    return Response.json(
      { success: false, message: 'Sohbetler alınırken bir hata oluştu' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// Yeni sohbet başlat
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { receiverId, listingId, message } = body

    if (!receiverId || !message) {
      return Response.json(
        { success: false, message: 'Alıcı ID ve mesaj içeriği gerekli' },
        { status: 400 }
      )
    }

    // Önce yeni bir sohbet oluştur
    const conversation = await prisma.conversation.create({
      data: {
        users: {
          connect: [
            { id: session.user.id },
            { id: receiverId }
          ]
        },
        ...(listingId && { listing: { connect: { id: listingId } } }),
        messages: {
          create: {
            content: message,
            senderId: session.user.id,
            receiverId: receiverId
          }
        }
      },
      include: {
        users: true,
        messages: true
      }
    })

    return Response.json({
      success: true,
      message: 'Sohbet başlatıldı',
      data: conversation
    })
  } catch (error) {
    console.error('Create conversation error:', error)
    return Response.json(
      { success: false, message: 'Sohbet başlatılırken bir hata oluştu' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 